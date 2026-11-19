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

## A cascade, step by step

Follow one checkout as a slow dependency stops all sales, and then add the patterns that keep it up. Use the buttons or the arrow keys.

```walkthrough
{
  "title": "A ticket checkout survives a slow provider",
  "metrics": [
    { "id": "success", "label": "Checkout success", "unit": "%", "better": "higher" },
    { "id": "threads", "label": "Threads in use", "unit": "of 200", "better": "lower" },
    { "id": "p99", "label": "p99 checkout time", "unit": "ms", "better": "lower" },
    { "id": "calls", "label": "Payment calls", "unit": "/s" }
  ],
  "diagram": {
    "nodes": [
      { "id": "buyers", "label": "Buyers", "shape": "actor", "col": 0, "row": 1.5 },
      { "id": "checkout", "label": "Checkout\n(200 threads)", "shape": "box", "col": 1, "row": 1.5 },
      { "id": "seats", "label": "Seat service", "shape": "box", "col": 2, "row": 0 },
      { "id": "client", "label": "Payment client\n(own pool)", "shape": "module", "col": 2, "row": 1.5 },
      { "id": "email", "label": "Email service", "shape": "box", "col": 2, "row": 3 },
      { "id": "pay", "label": "Payment\nprovider", "shape": "external", "col": 3, "row": 1.5 },
      { "id": "queue", "label": "Pay-later\nqueue", "shape": "pipe", "col": 3, "row": 3 }
    ],
    "edges": [
      { "from": "buyers", "to": "checkout", "label": "checkout" },
      { "from": "checkout", "to": "seats", "label": "hold seats" },
      { "from": "checkout", "to": "pay", "label": "charge" },
      { "from": "checkout", "to": "email", "label": "receipt" },
      { "from": "checkout", "to": "client", "label": "charge" },
      { "from": "client", "to": "pay", "label": "charge" },
      { "from": "checkout", "to": "queue", "label": "pay later", "async": true },
      { "from": "queue", "to": "pay", "label": "charge", "async": true }
    ]
  },
  "steps": [
    {
      "kind": "problem",
      "title": "A checkout with three calls",
      "text": "A ticket seller sells concert seats. Each checkout holds the seats, charges the card, and sends a receipt. The checkout server has 200 threads, and each request uses one thread until it ends.\n\nAt 50 checkouts each second, a checkout takes about 0.8 s. So about 40 threads are busy at a time. Each of the three calls is an integration point.",
      "key": "Each arrow to another part is a place where a failure can come in.",
      "show": ["buyers", "checkout", "seats", "email", "pay"],
      "flow": ["buyers>checkout", "checkout>seats", "checkout>pay", "checkout>email"],
      "notes": { "checkout": "40 of 200 threads" },
      "metrics": { "success": 99.9, "threads": 40, "p99": 900, "calls": 50 }
    },
    {
      "kind": "problem",
      "title": "The provider gets slow",
      "text": "At 20:00, a big concert goes on sale. The payment provider does not stop. But each charge now takes 20 s, not 0.5 s.\n\nThe checkout waits for each charge with no time limit. To serve 50 checkouts each second, it now needs 1,000 threads. It has 200, and in about 4 s all of them wait for the provider.",
      "key": "A slow part is more dangerous than a part that is down, because it holds its callers.",
      "show": ["buyers", "checkout", "seats", "email", "pay"],
      "flow": ["buyers>checkout", "checkout>pay"],
      "focus": ["pay"],
      "notes": { "pay": "charge: 20 s", "checkout": "200 of 200 threads" },
      "metrics": { "success": 20, "threads": 200, "p99": 20000, "calls": 10 }
    },
    {
      "kind": "failure",
      "title": "The cascade",
      "text": "New requests find no free thread. They wait in a line until the load balancer stops them after 60 s. Buyers click again, and the load goes up.\n\nThe seat service and the email service are healthy, but the checkout has no thread to call them. One slow provider has stopped all sales. This is a cascading failure: it moves back along the arrows to the callers.",
      "key": "Without a time limit, a slow dependency takes all the threads of its callers.",
      "show": ["buyers", "checkout", "seats", "email", "pay"],
      "flow": ["buyers>checkout"],
      "down": ["checkout"],
      "notes": { "buyers": "click again", "seats": "healthy, no calls" },
      "metrics": { "success": 2, "p99": 60000 }
    },
    {
      "kind": "technique",
      "title": "Add a timeout",
      "text": "Give the charge call a timeout of 2 s. After 2 s, the checkout stops the wait, frees the thread, and tells the buyer to try again.\n\nNow a thread waits at most 2 s, so the checkout needs about 130 threads. It stays up. But only the charges that finish in 2 s succeed: roughly 30% of them.",
      "key": "A timeout turns a slow failure into a fast one. Set it a little above the normal p99 of the call.",
      "show": ["buyers", "checkout", "seats", "email", "pay"],
      "flow": ["buyers>checkout", "checkout>pay"],
      "focus": ["checkout"],
      "notes": { "checkout": "timeout: 2 s" },
      "metrics": { "success": 30, "threads": 130, "p99": 2400, "calls": 50 }
    },
    {
      "kind": "technique",
      "title": "A bulkhead for payments",
      "text": "The charges still use the same threads as the rest of the site. When charges wait, seat maps and seat holds wait too.\n\nGive the charges their own pool of 20 threads. When the pool is full, a new charge fails at once. Fewer charges pass, roughly 10%. But the other threads stay free, and the provider gets less load.",
      "key": "A bulkhead limits the damage of one dependency to its own share of resources.",
      "show": ["buyers", "checkout", "seats", "email", "pay", "client"],
      "hide": ["checkout>pay"],
      "flow": ["checkout>client", "client>pay"],
      "focus": ["client"],
      "notes": { "client": "20 of 20 threads" },
      "metrics": { "success": 10, "threads": 40, "p99": 2100, "calls": 10 }
    },
    {
      "kind": "technique",
      "title": "The breaker opens",
      "text": "Put a circuit breaker in the payment client. It starts closed: calls go through, and it counts the failures. When more than half of the calls fail in 10 s, it opens. While it is open, each charge fails at once, and no call goes to the provider.\n\nThe checkout no longer waits 2 s for a call that will probably fail. The provider gets 30 s with no load to recover. But now no buyer can pay.",
      "key": "An open breaker fails fast and gives the dependency time to recover.",
      "show": ["buyers", "checkout", "seats", "email", "pay", "client"],
      "hide": ["checkout>pay"],
      "flow": ["buyers>checkout", "checkout>client"],
      "focus": ["client"],
      "notes": { "client": "breaker: open" },
      "metrics": { "success": 0, "threads": 30, "p99": 300, "calls": 0 }
    },
    {
      "kind": "technique",
      "title": "A fallback: pay later",
      "text": "When the breaker is open, the checkout does not show an error. It holds the seats for 30 minutes and puts the order in a pay-later queue. The buyer sees: \"Your seats are held. We will charge your card in the next 15 minutes.\"\n\nThis is a business decision, so ask the business first. Another fallback is \"pay at pickup\" at the box office. Test the fallback, because it runs only on a bad day.",
      "key": "A fallback gives a smaller answer instead of an error. The business chooses which answer is acceptable.",
      "show": ["buyers", "checkout", "seats", "email", "pay", "client", "queue"],
      "hide": ["checkout>pay"],
      "flow": ["buyers>checkout", "checkout>seats", "checkout>queue"],
      "focus": ["queue"],
      "notes": { "client": "breaker: open", "queue": "orders wait for a charge" },
      "metrics": { "success": 95, "p99": 400 }
    },
    {
      "kind": "technique",
      "title": "Half-open: a few test calls",
      "text": "After 30 s, the breaker goes half-open. It lets a few trial charges go to the provider. If they fail, the breaker opens again for 30 s. If they succeed, it closes.\n\nThe provider is fast again. The three trial charges succeed in 0.5 s, and the breaker closes. New charges go to the provider again.",
      "key": "Half-open tests the dependency with a small load before the full load returns.",
      "show": ["buyers", "checkout", "seats", "email", "pay", "client", "queue"],
      "hide": ["checkout>pay"],
      "flow": ["checkout>client", "client>pay"],
      "focus": ["client"],
      "notes": { "client": "breaker: half-open", "pay": "3 trial calls" },
      "metrics": { "calls": 1 }
    },
    {
      "kind": "technique",
      "title": "Retry only the safe steps",
      "text": "A worker now charges the orders in the queue. When a charge fails, it waits and tries again: 1 s, then 2 s, then 4 s. It adds a random part to each wait, called jitter, so the workers do not all retry at the same moment.\n\nRetry only a step that is safe to repeat. Each charge carries an idempotency key, so a repeat does not charge twice. A seat hold uses the order ID, so it is safe too. Do not retry a charge that has no key.",
      "key": "Retry with backoff and jitter, and only where a repeat does no harm.",
      "show": ["buyers", "checkout", "seats", "email", "pay", "client", "queue"],
      "hide": ["checkout>pay"],
      "flow": ["checkout>client", "client>pay", "queue>pay"],
      "focus": ["queue"],
      "notes": { "client": "breaker: closed", "queue": "empties at 20/s" },
      "metrics": { "success": 99, "threads": 40, "p99": 900, "calls": 70 }
    },
    {
      "kind": "recap",
      "title": "What you built",
      "text": "The charge has a 2 s timeout and its own pool of 20 threads. A circuit breaker stops the calls when the provider fails, and tests it again after 30 s. While the breaker is open, orders wait in a queue. A worker charges them with backoff, jitter, and an idempotency key.\n\nWhen the provider gets slow again, sales continue. Some buyers wait a few minutes for the charge, but the site stays up.",
      "key": "In a kata, ask of each arrow: what occurs when this part is slow? Then give that arrow a timeout, a limit, and a fallback.",
      "show": ["buyers", "checkout", "seats", "email", "pay", "client", "queue"],
      "hide": ["checkout>pay"],
      "notes": { "client": "2 s, 20 threads, breaker" },
      "metrics": { "success": 99.9, "calls": 50 }
    }
  ]
}
```

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
    { "id": "half", "label": "Half-open\n(a few trial calls)", "shape": "box", "col": 1, "row": 1.3 }
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
- Retry at one level only. If three levels each try three times, one failure becomes 27 calls to a part that is already in trouble.

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
- Half-open: one or a few trial calls. Success closes it, failure opens it again.
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
