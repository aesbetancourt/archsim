## Three words

- **Performance:** how fast one request is. Measured as [latency](/glossary#latency).
- **Scalability:** how the system behaves when load grows. A scalable system handles more load when you add machines.
- **Elasticity:** how fast capacity follows a sudden change in load, up and down.

A system can be fast and not scalable: quick for 100 users, down at 10,000. Decide which of the three the problem asks for. See [Architecture characteristics](/learn/characteristics).

Richards and Ford separate scalability and elasticity clearly (Fundamentals of Software Architecture, the parts on characteristics and styles). Scalability is about a large load that grows over months. Elasticity is about a burst that arrives in minutes: the ticket seller when a famous band goes on sale. A system can be scalable and not elastic, if each new server takes 20 minutes to start. In their style ratings, space-based architecture gets the highest rating for elasticity, and a layered monolith gets a low one. See [Architecture styles](/learn/styles).

| The problem says                     | The characteristic | What the design needs                                  |
| ------------------------------------ | ------------------ | ------------------------------------------------------ |
| "Ten times more users in two years"  | Scalability        | A path to more machines and partitioned data           |
| "All tickets go on sale at 10:00"    | Elasticity         | Fast start of new capacity, a queue, or a waiting room |
| "Search must answer in under 200 ms" | Performance        | Caches, indexes, and less work in the path             |

## Describe the load

Before you scale, describe the load in numbers. Kleppmann calls these numbers **load parameters** (Designing Data-Intensive Applications, the part on scalability). The correct parameters depend on the system.

- Requests per second, at the average and at the peak.
- The ratio of reads to writes.
- The number of users active at the same time.
- The size of the data, and how fast it grows.
- The **fan-out**: how much work one request causes. One post from a tutor with 50,000 followers causes 50,000 feed updates.

The last parameter often decides the design. Two systems with the same requests per second can need very different designs, because one request costs much more work in one of them. Kleppmann's point is that no design scales for all loads. A design scales for the operations it expects to be common. See [Capacity estimation](/learn/estimation).

## Describe the performance

Use two measures, for two kinds of system.

- **Throughput:** the work done per second. It matters for batch jobs and queues.
- **Response time:** the time the client waits, from the request to the answer. It matters for online services.

Kleppmann separates response time from **latency**. Latency is only the time a request waits to be handled. Response time also includes the work and the network. Many teams use "latency" for both.

**Little's law** connects these measures. The number of requests in progress equals the throughput times the response time. At 2,000 requests per second and 50 milliseconds each, about 100 requests are in progress at each moment. If the response time rises to 500 milliseconds, 1,000 are in progress, and the thread pool or connection pool can run out.

## Two ways to add capacity

|                           | A larger machine (vertical)      | More machines (horizontal)                  |
| ------------------------- | -------------------------------- | ------------------------------------------- |
| Change to the application | None                             | It must be [stateless](/glossary#stateless) |
| Limit                     | The largest machine you can buy  | Very high                                   |
| A failure                 | Stops everything                 | Removes one copy                            |
| Cost                      | Simple at first, then rises fast | More to operate                             |

A larger machine is a good first step and is often enough. More machines need a [load balancer](/glossary#load-balancer) and an application that keeps no data in its own memory between requests.

Kleppmann calls the second approach **shared-nothing**: each machine has its own CPU, memory, and disk, and they coordinate only over the network. It is the usual approach for large systems. It also brings all the problems of [distributed systems](/learn/distributed). Many good designs mix the two: a few large database servers, and many small application servers.

### Why more machines do not give equal gains

Adding machines rarely gives equal growth in throughput.

- **Amdahl's law:** the part of the work that cannot run in parallel limits the gain. If 10% of each request must go through one lock, no number of machines makes it more than ten times faster.
- **Coordination cost:** when machines must agree with each other, the cost grows with the number of machines. Past some point, more machines make the system slower. Neil Gunther's Universal Scalability Law models this.

For this reason, the standard moves below try to remove shared state, not only to add copies.

## Where systems run out

The application servers are almost never the limit, because they are easy to copy. The limit is usually one of these:

1. **The database.** It is the hardest part to copy. See [Replication and partitioning](/learn/scaling-data).
2. **A shared resource:** a lock, a counter, one queue, one partition with a hot key.
3. **An external provider** with a rate limit.
4. **A slow path that holds resources.** See [Design for failure](/learn/resilience).

Find the limit with numbers before you design around it. See [Capacity estimation](/learn/estimation).

### Capacity, in the view of Release It!

Nygard treats capacity as a production property that you must plan, test, and watch (Release It!). Two of his antipatterns apply directly. See [Stability antipatterns](/learn/stability-antipatterns).

- **Unbalanced capacities.** A front end with 600 threads calls a back end that can handle 60 requests at the same time. A burst on the front end overloads the back end. Test the back end at the load the front end can send, not the load you expect.
- **Scaling effects.** A design that works with 2 servers can fail with 20. If each server talks to each other server, the number of connections grows with the square of the servers.

Run each server well below 100% of its capacity. As a server approaches its limit, the time requests wait in its queue rises sharply, not in proportion. A rough rule is to plan for peaks at about 60 to 70% of capacity.

## The standard moves

| Problem                                   | Move                                         |
| ----------------------------------------- | -------------------------------------------- |
| The same data is read many times          | [Cache](/learn/caching)                      |
| Reads overload the database               | Read from followers                          |
| Large files slow the servers              | Object storage and a CDN                     |
| Work makes the user wait                  | Do it [in the background](/learn/sync-async) |
| Load arrives in bursts                    | A queue in front of workers                  |
| A read is a heavy calculation             | Prepare the result at write time             |
| The data is too large for one server      | Partition                                    |
| One part has much more load than the rest | Make it a separate deployment                |

Each move adds complexity. Apply them in the order that the numbers require, not all at once.

Xu walks through these moves in order, from one server to millions of users (System Design Interview, the part on scaling from zero to millions). The page [Scale step by step](/learn/scale-step-by-step) follows that path with an example of its own. In an interview, this order is a good default story. Change it when the numbers show a different limit first.

### Elasticity in practice

Automatic scaling adds and removes copies by a metric. It helps only when certain conditions are true.

- New copies must start fast. A copy that takes 10 minutes to start misses a burst of 5 minutes.
- Scale on a metric that rises before the users suffer: the depth of a queue, or requests in progress. CPU is often too late.
- The database must accept the new copies. Each new copy opens connections, and a database has a limit.
- For a known peak, add capacity before it, on a schedule.

When capacity cannot follow, protect the system instead: a waiting room, a queue, or [load shedding](/learn/resilience). The [Front Row kata](/kata/front-row) and the [Waiting Room kata](/kata/waiting-room) are about this.

## Measure the slow requests

An average hides the problem. If the average is 100 milliseconds and one request in a hundred takes 5 seconds, a user who loads a page with 50 requests meets a slow one often. Measure percentiles: "99% of requests finish in less than 300 milliseconds".

### Percentiles

Sort the response times. The **median**, or p50, is the time in the middle: half of the requests are faster. The **p99** is the time that 99% of requests are faster than. The slow end of the distribution is the **tail**.

| Percentile | What it tells you                                           |
| ---------- | ----------------------------------------------------------- |
| p50        | The typical experience                                      |
| p95, p99   | The experience of the slow requests. Common targets in SLOs |
| p99.9      | The worst normal cases. Often the users with the most data  |

Kleppmann notes that the slowest requests often come from the most valuable users. A customer with many orders has the slowest order page. Do not ignore the tail because it is "only 1%".

### Tail latency amplification

When one user request needs many calls to back-end parts, it waits for the slowest call. Kleppmann calls this **tail latency amplification**.

Suppose each back-end call is slow 1% of the time. The chance that a request with several calls meets at least one slow call:

| Calls in one request | Chance of at least one slow call |
| -------------------- | -------------------------------- |
| 1                    | 1%                               |
| 10                   | about 10%                        |
| 50                   | about 40%                        |
| 100                  | about 63%                        |

The calculation is 1 − 0.99ⁿ. With 100 calls, the p99 of each part becomes nearly the median of the user request. Ways to reduce it:

- Call fewer parts, or call them in parallel, not in sequence.
- Send a **hedged request**: if a call does not answer within its p95 time, send a second copy to another server and take the first answer.
- Give a partial answer after a deadline, without the slowest part.

### Head-of-line blocking

A server can handle only a few requests at the same time. A few slow requests at the front of its queue make all the requests behind them wait, even fast ones. This is **head-of-line blocking**. It is the reason that one slow type of request can make a whole service slow. Give slow work its own pool or queue. See [Design for failure](/learn/resilience).

### How to measure

- Measure the response time on the client side, because queueing delays are not visible inside the server.
- A load test must send requests at a fixed rate, and not wait for each answer. Otherwise a slow server slows the test, and the test hides the delay.
- Do not average percentiles across servers or across minutes. The result is not a percentile. Combine histograms instead.

## In a kata

Do not design for a load the problem does not state. For the load it does state, name the part that reaches its limit first, and the move you use.

State the load parameters first: "about 2,000 reads per second at peak, 20 writes per second, fan-out of up to 50,000 for a large account". Then name the first limit and the move. In the [News Feed kata](/kata/news-feed), the fan-out decides the design. In the [Link Shortener kata](/kata/link-shortener), the reads are a hundred times the writes, so a cache does most of the work.

## Interview questions

**"Why do you measure p99 and not the average?"**

- The average hides the slow requests. Two different distributions can have the same average.
- Users meet the tail, more so when one page makes many calls.
- The slow requests often come from the largest customers.

**"What is the difference between scalability and elasticity?"**

- Scalability: handle a larger load as it grows, by adding resources.
- Elasticity: follow a sudden burst, up and down, in minutes.
- Elasticity needs fast start, stateless servers, and a database that accepts the new load.

**"Your service has a p99 of 2 seconds, but the median is 50 ms. How do you find the cause?"**

- Look at which requests are slow: by type, by customer, by server.
- Common causes: a large customer, a garbage collection pause, a slow dependency, head-of-line blocking.
- Use traces to see where the time goes in a slow request.

**"A page calls 40 back-end services. How do you keep it fast?"**

- Tail latency amplification: the slowest call decides.
- Call in parallel, reduce the calls, or prepare a combined result at write time.
- Hedged requests for the slow tail, and a deadline with a partial answer.

**"How do you scale a system that is mostly writes?"**

- Reads have caches and followers. Writes need partitioning.
- Select a partition key that spreads writes and keeps each request in one partition.
- Put a queue in front to smooth bursts, and batch the writes.

## Go deeper

- **Designing Data-Intensive Applications**, Martin Kleppmann, the part on scalability: load parameters, percentiles, tail latency amplification, and shared-nothing scaling.
- **Fundamentals of Software Architecture**, Mark Richards and Neal Ford, the parts on characteristics and on space-based architecture: scalability compared with elasticity, and the styles that give each.
- **System Design Interview**, Alex Xu, the part on scaling from zero to millions of users: the standard moves in order.
- **Release It!**, Michael Nygard, the part on stability antipatterns: unbalanced capacities and scaling effects, and why capacity is a production concern.
- **Site Reliability Engineering**, Beyer and others, the part on monitoring: why percentiles, and not averages, belong in service levels.

## Further reading

- [Scalability](https://en.wikipedia.org/wiki/Scalability) and [Load balancing](<https://en.wikipedia.org/wiki/Load_balancing_(computing)>) on Wikipedia
- [Little's law](https://en.wikipedia.org/wiki/Little%27s_law) and [Amdahl's law](https://en.wikipedia.org/wiki/Amdahl%27s_law) on Wikipedia
- [The Tail at Scale](https://research.google/pubs/the-tail-at-scale/), by Jeffrey Dean and Luiz André Barroso
