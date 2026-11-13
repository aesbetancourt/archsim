## Three words

- **Performance:** how fast one request is. Measured as [latency](/glossary#latency).
- **Scalability:** how the system behaves when load grows. A scalable system handles more load when you add machines.
- **Elasticity:** how fast capacity follows a sudden change in load, up and down.

A system can be fast and not scalable: quick for 100 users, down at 10,000. Decide which of the three the problem asks for. See [Architecture characteristics](/learn/characteristics).

## Two ways to add capacity

| | A larger machine (vertical) | More machines (horizontal) |
|---|---|---|
| Change to the application | None | It must be [stateless](/glossary#stateless) |
| Limit | The largest machine you can buy | Very high |
| A failure | Stops everything | Removes one copy |
| Cost | Simple at first, then rises fast | More to operate |

A larger machine is a good first step and is often enough. More machines need a [load balancer](/glossary#load-balancer) and an application that keeps no data in its own memory between requests.

## Where systems run out

The application servers are almost never the limit, because they are easy to copy. The limit is usually one of these:

1. **The database.** It is the hardest part to copy. See [Replication and partitioning](/learn/scaling-data).
2. **A shared resource:** a lock, a counter, one queue, one partition with a hot key.
3. **An external provider** with a rate limit.
4. **A slow path that holds resources.** See [Design for failure](/learn/resilience).

Find the limit with numbers before you design around it. See [Capacity estimation](/learn/estimation).

## The standard moves

| Problem | Move |
|---|---|
| The same data is read many times | [Cache](/learn/caching) |
| Reads overload the database | Read from followers |
| Large files slow the servers | Object storage and a CDN |
| Work makes the user wait | Do it [in the background](/learn/sync-async) |
| Load arrives in bursts | A queue in front of workers |
| A read is a heavy calculation | Prepare the result at write time |
| The data is too large for one server | Partition |
| One part has much more load than the rest | Make it a separate deployment |

Each move adds complexity. Apply them in the order that the numbers require, not all at once.

## Measure the slow requests

An average hides the problem. If the average is 100 milliseconds and one request in a hundred takes 5 seconds, a user who loads a page with 50 requests meets a slow one often. Measure percentiles: "99% of requests finish in less than 300 milliseconds".

## In a kata

Do not design for a load the problem does not state. For the load it does state, name the part that reaches its limit first, and the move you use.

## Further reading

- [Scalability](https://en.wikipedia.org/wiki/Scalability) and [Load balancing](https://en.wikipedia.org/wiki/Load_balancing_(computing)) on Wikipedia
