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

## The parts

| Part | What it is | Example |
|---|---|---|
| Domain model | The business rules and data, with no technical code | An `Order` that knows when it can be cancelled |
| Use case (application service) | One action the application offers. It coordinates the domain and the ports | `PlaceOrder` |
| Input port (driving port) | The interface that the outside uses to start a use case | The `PlaceOrder` interface |
| Output port (driven port) | An interface for something the core needs from outside | `OrderRepository`, `PaymentGateway` |
| Driving adapter (primary) | Converts an outside request to a call on an input port | An HTTP controller, a queue consumer, a test |
| Driven adapter (secondary) | Implements an output port with a real technology | A PostgreSQL repository, a Stripe client |

## The one rule

Code in the core imports nothing from an adapter, a framework, or a database library. All dependencies point inward. You can check this rule automatically. See fitness functions in [Evolution and migration](/learn/evolution).

## What you get

- **Tests with no infrastructure.** Replace each driven adapter with a simple fake in memory. Business rules are tested in milliseconds.
- **Technology can change.** A new database or provider is a new adapter. The core stays as it is.
- **Several ways in.** The same use case serves HTTP, a queue, and a command line tool, with one adapter for each.
- **Decisions can wait.** You can build and test the core before you select the database.

## What it costs

- More files and interfaces, and data that is converted between the form of the core and the form of each adapter.
- New developers need time to learn where things go.
- For an application that only stores and returns data, it is too much. The "core" would be empty.

## Common mistakes

- **A port that copies the technology.** `SqlOrderPort` with a method `executeQuery` is the database with a new name. A port speaks the language of the business: `OrderRepository.save(order)`.
- **Business rules in adapters.** A controller that decides if an order is valid.
- **Framework annotations in the domain model.** The core now depends on the framework.
- **One interface for each class, by habit.** A port exists where the core meets the outside. It is not needed between two classes in the core.

## Relation to system architecture

Hexagonal structure is inside one deployable unit. It says nothing about how many units there are. The "driven adapters" of your application are, at system level, the arrows from your service to a database, a queue, or another service. See [Architecture inside one application](/learn/code-architecture).

## Further reading

- [Hexagonal architecture](https://en.wikipedia.org/wiki/Hexagonal_architecture_(software)) on Wikipedia
- [The original article](https://alistair.cockburn.us/hexagonal-architecture/), by Alistair Cockburn
