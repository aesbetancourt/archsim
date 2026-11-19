## The question

"Design a distributed key-value store. It supports `put(key, value)` and `get(key)`. It must stay available, and it must scale to many servers."

A key-value store keeps values under unique keys, like a very large hash table. It has no query language and no joins. That makes it simple to spread over many machines, and very fast. Examples are Amazon's Dynamo, Cassandra, Riak, and Redis.

This case is a tour of distributed data. In one design, you use partitioning, replication, the CAP choice, quorums, conflict resolution, failure detection, repair, and a storage engine. The structure follows Alex Xu's chapter on key-value stores (System Design Interview). That chapter builds on the Dynamo paper. For each mechanism, DDIA gives the depth: the parts on leaderless replication, partitioning, and storage engines.

The example is the cart store of a food-ordering app. Each user has one cart. The key is the user ID, and the value is the cart.

## Questions to ask first

### Functional

- **Operations.** Only `put` and `get`? Also `delete`? No range scans?
- **Value size.** Small values, for example below 10 KB, keep the design simple. Large files go to object storage, and the store keeps only a pointer.
- **Conflicts.** Can two writes to the same key occur at the same time, for example from a phone and a laptop? Who merges them?

### Non-functional

- **Availability.** Must a write succeed also when some servers are down, or when the network splits? For a cart, the answer is yes: a lost "add to cart" is lost money.
- **Consistency.** Is it acceptable that a read returns an older value for a short time? For a cart, yes. For a bank balance, no.
- **Latency.** For example, 10 ms at the 99th percentile for reads and writes.
- **Scale.** The data must grow by adding servers, with no downtime.

The key question is the second one. It decides the CAP choice, and the CAP choice shapes the rest of the design.

## Estimates

The numbers are rough and are for this example only.

- **Data.** 200 million carts, average 2 KB each. 200 million × 2 KB = 400 GB.
- **Replicas.** Three copies of each value: 1.2 TB. The storage engine needs extra space for old files before compaction, so plan for about 2 TB.
- **Traffic.** 60,000 reads and 20,000 writes each second at peak.
- **Work on the servers.** Each write goes to 3 replicas: 60,000 replica writes each second. Each read also goes to all 3 replicas, and the coordinator waits for the first 2 answers: 180,000 replica reads each second. That is about 240,000 operations each second in total. A coordinator that asks only 2 replicas cuts the reads to 120,000, but one slow replica then makes the read slow.
- **Servers.** If one server handles roughly 15,000 operations each second and 500 GB of data, you need 16 servers for the traffic and 4 for the data. The traffic decides: 16 servers, plus a margin.

## The first design

### One server

Start with a hash table in memory. A `put` writes an entry, and a `get` reads it. This is fast and simple, but one machine has two limits: memory and failure. You can compress the values, and keep only hot data in memory with the rest on disk. But 2 TB with three copies and 80,000 requests each second does not fit on one machine, and one machine is a single point of failure.

### Many servers

```diagram
{
  "nodes": [
    { "id": "client", "label": "Cart service", "shape": "box", "col": 0, "row": 1 },
    { "id": "coord", "label": "Coordinator\n(any node)", "shape": "box", "col": 1, "row": 1 },
    { "id": "r1", "label": "Replica 1\n(zone A)", "shape": "store", "col": 2, "row": 0 },
    { "id": "r2", "label": "Replica 2\n(zone B)", "shape": "store", "col": 2, "row": 1 },
    { "id": "r3", "label": "Replica 3\n(zone C)", "shape": "store", "col": 2, "row": 2 },
    { "id": "others", "label": "Other nodes\non the ring", "shape": "store", "col": 3, "row": 1 }
  ],
  "groups": [{ "id": "ring", "label": "12 nodes on a hash ring", "col": 1, "row": 0, "cols": 3, "rows": 3 }],
  "edges": [
    { "from": "client", "to": "coord", "label": "put / get" },
    { "from": "coord", "to": "r1", "label": "write, wait for W" },
    { "from": "coord", "to": "r2" },
    { "from": "coord", "to": "r3" },
    { "from": "r2", "to": "others", "label": "gossip", "async": true, "both": true }
  ]
}
```

- **The ring.** The nodes sit on a hash ring with virtual nodes. Each key belongs to a position on the ring. See [Consistent hashing](/learn/consistent-hashing).
- **The coordinator.** The client sends a request to any node, or to the right node if the client knows the ring. That node coordinates the request: it sends it to the replicas of the key and waits for enough answers.
- **The replicas.** Each key lives on N = 3 nodes in three different zones.
- **Gossip.** The nodes tell each other who is alive and how the ring looks. There is no central master.

This design has no leader. Each replica accepts writes. DDIA calls this leaderless replication. The rest of this page explains the parts.

## Deep dives

### Partitions and replicas

**Partitioning.** The store hashes each key onto the ring, and the first node clockwise owns it. Virtual nodes spread the keys evenly, and a new node takes small parts from many nodes. Bigger machines get more virtual nodes.

**Replication.** From the key's position, walk clockwise and take the first N distinct physical nodes. This is the preference list of the key. Skip virtual nodes of a physical node that is already in the list. Skip nodes in a zone that already has a copy. With N = 3 and three zones, the loss of a whole zone leaves two copies.

When you add a node, it takes over some ranges. The old owners stream those ranges to it in the background. Then the ring changes, and the old owners delete their copies.

### The CAP choice

The CAP theorem says this: when the network splits (a partition), a store must choose. It refuses some requests to stay consistent (CP), or it answers all requests and accepts that copies differ (AP). Without a partition, you can have both. See [Consistency](/learn/consistency#the-cap-theorem).

| Choice | During a split                                 | Good for                                    |
| ------ | ---------------------------------------------- | ------------------------------------------- |
| CP     | The side without a majority refuses writes     | Balances, stock counts, locks, unique names |
| AP     | Both sides accept writes. You merge them later | Carts, likes, sessions, sensor readings     |

For the cart, choose AP. A user who cannot add to the cart leaves. Two versions of a cart can be merged. This is the choice that Dynamo made.

Kleppmann argues in DDIA that CAP is a narrow theorem and a poor tool for design. It covers only one kind of fault. In an interview, use CAP to state the choice, then talk in terms of quorums and latency.

### Quorum: N, W, and R

Three numbers tune the store:

- **N**: the number of replicas for each key.
- **W**: the number of replicas that must confirm a write before the coordinator says "done".
- **R**: the number of replicas that must answer a read before the coordinator answers.

If W + R > N, each read set and each write set share at least one replica. So a read sees at least one copy of the latest confirmed write, and the version numbers tell the coordinator which copy is the newest.

| N, W, R | Effect                                                          |
| ------- | --------------------------------------------------------------- |
| 3, 2, 2 | The usual balance. One replica can be down for reads and writes |
| 3, 3, 1 | Fast reads. A write fails when any replica is down              |
| 3, 1, 3 | Fast writes. A read fails when any replica is down              |
| 3, 1, 1 | Fastest and most available. Reads can be old                    |

The coordinator sends the request to all N replicas and waits for the fastest W or R. So the latency is that of the W-th or R-th fastest replica, not the slowest.

Even with W + R > N, the store is not fully consistent. DDIA lists the edge cases: two concurrent writes, a write that failed on some replicas and stays on the others, and a sloppy quorum (below). A quorum makes old reads rare. It does not make them impossible.

### Consistency models

| Model            | Promise                                                    | Cost                                    |
| ---------------- | ---------------------------------------------------------- | --------------------------------------- |
| Strong           | Each read sees the latest write, as if there were one copy | Coordination. Lower availability        |
| Read your writes | A user always sees their own writes                        | Sticky routing, or reads with W + R > N |
| Causal           | Writes that depend on each other are seen in order         | Version metadata                        |
| Eventual         | If writes stop, all copies become the same after some time | Readers can see old or different values |

DDIA calls strong consistency linearizability. A Dynamo-style store gives eventual consistency, with quorums to make it closer to strong. For strong consistency, a store usually has one leader for each partition, chosen by a consensus protocol such as Raft. See [Consensus](/learn/consensus).

### Versions and conflicts: vector clocks

In an AP store, two replicas can accept different writes to the same key. The store must detect this, and something must merge the two values.

A **vector clock** is a list of `(node, counter)` pairs attached to each value. When a node coordinates a write, it increments its own counter. Here is a cart:

1. Node X writes the cart [rice]. Clock: `{X: 1}`.
2. Node X writes [rice, soup]. Clock: `{X: 2}`.
3. The network splits. Node Y writes [rice, soup, tea]. Clock: `{X: 2, Y: 1}`.
4. At the same time, node Z writes [rice, soup, cake]. Clock: `{X: 2, Z: 1}`.

**The rule.** Version A is an ancestor of version B if each counter in A is less than or equal to the same counter in B. Then B replaces A. If neither is an ancestor of the other, the versions conflict.

Versions 3 and 4 conflict: Y is bigger in one, Z is bigger in the other. The store keeps both (siblings), and a read returns both. The cart service merges them, for example with a union: [rice, soup, tea, cake]. It writes the result through X, with the clock `{X: 3, Y: 1, Z: 1}`. This new version descends from both siblings.

The costs:

- **The client must merge.** That is application code, and each data type needs its own rule.
- **A union can bring back deleted items.** If one side removed the soup, a plain union adds it again. The Dynamo paper reports this effect for carts.
- **The clock grows.** Each coordinator adds a pair. Stores cut the oldest pairs above a limit, which can make a merge look necessary when it is not.

The alternative is **last write wins**: keep the value with the latest timestamp. It is simple, but it silently drops one of two concurrent writes. And clocks on different machines differ, so "latest" is not always correct. See [Clocks and failures](/learn/clocks-and-failures). A third option is a CRDT (conflict-free replicated data type), a data type that merges automatically, such as a set with add and remove marks.

### Failures: detection, sloppy quorum, and repair

**Failure detection with gossip.** If each node sends a heartbeat to every other node, 100 nodes make about 10,000 messages for each round. Gossip is cheaper:

1. Each node keeps a membership list: each node ID with a heartbeat counter and the time of its last increase.
2. Each node increments its own counter at a fixed interval, for example each second.
3. It sends its list to a few random nodes. They merge it with their own, and keep the larger counter for each node.
4. If a node's counter does not increase for a set time, for example 10 seconds, the others mark it as down.

The news spreads through the cluster in a few rounds, like a rumor.

**Temporary failures: sloppy quorum and hinted handoff.** Node B is down for a few minutes. A strict quorum refuses writes when fewer than W of the key's N nodes answer. A **sloppy quorum** uses the first W healthy nodes on the ring instead, also nodes outside the key's preference list. Node E takes B's write and stores a hint: "this belongs to B". When gossip says that B is back, E sends the write to B and deletes it. This is **hinted handoff**. Writes stay available, but a read can miss the newest value until the handoff is done.

**Permanent failures: anti-entropy with Merkle trees.** A node that was down for a long time, or lost its disk, must catch up. To compare every key with a replica is too slow. A **Merkle tree** is a tree of hashes:

1. Split the node's key range into buckets, for example 1,024.
2. Hash the contents of each bucket. These are the leaves.
3. Each parent holds the hash of its two children, up to one root hash.

Two replicas compare their roots. If the roots are equal, the data is equal. If not, compare the children and follow only the branches that differ. With 1,024 buckets, the tree has about 10 levels. To find one bad bucket, the replicas exchange about 20 hashes, and then sync only that bucket. This background repair is anti-entropy.

**Read repair.** When a read finds that one replica has an old version, the coordinator writes the newest version back to it. This repairs keys that people read. Anti-entropy repairs the others.

**A data center outage.** Put replicas in more than one data center, so the store survives the loss of one.

### The write path and the read path

Inside one node, many stores use an LSM-tree (log-structured merge-tree). It turns random writes into sequential writes. See [Storage engines](/learn/storage-engines).

**The write path:**

1. Append the write to the **commit log** on disk. This makes it durable: after a crash, the node replays the log.
2. Put the write in the **memtable**, a sorted structure in memory.
3. When the memtable is full, for example at 64 MB, write it to disk as an **SSTable** (sorted string table). An SSTable is an immutable file of keys in sorted order.
4. In the background, **compaction** merges SSTables, keeps the newest version of each key, and removes deleted keys.

**The read path:**

1. Look in the memtable. If the key is there, answer.
2. If not, look in the SSTables, from newest to oldest.
3. Before you read an SSTable, ask its **Bloom filter**. A Bloom filter is a small bit array that answers "the key is surely not here" or "the key is maybe here". It never says "not here" for a key that is there. With about 10 bits for each key, it is wrong about 1% of the time, as a rough figure.
4. Read only the SSTables that answer "maybe". Each SSTable has an index, so the read is one seek.

The Bloom filters keep a read for a missing key cheap. Without them, a missing key costs a disk read in each SSTable.

## Trade-offs and alternatives

| Choice            | Dynamo-style (this design)              | Alternative                                                 |
| ----------------- | --------------------------------------- | ----------------------------------------------------------- |
| Replication       | Leaderless. Any replica takes writes    | One leader for each partition, with consensus: strong reads |
| Conflicts         | Vector clocks and a merge by the client | Last write wins: simple, loses data                         |
| Membership        | Gossip, no master                       | A coordination service such as ZooKeeper or etcd            |
| Temporary failure | Sloppy quorum and hinted handoff        | Strict quorum: refuse writes, keep consistency              |
| Storage engine    | LSM-tree: fast writes                   | B-tree: faster reads, updates in place                      |

- **Leaderless against leader-based.** Leaderless has no failover and tolerates slow nodes well. Leader-based gives strong consistency and simpler conflicts, but a partition without a majority stops writes. Many modern stores take the leader path for each partition.
- **Tunable consistency moves the cost.** A lower W or R makes the store faster and more available, and moves the work of old reads and conflicts to the application.
- **Operations are the hard part.** Repair, compaction, and rebalancing all run in the background and use disk and network. A cluster that is too full cannot compact, and gets slower.

## What interviewers probe

**"Why W + R > N?"**

- The read set and the write set must share at least one replica, so a read sees the latest confirmed write.
- Name the edge cases from DDIA: concurrent writes, partial failures, and sloppy quorums.
- Name the trade-off: smaller W or R gives lower latency and higher availability.

**"Two users write the same key during a network split. What happens?"**

- In an AP store, both writes succeed on different replicas.
- Vector clocks show that neither version is an ancestor of the other, so both are kept.
- The client merges them, or the store uses last write wins and drops one.

**"How do you know that a node is down?"**

- Gossip: each node spreads a membership list with heartbeat counters.
- A node is down when its counter does not increase for some time.
- This avoids a central master and the cost of all-to-all heartbeats.

**"A node is down for 5 minutes. Then a disk fails for good. What is different?"**

- For 5 minutes: a sloppy quorum and hinted handoff keep writes available, and replay them later.
- For a lost disk: a new node gets the data from its replicas, and Merkle trees find the differences cheaply.
- Read repair fixes the keys that people read in the meantime.

**"Walk me through a read inside one node."**

- Memtable first, then SSTables from newest to oldest.
- A Bloom filter skips the SSTables that surely do not have the key.
- Compaction keeps the number of SSTables small, so a read touches few files.

## Go deeper

- **System Design Interview, Alex Xu**, the chapter on designing a key-value store: the full set of techniques in one design, based on Dynamo.
- **Designing Data-Intensive Applications, Martin Kleppmann**, the part on leaderless replication: quorums, sloppy quorums, hinted handoff, and how to detect concurrent writes with version vectors.
- **Designing Data-Intensive Applications**, the part on storage and retrieval: SSTables, LSM-trees, Bloom filters, and B-trees.
- **Designing Data-Intensive Applications**, the part on consistency and consensus: why linearizability is expensive, and what a leader with consensus gives you.
- **Dynamo paper (DeCandia and others, 2007)**: the original design, with the reasons for each choice.

## Further reading

- [Dynamo: Amazon's highly available key-value store](https://www.allthingsdistributed.com/files/amazon-dynamo-sosp2007.pdf), on Werner Vogels's site
- [Vector clock](https://en.wikipedia.org/wiki/Vector_clock), [Merkle tree](https://en.wikipedia.org/wiki/Merkle_tree), [Bloom filter](https://en.wikipedia.org/wiki/Bloom_filter), [Gossip protocol](https://en.wikipedia.org/wiki/Gossip_protocol), and [Log-structured merge-tree](https://en.wikipedia.org/wiki/Log-structured_merge-tree) on Wikipedia
- Related lessons: [Consistent hashing](/learn/consistent-hashing), [Data stores](/learn/data-stores), [Consistency](/learn/consistency)
