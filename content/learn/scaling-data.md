## Two tools for two problems

| | Replication | Partitioning (sharding) |
|---|---|---|
| What it does | Keeps full copies of the data on several servers | Splits the data, so each server holds a part |
| Solves | Loss of a server, too many reads | Too much data, too many writes |
| Does not solve | Too many writes | Loss of a server |

Large systems use both: the data is split into partitions, and each partition has copies.

## Replication

The usual form has one leader and several followers. All writes go to the leader. The leader sends each change to the followers. Reads can go to any copy.

- **If the leader waits for the followers** before it confirms a write, no confirmed write is lost when the leader fails. Each write is slower.
- **If the leader does not wait**, writes are fast. A follower can be behind, so a user can write a value and then read the old one from a follower. A leader that fails can lose the last writes.

When the leader fails, a follower becomes the new leader. This is [failover](/glossary#failover). It takes seconds to minutes, and the design must say what the application does in that time.

## Partitioning

Each record goes to one partition, selected by a partition key.

| Method | How | Strong at | Weak at |
|---|---|---|---|
| By range | Keys A to F on server 1, G to M on server 2 | Range queries | Uneven load, if many keys are in one range |
| By hash | A hash of the key selects the server | Even spread | Range queries |

The choice of the key is the main decision:

- **All data for one request must be in one partition.** A query that must ask each partition is slow. Messages are split by conversation, not by message.
- **The load must spread evenly.** A key such as "country" puts most data in a few partitions.
- **Watch for hot keys.** One famous account or one popular event can overload its partition. The Front Row and News Feed worked examples each need a special path for this.

Transactions and joins across partitions are expensive or not possible. This is the price.

## Order of steps

Do not partition first. It is the most expensive step. The usual order as load grows:

1. Make the queries efficient, with the right indexes.
2. Use a larger server.
3. Add a [cache](/learn/caching) for frequent reads.
4. Add followers for reads.
5. Move large or special data to a separate store.
6. Partition.

In an interview, say this order. It shows that you know the cost of each step.

## Further reading

- [Replication](https://en.wikipedia.org/wiki/Replication_(computing)), [Shard](https://en.wikipedia.org/wiki/Shard_(database_architecture)), and [Consistent hashing](https://en.wikipedia.org/wiki/Consistent_hashing) on Wikipedia
