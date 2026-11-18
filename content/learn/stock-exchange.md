## The question

Try the [Stock Exchange kata](/kata/stock-exchange) before you read this page.

"Design an electronic stock exchange. Brokers send buy and sell orders for their clients. The exchange matches buyers with sellers, reports each trade, and publishes market data to everyone at the same time."

Most cases on this site scale out: more servers, more partitions, more copies. This case goes the other way. The core of an exchange runs on one thread on one server, because the fastest network hop is the one that does not exist. The hard parts are order, latency, fairness, and recovery. The vocabulary that interviewers expect: order book, price-time priority, sequencer, determinism, critical path, event sourcing, hot-warm failover, and market data.

## Questions to ask first

| Question                                   | Why it changes the design                                                                                |
| ------------------------------------------ | -------------------------------------------------------------------------------------------------------- |
| Which instruments, and how many?           | Each symbol has its own order book. Symbols are independent, so they can be split over matching engines. |
| Which order types?                         | Limit and market orders are the base. Stop orders and others add state and rules.                        |
| Who connects: brokers only, or the public? | Brokers only means a few hundred known clients with fixed connections and their own rate limits.         |
| What latency is required?                  | Milliseconds allows a normal service design. Microseconds forces one server and one thread.              |
| Which trading hours?                       | Fixed hours give a quiet window each night for maintenance, snapshots, and checks.                       |
| What risk checks?                          | Checks on each order add work to the critical path. They must be fast.                                   |
| Who settles the trades?                    | Usually a separate clearing house. The exchange reports trades and does not move the money itself.       |

For this page, assume: shares only, limit and market orders, cancels, brokers as the only clients, trading from 9:30 to 16:00, and settlement by a separate party.

Non-functional requirements:

- **Correctness and fairness:** orders are matched in a strict, provable order. Every participant sees market data at the same moment.
- **Latency:** low and, above all, stable. The p99 latency matters more than the average, because the slowest orders are where the money is lost.
- **Availability:** the exchange must not stop during trading hours. A failover takes seconds at most, and loses no accepted order.
- **Auditability:** every order and every trade can be replayed for regulators.

## Estimates

Rough numbers, my own. See [Estimation](/learn/estimation) for the method.

- 3,000 symbols.
- 1.5 billion order messages a day: new orders, cancels, and changes. Most orders are cancelled, not filled.
- Trading hours: 6.5 hours, or 23,400 seconds. 1.5 billion ÷ 23,400 ≈ 64,000 messages each second on average.
- Peak: the open and the close bring bursts of about ten times the average: roughly 640,000 messages each second.
- Event log: about 100 bytes for each message gives 150 GB a day.
- Latency budget: rough orders of magnitude. A network round trip inside a data center, through a normal network stack, takes some hundreds of microseconds. A read from main memory takes about 100 nanoseconds. A matching step on data in the CPU cache takes far less than a microsecond.

640,000 messages each second is not large for a cluster. It is large for one thread, which has about 1.5 microseconds for each message. **One extra network hop costs more than the whole matching step. That fact decides the architecture.**

## The first design

```diagram
{
  "nodes": [
    { "id": "broker", "label": "Broker\n(client of the\nexchange)", "shape": "external", "col": 0, "row": 0 },
    { "id": "gw", "label": "Client gateway\n(auth, checks,\nrate limit)", "shape": "box", "col": 1, "row": 0 },
    { "id": "om", "label": "Order manager\n(risk, wallet,\norder state)", "shape": "box", "col": 2, "row": 0 },
    { "id": "seq", "label": "Sequencer", "shape": "box", "col": 3, "row": 0 },
    { "id": "me", "label": "Matching engine\n(order books)", "shape": "box", "col": 3, "row": 1.2 },
    { "id": "log", "label": "Event store\n(memory-mapped)", "shape": "store", "col": 2, "row": 1.2 },
    { "id": "mdp", "label": "Market data\npublisher", "shape": "box", "col": 1, "row": 2.4 },
    { "id": "subs", "label": "Market data\nsubscribers", "shape": "external", "col": 0, "row": 2.4 },
    { "id": "rep", "label": "Reporter", "shape": "box", "col": 3, "row": 2.4 },
    { "id": "db", "label": "Trade DB", "shape": "store", "col": 2, "row": 2.4 }
  ],
  "groups": [{ "id": "crit", "label": "Critical path, one server", "col": 1, "row": 0, "cols": 3, "rows": 2 }],
  "edges": [
    { "from": "broker", "to": "gw", "label": "orders (FIX)", "both": true },
    { "from": "gw", "to": "om" },
    { "from": "om", "to": "seq" },
    { "from": "seq", "to": "me", "label": "numbered\norders" },
    { "from": "me", "to": "log", "label": "executions" },
    { "from": "log", "to": "om", "label": "fills" },
    { "from": "log", "to": "mdp", "async": true },
    { "from": "mdp", "to": "subs", "label": "multicast", "async": true },
    { "from": "log", "to": "rep", "async": true },
    { "from": "rep", "to": "db" }
  ]
}
```

The order flow, from left to right:

- **The broker** is a bank or a trading firm with a membership. It sends orders for its clients, often with the FIX protocol, a standard message format for trading.
- **The client gateway** is the door. It authenticates the broker, checks that each message is well formed, applies rate limits, and converts the message to the internal format. It does as little as possible, because it is on the critical path.
- **The order manager** runs the risk checks, holds the funds for each order in the broker's wallet, and keeps the state of each order: new, partly filled, filled, cancelled, or rejected.
- **The sequencer** gives each order a sequence number, so that every later step agrees on one order of events.
- **The matching engine** keeps an order book for each symbol and matches buy orders with sell orders. Each match produces an **execution**, also called a fill: a trade of a quantity at a price.
- **The market data publisher** builds market data from the executions and the order book changes, and sends it to subscribers.
- **The reporter** writes each order and each trade to a database, for clearing, settlement, and regulators. It is off the critical path.

The **critical path** is gateway, order manager, sequencer, and matching engine, and back with the fills. Everything else consumes the event stream and can lag a little.

## Deep dives

### The order book and price-time priority

An **order book** is the list of all open orders for one symbol. It has two sides:

- **Bids**: buy orders, best first, so the highest price first.
- **Asks**: sell orders, best first, so the lowest price first.

The **spread** is the gap between the best bid and the best ask. A trade happens when a new order crosses the spread.

**Price-time priority** decides who trades first: the best price first, and at the same price, the order that arrived first. "Arrived" means the sequence number, not a clock.

An example, with my own numbers, for a fictional symbol PRCL:

| Side | Price | Orders in queue (oldest first) |
| ---- | ----- | ------------------------------ |
| Ask  | 20.03 | 300                            |
| Ask  | 20.02 | 100, 400                       |
| Bid  | 20.00 | 200, 500                       |
| Bid  | 19.99 | 1,000                          |

A buy limit order arrives: 600 shares at 20.02.

1. The best ask is 20.02, which is not above the limit. Match the oldest order there: 100 shares at 20.02.
2. Then the next order at 20.02: 400 shares at 20.02. 100 shares are still wanted.
3. The next ask is 20.03, above the limit. Stop.
4. The remaining 100 shares rest in the book as a new bid at 20.02, the new best bid.

The result: two executions, and the order is partly filled, then open for the rest. A **market order** has no limit price. It takes the best prices until it is filled, which is risky in a thin book.

**The data structure.** The engine must add, cancel, and match in constant or near-constant time:

- Each **price level** keeps a queue of its orders, as a doubly linked list, so that the oldest is at the head.
- A sorted structure, or an array indexed by price tick, finds the level for a price. The best bid and best ask are kept as direct pointers.
- A hash map from order ID to its node in the list makes a cancel O(1): unlink the node, with no search.

Prices are integers in the smallest tick, such as cents. Never use floating-point numbers for prices.

### The sequencer and determinism

Many brokers send orders at the same moment. The exchange needs one agreed order of events, or price-time priority means nothing. The **sequencer** gives that order:

- It stamps each inbound order with the next sequence number, before the matching engine sees it.
- It stamps each outbound execution as well, so that every consumer sees the outputs in one order.
- A consumer that sees number 1,041 after number 1,039 knows that it missed one, and can ask for it again. Gaps are found at once.

The sequencer is a single writer of a [total order](/learn/consensus#total-order-broadcast). There is one for each matching engine, not one for the whole exchange.

The matching engine must be **deterministic**: the same sequence of inputs always gives the same outputs and the same state. That rules out the wall clock, random numbers, and any effect of thread timing inside the engine. Time comes from the sequenced events, not from the server. Determinism is what makes replay, recovery, and the hot-warm pair below possible.

### The critical path and low latency

In a normal design, each box in the diagram is a service, and each arrow is a network call. That adds hundreds of microseconds for each hop, and the jitter of queues, kernels, and garbage collection. For an exchange, the design changes:

1. **One server.** Put the gateway, the order manager, the sequencer, and the matching engine on one server. There are no network hops on the critical path, except the one from the broker.
2. **Memory-mapped files for messages.** The components talk through an event store in shared memory: a file mapped into the memory of each process. A writer appends a message, and readers read it from memory. There are no system calls and no copies on the hot path.
3. **An application loop on one thread.** Each component runs a loop that polls for the next message and handles it, without stopping. The loop runs on one thread, so the order book needs no locks.
4. **Pinned to a core.** Each thread is pinned to its own CPU core. The operating system does not move it, and no other work runs on that core. There are no context switches, and the data stays in the CPU cache.
5. **No pauses.** Allocate memory at the start and reuse it. In a language with garbage collection, allocate nothing on the hot path. Measure the p99 and the maximum, not only the average.

Busy polling uses 100% of a core even when nothing happens. That is the price of no wake-up delay.

This is the idea of the LMAX architecture that Martin Fowler describes: business logic on one thread, all in memory, with input and output through ring buffers. It is also actual serial execution (see [Serializable isolation](/learn/transactions-isolation#serializable-isolation)) taken to its limit. One thread handles all writes for its symbols, so no concurrency control is needed.

To scale, split by symbol. Symbols are independent, so several matching engines each own a set of symbols, each with its own sequencer. Move a very busy symbol to its own engine.

### Event sourcing for recovery

The matching engine keeps all state in memory. A crash loses it. The answer is [event sourcing](/learn/cqrs-event-sourcing#event-sourcing): the sequenced log of input events is the source of truth, and the state is derived from it.

1. Every inbound order, cancel, and change is written to the event store with its sequence number, before or as the engine handles it.
2. The engine's state is the result of replaying all events of the day in order.
3. To recover, a new engine reads the log from the start and replays it. Because the engine is deterministic, it reaches exactly the same state.
4. Snapshots of the order books at intervals make recovery faster: load the latest snapshot, then replay only the events after it. See [Snapshots](/learn/cqrs-event-sourcing#snapshots).

The log also answers regulators: the full day can be replayed, order by order, and gives the same trades.

### The hot-warm matching engine and failover

Replay from the start of the day is too slow during trading. So the exchange runs two or more engines on separate servers:

- **The hot engine** reads the sequenced events, matches, and publishes the executions.
- **The warm engine** reads the same events in the same order and computes the same state. It publishes nothing.

When the hot engine fails, the warm one already has the state up to the last event it received. It becomes hot and continues from the next sequence number. Determinism is what makes the two states equal.

Who decides that the hot engine is dead? A wrong decision gives two hot engines, and two sets of trades for the same orders. Use a cluster of an odd number of servers, for example 5, with a consensus protocol such as Raft. The leader is the hot engine. An event counts as committed when a majority has written it, and only committed events are matched. A leader that loses the majority must stop. See [What consensus guarantees](/learn/consensus#what-consensus-guarantees) and [Leases and fencing tokens](/learn/clocks-and-failures#leases-and-fencing-tokens).

The cost: each event must reach a majority before it is matched, which adds a network round trip to the critical path. Exchanges accept this cost, with fast networks between the servers in one data center, because a lost or doubled trade is far worse. Keep a separate copy of the log in another data center for disaster recovery.

### Market data distribution and fairness

The market data publisher turns executions and book changes into views:

| Level | What it shows                                                    |
| ----- | ---------------------------------------------------------------- |
| L1    | Best bid and best ask, with their quantities, and the last trade |
| L2    | The depth: total quantity at each price level                    |
| L3    | Each order in the book                                           |

It also builds **candlestick** data: the open, high, low, and close price and the volume for each interval, such as one minute. Keep recent candles in ring buffers in memory, and write old ones to storage.

**Fairness.** A subscriber who sees an update earlier can trade on it first. So all subscribers must get each update at the same time:

- **Multicast.** One UDP packet goes to all subscribers of a group at once, not one TCP stream for each subscriber in turn. Add sequence numbers so that receivers find a lost packet, and a separate service to send missed packets again.
- **No order of preference.** With TCP streams, the first subscriber in the list always gets the data first. Avoid any such order.
- **Colocation.** Exchanges rent space for subscriber servers in their own data center, often with equal cable lengths, so that no one is physically closer.

Market data is off the critical path. The publisher reads from the event store and can lag by microseconds without delaying matching.

### Risk checks

The order manager checks each order before the sequencer accepts it:

- **Order limits:** maximum quantity and maximum value for one order. This stops a mistyped order, a "fat finger".
- **Price bands:** refuse a limit price too far from the last trade.
- **Funds and positions:** the broker's wallet must hold enough money for a buy, or enough shares for a sell. The order manager holds that amount while the order is open, and releases it on a cancel or a fill.
- **Rate and exposure limits** for each broker, and a **kill switch** that cancels all orders of a broker at once.

Above these, exchanges halt trading in a symbol, or in the whole market, when prices move too far too fast. These halts are often called circuit breakers.

Each check must be a lookup in memory, measured in nanoseconds. A check that calls a database has no place on the critical path.

## Trade-offs and alternatives

| Decision               | This design                           | Alternative                           | When the alternative wins                                            |
| ---------------------- | ------------------------------------- | ------------------------------------- | -------------------------------------------------------------------- |
| Deployment of the core | One server, shared memory, one thread | Separate services with network calls  | A venue where milliseconds are fine, such as a small crypto exchange |
| Concurrency            | One thread for each set of symbols    | Many threads with locks on the book   | Never for the book. Locks add jitter and break determinism           |
| Durability             | Sequenced event log, plus snapshots   | A database transaction for each order | Low volume, where simple storage matters more than latency           |
| Failover               | Hot-warm engines with consensus       | Cold standby that replays the log     | Venues that can stop for minutes                                     |
| Market data            | Multicast UDP with gap recovery       | A TCP stream for each subscriber      | Few subscribers, or public delayed data                              |
| Scaling                | Split by symbol                       | Split one book over many servers      | Never. One book needs one order of events                            |

The central trade-off is horizontal scale against latency and determinism. A normal system adds servers. An exchange removes hops, removes threads, and removes nondeterminism, and scales by giving each engine its own symbols.

## What interviewers probe

**"Why not microservices with a message broker?"**

- Each network hop costs hundreds of microseconds, more than the whole match.
- Brokers and queues add jitter, which hurts the p99.
- One server, shared memory, and one thread for the book remove both.

**"How do you guarantee fairness in matching?"**

- One sequencer gives one total order before the engine.
- Price-time priority by sequence number, not by clock.
- A deterministic engine, so a replay gives the same trades.

**"The matching engine crashed. What now?"**

- The warm engine has the same state, from the same events.
- Consensus decides the new leader, and the old one must stop.
- The event log and snapshots rebuild any other copy.

**"How is market data fair to all subscribers?"**

- Multicast: one packet to all at once.
- Sequence numbers and a retransmit service for lost packets.
- Colocation with equal cables.

**"Where do the risk checks go, and how fast are they?"**

- In the order manager, before the sequencer.
- In memory only: limits, price bands, wallet holds.
- A kill switch for each broker, and halts for the market.

## Go deeper

- System Design Interview (Alex Xu and Sahn Lam), Volume 2, the chapter on a stock exchange: the order flow, the sequencer, the order book, the low-latency design on one server, and hot-warm failover.
- Designing Data-Intensive Applications (Martin Kleppmann), the part on transactions: actual serial execution on one thread, and when it is practical.
- DDIA, the part on consistency and consensus: total order broadcast, and why a log with one order is the same problem as consensus.
- DDIA, the part on stream processing: the log as the source of truth, state as a replay of events, and derived views.
- Release It! (Michael Nygard), the part on stability patterns: fail fast, and why a slow response hurts more than an error.

## Further reading

- [The LMAX Architecture](https://martinfowler.com/articles/lmax.html) by Martin Fowler
- [Order book](https://en.wikipedia.org/wiki/Order_book) and [Financial Information eXchange](https://en.wikipedia.org/wiki/Financial_Information_eXchange) on Wikipedia
- [Event sourcing](https://martinfowler.com/eaaDev/EventSourcing.html) by Martin Fowler
- [Consensus](/learn/consensus) and [CQRS and event sourcing](/learn/cqrs-event-sourcing) in this wiki
