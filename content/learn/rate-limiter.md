## The question

"Design a rate limiter for a public API. It refuses a client that sends too many requests."

A rate limiter counts the requests of each client in a period, and refuses the requests above a limit. It protects the system from overload, from one noisy client, from abuse such as password guessing, and from bills for paid third-party calls. It is also a product feature: free clients get 100 requests each minute, paid clients get more.

This case looks small, but it touches many core ideas: counting in a shared store, atomic operations, the cost of each extra network call, and accuracy against speed in many data centers. The structure here follows Alex Xu's chapter on rate limiters (System Design Interview). The example is the public API of a ticket seller.

## Questions to ask first

### Functional

- **What is the key?** A limit can apply to a user ID, an API key, an IP address, a device, or a whole tenant. Many systems use more than one key at a time.
- **What are the limits?** For example, 100 requests each minute for each API key, and 5 checkout attempts each minute for each user.
- **Is it one limiter for many services?** If yes, it needs a central rule configuration.
- **What does a refused client see?** Usually an HTTP 429 answer and headers that say when to try again.

### Non-functional

- **Latency.** The limiter is on each request. Its cost must be small, for example less than 2 ms.
- **Accuracy.** Is it acceptable to let 105 requests through when the limit is 100? A billing limit needs more accuracy than a protection limit.
- **Failure mode.** If the limiter itself fails, do you let all traffic through (fail open) or refuse all traffic (fail closed)? Most API limiters fail open, because a limiter outage must not become a product outage.
- **Scale.** How many clients, how many requests each second, how many data centers?

### The questions that change the design

| Answer                                | Effect on the design                        |
| ------------------------------------- | ------------------------------------------- |
| One server only                       | A counter in memory is enough               |
| Many servers, one region              | A shared counter store, such as Redis       |
| Many regions, strict limit            | A global counter, with cross-region latency |
| Many regions, approximate limit is OK | Local counters in each region, synced later |
| Bursts are acceptable                 | Token bucket                                |
| A smooth output rate is necessary     | Leaking bucket                              |

## Estimates

The numbers are rough and are for this example only.

- **Clients.** 5 million active API keys in a day. At peak, 1 million of them are active in the same minute.
- **Traffic.** 40,000 requests each second at peak.
- **Store operations.** Each check needs one or two operations on the counter store. That makes 40,000 to 80,000 operations each second. One Redis node handles roughly 100,000 simple operations each second, so plan for a small cluster with a margin.
- **Memory for counters.** One counter needs the key (about 40 bytes), the value, and the expiry. Say 100 bytes in total. 1 million active counters × 100 bytes = 100 MB. This fits easily in memory.
- **Memory for a log of timestamps.** A sliding window log keeps one timestamp for each request. At a limit of 100 a minute, a busy key keeps up to 100 entries of about 20 bytes: 2 KB. 1 million busy keys × 2 KB = 2 GB. The log costs about 20 times more memory than a counter.

The conclusion: counters are cheap, the store is a hot path, and the algorithm choice changes the memory by an order of magnitude.

## The first design

```diagram
{
  "nodes": [
    { "id": "client", "label": "API client", "shape": "actor", "col": 0, "row": 1 },
    { "id": "gw", "label": "API gateway\n+ rate limiter", "shape": "box", "col": 1, "row": 1 },
    { "id": "api", "label": "API servers", "shape": "box", "col": 2, "row": 1 },
    { "id": "redis", "label": "Counters\n(Redis cluster)", "shape": "store", "col": 1, "row": 2.3 },
    { "id": "rules", "label": "Rules\n(config files)", "shape": "store", "col": 2, "row": 0 },
    { "id": "loader", "label": "Rule loader", "shape": "box", "col": 1, "row": 0 },
    { "id": "later", "label": "Delayed requests\n(optional queue)", "shape": "pipe", "col": 2, "row": 2.3 }
  ],
  "edges": [
    { "from": "client", "to": "gw", "label": "request" },
    { "from": "gw", "to": "api", "label": "allowed" },
    { "from": "gw", "to": "redis", "label": "count + check" },
    { "from": "loader", "to": "rules", "label": "read" },
    { "from": "loader", "to": "gw", "label": "rules in memory" },
    { "from": "gw", "to": "later", "label": "over limit", "async": true }
  ]
}
```

- **API gateway with the limiter.** Each request passes the limiter before it reaches the API servers. The limiter finds the rule for the request, builds the counter key (for example `checkout:user:8812:minute`), and asks the store.
- **Counter store.** A Redis cluster holds the counters. Redis is a common choice, because it is in memory, it has atomic increment, and keys can expire on their own.
- **Rules.** Engineers write the limits in configuration files. A loader reads them and keeps them in the memory of each limiter, so the hot path never reads a file.
- **Over the limit.** The limiter answers 429 at once. For some work, such as an order that must not be lost, it can put the request in a queue for later.

## Deep dives

### Where the limiter runs

| Place                         | Strong points                                            | Weak points                                        |
| ----------------------------- | -------------------------------------------------------- | -------------------------------------------------- |
| Client                        | Saves network calls for a well-behaved client            | You cannot trust it. A bad client removes it       |
| In each API server            | No extra hop. Full access to the request and the user    | Each server counts alone, unless all share a store |
| Middleware or a sidecar       | One shared component for all services                    | A new part on the hot path                         |
| API gateway                   | One place for all limits. Often a managed product option | The gateway sees less of the business context      |
| Network edge or load balancer | Stops a flood before it reaches your servers             | Usually only simple keys, such as the IP address   |

A client-side limit is a courtesy, never a protection. Real systems often use more than one layer: a coarse limit by IP address at the edge, and limits by user and by operation at the gateway or in the service.

A trap: if each of 10 API servers keeps its own counter with a limit of 100, a client that spreads its requests gets 1,000. Either share the counter, or give each server a part of the limit and accept the error.

### The algorithms

| Algorithm              | How it works                                                                         | Strong points                           | Weak points                                        |
| ---------------------- | ------------------------------------------------------------------------------------ | --------------------------------------- | -------------------------------------------------- |
| Token bucket           | A bucket holds up to B tokens and gets R new tokens each second. A request takes one | Allows short bursts. Two numbers. Small | Two numbers to tune. A burst of B can still arrive |
| Leaking bucket         | Requests go into a queue of fixed size. A worker takes them out at a fixed rate      | Smooth, fixed output rate               | A burst fills the queue, and new requests are lost |
| Fixed window counter   | One counter for each window, for example each calendar minute                        | Very simple. One number for each key    | Up to 2 times the limit at a window edge           |
| Sliding window log     | Keep the timestamp of each request. Count those in the last full window              | Exact                                   | Memory for each request. Slow for high limits      |
| Sliding window counter | Use the counts of the current and previous windows, weighted by the overlap          | Small memory. Close to exact            | An approximation. It assumes an even spread        |

Here is each one with numbers.

**Token bucket.** The bucket holds 20 tokens and gets 5 new tokens each second. A client that was quiet can send 20 requests at once. After that, it can send 5 each second. You do not need a timer: when a request arrives, compute the tokens that came since the last request, add them up to the maximum, and take one. This is the common choice for public APIs, because real clients send bursts.

**Leaking bucket.** The queue holds 50 requests, and the worker sends 10 each second to the service. The service sees a flat rate, whatever the clients do. This fits a downstream system that cannot take bursts, such as a payment provider with a strict rate. The client waits in the queue, so its latency grows.

**Fixed window counter.** The limit is 100 each minute. A client sends 100 requests at 10:00:59 and 100 more at 10:01:00. Both windows accept them, so 200 requests pass in two seconds. For a protection limit, this is often acceptable. For a strict limit, it is not.

**Sliding window log.** The store keeps a sorted set of timestamps for each key. For each request, remove the timestamps older than one minute, count the rest, and add the new one. The answer is exact, but see the memory in the estimates.

**Sliding window counter.** The limit is 100 each minute. The previous minute had 80 requests. The current minute has 30 so far, and 15 seconds of it have passed (25%). The estimate is 30 + 80 × 75% = 90. That is below 100, so the request passes. The method needs only two counters for each key.

### A shared counter and race conditions

With many limiter instances, the counter must be in a shared store. The obvious code has a race condition:

1. Instance A reads the counter: 99.
2. Instance B reads the counter: 99.
3. Both see that 99 is below 100, and both allow the request.
4. Both write 100. The real count is 101.

At high traffic, this occurs all the time. The fixes:

- **Atomic increment.** Do not read and then write. Send one increment command, and decide with the value that it returns. In Redis, `INCR` with an expiry makes a fixed window counter. Set the counter and its expiry in one atomic step, for example with a Lua script or `SET key 0 EX 60 NX` before the `INCR`. With two separate commands, a crash between them leaves a counter that never expires.
- **A script on the server.** A token bucket needs a read, a calculation, and a write. Put the three in one Lua script. Redis runs a script as one unit, so no other command comes between its steps.
- **Not a lock.** A distributed lock adds round trips and a new failure mode on each request. It is too slow for this hot path.

Other costs of the shared store:

- **Latency.** Each request now makes a network call. Keep the store in the same data center, and use short timeouts. If the store does not answer in time, fail open and log it.
- **Hot keys.** One very busy key lands on one Redis node. Usually this is acceptable, because a counter operation is cheap. For extreme cases, keep a small local count and send it to the store in batches.

### Rules, headers, and the 429 answer

**Rules.** Keep the limits as data, not as code. An example rule file:

```yaml
- operation: search
  key: api_key
  limit: 600
  per: minute
- operation: checkout
  key: user_id
  limit: 5
  per: minute
```

Store the files in version control, and let a loader push them to each limiter. A rule change then needs no deployment. A limit for each plan (free, paid) is one more field in the rule.

**The answer.** HTTP has a status code for this: 429 Too Many Requests. Tell the client what to do. Many APIs send headers such as these:

| Header                  | Meaning                                         |
| ----------------------- | ----------------------------------------------- |
| `X-RateLimit-Limit`     | The limit for this window                       |
| `X-RateLimit-Remaining` | The requests that the client has left           |
| `X-RateLimit-Reset`     | When the window resets                          |
| `Retry-After`           | How many seconds to wait. A standard HTTP field |

The `X-` names are a convention, not a standard. Send the remaining count also on the requests that pass, so a good client can slow down before it hits the limit.

A refused client often retries at once. Tell clients to wait with backoff and a random part. See [Resilience](/learn/resilience).

### Distributed limiters in many data centers

When the API runs in three regions, where is the counter?

| Option                        | How it works                                                | Trade-off                                                 |
| ----------------------------- | ----------------------------------------------------------- | --------------------------------------------------------- |
| One global store              | All regions call one counter store                          | Exact, but each request pays cross-region latency         |
| A home region for each client | Route each client to one region, which owns its counter     | Exact and fast, but routing must be sticky                |
| Local counters, a share each  | Each region gets a part of the limit, for example a third   | Fast, but a client that uses one region gets less         |
| Local counters, synced        | Each region counts alone and sends its counts to the others | Fast and close to fair. It can overshoot for a short time |

The usual answer is local counters with sync, and acceptance of a small overshoot. This is eventual consistency: the regions agree after a short delay. For a limit that protects money, such as payouts, choose a home region instead.

## Trade-offs and alternatives

### Soft and hard limits

- A **hard limit** never lets a request through above the limit. Use it for security limits, such as login attempts, and for limits that protect a fixed resource.
- A **soft limit** lets a client go over for a short time or by a margin, for example 10%. Use it for fair-use limits, where a small overshoot is cheaper than the cost of exact counting. A soft limit can also warn the client before the hard limit stops it.

### Other trade-offs

- **Accuracy against cost.** An exact limit needs a log or a global counter. An approximate limit needs two numbers and a local store. Ask how exact the limit must be.
- **Fail open or fail closed.** Fail open keeps the product up when the limiter breaks. Fail closed protects a fragile system. Decide for each rule.
- **Refuse or delay.** A 429 answer is cheap and clear. A queue saves the work but hides the overload, and the queue can grow without limit.
- **Rate limit or load shedding.** A rate limit is a promise for each client. Load shedding refuses work when the whole service is overloaded, whoever sends it. You need both. See [Resilience](/learn/resilience) and [Stability antipatterns](/learn/stability-antipatterns).
- **Build or buy.** Most API gateways and CDNs have a rate limiter. Build your own only when you need business keys or rules that they do not support.

### Watch it

Measure the 429 rate for each rule. A sudden rise is either an attack, a broken client, or a limit that is too low after a product change. Log the refused requests with the key and the rule. See [Observability](/learn/observability).

## What interviewers probe

**"Why token bucket and not fixed window?"**

- Token bucket allows a controlled burst, and real clients send bursts.
- Fixed window lets up to two times the limit through at a window edge.
- Fixed window is simpler. It is a good choice when the edge effect is acceptable.

**"Two gateway instances check the same counter at the same moment. What happens?"**

- With read, then write, both can allow the request, and the count is wrong.
- Use an atomic increment, or a script that the store runs as one unit.
- Do not use a distributed lock on the hot path.

**"Redis is down. What does your limiter do?"**

- It fails open after a short timeout, and it logs and alerts.
- It can fall back to a local limit for each instance, with a part of the global limit.
- For a security limit, such as login attempts, fail closed.

**"How do you change a limit without a deployment?"**

- Rules are data in configuration files, in version control.
- A loader pushes them to each limiter, which keeps them in memory.
- Add a check that refuses a rule file with errors before it goes live.

**"The API runs in three regions. Is the limit exact?"**

- Not usually. Local counters with sync can overshoot for a short time.
- For an exact limit, give each client a home region, or pay the cross-region latency.
- State the overshoot that is acceptable, in numbers.

## Go deeper

- **System Design Interview, Alex Xu**, the chapter on designing a rate limiter: the five algorithms, the rules, and the design with Redis.
- **Site Reliability Engineering, Beyer and others**, the chapters on handling overload and on cascading failures: client-side throttling, load shedding, and why retries make overload worse.
- **Release It!, Michael Nygard**, the patterns to shed load and to create back pressure: how a system protects itself from its callers.
- **Designing Data-Intensive Applications, Martin Kleppmann**, the parts on replication lag and on linearizability: why a counter shared across regions cannot be both exact and fast.

## Further reading

- [Rate limiting](https://en.wikipedia.org/wiki/Rate_limiting), [Token bucket](https://en.wikipedia.org/wiki/Token_bucket), and [Leaky bucket](https://en.wikipedia.org/wiki/Leaky_bucket) on Wikipedia
- [Handling overload](https://sre.google/sre-book/handling-overload/), from the SRE book
- Related lessons: [API design](/learn/api-design), [Design a key-value store](/learn/key-value-store)
