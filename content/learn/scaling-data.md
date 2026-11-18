## Two tools for two problems

|                | Replication                                      | Partitioning (sharding)                      |
| -------------- | ------------------------------------------------ | -------------------------------------------- |
| What it does   | Keeps full copies of the data on several servers | Splits the data, so each server holds a part |
| Solves         | Loss of a server, too many reads                 | Too much data, too many writes               |
| Does not solve | Too many writes                                  | Loss of a server                             |

Large systems use both: the data is split into partitions, and each partition has copies. One server usually holds several partitions. For some it is the leader, and for others it is a follower.

```diagram
{
  "nodes": [
    { "id": "router", "label": "Router\n(key → partition)", "shape": "box", "col": 0, "row": 1 },
    { "id": "n1", "label": "Server 1\nP1 lead, P2 copy", "shape": "store", "col": 1, "row": 0 },
    { "id": "n2", "label": "Server 2\nP2 lead, P3 copy", "shape": "store", "col": 2, "row": 1 },
    { "id": "n3", "label": "Server 3\nP3 lead, P1 copy", "shape": "store", "col": 1, "row": 2 }
  ],
  "edges": [
    { "from": "router", "to": "n1", "label": "keys in P1" },
    { "from": "router", "to": "n2", "label": "keys in P2" },
    { "from": "router", "to": "n3", "label": "keys in P3" },
    { "from": "n1", "to": "n3", "label": "copy P1", "async": true },
    { "from": "n2", "to": "n1", "label": "copy P2", "async": true },
    { "from": "n3", "to": "n2", "label": "copy P3", "async": true }
  ]
}
```

## Replication

The usual form has one leader and several followers. All writes go to the leader. The leader sends each change to the followers. Reads can go to any copy.

- **If the leader waits for the followers** before it confirms a write, no confirmed write is lost when the leader fails. Each write is slower.
- **If the leader does not wait**, writes are fast. A follower can be behind, so a user can write a value and then read the old one from a follower. A leader that fails can lose the last writes.

A common middle way is semi-synchronous: the leader waits for one follower, and not for the others. Each confirmed write is then on at least two servers. If the follower that it waits for is slow, another follower takes its place.

When the leader fails, a follower becomes the new leader. This is [failover](/glossary#failover). It takes seconds to minutes, and the design must say what the application does in that time.

### What goes wrong in a failover

Kleppmann lists the problems of failover (DDIA, the part on replication):

- **Lost writes.** With asynchronous followers, the new leader can be missing the last writes of the old one. When the old leader comes back, its extra writes are usually thrown away. If another store already used those writes, for example a cache or a search index, the two stores now disagree.
- **Two leaders (split brain).** The old leader did not crash. It was only cut off. Now two servers accept writes. The system needs a way to stop the old one, such as a fencing token. See [Clocks and failures](/learn/clocks-and-failures).
- **The wrong time-out.** A short time-out causes a failover on each slow moment, and a failover adds load. A long one leaves the system without a leader for longer.

Because of these risks, some teams prefer a failover that a person starts, after an alert.

### How the leader sends changes

The leader sends a replication log to the followers. The log can hold the SQL statements, the bytes that changed on disk, or each changed row. The last form, a logical log, does not depend on the storage engine, and other systems can read it for change data capture. A new follower starts from a snapshot of the leader, then reads the log from the snapshot's position until it has caught up.

## Replication lag

With asynchronous followers, a read from a follower can return old data. The delay is usually under a second, and minutes under load. Users then miss their own changes, see values go backward, or see an answer before its question. See [Consistency](/learn/consistency#the-range-of-guarantees) for the guarantee that fixes each one. When you add followers for reads, decide which guarantee each screen needs.

## Multi-leader replication

In multi-leader replication, more than one server accepts writes. Each leader sends its writes to the other leaders. It is useful in three cases:

- **Several data centers.** Each region has a leader. A write goes to the local leader, so the user does not wait for a far region. A region can work while the link between regions is down.
- **Clients that work offline.** A phone app with a local database is a leader. It syncs when it is online again.
- **Editing together.** Several users edit one document at the same time.

The large cost is write conflicts. Two users change the same booking in two regions at the same moment. Both leaders accept the change. When the changes meet, the system must decide.

| Way to resolve a conflict | How                                                      | Risk                                                                    |
| ------------------------- | -------------------------------------------------------- | ----------------------------------------------------------------------- |
| Last write wins (LWW)     | Keep the write with the latest timestamp                 | Silently loses the other write. Clocks differ between servers           |
| Avoid conflicts           | Send all writes for one record to one leader             | Breaks when a record's home leader must change, as after a region fails |
| Merge                     | Keep both values, or combine them, as for a set of items | Works only for some kinds of data                                       |
| Ask the application       | Store both versions, and let code or the user decide     | More work for each kind of record                                       |

Data types built for merges (CRDTs, conflict-free replicated data types) merge automatically, for some kinds of data such as counters and sets.

Use multi-leader replication only when you need one of the three cases. For a single region, it adds conflicts and gives little back.

## Leaderless replication

In leaderless replication, there is no leader. The client, or a coordinator node, sends each write to several copies, and each read to several copies. Amazon's Dynamo made this style known. Cassandra and Riak use it. See the [Key-value store](/learn/key-value-store) case for a full design.

### Quorums

Each value is stored on n copies. A write is confirmed when w copies accept it. A read asks r copies and takes the newest value among the answers.

If w + r > n, the copies that the read asks and the copies that took the write must overlap in at least one copy. So at least one answer has the latest confirmed write.

A usual setting is n = 3, w = 2, r = 2:

- One copy can be down, and writes and reads still succeed.
- Each write and each read waits for two copies, not three.

You can tune for the workload. With w = 3 and r = 1, reads are fast, and one copy down stops all writes. With w = 1 and r = 1, both are fast, and reads can be old.

The quorum rule is weaker than it looks. Kleppmann shows cases where a read with w + r > n still returns an old value (DDIA, the part on leaderless replication). Examples: two writes at the same moment, a write that failed on some copies but was not removed from the others, or a copy that failed and was rebuilt from an old copy. Do not call a quorum system linearizable without more work.

### Repair of old copies

A copy that was down misses writes. Two mechanisms bring it up to date:

- **Read repair.** A read sees that one copy has an old value. It writes the new value back to that copy. This fixes values that are read often.
- **Anti-entropy.** A background process compares the copies and copies the missing data. This fixes values that are rarely read.

### Sloppy quorums and hinted handoff

Each key has n "home" copies. During a network fault, some home copies cannot be reached. A strict quorum refuses the write. A sloppy quorum accepts it on other servers that are reachable.

The server that takes the write holds it with a hint: "this belongs to server 4". When server 4 is back, the hint is sent to it. This is hinted handoff.

A sloppy quorum increases write availability. The cost: a read can go to the home copies, which do not yet have the write. So w + r > n no longer means that the read sees the latest write. It only means that the write is stored somewhere.

## Partitioning

Each record goes to one partition, selected by a partition key.

| Method   | How                                         | Strong at     | Weak at                                    |
| -------- | ------------------------------------------- | ------------- | ------------------------------------------ |
| By range | Keys A to F on server 1, G to M on server 2 | Range queries | Uneven load, if many keys are in one range |
| By hash  | A hash of the key selects the server        | Even spread   | Range queries                              |

### Key range in more detail

Range partitioning keeps keys in sorted order. A query for "all bookings of tutor 7 in March" reads one range on one partition. The boundaries between ranges must follow the data, not the alphabet. They can be set by hand, or the store can move them as the data grows.

The danger is a key that grows with time. If the key is a timestamp, all writes of today go to the last partition. One server takes all the load. Put another field first, for example the sensor ID, then the timestamp.

### Hash in more detail

A hash function turns each key into a number that looks random. Each partition owns a range of hash values. Similar keys end up on different partitions, so the load spreads.

The cost is that a range query must ask every partition. A compound key is a common middle way. Cassandra, for example, hashes the first part of the key to select the partition, and keeps the rest of the key in sorted order inside it. "All messages of conversation 42, by time" is then one partition and one range.

### Choosing the key

The choice of the key is the main decision:

- **All data for one request must be in one partition.** A query that must ask each partition is slow. Messages are split by conversation, not by message.
- **The load must spread evenly.** A key such as "country" puts most data in a few partitions.
- **Watch for hot keys.** One famous account or one popular event can overload its partition. The Front Row and News Feed worked examples each need a special path for this.

A hash does not help a hot key: all requests for one key still go to one partition. One fix is to add a small random number to the key, for example 0 to 9. The writes now spread over ten partitions. Each read must ask all ten and combine the results. Use this only for the few keys that need it, and keep a list of them.

Transactions and joins across partitions are expensive or not possible. This is the price.

## Secondary indexes and partitions

A secondary index finds records by a field that is not the key, for example "tutors who teach physics". With partitioned data, there are two ways to build it.

| Index type          | Where the index entries are                                                                       | Write                              | Read                                                   |
| ------------------- | ------------------------------------------------------------------------------------------------- | ---------------------------------- | ------------------------------------------------------ |
| Local (by document) | Each partition indexes only its own records                                                       | Fast: one partition                | Slow: ask every partition and combine (scatter/gather) |
| Global (by term)    | The index is partitioned by the indexed value, for example all "physics" entries on one partition | Slow: can touch several partitions | Fast: one partition for each term                      |

A scatter/gather read is as slow as the slowest partition. With many partitions, one slow server makes many reads slow.

A global index is usually updated asynchronously. A write can be confirmed before its index entry exists. A search just after the write can miss the new record. Say this in the design if search is important.

## Rebalancing

Over time, the data grows, and servers are added or removed. Partitions must move between servers. Rebalancing has three goals: spread the load evenly, keep the database up while it moves, and move no more data than necessary.

Do not use "hash mod n" to select the server. When n changes from 10 to 11, almost every key moves to another server. The usual strategies:

| Strategy                   | How it works                                                                                                                    | Used when                                 |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------- |
| Fixed number of partitions | Create many more partitions than servers, for example 1,000 for 10 servers. A new server takes whole partitions from the others | The data size is roughly known in advance |
| Dynamic partitioning       | A partition that grows too large splits in two. One that shrinks merges with a neighbor                                         | The data size is unknown, with key ranges |
| Proportional to servers    | Each server has a fixed number of partitions. A new server splits some existing ones and takes half                             | Data grows with the number of servers     |

[Consistent hashing](/learn/consistent-hashing) is a related method. It puts servers and keys on one ring, so a change of servers moves only a small part of the keys. See its page for the mechanism and virtual nodes.

### Automatic or by hand

Automatic rebalancing is dangerous together with automatic failure detection. A slow server looks dead, its partitions move, and the move overloads the other servers. Kleppmann recommends a person in the loop for the final step (DDIA, the part on partitioning).

## Request routing

A client has a key. Which server holds it? There are three usual answers:

1. **Any server.** The client contacts any server. If that server does not own the key, it forwards the request. Servers learn the map from each other by gossip. Cassandra and Riak work this way.
2. **A routing tier.** A separate layer knows the map and forwards each request. It holds no data.
3. **A smart client.** The client library knows the map and connects to the right server directly.

All three need a correct map of partitions to servers. Many systems keep that map in a coordination service, such as ZooKeeper or etcd. Each server registers there. The router watches for changes. See [Consensus](/learn/consensus) for why such a service needs a consensus protocol.

## Order of steps

Do not partition first. It is the most expensive step. The usual order as load grows:

1. Make the queries efficient, with the right indexes.
2. Use a larger server.
3. Add a [cache](/learn/caching) for frequent reads.
4. Add followers for reads.
5. Move large or special data to a separate store.
6. Partition.

In an interview, say this order. It shows that you know the cost of each step.

## Interview questions

**"Your database cannot keep up. What do you do?"**

- First find whether reads or writes are the limit, and measure.
- Go through the order: indexes, larger server, cache, followers, separate stores, then partitions.
- Name the cost of each step, for example replication lag with followers.

**"How do you select a partition key for this system?"**

- The key must keep one request in one partition.
- It must spread the load. Name the hot keys and the special path for them.
- Range or hash: say which queries need a range.

**"Explain quorums. Is a quorum system strongly consistent?"**

- n copies, w for a write, r for a read. With w + r > n, the read and write sets overlap.
- Name the cases where it still returns old data: concurrent writes, failed partial writes, sloppy quorums.
- Name read repair and anti-entropy for old copies.

**"What can go wrong when the leader fails?"**

- Lost writes with asynchronous followers.
- Split brain, and the fencing that prevents it.
- The time-out trade-off between false failovers and long outages.

## In a kata

Do not draw one "Database" box when the estimates show that the data does not fit on one server. Write the partition key and the number of copies on the box: "Messages, by conversation, 3 copies".

In the [Chat Messaging kata](/kata/chat-messaging), partition messages by conversation ID, so each conversation reads from one partition in order. In the [News Feed kata](/kata/news-feed), say what occurs with an account that has millions of followers: it is a hot key, and it needs a special path.

## Go deeper

- **Designing Data-Intensive Applications** (Martin Kleppmann), the part on replication: single-leader, multi-leader, and leaderless, with replication lag and quorums. The part on partitioning: key range and hash, secondary indexes, rebalancing, and routing.
- **System Design Interview** (Alex Xu), the cases on consistent hashing and the key-value store: how these mechanisms combine in an interview answer.

## Further reading

- [Replication](<https://en.wikipedia.org/wiki/Replication_(computing)>), [Shard](<https://en.wikipedia.org/wiki/Shard_(database_architecture)>), and [Consistent hashing](https://en.wikipedia.org/wiki/Consistent_hashing) on Wikipedia
- [Multi-master replication](https://en.wikipedia.org/wiki/Multi-master_replication) and [Conflict-free replicated data type](https://en.wikipedia.org/wiki/Conflict-free_replicated_data_type) on Wikipedia
- [Dynamo: Amazon's highly available key-value store](https://www.allthingsdistributed.com/2007/10/amazons_dynamo.html), by Werner Vogels
