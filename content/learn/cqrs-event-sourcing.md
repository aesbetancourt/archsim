## Two patterns that are often confused

CQRS and event sourcing are separate patterns. They are often used together, and each can be used alone. Both add real complexity. Use them for a specific problem in a specific part of a system, never as the default for everything.

## CQRS

Command query responsibility segregation: use one model to change data and a different model to read it.

- A **command** changes something and returns little: "place this order".
- A **query** returns data and changes nothing: "show my orders".

```diagram
{
  "nodes": [
    { "id": "client", "label": "Client", "col": 0, "row": 0.55 },
    { "id": "write", "label": "Command side\n(rules, write model)", "col": 1, "row": 0 },
    { "id": "read", "label": "Query side\n(read model)", "col": 1, "row": 1.1 },
    { "id": "wstore", "label": "Write store", "col": 2, "row": 0 },
    { "id": "rstore", "label": "Read store\n(shaped for screens)", "col": 2, "row": 1.1 }
  ],
  "edges": [
    { "from": "client", "to": "write", "label": "commands" },
    { "from": "client", "to": "read", "label": "queries" },
    { "from": "write", "to": "wstore" },
    { "from": "read", "to": "rstore" },
    { "from": "wstore", "to": "rstore", "label": "changes", "async": true }
  ]
}
```

It has levels. Use the lowest one that solves your problem.

| Level | What is separate                                                                                             | Cost                                                               |
| ----- | ------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------ |
| 1     | Only the code: commands use the [domain model](/learn/domain-model), queries read the same database directly | Low. Often a good idea                                             |
| 2     | Also the tables: read tables or views in the same database, shaped for the screens                           | Medium                                                             |
| 3     | Also the store: the read side has its own database, updated from the write side with a delay                 | High: the read side is [eventually consistent](/learn/consistency) |

The reason for it: the best structure to check business rules is rarely the best structure to fill a screen. A rich aggregate is good for "can this order be cancelled?" and bad for "list 50 orders with customer names". With one model for both, each side gets worse.

You have already seen level 3 in this app. In the News Feed worked example, posts are written in one place, and each feed is read from a prepared list.

### Read your own writes

At level 3, a user can save a change and then not see it on the next screen, because the read store is some milliseconds or seconds behind. Users see this as a bug. Kleppmann (Designing Data-Intensive Applications) calls the guarantee that prevents it read-your-writes consistency. Common fixes:

- Return the new state in the command response, and show it directly.
- For a short time after a write, read that user's own data from the write side.
- Return the position of the write, and let the query wait until the read model has reached it.

## Event sourcing

Normally a database stores the current state: the balance is 70. With event sourcing, it stores every change as an event, and never changes or deletes one: opened with 100, withdrew 50, deposited 20. The current state is calculated by replaying the events.

| You get                                    | You pay                                            |
| ------------------------------------------ | -------------------------------------------------- |
| A full history: what occurred, and when    | Reads need a prepared view. So you also need CQRS  |
| The state at any past moment               | The format of old events must be supported forever |
| New views built from old events            | Developers must learn a different way to think     |
| A natural source of events for other parts | "Delete this personal data" becomes a hard problem |

A [ledger](/glossary#ledger) is event sourcing in a form that accountants have used for centuries. The Payment System worked example uses that idea for money, and normal tables for everything else. That is the right scale for it: one part where history is the product.

### Commands and events

Kleppmann makes a clear distinction. A command is a request, and it can fail: "book this lesson". The system checks it against the current state. If the command is valid, the system records an event: "lesson booked". From that moment, the event is a fact. Later code cannot reject it. It can only add a new event, such as "booking cancelled".

So the write side of an event-sourced aggregate works in four steps:

1. Load the events of one stream, for example all events of booking B-42.
2. Replay them to build the current state in memory.
3. Check the command against that state, with the rules of the [domain model](/learn/domain-model).
4. Append the new events, with the version that was loaded. If another writer appended first, the append fails, and the command retries or reports a conflict.

Step 4 is optimistic concurrency on a stream. The event store guarantees the order of events inside one stream. Most stores do not give a useful order across different streams, so a rule that crosses streams needs the same care as a rule that crosses aggregates.

## The log as the source of truth

Kleppmann (DDIA, the part on derived data) separates two kinds of data:

- A **system of record** holds the authoritative version. When two copies disagree, this one is correct.
- **Derived data** is the result of a transformation of other data: a cache, a search index, a read model. If you lose it, you can build it again from the source.

With event sourcing, the event log is the system of record. Every table, view, and index is derived data. This changes how you think about a database. The current-state table is one view of the log, built for one purpose. You can build a second view, with a different shape, from the same log, and run both side by side.

```diagram
{
  "nodes": [
    { "id": "cmd", "label": "Command handler\n(rules)", "shape": "module", "col": 0, "row": 0.5 },
    { "id": "log", "label": "Event store\n(system of record)", "shape": "pipe", "col": 1, "row": 0.5 },
    { "id": "p1", "label": "Projection:\nmy bookings", "shape": "module", "col": 2, "row": 0 },
    { "id": "p2", "label": "Projection:\ntutor statistics", "shape": "module", "col": 2, "row": 1 },
    { "id": "r1", "label": "Bookings view\n(PostgreSQL)", "shape": "store", "col": 3, "row": 0 },
    { "id": "r2", "label": "Statistics\n(column store)", "shape": "store", "col": 3, "row": 1 },
    { "id": "topic", "label": "Public topic\n(other services)", "shape": "pipe", "col": 1, "row": 1.8 }
  ],
  "edges": [
    { "from": "cmd", "to": "log", "label": "append" },
    { "from": "log", "to": "p1", "async": true },
    { "from": "log", "to": "p2", "async": true },
    { "from": "p1", "to": "r1" },
    { "from": "p2", "to": "r2" },
    { "from": "log", "to": "topic", "label": "public events", "async": true }
  ]
}
```

This is the same idea as stream processing at system scale. See [Batch and stream processing](/learn/batch-and-stream).

## Change data capture

You can get a log of changes without event sourcing. Change data capture (CDC) reads the replication log of a normal database and turns each insert, update, and delete into a message. Tools such as Debezium do this for PostgreSQL, MySQL, and other databases.

|                     | Event sourcing                                      | Change data capture                                 |
| ------------------- | --------------------------------------------------- | --------------------------------------------------- |
| What a message says | The business intent: "booking cancelled by learner" | The row change: "status changed to 4"               |
| Where it comes from | The application writes events                       | The database log, with no change to the application |
| Current state       | Derived from the events                             | Stored in tables, as usual                          |
| Old messages        | Kept forever                                        | Can be compacted to the newest value for each key   |
| Cost to adopt       | High: a new way to write the application            | Low to medium: a connector and a topic              |

Kleppmann points out that the two are close relatives. Both treat the database as a stream of changes. The difference is the level: CDC sees rows, event sourcing sees business facts.

CDC is often the better first step. It gives other services a stream of changes, and it can feed read models and caches, with no change to the write model. Its weakness: the row changes show the table structure, which is an internal detail. If other teams read them, your table becomes their contract. Put a small translation step between the raw change stream and the public topic.

## Projections

A projection reads events in order and updates one read model. It is the code behind the asynchronous arrow in the CQRS diagram.

1. Read the next event after the last position it handled.
2. Update its read model: insert a row, change a counter.
3. Record the new position, the checkpoint.

If the projection fails between step 2 and step 3, it handles the event again after a restart. Two ways make this safe:

- Store the checkpoint in the same transaction as the read model change, when both are in one database.
- Make the update idempotent, for example "set the status of B-42 to cancelled", not "add 1 to the count of cancellations".

Each projection serves one purpose and has its own read store. A projection for a search screen can write to a search index. A projection for a dashboard can write to a column store. Measure the lag of each projection, the distance between the newest event and its checkpoint. Lag is the eventual consistency that users see. See [Observability](/learn/observability).

## Rebuilding a read model

Because every read model is derived data, you can delete it and build it again. This is one of the strongest arguments for event sourcing. It is also where the costs appear.

To change a read model without downtime:

1. Write the new version of the projection.
2. Run it from the first event into a new table, while the old version still serves users.
3. Let it catch up to the newest event, and keep it running.
4. Compare the two, then switch the queries to the new table.
5. Delete the old table and stop the old projection.

The time of step 2 grows with the number of events. Rough figure: replay speed depends on the store and the projection, and a large log can take hours. Measure it before you depend on it. A rebuild that takes two days is not a practical repair tool.

## Snapshots

An aggregate with a long stream is slow to load, because each command replays all its events. A snapshot stores the state of the aggregate at one version. To load, read the newest snapshot, then replay only the events after it.

- A snapshot is a cache. You can delete all snapshots, and the system still works, only more slowly.
- Take a snapshot every N events, or when a load becomes slow. N is a measured choice, not a fixed number.
- When the shape of the aggregate changes, delete the old snapshots. Do not version them like events.

Most aggregates do not need snapshots. A booking has perhaps ten events in its life. If a stream grows to many thousands of events, first ask if the aggregate is too large. An account that lives for 20 years can be modeled as one stream for each accounting period, which starts with the closing balance of the previous period.

## Event versioning

Events are stored forever. The code that reads them changes every month. So the code must read every version of every event that was ever written. This is the hardest long-term cost of event sourcing.

| Technique                | How                                                                            | Use it when                                  |
| ------------------------ | ------------------------------------------------------------------------------ | -------------------------------------------- |
| Add optional fields only | New fields have a default. Readers ignore fields they do not know.             | The change is additive. This is the default. |
| Upcasting                | A small function converts an old event to the new shape when it is read        | A field was renamed or split                 |
| A new event type         | Write `LessonRescheduled` in place of a changed `LessonMoved`, and handle both | The meaning changed                          |
| Copy and transform       | Write a new event store from the old one, with converted events                | Rarely, and only with a strong reason        |

The general rules for compatible change of data formats apply here too. See [Encoding and evolution](/learn/encoding-and-evolution).

Design events carefully, because mistakes are permanent. Name them in the [ubiquitous language](/learn/domain-model#the-ubiquitous-language-in-code), in the past tense. Record the facts, not the derived values. "Lesson booked at 40 EUR" is a fact. "The tutor's new monthly total is 640 EUR" is derived, and it can change if the rule for totals changes.

## Not the same as event-driven

| Term                                             | Level               | Meaning                                               |
| ------------------------------------------------ | ------------------- | ----------------------------------------------------- |
| [Event-driven architecture](/learn/event-driven) | System              | Parts tell each other what occurred, through messages |
| Event sourcing                                   | Storage in one part | The stored data is a list of events                   |

A system can have either without the other.

### Internal events and public events

Newman (Building Microservices) puts information hiding at the center of service design. A service must hide its internal data. The events in an event store are internal data: they follow the aggregate model, and they change when the model changes.

So keep two kinds of event. Internal events are stored in the event store and change freely with versioning. Public events go to a topic that other services read. They are a stable contract, often coarser, and they leave out internal details. A translation step maps one kind to the other, in the same way that an API maps the domain model to a response.

Ford, Richards, Sadalage, and Dehghani (Software Architecture: The Hard Parts) describe services that keep a copy of another service's data, updated from events. This is a read model across a service boundary, with the same costs.

## The costs, in full

| Cost                      | What it means in practice                                                                                                                    |
| ------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| Eventual consistency      | Screens lag behind writes. You need a read-your-writes strategy.                                                                             |
| Event versioning          | Every event version ever written must stay readable.                                                                                         |
| Personal data             | Events cannot be deleted. Common fix: encrypt personal data with a key for each person, and delete the key. This is called crypto-shredding. |
| Queries across aggregates | The event store answers "all events of B-42" well, and "all bookings next week" badly. You need a projection for each such question.         |
| Operations                | Projection lag, failed projections, and poison events need monitoring and runbooks.                                                          |
| Learning                  | Most developers have not built this before. Mistakes in event design stay forever.                                                           |

## When to say no

- The application mostly creates, reads, updates, and deletes records.
- The team has not used these patterns before, and the deadline is close.
- The reason is "it scales" with no number behind it.
- The only real need is a stream of changes for other services. Use an outbox or CDC.
- The only real need is an audit trail. An append-only audit table next to normal tables is often enough.

If only one area needs it, apply it to that area. Good [boundaries](/learn/boundaries) make this possible.

Good reasons to say yes: the history is the product (a ledger, a legal record of bids), the business asks questions about the past that nobody can predict, or several very different read models must come from one stream of facts.

## In a kata

In the [Gavel kata](/kata/gavel), the system must record each bid for legal audit, and a late or out-of-order bid has legal consequences. This is a strong case for event sourcing in the bidding part only. Each auction lot is one stream. A bid is a command, checked against the current highest bid. An accepted bid is an event with a sequence number. The auctioneer's screen and the online bidders' screens are projections. Registration and payment cards stay in normal tables.

Say what you do not event-source, and why. That sentence shows the interviewer that you know the cost.

## Interview questions

**"What is the difference between CQRS and event sourcing?"**

- CQRS separates the write model from the read model. Event sourcing stores events in place of the current state.
- CQRS works alone, at three levels. Event sourcing almost always needs CQRS for reads.
- Neither is the same as event-driven architecture.

**"How do you change a read model in a live system?"**

- Run the new projection from the first event into a new store, beside the old one.
- Let it catch up, compare, switch the queries, then delete the old one.
- Know the replay time before you depend on it.

**"An event schema must change. What do you do?"**

- Prefer additive changes with defaults, and readers that ignore unknown fields.
- Use upcasting for renames, and a new event type when the meaning changes.
- Keep internal events separate from public events, so the contract changes slowly.

**"Event sourcing or change data capture?"**

- Both turn data into a stream of changes. Event sourcing records business facts, CDC records row changes.
- CDC is cheaper to adopt and keeps the normal write model.
- Choose event sourcing only when the history of business facts is itself the need.

**"How does a user see their own change at once?"**

- Return the new state from the command.
- Or read that user's data from the write side for a short time.
- Or wait until the projection has reached the position of the write.

## Go deeper

- **Designing Data-Intensive Applications** (Kleppmann), the part on stream processing: event logs, change data capture, event sourcing, and state as derived data.
- **Designing Data-Intensive Applications** (Kleppmann), the part on encoding and evolution: how to keep old data readable as schemas change.
- **Building Microservices** (Newman), the parts on information hiding and on event-based communication: why internal events and public events differ.
- **Software Architecture: The Hard Parts** (Ford, Richards, Sadalage, Dehghani), the parts on data access and on eventual consistency: copies of data across service boundaries.

## Further reading

- [CQRS](https://martinfowler.com/bliki/CQRS.html) and [Event sourcing](https://martinfowler.com/eaaDev/EventSourcing.html), by Martin Fowler
- [Event sourcing](https://microservices.io/patterns/data/event-sourcing.html) and [CQRS](https://microservices.io/patterns/data/cqrs.html) on microservices.io
- [Change data capture](https://en.wikipedia.org/wiki/Change_data_capture) on Wikipedia
- [Debezium](https://debezium.io/), an open source tool for change data capture
