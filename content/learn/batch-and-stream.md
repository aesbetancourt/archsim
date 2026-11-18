## What this is and why it matters

Most systems keep data in more than one form. The orders table is the truth. A search index, a cache, a report, and a recommendation model are copies made from it. Kleppmann calls these copies **derived data** (DDIA, the part on derived data). A **system of record** holds the original. Derived data can be rebuilt from it at any time.

There are two ways to make derived data:

- **Batch processing** reads a bounded input, for example all orders of yesterday, and writes a full output. It runs on a schedule, and it takes minutes or hours.
- **Stream processing** reads an unbounded input, events that never stop, and updates the output as each event arrives. The delay is seconds or less.

An architect needs this topic for three reasons. First, many designs have a "how does the search index stay correct?" question, and the answer is a batch job or a stream. Second, an interviewer asks about counts, top lists, and analytics, which are batch or stream problems. Third, the choice changes the cost, the delay, and how you recover from a bug.

## Batch processing

### The Unix philosophy

A pipeline of small Unix tools, such as `sort`, `uniq`, and `grep`, is a batch job. Each tool does one thing. All tools use the same interface: a stream of lines in, a stream of lines out. The input does not change, so you can run the pipeline again after a mistake.

```bash
cat access.log | awk '{print $7}' | sort | uniq -c | sort -rn | head -5
```

DDIA uses this idea to explain large batch systems. They keep the same three properties at the scale of many machines: one uniform interface, inputs that never change, and outputs that are new files.

### MapReduce

MapReduce runs one job over files in a distributed file system, such as HDFS. A job has three phases:

1. **Map.** Many workers each read a part of the input. For each record, the mapper emits key-value pairs. For the lunch shop: key = dish, value = 1.
2. **Shuffle.** The framework sorts the pairs by key and sends all pairs with the same key to the same reducer.
3. **Reduce.** Each reducer gets one key and all its values, and writes the result: "soup: 412".

The framework moves the code to the machine that has the data, and it runs a failed task again on another machine. This is possible because a task has no side effects. A real workflow is a chain of many jobs. A scheduler, such as Airflow, starts each job when its inputs are ready.

### Joins in batch

A join puts together records that share a key, for example orders and customers. In batch, the job reads all records, so it does not do one lookup for each record.

| Join                  | How it works                                                                                          | When to use it                                         |
| --------------------- | ----------------------------------------------------------------------------------------------------- | ------------------------------------------------------ |
| Sort-merge join       | The mappers emit both datasets with the join key. The shuffle brings the matches to the same reducer. | Both datasets are large. It works always.              |
| Broadcast hash join   | Each mapper loads the small dataset into a hash table in memory, and reads the large one in parts.    | One dataset fits in memory, for example the dish menu. |
| Partitioned hash join | Both datasets have the same partitions by the same key. Each mapper joins one pair of partitions.     | Both datasets are already partitioned the same way.    |

A sort-merge join has a weak point: a **hot key**. If one celebrity customer has a million orders, one reducer gets all of them, and the full job waits for it. The fix is to sample the data to find hot keys first. Then spread the records of a hot key over several reducers, and send the matching records of the other dataset to each of them.

### Dataflow engines

MapReduce writes the output of each job to files before the next job starts. For a chain of ten jobs, this is slow. Dataflow engines, such as Spark, Flink, and Tez, treat the full workflow as one graph of operators. They pass data between operators in memory or over the network, and they sort only where a join or a group needs it.

To recover from a failure, an engine runs the lost part again from its inputs. Spark keeps the history of how each part was made for this. The operators must be deterministic, or the rerun gives a different result.

### What a batch job makes

The output of a batch job is rarely a report for a person. It is usually a new dataset for a system:

- A **search index**, built from all documents and then loaded by the search servers.
- A **key-value store**, built as database files and then loaded by the servers that answer queries. An example: the "tutors you can like" list for each student.
- A **model or a summary table** for a dashboard.

The job writes a new output. It does not write into the live database record by record. If the job has a bug, you fix the code, run it again, and switch to the new output. Kleppmann calls this human fault tolerance (DDIA, the part on batch processing).

## Stream processing

### Events

An **event** is a small, immutable record of something that occurred, with a time: "ticket 42 sold at 19:03". A producer writes events. Consumers read them. A **topic** or **stream** groups events of one kind.

### Message brokers and logs

There are two families of broker. The choice changes what a consumer can do.

| Property               | Traditional broker (AMQP, JMS style)                   | Log-based broker (Kafka, Kinesis style)                   |
| ---------------------- | ------------------------------------------------------ | --------------------------------------------------------- |
| After a consumer reads | The broker deletes the message when it is acknowledged | The event stays in the log for the retention time         |
| Parallel work          | Any consumer takes the next message                    | Each partition goes to one consumer in a group            |
| Order                  | Can change when a message is delivered again           | Kept inside a partition                                   |
| Read the past again    | Not possible                                           | Reset the offset and read again                           |
| Good fit               | Tasks of different cost, where order does not matter   | High volume, order for each key, many independent readers |

An **offset** is the position of a consumer in a partition. The consumer saves its offset. After a crash, it starts again from that offset. A slow consumer does not slow the others. It only falls behind. See [Messaging](/learn/messaging) for delivery promises.

```diagram
{
  "nodes": [
    { "id": "app", "label": "Ticket service", "shape": "box", "col": 0, "row": 1 },
    { "id": "db", "label": "Tickets\n(system of record)", "shape": "store", "col": 0, "row": 2.3 },
    { "id": "log", "label": "Change log\n(partitioned)", "shape": "pipe", "col": 1, "row": 1.6 },
    { "id": "search", "label": "Search index", "shape": "store", "col": 3, "row": 0 },
    { "id": "cache", "label": "Seat cache", "shape": "store", "col": 3, "row": 1.2 },
    { "id": "proc", "label": "Stream job\n(sales per minute)", "shape": "box", "col": 2, "row": 2.3 },
    { "id": "dash", "label": "Sales dashboard", "shape": "store", "col": 3, "row": 2.3 }
  ],
  "edges": [
    { "from": "app", "to": "db", "label": "write" },
    { "from": "db", "to": "log", "label": "CDC", "async": true },
    { "from": "log", "to": "search", "async": true },
    { "from": "log", "to": "cache", "async": true },
    { "from": "log", "to": "proc", "async": true },
    { "from": "proc", "to": "dash" }
  ]
}
```

### Change data capture

A common problem: the application writes to the database and also to the search index. The two writes are not atomic. One fails, or two writes arrive in a different order, and the index is wrong for good. This is the **dual write** problem.

**Change data capture (CDC)** solves it. A tool, such as Debezium, reads the replication log of the database and publishes each change as an event. The database decides the order once, and each consumer applies the changes in that order. To start a new consumer, the tool first takes a snapshot of the table, and then follows the log from the snapshot position.

**Log compaction** keeps only the last event for each key. Then the log holds a full copy of the current state, and a new consumer can rebuild from the log alone.

The [outbox](/learn/distributed-transactions#the-outbox) is the same idea at the application level. The service writes an event row in the same transaction as the data, and a relay publishes it.

### Event sourcing and the log as the truth

CDC and [event sourcing](/learn/cqrs-event-sourcing#event-sourcing) are close relatives. In CDC, the database is the truth and the log is derived. In event sourcing, the log of domain events is the truth, and the tables are derived.

DDIA makes the general point. The current state is what you get when you apply all changes in order. The log of changes holds more: it keeps the history, so you can build a new view later. A table of seats and a log of "seat reserved" and "seat released" events are two forms of the same data.

The cost: an immutable log grows. To delete personal data, you need compaction, encryption with a key that you delete, or a rewrite of the log.

## Time and windows

### Event time and processing time

**Event time** is when the event occurred. **Processing time** is when the stream job reads it. They differ. A phone without a signal sends its events an hour late. A consumer that restarts reads a backlog of ten minutes in a few seconds.

If you count by processing time, a backlog looks like a sudden spike in sales. Count by event time when the meaning matters.

Event time has a new problem: when is a window complete? You never know for sure that no late event is still on its way. A **watermark** is the job's estimate that all events before a time have arrived. For an event that arrives after the watermark, you have two choices: drop it and count the drops, or publish a correction.

A device clock can be wrong. A common fix is to log three times: when the event occurred and when it was sent, both by the device clock, and when the server received it. The difference between the last two gives the offset of the device clock. See [Clocks and failures](/learn/clocks-and-failures).

### Window types

A **window** groups events by time, so the job can count or average them.

| Window   | Shape                                                          | Example                                        |
| -------- | -------------------------------------------------------------- | ---------------------------------------------- |
| Tumbling | Fixed length, no overlap. Each event is in exactly one window. | Tickets sold in each minute: 19:00, 19:01, …   |
| Hopping  | Fixed length, with overlap. A 5-minute window each 1 minute.   | A smooth 5-minute sales total                  |
| Sliding  | All events within a fixed distance of each other in time.      | Two logins less than 10 seconds apart          |
| Session  | No fixed length. Ends after a gap with no events for one key.  | One visit of a user, until 30 minutes of quiet |

## Stream joins

A join in a stream must keep state, because the matching event can come later.

| Join          | Inputs                      | State the job keeps                          | Example                                               |
| ------------- | --------------------------- | -------------------------------------------- | ----------------------------------------------------- |
| Stream-stream | Two event streams           | Events of both streams inside a time window  | Match a search event with a click within 1 hour       |
| Stream-table  | Events and a changing table | A local copy of the table, kept fresh by CDC | Add the customer's city to each order event           |
| Table-table   | Two changelogs              | The current state of both tables             | Keep each follower's home feed as a materialized view |

A stream-table join has a time problem. If the customer moves, does an old order get the old city or the new one? If you run the job again later, the answer can change. Data warehouses solve this with a version ID for each value of the table, so a join always finds the version that was valid at the event time.

## Exactly-once, or effectively-once

A stream job can crash after it writes a result and before it saves its offset. When it restarts, it processes some events again. So the question is how to make the result as if each event counted once. DDIA notes that "effectively-once" is the more exact name.

The techniques:

- **Microbatches.** Spark Streaming cuts the stream into small batches of about one second, and treats each as a batch job.
- **Checkpoints.** Flink saves the state of all operators at markers in the stream. After a crash, it goes back to the last checkpoint.
- **Atomic commit.** The job writes the output and the new offset in one transaction. Kafka transactions do this inside Kafka.
- **Idempotent writes.** The output ignores a write it already applied, for example by the event ID or the offset. See [Idempotency](/learn/distributed-transactions#idempotency).

A checkpoint or a microbatch cannot undo an email that the job already sent. A side effect outside the system needs idempotency at the receiver.

## Lambda and kappa

The **lambda architecture**, an idea from Nathan Marz, runs two systems on the same events. A batch layer computes a correct result slowly. A speed layer computes an approximate result fast. A query merges the two.

DDIA lists its problems. You write the same logic twice, in two frameworks. The two results can disagree. The merge is hard for anything except simple counts.

The **kappa architecture**, an idea from Jay Kreps, uses only a stream system. To change the logic, you start a new job that reads the log from the start, and you switch the readers when it catches up. This needs a log with long retention and a stream engine that can process the backlog fast. Modern engines that run batch and stream with the same code make this simpler.

| Approach    | Strong points                               | Weak points                                          |
| ----------- | ------------------------------------------- | ---------------------------------------------------- |
| Batch only  | Simple, correct, cheap to run again         | Results are hours old                                |
| Stream only | Fresh results. Replay the log to fix a bug. | Needs long retention, state, and event-time handling |
| Lambda      | Fresh and later corrected                   | Two code bases, two results to merge                 |

## The unbundled database

DDIA ends with a larger idea. A database does many jobs inside one box: it stores data, it keeps indexes, it keeps materialized views, and it copies data to replicas. A large system does the same jobs across many boxes. The log is the replication stream. The search index, the cache, and the warehouse are the indexes and views. Stream jobs are the code that keeps them correct.

Kleppmann calls this **unbundling the database**. The system of record takes the writes in one order. Each derived store follows the log at its own speed. In this model, you can add a new view later, because you can replay the log into it.

The cost is eventual consistency. A user can write and then read an index that has not caught up. See [Consistency](/learn/consistency).

## Failure modes

| Failure                        | What occurs                                                          | Protection                                                     |
| ------------------------------ | -------------------------------------------------------------------- | -------------------------------------------------------------- |
| Dual writes                    | The database and the index disagree, and nobody notices              | CDC or an outbox, so one log sets the order                    |
| A consumer falls behind        | Derived data gets old. The lag grows until retention deletes events. | Alert on consumer lag. Add partitions and consumers.           |
| Hot key                        | One reducer or one partition does most of the work                   | Find hot keys and spread them, or add a random part to the key |
| Late events                    | A closed window is wrong                                             | Watermarks, a grace period, and corrections                    |
| Reprocessing gives new results | A job that uses the clock or random values is not deterministic      | Use event time and inputs only                                 |
| Side effects run twice         | A customer gets two emails after a restart                           | An idempotency key at the receiver                             |

## In a kata

Mark each store in the diagram as a system of record or as derived. For each derived store, say how it stays correct: "Search index, fed by CDC from Tickets, up to 5 seconds old". Then say how you rebuild it after a bug.

When a kata asks for counts, top lists, or trends, choose batch or stream from the delay that the users accept. A daily report is batch. A live seat map or a fraud check is stream. The [news feed kata](/kata/news-feed) and the [video streaming kata](/kata/video-streaming) both have a view count where this choice comes up.

## Interview questions

**"How do you keep the search index in step with the database?"**

- Do not write to both from the application. Name the dual-write problem.
- Use CDC from the database log, or an outbox, into a log-based broker.
- The indexer consumes in order and writes with an idempotent upsert.
- To rebuild, take a snapshot and replay the log.

**"Count the views of each video for the last hour."**

- A hopping or tumbling window on event time, partitioned by video ID.
- Say how late events are handled: a watermark and a grace period.
- Popular videos are hot keys. Count in parts and add the parts.
- Approximate counts are often acceptable. Ask first.

**"What does exactly-once mean in a stream system?"**

- Each event affects the result once, even when it is processed more than once.
- Name the mechanisms: checkpoints, atomic commit of output and offset, idempotent writes.
- Side effects outside the system need idempotency at the receiver.

**"Lambda or kappa?"**

- Lambda keeps two code bases and merges two results.
- Kappa keeps one stream job and replays the log to fix a bug.
- Kappa needs long retention and fast reprocessing. Prefer it when you have them.

## Go deeper

- **Designing Data-Intensive Applications**, Martin Kleppmann, the parts on batch processing, stream processing, and the future of data systems: the full mechanisms of joins, brokers, CDC, windows, fault tolerance, and unbundling.
- **System Design Interview**, Alex Xu: Volume 2, the case on ad click event aggregation: windows, watermarks, and the lambda and kappa choice in one design.

## Further reading

- [The Log: What every software engineer should know about real-time data's unifying abstraction](https://engineering.linkedin.com/distributed-systems/log-what-every-software-engineer-should-know-about-real-time-datas-unifying), by Jay Kreps
- [Turning the database inside-out](https://martin.kleppmann.com/2015/11/05/database-inside-out-at-oredev.html), by Martin Kleppmann
- [MapReduce](https://en.wikipedia.org/wiki/MapReduce), [Change data capture](https://en.wikipedia.org/wiki/Change_data_capture), and [Lambda architecture](https://en.wikipedia.org/wiki/Lambda_architecture) on Wikipedia
