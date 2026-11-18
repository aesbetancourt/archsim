## The question

Try the [Distributed Message Queue kata](/kata/distributed-queue) before you read this page.

"Design a distributed message queue. Producers send messages to topics. Consumers read them. Many teams in the company use it to connect their services. It must keep messages for some days, so a consumer can read them again."

This is the case where you design the broker, not use it. The [Messaging](/learn/messaging) lesson explains what a log-based broker gives you: partitions, consumer groups, offsets, and replay. Read it first. This page explains how such a broker works inside: how it stores messages on disk, how it copies them, and how it shares partitions between consumers. Alex Xu and Sahn Lam describe this case in System Design Interview, volume 2, the chapter on a distributed message queue. The design is close to Apache Kafka. This page uses its own numbers.

## Questions to ask first

Functional questions:

- **Message size and format.** Assume text messages of about 1 KB, and a limit of 1 MB. Large files go to object storage, and the message holds a link.
- **Can a message be read more than once?** A classic queue deletes a message after a consumer takes it. A log keeps it, so many groups can read it, and one group can read it again. Assume a log.
- **Order.** Must all consumers see messages in the order they were sent? Assume order only for messages with the same key.
- **Retention.** How long do messages stay? Assume 7 days.
- **Delivery promise.** Can the system lose a message? Can it deliver one twice? Ask for each use case. The answer differs for metrics and for payments.

Non-functional questions:

- **Throughput and latency.** Some users want high throughput, for log collection. Some want low latency, for a request between services. The system must support both, with a setting.
- **Durability.** How many broker failures must the system survive with no loss?
- **Scale.** The system must grow when traffic grows, with no downtime.

The question that changes the design most is the delivery promise. It sets the replication, the acknowledgement, and the commit design.

## Estimates

Assume these answers: 2 billion messages each day, 1 KB each, a peak of 4 times the average, 3 consumer groups for each message, 3 copies of each partition, 7 days of retention. Use 100,000 seconds for one day.

| Quantity                | Arithmetic                   | Result                      |
| ----------------------- | ---------------------------- | --------------------------- |
| Average write rate      | 2 billion ÷ 100,000 s        | 20,000 messages each second |
| Peak write rate         | 20,000 × 4                   | 80,000 messages each second |
| Peak bytes in           | 80,000 × 1 KB                | About 80 MB each second     |
| Peak bytes out          | 80 MB × 3 groups             | About 240 MB each second    |
| Data each day           | 2 billion × 1 KB             | About 2 TB                  |
| Data on disk for 7 days | 2 TB × 7 × 3 copies          | About 42 TB                 |
| Consumers at peak       | 80,000 ÷ 2,000 each consumer | 40 consumers in each group  |

What the numbers say:

- Disk space, not processor time, sets the minimum number of brokers. With 8 TB of usable disk on each broker, 42 TB needs at least 6 brokers. Plan 9 for headroom and failures.
- The network out is three times the network in, plus the copies to followers. Network bandwidth is often the first limit of a broker.
- 40 consumers in one group need at least 40 partitions in the topic. Plan 64, because partitions are hard to add later.

## The first design

```diagram
{
  "nodes": [
    { "id": "prod", "label": "Producers\n(client library)", "shape": "box", "col": 0, "row": 0.5 },
    { "id": "b1", "label": "Broker 1\n(leader P0,\nfollower P1)", "shape": "box", "col": 1, "row": 0 },
    { "id": "b2", "label": "Broker 2\n(leader P1,\nfollower P0)", "shape": "box", "col": 1, "row": 1.2 },
    { "id": "log", "label": "Partition logs\n(segments on disk)", "shape": "store", "col": 1, "row": 2.4 },
    { "id": "coord", "label": "Coordination\n(metadata, leaders)", "shape": "store", "col": 2, "row": 2.4 },
    { "id": "gc", "label": "Group coordinator\n(a broker role)", "shape": "box", "col": 2, "row": 1.2 },
    { "id": "ga", "label": "Consumer group A", "shape": "box", "col": 3, "row": 0 },
    { "id": "gb", "label": "Consumer group B", "shape": "box", "col": 3, "row": 1.2 }
  ],
  "edges": [
    { "from": "prod", "to": "b1", "label": "batch to leader" },
    { "from": "prod", "to": "b2" },
    { "from": "b1", "to": "b2", "label": "copy", "both": true },
    { "from": "b1", "to": "log" },
    { "from": "b1", "to": "coord", "label": "metadata" },
    { "from": "ga", "to": "b1", "label": "pull" },
    { "from": "gb", "to": "b2", "label": "pull" },
    { "from": "ga", "to": "gc", "label": "heartbeat" }
  ]
}
```

The vocabulary:

- **Topic.** A named stream of messages, such as `parcel-scanned`.
- **Partition.** A topic is split into partitions. Each partition is an ordered, append-only log. A message in it has an **offset**: its position, a number that only grows.
- **Broker.** A server that stores partitions and serves producers and consumers.
- **Replica.** Each partition has copies on several brokers. One is the **leader**, which takes all writes. The others are **followers**, which copy the leader.
- **Consumer group.** A set of consumers that share the work of one subscriber. Each partition goes to one consumer in the group. See [Partitions and consumer groups](/learn/messaging#partitions-and-consumer-groups).
- **Coordination service.** It stores the cluster metadata: the brokers that are alive, the leader of each partition, and topic settings. Older Kafka versions use ZooKeeper. Newer ones use a built-in controller based on Raft. See [Coordination services](/learn/consensus#coordination-services).
- **Group coordinator.** A broker that manages the members of a consumer group and the partition plan.

A message has a small fixed structure: key, value, topic, partition, offset, timestamp, size, and a checksum. The broker never parses the value. It treats it as bytes.

## Deep dives

### Storage: the write-ahead log and segments

The broker stores each partition as a **write-ahead log**: a file that only gets appends at its end. It never changes a message in place. This choice gives most of the throughput.

- **Sequential disk access is fast.** A disk that writes at random positions is slow. The same disk can append at hundreds of MB each second. Even rotating disks do well with this pattern, and they are cheap for large retention.
- **The operating system cache helps.** Recent data stays in the page cache in memory. Consumers that keep up read from memory, not from disk.
- **Reads are simple.** A consumer gives an offset. The broker finds the position and sends the bytes that follow. Kafka can send file data to the network socket without a copy through the application, a technique called zero-copy.

A log that grows forever is hard to manage, so the broker splits each partition into **segments**. A segment is a file of a fixed maximum size, for example 1 GB. Only the newest segment, the active one, gets appends. When it is full, the broker closes it and opens a new one. Closed segments are read-only.

Each segment has a small index that maps offsets to byte positions in the file. The index is sparse: it holds one entry for every few KB. To find an offset, the broker searches the index, then reads forward a short distance. The [storage engines](/learn/storage-engines#the-simplest-database-a-log) lesson explains why an append-only log is the simplest fast store.

### The producer flow: routing, buffering, and batching

The producer is a client library inside the application, not a separate service. A separate routing service would add a network hop and a new failure point.

1. **Get metadata.** The library asks any broker for the cluster metadata, and caches it. It now knows the leader of each partition.
2. **Select the partition.** With a key, the library uses `hash(key) mod partitions`. All messages with the same key go to the same partition, so their order stays. With no key, it spreads messages across partitions.
3. **Buffer.** The library puts the message in an in-memory buffer for that partition and returns to the application.
4. **Send a batch.** A background thread sends a buffer when it reaches a size, for example 64 KB, or when a short wait ends, for example 5 ms.
5. **Handle the answer.** If the leader changed, the library refreshes the metadata and sends again. If the send fails, it retries.

**Batching** is the main control between throughput and latency. One request with 100 messages costs about as much as one request with one message. Batches also compress better, because similar messages repeat many words. The broker writes the batch to the log as one unit, and consumers fetch it as one unit.

| Setting                  | Effect on throughput | Effect on latency | Use                       |
| ------------------------ | -------------------- | ----------------- | ------------------------- |
| No wait, small batch     | Low                  | Lowest            | Requests between services |
| Wait some ms, 64 KB      | High                 | Some ms more      | Most event streams        |
| Wait 100 ms, large batch | Highest              | Noticeable        | Log and metric collection |

The buffer is in memory. If the producer process crashes, the messages in the buffer are lost. An application that cannot lose them must wait for the acknowledgement before it reports success to its own caller.

### Push or pull consumers

A broker can push messages to consumers, or consumers can pull them from the broker.

| Concern       | Push                                               | Pull                                              |
| ------------- | -------------------------------------------------- | ------------------------------------------------- |
| Latency       | Lowest: the broker sends at once                   | Low, with long polling                            |
| Slow consumer | The broker overloads it, unless it tracks each one | The consumer reads at its own speed               |
| Batching      | The broker must guess the batch size               | The consumer asks for all data after its offset   |
| Replay        | Hard                                               | Simple: ask for an earlier offset                 |
| Idle cost     | None                                               | Empty requests, unless the request waits for data |

Kafka-like systems use **pull**. The consumer controls its rate, and replay is natural. The cost of empty polls is solved with **long polling**: the broker holds a fetch request until data arrives or a timeout ends.

### Consumer rebalancing with a coordinator

Each partition in a topic belongs to exactly one consumer in a group. When the members change, the partitions must move. This is **rebalancing**.

One broker is the **group coordinator** for each group. The group ID decides which broker it is. The steps:

1. **Join.** A consumer starts and sends a join request to the coordinator.
2. **Heartbeat.** Each member sends a heartbeat at a fixed interval. If a heartbeat does not arrive in time, the coordinator treats the member as dead.
3. **Start a rebalance.** A join, a leave, a missed heartbeat, or a new partition starts a rebalance. The coordinator tells all members to join again.
4. **Make the plan.** The coordinator selects one member as the group leader. The leader gets the list of members and partitions, and makes the assignment plan. A plan can be round-robin, by range, or "sticky", which moves as few partitions as possible.
5. **Distribute.** The leader sends the plan to the coordinator. The coordinator sends each member its partitions.
6. **Resume.** Each member reads its committed offsets and continues.

Why does a client make the plan, not the broker? A team can change the assignment logic without a change to the brokers.

The classic rebalance stops the whole group until the new plan is ready. In a large group, frequent rebalances become an outage. Three causes are common: a consumer that takes too long on one batch and misses the heartbeat deadline, a deploy that restarts consumers one by one, and an autoscaler that adds and removes consumers often. Newer protocols move only the partitions that change, and the other members continue.

### Offsets and commits

A consumer must remember how far it has read. It **commits** its offset: it stores "group A has processed partition 3 up to offset 81,200". Kafka stores commits in an internal, compacted topic on the brokers. After a crash or a rebalance, the next owner of the partition starts at the committed offset.

When the consumer commits decides the delivery promise:

| Commit                              | After a crash                            | Promise       |
| ----------------------------------- | ---------------------------------------- | ------------- |
| Before processing                   | Messages after the commit are skipped    | At most once  |
| After processing                    | Messages after the last commit run again | At least once |
| With the result, in one transaction | The result and the offset agree          | Exactly once  |

See [Offsets and replay](/learn/messaging#offsets-and-replay) for the consumer view and for consumer lag.

### Replication, in-sync replicas, and ACK settings

Each partition has, for example, 3 replicas on 3 different brokers. Place them in different racks or availability zones, so one rack failure does not take all copies. The leader takes all writes, and by default all reads. Some brokers can let a consumer read from a follower near it. Followers fetch from the leader, like consumers do. See [Replication](/learn/scaling-data#replication).

**In-sync replicas (ISR)** are the replicas that are close enough to the leader. A follower stays in the ISR while it does not fall behind for longer than a configured time, for example 30 seconds. A slow or dead follower leaves the ISR. It comes back when it catches up. The leader is always in the ISR.

A message is **committed** when all replicas in the ISR have it. Consumers can read only committed messages. Kafka calls this limit the high watermark. This rule prevents a consumer from reading a message that a leader failure later removes.

The producer selects how long to wait with the **ACK setting**:

| ACK   | The producer waits for                   | Loss on a leader failure              | Latency | Use                        |
| ----- | ---------------------------------------- | ------------------------------------- | ------- | -------------------------- |
| `0`   | Nothing. It sends and continues.         | Yes, and it never knows               | Lowest  | Metrics, logs of low value |
| `1`   | The leader wrote the message to its log  | Yes, if the leader dies before a copy | Low     | Most events                |
| `all` | All replicas in the ISR have the message | No, while one ISR replica survives    | Highest | Payments, orders           |

`all` has a trap. If the ISR shrinks to the leader alone, "all" means "the leader", and the protection is gone. Set a minimum ISR size, for example 2 of 3. When the ISR is smaller, the broker refuses writes with `all`. This trades availability for durability, and you must say so.

When a leader fails, the controller selects a new leader from the ISR. A replica outside the ISR can be elected only if you allow an "unclean" election. That keeps the partition available but loses the messages that the old leader had and the new one did not. See [Clocks and failures](/learn/clocks-and-failures) for why a cluster cannot tell a slow leader from a dead one.

### Retention and delivery semantics

**Retention** removes old data by segment, not by message. When the newest message in a closed segment is older than the limit, for example 7 days, the broker deletes the file. A size limit for each partition works the same way. Deletion of a whole file is cheap. The other option is **log compaction**: the broker keeps only the newest message for each key. A compacted topic works as a table of current values, for example the latest address of each customer. Some brokers can also move old segments to object storage, which makes long retention cheaper.

**Delivery semantics** come from three settings together: the producer retry, the ACK, and the commit timing.

| Promise       | Producer                             | Consumer                             |
| ------------- | ------------------------------------ | ------------------------------------ |
| At most once  | `ACK=0`, no retry                    | Commit before processing             |
| At least once | `ACK=1` or `all`, with retries       | Commit after processing              |
| Exactly once  | Idempotent producer and transactions | Output and offset committed together |

A producer retry can write a message twice, if the first write worked and only the answer was lost. An **idempotent producer** fixes this. It sends a producer ID and a sequence number with each batch, and the leader drops a batch that it already has. Kafka transactions then let a job write its output and its consumer offsets in one atomic step. This gives exactly-once processing inside the broker. An email sent by a consumer is still outside, so it needs an [idempotency key](/learn/distributed-transactions#idempotency).

### Scaling

| Part       | How it scales                                           | The trap                                                                  |
| ---------- | ------------------------------------------------------- | ------------------------------------------------------------------------- |
| Producers  | Add instances. They share nothing.                      | None                                                                      |
| Consumers  | Add members to a group, up to the number of partitions. | A rebalance for each change                                               |
| Brokers    | Add a broker, then move some partition replicas to it.  | The copy uses network. Move replicas slowly.                              |
| Partitions | Add partitions to a topic.                              | `hash(key) mod N` changes. Keys move, and order across the change breaks. |

To move a replica to a new broker, add it as an extra follower first. When it catches up and joins the ISR, remove the old replica. The partition has 4 copies for a short time and never fewer than 3.

Adding partitions keeps the old messages where they are. New messages for a key can go to a different partition. A consumer can then see a newer message for a key before an older one. Plan enough partitions at the start. Kafka cannot remove a partition. A design that needs fewer must stop writes to a partition and delete it after its retention ends.

## Trade-offs and alternatives

| Decision        | Choice here                             | When the choice changes                                                     |
| --------------- | --------------------------------------- | --------------------------------------------------------------------------- |
| Storage model   | Append-only log in segments             | A classic queue that deletes on acknowledge, for task queues with no replay |
| Consumer model  | Pull with long polling                  | Push for very low latency to few, fast consumers                            |
| Default ACK     | `all` with a minimum ISR of 2           | `1` or `0` for data that can be lost, such as metrics                       |
| Order           | Within a partition, by key              | One partition for a total order, with its throughput limit                  |
| Metadata        | Coordination service or Raft controller | Never a single server: the metadata must survive failures                   |
| Partition count | Generous at the start                   | Each partition costs memory and file handles, so not thousands per topic    |

A classic queue, such as RabbitMQ, is still the better choice for some work: a task queue with priorities, per-message acknowledgements, and no need to replay. The [Messaging](/learn/messaging#two-kinds-of-broker) lesson compares the two kinds.

## What interviewers probe

1. **"Why is a log on disk fast enough?"**
   - Appends are sequential, which disks do well. Recent data stays in the page cache.
   - Batches and zero-copy reduce the work for each message.
2. **"The leader of a partition dies. What happens to messages?"**
   - The controller elects a new leader from the ISR.
   - Messages committed to the ISR survive. With `ACK=1`, messages that only the old leader had are lost.
3. **"A consumer group stops every few minutes. Why?"**
   - Rebalances. Look for consumers that miss heartbeats on slow batches, rolling restarts, and autoscaling.
   - Fix the processing time, use a sticky or incremental assignment, and tune the timeouts.
4. **"How do you get exactly once?"**
   - Idempotent producer, plus a transaction for the output and the offset.
   - Outside effects still need idempotency at the receiver.
5. **"Traffic grows ten times. What do you do?"**
   - Add brokers and move replicas. Add consumers up to the partition count.
   - Adding partitions changes the key mapping. Plan for it, or start with enough.

## Go deeper

- **System Design Interview, volume 2** (Alex Xu, Sahn Lam), the chapter on a distributed message queue: storage, the producer and consumer flows, rebalancing, and replication.
- **Designing Data-Intensive Applications** (Martin Kleppmann), the part on stream processing: log-based brokers compared with classic brokers, and consumer offsets.
- **DDIA**, the part on replication: leaders, followers, and what an acknowledgement means for durability.
- **DDIA**, the part on consensus: why leader election and the metadata need a coordination service.

## Further reading

- [Apache Kafka documentation](https://kafka.apache.org/documentation/), the design section
- [Apache Kafka](https://en.wikipedia.org/wiki/Apache_Kafka) on Wikipedia
- Related lessons: [Messaging](/learn/messaging), [Batch and stream processing](/learn/batch-and-stream), [Consensus](/learn/consensus)
