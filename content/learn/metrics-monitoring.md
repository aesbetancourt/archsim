## The question

Try the [Metrics Platform kata](/kata/metrics-platform) before you read this page.

"Design a metrics monitoring and alerting system for the company. It collects numbers such as processor load, request rate, and queue depth from all servers and services. Engineers see them on dashboards. The system pages the on-call engineer when a number crosses a limit."

This is the system behind the [Observability](/learn/observability) lesson. That lesson says what to measure and when to alert. This page designs the platform that stores the numbers and fires the alerts. The data has an unusual shape: a very high rate of small writes, few reads, and reads that ask mostly for the last hours. That shape decides the store. Alex Xu and Sahn Lam describe this case in System Design Interview, volume 2, the chapter on metrics monitoring and alerting. This page uses its own numbers.

## Questions to ask first

Functional questions:

- **Who uses it?** Assume internal engineers only. A product for external customers adds tenants, quotas, and billing.
- **Which data?** Operational metrics only: numbers over time. Logs and traces are separate systems. Ask to confirm this, because it removes a lot of scope.
- **Alert channels.** Assume email, a paging service, a chat app, and webhooks.
- **Retention.** How long must the data stay, and at what detail? Assume full detail for 7 days, and lower detail for 1 year.
- **Build or buy.** Ask if the company can use an existing product. The interviewer usually says "build", but name the products.

Non-functional questions:

- **Scale.** How many servers, and how many metrics on each?
- **Freshness.** How fast must a new point show on a dashboard and in an alert? Assume less than 1 minute.
- **Availability.** The monitoring system must stay up when the systems it watches fail. An outage of both at once is the worst case.
- **Accuracy.** Can the system lose some points? Assume a few lost points are acceptable. A lost alert is not.

## Estimates

Assume these answers: 20,000 hosts and containers, 300 time series on each, one sample every 10 seconds. Use 100,000 seconds for one day.

| Quantity                    | Arithmetic                           | Result       |
| --------------------------- | ------------------------------------ | ------------ |
| Active time series          | 20,000 × 300                         | 6 million    |
| Points each second          | 6 million ÷ 10 s                     | 600,000      |
| Raw size each day           | 600,000 × 16 B × 100,000 s           | About 960 GB |
| Compressed each day (rough) | 600,000 × 2 B × 100,000 s            | About 120 GB |
| Full detail for 7 days      | 120 GB × 7                           | About 840 GB |
| One year at 1-hour detail   | 6 million × 8,760 h × 2 B × 4 values | About 420 GB |

A raw point is a timestamp of 8 bytes and a value of 8 bytes. The compressed size of 2 bytes is a rough figure, based on the encoding below.

What the numbers say:

- 600,000 writes each second is a lot. A general relational database does not handle this rate on one server.
- With compression, the data for one year fits on a small cluster. Without compression, it is 8 times larger.
- Reads are few in comparison: some thousands of dashboard panels and alert rules, each one every 10 seconds to 1 minute.

## The first design

```diagram
{
  "nodes": [
    { "id": "src", "label": "Servers and\nservices", "shape": "box", "col": 0, "row": 0.5 },
    { "id": "col", "label": "Collectors", "shape": "box", "col": 1, "row": 0.5 },
    { "id": "q", "label": "Queue\n(partitioned)", "shape": "pipe", "col": 2, "row": 0.5 },
    { "id": "tsdb", "label": "Time-series DB", "shape": "store", "col": 3, "row": 0.5 },
    { "id": "query", "label": "Query service\nand cache", "shape": "box", "col": 3, "row": 1.8 },
    { "id": "alert", "label": "Alerting system", "shape": "box", "col": 2, "row": 1.8 },
    { "id": "viz", "label": "Dashboards", "shape": "actor", "col": 2, "row": 3 },
    { "id": "chan", "label": "Email, pager,\nchat, webhook", "shape": "external", "col": 1, "row": 1.8 }
  ],
  "edges": [
    { "from": "src", "to": "col", "label": "pull or push" },
    { "from": "col", "to": "q", "async": true },
    { "from": "q", "to": "tsdb", "label": "consumers write" },
    { "from": "query", "to": "tsdb", "label": "read" },
    { "from": "alert", "to": "query", "label": "evaluate rules" },
    { "from": "viz", "to": "query" },
    { "from": "alert", "to": "chan", "label": "notify" }
  ]
}
```

- **Metrics sources.** Servers, containers, databases, and application code. Each one exposes numbers.
- **Collectors.** They get the points from the sources, by pull or by push, and send them on.
- **Queue.** It absorbs bursts and protects the database from the collectors. It also lets other consumers read the same stream.
- **Time-series database.** It stores the points and answers queries by series and time range.
- **Query service.** It turns a query into reads on the database, combines the results, and caches them.
- **Alerting system.** It runs rules against the query service and sends notifications.
- **Dashboards.** A visualization tool reads the query service.

## Deep dives

### The data model of a time series

A **time series** is a list of points, each a timestamp and a number, under a name and a set of labels. For example:

```text
http_requests_total{service="checkout", region="eu-west", status="500"}
  1700000000  1532
  1700000010  1541
  1700000020  1560
```

- The **metric name** says what is measured.
- The **labels** (also called tags) say where. Each unique combination of name and labels is one series.
- The **points** are the data. A point is always appended at the end. Old points never change.

The access pattern:

| Property    | Value                                                                                                  |
| ----------- | ------------------------------------------------------------------------------------------------------ |
| Writes      | Very many, small, constant, append only                                                                |
| Reads       | Few, bursty: a dashboard opens, an incident starts                                                     |
| Read range  | Mostly the last hours. The Gorilla paper from Facebook reports that most queries ask for the last day. |
| Query shape | One metric, a filter on labels, a time range, a function (rate, average, percentile)                   |

**Cardinality** is the number of distinct series. It is the main danger in this data model. A label with a few values, such as `region`, is fine. A label with a user ID or a request ID makes millions of new series. Each series costs memory in the index. One team that adds `user_id` as a label can bring down the database. Set a limit of series for each team, and reject labels with unbounded values.

### Pull or push collection

| Concern                | Pull (the collector scrapes)                | Push (the source sends)                    |
| ---------------------- | ------------------------------------------- | ------------------------------------------ |
| Who knows the targets  | The collector, through service discovery    | Each source knows the collector address    |
| A source that is down  | Detected at once: the scrape fails          | Silent: no data, and no clear signal       |
| Short-lived jobs       | Missed, if the job ends between two scrapes | Natural: the job sends before it exits     |
| Firewalls and networks | The collector must reach each source        | The source must reach the collector        |
| Debugging              | Open the metrics endpoint in a browser      | Harder: the data is in flight              |
| Load on the collector  | The collector controls the rate             | A burst of sources can flood the collector |

**Pull.** Each source exposes an HTTP endpoint such as `/metrics`. The collectors find the sources through a service discovery system, such as a registry or the container platform. Each collector owns a part of the sources. Assign sources to collectors with [consistent hashing](/learn/consistent-hashing), so a collector failure moves only its own share. Prometheus works this way.

**Push.** An agent on each host collects the numbers, adds them up for a short time, and sends them to a collector cluster behind a load balancer. The collector cluster must autoscale, or it loses data under a burst. Many cloud and commercial agents work this way.

Both work at large scale. Pull is simpler to reason about and finds dead sources. Push fits short jobs and sources behind a firewall. Many systems use pull and add a push gateway for short jobs.

### The collector and a queue

At 600,000 points each second, the time-series database can be slow or down for some minutes. Without a buffer, the collectors drop data. Put a [message queue](/learn/message-queue) between them.

- **Partition by metric name**, or by a hash of the series. All points of one series then go to one partition, in order. A consumer can write them as one block.
- **Consumers** read the partitions and write to the database in batches.
- **Other consumers** can read the same stream: a stream job that computes rollups, or a check for anomalies.

The queue adds operations work and some latency. Some large systems skip it and make the database itself accept and buffer writes, with an in-memory write layer. Say both options, and choose the queue when the database must be protected from bursts.

### The time-series database, and why

A relational database can store `(series_id, timestamp, value)` rows. It fails at this scale for three reasons:

1. **The write rate.** 600,000 row inserts each second, each with index updates, is far past one relational server.
2. **The queries.** "Rate of requests over 5 minutes, grouped by region" is a hard query in SQL over billions of rows.
3. **The space.** A row with a header, an index entry, and 16 bytes of data costs many times the compressed point.

A **time-series database** is built for this pattern. Examples are Prometheus, InfluxDB, TimescaleDB, and M3. Most share these ideas:

- **Write to memory first.** New points go to an in-memory block for each series and to a write-ahead log for safety. Full blocks are written to disk as immutable, compressed files. This is close to an [LSM-tree](/learn/storage-engines#sstables-and-lsm-trees).
- **Partition by time.** Each block covers a time range, for example 2 hours. A query for the last hour reads only the newest blocks. Retention deletes whole old blocks, which is cheap.
- **An inverted index on labels.** It maps each label value to the list of series that have it. The query `service="checkout" AND status="500"` intersects two lists.
- **Keep recent data hot.** Recent blocks are in memory or on fast disk. Old blocks go to cheaper storage.

The read pattern supports this design. Most reads ask for recent data, so the system keeps recent data in the fastest tier.

### Encoding and compression of points

Points compress very well, because neighbors are similar. The Gorilla paper from Facebook made two ideas well known:

- **Timestamps: delta-of-delta.** Points arrive every 10 seconds. Store the first timestamp in full. For the next, store the delta: 10. For each one after that, store the change in the delta: usually 0. A 0 takes one bit.
- **Values: XOR with the previous value.** A metric often has the same value as the last point, or a close value. The XOR of two equal floating-point numbers is 0, which takes one bit. Close values share most bits, so the XOR has many zeros.

The result is often more than 10 times smaller than 16 bytes for each point. Compression also means more points fit in memory, which makes recent reads fast. You do not need the bit-level details in an interview. Say the idea: store differences, not values.

### Downsampling and retention

Detail of 10 seconds for one year is rarely useful. Nobody looks at a 10-second spike from last March. **Downsampling** replaces many points with one summary point for a longer interval.

| Age               | Detail   | Points each series each day |
| ----------------- | -------- | --------------------------- |
| 0 to 7 days       | 10 s     | 8,640                       |
| 7 to 30 days      | 1 minute | 1,440                       |
| 30 days to 1 year | 1 hour   | 24                          |
| Older than 1 year | Deleted  | 0                           |

A summary point keeps more than one number: the minimum, the maximum, the sum, and the count. With these four, you can still compute the average and see the peak. An average alone hides the spike that caused the incident. A percentile cannot be rebuilt from averages. Keep a histogram if you need latency percentiles over long ranges.

A background job runs the downsampling, or a stream job computes it as the data arrives. See [Batch and stream processing](/learn/batch-and-stream).

### The query service and its cache

The query service sits between users and the database. It parses the query language, finds the series in the label index, reads the blocks, and computes the functions. Prometheus has PromQL, and other products have their own languages. A query service also hides the store, so the team can change the database later.

A dashboard of 20 panels that refreshes every 10 seconds sends 2 queries each second. When 300 engineers open the same incident dashboard, the same queries repeat many times. A **query cache** helps:

- Cache results by query and time range, with the range aligned to the step of the chart.
- For a rolling range, such as "the last 6 hours", reuse the cached part and read only the newest minutes.
- Keep the cache time short for recent data. Points in the last minute can still arrive late.

### The alerting system

```diagram
{
  "nodes": [
    { "id": "rules", "label": "Rule config\n(files in Git)", "shape": "store", "col": 0, "row": 0 },
    { "id": "eval", "label": "Rule evaluators", "shape": "box", "col": 1, "row": 0 },
    { "id": "query", "label": "Query service", "shape": "box", "col": 1, "row": 1.2 },
    { "id": "state", "label": "Alert state store", "shape": "store", "col": 2, "row": 1.2 },
    { "id": "mgr", "label": "Alert manager\n(dedup, group,\nroute, silence)", "shape": "box", "col": 2, "row": 0 },
    { "id": "q", "label": "Notification\nqueue", "shape": "pipe", "col": 3, "row": 0 },
    { "id": "chan", "label": "Pager, email,\nchat, webhook", "shape": "external", "col": 3, "row": 1.2 }
  ],
  "edges": [
    { "from": "rules", "to": "eval", "label": "load" },
    { "from": "eval", "to": "query", "label": "each 30 s" },
    { "from": "eval", "to": "mgr", "label": "firing" },
    { "from": "mgr", "to": "state" },
    { "from": "mgr", "to": "q", "async": true },
    { "from": "q", "to": "chan", "label": "workers send" }
  ]
}
```

**Rules.** An engineer writes each rule as a file, kept in version control and reviewed like code:

```yaml
- alert: CheckoutErrorRateHigh
  expr: rate(http_requests_total{service="checkout", status="500"}[5m]) > 5
  for: 10m
  labels: { severity: page, team: payments }
```

The `for` field means "true for 10 minutes". It stops one bad point from paging a person.

**Evaluation.** Evaluators load the rules and run each one against the query service at a fixed interval. Shard the rules across evaluators, so each rule runs on one evaluator. Each alert moves through states: inactive, pending (the condition is true, but not yet for the full time), firing, and resolved.

**Deduplication and grouping.** One database failure can make 200 services fire their own alert in the same minute. The alert manager:

1. **Deduplicates.** The same alert from two evaluators, or the same alert again in the next interval, becomes one alert.
2. **Groups.** Alerts with the same team and the same cause go out as one message: "40 services in eu-west have high error rates".
3. **Inhibits and silences.** A firing alert for "region down" holds back the alerts that it explains. A person can silence an alert during planned work.
4. **Routes.** The labels select the team and the channel. `severity=page` goes to the pager, and `severity=ticket` goes to a ticket queue.

**Notification channels.** The manager puts each notification on a queue. Workers for each channel send it, with retries. A paging provider that is down must not block email. This is the same design as the [notification system](/learn/notification-system).

**Watch the watcher.** If the alerting system is down, nobody gets paged. Run it in more than one zone. Add a "dead man's switch": an alert that always fires and goes to an external service. If the external service stops getting it, it pages the team that owns monitoring.

### Visualization

Do not build this part. A mature dashboard tool such as Grafana reads the query service, draws charts, and lets teams build their own dashboards. Store dashboards as files in version control too, so a broken dashboard can roll back.

## Trade-offs and alternatives

| Decision       | Choice here                            | When the choice changes                                                |
| -------------- | -------------------------------------- | ---------------------------------------------------------------------- |
| Collection     | Pull, with a gateway for short jobs    | Push when sources are behind firewalls or most jobs are short          |
| Buffer         | A queue before the database            | No queue when the database has its own write buffer and handles bursts |
| Store          | A time-series database                 | A column store for long-range analysis across all series               |
| Retention      | 10 s for 7 days, then rollups          | Longer full detail when capacity planning needs it                     |
| Alert channels | Through a notification queue           | Direct calls for a small system with one channel                       |
| Build or buy   | Build the pipeline, buy the dashboards | Buy all of it when the scale is small and the team is small            |

A note on build or buy: a hosted product costs money for each series. At 6 million series, the bill is large. At 50,000 series, buying is almost always cheaper than a team to run a platform. Say the break-even point exists, and that it moves with the team size.

## What interviewers probe

1. **"Why not store metrics in a relational database?"**
   - The write rate, the query shape, and the space. A time-series database appends to blocks by time and compresses differences.
   - Most reads are recent, so recent blocks stay hot.
2. **"A team adds `user_id` as a label. What happens?"**
   - Cardinality explodes. Each user becomes a series, and the label index runs out of memory.
   - Set series limits for each team and reject unbounded labels at the collector.
3. **"Pull or push?"**
   - Pull finds dead sources and is simple to debug. Push fits short jobs and closed networks.
   - Either works at scale. Say which, and say what you do for the other case.
4. **"The database is down for 5 minutes. What is lost?"**
   - Nothing, if the queue holds the points. The consumers catch up later.
   - Alerts for those 5 minutes are late. Say that the alerting system needs its own path to fresh data, or accept the delay.
5. **"200 alerts fire at once. What does the on-call engineer see?"**
   - Deduplication, grouping by team and cause, and inhibition by a higher-level alert.
   - One page with a summary, not 200 pages.

## Go deeper

- **System Design Interview, volume 2** (Alex Xu, Sahn Lam), the chapter on metrics monitoring and alerting: the data model, pull and push, the queue, and the alert flow.
- **Site Reliability Engineering** (Beyer and others), the part on monitoring distributed systems: what to alert on, and why alerts must need action.
- **Designing Data-Intensive Applications** (Martin Kleppmann), the part on storage and retrieval: LSM-trees and column storage, the base of most time-series stores.

## Further reading

- [Gorilla: A Fast, Scalable, In-Memory Time Series Database](https://www.vldb.org/pvldb/vol8/p1816-teller.pdf), the Facebook paper on compression of points
- [Prometheus overview](https://prometheus.io/docs/introduction/overview/), the project documentation
- [Monitoring Distributed Systems](https://sre.google/sre-book/monitoring-distributed-systems/), from the SRE book
- Related lessons: [Observability](/learn/observability), [Storage engines](/learn/storage-engines), [Design a message queue](/learn/message-queue)
