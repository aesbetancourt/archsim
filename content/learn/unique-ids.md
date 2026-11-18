## The question

"Design a service that makes unique IDs in a distributed system. The IDs must be numeric, must fit in 64 bits, and must sort by creation time. The system needs 50,000 new IDs each second."

In a single database, an auto-increment column solves this. When the data is spread over many databases and many services, the auto-increment no longer works: each database counts alone, so two of them make the same number. You need IDs that many machines can make at the same time, with no collisions and no central bottleneck.

The ID choice looks like a detail, but it affects the speed of inserts, the size of indexes, the sort order of feeds, and what an outsider learns from a URL. The structure of this page follows Alex Xu's chapter on a unique ID generator (System Design Interview), with depth from DDIA on clocks and ordering. The example is a ticket seller: each order, ticket, and payment needs an ID.

## Questions to ask first

### The requirements

- **Unique.** Two objects never get the same ID, also across data centers and after restarts.
- **Numeric.** The ID is an integer, not a string.
- **Sortable by time.** An ID made later is larger. Ask: exactly, or roughly? Across all machines, exactly is very hard. To the millisecond is usually enough.
- **64 bits.** The ID fits in a `bigint` column and in a 64-bit integer in all languages that the clients use.
- **Rate.** 50,000 IDs each second at peak, for many years.

### The questions that change the design

| Question                                         | Why it matters                                                        |
| ------------------------------------------------ | --------------------------------------------------------------------- |
| Must IDs be strictly increasing, with no gaps?   | Then you need one counter, and that is a bottleneck. Usually no       |
| Can an outsider see the IDs?                     | Sequential IDs show your volume. Time-based IDs show creation times   |
| How many machines make IDs, in how many regions? | This sets the bits for the machine part                               |
| How long must the scheme last?                   | This sets the bits for the timestamp                                  |
| Do the clients use JavaScript?                   | A JavaScript number is exact only up to 2^53. Send big IDs as strings |

## Estimates

The numbers are rough and are for this example only.

- **Rate.** 50,000 IDs each second at peak, spread over 200 service instances. That is 250 IDs each second for each instance, or 0.25 each millisecond.
- **Capacity of one machine.** With 12 bits for a sequence, one machine can make 4,096 IDs in each millisecond. The real need, 0.25, is far below the limit.
- **Lifetime.** With 41 bits of milliseconds, the timestamp lasts 2^41 ms = about 2.2 × 10^12 ms. One year is about 3.16 × 10^10 ms. So 41 bits last about 69 years.
- **Index size.** The ticket seller keeps 10 billion rows of tickets. A 16-byte UUID instead of an 8-byte integer adds 8 bytes to each row in each index that holds the key. With the primary key and two secondary indexes that hold it: 3 × 10 billion × 8 bytes = 240 GB of extra index.

## The first design

Each service instance makes its own IDs with a small library. No network call is necessary to make an ID.

```diagram
{
  "nodes": [
    { "id": "orders", "label": "Order service\n+ ID library", "shape": "box", "col": 0, "row": 0 },
    { "id": "tickets", "label": "Ticket service\n+ ID library", "shape": "box", "col": 0, "row": 2 },
    { "id": "coord", "label": "Coordination service\n(machine ID leases)", "shape": "store", "col": 1, "row": 1 },
    { "id": "ntp", "label": "Time servers\n(NTP)", "shape": "external", "col": 2, "row": 1 },
    { "id": "db", "label": "Orders and tickets\n(sharded database)", "shape": "store", "col": 2, "row": 0 }
  ],
  "edges": [
    { "from": "orders", "to": "coord", "label": "lease a machine ID" },
    { "from": "tickets", "to": "coord", "label": "lease a machine ID" },
    { "from": "orders", "to": "ntp", "label": "sync clock", "async": true },
    { "from": "tickets", "to": "ntp", "label": "sync clock", "async": true },
    { "from": "orders", "to": "db", "label": "insert with ID" }
  ]
}
```

- **The ID library.** It builds each ID from the time, the machine ID, and a sequence number. This is the Snowflake-style layout, named after the system that Twitter published in 2010.
- **The coordination service.** At start, each instance gets a machine ID that no other running instance has. A lease with an expiry makes sure that a dead instance gives its ID back. ZooKeeper or etcd can do this.
- **The time servers.** Each machine syncs its clock with NTP (Network Time Protocol). The clock is the weak point of this design, as the deep dives show.

## Deep dives

### The options

| Option                      | How it works                                                               | Strong points                                | Weak points                                                        |
| --------------------------- | -------------------------------------------------------------------------- | -------------------------------------------- | ------------------------------------------------------------------ |
| Multi-master auto-increment | K databases. Each starts at a different offset and increments by K         | Uses the database you have. Numeric          | Hard to add a database. Not sorted by time across databases        |
| UUID                        | 128 random or time-based bits, made locally                                | No coordination at all. Standard             | 128 bits, not 64. Random versions are bad for indexes. Not numeric |
| Ticket server               | One database with one auto-increment counter. Each service asks it for IDs | Simple. Numeric. Strictly increasing         | A single point of failure and a network call for each ID           |
| Block allocation            | A service gets a block of 1,000 IDs from a counter, then uses them locally | Few calls to the counter. Numeric            | Blocks make the order rough. Unused IDs are lost at a restart      |
| Snowflake-style             | Timestamp + machine ID + sequence, made locally                            | 64 bits. Sorted by time. No call for each ID | Depends on clocks and on unique machine IDs                        |

Notes on each:

- **Multi-master auto-increment.** With K = 3, database 1 makes 1, 4, 7, database 2 makes 2, 5, 8, and database 3 makes 3, 6, 9. A fourth database changes K, and all databases must change at once. IDs from database 1 can be larger than newer IDs from database 2.
- **UUID.** Version 4 is 122 random bits. A collision is so unlikely that you can ignore it. Version 7, standard since 2024, puts a millisecond timestamp first, so it sorts by time. Both are 128 bits, so they fail the 64-bit requirement.
- **Ticket server.** Flickr made this idea known. Two servers, one with odd and one with even numbers, remove the single point of failure, but then the order is only rough.
- **Snowflake-style.** It meets all four requirements. That is why it is the usual answer to this question.

### The bit layout

A common split of the 64 bits:

| Bits | Part        | Size    | What it gives                                     |
| ---- | ----------- | ------- | ------------------------------------------------- |
| 1    | Sign        | 1 bit   | Always 0, so the ID is a positive signed integer  |
| 41   | Timestamp   | 41 bits | Milliseconds since a custom epoch: about 69 years |
| 5    | Data center | 5 bits  | 2^5 = 32 data centers                             |
| 5    | Machine     | 5 bits  | 2^5 = 32 machines in each data center             |
| 12   | Sequence    | 12 bits | 2^12 = 4,096 IDs in each millisecond, per machine |

The arithmetic:

- **Timestamp.** Count from your own epoch, for example 1 January 2025, not from 1970. Then the 69 years start now, and the scheme lasts until about 2094.
- **Machines.** 5 + 5 bits = 1,024 machines in total. If you need more machines and fewer IDs for each machine, move bits from the sequence to the machine part.
- **Sequence.** The sequence counts the IDs in the current millisecond and goes back to 0 in the next one. If a machine needs a 4,097th ID in the same millisecond, it waits for the next millisecond.
- **Total capacity.** 1,024 machines × 4,096 IDs × 1,000 ms = about 4 billion IDs each second.

**An example.** The time is 123,456,789 ms after the epoch, about 1.4 days. The data center is 3, the machine is 17, and this is the sixth ID in the millisecond, so the sequence is 5. Shift each part to its place and combine them:

```text
ID = (123456789 << 22) | (3 << 17) | (17 << 12) | 5
   = 517815303929856 + 393216 + 69632 + 5
   = 517815304392709
```

To read the time back, shift the ID 22 bits to the right. A support engineer can see when an order was made from its ID alone.

### Clocks, NTP, and what goes wrong

A Snowflake-style ID trusts the clock of each machine. Clocks are not trustworthy. See [Clocks and failures](/learn/clocks-and-failures).

- **Skew between machines.** Two machines differ by some milliseconds, also with NTP. So IDs from two machines sort by time only roughly. Inside one machine, the order is exact. This is "roughly sorted", and it is enough for a feed or a list of orders.
- **The clock goes backward.** NTP can step a clock back when it finds that the clock is fast. A virtual machine can also come back from a pause with a wrong time. If the generator uses the earlier time again, it can make an ID that it already made.
- **Restarts.** A machine that restarts with a slow clock can repeat the IDs of its previous run.

The protections:

1. Keep the last timestamp that the generator used.
2. If the clock is behind it by a few milliseconds, wait until the clock passes it.
3. If the clock is far behind, refuse to make IDs, and raise an alert. A duplicate ID is worse than a short outage.
4. At start, wait longer than the largest expected clock step, or save the last timestamp to disk.
5. Configure NTP to slew (change the clock speed slowly) and not to step, where you can.

DDIA explains, in the part on unreliable clocks, that the time-of-day clock can jump, and a monotonic clock cannot. A generator can use the monotonic clock to measure time since start. But the monotonic clock has no meaning across machines, so the ID still needs the time of day at its base.

**Unique machine IDs.** This is the other weak point. If two running instances have the same machine ID, they make the same IDs in the same millisecond. Get the ID from a lease in a coordination service, not from a configuration file that someone can copy. The lease ends when the instance dies, so the ID returns to the pool.

### How the ID choice affects the database

Most relational databases store a table or an index as a B-tree, sorted by the key. See [Storage engines](/learn/storage-engines).

- **IDs in time order** go to the end of the index. New rows fill the last page, and that page stays in memory. Inserts are fast, and the pages are full.
- **Random IDs**, such as UUID version 4, go to random places in the index. Each insert touches a different page, which is often not in memory. Pages split and are half empty. When the index is larger than memory, insert speed falls a lot.
- **Size.** An 8-byte key makes smaller indexes than a 16-byte key, as the estimates show. Some databases, such as MySQL with InnoDB, copy the primary key into each secondary index.

There is one exception. In a store that splits data by **key ranges**, IDs in time order send all new writes to the last range. One server takes all inserts, and the others are idle. In that case, put a hash or a shard number first in the key. In a store that splits by a **hash** of the key, the order of the IDs does not matter for the spread. See [Scaling data](/learn/scaling-data#partitioning).

Time-sortable IDs also help reads. "The newest 20 orders" is a scan of the last part of the index, with no extra sort column.

## Trade-offs and alternatives

- **Exact order or no coordination.** An exact global order needs one counter, or a consensus protocol. Both cost latency and availability. Snowflake-style IDs give a rough order with no coordination. Ask which one the product needs.
- **64 bits or 128 bits.** 64 bits needs machine IDs and clock care. 128-bit UUID version 7 needs neither, and still sorts by time. If the 64-bit requirement is soft, UUID version 7 is often the simpler choice.
- **IDs that show information.** A sequential ID tells a competitor how many orders you get each day. A Snowflake ID shows when an object was made. Never use an ID as a secret, for example in a link to a private ticket. Add a random token for that.
- **A library or a service.** A library makes IDs with no network call. A central ID service is easier to change, but it adds a call and a dependency. A library is the usual choice.
- **The epoch ends.** 69 years is a long time, but write the end date in the design record. See [Decision records](/learn/decision-records).

## What interviewers probe

**"Why not a UUID?"**

- It is 128 bits, and the requirement is 64.
- Version 4 is random, which hurts index locality in a B-tree.
- Version 7 fixes the order, but not the size. If the size is negotiable, it is a good answer.

**"What happens when the clock goes back?"**

- The generator can repeat a timestamp, so it can make a duplicate ID.
- Keep the last timestamp. For a small step, wait. For a large step, refuse and alert.
- Configure NTP to slew, and wait at start.

**"How do two machines never get the same machine ID?"**

- A lease from a coordination service, which expires when the instance dies.
- Not a hand-written configuration file, because copies of an instance get the same file.

**"Are the IDs really sorted by time?"**

- Within one machine, yes, to the millisecond.
- Across machines, only roughly, because of clock skew.
- Exact global order needs one counter or consensus, and that costs availability.

**"What if one machine needs more than 4,096 IDs in a millisecond?"**

- It waits for the next millisecond, so the latency grows by less than 1 ms.
- If that is a real need, move bits from the machine part to the sequence.

## Go deeper

- **System Design Interview, Alex Xu**, the chapter on a unique ID generator in distributed systems: the four options and the Snowflake layout.
- **Designing Data-Intensive Applications, Martin Kleppmann**, the part on unreliable clocks: clock skew, NTP, and why time-of-day clocks can jump.
- **Designing Data-Intensive Applications**, the part on ordering guarantees: sequence numbers, Lamport timestamps, and why a total order needs coordination.
- **Designing Data-Intensive Applications**, the part on storage and retrieval: how B-trees store keys, and why the key order affects writes.

## Further reading

- [Snowflake ID](https://en.wikipedia.org/wiki/Snowflake_ID) and [Universally unique identifier](https://en.wikipedia.org/wiki/Universally_unique_identifier) on Wikipedia
- [RFC 9562: Universally Unique IDentifiers](https://www.rfc-editor.org/rfc/rfc9562), with the definition of UUID version 7
- Use this in the [Design a URL shortener](/learn/url-shortener) case and the [Link Shortener kata](/kata/link-shortener)
