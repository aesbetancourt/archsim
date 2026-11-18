## Two levels with one word

People use "architecture" for two different levels. They answer different questions, and you can select them independently.

|                        | System architecture                                        | Application architecture                                  |
| ---------------------- | ---------------------------------------------------------- | --------------------------------------------------------- |
| Question               | How many deployable parts are there, and how do they talk? | How is the code inside one deployable part organized?     |
| Examples               | Microservices, event-driven, modular monolith              | Hexagonal, clean, onion, layered code, vertical slices    |
| Visible in             | A diagram of services, databases, and queues               | The folders, modules, and dependencies of one code base   |
| Drives                 | Scalability, availability, team independence               | Testability, ease of change, protection of business rules |
| Cost of a wrong choice | Very high: it touches deployments, data, and teams         | Medium: a team can refactor one code base                 |

So "we use hexagonal architecture" and "we use microservices" are not alternatives. A system can be a set of microservices where each service is hexagonal inside. A modular monolith can use hexagonal structure in each module. The [styles](/learn/styles) pages of this app are about the first level. This section is about the second.

## Architecture and design are one spectrum

Richards and Ford (Fundamentals of Software Architecture) describe architecture with four parts: the structure, the architecture characteristics, the architecture decisions, and the design principles. Only the first is the style. The other three are the rules and the reasons that the teams work with.

They also say that architecture and design are not two separate jobs. They are two ends of one spectrum. To find where one decision sits, ask three questions:

| Question                                          | Toward architecture           | Toward design                   |
| ------------------------------------------------- | ----------------------------- | ------------------------------- |
| Is it strategic or tactical?                      | Strategic: it shapes years    | Tactical: it shapes this sprint |
| How much effort does it take to change?           | Large: many teams or services | Small: one developer in one day |
| How many trade-offs are in it, and how important? | Many, with large consequences | Few, with local consequences    |

Some examples from a lunch shop that takes orders online:

- "Kitchen screens get orders through a queue, so a shop keeps working on a slow network." This is architecture. It touches several parts and is hard to undo.
- "Business rules never import the database library." This is a design principle at the architecture end. It shapes every code base for years.
- "The `Order` class has a method `cancel()`." This is design. One developer can change it in an hour.

The application-level patterns in this section sit in the middle. One team selects them, but the choice shapes years of work. That is why an architect must care about them, even when the architect does not write the code.

A practical rule follows from this. The architect owns the decisions at the architecture end and the principles in the middle. The team owns the design end. The two must talk all the time, because the spectrum has no hard line. Richards and Ford warn against the old model, where the architect hands decisions to the developers and walks away.

## Why the second level matters to an architect

You will not select the structure of each code base. But you set the principles, and one of them decides how well a system ages:

> Business rules must not depend on technical details.

A price calculation must not know which database stores the price, or which web framework received the request. When it does, each change of technology becomes a change of business code, and the business rules cannot be tested without a database and a web server.

The cost appears slowly. In the first month, a controller that reads SQL and calculates a discount is fast to write. After two years, the discount rule exists in five controllers, each with a small difference. Nobody can tell which one is correct. A change of the database version breaks the discount tests, because the tests need the database. This is the decay that the patterns in this section prevent.

## Technical partitioning and domain partitioning

Richards and Ford name the first decision about the structure of a code base: the top-level partitioning. There are two kinds.

| Kind                   | The top-level folders are                     | Examples                                                                                            |
| ---------------------- | --------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| Technical partitioning | Technical roles: controllers, services, data  | Classic [layered](/learn/layered) code                                                              |
| Domain partitioning    | Areas of the business: orders, menus, payment | [Vertical slices](/learn/vertical-slices), modules of a [modular monolith](/learn/modular-monolith) |

Technical partitioning is easy to learn, and it matches teams that are organized by skill: a front-end team, a back-end team, a database team. But a change to one business feature touches every folder. Domain partitioning matches teams that own features, and a feature change stays in one place. It also gives the natural lines along which a code base can split into services later.

The two kinds combine. A common shape is domain partitioning at the top, and a small hexagonal structure inside each domain module.

## The idea that all these patterns share

Hexagonal, onion, and clean architecture are three descriptions of one idea: put the business logic in the center, and make all dependencies point toward it.

The tool that makes this possible is dependency inversion. The business code defines an interface for what it needs, such as "save an order". The technical code implements that interface. The business code then depends only on its own interface, and the database code depends on the business code. The direction of the dependency is the opposite of the direction of the call.

```diagram
{
  "nodes": [
    { "id": "place", "label": "Place order\n(business rule)", "shape": "module", "col": 0, "row": 0 },
    { "id": "port", "label": "OrderStore\n(interface)", "shape": "module", "col": 1, "row": 0 },
    { "id": "pg", "label": "PostgreSQL adapter", "shape": "module", "col": 2, "row": 0 },
    { "id": "db", "label": "Orders\n(PostgreSQL)", "shape": "store", "col": 3, "row": 0 }
  ],
  "groups": [{ "id": "core", "label": "Business code", "col": 0, "row": 0, "cols": 2, "rows": 1 }],
  "edges": [
    { "from": "place", "to": "port", "label": "calls" },
    { "from": "pg", "to": "port", "label": "implements" },
    { "from": "pg", "to": "db", "label": "SQL" }
  ]
}
```

At run time, the call goes from left to right. In the source code, the adapter imports the interface, so the dependency arrow between the adapter and the core points to the left. The [dependency injection](/learn/dependencies) page shows how the parts are connected at start-up.

## Strategic and tactical programming

Ousterhout (A Philosophy of Software Design) separates two ways of work.

- **Tactical programming:** the goal is to make the current feature work, as fast as possible. Each shortcut is small. The shortcuts add up, and the code gets more complex with each change.
- **Strategic programming:** the goal is a good design that also works. You spend a little more time now on each change, to make the next changes easier.

His main point is that complexity is incremental. No single shortcut makes a code base bad. Hundreds of them do, and by then the cost to fix them is very high. He describes the "tactical tornado": a developer who delivers features very fast and leaves complexity that others must clean up. Managers often see this person as a hero.

Ousterhout suggests a rough budget: spend about 10 to 20 percent of development time on design improvement. This is an investment, not a tax. The return comes in months, when changes stay cheap.

The patterns in this section are tools for strategic programming at the level of one code base. They cost structure at the start. They pay back when the code base lives for years and many people change it. For a script that lives for one week, tactical programming is the correct choice.

The center of Ousterhout's book is the idea of deep modules: a simple interface that hides a large amount of work. A good port in hexagonal architecture is a deep module. See [Deep modules](/learn/deep-modules) for the details.

## The patterns in this section

| Pattern                                                | Main idea                                                                                             | Read it when                                               |
| ------------------------------------------------------ | ----------------------------------------------------------------------------------------------------- | ---------------------------------------------------------- |
| [Hexagonal architecture](/learn/hexagonal)             | The application talks to the outside only through ports, and adapters connect them to real technology | You want the clearest version of the idea                  |
| [Clean and onion architecture](/learn/clean-onion)     | Rings around the business rules, with a strict direction for dependencies                             | You meet these names in a team or an interview             |
| [Dependency injection and wiring](/learn/dependencies) | Parts receive their dependencies, and one composition root connects them                              | You need to explain how the parts are connected and tested |
| [Vertical slices](/learn/vertical-slices)              | Organize code by feature, not by technical layer                                                      | Layers make each feature touch many folders                |
| [Domain model patterns](/learn/domain-model)           | Entities, value objects, aggregates, and repositories                                                 | The business rules are complex                             |
| [CQRS and event sourcing](/learn/cqrs-event-sourcing)  | Separate models for writing and reading, and a history of events as the stored data                   | Reads and writes have very different needs                 |

## How to select

- **Simple data in, data out, few rules:** plain layers are enough. More structure is cost with no return.
- **Real business rules that will live for years:** hexagonal, or one of its relatives.
- **Many independent features:** vertical slices, alone or inside a hexagonal core.
- **Complex rules about what is valid:** add the domain model patterns.
- **Very different read and write load, or a need for full history:** consider CQRS, and event sourcing only with a strong reason.

The same rule applies as at system level: select the simplest structure that solves the problem you have.

Two more questions help:

1. **How long will this code live?** A prototype for a demo next week needs no ports. A billing core for the next ten years needs them.
2. **How many people will change it?** One developer can keep a design in the head. Five teams need rules that a build can check.

The structure can also grow. Start with plain layers in a small service. When the business rules grow, extract them into a core with ports. This is a refactoring in one code base, not a migration across services.

## How structure decays, and how to stop it

A structure that nobody checks decays. The usual signs:

- A business class imports a framework type "only for one annotation".
- A shared `utils` folder grows until every module depends on it.
- Two modules import each other, so neither can change alone.
- Tests for one rule need a database, a message broker, and a web server.

Write the rules down, and make the build check them. An import rule or an architecture test is a [fitness function](/learn/evolution): an automatic check that a characteristic of the architecture stays true. The [dependencies](/learn/dependencies) page shows three ways to set one up. This matters more when AI agents write code, because an agent copies the patterns it sees, good or bad.

## In a kata

A kata is mostly about the system level. But an interviewer can ask about the inside of one service. For the [Lunch Rush kata](/kata/lunch-rush), you can say: "The ordering service has a hexagonal core. The menu and price rules are in the core. The kitchen screen queue and the payment provider are adapters." This shows that you know both levels and how they connect.

State why. "Prices change often and have rules for local specials, so they need a core that we can test fast." Do not draw the inside of every service. Pick the one with the most rules.

## Interview questions

**"What is the difference between architecture and design?"**

- They are two ends of one spectrum, not two separate jobs.
- Toward architecture: strategic, hard to change, many important trade-offs.
- Toward design: tactical, cheap to change, local trade-offs.
- The architect and the developers must work together across the full spectrum.

**"Is hexagonal architecture an alternative to microservices?"**

- No. Microservices are a system-level style. Hexagonal is the structure inside one deployable unit.
- Each microservice can be hexagonal inside.
- Name what each choice drives: team independence and scale at system level, testability and ease of change inside.

**"How do you keep business rules independent of the framework?"**

- Dependency inversion: the core defines interfaces, and adapters implement them.
- No framework or database imports in the core.
- An automatic check in the build, because an unchecked rule decays.

**"When is a layered structure enough?"**

- When the application mostly stores and returns data, with few rules.
- When the code base is small or short-lived.
- Say how you will know that it is time to change: rules that repeat in many controllers, or tests that need infrastructure.

**"A developer delivers features twice as fast as the others. Is that good?"**

- Not always. Ousterhout's "tactical tornado" delivers fast and leaves complexity.
- Look at the cost of the next changes, the defect rate, and how often others must fix that code.
- Recommend a design budget for each change, not only a speed target.

## Go deeper

- **Fundamentals of Software Architecture** (Richards, Ford), the parts on what architecture is and on component-based thinking: the architecture and design spectrum, and technical against domain partitioning.
- **A Philosophy of Software Design** (Ousterhout), the parts on strategic programming and on deep modules: why complexity grows, and how to invest against it.
- **Domain-Driven Design** (Evans), the part on layered architecture and an isolated domain: why the business logic needs its own place in the code.

## Further reading

- [Software architecture guide](https://martinfowler.com/architecture/), by Martin Fowler
- [Dependency inversion principle](https://en.wikipedia.org/wiki/Dependency_inversion_principle) on Wikipedia
- [A Philosophy of Software Design](https://web.stanford.edu/~ouster/cgi-bin/book.php), by John Ousterhout
