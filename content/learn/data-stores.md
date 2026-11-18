## Start with the questions, not the product

A data store is selected by how the data is read and written, not by its popularity. Ask these questions first:

1. **How do you find a record?** By one key, by many different fields, by text search, by relations between records?
2. **How much data, and how fast does it grow?** Does it fit on one server?
3. **How many reads and writes each second?** See [Capacity estimation](/learn/estimation).
4. **Must several records change together?** If yes, you need [transactions](/learn/consistency).
5. **How bad is old or lost data?** Money is different from a view counter.
6. **Who reads the data, and for what?** A customer who opens one order is different from an analyst who adds up a year of orders.

Write the answers down before you name a product. The answers are the requirements. The product is one way to meet them.

## The main types

| Type           | Finds data by                        | Strong at                          | Weak at                         | Example use                    |
| -------------- | ------------------------------------ | ---------------------------------- | ------------------------------- | ------------------------------ |
| Relational     | Any column, joins between tables     | Transactions, flexible queries     | Very large size on many servers | Orders, payments, accounts     |
| Key-value      | One key                              | Speed, simple split across servers | Any query that is not by key    | Sessions, short links, caches  |
| Document       | One key, plus fields in the document | Records with a flexible shape      | Joins between documents         | Product catalogs, profiles     |
| Wide-column    | A key and a range in that key        | Very large write volume            | Flexible queries                | Message history, sensor data   |
| Search index   | Words and filters                    | Text search, ranking               | It is not a safe main store     | Product search                 |
| Graph          | Relations between records            | "Friends of friends" queries       | Simple bulk operations          | Social graphs, fraud detection |
| Object storage | A file name                          | Large files, low cost              | Changes inside a file           | Images, video, backups         |
| Time series    | Time ranges                          | Measurements over time             | General data                    | Metrics, monitoring            |

The table shows the data model of each type: the shape in which the application sees its data. How the store keeps that data on disk is a different question. See [Storage engines](/learn/storage-engines) for B-trees, LSM-trees, and column storage.

The lines between the types are not sharp. Most relational databases now store and index JSON documents. Several document databases now support joins and transactions. Kleppmann notes this convergence (DDIA, the part on data models). Select by the main access pattern, and do not expect one type to be bad at everything outside its column.

## Relational, document, and graph models

Most designs select between three models. The difference is in how each one handles relations between records.

### The object-relational mismatch

Application code works with objects: a tutor with a list of subjects, a list of reviews, and a calendar. A relational database stores flat rows in tables. Code must translate between the two shapes. This translation layer is the object-relational mismatch (also called the impedance mismatch). An ORM (object-relational mapper) hides some of the work, but not all of it.

A document store removes much of this mismatch. The tutor profile is one JSON document with its subjects and reviews inside it. One read gets the full profile. This is locality: the data that one screen needs is in one place on disk.

### When the relations push you to relational

Relations come in three kinds. They decide the model more than any other factor.

| Relation     | Example                                | Document model                            | Relational model               |
| ------------ | -------------------------------------- | ----------------------------------------- | ------------------------------ |
| One-to-many  | A tutor has many subjects              | Good: nest the subjects in the document   | Good: a second table           |
| Many-to-one  | Many tutors live in one city           | Weak: copy the city name, or join in code | Good: a foreign key and a join |
| Many-to-many | Students book lessons with many tutors | Weak: references and joins in code        | Good: a join table             |

Data starts as a tree and grows relations later. The tutor marketplace first shows one profile. Then it must show "all tutors in this city who teach physics and have a free slot on Tuesday". Now the data is a web, not a tree. A document store makes the application do the joins in code, or copy data into many documents. A copy must be updated in each place when it changes. This is the point where a relational database wins.

Use a document store when the data really is a set of separate trees, each read as one unit. Use a relational store when records refer to each other and queries cross those references.

### Graph models

A graph model stores vertices (things) and edges (relations between things). Each edge has a type and properties. Queries follow edges for any number of steps: "students who booked a tutor who also teaches the subjects this student likes". In SQL, a query of unknown depth is hard to write and slow to run. In a graph query language, such as Cypher, it is a short pattern.

Use a graph model when the relations are the main data, and queries follow chains of relations. Fraud detection, social graphs, and recommendation by connection are the usual cases. For most business data, a relational database with a few join tables is enough.

## Schema-on-write and schema-on-read

Every store has a schema. The question is where the schema is enforced.

- **Schema-on-write:** the database checks each write against a declared schema. A row with a missing column is refused. Relational databases work this way. The data is always in the expected shape. A change of shape needs a migration.
- **Schema-on-read:** the database accepts any document. The code that reads the data interprets its shape. Document stores usually work this way. A new field is easy to add. Old documents keep the old shape, and the reading code must handle both shapes.

Kleppmann compares this to static and dynamic type checks in programming languages (DDIA, the part on data models). Neither is always better. Schema-on-read helps when the records really have different shapes, or when an outside system controls the shape. Schema-on-write helps when many parts of the code read the same data and must agree on its shape.

"Schemaless" does not mean that there is no schema. It means that the schema is in the code, spread over each place that reads the data. See [Encoding and evolution](/learn/encoding-and-evolution) for how formats change over time.

## OLTP and OLAP

There are two very different ways to use a database.

|                 | OLTP (online transaction processing) | OLAP (online analytical processing)      |
| --------------- | ------------------------------------ | ---------------------------------------- |
| Who uses it     | Customers, through the application   | Analysts and reports                     |
| A typical query | Read or change a few records by key  | Scan millions of records and add them up |
| Data size       | The current state                    | The history of events, often much larger |
| Main limit      | Latency of each small request        | Speed of large scans                     |
| Usual store     | Relational or NoSQL, row-oriented    | Data warehouse, column-oriented          |

Do not run large reports on the database that serves customers. A report that scans a year of bookings competes with the bookings of today. The usual answer is a separate data warehouse. A pipeline copies the data from the OLTP stores into it, often with a step that cleans and reshapes the data (ETL: extract, transform, load). The warehouse keeps the data in columns, so a scan reads only the columns that a query uses. See [Storage engines](/learn/storage-engines) and [Batch and stream processing](/learn/batch-and-stream).

## A rating approach to select a type

Ford, Richards, Sadalage, and Dehghani propose a structured way to select a database type (Software Architecture: The Hard Parts, the part on selecting a database type). In short, you rate each candidate type against the characteristics that matter for this data, and you compare the ratings.

1. List the characteristics that matter for this data. Typical ones are ease of learning, ease of data modeling, throughput and scale, availability during a partition, consistency, and maturity of the product and its tools.
2. Mark which characteristics matter most here. A ledger needs consistency. A click log needs write throughput.
3. Rate each candidate type on each characteristic, as low, medium, or high.
4. Select the type that is strong where it matters most. Accept weakness where it matters less.
5. Write the decision in a [decision record](/learn/decision-records), with the ratings.

An example for two kinds of data in a tutor marketplace (the ratings are rough and for this example only):

| Characteristic   | Matters for bookings | Matters for search | Relational | Document | Search index |
| ---------------- | -------------------- | ------------------ | ---------- | -------- | ------------ |
| Consistency      | High                 | Low                | High       | Medium   | Low          |
| Flexible queries | Medium               | High               | High       | Medium   | High         |
| Text and ranking | Low                  | High               | Low        | Low      | High         |
| Ease of modeling | Medium               | Medium             | Medium     | High     | Medium       |

The result: bookings go to a relational database, and search goes to a search index fed from it. The value of the method is not the numbers. It makes the team say which characteristics matter, before the debate about products starts.

## A database for each service

In a microservice architecture, each service owns its data and hides it. Other services use the service's API, not its tables. Newman treats this as a central rule (Building Microservices, the parts on data and on splitting the monolith).

- **Why:** a shared database is a hidden contract. When two services read the same table, neither can change that table without the other. They must deploy together, and they are not independent services.
- **The cost:** a query that used to be one join is now two calls, or a copy of data in the reading service. A change that must cover two services needs a [saga](/learn/distributed-transactions), not a transaction.
- **Not one server for each service:** "a database for each service" means a separate schema with one owner. Several schemas can share one database server to save cost, as long as no service reads another's schema.
- **Each service selects its type:** the booking service can use a relational database, and the search service can use a search index. This is polyglot persistence. Each extra type is one more thing to operate, back up, and learn, so add types only when the rating shows a clear gain.

See [Data ownership](/learn/data-ownership) for how to decide which service owns which data, and how to split a shared database.

## Rules that hold most of the time

- **A relational database is the default.** It is flexible, well understood, and handles more load than most systems ever get. Select another type when you can say what the relational one cannot do for you.
- **One main store for each piece of data.** A search index or a [cache](/learn/caching) is a copy that can be built again. Never make the copy the only place for the data.
- **One owner for each store.** One service or module writes it. Others ask the owner. See [How to find component boundaries](/learn/boundaries).
- **Design for the query you have.** A store with no join needs the data arranged in the shape of the read. This is the reason the News Feed worked example keeps one ready list for each user.
- **Keep reports away from the live store.** Analytics go to a copy that is built for scans.

## Interview questions

**"Would you use SQL or NoSQL for this system?"**

- Start from the access patterns and the relations, not from the label.
- Say that relational is the default, and name what would make you leave it: scale beyond one partitioned cluster, a key-only access pattern, or a flexible shape.
- Different data in one system can use different stores.

**"When is a document database a good choice?"**

- When each record is a self-contained tree that is read and written as one unit.
- When the records have different shapes, and schema-on-read helps.
- Name the weakness: many-to-one and many-to-many relations push joins into the code.

**"Why not let two services share one database?"**

- The schema becomes a contract that neither service can change alone.
- The services must deploy together, so they lose their independence.
- Name the cost of the split: no joins and no transactions across services.

**"How do you support analytics on top of the production database?"**

- Separate OLTP from OLAP, so that scans do not slow the live system.
- Copy the data to a warehouse with a pipeline, in batch or as a stream.
- Say how old the warehouse data can be.

## In a kata

Do not write "database" on a box and stop. Write what it holds and how it is found: "Link store (by short code)". If the numbers show that the data does not fit on one server, say how it is split. See [Replication and partitioning](/learn/scaling-data).

For each store, give one sentence on why this type: the access pattern and the relation that decided it. In the [Tutor Marketplace kata](/kata/tutor-marketplace), that is a relational store for bookings and a search index for "find a tutor". In the [Link Shortener kata](/kata/link-shortener), it is a key-value store, because every read is by one key.

## Go deeper

- **Designing Data-Intensive Applications** (Martin Kleppmann), the part on data models and query languages: the relational, document, and graph models, and schema-on-read. The part on storage and retrieval adds OLTP and OLAP.
- **Software Architecture: The Hard Parts** (Ford, Richards, Sadalage, Dehghani), the part on selecting a database type: the rating approach for each main type.
- **Building Microservices** (Sam Newman), the parts on data and on splitting the monolith: why each service hides its database, and how to split a shared one.

## Further reading

- [Database](https://en.wikipedia.org/wiki/Database#Classification) classification and [NoSQL](https://en.wikipedia.org/wiki/NoSQL) on Wikipedia
- [Polyglot persistence](https://martinfowler.com/bliki/PolyglotPersistence.html), by Martin Fowler
- [Database per service](https://microservices.io/patterns/data/database-per-service.html) on microservices.io
- [Online analytical processing](https://en.wikipedia.org/wiki/Online_analytical_processing) on Wikipedia
