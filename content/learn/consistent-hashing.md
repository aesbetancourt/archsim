## The question

"You have a cache cluster of 4 servers. Each key must go to one server. Tomorrow you add a fifth server. How do you spread the keys so that the change does not empty the cache?"

This is a concept case. The interviewer rarely asks it alone. It comes inside a larger design: a key-value store, a cache cluster, a sharded database, a CDN. You must explain the problem with the simple approach, the hash ring, virtual nodes, and what moves when the set of servers changes.

Consistent hashing is a way to map keys to servers so that a change in the number of servers moves only a small part of the keys. The idea comes from a 1997 paper by Karger and others at MIT. The structure of this page follows Alex Xu's chapter on consistent hashing (System Design Interview), with depth from DDIA. The example is a parcel service that caches the status of each parcel.

## Questions to ask first

- **How often do servers change?** If servers come and go often, through autoscaling or failures, cheap rebalancing matters a lot.
- **What does a moved key cost?** In a cache, a moved key is a miss, so the database gets a read. In a database, a moved key is data that you must copy over the network.
- **Are the servers the same size?** If not, a big server must get more keys.
- **Do you need replicas?** If yes, the scheme must also pick the second and third server for each key.
- **Do you need range queries?** A hash scatters neighboring keys. If you need "all parcels from 10:00 to 11:00", hashing is the wrong tool. See [Scaling data](/learn/scaling-data#partitioning).

## Estimates

Here is a short numeric example of key movement. The numbers are for this example only.

The parcel service has 12 million keys in a cache of 4 servers. The cache answers 50,000 reads each second with a hit rate of 95%, so the database gets about 2,500 reads each second.

**With modulo hashing, from 4 to 5 servers.** A key stays on its server only when `hash mod 4` equals `hash mod 5`. That is true for 1 key in 5. So 80% of the keys move.

- 12 million × 80% = 9.6 million keys are now on the wrong server.
- For a short time, most reads are misses. The database load can go from 2,500 to about 40,000 reads each second. That is 16 times its usual load.

**With consistent hashing, from 4 to 5 servers.** Only the keys that the new server takes over move. That is about 1 key in 5.

- 12 million × 20% = 2.4 million keys move.
- The database load goes up for a short time, to roughly 12,000 reads each second, and falls as the cache fills.

**When a server is removed, from 4 to 3.** Modulo hashing moves 75% of the keys. Consistent hashing moves only the keys of the removed server: 25%, the minimum possible.

The general rule: going from N to N + 1 servers, modulo hashing keeps only about 1 key in N + 1 on its server. Consistent hashing moves only about 1 key in N + 1. The bigger the cluster, the bigger the difference.

## The first design

The obvious design is modulo hashing: `server = hash(key) mod N`, where N is the number of servers.

```diagram
{
  "nodes": [
    { "id": "app", "label": "Parcel service", "shape": "box", "col": 0, "row": 1.5 },
    { "id": "route", "label": "hash(key) mod 4", "shape": "module", "col": 1, "row": 1.5 },
    { "id": "c0", "label": "Cache 0", "shape": "store", "col": 2, "row": 0 },
    { "id": "c1", "label": "Cache 1", "shape": "store", "col": 2, "row": 1 },
    { "id": "c2", "label": "Cache 2", "shape": "store", "col": 2, "row": 2 },
    { "id": "c3", "label": "Cache 3", "shape": "store", "col": 2, "row": 3 }
  ],
  "edges": [
    { "from": "app", "to": "route", "label": "key" },
    { "from": "route", "to": "c0", "label": "0" },
    { "from": "route", "to": "c1", "label": "1" },
    { "from": "route", "to": "c2", "label": "2" },
    { "from": "route", "to": "c3", "label": "3" }
  ]
}
```

- **The hash.** A function that turns a key into a large number with an even spread, such as MD5 or MurmurHash. It does not have to be a secure hash. It must be fast and even.
- **The modulo.** It maps the number to a server index. If the hash is even, each server gets about the same number of keys.

This design is correct while N does not change. The problem is the rehashing: when N changes, almost every key gets a new server, as the estimates show. A server failure is also a change of N. So with modulo hashing, one failed cache server makes almost the whole cache miss.

## Deep dives

### The hash ring

Take the output range of the hash function, for example 0 to 2^32 − 1. Bend it into a circle, so that the largest value is next to 0. This is the hash ring.

1. Put each server on the ring: hash its name or address, and place it at that point.
2. Put each key on the ring: hash the key.
3. From the key's point, walk clockwise. The first server that you meet owns the key.

```diagram
{
  "nodes": [
    { "id": "a", "label": "Server A\n(point 0.10)", "shape": "store", "col": 1, "row": 0 },
    { "id": "b", "label": "Server B\n(point 0.35)", "shape": "store", "col": 2, "row": 1 },
    { "id": "c", "label": "Server C\n(point 0.60)", "shape": "store", "col": 1, "row": 2 },
    { "id": "d", "label": "Server D\n(point 0.85)", "shape": "store", "col": 0, "row": 1 },
    { "id": "k", "label": "Parcel P-7731\n(point 0.42)", "shape": "module", "col": 1, "row": 1 }
  ],
  "edges": [
    { "from": "a", "to": "b", "label": "0.10 to 0.35" },
    { "from": "b", "to": "c", "label": "0.35 to 0.60" },
    { "from": "c", "to": "d", "label": "0.60 to 0.85" },
    { "from": "d", "to": "a", "label": "0.85 to 0.10" },
    { "from": "k", "to": "c", "label": "next server clockwise" }
  ]
}
```

The diagram shows positions as fractions of the ring. Each server owns the arc that ends at its point. Server C owns the keys from 0.35 to 0.60, so the parcel at 0.42 goes to C.

The lookup is fast. Keep the server points in a sorted array, and use a binary search for the first point that is larger than the key's hash. With 1,000 points, that is about 10 comparisons.

### Virtual nodes

The basic ring has two problems.

- **Uneven arcs.** Server positions are random, so the arcs have random sizes. With one point for each server, one server can easily own twice its fair share.
- **Uneven moves.** When a server leaves, its whole arc goes to one neighbor. That neighbor suddenly has double load.

The fix is virtual nodes. Give each physical server many points on the ring, for example 200. Hash "A-0", "A-1", ..., "A-199" to get the points of server A. Each point is a virtual node, and each owns a small arc.

Why this balances the load:

- A server's share is now the sum of many small, random arcs. The random errors cancel out. As a rough rule, the spread of the shares falls with the square root of the points for each server. With 1 point, a server's share can be off by about 100% of the mean. With 100 points, it is off by about 10%. With 400 points, about 5%.
- When a server leaves, its 200 small arcs go to many different neighbors. The extra load spreads over the whole cluster.
- A server with twice the memory gets twice the points. So weights are easy.

The cost is memory for the ring and a slightly slower lookup. 10 servers × 200 points = 2,000 entries, which is very small. Very large clusters need fewer points for each server, or a different scheme.

### What moves when a server is added or removed

**Added.** The new server E lands at a point between, for example, B and C. Only the keys on the arc from B to E move, from C to E. No other key moves. With virtual nodes, E takes small arcs from many servers, about 1 / (N + 1) of the keys in total.

**Removed.** Server C fails. Only C's keys move, each one to the next server clockwise. With virtual nodes, they spread over all remaining servers.

What "move" means depends on the system:

| System      | What a moved key costs                | What to do                                                 |
| ----------- | ------------------------------------- | ---------------------------------------------------------- |
| Cache       | A miss, then a read from the database | Add servers one at a time, at a quiet hour                 |
| Data store  | A copy of the data over the network   | Copy first, then switch the ownership, then delete the old |
| Session map | A user is logged out                  | Keep sessions in a replicated store                        |

In a data store, the new owner must get the data before it takes traffic. Many stores stream the data in the background, and throttle the copy so that it does not take all the network.

### Replicas on the ring

A data store keeps each key on several servers. The ring gives an easy rule: walk clockwise from the key, and take the first N **distinct physical** servers. With N = 3, the key lives on its owner and the next two servers. The Dynamo paper calls this list the preference list.

Two details matter.

- **Skip virtual nodes of the same server.** Two virtual nodes of server A can be next to each other. If you count both, one physical server holds two of the three copies.
- **Spread across failure zones.** Also skip servers in the same rack or the same availability zone. Otherwise one power cut can take all three copies.

When a server joins or leaves, the preference lists of the nearby keys change. The store must copy data to keep N copies. See [Design a key-value store](/learn/key-value-store).

### Where it is used

- **Dynamo-style key-value stores.** Amazon's Dynamo, Cassandra, and Riak place data and replicas on a ring with virtual nodes. Cassandra calls its points tokens.
- **Cache clusters.** Memcached client libraries often use a ring to pick the server for each key. Then a failed cache server empties only its own part.
- **CDNs.** A CDN uses consistent hashing to pick which edge server in a location caches each file. Then each file is cached once in a location, not on every server. This was the original use in the 1997 paper.
- **Load balancers.** Some load balancers hash a connection or a user to a backend. Then the same user reaches the same backend, also after a backend is added.
- **Sharded databases.** Some databases use hash partitioning in a similar way. See [Scaling data](/learn/scaling-data).

## Trade-offs and alternatives

| Scheme                  | How it works                                                                | Good for                                   | Weak points                                      |
| ----------------------- | --------------------------------------------------------------------------- | ------------------------------------------ | ------------------------------------------------ |
| Modulo hashing          | `hash mod N`                                                                | A fixed number of servers                  | A change of N moves almost all keys              |
| Ring with virtual nodes | Many points for each server on a ring                                       | Servers that come and go. Weighted servers | Ring metadata. Balance is statistical            |
| Fixed partitions        | Many more partitions than servers, for example 1,000. Move whole partitions | Data stores. Simple, explicit moves        | You choose the number of partitions at the start |
| Rendezvous hashing      | For each key, score each server, and take the highest                       | Small clusters. No ring to keep            | Each lookup scores every server                  |
| Range partitioning      | Each server owns a range of sorted keys                                     | Range queries                              | Hot ranges, for example the newest keys          |

Kleppmann points out in DDIA, in the part on partitioning, that the name "consistent hashing" is used loosely. Many stores that say they use it really use one of the other schemes. DDIA prefers the fixed number of partitions for many databases: a new node takes some whole partitions from each existing node, and the key-to-partition map never changes.

Other trade-offs:

- **Balance of keys is not balance of load.** A ring spreads keys evenly, but one very popular key still lands on one server. For a hot key, add a cache in front of it, or split the key. See [Caching](/learn/caching).
- **Membership must agree.** Each client must see the same ring. If two clients have different server lists, they put the same key on different servers. Stores use gossip or a coordination service to share the ring. See [Consensus](/learn/consensus).
- **The hash must be stable.** If you change the hash function, all keys move. Pick it once.

## What interviewers probe

**"Why not just `hash mod N`?"**

- When N changes, almost every key moves: going from N to N + 1, only about 1 key in N + 1 stays.
- In a cache, this is a burst of misses that can overload the database.
- A server failure is also a change of N.

**"Why do you need virtual nodes?"**

- With one point for each server, the arcs are uneven, and a removed server gives all its load to one neighbor.
- Many points for each server make the shares even, as a sum of many small random parts.
- They also make weights easy: more points for a bigger server.

**"A new server joins. What exactly happens?"**

- It takes small arcs from many existing servers, about 1 / (N + 1) of the keys.
- In a cache, those keys miss once. In a store, they are copied before the new server takes traffic.
- The other keys do not move.

**"How do you place the replicas?"**

- Walk clockwise and take the next N distinct physical servers.
- Skip virtual nodes of a server that is already in the list, and spread across racks or zones.

**"One key gets a huge share of the traffic. Does consistent hashing help?"**

- No. It balances keys, not requests.
- Use a cache in front, copies of the hot key on several servers, or a split of the key.

## Go deeper

- **System Design Interview, Alex Xu**, the chapter on consistent hashing: the rehashing problem, the ring, and virtual nodes, with diagrams.
- **Designing Data-Intensive Applications, Martin Kleppmann**, the part on partitioning, and on rebalancing partitions: hash partitioning, the fixed number of partitions, and why the term is confusing.
- **Dynamo paper (DeCandia and others, 2007)**: how Amazon used a ring, virtual nodes, and preference lists in a real store.

## Further reading

- [Consistent hashing](https://en.wikipedia.org/wiki/Consistent_hashing) and [Rendezvous hashing](https://en.wikipedia.org/wiki/Rendezvous_hashing) on Wikipedia
- [Dynamo: Amazon's highly available key-value store](https://www.allthingsdistributed.com/files/amazon-dynamo-sosp2007.pdf), on Werner Vogels's site
- Related lessons: [Design a key-value store](/learn/key-value-store), [Caching](/learn/caching), [Scaling data](/learn/scaling-data)
