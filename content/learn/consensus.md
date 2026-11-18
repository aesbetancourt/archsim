## Why agreement matters

Many designs need several nodes to agree on one fact. Which node is the leader? Who holds the lock? Did this seat go to buyer A or to buyer B? Did all parts of this transaction commit?

On one machine, the answer is simple: read the memory. In a distributed system, nodes fail, messages are delayed, and clocks disagree, as [Partial failure, clocks, and pauses](/learn/clocks-and-failures) shows. **Consensus** is the problem of making several nodes agree on a value in spite of these faults, such that no node later changes its mind.

An architect rarely implements consensus. You use it through a database or a coordination service, such as ZooKeeper or etcd. But you must know three things:

- Which guarantees your design needs, and which ones the selected tools give.
- What these guarantees cost in latency and availability.
- Where to use a coordination service, and where it is the wrong tool.

Kleppmann covers this in DDIA, in the part on consistency and consensus.

## Linearizability

**Linearizability** is the strongest common guarantee for a replicated store. The system behaves as if there is only one copy of the data, and each operation takes effect at one moment between its start and its end.

The practical meaning is a **recency guarantee**. After one client sees a new value, every later read by any client returns that value or a newer one. No client sees the old value again.

Example: a ticket seller replicates the seat table to three nodes. Buyer A reads seat 14C as "sold" from one replica. Buyer B starts a read after that, from another replica, and gets "free". This system is not linearizable. The two buyers saw the system go back in time.

Do not confuse linearizability with serializability:

| Term            | Applies to                              | Promise                                                      |
| --------------- | --------------------------------------- | ------------------------------------------------------------ |
| Serializability | Transactions that touch several objects | The result is equal to some serial order of the transactions |
| Linearizability | Reads and writes of one object          | Each read returns the most recent write, in real time        |

A database that gives both is called **strictly serializable**. See [Isolation levels and their anomalies](/learn/transactions-isolation) for serializability.

### Where you need it

- **A lock or a leader.** All nodes must agree on who holds it. Two leaders at the same time is called **split brain**, and it corrupts data.
- **A uniqueness rule.** One username for each account, one buyer for each seat, never below zero stock. The check and the write must see the latest state.
- **Two channels that race.** A payment service writes a refund to the database, then sends a message to the email service. The email service reads the refund from a replica that is behind and finds nothing. The message was faster than the replication.

### What gives it

| Replication method                       | Linearizable?                                                                    |
| ---------------------------------------- | -------------------------------------------------------------------------------- |
| One leader, reads from the leader        | It can be, if the system never has two leaders at the same time                  |
| Consensus algorithms                     | Yes. This is how ZooKeeper and etcd implement it                                 |
| Several leaders                          | No. Two leaders accept conflicting writes                                        |
| Leaderless, with quorum reads and writes | Usually not. Clock-based conflict resolution and replication delay both break it |

### Its cost

Linearizability has two costs.

1. **Availability.** During a network partition, a linearizable system must refuse requests on the side that cannot reach the majority. This is the [CAP theorem](/learn/consistency#the-cap-theorem). The replicas that refuse are unavailable, even though they work.
2. **Latency.** Each linearizable operation must coordinate with other nodes, so it is at least as slow as the network round trips. This cost exists even without faults. Many systems give up linearizability for speed, not for fault tolerance.

So use linearizability for the small set of data that needs it, and weaker guarantees for the rest.

## Ordering and causality

Many guarantees are really about order. **Causality** is the order of cause and effect: a question comes before its answer, and a row exists before someone updates it. If event B depends on event A, every node must see A before B.

Two events are **concurrent** when neither depends on the other. Concurrent events have no natural order. So causality gives a **partial order**: some pairs of events have an order, and some do not. Linearizability gives a **total order**: every pair has an order, as if all events occurred on one timeline.

Linearizability implies causality, but causality is a weaker and cheaper promise. Research shows that **causal consistency** can stay available during a network partition, while linearizability cannot. Many systems that seem to need linearizability need only causality.

## Lamport timestamps

To track causality, a system can number events. With one leader, the leader's counter does this. Without one, separate counters do not work: a busy node's numbers grow faster. Clock timestamps fail because of clock skew.

A **Lamport timestamp** is a pair: a counter and a node ID. Leslie Lamport described it in 1978.

1. Each node keeps a counter, and it increments the counter for each event.
2. Each message and each reply carries the counter value of the sender.
3. When a node receives a counter that is higher than its own, it sets its own counter to that value.
4. To compare two timestamps, compare the counters first. If they are equal, the higher node ID wins.

The result is a total order that is consistent with causality. If A caused B, A has the lower timestamp.

But Lamport timestamps are not enough for a rule such as "one buyer for each seat". Two buyers on two nodes each claim the seat. Later, the timestamps tell you which claim was first. But at the moment of the claim, a node cannot know if another node issued a lower timestamp for the same seat. It would have to ask every node, and it cannot wait for a node that is down.

The order must be **final** at the moment of the decision. That needs total order broadcast.

## Total order broadcast

**Total order broadcast** is a protocol that delivers messages to all nodes with two promises:

- **Reliable delivery.** If one node gets a message, all nodes get it.
- **Totally ordered delivery.** All nodes get the messages in the same order.

A node cannot insert a message earlier in the order after later messages were delivered. The order is final. So the protocol is like a log that every node reads in the same order.

Uses:

- **State machine replication.** Each replica applies the same writes in the same order, so all replicas end in the same state. Databases and coordination services work this way.
- **A uniqueness rule.** To claim seat 14C, add "A claims 14C" to the log. Read the log up to that message. If your claim is the first claim for 14C, you have the seat. Every node reaches the same answer.
- **Fencing tokens.** The position of a message in the log is a number that always increases. It works as a fencing token for a lock.

Total order broadcast is equivalent to consensus. With one, you can build the other.

## Two-phase commit

**Two-phase commit (2PC)** makes a transaction commit on several nodes, or abort on all of them. It is an atomic commit protocol. It is not two-phase locking.

1. The application writes data on each participant, inside the transaction.
2. **Prepare.** The coordinator asks each participant: "can you commit?" A participant that answers yes promises to commit later, whatever occurs. It writes the data to disk first.
3. The coordinator decides. If all said yes, it writes "commit" to its own log. This is the point of no return.
4. **Commit.** The coordinator tells each participant to commit. If a participant does not reply, the coordinator retries until it does.

The weak point is the coordinator. If it crashes after the prepare phase, the participants are **in doubt**. They promised to commit, so they cannot abort alone. They also do not know the decision, so they cannot commit. They hold their locks and wait until the coordinator recovers. A crash of one coordinator can block parts of several databases.

The XA standard implements 2PC across databases and message brokers. It is rarely used in service designs, because it couples the services and blocks on failures. Services usually use sagas instead. See [Distributed transactions](/learn/distributed-transactions).

### 2PC compared with consensus

| Point                    | Two-phase commit                                       | Consensus (Raft, Paxos)                         |
| ------------------------ | ------------------------------------------------------ | ----------------------------------------------- |
| Purpose                  | Each participant commits its own part of a transaction | All nodes agree on one value or one log         |
| Votes needed             | All participants must vote yes                         | A majority of nodes must accept                 |
| If one node fails        | The transaction aborts, or it waits                    | The others continue, if a majority is available |
| If the coordinator fails | Participants wait, in doubt                            | The nodes elect a new leader and continue       |

2PC needs every participant, because each one holds different data. Consensus needs only a majority, because each node holds a copy of the same data.

## What consensus guarantees

A consensus algorithm lets nodes propose values and decide on one. It guarantees four properties:

| Property          | Meaning                                          | Kind     |
| ----------------- | ------------------------------------------------ | -------- |
| Uniform agreement | No two nodes decide differently                  | Safety   |
| Integrity         | No node decides twice                            | Safety   |
| Validity          | A decided value was proposed by some node        | Safety   |
| Termination       | Each node that does not crash eventually decides | Liveness |

Termination requires that a **majority** of nodes is working and can communicate. With 3 nodes, the algorithm survives 1 failure. With 5, it survives 2. Safety holds even when a majority is not available. The system then stops, but it does not decide wrongly.

A known result, the FLP result, proves that no deterministic algorithm always terminates in a fully asynchronous system where a node can crash. Real algorithms use timeouts to make progress. When the network is unstable, they can stop for a time, but they stay safe.

### How the algorithms work, at a high level

The common algorithms are Paxos, Raft, Zab (in ZooKeeper), and Viewstamped Replication. They share a structure:

1. **A leader for each term.** Each election starts a new term with a higher number. Raft calls it a term, Paxos a ballot number, and Zab an epoch. Within one term there is at most one leader.
2. **Two kinds of vote.** A majority votes to elect a leader. Then a majority accepts each value that the leader proposes.
3. **Overlap.** Any two majorities share at least one node. So a new leader always learns about values that an old leader got accepted. A leader from an old term cannot get a majority for its proposals.

This is how consensus solves split brain. A node that thinks it is the leader must still get a majority to accept each decision.

### Raft and Paxos

| Point         | Paxos                                                 | Raft                                                                 |
| ------------- | ----------------------------------------------------- | -------------------------------------------------------------------- |
| Origin        | Leslie Lamport, published in 1998                     | Diego Ongaro and John Ousterhout, 2014                               |
| Design aim    | A minimal, proven protocol for agreement on one value | A protocol that is easier to understand and to implement correctly   |
| Log of values | Multi-Paxos, a family of extensions                   | Part of the core algorithm: the leader replicates a log to followers |
| Used in       | Google Chubby and Spanner, among others               | etcd, Consul, CockroachDB, TiKV, and Kafka's KRaft mode              |

The guarantees are the same. In Raft, an entry is committed when the leader stored it on a majority of nodes. Committed entries never change. If the leader fails, only a node whose log holds all committed entries can win the election. You do not need the details of either algorithm in an interview. You need to know what they guarantee and what they cost.

### The costs of consensus

- **Latency.** Each decision waits for a majority of nodes to write to disk. Across regions, this adds the round trip to the nearest majority.
- **Throughput.** All writes go through one leader. The leader limits the write rate.
- **A majority must be up.** With a partition, the minority side cannot write.
- **Sensitivity to timeouts.** Nodes detect a failed leader with timeouts. A slow network or a long pause can cause frequent elections, and the system makes little progress during them.
- **Fixed membership.** Most deployments use a fixed set of 3 or 5 nodes. Adding or removing nodes is possible but needs care.

## Coordination services

**ZooKeeper** and **etcd** are small, replicated stores built on consensus. ZooKeeper uses Zab, and etcd uses Raft. Kubernetes stores its cluster state in etcd. Hadoop, HBase, and older versions of Kafka depend on ZooKeeper.

They hold a small amount of data that fits in memory, replicated to 3 or 5 nodes. They give these features:

| Feature                        | ZooKeeper                                                    | etcd                                                         | Why it matters                            |
| ------------------------------ | ------------------------------------------------------------ | ------------------------------------------------------------ | ----------------------------------------- |
| Atomic compare-and-set         | Conditional writes with a version                            | Transactions that compare and then write                     | Safe locks and leader claims              |
| A number that always increases | The transaction ID (zxid), node versions                     | The revision of the store                                    | Fencing tokens                            |
| Failure detection              | Sessions; an ephemeral node is deleted when its session ends | Leases; keys attached to a lease are deleted when it expires | A lock is released when its owner dies    |
| Change notifications           | Watches                                                      | Watches                                                      | Nodes learn about changes without polling |

Reads differ. In etcd, reads are linearizable by default. In ZooKeeper, a read from a follower can be a little old, and a client calls `sync` first when it needs the latest value. Writes are linearizable in both.

```diagram
{
  "nodes": [
    { "id": "a1", "label": "Dispatcher 1\n(leader)", "shape": "box", "col": 0, "row": 0 },
    { "id": "a2", "label": "Dispatcher 2\n(standby)", "shape": "box", "col": 0, "row": 1 },
    { "id": "a3", "label": "Dispatcher 3\n(standby)", "shape": "box", "col": 0, "row": 2 },
    { "id": "l", "label": "etcd leader", "shape": "store", "col": 1, "row": 1 },
    { "id": "f1", "label": "etcd follower", "shape": "store", "col": 2, "row": 0 },
    { "id": "f2", "label": "etcd follower", "shape": "store", "col": 2, "row": 2 },
    { "id": "db", "label": "Jobs database\n(checks token)", "shape": "store", "col": 3, "row": 1 }
  ],
  "groups": [{ "id": "g", "label": "Coordination service (3 nodes, Raft)", "col": 1, "row": 0, "cols": 2, "rows": 3 }],
  "edges": [
    { "from": "a1", "to": "l", "label": "holds key\nwith a lease" },
    { "from": "a2", "to": "l", "label": "watch", "async": true },
    { "from": "a3", "to": "l", "label": "watch", "async": true },
    { "from": "l", "to": "f1", "label": "replicate" },
    { "from": "l", "to": "f2", "label": "replicate" },
    { "from": "a1", "to": "db", "label": "write with\nrevision as token" }
  ]
}
```

## What to use them for

| Use                       | How it works                                                                                                                                        |
| ------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| Leader election           | Each candidate tries to create one key with a lease. The one that succeeds is the leader. The others watch the key and try again when it disappears |
| Locks with fencing        | Take the lock as above. Pass the revision or zxid to the resource as a fencing token, and let the resource refuse old tokens                        |
| Service discovery         | Each instance registers its address under a key with a lease. Clients watch the keys. If an instance dies, its key expires                          |
| Configuration             | Store small settings and feature flags. Each service watches them and applies changes                                                               |
| Membership and assignment | Track which nodes are alive, and which node owns which partition or shard                                                                           |

Service discovery does not always need consensus. A slightly old list of addresses is often acceptable, and DNS or a cache can serve it. Use a coordination service when the answer must be correct, such as "who is the leader".

### What not to put in them

- **Business data.** They are made for kilobytes to a few gigabytes of slow-changing data, not for orders or events.
- **High write rates.** Each write goes through consensus. As a rough range, think of tens of thousands of small writes each second, not millions.
- **One lock for each request.** A seat hold for each buyer is business data. Put it in the database, with a conditional write.

Prefer a managed service or a library recipe, such as the Apache Curator recipes for ZooKeeper or the concurrency package of etcd, over your own lock code.

## Failure modes and traps

- **Split brain from a homemade election.** Two nodes each decide that they are the leader, from heartbeats and a timeout. Use consensus to elect a leader.
- **A lock without a fencing token.** A paused holder continues after its lease expired. See [Leases and fencing tokens](/learn/clocks-and-failures#leases-and-fencing-tokens).
- **An even number of nodes.** 4 nodes tolerate only 1 failure, the same as 3, at a higher cost.
- **Nodes across distant regions.** Each write waits for a round trip to a majority. Put the nodes where the latency is acceptable, and know which region failure stops writes.
- **A coordination service as a database.** Large values and high write rates make it slow, and then every system that depends on it fails.

## In a kata

Name the facts that need agreement, and give each one a single owner.

- In [Gavel](/kata/gavel), each auction needs one total order of bids. Give each auction one sequencer that numbers the bids. Elect the sequencer through a coordination service, and fence its writes, so that a failover never creates two orders.
- In [Tow Line](/kata/tow-line), dispatchers can split the country by region. Each region has one leader dispatcher, elected through etcd or ZooKeeper. Store job assignments in the database with conditional writes, not in the coordination service.
- In [Front Row](/kata/front-row), the rule "one buyer for each seat" is a uniqueness rule. A single-leader database with an atomic update meets it. A coordination service is the wrong place for millions of seat holds.

Say in the rationale which data needs linearizability, and accept weaker guarantees for the rest, such as search results and counters.

## Interview questions

**What is the difference between linearizability and serializability?**

- Linearizability is about single objects: each read sees the latest write, in real time.
- Serializability is about transactions: the result equals some serial order.
- A system with both is strictly serializable.

**Why can two-phase commit block, and how is consensus different?**

- After a participant votes yes, it cannot decide alone. If the coordinator crashes, it waits with its locks held.
- 2PC needs all participants. Consensus needs only a majority, and it elects a new leader on failure.

**What does Raft guarantee, and what does it cost?**

- At most one leader for each term, and committed log entries never change or get lost while a majority survives.
- All nodes apply the same log in the same order.
- Each write waits for a majority, all writes go through the leader, and the minority side of a partition cannot write.

**When would you use ZooKeeper or etcd, and when not?**

- For leader election, locks with fencing, membership, and small configuration.
- Not for business data, large values, or high write rates.
- Use 3 or 5 nodes, and prefer a managed service or a tested library recipe.

## Go deeper

- Designing Data-Intensive Applications, Martin Kleppmann: the part on consistency and consensus. It connects linearizability, ordering, total order broadcast, and consensus, and it explains coordination services.
- Site Reliability Engineering, Google: the part on distributed consensus for reliability. It shows consensus in production: leader election, locks, and the placement of replicas.
- System Design Interview, Alex Xu: the cases of a key-value store and unique IDs. They show where a design needs agreement and where it can avoid it.

## Further reading

- [The Raft consensus algorithm](https://raft.github.io/), with the paper and a visualization
- [Linearizability](https://en.wikipedia.org/wiki/Linearizability), [Lamport timestamp](https://en.wikipedia.org/wiki/Lamport_timestamp), [Paxos](https://en.wikipedia.org/wiki/Paxos_%28computer_science%29), and [Two-phase commit protocol](https://en.wikipedia.org/wiki/Two-phase_commit_protocol) on Wikipedia
- [Apache ZooKeeper](https://zookeeper.apache.org/) and [etcd](https://etcd.io/) documentation
- [Jepsen](https://jepsen.io/), tests of the consistency claims of real databases
