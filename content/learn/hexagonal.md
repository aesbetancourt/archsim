## The idea

Hexagonal architecture, also named ports and adapters, organizes the code of one application so that the business logic does not know what is outside. Alistair Cockburn described it. The hexagon has no meaning as a shape. It only gives room to draw several sides.

The application core talks to the outside world only through ports. An adapter connects a port to a real technology.

```diagram
{
  "nodes": [
    { "id": "driving", "label": "Driving adapters\n(HTTP, queue, tests)", "shape": "module", "col": 0, "row": 0.5 },
    { "id": "usecases", "label": "Use cases\n(input ports)", "shape": "module", "col": 1, "row": 0.5 },
    { "id": "domain", "label": "Domain model\n(business rules)", "shape": "module", "col": 1, "row": 1.6 },
    { "id": "ports", "label": "Output ports\n(interfaces)", "shape": "module", "col": 2, "row": 0.5 },
    { "id": "driven", "label": "Driven adapters\n(database, email, APIs)", "shape": "module", "col": 3, "row": 0.5 }
  ],
  "groups": [{ "id": "core", "label": "Application core", "shape": "module", "col": 1, "row": 0.5, "cols": 2, "rows": 2 }],
  "edges": [
    { "from": "driving", "to": "usecases", "label": "calls" },
    { "from": "usecases", "to": "domain", "label": "uses" },
    { "from": "usecases", "to": "ports", "label": "calls" },
    { "from": "driven", "to": "ports", "label": "implements" }
  ]
}
```

Look at the last arrow. The database adapter points to the port, not the other way. The core defines the interface, and the adapter implements it. This is the full pattern in one arrow.

Cockburn's first goal was symmetry. A user, another program, an automated test, and a batch script must all be able to drive the application in the same way. The application must also run with no real database or devices attached. Testability is not a side effect of the pattern. It is the reason for it.

## The parts

| Part                           | What it is                                                                 | Example                                        |
| ------------------------------ | -------------------------------------------------------------------------- | ---------------------------------------------- |
| Domain model                   | The business rules and data, with no technical code                        | An `Order` that knows when it can be cancelled |
| Use case (application service) | One action the application offers. It coordinates the domain and the ports | `PlaceOrder`                                   |
| Input port (driving port)      | The interface that the outside uses to start a use case                    | The `PlaceOrder` interface                     |
| Output port (driven port)      | An interface for something the core needs from outside                     | `OrderRepository`, `PaymentGateway`            |
| Driving adapter (primary)      | Converts an outside request to a call on an input port                     | An HTTP controller, a queue consumer, a test   |
| Driven adapter (secondary)     | Implements an output port with a real technology                           | A PostgreSQL repository, a Stripe client       |

The use case and the domain model have different jobs. The domain model holds the rules: "a lesson can be cancelled free of charge until 24 hours before it starts". The use case holds the steps: load the booking, ask it to cancel, save it, tell the tutor. A use case with business `if` statements in it is a sign that a rule is in the wrong place.

## The one rule

Code in the core imports nothing from an adapter, a framework, or a database library. All dependencies point inward. You can check this rule automatically. See fitness functions in [Evolution and migration](/learn/evolution).

## What you get

- **Tests with no infrastructure.** Replace each driven adapter with a simple fake in memory. Business rules are tested in milliseconds.
- **Technology can change.** A new database or provider is a new adapter. The core stays as it is.
- **Several ways in.** The same use case serves HTTP, a queue, and a command line tool, with one adapter for each.
- **Decisions can wait.** You can build and test the core before you select the database.

## Testing through ports

The ports give natural lines for tests. Each kind of test has one job.

| Test                  | What it checks                                                                        | With                                             | How many                |
| --------------------- | ------------------------------------------------------------------------------------- | ------------------------------------------------ | ----------------------- |
| Use case test         | The business behavior, through the input port                                         | Fakes for all driven ports                       | Many                    |
| Adapter contract test | That an adapter does what the port promises                                           | The real technology, for example a test database | One suite for each port |
| Driving adapter test  | That a request becomes the right use case call, and errors map to the right responses | A fake use case                                  | A few for each adapter  |
| End-to-end test       | That the parts are connected                                                          | Everything real                                  | Very few                |

The adapter contract test is the part that teams often forget. Write one test suite for the port `LessonRepository`. Run it against the fake in memory and against the PostgreSQL adapter. When both pass, the fake behaves like the real thing, and you can trust the fast use case tests.

```ts
// One suite, two implementations. If the fake drifts from PostgreSQL, a test fails.
for (const [name, make] of [
  ["memory", memoryLessons],
  ["postgres", postgresLessons],
] as const) {
  describe(`LessonRepository (${name})`, () => {
    it("returns a saved lesson by ID", async () => {
      const lessons = await make();
      await lessons.save(lesson("L1"));
      expect(await lessons.findById("L1")).toEqual(lesson("L1"));
    });
  });
}
```

Test the use case through its input port, not through its private parts. A test that calls `BookLesson.execute(input)` and checks the result survives a refactoring of the domain classes. See [Test doubles](/learn/dependencies#test-doubles) for fakes, stubs, and mocks.

## Adapters for messaging

A message broker is outside the core, like a database. It appears on both sides of the hexagon.

- **A queue consumer is a driving adapter.** It reads a message, converts it to the input of a use case, and calls the use case. It acknowledges the message only after the use case succeeds.
- **A publisher is a driven adapter.** The core calls a port such as `BookingEvents.lessonBooked(booking)`. The adapter converts the event to the message format and sends it to the topic.

Three rules keep this clean:

1. **The port speaks business, not broker.** `lessonBooked(booking)` is a port. `sendToKafka(topic, bytes)` is the broker with a new name.
2. **The message format belongs to the adapter.** Other teams read the message, so its schema is a public contract. The domain event inside the core can change freely. The adapter maps one to the other. See [Messaging](/learn/messaging).
3. **The consumer must handle duplicates.** Most brokers deliver at least once. The consumer adapter, or the use case, must record the ID of each handled message, and skip a repeat. This is an [idempotency key](/glossary#idempotency-key).

## Transaction boundaries

The use case is the natural boundary of a transaction. One call to a use case is one unit of work: it commits all its changes, or none. The domain model does not know that transactions exist.

There are two common ways to express this:

- **A wrapper around the use case.** The composition root wraps each use case in a function that opens a transaction, runs the use case, and commits. The core code does not change.
- **A unit-of-work port.** The use case calls `unitOfWork.run(...)` and gets repositories that share one transaction. This is explicit, and the core still knows nothing about SQL.

Two traps are frequent.

**The dual write.** The use case saves the booking and publishes `LessonBooked`. If the save succeeds and the publish fails, the tutor never hears about the booking. If the publish succeeds and the commit fails, the tutor hears about a booking that does not exist. The usual fix is an outbox: the publisher adapter writes the message to a table in the same transaction, and a separate relay sends it later. See [Distributed transactions](/learn/distributed-transactions).

**A remote call inside a transaction.** A call to a payment provider can take seconds. If the transaction stays open during the call, it holds locks, and other requests wait. Make the remote call outside the transaction. Record the state before and after it, for example "payment requested" and then "payment confirmed".

## Mapping between the core and the adapters

Each side of a port has its own shape of data. An HTTP adapter has a request body. The core has domain objects. A database adapter has rows. To cross a port, the data is converted. This conversion is called mapping.

| Strategy                | What it means                                                            | Good                        | Bad                                                 |
| ----------------------- | ------------------------------------------------------------------------ | --------------------------- | --------------------------------------------------- |
| No mapping              | The domain object is also the database entity and the API response       | Little code                 | The API, the core, and the database change together |
| Mapping at each adapter | Each adapter has its own model, and maps it to and from the domain model | Each side changes alone     | A mapper for each adapter                           |
| Full mapping            | Also a separate input and output model for each use case                 | Each use case changes alone | Many small classes, much copy code                  |

The cost of mapping is real. Each mapper is code to write and test. When you add a field, you must add it in several places, and a forgotten field is a silent bug.

The benefit is also real. The API is a contract with clients. If the API response is the domain object, a rename in the core breaks the clients. If the database entity is the domain object, an ORM annotation pulls the framework into the core.

A practical rule: map where the two shapes truly differ, or where a contract with outside parties exists. Always map at the public API and at published messages. Inside the service, between the core and its own database, a smaller mapping is often enough.

## What it costs

- More files and interfaces, and data that is converted between the form of the core and the form of each adapter.
- New developers need time to learn where things go.
- For an application that only stores and returns data, it is too much. The "core" would be empty.

## When it is over-engineering

The pattern is a cost with no return in these cases:

- **The core has no rules.** Each use case reads a request, saves it, and returns it. The structure only moves data between folders.
- **Mappers copy each field one to one.** Three models with the same fields give three places to change and no independence.
- **The code is short-lived.** A prototype or a one-time migration script.
- **A port has one adapter, and no test uses a fake.** The interface adds a step to each code search and gives nothing.

A smaller form often gives most of the value. Put ports only where the outside is slow, unreliable, or likely to change: a payment provider, an email service, another team's API. Let simple reads go straight to the database. You can add more ports later, when the rules grow.

## Common mistakes

- **A port that copies the technology.** `SqlOrderPort` with a method `executeQuery` is the database with a new name. A port speaks the language of the business: `OrderRepository.save(order)`.
- **Business rules in adapters.** A controller that decides if an order is valid.
- **Framework annotations in the domain model.** The core now depends on the framework.
- **One interface for each class, by habit.** A port exists where the core meets the outside. It is not needed between two classes in the core.

## Relation to system architecture

Hexagonal structure is inside one deployable unit. It says nothing about how many units there are. The "driven adapters" of your application are, at system level, the arrows from your service to a database, a queue, or another service. See [Architecture inside one application](/learn/code-architecture).

### Services with a hexagonal inside

Newman (Building Microservices) puts information hiding at the center of a good service. A service hides its internal model and its database, and shows only a stable API. Hexagonal structure is a direct way to build that:

- The service API is a driving adapter. It maps the internal model to the public contract, so the internal model can change.
- Each call to another service is a driven adapter behind a port. The core does not know if the other side is a service, a queue, or a library.
- Newman describes service tests that replace the downstream services with stubs. With ports, the stub is a fake adapter.
- Consumer-driven contract tests, which Newman also describes, check that the real downstream service and your stub agree. This is the adapter contract test from above, at system level.

The pattern also helps a [modular monolith](/learn/modular-monolith). If each module calls other modules through ports, you can later move a module to its own service. Only the adapter changes, from a function call to a network call. That network call then needs timeouts and retries. See [Resilience](/learn/resilience).

## In a kata

In the [Tutor Marketplace kata](/kata/tutor-marketplace), the booking service has the most rules: time zones, cancellation windows, and payment holds. Say that it has a hexagonal core. Name its ports: `BookingRepository`, `PaymentGateway`, `CalendarSync`, `BookingEvents`. Name the adapters: PostgreSQL, the payment provider, the calendar provider, a topic.

Then say what this gives the design. The payment provider can change by country, so each country has its own adapter. The cancellation rules have fast tests. Do not draw the inside of every service. Pick the one with the most rules.

## Interview questions

**"What is the difference between a driving and a driven adapter?"**

- A driving adapter starts the work: it calls an input port. Examples: an HTTP controller, a queue consumer, a test.
- A driven adapter is called by the core: it implements an output port. Examples: a repository, an email client.
- The core defines both kinds of port.

**"How do you test a hexagonal application?"**

- Many use case tests through the input ports, with fakes for the driven ports.
- A contract test suite for each port, run against the fake and the real adapter.
- A few tests for the driving adapters, and very few end-to-end tests.

**"Where does the transaction start and end?"**

- At the use case: one use case call is one unit of work.
- A wrapper or a unit-of-work port, so the domain stays free of transaction code.
- Use an outbox for messages, and keep remote calls outside the transaction.

**"Is mapping between models worth its cost?"**

- Always at public contracts: the API and published messages.
- Inside the service, only where the shapes truly differ.
- Name the cost: more code, and fields forgotten in a mapper.

**"When would you not use hexagonal architecture?"**

- An application with no real rules, or a short-lived one.
- Then use plain layers, and add ports only for external services that are slow or likely to change.

## Go deeper

- **Building Microservices** (Newman), the parts on information hiding and on testing: why a service hides its internals, and how stubs and consumer-driven contracts test a service alone.
- **A Philosophy of Software Design** (Ousterhout), the part on deep modules: what makes a port a good interface. See [Deep modules](/learn/deep-modules).
- **Domain-Driven Design** (Evans), the parts on an isolated domain and on repositories: the domain model at the center of the hexagon.

## Further reading

- [Hexagonal architecture](<https://en.wikipedia.org/wiki/Hexagonal_architecture_(software)>) on Wikipedia
- [The original article](https://alistair.cockburn.us/hexagonal-architecture/), by Alistair Cockburn
- [Transactional outbox](https://microservices.io/patterns/data/transactional-outbox.html) on microservices.io
- [Consumer-driven contracts](https://martinfowler.com/articles/consumerDrivenContracts.html), by Ian Robinson, on martinfowler.com
