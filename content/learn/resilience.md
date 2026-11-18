## The starting point

In a system with many parts, something is always broken. A resilient design does not try to prevent each failure. It limits how far a failure spreads, and it recovers without a person.

For each arrow in your diagram, ask: what occurs if the box at the end is slow, or gives no answer? "Slow" is worse than "down". A part that is down fails fast. A part that is slow holds its callers until they have no capacity left, and the failure moves backward through the system.

Nygard calls each such arrow an **integration point**: a place where one part depends on another across a network (Release It!, the part on stability antipatterns). Each integration point is a risk to stability. The common ways that systems fail have names: chain reactions, cascading failures, blocked threads, and unbounded result sets. See [Stability antipatterns](/learn/stability-antipatterns) for these. This page is about the patterns that protect against them.

### Four meanings of resilience

Newman separates four ideas that people call "resilience", from the work of David Woods (Building Microservices, the part on resiliency):

| Idea                   | Meaning                               | Example in a parcel service                            |
| ---------------------- | ------------------------------------- | ------------------------------------------------------ |
| Robustness             | Absorb a failure that you expected    | A second database copy takes over                      |
| Rebound                | Recover after a failure               | Restore the tracking data from a backup                |
| Graceful extensibility | Handle a situation you did not expect | People with authority to change plans during an outage |
| Sustained adaptability | Keep learning and changing            | A review after each incident that changes the design   |

Most of this page is robustness. The other three are about people and process as much as code. See [Incident response](/learn/incident-response).

## The standard tools

| Tool               | What it does                                                             | Protects against                                     |
| ------------------ | ------------------------------------------------------------------------ | ---------------------------------------------------- |
| Timeout            | Stops waiting after a fixed time                                         | A slow part that holds its callers                   |
| Retry with backoff | Tries again, with a longer wait each time                                | Short faults                                         |
| Circuit breaker    | After several failures, stops calling for a period and fails immediately | Repeated calls to a part that is down                |
| Bulkhead           | Gives each dependency its own limited share of resources                 | One slow dependency that uses all capacity           |
| Rate limit         | Refuses requests above a limit                                           | Overload from one caller                             |
| Queue              | Holds work until a worker is ready                                       | Bursts, and a receiver that is down for a short time |
| Fallback           | Gives a simpler answer when the full one is not available                | A dependency that is not essential                   |
| Redundancy         | Runs several copies in separate places                                   | Loss of a machine or a data center                   |

## The stability patterns

Nygard collects a set of **stability patterns** (Release It!, the part on stability patterns). Each one breaks a path along which a failure spreads. Examples here use a ticket seller that calls a seat service, a card provider, and an email service.

| Pattern               | The idea, in one sentence                                                |
| --------------------- | ------------------------------------------------------------------------ |
| Timeouts              | Never wait without a limit on any call across a network                  |
| Circuit breaker       | Stop calling a part that keeps failing, and fail at once instead         |
| Bulkheads             | Split resources, so one failure cannot use all of them                   |
| Steady state          | Make the system run for months without a person who cleans up            |
| Fail fast             | If a request will fail, refuse it before you do any work                 |
| Let it crash          | Restart a small part to a clean state, instead of a repair in place      |
| Handshaking           | Let a server tell its callers that it cannot take more work now          |
| Test harnesses        | Test each integration point against a fake part that misbehaves          |
| Decoupling middleware | Put a queue between parts, so they need not be up at the same time       |
| Shed load             | Refuse the extra work when the load is too high, and serve the rest well |
| Create back pressure  | Use limited queues, so a slow consumer slows its producers               |
| Governor              | Limit how fast automation can make large changes                         |

### Timeouts

Each call across a network needs a timeout. This includes the database, the cache, and the connection pool. Many client libraries have no timeout by default, or a very long one.

- Set two timeouts: one to open the connection and one to wait for the answer.
- Base the value on the latency of the dependency: a little above its normal high percentile, for example the 99th or the 99.9th.
- Pass a **deadline** along the chain. If the ticket seller has 2 seconds in total, the seat service gets what is left, not a new 2 seconds.

Nygard pairs timeouts with a retry later, for example from a queue, not with an immediate retry.

### Circuit breaker

A circuit breaker wraps calls to one dependency and counts the failures.

```diagram
{
  "nodes": [
    { "id": "closed", "label": "Closed\n(calls pass)", "shape": "box", "col": 0, "row": 0 },
    { "id": "open", "label": "Open\n(calls fail at once)", "shape": "box", "col": 2, "row": 0 },
    { "id": "half", "label": "Half-open\n(one trial call)", "shape": "box", "col": 1, "row": 1.3 }
  ],
  "edges": [
    { "from": "closed", "to": "open", "label": "failures above limit" },
    { "from": "open", "to": "half", "label": "wait ends" },
    { "from": "half", "to": "closed", "label": "trial succeeds" },
    { "from": "half", "to": "open", "label": "trial fails" }
  ]
}
```

When the breaker is open, the caller does not wait. It returns an error or a fallback at once. This protects the caller's threads, and it gives the failing part time to recover. Watch the state of each breaker. An open breaker is a clear signal that a dependency is in trouble.

### Bulkheads

A ship has walls that split it into compartments, so one hole does not sink it. In software, give each dependency its own pool of threads or connections. If the email service hangs, it can use all 10 of its connections, but the 50 connections for the card provider stay free. You can also split servers: one group for buyers and one for the internal reports, so a heavy report cannot stop sales.

### Steady state

Each process that adds data must have a process that removes it. Logs rotate. Old sessions expire. Caches have a size limit. Old rows move to an archive. If a person must log in to delete files each month, the system fails the month that person is on holiday.

### Fail fast

If the ticket seller knows that the seat service's breaker is open, it refuses the purchase at the start. It does not first reserve a payment and then fail. Check inputs, required resources, and breaker states before the expensive work. A fast error is much better for the caller than a slow one.

### Let it crash

This idea comes from Erlang. Instead of complex code to repair a bad state, stop the small part and start it again from a clean state. It works only under conditions:

- The part is small and starts fast: a process or a container, not a full server.
- A supervisor watches it and restarts it.
- Other parts are isolated from it, so its crash does not spread.

### Handshaking

The server and the caller agree, before the work, that the server can take it. A health check with a **readiness** signal does this: the load balancer sends no traffic to a copy that is not ready. An HTTP `503` with `Retry-After` is a simple handshake under load.

### Test harnesses

Normal tests use a remote part that works. A test harness is a fake remote part that misbehaves on purpose. It accepts the connection and never answers. It sends one byte each minute. It returns an answer that is not valid. Each integration point must survive each of these before production.

### Decoupling middleware

A message broker between two parts removes the need for both to be up at once. See [Synchronous and asynchronous](/learn/sync-async) and [Messaging](/learn/messaging).

### Shed load and create back pressure

These two patterns handle too much work in different places.

|            | Shed load                                          | Create back pressure                               |
| ---------- | -------------------------------------------------- | -------------------------------------------------- |
| Where      | At the edge of the system                          | Between parts inside the system                    |
| How        | Refuse requests above capacity, with `503`         | A limited queue. When full, the producer must wait |
| Effect     | Some users get an error. The rest get fast answers | The slow part slows its source, step by step       |
| Without it | All users get slow answers, then all get errors    | Queues grow without a limit until memory runs out  |

A server at its limit that accepts more work makes each request slow. Refuse early, and the accepted requests stay fast.

### Governor

Automation can make a mistake much faster than a person. An autoscaler that reads a bad metric can remove 90% of the servers in one minute. A governor limits the speed of such actions. It allows small changes at once, and asks a person to confirm a large one. It applies to deploy tools, cleanup jobs, and scripts that change many machines.

## Rules for retries

Retries are useful and dangerous.

- Retry only when the operation is [safe to repeat](/learn/distributed-transactions).
- Wait longer before each attempt, and add a random part, so that many callers do not all retry in the same moment.
- Set a maximum number of attempts.
- Retry at one level only. If three levels each retry three times, one failure becomes 27 calls to a part that is already in trouble.

A **retry budget** adds a further limit. Retries can be at most a small share of the traffic, for example 10%, as a rough number. When the dependency is down, the budget runs out, and the extra load stops. Retry only errors that can pass: a timeout or a `503`, not a `400`.

## Degrade, do not fail

Decide for each function if it is essential. When the recommendation service is down, show a plain list. When the payment provider is slow, offer "pay at pickup". A user accepts a product with fewer functions much more easily than an error page. The Tutor Marketplace and Lunch Rush worked examples both do this.

Write the fallback for each dependency in the design, not during the outage:

| Dependency down      | Fallback                                             |
| -------------------- | ---------------------------------------------------- |
| Recommendations      | The most popular items, from a cache                 |
| Live parcel location | The last known location, with its time               |
| Email sender         | Put the email in a queue, and send it later          |
| Card provider        | No fallback: the purchase stops with a clear message |

The last line matters. Some dependencies are essential. Say so, and protect them with redundancy instead.

## Single points of failure

Find each box of which there is only one: one database server, one gateway, one scheduler, one external provider. For each, either add a second, or state that you accept the risk and why.

Look also for the hidden ones: one DNS provider, one certificate that expires, one region, one person who knows how to restore. A second copy helps only if it fails independently. Two copies with the same configuration fault fail together.

## Test it

A recovery path that never runs does not work when you need it. Teams that depend on resilience cause failures deliberately, in a controlled way, to see what occurs. At minimum, test the restore of a backup.

A step-by-step approach:

1. Test each integration point against a test harness, in the build.
2. Run load tests with a slow or failing dependency, before release.
3. Run game days: the team causes a planned failure in a test or production environment, and practices the response.
4. Inject faults in production in a controlled way, with a small blast radius. This is **chaos engineering**.

## In a kata

The "risks" part of the rationale is this page in practice. Name the first thing that fails and what the design does about it. See also [Observability and service levels](/learn/observability).

For each solid arrow to an external provider, write the timeout, the breaker, and the fallback. In the [Payment System kata](/kata/payment-system), the card provider has no fallback, so the design needs retries with idempotency keys and a status the user can see. In the [Notification Service kata](/kata/notification-service), each channel has its own bulkhead, so slow email does not stop push messages.

## Interview questions

**"A dependency becomes very slow. Walk me through what occurs, and how you protect the system."**

- Without protection, callers wait, threads fill, and the caller stops too. The failure spreads backward.
- A timeout limits each wait. A bulkhead limits the threads that one dependency can hold.
- A circuit breaker stops the calls after repeated failures and fails fast.
- A fallback, or a degraded function, keeps the user served.

**"Explain a circuit breaker."**

- Closed: calls pass, failures are counted.
- Open: calls fail at once for a period, with no network call.
- Half-open: one trial call. Success closes it, failure opens it again.
- Monitor the state. Configure it for each dependency.

**"How do you prevent a retry storm?"**

- Exponential backoff with a random part (jitter).
- A maximum number of attempts, and retries at one level only.
- A retry budget, and a circuit breaker.
- Retry only errors that can pass, on operations safe to repeat.

**"How do you select a timeout value?"**

- From the measured latency of the dependency, a little above its high percentile.
- Within the total deadline of the caller, which passes down the chain.
- Too short gives false failures. Too long gives no protection.

**"What is the difference between shedding load and back pressure?"**

- Shedding refuses extra requests at the edge, so accepted ones stay fast.
- Back pressure makes a slow part slow down its producers, through limited queues.
- Both replace a queue without a limit, which hides overload until it is too late.

## Go deeper

- **Release It!**, Michael Nygard, the part on stability patterns: each pattern on this page, with stories from production systems. The part on stability antipatterns gives the failures they prevent.
- **Building Microservices**, Sam Newman, the part on resiliency: the four meanings of resilience, and timeouts, retries, bulkheads, and circuit breakers between services.
- **Site Reliability Engineering**, Beyer and others, the parts on handling overload and on cascading failures: load shedding, retry budgets, and deadlines as Google uses them.
- **Designing Data-Intensive Applications**, Martin Kleppmann, the part on trouble with distributed systems: why a timeout cannot tell a slow node from a dead one.

## Further reading

- [Circuit breaker](https://martinfowler.com/bliki/CircuitBreaker.html), by Martin Fowler
- [Exponential backoff](https://en.wikipedia.org/wiki/Exponential_backoff) and [Chaos engineering](https://en.wikipedia.org/wiki/Chaos_engineering) on Wikipedia
- [Addressing Cascading Failures](https://sre.google/sre-book/addressing-cascading-failures/), from the Google SRE book
