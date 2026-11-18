## Two shapes

|                      | Queue                                      | Topic (publish and subscribe)                    |
| -------------------- | ------------------------------------------ | ------------------------------------------------ |
| Each message goes to | One worker                                 | Each subscriber                                  |
| Use it for           | Work to be done once: "convert this video" | News that several parts react to: "order placed" |
| More workers         | Share the work                             | Each subscriber group gets all messages          |

A third form is a log: an ordered list of events that is kept for a period. Subscribers read it at their own position and can read it again from the start. It is used for very high volume and when a new subscriber must see old events.

### Topic or queues: a trade-off

Hard Parts uses this choice as an example of trade-off analysis (Software Architecture: The Hard Parts, the part on trade-off analysis). A ticket seller publishes "seat sold" to three parts: invoices, analytics, and the seat map.

| With one topic                                         | With one queue for each receiver                         |
| ------------------------------------------------------ | -------------------------------------------------------- |
| A new receiver subscribes. The seller does not change  | The seller must send to each new queue                   |
| All receivers get the same message format              | Each receiver can get its own format                     |
| Any part with access can subscribe and read all data   | Each queue has its own access rules                      |
| One shared backlog. Hard to see which receiver is slow | The depth of each queue shows the speed of each receiver |
| All receivers scale with the same topic settings       | Each queue scales on its own                             |

A topic gives extensibility. Queues give control. Neither is correct in general. Select by the characteristic that matters most to this system.

## Two kinds of broker

Kleppmann separates two families of broker (Designing Data-Intensive Applications, the part on stream processing). The difference changes what you can do with old messages.

|                           | Message broker (RabbitMQ, SQS, JMS style)            | Log-based broker (Kafka, Kinesis, Pulsar style)                   |
| ------------------------- | ---------------------------------------------------- | ----------------------------------------------------------------- |
| After a consumer confirms | The broker deletes the message                       | The message stays until the retention period ends                 |
| Position of a consumer    | The broker tracks each message                       | The consumer keeps one number, the **offset**, for each partition |
| Parallel work             | Any worker takes the next message                    | One consumer in a group reads each partition                      |
| Order                     | Lost when a message is redelivered to another worker | Kept inside each partition                                        |
| Replay old messages       | No                                                   | Yes: move the offset back                                         |
| A slow message            | Blocks only its worker                               | Blocks the messages behind it in the same partition               |
| Good for                  | Tasks, where each message is a unit of work          | Event streams, high volume, many readers, rebuilding state        |

**Use a message broker** when each message is an independent task, and the time to process one varies a lot. **Use a log** when order matters, when new readers must read the history, or when the volume is very high.

## Partitions and consumer groups

A log-based topic is split into **partitions**. A partition is an ordered list of messages that one server owns. The producer selects the partition by the key of the message. All messages with the same key go to the same partition.

A **consumer group** is a set of consumers that share the work of one subscriber. The broker gives each partition to one consumer in the group. Each group gets all messages, so two groups are two independent subscribers.

```diagram
{
  "nodes": [
    { "id": "prod", "label": "Ticket seller", "shape": "box", "col": 0, "row": 1 },
    { "id": "p0", "label": "Partition 0", "shape": "pipe", "col": 1, "row": 0 },
    { "id": "p1", "label": "Partition 1", "shape": "pipe", "col": 1, "row": 1 },
    { "id": "p2", "label": "Partition 2", "shape": "pipe", "col": 1, "row": 2 },
    { "id": "a1", "label": "Invoices 1", "shape": "box", "col": 2, "row": 0.5 },
    { "id": "a2", "label": "Invoices 2", "shape": "box", "col": 2, "row": 2 },
    { "id": "b1", "label": "Analytics\n(own group)", "shape": "box", "col": 2, "row": 3.3 }
  ],
  "groups": [
    { "id": "topic", "label": "seat-sold (topic)", "col": 1, "row": 0, "cols": 1, "rows": 3 },
    { "id": "ga", "label": "Group: invoices", "col": 2, "row": 0, "cols": 1, "rows": 3 }
  ],
  "edges": [
    { "from": "prod", "to": "topic", "label": "key = event ID", "async": true },
    { "from": "p0", "to": "a1", "async": true },
    { "from": "p1", "to": "a1", "async": true },
    { "from": "p2", "to": "a2", "async": true },
    { "from": "topic", "to": "b1", "label": "all partitions", "async": true }
  ]
}
```

Three facts follow from this design.

1. **The number of partitions limits the parallel work.** With 3 partitions, a fourth consumer in the group has nothing to do. Select enough partitions at the start, because more partitions later move keys to other partitions.
2. **When a consumer joins or leaves, the group rebalances.** The broker moves partitions between consumers. During this time, the group stops for a moment.
3. **A hot key makes a hot partition.** If one event has most of the traffic, one partition and one consumer get most of the load. See [Replication and partitioning](/learn/scaling-data).

## Offsets and replay

In a log, the consumer saves its offset to show how far it has read. When the consumer saves the offset decides the delivery promise.

| The consumer saves the offset   | If it crashes in between                     | Result        |
| ------------------------------- | -------------------------------------------- | ------------- |
| Before it processes the message | The message is never processed               | At most once  |
| After it processes the message  | The message is processed again after restart | At least once |

**Replay** is the large advantage of a log. A new search index reads the topic from the start and builds its data. A consumer with a fault is fixed, moved back to an earlier offset, and processes the messages again. This is like a batch job over the old events. See [Batch and stream processing](/learn/batch-and-stream).

Replay works only inside the retention period. If a consumer is down longer than that, it misses messages. Watch the **consumer lag**: the distance between the newest offset and the offset of the consumer. A lag that grows means the consumer is too slow.

## Commands and events

- A **command** asks for an action: "send this email". The sender expects it to be done. It usually goes to a queue.
- An **event** states a fact: "the order was placed". The sender does not know or care who reacts. It usually goes to a topic.

Name events in the past tense. If an "event" is named "SendEmail", it is a command, and the two parts are more coupled than the diagram shows.

### What goes in an event

Newman describes two ends of a range (Building Microservices, the part on event-driven communication).

| Content      | Example                                                 | Advantage                      | Cost                                                          |
| ------------ | ------------------------------------------------------- | ------------------------------ | ------------------------------------------------------------- |
| Only an ID   | `ParcelDelivered { parcelId }`                          | Small. No data to keep in step | Each receiver calls back for details. The publisher gets load |
| Full details | `ParcelDelivered { parcelId, address, time, signedBy }` | Receivers need no call back    | Larger messages. More fields that receivers can depend on     |

Fowler calls the second form **event-carried state transfer**. Receivers keep their own copy of the data, so they work when the publisher is down. Many teams select full details, and treat the fields as a public contract. See [API design](/learn/api-design).

## Delivery promises

| Promise       | Meaning                                     | Result                                                                             |
| ------------- | ------------------------------------------- | ---------------------------------------------------------------------------------- |
| At most once  | A message is sent one time and can be lost  | No duplicates, lost work                                                           |
| At least once | A message is repeated until it is confirmed | No lost work, duplicates                                                           |
| Exactly once  | The effect occurs one time                  | Not a delivery promise. It is "at least once" plus a receiver that detects repeats |

Design for "at least once" and make each receiver [safe to repeat](/learn/distributed-transactions). The Agent Triggers worked example is built on this.

A receiver detects repeats in one of these ways:

- It stores the ID of each message it processed, in the same transaction as the effect.
- The effect is naturally safe to repeat: "set the status to shipped", not "add one".
- It keeps a version number on each record and ignores a message with an older version.

The other side of the problem is the producer. A service that writes to its database and then publishes can crash between the two steps. Use an [outbox](/learn/distributed-transactions): write the message to a table in the same transaction, and publish from that table.

## Order

Most systems keep order only inside one partition or one group. If order matters, give related messages the same key, so they go to the same partition and one worker handles them in sequence. The Chat Messaging example orders by conversation. A total order over all messages is very expensive and almost never necessary.

Order breaks in less obvious ways too. Newman warns that a design which looks ordered often is not.

- **Competing workers.** Two workers take messages 1 and 2. Worker 2 finishes first.
- **Retries.** Message 1 fails and is retried after message 2.
- **Several producers.** Two servers publish about the same parcel. Their clocks differ.

Two protections work in most designs. Put a sequence number or version on each message, and let the receiver ignore an older one. Or design each message so that its order does not matter: send the full new state, not the change.

## Patterns for workers

### Competing consumers

Several workers read from one queue. Each message goes to one of them. To process more, add workers. This is the standard way to scale a queue, from the catalog of Hohpe and Woolf (Enterprise Integration Patterns). It gives up order, because workers finish at different times.

### Dead-letter queue

A **poison message** is a message that always fails, for example because of bad data or a fault in the code. Without protection, the worker takes it, fails, puts it back, and takes it again. In a log, it also blocks each message behind it in the partition.

1. Count the attempts for each message.
2. After a fixed number, move the message to a [dead-letter queue](/glossary#dead-letter).
3. Alert a person when the dead-letter queue is not empty.
4. Give the team a tool to inspect a message, fix it, and send it again.

A dead-letter queue that nobody watches is a place where data is lost quietly.

### Claim check

A broker works best with small messages. Many brokers limit a message to roughly one megabyte, and some to less. For a large payload, such as a photo or a long document:

1. Store the payload in [object storage](/glossary#object-storage).
2. Send a message with only its address: the claim check.
3. The receiver reads the payload from the storage.

The storage and the message now have separate lifetimes. Delete the payload only after each receiver is done with it.

## Backpressure

When producers are faster than consumers, a system has three options (Kleppmann, the same part):

| Option            | What occurs                                  | Good when                                     |
| ----------------- | -------------------------------------------- | --------------------------------------------- |
| Drop messages     | New or old messages are lost                 | Old data has no value: a sensor reading       |
| Buffer in a queue | The queue grows. Memory or disk must hold it | Bursts are short, and storage is large enough |
| Backpressure      | The producer is slowed or blocked            | The producer can wait, or can tell its caller |

A queue with no limit is not a solution. It hides an overload until the disk is full, and then each message is late. Give each queue a maximum size and decide what occurs when it is full. See [Design for failure](/learn/resilience).

## What goes wrong

| Problem                         | What occurs                                         | Protection                                                                     |
| ------------------------------- | --------------------------------------------------- | ------------------------------------------------------------------------------ |
| A message that always fails     | The worker repeats it forever and blocks the others | After some attempts, move it to a [dead-letter list](/glossary#dead-letter)    |
| Workers are too slow            | The queue grows, work is late                       | Measure the delay of the queue, add workers automatically                      |
| A burst from one customer       | All other customers wait                            | A limit or a separate queue for each customer or priority                      |
| The format of a message changes | Old receivers fail                                  | Only add fields. See [API design](/learn/api-design)                           |
| A consumer is down too long     | Messages pass the retention period and are deleted  | Alert on consumer lag. Set retention longer than the longest outage you accept |
| The broker itself is down       | Producers cannot publish                            | A broker cluster with copies, and an outbox that waits for it                  |

## In a kata

For each dashed arrow, be ready to answer: what occurs if the message arrives twice, arrives late, or never arrives?

Then name the broker family and the key. "A Kafka topic, partitioned by conversation ID, so each conversation keeps its order" is a strong statement in the [Chat Messaging kata](/kata/chat-messaging). In the [Notification Service kata](/kata/notification-service), name the queue for each channel, the retry rule, and the dead-letter queue.

## Interview questions

**"How do you get exactly-once processing?"**

- Delivery is at least once. Exactly once is an effect, not a delivery.
- The receiver stores processed message IDs with the effect, in one transaction.
- Or the effect is naturally safe to repeat.
- The producer uses an outbox, so a crash does not lose or duplicate the publish.

**"You need order for each customer and also many workers. How?"**

- Partition by customer ID. Order holds inside a partition.
- Workers scale up to the number of partitions.
- A hot customer stays on one partition. Watch for it.

**"A bad message stops your consumer. What do you do?"**

- Limit the attempts, then move it to a dead-letter queue.
- Alert on the dead-letter queue, and give a tool to fix and send again.
- Find the cause: a format change without a compatible schema is common.

**"Kafka or RabbitMQ for this design?"**

- A log, such as Kafka, for event streams, order by key, replay, and many readers.
- A message broker, such as RabbitMQ or SQS, for tasks with variable time and no need for order.
- State the operational cost. A managed service reduces it.

## Go deeper

- **Designing Data-Intensive Applications**, Martin Kleppmann, the part on stream processing: message brokers compared with logs, partitions, offsets, replay, and backpressure.
- **Building Microservices**, Sam Newman, the part on event-driven communication: what goes in an event, message order, and failed messages.
- **Software Architecture: The Hard Parts**, Ford, Richards, Sadalage, and Dehghani, the part on trade-off analysis: topics compared with queues, and the parts on choreographed workflows.
- **Fundamentals of Software Architecture**, Mark Richards and Neal Ford, the part on event-driven architecture: broker and mediator topologies, and error handling.

## Further reading

- [Message queue](https://en.wikipedia.org/wiki/Message_queue) and [Publish–subscribe pattern](https://en.wikipedia.org/wiki/Publish%E2%80%93subscribe_pattern) on Wikipedia
- [What do you mean by "Event-Driven"?](https://martinfowler.com/articles/201701-event-driven.html), by Martin Fowler
- [Enterprise Integration Patterns](https://www.enterpriseintegrationpatterns.com/), the pattern catalog of Gregor Hohpe and Bobby Woolf
- [Transactional outbox](https://microservices.io/patterns/data/transactional-outbox.html) on microservices.io
