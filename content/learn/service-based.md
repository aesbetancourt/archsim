## The shape in more detail

Richards and Ford describe service-based architecture as a hybrid of the microservices style (Fundamentals of Software Architecture, the part on service-based architecture). It is distributed, but it keeps much of the simplicity of a monolith. The basic topology has three parts:

1. **A user interface** that is deployed on its own.
2. **A few coarse domain services**, each deployed on its own. A domain service covers one large business area, not one small job.
3. **A database**, usually one that all services share.

The usual number of services is roughly 4 to 12. Each service is a large, self-contained part of the business. In a parcel service, the services can be booking, dispatch, tracking, billing, and customer accounts.

A service usually runs as one instance. You can run several instances behind a load balancer for load or for availability. With several instances, each one must not keep a user session in memory, or the load balancer must send a user to the same instance each time.

The user interface calls the services directly, through a simple remote call such as REST or gRPC. Services rarely call each other. Each service has enough code and data to do its full job alone. This is the main difference from microservices, where one request often crosses several services.

## User interface variants

The user interface can take three forms. Each step gives more independence and more parts to operate.

| Variant                 | What it is                                         | When it fits                                          |
| ----------------------- | -------------------------------------------------- | ----------------------------------------------------- |
| One user interface      | One web or mobile application calls all services   | One group of users, one team for the front end        |
| One for each user group | Separate applications for separate groups of users | Customers and staff use different parts of the system |
| One for each service    | Each service has its own screens                   | Rare. Each service is almost a separate product       |

In the parcel service, a common choice is two user interfaces. Customers use one application to book and to follow parcels. Depot staff use a second application for dispatch and billing. Each application calls only the services that its users need.

## Database variants

The database decides more about this style than any other part. Richards and Ford name three options.

| Variant               | What it is                                                     | Gain                                       | Cost                                            |
| --------------------- | -------------------------------------------------------------- | ------------------------------------------ | ----------------------------------------------- |
| One shared database   | All services use one database and one schema                   | Simple joins and transactions, simple data | A schema change can break each service          |
| Logically partitioned | One database, with a separate schema or table group per domain | Clear table ownership, smaller blast area  | Discipline is necessary to keep the partitions  |
| One database for each | Each service has its own database                              | Full independence of data                  | Data across services needs calls, events, sagas |

Most designs start with one shared database. The risk is change. If each service uses one shared library of entity classes for all tables, a change to one table means a new build of each service. A column added for billing then forces a release of dispatch and tracking.

The fix is to partition the database logically and to split the shared code to match:

1. Group the tables by domain: booking tables, dispatch tables, billing tables.
2. Give each group its own small library of entity classes.
3. Let each service use only the libraries of the groups that it reads or writes.
4. Keep a separate library for the few tables that all services use, such as the customer table.
5. Control changes to the common tables strictly. One person or one team approves each change.

A change to a billing table now affects only the services that use the billing library. Usually, that is only the billing service.

```diagram
{
  "nodes": [
    { "id": "web", "label": "Customer app", "shape": "actor", "col": 0.5, "row": 0 },
    { "id": "staff", "label": "Depot staff app", "shape": "actor", "col": 2.5, "row": 0 },
    { "id": "proxy", "label": "API layer\n(reverse proxy)", "shape": "box", "col": 1.5, "row": 1 },
    { "id": "booking", "label": "Booking\nservice", "shape": "box", "col": 0, "row": 2 },
    { "id": "tracking", "label": "Tracking\nservice", "shape": "box", "col": 1, "row": 2 },
    { "id": "dispatch", "label": "Dispatch\nservice", "shape": "box", "col": 2, "row": 2 },
    { "id": "billing", "label": "Billing\nservice", "shape": "box", "col": 3, "row": 2 },
    { "id": "db", "label": "One database\n(a schema for each domain)", "shape": "store", "col": 1.5, "row": 3.2 }
  ],
  "edges": [
    { "from": "web", "to": "proxy" },
    { "from": "staff", "to": "proxy" },
    { "from": "proxy", "to": "booking" },
    { "from": "proxy", "to": "tracking" },
    { "from": "proxy", "to": "dispatch" },
    { "from": "proxy", "to": "billing" },
    { "from": "booking", "to": "db" },
    { "from": "tracking", "to": "db" },
    { "from": "dispatch", "to": "db" },
    { "from": "billing", "to": "db" }
  ]
}
```

The shared database makes the full system one [architecture quantum](/learn/architecture-quantum#a-shared-database-makes-one-quantum). When the database is down, all services are down. This is an accepted cost of the style, not a mistake. If one service needs its own availability or its own scale, give it its own database. That service then becomes a separate quantum.

## The API layer

An API layer is optional. It is a reverse proxy or a gateway between the user interfaces and the services. Add one for these reasons:

- **Cross-cutting concerns.** Identity checks, rate limits, request logs, and metrics in one place.
- **External callers.** Partner systems, such as an online shop that books parcels, call one stable address.
- **One address for each client.** The user interface does not need to know where each service runs.

Keep business rules out of the API layer. If it starts to combine the results of several services, it becomes an orchestrator that each team must change. See [The API gateway](/learn/api-design#the-api-gateway).

## Service design and granularity

A domain service is large, so it needs an internal structure. Richards and Ford describe a common one:

- **An API facade** at the edge. It receives each request from the user interface and calls the internal parts in the correct order.
- **Business logic** below it.
- **Data access** at the bottom.

Inside this, you can organize the code in two ways. The code can follow technical layers, like a [layered](/learn/layered) application. Or it can follow sub-domains: in the billing service, separate packages for invoices, credit notes, and payment runs. The second way keeps each business change in one package. Each service is a small [modular monolith](/learn/modular-monolith).

The key fact: in this style, the **orchestration of a business request is inside one service**. In microservices, the same orchestration is between services, across the network.

Take one request: "book a parcel". In the parcel service, the booking service checks the address, calculates the price, reserves a pickup slot, and saves the booking. Four steps, one process, one database. In a microservices design, address, pricing, slots, and bookings can be four services. The same request is then four network calls and one saga.

### ACID inside a service

Because one service owns a full business request, it can use a normal database transaction. "Reserve the slot and save the booking" is one ACID transaction: it commits as a whole, or it does not commit. See [Transactions and isolation](/learn/transactions-isolation).

This is the strongest technical reason to select the style. You get separate deployment for each business area, and you keep transactions for most business requests. Compare this with [distributed transactions](/learn/distributed-transactions), where each step commits alone and a failure needs compensation.

A transaction across two services is still a problem. If "close the month" must change billing and dispatch data in one step, the two services cannot share one transaction through their APIs. You have three options:

1. Move the full request into one service.
2. Let one service write the tables of both domains, and accept the coupling. This is easy with a shared database, and it is a common source of decay.
3. Use a saga, and accept a middle state.

### Granularity trade-offs

A coarse service has costs of its own:

- **Larger changes.** A change to the invoice code means a release of the full billing service. The test scope is the full service.
- **Larger risk in each release.** A fault in the payment-run code can stop invoices too.
- **Coarse scaling.** If only the tracking lookups are busy, you still scale the full tracking service with all its code.

For the forces that tell you to split or to join a service, see [Service granularity](/learn/service-granularity).

## How the style handles each characteristic

| Characteristic  | How the style handles it                                                                     |
| --------------- | -------------------------------------------------------------------------------------------- |
| Deployability   | Each service deploys alone. A release is smaller and less risky than a release of a monolith |
| Fault tolerance | A crash in one service does not stop the others. The database is a shared point of failure   |
| Scalability     | Each service scales alone, in coarse steps. The shared database limits the total             |
| Elasticity      | Low to medium. Large services start slowly, and the database does not grow fast              |
| Performance     | Good. Few calls between services, and most requests make one network hop                     |
| Testability     | Good. Each service has a clear scope, and most tests need only one service and the database  |
| Simplicity      | Medium. A few services to deploy and monitor, but no saga or event broker is necessary       |
| Cost            | Medium. Fewer moving parts than microservices or event-driven designs                        |

## Why it is a pragmatic choice

Richards and Ford present service-based architecture as one of the most pragmatic styles. The reasons:

- **It follows the domain.** Each service matches a business area, so a business change usually stays in one service.
- **It keeps transactions.** Most business requests stay ACID.
- **It needs little new technology.** No broker, no service mesh, and no distributed tracing are necessary to start. Good logs with a request ID are usually enough.
- **It suits a small or a medium team.** Four to twelve services are a load that one or two teams can operate.
- **It is a good place to stop.** Many systems never need more. Others use it as a step on the way to microservices.

Newman makes a related point (Building Microservices, the part on when to use microservices). A team must have a clear reason, such as independent deployment or independent scale, before it splits a system into many services. A few coarse services often give most of the benefit.

## Common mistakes

- **Services that call each other for each request.** If booking calls customer accounts and pricing for each booking, the boundaries are wrong. Move the data or merge the services.
- **One shared entity library for all tables.** Each schema change forces a release of each service. Partition the library with the tables.
- **No owner for each table.** Two services write the same table with different rules. Name one owner for each table, as in [Data ownership](/learn/data-ownership#who-owns-each-table).
- **Expecting independent availability.** All services depend on one database. If a part must stay up when others are down, it needs its own data.
- **Too many services.** At 20 or 30 services that share one database, you have the costs of microservices and the coupling of a monolith. This is a [distributed monolith](/glossary#distributed-monolith).

## How it fails

- **The database fails or is slow.** All services fail or are slow at the same time. Use a database with a standby copy and automatic failover.
- **A long query in one service** uses the connections or the locks of the database, and the other services wait. Give each service its own connection pool with a limit, as a [bulkhead](/learn/resilience).
- **A schema change breaks a service that the team forgot.** Use [expand and contract](/learn/deployment#database-changes-expand-and-contract) for each schema change, and a test suite for each service that runs against the new schema.

## How it evolves

Service-based architecture is a common middle position. Systems move into it, and some move on from it.

**From a monolith.** Split a [modular monolith](/learn/modular-monolith) along its modules. Each module becomes a domain service. Keep the database at first. This is the lowest-risk first step in most [decompositions](/learn/decomposing-a-monolith).

**Toward microservices.** When one service meets a strong force, split only that service:

1. Find the force: much higher load, very different change rate, stronger security needs.
2. Split the code of that service into smaller services.
3. Move its tables into a separate database.
4. Replace the direct table reads of other services with calls or events.

The rest of the system can stay coarse. A mixed system, with a few coarse services and a few fine ones, is a normal result.

**Back again.** If two services always change together, join them. A merge is a normal correction.

## Compared with its neighbors

|                          | Modular monolith | Service-based                  | Microservices                          |
| ------------------------ | ---------------- | ------------------------------ | -------------------------------------- |
| Deployments              | One              | A few (roughly 4 to 12)        | Many                                   |
| Database                 | One              | Usually one, often partitioned | One for each service                   |
| Transactions             | ACID everywhere  | ACID inside each service       | Sagas across services                  |
| Calls between services   | None             | Few                            | Many                                   |
| Quanta                   | One              | Usually one                    | Many                                   |
| Operational tools needed | Basic            | Basic, plus a load balancer    | Automation, tracing, service discovery |

## In a kata

Service-based is a strong default for a medium kata with a small team.

- In [Lunch Rush](/kata/lunch-rush), a team of four can operate orders, menus, and notifications as three services with one database. The kitchen screens can use the order service directly.
- In [Waiting Room](/kata/waiting-room), appointments, visit notes, and billing are natural domain services. The visit notes service can get its own database for the stricter access audit.
- In [Tow Line](/kata/tow-line), dispatch has a very different load during storms. A strong answer keeps most services coarse and gives dispatch its own data and scale.

In each answer, name the database variant and say why. Say which service you would split first, and which force would cause it.

## Interview questions

**"How is service-based architecture different from microservices?"**

- Fewer, larger services: one for each business area, not one for each small capability.
- Usually one shared database. Microservices have one database for each service.
- Orchestration of a request is inside one service, so most requests keep ACID transactions.
- Usually one architecture quantum, so less independence and less operating cost.

**"Your services share one database. How do you stop schema changes from breaking all of them?"**

- Partition the database logically by domain, with one owner for each table group.
- Split the shared entity library to match the partitions.
- Control the common tables strictly.
- Use expand and contract for each change.

**"When would you choose service-based over microservices?"**

- The team is small, or the budget for operations is limited.
- Most business requests need ACID transactions.
- The load is not extreme, and it is not very uneven between areas.
- The domain is still changing, so a coarse split is safer.

**"How would you move from service-based to microservices?"**

- Not as one project. Split one service at a time, when a force appears.
- Move the data of the split service out of the shared database.
- Replace direct table reads with calls or events.
- Accept a mixed system as the end state.

## Go deeper

- **Fundamentals of Software Architecture** (Richards, Ford), the part on service-based architecture: the topology, its variants, the logical partition of the database, and service design.
- **Software Architecture: The Hard Parts** (Ford, Richards, Sadalage, Dehghani), the parts on data decomposition and service granularity: how to split a shared database, and when to split a coarse service.
- **Building Microservices** (Newman), the part on when microservices are a poor choice: the reasons to stay with fewer, larger services.
- **Designing Data-Intensive Applications** (Kleppmann), the part on transactions: what a single-database ACID transaction gives you, so you know what a split loses.

## Further reading

- [Integration database](https://martinfowler.com/bliki/IntegrationDatabase.html), by Martin Fowler
- [Shared database](https://microservices.io/patterns/data/shared-database.html) on microservices.io
- [Monolith first](https://martinfowler.com/bliki/MonolithFirst.html), by Martin Fowler
