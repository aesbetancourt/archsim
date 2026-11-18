## Domain partitioning in one deployment

A modular monolith is one deployable unit whose top-level parts are business areas. Each part is a module: a unit of code with a public interface, hidden internals, and its own data. The modules run in one process and are released together.

It combines two decisions that are often confused:

| Decision     | Modular monolith | Layered application | Microservices |
| ------------ | ---------------- | ------------------- | ------------- |
| Partitioning | Domain           | Technical           | Domain        |
| Deployment   | One unit         | One unit            | Many units    |
| Quanta       | One              | One                 | Many          |

So it has the change profile of microservices (a feature change stays in one module) and the operating profile of a monolith (one pipeline, one process to watch, local calls). Newman (Building Microservices) argues that it is an underrated choice for many teams. Richards and Ford (Fundamentals of Software Architecture) describe it as its own style, built on domain partitioning.

The modules follow the business areas that you found in [Component boundaries](/learn/boundaries). Each module is often one [bounded context](/learn/bounded-contexts), but a large context can hold several modules.

## Inside a module

A module has three parts:

1. **A public interface.** The functions, commands, queries, and events that other modules can use. It is small and stable.
2. **Internals.** The domain model, the rules, the persistence code. Nobody outside the module can import them.
3. **Its data.** The tables that only this module reads and writes.

Inside a module, you can use any structure: a few small layers, a [hexagonal](/learn/hexagonal) core with adapters, or [vertical slices](/learn/vertical-slices). Different modules can use different structures. A simple reference-data module can be plain CRUD, and the pricing module can have a rich [domain model](/learn/domain-model).

A sketch for a lunch shop:

```text
src/modules/
  ordering/
    index.ts          public interface: placeOrder, getOrder, OrderPlaced
    internal/         domain model, rules, repositories
  menu/
    index.ts          public interface: getMenu, priceOf
    internal/
  kitchen/
    index.ts          public interface: KitchenTicket, markReady
    internal/
  payments/
    index.ts
    internal/
```

The interface is where the [deep module](/learn/deep-modules#deep-and-shallow-modules) idea applies at a large scale. A good module hides a lot of logic behind a few operations.

## How to enforce the boundaries

The boundaries in a modular monolith exist only in the code. Nothing physical stops a developer from importing an internal class of another module. Under deadline pressure, someone will. Without checks, a modular monolith decays into a [big ball of mud](/learn/styles#a-short-history) within months. So you must make the boundaries checkable.

| Mechanism                 | Examples                                                         | What it stops                            |
| ------------------------- | ---------------------------------------------------------------- | ---------------------------------------- |
| Language visibility       | Java modules with `exports`, `internal` in C# across assemblies  | Imports of hidden types, at compile time |
| Separate build units      | One package for each module in a monorepo, with an `exports` map | Deep imports into another package        |
| Framework support         | Spring Modulith, Packwerk for Ruby                               | Use of another module's internals        |
| Fitness functions         | ArchUnit, dependency-cruiser, custom tests                       | Imports that break a rule, at build time |
| Code review and ownership | A code owners file for each module                               | Changes to a module without its owners   |

A fitness function is an automated check of an architecture rule. See [Measure and protect characteristics](/learn/measuring-characteristics#fitness-functions). Two rules protect most modular monoliths:

- **No cycles between modules.** See the example in [No cycles between modules](/learn/measuring-characteristics#examples-of-fitness-functions).
- **Only the public interface.** A module can import another module's `index.ts`, never its `internal/` folder.

Here is the second rule as a dependency-cruiser rule. The `$1` refers to the module that the import comes from, so a module can still use its own internals:

```json
{
  "forbidden": [
    {
      "name": "only-public-interface",
      "severity": "error",
      "from": { "path": "^src/modules/([^/]+)/" },
      "to": {
        "path": "^src/modules/[^/]+/internal/",
        "pathNot": "^src/modules/$1/"
      }
    }
  ]
}
```

Add a third rule for the data: no module reads the tables of another module. Code checks cannot see SQL strings well, so enforce this with database permissions. Give each module its own database user, with rights only on its own schema.

## A database schema for each module

The shared database is the most common way that a modular monolith loses its modules. The code has clean boundaries, but the queries join across all tables. Then a change to one table breaks three modules, and no module can leave as a service.

The options, from weakest to strongest separation:

| Option                        | How it works                                            | What it costs                                         |
| ----------------------------- | ------------------------------------------------------- | ----------------------------------------------------- |
| Shared tables                 | Any module uses any table                               | Hidden coupling. The modules are modules in name only |
| Table ownership by convention | Each table belongs to one module, by name prefix        | Easy to break. Needs review discipline                |
| A schema for each module      | One database server, one schema and one user per module | No joins across modules. Reads go through interfaces  |
| A database for each module    | Separate databases, perhaps on one server               | No shared transaction. Close to a service split       |

A schema for each module is the usual sweet spot. It keeps one database to back up and operate, and it makes ownership visible and enforceable. The rules:

- A module reads and writes only its own schema.
- No foreign keys across schemas. A module stores the ID of an entity from another module, not a constraint to its table.
- No joins across schemas. If ordering needs the dish name, it asks the menu module, or it keeps its own copy of the name.

The ownership rules are the same as between services. See [Data ownership](/learn/data-ownership#who-owns-each-table).

### Transactions across modules

One database makes one transaction across modules possible. It is a temptation. A transaction that spans the ordering and payment schemas works today, but it is a hidden contract: the two modules can never be separated without a redesign.

A safer rule: one transaction changes the data of one module. When a workflow crosses modules, the first module commits and publishes an event, and the next module reacts. That is the same shape as a saga across services, but with much less risk, because the event is delivered in process. When a cross-module transaction is truly needed, keep it, and record it as a known coupling in a [decision record](/learn/decision-records).

## Communication between modules

Modules talk through their public interfaces. There are three common ways.

| Way               | How it works                                                    | Good for                                            |
| ----------------- | --------------------------------------------------------------- | --------------------------------------------------- |
| Direct calls      | Module A calls a function in the interface of module B          | Queries, and commands that need an answer now       |
| In-process events | Module A publishes an event. Subscribers in other modules react | Side effects, where A does not depend on the result |
| A mediator        | A workflow module calls several modules in order                | A business process that spans several modules       |

```diagram
{
  "nodes": [
    { "id": "ordering", "label": "Ordering\n(module)", "shape": "module", "col": 0, "row": 0 },
    { "id": "menu", "label": "Menu\n(module)", "shape": "module", "col": 1, "row": 0 },
    { "id": "kitchen", "label": "Kitchen\n(module)", "shape": "module", "col": 2, "row": 0 },
    { "id": "bus", "label": "In-process\nevent bus", "shape": "pipe", "col": 1, "row": 1 },
    { "id": "s1", "label": "ordering\nschema", "shape": "store", "col": 0, "row": 2.3 },
    { "id": "s2", "label": "menu\nschema", "shape": "store", "col": 1, "row": 2.3 },
    { "id": "s3", "label": "kitchen\nschema", "shape": "store", "col": 2, "row": 2.3 }
  ],
  "groups": [
    { "id": "app", "label": "One deployment", "col": 0, "row": 0, "cols": 3, "rows": 1.6 },
    { "id": "dbg", "label": "One database server", "col": 0, "row": 2.3, "cols": 3, "rows": 1 }
  ],
  "edges": [
    { "from": "ordering", "to": "menu", "label": "priceOf()" },
    { "from": "ordering", "to": "bus", "label": "OrderPlaced", "async": true },
    { "from": "bus", "to": "kitchen", "async": true },
    { "from": "ordering", "to": "s1" },
    { "from": "menu", "to": "s2" },
    { "from": "kitchen", "to": "s3" }
  ]
}
```

Guidance for each:

- **Make calls coarse.** A call such as `priceOf(order)` is better than ten calls to `priceOfItem`. A coarse call is cheap now and survives a later move to a network.
- **Pass data, not objects.** Return plain data types from an interface, not internal entities. An entity that crosses a boundary leaks the model of its owner.
- **Name events in business words.** `OrderPlaced`, not `OrderRowInserted`. See [Messaging](/learn/messaging).
- **Know the event delivery rules.** An in-process event is lost if the process crashes after the commit and before the handler runs. If that loss matters, write the event to an outbox table in the same transaction, and deliver it from there.

## How a request moves

A customer of the lunch shop places an order.

1. The HTTP endpoint in the ordering module reads the request.
2. Ordering calls `menu.priceOf(items)` through the menu interface. It is a local function call.
3. Ordering saves the order in its own schema, in one transaction.
4. Ordering publishes `OrderPlaced`.
5. The kitchen module reacts. It creates a kitchen ticket in its own schema.
6. The endpoint returns the order number to the customer.

Each step is a local call, so the request is fast and easy to trace. A stack trace shows the whole path.

## How it handles each characteristic

| Characteristic  | How the modular monolith behaves                                                                    |
| --------------- | --------------------------------------------------------------------------------------------------- |
| Simplicity      | High. One deployment, local calls, one place to debug.                                              |
| Cost            | Low. One pipeline and one database server.                                                          |
| Maintainability | High while the boundaries hold. A feature change stays in one module.                               |
| Testability     | Good. You can test each module through its interface, with the other modules replaced.              |
| Deployability   | Medium. Every change is a release of the whole unit. Good tests and small changes keep it frequent. |
| Scalability     | Limited. All modules scale together, and they share the database server.                            |
| Fault tolerance | Low. A crash or a memory leak in one module stops all of them.                                      |
| Team autonomy   | Medium. Teams own modules, but share one release train. Practical for a few teams, hard for many.   |

## How it becomes a set of services

A good modular monolith is the best starting point for services, because the hard work is done. The boundaries exist, the data is separated, and the interfaces are known.

Move a module out only for a named reason: it needs a different level of scale, availability, security, or release cadence. See [One deployment or many](/learn/distributed#how-to-decide). The steps:

1. **Pick the module.** Choose one with few incoming calls and a clear reason to leave.
2. **Check its data.** Its schema must have no foreign keys or joins from other modules. Fix that first, inside the monolith.
3. **Check its calls.** Count the calls through its interface for each request. A chatty interface becomes slow over a network. Make it coarse first.
4. **Put the interface behind a client.** Other modules call a client object with the same interface. At first, the client calls the module in process.
5. **Deploy the module as a service.** Switch the client to a network call. Switch in-process events to a message broker.
6. **Move the data.** Move its schema to a separate database.
7. **Add the distributed concerns.** Timeouts, retries, [circuit breakers](/learn/resilience), and tracing.

The [strangler fig](/learn/evolution#the-strangler-fig) and [branch by abstraction](/learn/evolution#other-techniques-for-change-in-steps) patterns fit steps 4 and 5. If the code is not yet modular, start with [Decomposing a monolith](/learn/decomposing-a-monolith).

Often the right result is not microservices. A few large services around a shared database server is [service-based](/learn/service-based) architecture, a common and cheaper next step.

## Versus a distributed monolith

A distributed monolith looks like microservices and behaves like one tangled unit. The comparison shows why a modular monolith is usually the better place to be:

| Property            | Modular monolith            | Distributed monolith                           |
| ------------------- | --------------------------- | ---------------------------------------------- |
| Deployments         | One                         | Many, but they must release together           |
| Boundaries          | Clear, and checked by tools | Unclear. Services share tables or libraries    |
| Calls between parts | Local and fast              | Network calls, often in long chains            |
| Failure             | One unit fails as one       | Partial failures, and one fault spreads        |
| Transactions        | Local, simple               | Cross-service, often unsafe                    |
| Cost                | Low                         | High: the cost of distribution with no benefit |

The distributed monolith usually comes from a split before the boundaries were clear, or a split by technical layer. See [The distributed monolith](/learn/modularity#the-distributed-monolith) for the signs. The fix is often to merge services back into a modular monolith, then split again along business lines.

## How it fails

- **Boundaries with no checks.** The folders look modular, but the imports cross freely. After a year it is a big ball of mud.
- **A shared schema.** Clean code, but every query joins all tables. No module can change its data alone.
- **A shared "common" module that grows.** Business rules move into a shared library because it is easy. Every module now depends on it.
- **Modules by entity.** A `customer` module, an `order` module, a `product` module, each with only data access. The logic is spread across all of them. This is the [entity trap](/learn/boundaries#the-entity-trap).
- **Too many teams on one release.** Ten teams on one release train wait for each other. That is a signal to move some modules out.

## In a kata

In [Lunch Rush](/kata/lunch-rush), a modular monolith fits a small team and modest load. A strong answer:

1. Names the modules: ordering, menu, kitchen, payments, and perhaps loyalty.
2. Gives each module its own schema, and says how ordering gets dish names and prices.
3. Shows one direct call and one event between modules.
4. Names the fitness functions that keep the boundaries.
5. Names the first module to leave and the trigger. For example: "Payments leaves when the card provider requires a separate security zone."

## Interview questions

**"What is a modular monolith, and why choose it over microservices?"**

- One deployment, divided into modules by business area, each with its interface and its data.
- A feature change stays in one module, as with services.
- No network between modules: lower cost, simpler debugging, local transactions.
- It keeps the option to move a module out later, when there is a named reason.

**"How do you stop the modules from coupling over time?"**

- Fitness functions in the build: no cycles, no imports of other modules' internals.
- Language or build features: module exports, separate packages, internal visibility.
- A schema and a database user for each module, with no cross-schema joins.
- Code owners for each module.

**"How do modules share data?"**

- Through the interface of the owner, with a query that returns plain data.
- Through events that let another module keep its own copy.
- Never by a direct read of another module's tables.

**"How would you move a module out into a service?"**

- First make sure its data and its interface are clean, inside the monolith.
- Put a client in front of the interface, then switch the client to a network call.
- Move the events to a broker and the schema to its own database.
- Add timeouts, retries, and tracing.

**"What is the difference between a modular monolith and a distributed monolith?"**

- The modular monolith has one deployment and clean boundaries.
- The distributed monolith has many deployments and tangled boundaries.
- The first is cheap and honest. The second pays for distribution and gets no independence.

## Go deeper

- **Fundamentals of Software Architecture** (Richards, Ford), the parts on the modular monolith style and on domain partitioning: module topologies, data, and communication between modules.
- **Building Microservices** (Newman), the part on the kinds of monolith: why a modular monolith is a valid target, and how to split one later.
- **Software Architecture: The Hard Parts** (Ford, Richards, Sadalage, Dehghani), the parts on component-based decomposition and on data ownership: how to get from a tangled code base to clean modules.
- **Domain-Driven Design** (Evans), the parts on modules and bounded contexts: where the lines between modules belong.

## Further reading

- [Monolith First](https://martinfowler.com/bliki/MonolithFirst.html), by Martin Fowler
- [MicroservicePremium](https://martinfowler.com/bliki/MicroservicePremium.html), by Martin Fowler
- [Spring Modulith](https://spring.io/projects/spring-modulith), a framework that checks module boundaries in Java
- [dependency-cruiser](https://github.com/sverweij/dependency-cruiser), a tool for dependency rules in JavaScript and TypeScript
