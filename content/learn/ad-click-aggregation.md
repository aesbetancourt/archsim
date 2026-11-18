## The question

Try the [Ad Click Counter kata](/kata/ad-click-counter) before you read this page.

"Design a system that counts clicks on online ads. Advertisers see the clicks for each ad in near real time. The counts also decide how much each advertiser pays. Show the number of clicks for an ad in the last few minutes, and the most clicked ads."

The counts are money. An advertiser pays for each click, so a count that is too high is an overcharge, and a count that is too low is lost revenue. At the same time, the counts must be fresh, so advertisers can change a campaign within minutes. This case joins the two sides of [Batch and stream processing](/learn/batch-and-stream): fresh results from a stream, and correct results checked by a batch. Alex Xu and Sahn Lam describe this case in System Design Interview, volume 2, the chapter on ad click event aggregation. This page uses its own numbers.

## Questions to ask first

Functional questions:

- **Which queries?** Assume three: the clicks for one ad in the last M minutes; the top 100 ads by clicks in the last minute; and both, filtered by country, device, or another attribute.
- **What is in a click event?** Assume `ad_id`, `click_time`, `user_id`, `ip`, `country`, `device`.
- **Fraud and bots.** Do we remove fake clicks? Assume a separate team scores clicks for fraud. The aggregation can drop flagged clicks.
- **History.** How far back can advertisers query? Assume 2 years of aggregated data.

Non-functional questions:

- **Correctness.** Billing uses these counts. Every real click must count exactly once.
- **Freshness.** Assume the counts are at most a few minutes old.
- **Late and duplicate events.** Phones go offline and send clicks later. Clients retry. Ask how late an event can arrive and still count.
- **Scale and peaks.** How many clicks each day, and how large is a peak?

The questions that change the design most are correctness and late events. They decide the windows, the watermark, and the reconciliation.

## Estimates

Assume these answers: 600 million clicks each day, 1 million active ads, a peak of 5 times the average, 200 bytes for each raw event. Use 100,000 seconds for one day.

| Quantity                 | Arithmetic                              | Result                 |
| ------------------------ | --------------------------------------- | ---------------------- |
| Average click rate       | 600 million ÷ 100,000 s                 | 6,000 each second      |
| Peak click rate          | 6,000 × 5                               | 30,000 each second     |
| Raw data each day        | 600 million × 200 B                     | About 120 GB           |
| Raw data each month      | 120 GB × 30                             | About 3.6 TB           |
| Aggregated rows each day | 200,000 ads with clicks × 1,440 minutes | About 290 million rows |
| Aggregated size each day | 290 million × 50 B                      | About 15 GB            |

What the numbers say:

- 30,000 events each second is a stream problem, not a database problem. A database that receives an update for each click becomes a hot spot.
- Aggregated data is about 8 times smaller than raw data. Queries read the aggregated data.
- Raw data must still stay. It is the evidence for billing disputes, and the input to recompute after a bug.

## The first design

```diagram
{
  "nodes": [
    { "id": "logs", "label": "Ad servers\n(click logs)", "shape": "box", "col": 0, "row": 0.5 },
    { "id": "q1", "label": "Raw click\nqueue", "shape": "pipe", "col": 1, "row": 0.5 },
    { "id": "agg", "label": "Aggregation\nservice (stream)", "shape": "box", "col": 2, "row": 0.5 },
    { "id": "q2", "label": "Aggregated\nqueue", "shape": "pipe", "col": 3, "row": 0.5 },
    { "id": "raw", "label": "Raw data store", "shape": "store", "col": 1, "row": 1.8 },
    { "id": "aggdb", "label": "Aggregated\ndata store", "shape": "store", "col": 3, "row": 1.8 },
    { "id": "batch", "label": "Reconciliation\n(daily batch)", "shape": "box", "col": 2, "row": 1.8 },
    { "id": "query", "label": "Query service", "shape": "box", "col": 3, "row": 3 },
    { "id": "adv", "label": "Advertiser\ndashboard", "shape": "actor", "col": 2, "row": 3 }
  ],
  "edges": [
    { "from": "logs", "to": "q1", "async": true },
    { "from": "q1", "to": "agg" },
    { "from": "q1", "to": "raw", "label": "archive" },
    { "from": "agg", "to": "q2", "async": true },
    { "from": "q2", "to": "aggdb", "label": "write" },
    { "from": "raw", "to": "batch" },
    { "from": "batch", "to": "aggdb", "label": "compare, correct" },
    { "from": "query", "to": "aggdb" },
    { "from": "adv", "to": "query" }
  ]
}
```

- **Ad servers.** They log each click and send it to the raw click queue.
- **Raw click queue.** A partitioned log, such as Kafka, keyed by `ad_id`. It decouples the producers from the aggregation. See [Design a message queue](/learn/message-queue).
- **Raw data store.** A consumer copies each raw event to cheap, durable storage: object storage or a wide-column store.
- **Aggregation service.** A stream job that counts clicks for each ad and each minute, and computes the top ads.
- **Aggregated queue and store.** The results go to a second queue, then to a store that the queries read. The second queue is part of the exactly-once design (see below).
- **Reconciliation.** A daily batch job recomputes the counts from the raw data and compares them.
- **Query service.** It answers the dashboard queries from the aggregated store.

## Deep dives

### Raw data and aggregated data

Keep both. They serve different needs.

| Property    | Raw data                                  | Aggregated data                         |
| ----------- | ----------------------------------------- | --------------------------------------- |
| Content     | One row for each click                    | One row for each ad, minute, and filter |
| Size        | About 120 GB each day                     | About 15 GB each day                    |
| Use         | Recompute, audit, disputes, new questions | Dashboards and billing                  |
| Query speed | Slow: a scan of billions of rows          | Fast: a key lookup or a short range     |
| Retention   | Months in a hot store, then cold storage  | Years                                   |

An aggregated row looks like this: `ad_id=7731, minute=2026-11-18T10:02, country=ES, clicks=412`. A query for "the last 5 minutes" reads 5 rows and adds them up.

Both stores receive many writes and few complex queries. A wide-column store such as Cassandra fits the write rate. For filters on many attributes, an analytical column store such as ClickHouse, Druid, or Pinot fits better. See [Analytical data](/learn/analytical-data).

### The aggregation DAG

The aggregation service is a small graph of steps, in the style of MapReduce. Each step runs as many parallel nodes.

```diagram
{
  "nodes": [
    { "id": "q1", "label": "Raw click queue\n(partitions)", "shape": "pipe", "col": 0, "row": 1 },
    { "id": "m1", "label": "Map 1\n(parse, filter)", "shape": "box", "col": 1, "row": 0 },
    { "id": "m2", "label": "Map 2\n(parse, filter)", "shape": "box", "col": 1, "row": 2 },
    { "id": "a1", "label": "Aggregate 1\n(ads 0 to 499k)", "shape": "box", "col": 2, "row": 0 },
    { "id": "a2", "label": "Aggregate 2\n(ads 500k to 999k)", "shape": "box", "col": 2, "row": 2 },
    { "id": "r", "label": "Reduce\n(top 100)", "shape": "box", "col": 3, "row": 1 }
  ],
  "edges": [
    { "from": "q1", "to": "m1" },
    { "from": "q1", "to": "m2" },
    { "from": "m1", "to": "a1", "label": "by ad_id" },
    { "from": "m1", "to": "a2" },
    { "from": "m2", "to": "a1" },
    { "from": "m2", "to": "a2" },
    { "from": "a1", "to": "r", "label": "local top 100" },
    { "from": "a2", "to": "r" }
  ]
}
```

1. **Map.** Parse each event. Drop bad events and clicks flagged as fraud. Route each event by `ad_id`, so all clicks of one ad reach the same aggregate node.
2. **Aggregate.** Count clicks for each ad in each one-minute window. Keep a top 100 for the ads that this node owns.
3. **Reduce.** Merge the local top-100 lists into one global top 100. This is correct, because each ad is on exactly one aggregate node: the global top 100 must be inside the union of the local lists.

A stream engine such as Flink runs this graph, moves data between steps, and handles the state. You do not need to build the engine. You need to explain the graph.

### Time windows and watermarks

Count by **event time**, the time of the click, not by the time the service reads it. If the service is down for 5 minutes and then catches up, processing time puts 10 minutes of clicks into 1 minute. The advertiser sees a false spike. See [Time and windows](/learn/batch-and-stream#time-and-windows).

Two window types fit the queries:

| Query                             | Window                                                        |
| --------------------------------- | ------------------------------------------------------------- |
| Clicks for each ad in each minute | **Tumbling** window of 1 minute: fixed, with no overlap       |
| Top 100 ads in the last minute    | **Sliding** or hopping window: the last minute, updated often |

The hard question is when a window is complete. A click at 10:02:58 can arrive at 10:03:20, from a slow network. A **watermark** is the job's estimate: "all events before this time have arrived". A common rule is "the newest event time seen, minus 15 seconds". The window 10:02 closes when the watermark passes 10:03:00.

| Watermark delay | Freshness            | Events missed in the stream |
| --------------- | -------------------- | --------------------------- |
| 0 seconds       | Best                 | Many                        |
| 15 seconds      | Good                 | Few                         |
| 5 minutes       | Counts 5 minutes old | Almost none                 |

A longer delay gives more correct counts and older results. There is no delay that catches every event, because a phone can stay offline for a day.

### Late events

An event that arrives after its window closed is a **late event**. Three options:

1. **Drop it, and count the drops.** Simple. The batch reconciliation adds it back later. The stream count is a little low for some hours.
2. **Update the closed window.** The job keeps the window state for an extra period, for example 1 hour. A late event updates the count and the job emits a corrected row. The store must accept a new version of a row.
3. **Put it in a side output.** The late events go to their own stream. A separate job handles them.

For billing, option 2 with a limit, plus the daily batch, is a good mix. The dashboard is correct within the hour. The invoice is correct after the reconciliation. Say which number the advertiser sees, and when it becomes final.

### Exactly-once with offsets and the store

The service reads from a queue and writes results. It can crash between the two. Then a restart reads some events again, or skips some. Both are wrong for billing.

The steps to make each click count once:

1. **Deduplicate at the source.** The ad server gives each click an ID. A client retry sends the same ID. The map step drops IDs it has seen in a recent time window.
2. **Tie the offset to the result.** The aggregation node must record "results up to offset 9,120 are written" in the same step that writes the results. Three ways:
   - Write the results and the consumer offsets in one Kafka transaction to the aggregated queue. This is why the design has a second queue.
   - Store the last offset with the result in the same database transaction.
   - Store the offset only after the downstream store confirms the write, and make the write idempotent.
3. **Make writes idempotent.** Write the full count for a window: "ad 7731, minute 10:02, clicks 412". Writing it twice gives the same row. Do not write "add 1". A replay of an increment counts twice.

See [Exactly-once, or effectively-once](/learn/batch-and-stream#exactly-once-or-effectively-once) for the general techniques, and [Idempotency](/learn/distributed-transactions#idempotency).

### Hotspots

Routing by `ad_id` sends all clicks of one ad to one aggregate node. A big brand campaign can get 10% of all clicks: 3,000 each second at the peak, on one node. That node falls behind, and its lag delays the global top 100.

Options:

- **Split the hot key.** Add a random suffix from 0 to 9 to the key of a hot ad: `7731#0` to `7731#9`. Ten nodes count parts of it. One more step adds the ten parts. This is the same fix as for [hot keys](/learn/caching#hot-keys) in a cache.
- **Pre-aggregate in the map step.** Each map node counts locally for one second and sends one partial count for each ad, not each click. The aggregate node then gets a few messages each second for the hot ad, not thousands.
- **Detect hot ads.** Split only the ads that pass a rate limit, so normal ads keep one simple path.

Pre-aggregation in the map step is the simplest. It reduces the load on all ads, not only the hot ones.

### Reconciliation with batch

A stream job is complex, and it can be wrong: a bug, a late event, a crash during a deploy. Billing needs a second check.

Each night, a batch job reads the raw data for the day. It sorts the events by event time, removes duplicates by click ID, drops fraud, and computes the counts for each ad and minute. It then compares them with the stream results.

- **Small differences** come from late events. The batch result replaces the stream result for billing.
- **Large differences** are a bug. They raise an alert, and a person looks.

DDIA calls the raw log the system of record. All counts are derived data, and you can always compute them again from the log. See also [Analytical data](/learn/analytical-data) for how the daily results feed reports.

### Lambda or kappa

The [Lambda and kappa](/learn/batch-and-stream#lambda-and-kappa) section explains the two architectures in general. Here the choice is concrete.

| Option | How it works here                                                                       | Cost                                                   |
| ------ | --------------------------------------------------------------------------------------- | ------------------------------------------------------ |
| Lambda | A stream job for fresh counts, a batch job for correct counts, two code bases           | Two implementations of "count a click" that must agree |
| Kappa  | One stream job. To fix a bug or recompute, run the same job over the stored raw events. | The raw log must stay, and the job must replay fast    |

Choose kappa with one aggregation code. Keep the raw events in the queue for some days and in the raw store for longer. To recompute a month, start a second copy of the job that reads the raw store, and write to a new table. Switch the readers when it finishes.

The nightly reconciliation still exists. It is a check that compares results, not a second serving path. If it uses the same code as the stream job, it does not have the cost of lambda.

### Fault tolerance with snapshots

An aggregate node keeps state in memory: the counts of open windows, the local top 100, and the IDs for deduplication. If it crashes, the state is lost. Replaying the queue from the start is too slow.

The node takes a **snapshot** at fixed intervals, for example each minute. A snapshot holds the state and the queue offset that the state matches. It goes to durable storage. After a crash:

1. A new node loads the latest snapshot.
2. It moves its consumer to the offset in the snapshot.
3. It replays the events after that offset, to rebuild the state.
4. It continues with live events.

The replay reads at most one interval of events, so recovery takes seconds. Flink does this with checkpoints across all nodes of the graph at once, so the state of all steps matches one point in the stream.

### Filtering by attribute

"Clicks for ad 7731 from Spain on phones" needs counts by country and device. Two options:

- **Pre-aggregate the common filters.** Count by (`ad_id`, `minute`, `country`, `device`). Queries are fast. The number of rows grows with each attribute: 50 countries × 3 devices is up to 150 times more rows for an ad that is popular everywhere.
- **Use an analytical store.** Store finer counts in a column store and let it filter at query time. This is more flexible and needs a different store.

Start with pre-aggregation for 2 or 3 common attributes. Move to an analytical store when advertisers ask for many combinations.

## Trade-offs and alternatives

| Decision     | Choice here                            | When the choice changes                                         |
| ------------ | -------------------------------------- | --------------------------------------------------------------- |
| Processing   | Stream, with a daily batch check       | Batch only, if advertisers accept counts that are hours old     |
| Architecture | Kappa with replay from raw data        | Lambda, if the batch and stream tools must differ               |
| Time         | Event time with a 15-second watermark  | Processing time, for an internal chart where speed matters more |
| Late events  | Update windows for 1 hour, then batch  | Drop them, when the counts are not money                        |
| Write style  | Full count for each window, idempotent | Increments only with a deduplication store at the receiver      |
| Store        | Wide-column store for fixed queries    | An analytical column store for free filters                     |

## What interviewers probe

1. **"How do you make sure that each click counts exactly once?"**
   - A click ID for deduplication at the source.
   - Results and offsets committed together, and idempotent writes of full window counts.
2. **"The aggregation service crashes. What happens to the counts?"**
   - The new node loads the last snapshot and replays from its offset.
   - The commit design stops double counts during the replay.
3. **"A click arrives 10 minutes late."**
   - Event time and a watermark decide if it is late. Update the window within a limit, or leave it to the batch.
   - Say which count is final for billing, and when.
4. **"One ad gets 10% of all clicks."**
   - Pre-aggregate in the map step, or split the hot key with a suffix and add the parts.
5. **"Why keep the raw data, if you have the counts?"**
   - Reconciliation, disputes, recompute after a bug, and new questions nobody asked yet.
   - The raw log is the source of truth. The counts are derived.

## Go deeper

- **System Design Interview, volume 2** (Alex Xu, Sahn Lam), the chapter on ad click event aggregation: the DAG, windows, exactly-once, hotspots, and reconciliation.
- **Designing Data-Intensive Applications** (Martin Kleppmann), the part on stream processing: event time, windows, and fault tolerance in stream jobs.
- **DDIA**, the part on batch processing: why derived data from an immutable log is simple to recompute.

## Further reading

- [Questioning the Lambda Architecture](https://www.oreilly.com/radar/questioning-the-lambda-architecture/), the article by Jay Kreps that proposed kappa
- [Lambda architecture](https://en.wikipedia.org/wiki/Lambda_architecture) on Wikipedia
- [Click fraud](https://en.wikipedia.org/wiki/Click_fraud) on Wikipedia
- Related lessons: [Batch and stream processing](/learn/batch-and-stream), [Design a message queue](/learn/message-queue), [Analytical data](/learn/analytical-data)
