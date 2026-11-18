## The problem it solves

Most web systems have the same limit. You can add web servers and application servers in minutes. The database is harder to grow. During a sudden peak, the extra servers all wait on one database, and the full system slows down.

Space-based architecture removes the database from the path of each request. Richards and Ford take the name from the idea of a **tuple space**: a shared memory that many parallel processors read and write (Fundamentals of Software Architecture, the part on space-based architecture). The working data lives in memory, in replicated caches inside the application. The database is still there, but it is updated later, in the background.

The style is complex and expensive. It is worth its cost only when the load is very high and very variable: thousands of users one minute, millions the next.

## The parts

```diagram
{
  "nodes": [
    { "id": "users", "label": "Buyers", "shape": "person", "col": 0, "row": 0 },
    { "id": "msg", "label": "Messaging grid\n(routing, sessions)", "shape": "box", "col": 1, "row": 0 },
    { "id": "dm", "label": "Deployment manager\n(start and stop units)", "shape": "box", "col": 3, "row": 0 },
    { "id": "pu1", "label": "Processing unit\n(code + cache)", "shape": "box", "col": 0.5, "row": 1.3 },
    { "id": "pu2", "label": "Processing unit\n(code + cache)", "shape": "box", "col": 1.5, "row": 1.3 },
    { "id": "pu3", "label": "Processing unit\n(code + cache)", "shape": "box", "col": 2.5, "row": 1.3 },
    { "id": "pump", "label": "Data pump\n(persistent queue)", "shape": "pipe", "col": 1.5, "row": 2.6 },
    { "id": "writer", "label": "Data writer", "shape": "box", "col": 0.5, "row": 3.7 },
    { "id": "reader", "label": "Data reader", "shape": "box", "col": 2.5, "row": 3.7 },
    { "id": "db", "label": "Database", "shape": "store", "col": 1.5, "row": 4.8 }
  ],
  "groups": [{ "id": "grid", "label": "Data grid (replicated caches)", "col": 0.5, "row": 1.3, "cols": 3, "rows": 1 }],
  "edges": [
    { "from": "users", "to": "msg" },
    { "from": "msg", "to": "pu2" },
    { "from": "dm", "to": "grid", "label": "scale" },
    { "from": "pu1", "to": "pu2", "label": "replicate", "both": true },
    { "from": "grid", "to": "pump", "label": "changes", "async": true },
    { "from": "pump", "to": "writer", "async": true },
    { "from": "writer", "to": "db" },
    { "from": "db", "to": "reader" },
    { "from": "reader", "to": "grid", "label": "load on start", "async": true }
  ]
}
```

### Processing units

A **processing unit** holds the application logic and an in-memory copy of the data it needs. It can hold the full application, or only one part, such as seat selection. A system often has several kinds of unit, each with its own code and its own named cache.

Each unit also has a **replication engine**, usually from the caching product. When a unit changes an item in its cache, the engine sends the change to the other units that hold the same named cache. Products such as Hazelcast, Apache Ignite, and Oracle Coherence give this.

### Virtualized middleware

The **virtualized middleware** controls the units. It has four parts:

| Part               | Job                                                                                        |
| ------------------ | ------------------------------------------------------------------------------------------ |
| Messaging grid     | Receives each request, keeps the session state, and sends the request to an available unit |
| Data grid          | Keeps the caches of the units in step. In most products, it lives inside the units         |
| Processing grid    | Optional. Coordinates a request that needs several kinds of unit, as a mediator            |
| Deployment manager | Watches the load. Starts units when the load grows, and stops them when it falls           |

The messaging grid is often a web server with a load balancer. The deployment manager is often the autoscaler of the platform, driven by the request rate or the response time.

### Data pumps

A **data pump** carries each change from a unit to the database. It is always asynchronous: the unit does not wait for the database. It is usually a persistent message queue, so a change is not lost if a part fails, and changes arrive in order.

A system has several pumps, usually one for each domain or each kind of change: one for seat holds, one for orders, one for customer profiles. Each pump has a contract: the format of the message it carries.

### Data writers

A **data writer** takes the messages from a pump and writes them to the database. A writer can serve one domain, or one kind of processing unit. Several writers can run in parallel if the order of changes for one item is kept.

### Data readers

A **data reader** reads from the database and sends the data to the units, through a reverse pump. A reader runs in three cases:

1. All units of one named cache crash at the same time, so no unit has the data in memory.
2. All units of one named cache are redeployed at the same time.
3. A unit needs archive data that is not in the cache.

When one new unit starts and other units are up, it gets its data from them, not from the database. The reader is necessary only when no copy is in memory.

Writers and readers form a **data abstraction layer**. The units know only the message contracts. They do not know the tables. The team can change the schema with changes to the writers and readers only.

## How a request moves

Take a concert ticket seller at the start of a major on-sale.

1. A buyer selects a seat. The messaging grid sends the request to one seat-selection unit.
2. The unit checks its in-memory seat map. The seat is free.
3. The unit marks the seat as held, in its cache. It answers the buyer at once.
4. The replication engine sends the change to the other seat-selection units, in milliseconds.
5. The unit puts "seat held" on the data pump.
6. A data writer takes the message and updates the seat table, some time later.

The database is not in the path from step 1 to step 3. The database can be seconds behind during the peak. It catches up when the load falls.

## Data collisions

A **data collision** occurs when two units change the same item before the replication reaches the other. Each unit then has a different value, and one change is lost.

Example: two units each see 1 seat left in row K. Each sells it within the same few milliseconds. Each tells the other. Now both have a buyer for the same seat.

Richards and Ford give a rough model of how often this occurs. The idea is:

**Collision rate ≈ N × (U² ÷ S) × L**

- **N** is the number of units that hold the same named cache.
- **U** is the total number of updates each second to that cache.
- **S** is the number of items in the cache.
- **L** is the replication latency, in seconds.

What the model tells you:

- **Collisions grow with the square of the update rate.** Twice the updates give roughly four times the collisions.
- **More units give more collisions.** Elastic scale has a cost.
- **A larger cache gives fewer collisions,** because updates spread over more items.
- **Faster replication gives fewer collisions.** Replication latency depends on the network and the product.

A worked example with rough, invented numbers: 4 units, 50 updates each second, 20,000 items, and 100 ms of replication latency. The rate is 4 × (2,500 ÷ 20,000) × 0.1 = 0.05 collisions each second, roughly 180 each hour. That is 180 of 180,000 updates, roughly 0.1%. With 10 ms of latency, it falls to roughly 18 each hour.

For tickets, 18 double sales each hour is still too many. You must remove the collision, not only make it rare:

- **Route all updates of one item to one unit.** All requests for one section of the venue go to the same unit. That unit is the only writer for those seats.
- **Use a distributed cache** for the data that must never collide. See the next section.
- **Detect and repair.** Keep a version number on each item, and send one buyer to a fallback seat. This is acceptable for some data, not for tickets.

## Replicated or distributed cache

| Criterion         | Replicated cache                            | Distributed cache                                        |
| ----------------- | ------------------------------------------- | -------------------------------------------------------- |
| Where the data is | A full copy inside each unit                | On separate cache servers. Units call them               |
| Speed             | Very fast. No network call                  | Slower. One network call for each access                 |
| Size of the data  | Limited by the memory of one unit           | Can be much larger                                       |
| Update rate       | Poor for a high rate, because of collisions | Good. One copy of each item, so no collisions            |
| Consistency       | Units can disagree for a short time         | One answer for all units                                 |
| Fault tolerance   | High. Each unit has the full data           | Depends on the cache servers. They need their own copies |

A rough rule: use a replicated cache for small data that changes rarely, such as a venue map or a price list. Use a distributed cache for large data, or data with a high rate of updates, such as seat holds. A system can use both, for different named caches.

### Near-cache

A **near-cache** is a hybrid. Each unit keeps a small front cache in memory, with the items it used most recently. Behind it, a distributed cache holds the full data. The front caches are not kept in step with each other.

Richards and Ford advise against a near-cache in this style. Each unit can show a different value for the same item, with no limit on how long. The style needs either full copies kept in step, or one shared copy. See [Caching](/learn/caching#where-a-cache-can-be) for in-process and shared caches in general.

## Cloud and on-premises

The parts of the style do not have to run in the same place. Richards and Ford note a useful option. The processing units and the middleware can run in a public cloud, where they can scale fast and you pay only for the peak. The database can stay in your own data center, for control or for law. The data pumps carry the changes between the two.

The reverse is also possible. The units run on your own servers, and the data goes to a managed database in the cloud.

## How the style handles each characteristic

| Characteristic  | How the style handles it                                                  |
| --------------- | ------------------------------------------------------------------------- |
| Elasticity      | Very good. Units start and stop with the load, in seconds                 |
| Scalability     | Very good, up to the limits of the cache and of replication               |
| Performance     | Very good. Reads and writes are in memory                                 |
| Fault tolerance | Good. A unit can fail, and the others have the data                       |
| Consistency     | Weak. Collisions, and a database that is behind                           |
| Testability     | Weak. A real test needs the real peak load, which is expensive to make    |
| Simplicity      | Weak. Caching products, replication, pumps, and writers are all new parts |
| Cost            | High. Memory, licenses for some caching products, and specialist skills   |

## Common mistakes

- **Using it for steady load.** If the load is predictable, a normal cache in front of a database is enough.
- **A data set too large for memory.** A replicated cache that does not fit forces a distributed cache, and the main gain of the style falls.
- **Ignoring collisions.** The design assumes that replication is instant. It is not.
- **Reports from the cache.** Analytics and reports belong on the database or a separate store, not on the units.
- **A data pump without persistence.** A unit crashes, and changes that were not yet written are lost.

## How it fails

- **The pump backlog grows.** The writers are slower than the peak, and the database falls further behind. Watch the age of the oldest message. Plan for the database to catch up after the peak.
- **All units of one cache fail.** The data reader must load the full cache from the database. Until it finishes, the units cannot serve. The database must be up to date enough for this.
- **A split network.** Two groups of units each believe they are the full set, and both accept changes. Use the protection of the caching product for this, and test it.
- **Memory is full.** A unit stops or drops items. Size each named cache, and alert well before the limit.

## Examples

**Concert ticketing.** A major tour goes on sale. Traffic rises from thousands to millions of buyers in a minute. The seat map and the seat holds live in memory. Each section of the venue is owned by one unit, to prevent double sales. The payment step and the ticket issue can use a normal service and database, because their load is smaller and slower.

**Online auctions.** A live auction gets a burst of bids in the last seconds. Each auction lives in one unit, which is the only writer for it. The unit orders the bids in memory, and decides the highest bid at once. The bids go to the database through a data pump, for the legal record. The pump must be persistent, so no bid is lost.

## Compared with its neighbors

|                    | Normal service and cache        | Space-based                      | Event-driven                    |
| ------------------ | ------------------------------- | -------------------------------- | ------------------------------- |
| Request path       | Service, then cache or database | Processing unit, in memory only  | Producer, then broker           |
| Database role      | The source of each answer       | Updated later, in the background | Each processor owns its data    |
| Answer to the user | Certain, after the database     | Fast, from memory                | Fast acknowledgment, work later |
| Best for           | Steady load                     | Extreme, sudden peaks            | Bursts of independent reactions |

## In a kata

- In [Front Row](/kata/front-row), the jump from 5,000 to 2 million buyers is the classic case. A strong answer keeps the seat map in memory, routes each section to one unit, and names the collision risk. It keeps payment and ticket issue outside the space-based part.
- In [Gavel](/kata/gavel), traffic is near zero between auctions and very high during them. Elastic units fit this. The legal audit needs a persistent data pump.

Most of a design does not need this style. Use it for the one part with the extreme peak, and say why.

## Interview questions

**"How does space-based architecture take the database out of the request path?"**

- Processing units hold the data in memory, in replicated caches.
- Each change goes to the database later, through an asynchronous data pump and a data writer.
- Data readers load the caches from the database only when no unit has the data.

**"What is a data collision, and how do you reduce it?"**

- Two units change the same item before replication reaches the other.
- The rate grows with the number of units, the square of the update rate, and the replication latency. It falls with the cache size.
- Route each item to one unit, use a distributed cache for hot data, or detect and repair with versions.

**"Replicated or distributed cache?"**

- Replicated: fastest, fault tolerant, but limited by memory and poor for high update rates.
- Distributed: consistent and large, but a network call for each access.
- Use each for different data in the same system.

**"When would you not use this style?"**

- Steady load, large relational data, or strict consistency on each read.
- A team that cannot afford the complexity and the load testing.

## Go deeper

- **Fundamentals of Software Architecture** (Richards, Ford), the part on space-based architecture: the parts of the middleware, data pumps, writers and readers, collisions, and the cache options.
- **Designing Data-Intensive Applications** (Kleppmann), the parts on replication and on partitioning: why copies disagree, and how to route each key to one owner.
- **Release It!** (Nygard), the parts on stability antipatterns and stability patterns: how systems fail under sudden peaks, and how to shed load.

## Further reading

- [Space-based architecture](https://en.wikipedia.org/wiki/Space-based_architecture) on Wikipedia
- [Tuple space](https://en.wikipedia.org/wiki/Tuple_space) on Wikipedia
