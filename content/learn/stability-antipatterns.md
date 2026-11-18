## Why failures spread

A large outage rarely starts large. It starts with one small fault: a slow disk, a full connection pool, a query that returns too many rows. Then the fault moves. It goes from one server to the next, and from one layer to the layer above, until users see a dead system.

Michael Nygard studied many such outages in Release It!. He found that the same few patterns turn a small fault into an outage. He calls them the stability antipatterns. For each one, there is a stability pattern that stops it.

An architect needs this vocabulary for two reasons:

- In a design review, you can point at an arrow and name the way it will fail.
- In an interview, "what happens when this part is slow?" is the most common follow-up question. The antipatterns give you a structured answer.

This page is the failure side. The [Design for failure](/learn/resilience) lesson is the protection side, with the standard tools in detail.

## Fault, error, failure

Nygard separates three words. The separation tells you where you can stop the damage.

| Word    | Meaning                                             | Example                                  |
| ------- | --------------------------------------------------- | ---------------------------------------- |
| Fault   | An incorrect state inside one part                  | A connection pool has no free connection |
| Error   | Behavior that is visibly wrong                      | Requests wait for 30 seconds, then fail  |
| Failure | The system does not respond, or does not do its job | Customers cannot place orders            |

A fault becomes an error, and the error becomes a failure. You cannot prevent every fault. You can design the system so that a fault stays a fault. Kleppmann makes the same point in DDIA, the part on reliability: a fault-tolerant system stops faults from becoming failures.

## Cracks that propagate

Nygard compares the spread of a fault to a crack in a material. A crack moves along the paths of least resistance. In software, these paths are:

- **Synchronous calls.** A caller waits for an answer. If the answer is slow, the caller is slow.
- **Shared resources.** A thread pool, a connection pool, or a database that many functions use together. When one function uses all of it, the others stop too.
- **Shared state and shared timing.** Many servers that do the same thing at the same moment, such as a cache refresh or a nightly job.

A crack stops where the design puts a barrier. Each barrier makes the fault visible quickly and keeps it in one place. These barriers are the stability patterns: timeouts, circuit breakers, bulkheads, and asynchronous decoupling.

```diagram
{
  "nodes": [
    { "id": "users", "label": "Users", "shape": "person", "col": 0, "row": 1 },
    { "id": "web", "label": "Web tier\n(threads wait)", "shape": "box", "col": 1, "row": 1 },
    { "id": "svc", "label": "Order service\n(pool full)", "shape": "box", "col": 2, "row": 1 },
    { "id": "dep", "label": "Payment API\n(slow: 20 s)", "shape": "external", "col": 3, "row": 1 },
    { "id": "other", "label": "Stock lookup\n(no thread free)", "shape": "box", "col": 2, "row": 2 }
  ],
  "edges": [
    { "from": "users", "to": "web", "label": "retry, retry" },
    { "from": "web", "to": "svc", "label": "waits" },
    { "from": "svc", "to": "dep", "label": "waits, no timeout" },
    { "from": "web", "to": "other", "label": "also blocked" }
  ]
}
```

In the diagram, the fault is at the right. The failure appears at the left, two layers away. Users press "retry", and their retries add load to a system that is already in trouble.

## The twelve antipatterns

Release It! names twelve antipatterns. Some cause a fault, and some carry it.

### Integration points

An integration point is any connection to another process: an HTTP call, a database socket, a message broker, a file share. Nygard calls integration points the number one cause of stability problems. Each one can fail in many ways. The other side can refuse the connection, accept it and never answer, answer slowly, or send a response that you cannot parse. The network can drop packets without an error. A firewall can silently drop an idle connection, so the next request hangs.

Treat every integration point as a part that will fail. Put a timeout on every call, and decide what the caller does when the call fails.

### Chain reactions

A chain reaction is a horizontal spread. Several identical servers share the load. One server fails, so its load goes to the others. Each of them now has more load, so the next one fails sooner. A memory leak or a bug that a rare request triggers often causes this, because all servers have the same bug.

### Cascading failures

A cascading failure is a vertical spread. A fault in one layer causes a fault in the layer that calls it. The diagram above shows a cascade. The usual mechanism is a caller that waits with no limit, so the callee's slowness uses up the caller's threads.

### Users

Users are a load that you do not control. Nygard lists several kinds of problem: users who keep heavy sessions in memory, users whose requests are expensive (for example, a large search or a large basket), and users who are not people at all, such as scrapers and bots. A few expensive users can use more capacity than many normal ones. Design for the worst user, not the average user.

### Blocked threads

A thread waits for something that does not come: a lock, a connection from a pool, a response with no timeout. The process is alive and accepts requests, but it does no work. Health checks that only ask "is the process running?" do not see this. Blocked threads are the most common way that an integration point causes a failure.

### Self-denial attacks

The organization attacks its own system. Marketing sends a coupon to two million customers at 10:00, and they all arrive in the same minute. The coupon goes viral, and the traffic is ten times the forecast. The fix starts with communication: the people who plan a campaign must tell the people who run the system.

### Scaling effects

A design that works with two servers can fail with twenty. Point-to-point connections grow with the square of the number of servers. A shared resource that each server uses a little, such as a lock service or a shared database, becomes the bottleneck when the number of servers grows. Ask of each shared part: what happens at ten times the servers?

### Unbalanced capacities

Two tiers have very different capacity. A front tier can scale out to thousands of threads, but the back end can serve only a few hundred requests at a time. When traffic is high, the front tier sends more work than the back end can take. The back end then fails for all callers, not only for the extra ones. Autoscaling of the front tier makes this worse, because it adds more callers.

### Dogpile

A dogpile occurs when many servers do the same thing at the same moment. Examples: all servers start after a deploy and fill their caches together; a cron job runs at midnight on every server; many cache entries expire at the same second. The load in that moment is much higher than the normal load. The [caching lesson](/learn/caching) shows the cache version of this problem, also called a stampede.

### Force multiplier

Automation does what you tell it, fast and at scale. A wrong input to an automated tool becomes a large outage. An autoscaler that reads a bad metric can remove most servers. A configuration tool can push a bad setting to every data center in a few seconds. Nygard's counter is a **governor**: a limit on how fast and how much the automation can change. A governor also asks for a person when an action is unusual.

### Slow responses

A slow response is worse than no response. A refused connection fails in milliseconds, and the caller can do something else. A slow response holds the caller's thread and memory. Slow responses also cause retries from users, which add more load. If a part knows that it cannot answer in time, it must fail fast.

### Unbounded result sets

A query has no upper limit. In test, it returns 50 rows. In production, after two years of data, it returns 2 million rows, and the server runs out of memory. The same applies to a message consumer that reads "all waiting messages" and to an API that returns "all orders of a customer". Put a limit on every query and every response, and use [pagination](/learn/api-design) for large lists.

## What you see, and what stops it

| Antipattern           | What you see                                                | What stops it                                                                                             |
| --------------------- | ----------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| Integration points    | Calls that hang, odd errors from another system             | [Timeouts, circuit breakers](/learn/resilience#the-standard-tools), decoupling middleware, a test harness |
| Chain reactions       | Identical servers fail one after another                    | Bulkheads, fix the leak, keep spare capacity                                                              |
| Cascading failures    | A healthy layer fails after a layer below it fails          | Timeouts, circuit breakers, [fallbacks](/learn/resilience#degrade-do-not-fail)                            |
| Users                 | A few sessions or requests use much of the capacity         | Limits on session size and request cost, [rate limits](/learn/rate-limiter), bot defense                  |
| Blocked threads       | Process is up, but throughput is zero                       | Timeouts on every wait, bulkheads, proven libraries                                                       |
| Self-denial attacks   | Traffic spike at the exact time of a campaign               | Talk to marketing, a waiting room, static pages for the offer                                             |
| Scaling effects       | A shared part slows down as servers are added               | Fewer shared parts, partitioning, [scale tests](/learn/scalability)                                       |
| Unbalanced capacities | The back end fails when the front end scales out            | Size the pools from back-end capacity, back pressure, shed load                                           |
| Dogpile               | Load spikes at deploy time, on the hour, or at cache expiry | Random jitter, staggered starts, request coalescing                                                       |
| Force multiplier      | Automation removes or changes a large part of the fleet     | A governor: rate limits on automated change, a person for large actions                                   |
| Slow responses        | Latency climbs, then users retry, then errors climb         | Fail fast, timeouts, [one level of retries](/learn/resilience#rules-for-retries)                          |
| Unbounded result sets | Memory or response time grows with data age                 | Limits on every query, pagination, streaming                                                              |

## The stability patterns

The resilience lesson explains timeouts, retries, circuit breakers, bulkheads, and fallbacks. Release It! adds some patterns that are less well known. Interviewers like them because they show depth.

| Pattern               | Idea                                                                                                 |
| --------------------- | ---------------------------------------------------------------------------------------------------- |
| Steady state          | Each process cleans up after itself: rotate logs, purge old data, limit caches. No disk fills up.    |
| Fail fast             | Check the resources first. If the request cannot succeed, refuse it before you start the work.       |
| Let it crash          | Restart a broken component instead of repairing its state. It needs fast restarts and a supervisor.  |
| Handshaking           | The server tells callers when it can take more work. A health check that reports "busy" is one form. |
| Test harness          | A fake remote system that misbehaves on purpose: it hangs, sends junk, or refuses connections.       |
| Decoupling middleware | A [queue or event stream](/learn/messaging) between two parts, so that neither waits for the other.  |
| Shed load             | Refuse extra requests at the edge, with a fast "busy" answer, so the accepted ones still succeed.    |
| Create back pressure  | A full queue blocks or refuses the producer, so that work does not pile up without limit.            |
| Governor              | Slow down automation, and ask for a person before a large or unusual change.                         |

Two rules connect these patterns:

1. Every wait has a limit. This includes waits for locks, pool connections, and responses.
2. Every resource has an owner and a size. Nothing grows without limit: not a queue, not a cache, not a log, not a result set.

## Case story: the on-sale at 10:00

A ticket seller opens sales for a popular tour at 10:00. The design has a web tier that autoscales, and one inventory database that holds the seats.

At 09:58, the marketing team sends a reminder email to 1.5 million fans. This is a self-denial attack: the email itself makes the peak sharper. At 10:00, the web tier scales from 40 to 300 servers. Each server has a pool of 20 database connections. That makes 6,000 possible connections, but the database accepts about 800. This is an unbalanced capacity.

The database refuses new connections. The web servers wait for pool connections, with a 60-second limit. Threads block, and the web servers stop. Fans press "refresh", which adds load. The load balancer sees slow servers and removes them, so the remaining servers get more load. That is a chain reaction. The sale stops for 25 minutes.

The second design changes four things:

1. A waiting room at the edge admits buyers at the rate that the inventory can serve.
2. The connection pools are sized from the database limit, not from the number of web servers.
3. A pool wait has a limit of 200 ms. After that, the server answers "busy, try again in a moment", which is fail fast.
4. The reminder email goes out in batches over an hour, and the release team knows the plan.

The [Front Row kata](/kata/front-row) is this problem.

## Case story: the address check

A parcel service prints shipping labels. Before it prints, it calls an external address validation API. The same service also answers the public tracking page. Both functions share one pool of 200 worker threads.

One afternoon, the address API becomes slow. It still answers, but after 15 seconds instead of 100 ms. The HTTP client has no timeout set. In two minutes, all 200 threads wait for the address API. The tracking page now fails too, although it never calls the address API. That is a cascading failure through a shared resource.

The client code also retries three times. Each retry adds a request to an API that is already slow. The provider's rate limit then blocks the parcel service completely.

The fix has three parts:

1. A timeout of 2 seconds on the address call, and one retry with backoff at most.
2. A circuit breaker. After 10 failures in a minute, the service stops calling the address API for 30 seconds.
3. A bulkhead. Label printing gets its own pool of 40 threads. The tracking page keeps its own pool.

With the circuit open, the label flow uses a fallback: it accepts the address, prints the label, and marks the parcel for a manual check later. The business accepts a few wrong addresses more easily than a stopped warehouse.

## Trade-offs

The stability patterns are not free.

- **Timeouts are hard to set.** Too short, and you fail requests that would succeed. Too long, and threads block. Set them from measured latency: a little above the normal high percentile, for example the 99th or the 99.9th. See [Design for failure](/learn/resilience#the-standard-tools).
- **Circuit breakers hide faults.** An open circuit turns a slow dependency into fast errors. Your monitoring must show the state of each circuit, or the team will not know why a function is missing.
- **Bulkheads waste capacity.** A separate pool for each dependency means some threads are idle while another pool is full. You trade efficiency for isolation.
- **Shedding load means refusing customers.** Refuse in a planned way, at the edge, and with a clear message. The other choice is that the system refuses everyone in an unplanned way.
- **Fallbacks need testing.** A fallback path that runs once a year often has a bug. Test it on purpose, as the resilience lesson says.

## In a kata

Use this page as a checklist after you draw your design:

1. For each arrow, name the integration point and its timeout.
2. Find each shared resource: pools, databases, caches, brokers. Ask which functions share it.
3. Compare the capacity of each tier with the tier that calls it.
4. Find the events that make everyone arrive at once: a sale, a deadline, a deploy, midnight.
5. Find each query or response that can grow with the data, and put a limit on it.
6. Find automation that can change many servers, and give it a governor.

Write the top two risks in the rationale, with the pattern that stops each one. The [Front Row](/kata/front-row) and [Tow Line](/kata/tow-line) katas both have a sudden peak. The [Notification Service](/kata/notification-service) interview kata has a slow external provider.

## Interview questions

**A dependency of your service becomes slow, not down. What happens, and how do you protect your service?**

- Slow is worse than down, because a slow call holds a thread and memory.
- Without a timeout, the thread pool fills and the service stops for all functions.
- Protect with a timeout from measured latency, a circuit breaker, and a separate pool for that dependency.
- Name the fallback, and what the user sees when the circuit is open.

**Your front tier autoscales. Your database does not. What can go wrong?**

- Unbalanced capacities: more front servers means more connections and more queries than the database can take.
- Size the connection pools from the database limit, divided by the maximum number of servers.
- Add back pressure or load shedding, so that extra requests fail fast at the edge.
- Consider a queue, or a waiting room for a known peak.

**What is a retry storm, and how do you prevent it?**

- Retries multiply the load on a part that is already failing. Retries at several layers multiply again.
- Retry at one layer only, with exponential backoff and random jitter, and a maximum number of attempts.
- Use a retry budget or a circuit breaker, so that retries stop when the failure rate is high.

**An automated tool removed most of your servers. How do you design automation so that this cannot happen again?**

- This is a force multiplier: automation applies a wrong decision at scale and at speed.
- Add a governor: a limit on how much capacity the tool can remove in a period.
- Make the tool refuse an action that is much larger than usual, and ask a person.
- Roll out configuration changes in stages, one zone or region at a time.

## Go deeper

- **Release It!** (Michael Nygard), the parts on stability antipatterns and stability patterns: the full catalog, with real outage stories and the reasons behind each pattern.
- **Site Reliability Engineering** (Beyer and others), the parts on handling overload and on cascading failures: load shedding, client-side throttling, and how Google tests these limits.
- **Designing Data-Intensive Applications** (Martin Kleppmann), the part on reliability and the part on the trouble with distributed systems: faults versus failures, and why the network makes a slow answer look like no answer.
- **Building Microservices** (Sam Newman), the part on resiliency: how these patterns apply to many small services, and where a service mesh helps.

## Further reading

- [Addressing cascading failures](https://sre.google/sre-book/addressing-cascading-failures/), from the Google SRE book
- [Circuit breaker](https://martinfowler.com/bliki/CircuitBreaker.html), by Martin Fowler
- [Cascading failure](https://en.wikipedia.org/wiki/Cascading_failure) and [Thundering herd problem](https://en.wikipedia.org/wiki/Thundering_herd_problem) on Wikipedia
- See also [Observability and service levels](/learn/observability) and [On-call, incidents, and postmortems](/learn/incident-response)
