## What analytical data is

Operational data runs the business now. It is the booking that a learner makes, the payment, the message to the tutor. Analytical data shows what happened over time. It answers questions such as "which countries grow fastest?" and "which tutors lose learners after the first lesson?". It also trains models, for example the recommender of a tutor marketplace.

The two kinds of data have different users, queries, and shapes. A service database is good at the first kind and poor at the second. So most companies copy operational data into a separate analytical system.

An architect cares for three reasons:

- **The copy is a coupling.** If the analytics team reads each service database, a change to a table breaks reports. The services are coupled again, through the back door.
- **The copy is a design decision.** Batch or stream, raw or cleaned, central or owned by each domain: each choice has costs that last for years.
- **Analytics feeds back.** Recommendations, fraud scores, and prices come from analytical data and return to operational services. That return path is a dependency, and it needs a contract.

The examples on this page use a tutor marketplace. It has services for bookings, payments, reviews, and messages, and a model that recommends tutors.

## Operational and analytical data

DDIA names the two shapes of work OLTP and OLAP. [Storage engines](/learn/storage-engines#oltp-and-olap) compares them in detail. In short:

| Point         | Operational (OLTP)                       | Analytical (OLAP)                             |
| ------------- | ---------------------------------------- | --------------------------------------------- |
| Users         | Learners and tutors, through the app     | Analysts, dashboards, data scientists, models |
| A query       | One booking, by its key                  | All bookings of a year, grouped by country    |
| Data          | The current state                        | The history, often of years                   |
| Freshness     | Exact, now                               | Minutes to a day old is often fine            |
| Schema change | Owned by one team, changes with the code | Must stay stable for many readers             |

The analytical side also uses different storage. Column-oriented stores read only the columns a query needs, and they compress well. See [Column-oriented storage](/learn/storage-engines#column-oriented-storage).

## Getting data out: ETL and ELT

Data moves from the operational systems to the analytical system in three steps: extract, transform, and load. The order of the last two steps gives two approaches.

| Approach | Order                                                     | Strong points                                             | Weak points                                                 |
| -------- | --------------------------------------------------------- | --------------------------------------------------------- | ----------------------------------------------------------- |
| ETL      | Transform in a separate tool, then load the clean result  | Only clean data enters the warehouse. Less storage        | A change in the logic means a new extract. Raw data is lost |
| ELT      | Load the raw data, then transform it inside the warehouse | Raw data stays. You can change the logic and run it again | Storage grows. Raw data needs access control                |

ETL was the norm when warehouse storage was expensive. Cloud warehouses made storage cheap and compute elastic, so ELT is now common. The transformation is often SQL kept under version control and tested like code. dbt is a common tool for this.

### How to extract

The extract step decides how tightly analytics is coupled to the services.

| Method                  | How it works                                      | Problems                                                          |
| ----------------------- | ------------------------------------------------- | ----------------------------------------------------------------- |
| Full copy               | Copy each table each night                        | Slow and heavy for large tables. Data is a day old                |
| Changed rows            | Copy rows with a newer `updated_at`               | Misses deleted rows. Couples analytics to the internal schema     |
| Change data capture     | Read the database log and send each change        | Fresh and complete, but the events still have the internal schema |
| Events from the service | The service publishes events with a public schema | The team must design and maintain the events                      |

The first three methods read the internal tables of a service. A rename in the booking service then breaks a report that the booking team has never seen. The last method uses a public contract, like an API. Change data capture can work as a public contract too, if the team publishes a stable view of the data and not its raw tables. See change data capture in [Stream processing](/learn/batch-and-stream#stream-processing), and [Data ownership](/learn/data-ownership#how-a-service-reads-data-it-does-not-own).

## Schemas for analysis

Most warehouses use a **star schema**: a large fact table with one row for each event, and small dimension tables that describe it. A **snowflake schema** splits the dimensions further. See [Data warehouses and star schemas](/learn/storage-engines#data-warehouses-and-star-schemas) for the structure.

Two more ideas matter in a design:

- **The grain of a fact table.** The grain says what one row is: one booking, one lesson minute, one payment attempt. Decide it first. A table that mixes grains gives wrong sums.
- **History of dimensions.** A tutor moves from Spain to Mexico. Do old lessons count for Spain or Mexico? A **slowly changing dimension** keeps a new row for each version of the tutor, with dates. Then each old fact points to the version that was true at that time.

Two schools of warehouse design exist. Bill Inmon starts with one normalized enterprise model, and builds smaller marts from it. Ralph Kimball starts with star schemas for each business process, and connects them by shared dimensions. Most teams today use something close to Kimball.

## Three generations: warehouse, lake, and mesh

The Hard Parts describes how analytical data has changed over time, in three steps (Software Architecture: The Hard Parts, the part on analytical data). Each step answers the problems of the one before.

### The data warehouse

A central team extracts data from all operational systems. It transforms the data into one schema and loads it into one warehouse. Analysts query that warehouse.

What it does well:

- One place, one schema, and one version of each number.
- Fast queries, because the data is already clean and shaped for analysis.

What goes wrong, as the Hard Parts describes:

- **Tight coupling.** The transformation knows the internal schema of each source. Each change in a source breaks it.
- **Lost domain knowledge.** The central team transforms data it does not understand. The meaning of "an active tutor" lives in the booking team, not in the data team.
- **A bottleneck.** Each new report waits for the one central team.
- **Slow change.** One schema for the whole company is hard to agree on, and hard to change.

### The data lake

The lake reverses the order. Load the raw data first, in its original form, into cheap storage such as object storage. Transform it later, when someone has a question. This is ELT at the scale of a company. DDIA notes the attraction of raw data in its part on batch processing, under the name "sushi principle": raw data is better.

What it does well:

- Nothing is lost. A data scientist can use fields that nobody planned for.
- Loading is simple and cheap.

What goes wrong:

- **The swamp.** Files without owners, documentation, or quality checks. Nobody knows which copy is correct.
- **Hard to find and hard to read.** Each reader must understand the raw schema of each source.
- **Privacy.** Raw data includes personal data. It is copied widely before anyone classifies it.
- **Still central.** One data team still runs it, so the bottleneck stays.

A **lakehouse** adds table formats such as Apache Iceberg, Delta Lake, or Apache Hudi on top of the files. They give schemas, transactions, and versions to data in object storage. This fixes some technical problems of the lake. It does not fix ownership.

### The data mesh

Zhamak Dehghani, one of the authors of the Hard Parts, proposed the data mesh. It applies the ideas of [bounded contexts](/learn/bounded-contexts) and [service ownership](/learn/data-ownership) to analytical data. It has four principles:

| Principle                | Meaning                                                                                 | In the tutor marketplace                                       |
| ------------------------ | --------------------------------------------------------------------------------------- | -------------------------------------------------------------- |
| Domain ownership         | The team that owns a domain also owns its analytical data                               | The booking team publishes booking history                     |
| Data as a product        | Analytical data is a product with users, a contract, documentation, and quality targets | Booking history has a schema, an owner, and a freshness target |
| Self-serve data platform | A platform team gives tools, so each domain team can build data products alone          | Templates for storage, pipelines, catalogs, and access         |
| Federated governance     | Global rules are agreed together and checked by the platform, automatically             | Each data product marks personal fields in the same way        |

The mesh moves the transformation to the people who understand the data. The cost is that each domain team needs data skills, and the company needs a strong platform.

## The data product quantum

The Hard Parts gives the data mesh an architectural unit: the **data product quantum** (DPQ). A DPQ is a separate deployable part, next to an operational service, owned by the same team. It holds the analytical form of the data of that service. Readers use its output, never the service database.

```diagram
{
  "nodes": [
    { "id": "booking", "label": "Booking service", "shape": "box", "col": 0, "row": 0 },
    { "id": "bookingdb", "label": "Bookings\n(operational)", "shape": "store", "col": 0, "row": 1.2 },
    { "id": "bookingdpq", "label": "Booking history\n(source-aligned DPQ)", "shape": "store", "col": 1, "row": 0 },
    { "id": "review", "label": "Review service", "shape": "box", "col": 0, "row": 2.4 },
    { "id": "reviewdpq", "label": "Review history\n(source-aligned DPQ)", "shape": "store", "col": 1, "row": 2.4 },
    { "id": "tutor", "label": "Tutor performance\n(aggregate DPQ)", "shape": "store", "col": 2, "row": 1.2 },
    { "id": "features", "label": "Recommender features\n(fit-for-purpose DPQ)", "shape": "store", "col": 3, "row": 1.2 }
  ],
  "groups": [
    { "id": "bookingteam", "label": "Booking team", "col": 0, "row": 0, "cols": 2, "rows": 2 }
  ],
  "edges": [
    { "from": "booking", "to": "bookingdb", "label": "writes" },
    { "from": "booking", "to": "bookingdpq", "label": "events", "async": true },
    { "from": "review", "to": "reviewdpq", "label": "events", "async": true },
    { "from": "bookingdpq", "to": "tutor", "label": "output port" },
    { "from": "reviewdpq", "to": "tutor", "label": "output port" },
    { "from": "tutor", "to": "features" }
  ]
}
```

The Hard Parts names three kinds:

| Kind                          | What it holds                             | Example                                            |
| ----------------------------- | ----------------------------------------- | -------------------------------------------------- |
| Source-aligned (native)       | The analytical form of one service's data | Booking history, with each booking and its changes |
| Aggregate                     | A join of several source-aligned products | Tutor performance: bookings, reviews, and payments |
| Fit-for-purpose (custom-made) | Data shaped for one use                   | The feature table that trains the recommender      |

### How a DPQ relates to its service

- **Separate quantum.** The DPQ deploys alone and has its own storage. A heavy analytical query cannot slow the booking service. See [Architecture quanta](/learn/architecture-quantum).
- **Coupled by events.** The service sends changes to the DPQ asynchronously. The DPQ is eventually consistent with the service.
- **Same owner.** The team changes the service and its DPQ together. When the booking table changes, the same team updates the transformation, so the public output stays stable.
- **A contract on the output.** Readers depend on the output port, which has a schema and a version. It is an API for analytical data.

The trade-off is clear. The mesh removes the central bottleneck and the coupling to internal schemas. It adds a second deployable part to each team, and contracts that teams must coordinate.

## Federated governance

A mesh without shared rules becomes many small swamps. Federated governance means that domain teams and the platform team agree on a few global rules. The platform then checks them automatically, which is the "computational" part of the term.

Typical global rules:

- **Identifiers.** A tutor has the same ID in every data product, so an aggregate can join them.
- **Personal data.** Each field that holds personal data has a tag. The platform masks it for most readers, and deletes it when a user asks.
- **Quality and freshness.** Each product states a target, for example "updated within 1 hour, 99% of days". The platform measures it.
- **Discovery.** Each product is in a catalog, with its owner, schema, and documentation.

These rules are close to the [fitness functions](/learn/measuring-characteristics#fitness-functions) of an architecture. They are checked by code, not by a committee.

A written agreement for one data product is often called a **data contract**: the schema, the meaning of each field, the freshness target, the owner, and the rules for change.

## Comparing the approaches

| Point                 | Data warehouse                   | Data lake                       | Data mesh                                    |
| --------------------- | -------------------------------- | ------------------------------- | -------------------------------------------- |
| Who owns the data     | A central data team              | A central data team             | Each domain team                             |
| When data is shaped   | Before loading                   | When someone reads it           | By the domain team, before publishing        |
| Coupling to services  | High: to internal schemas        | High: readers parse raw schemas | Low: to published output ports               |
| Speed of a new report | Slow: waits for the central team | Fast to start, slow to trust    | Fast, if the products exist                  |
| Main risk             | The bottleneck                   | The swamp                       | Uneven quality, and duplicated platform work |
| Needs                 | A strong central team            | Cheap storage and discipline    | A platform team, data skills in each domain  |

When each one fits:

- **One team, one product, one database.** Use a read replica, or a small warehouse loaded with ELT. A mesh is far too much.
- **Several teams, a growing number of sources.** Use a warehouse or lakehouse, with events or published views from each service, not raw tables.
- **Many domains, many teams, and a central data team that is a bottleneck.** Consider a data mesh. It works best when the operational side already has clear domain ownership, for example [microservices](/learn/microservices) along bounded contexts.

A mesh with no platform, or with all products built by one central team, is a mesh in name only. It has the costs of a mesh and the bottleneck of a warehouse.

## How an architect connects operational and analytical data

1. **Forbid direct reads of service databases** by analytical tools. Each service publishes events, a stable view, or a data product.
2. **Treat analytical output as a public contract**, with a schema, a version, and rules for change. See [Encoding and evolution](/learn/encoding-and-evolution).
3. **Give the analytical form an owner.** In a mesh, it is the domain team. In a warehouse, write down who answers for each source.
4. **Keep the history.** Events with their event time make history easy. Snapshots of the current state lose changes between snapshots.
5. **State the freshness that each use needs.** A daily report can use batch. A fraud check needs a stream. See [Batch and stream processing](/learn/batch-and-stream).
6. **Plan for deletion.** When a learner asks to be forgotten, every copy must change: the lake, the warehouse, and each data product. Tag personal data at the source.
7. **Exclude test data.** Synthetic orders and test accounts from [testing in production](/learn/testing-strategy) must not reach the reports.
8. **Design the return path.** When the recommender sends scores back to the app, that is a new dependency. Give it a contract, a freshness target, and a fallback, such as the most popular tutors.

## Failure modes

| Failure                             | What occurs                                                     | Fix                                                     |
| ----------------------------------- | --------------------------------------------------------------- | ------------------------------------------------------- |
| Reports read service databases      | A table change breaks reports. Analytics slows the service      | Events or data products with a public schema            |
| Two definitions of one number       | Finance and product report different revenue                    | One owner for each metric, and one published definition |
| A swamp                             | Nobody trusts the data, so each team copies it again            | Owners, a catalog, and quality targets                  |
| Silent pipeline failure             | A job stops, and dashboards show old data as if it were current | Freshness checks that alert                             |
| Personal data copied everywhere     | Deletion requests cannot be met                                 | Tags at the source, and masking by the platform         |
| Model outputs used with no contract | A bad model run changes prices or rankings in production        | A contract, a quality check, and a fallback             |

## In a kata

Add a short part about analytical data when the kata names reports, dashboards, or machine learning:

1. Name the analytical questions and how fresh each answer must be.
2. Show how data leaves each service: events or a published view, never the service database.
3. Choose one approach: a warehouse for a small system, a mesh for many domains. Give one reason.
4. Name the return path, if analytics feeds the product.

In the [Tutor Marketplace kata](/kata/tutor-marketplace), the recommender is the center of the product. Show the data products that feed it, and the fallback when its scores are old. In the [Front Row kata](/kata/front-row), promoters want sales reports during a sale. Send sale events to an analytical store, so reports never touch the seat database during the rush.

## Interview questions

**"Why not run reports directly on the production database?"**

- Analytical queries scan large tables and slow down customer requests.
- The OLTP schema and storage are not shaped for aggregates over years.
- Reports become coupled to the internal schema of each service.
- A replica fixes only the load, not the coupling.

**"Compare ETL and ELT."**

- ETL shapes data before loading. Less storage, but raw data is lost.
- ELT loads raw data and shapes it in the warehouse. You can run new logic on old data.
- Cheap cloud storage and compute made ELT common.
- Both need a contract with the source, or they break when the source changes.

**"What is a data mesh, and when would you not use one?"**

- Four principles: domain ownership, data as a product, a self-serve platform, and federated governance.
- It removes the central bottleneck and the coupling to internal schemas.
- It needs data skills in each team and a strong platform team.
- Do not use it for a small company, or when the operational side has no clear domains.

**"How do operational services feed analytical data without coupling?"**

- Publish events or a stable view with a schema, not raw tables.
- In a mesh, each service has a data product quantum, owned by the same team.
- The analytical side is eventually consistent, and that must be acceptable.
- Version the output, and treat a change like an API change.

**"A data scientist needs booking data for a model. What do you design?"**

- A source-aligned product for bookings, and a fit-for-purpose product for the features.
- Personal data masked or removed, by a platform rule.
- A freshness target and a quality check on the output.
- A contract and a fallback for the scores that return to the app.

## Go deeper

- **Designing Data-Intensive Applications**, Martin Kleppmann, the part on storage and retrieval: OLTP and OLAP, data warehouses, star schemas, and column storage.
- **Designing Data-Intensive Applications**, the parts on batch and stream processing: raw data in distributed file systems, derived data, and change data capture.
- **Software Architecture: The Hard Parts**, Ford, Richards, Sadalage, and Dehghani, the part on analytical data: the warehouse, the lake, the data mesh, and the data product quantum, with their trade-offs.

## Further reading

- [Data Mesh Principles and Logical Architecture](https://martinfowler.com/articles/data-mesh-principles.html), by Zhamak Dehghani, on martinfowler.com
- [How to Move Beyond a Monolithic Data Lake to a Distributed Data Mesh](https://martinfowler.com/articles/data-monolith-to-mesh.html), by Zhamak Dehghani, on martinfowler.com
- [Data warehouse](https://en.wikipedia.org/wiki/Data_warehouse), [Data lake](https://en.wikipedia.org/wiki/Data_lake), and [Slowly changing dimension](https://en.wikipedia.org/wiki/Slowly_changing_dimension) on Wikipedia
- [Extract, transform, load](https://en.wikipedia.org/wiki/Extract,_transform,_load) on Wikipedia
