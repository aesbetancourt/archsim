## What this is and why it matters

When you split an application into services, the code is the easy part. The data is the hard part. A monolith has one database where every module can read and write every table. Services that still share that database are not independent. One schema change can break five of them, and one slow query can slow them all.

Newman's rule is **database per service**: each service owns its data, and other services get it only through that service's API or its events (Building Microservices, the part on data). Ford, Richards, Sadalage, and Dehghani give the method to get there (Software Architecture: The Hard Parts, the parts on data decomposition, data ownership, and distributed data access).

An architect needs this topic to answer three questions in a design:

1. Must this data be split, or can it stay together?
2. Which service owns each table, and who can write to it?
3. How does a service read data that another service owns?

## Why a shared database is a problem

Newman lists the problems of a database that several services share:

- **Hidden coupling.** The schema becomes a public contract. Each column that another service reads is part of an API that nobody designed.
- **No clear owner.** When three services write to `bookings`, nobody knows which one holds the rule "a tutor cannot have two bookings at the same time".
- **No independent change.** A team cannot change its tables without a meeting with every other team.
- **No independent deploy or scale.** The services share one failure point and one performance limit.

A shared database is not always wrong. Two services that one team owns and always deploys together can share a schema. But then they are one [architecture quantum](/learn/architecture-quantum), and you get few of the benefits of services.

## Reasons to split: the disintegrators

The Hard Parts calls the forces that push data apart **data disintegrators**. Use them as a checklist for each table group.

| Driver                     | The question                                                               | Example in a tutor marketplace                                       |
| -------------------------- | -------------------------------------------------------------------------- | -------------------------------------------------------------------- |
| Change control             | How many services break when this schema changes?                          | A change to `tutors` needs a test of six services                    |
| Connection management      | Can the database serve the connections of all service instances?           | 40 instances with 20 connections each reach the database limit       |
| Scalability                | Does one part of the data need much more capacity than the rest?           | Search reads are 100 times the booking writes                        |
| Fault tolerance            | Does a failure of this database stop services that do not need this data?  | A slow report query blocks bookings                                  |
| Architectural quantum      | Do the services need different characteristics, so they must deploy apart? | Payments need strong audit. The catalog needs fast change.           |
| Database type optimization | Does part of the data fit a different kind of store better?                | Tutor search fits a search index. Lesson chat fits a document store. |

The connection problem is easy to miss. Each service instance keeps a pool of connections. When you add services and instances, the total grows fast. A relational database has a limit, often a few hundred to a few thousand connections (a rough range). Splitting the data also splits that load.

## Reasons to keep together: the integrators

The same book names the forces that pull data together, the **data integrators**.

- **Database transactions.** If two tables must change atomically, a split replaces one ACID transaction with a [saga](/learn/distributed-transactions#saga) and eventual consistency. That is a large cost.
- **Data relationships.** Foreign keys, joins, views, and triggers connect tables. A split removes them. The code must then keep the references correct.

Weigh the two lists for each table group. Split when the disintegrators are stronger. Keep the data together when one business action must change both groups in one transaction most of the time. The [trade-offs](/learn/trade-offs) method applies here.

## The five steps to split a monolithic database

The Hard Parts gives a step-by-step path. Each step is small and can be stopped.

1. **Analyze the database and create data domains.** A **data domain** is a group of tables that belong together, for example everything about payments. Look at which code uses which tables.
2. **Assign the tables to data domains.** Put each domain in its own schema in the same database. Code that reads a table of another domain now uses a schema name in the query, so the cross-domain access becomes visible.
3. **Separate the database connections to data domains.** Each service connects only to the schema of its domain. Each cross-domain query must now become an API call or an event. This is the hardest step.
4. **Move the schemas to separate database servers.** Copy each schema to its own server, and keep it in step with replication.
5. **Switch over to the independent database servers.** Point each service to its own server. Remove the old connections and the old schema.

Step 3 is where you find the hidden coupling. Make a list of each join across domains before you start it. For the code side of the split, see [Decomposing a monolith](/learn/decomposing-a-monolith).

```diagram
{
  "nodes": [
    { "id": "book", "label": "Booking service", "shape": "box", "col": 0, "row": 0 },
    { "id": "pay", "label": "Payment service", "shape": "box", "col": 0, "row": 1.5 },
    { "id": "tutor", "label": "Tutor service", "shape": "box", "col": 0, "row": 3 },
    { "id": "s1", "label": "bookings schema", "shape": "store", "col": 2, "row": 0 },
    { "id": "s2", "label": "payments schema", "shape": "store", "col": 2, "row": 1.5 },
    { "id": "s3", "label": "tutors schema", "shape": "store", "col": 2, "row": 3 }
  ],
  "groups": [{ "id": "one", "label": "One database server (step 3)", "col": 2, "row": 0, "cols": 1, "rows": 4 }],
  "edges": [
    { "from": "book", "to": "s1" },
    { "from": "pay", "to": "s2" },
    { "from": "tutor", "to": "s3" },
    { "from": "book", "to": "tutor", "label": "API call,\nnot a join" }
  ]
}
```

## Who owns each table

The owner of a table is the service that writes to it. Many services can read data. The Hard Parts sorts tables into three cases by the number of writers.

### Single ownership

One service writes to the table. This is the simple case: the table goes with that service. Other services read through its API or its events.

### Common ownership

Most or all services write to the table. An audit log or a table of user preferences is the usual example. Do not let each service write directly. Make one service the owner, and let the others send their writes to it, often as messages. With a queue, the writers do not wait, and the owner can be down for a short time.

### Joint ownership

A few services, often in the same domain, write to the same table. This is the hardest case. The Hard Parts gives four techniques:

| Technique             | How it works                                                       | Cost                                                                 |
| --------------------- | ------------------------------------------------------------------ | -------------------------------------------------------------------- |
| Table split           | Split the table into two, one for each writer. Each owns its part. | The two parts must stay in step, usually by a call or an event       |
| Data domain           | The services share one schema, and all of them own it              | The schema is a shared contract again. Changes need coordination.    |
| Delegate              | One service owns the table. The others send their writes to it.    | The other writers depend on the owner, with its latency and failures |
| Service consolidation | Combine the writers into one service                               | A larger service, with a larger test and deploy scope                |

A table-split example from a parcel service: the `parcels` table holds the sender, the address, and the current location. The intake service writes the first two. The tracking service writes the location many times each hour. Split it into `parcels` (intake) and `parcel_locations` (tracking). Now each table has one writer.

For the delegate technique, choose the owner with care. The book gives two options. **Primary domain priority** makes the owner the service that the data belongs to by meaning. **Operational characteristics priority** makes the owner the service that writes most often or needs the fastest writes. The first keeps the model clean. The second keeps the hot path fast.

## How a service reads data it does not own

After the split, the booking service still needs the tutor's name and hourly price. The Hard Parts lists four patterns.

| Pattern                    | How it works                                                                   | Strong points                                  | Weak points                                                        |
| -------------------------- | ------------------------------------------------------------------------------ | ---------------------------------------------- | ------------------------------------------------------------------ |
| Interservice communication | Ask the owner at the time you need the data                                    | Always fresh. Simple. One copy.                | Latency, and the caller fails when the owner fails                 |
| Column schema replication  | Copy the needed columns into the reader's own table, updated by events         | Fast local reads. No runtime dependency.       | Data can be old. Two copies must agree. The reader must not write. |
| Replicated caching         | The owner writes to an in-memory cache. Each reader holds a read-only replica. | Very fast. Fresh within the replication delay. | Memory use, a cache product, and a startup dependency on the owner |
| Data domain                | The services share one schema for this data                                    | Joins and transactions work                    | Shared contract and shared failure, as in a shared database        |

Use these rules to choose:

- Use **interservice communication** when the data changes often and the read is not on a hot path.
- Use **column schema replication** when the data changes rarely, the read is frequent, and old data for some seconds is acceptable. The booking service can copy the tutor's name, but read the price from the owner at checkout.
- Use **replicated caching** for small, read-heavy reference data, such as the list of subjects.
- Use a **data domain** when two services cannot work without one transaction across the data. Then ask if they are really two services.

A replicated copy is [derived data](/learn/batch-and-stream#what-this-is-and-why-it-matters). It must have one source, and it must be possible to rebuild it from that source.

## Keeping copies in step

When data has more than one copy, the copies drift. The Hard Parts describes three ways to bring them back in step:

- **Background synchronization.** A scheduled job compares the stores and fixes differences. It is simple and slow, and the job is coupled to all the schemas.
- **Orchestrated request.** One service updates the others in the same request, and handles the errors. It is fresh, but the request is slow and fragile.
- **Event-based.** The owner publishes an event, and each copy updates itself. It is the usual choice. Use the [outbox](/learn/distributed-transactions#the-outbox) so that the event is never lost.

When one business action must change data in several services, it is a distributed transaction. See [Distributed transactions](/learn/distributed-transactions) for sagas and compensation.

## Failure modes

| Failure                               | What occurs                                                             | Protection                                                 |
| ------------------------------------- | ----------------------------------------------------------------------- | ---------------------------------------------------------- |
| Services split, database shared       | A distributed monolith: all the costs of services, few of the benefits  | Split the data, or merge the services                      |
| Two writers to one table              | Rules break, and nobody owns the fix                                    | One owner for each table. Use a table split or delegation. |
| A copy that someone writes            | The copy and the source disagree, and nobody knows which one is correct | Copies are read-only. Only the owner writes.               |
| A chain of calls for one page         | Latency adds up, and one failure stops the page                         | Replicate the columns or build a read model                |
| A split across a transaction boundary | Each booking now needs a saga, with partial failures                    | Keep data that changes together in one service             |
| Reports that join everything          | Analysts query each service database directly, which couples them again | Send events to a separate reporting store                  |

The last row deserves a word. Reports need data from many services. Do not let a reporting tool read each service database. Each service publishes events or a data product, and a warehouse builds the joined view. See [Batch and stream processing](/learn/batch-and-stream).

## In a kata

Draw one store for each service, inside the box of the service or next to it, with a label for its owner. Then check each arrow: a service must not draw an arrow to another service's store.

When two services need the same data, name the pattern: "Booking keeps a copy of tutor name and photo, updated by `TutorChanged` events. It reads the price from the tutor service at checkout." In the [tutor marketplace kata](/kata/tutor-marketplace) and the [payment system kata](/kata/payment-system), the question of who owns the booking and the payment is the core of the design.

## Interview questions

**"Why not let all the services share one database?"**

- The schema becomes a hidden contract. Each change needs every team.
- No clear owner of rules and data.
- One failure and one performance limit for all.
- Accept it only for services that one team deploys together. Then call them one quantum.

**"How do you split the database of a monolith?"**

- Find the data domains, and give each its own schema in the same database first.
- Cut the connections so each service sees only its schema. Replace joins with calls or events.
- Then move each schema to its own server.
- Do it in small steps that you can stop.

**"Two services both write to the orders table. What do you do?"**

- Find out which columns each one writes.
- If they write different columns, split the table.
- If not, make one the owner and delegate writes to it, or merge the services.
- Name the trade-off of the choice.

**"The order page needs the customer name, which another service owns."**

- Option one: call the customer service. It is fresh, but adds latency and a dependency.
- Option two: keep a read-only copy of the name, updated by events.
- A name changes rarely, so the copy is usually correct. Price or stock is different.

**"When do you not split the data?"**

- When most actions change both parts in one transaction.
- When one team owns both and the characteristics are the same.
- When the split gains nothing on the disintegrator list.

## Go deeper

- **Software Architecture: The Hard Parts**, Ford, Richards, Sadalage, and Dehghani, the parts on pulling apart operational data, data ownership, and distributed data access: the disintegrators and integrators, the five steps, the ownership techniques, and the access patterns in detail.
- **Building Microservices**, Sam Newman, the parts on data and on splitting the monolith: why each service hides its database, and how to move data out of a shared schema.
- **Designing Data-Intensive Applications**, Martin Kleppmann, the part on derived data: how events and logs keep copies of data correct across systems.
- **Domain-Driven Design**, Eric Evans, the part on bounded contexts: why one model of "customer" for the full company fails. See [Bounded contexts](/learn/bounded-contexts).

## Further reading

- [Database per service](https://microservices.io/patterns/data/database-per-service.html) and [Shared database](https://microservices.io/patterns/data/shared-database.html), on microservices.io
- [Integration database](https://martinfowler.com/bliki/IntegrationDatabase.html), by Martin Fowler
- [How to break a monolith into microservices](https://martinfowler.com/articles/break-monolith-into-microservices.html), by Zhamak Dehghani
