## Two levels with one word

People use "architecture" for two different levels. They answer different questions, and you can select them independently.

| | System architecture | Application architecture |
|---|---|---|
| Question | How many deployable parts are there, and how do they talk? | How is the code inside one deployable part organized? |
| Examples | Microservices, event-driven, modular monolith | Hexagonal, clean, onion, layered code, vertical slices |
| Visible in | A diagram of services, databases, and queues | The folders, modules, and dependencies of one code base |
| Drives | Scalability, availability, team independence | Testability, ease of change, protection of business rules |
| Cost of a wrong choice | Very high: it touches deployments, data, and teams | Medium: a team can refactor one code base |

So "we use hexagonal architecture" and "we use microservices" are not alternatives. A system can be a set of microservices where each service is hexagonal inside. A modular monolith can use hexagonal structure in each module. The [styles](/learn/styles) pages of this app are about the first level. This section is about the second.

## Why the second level matters to an architect

You will not select the structure of each code base. But you set the principles, and one of them decides how well a system ages:

> Business rules must not depend on technical details.

A price calculation must not know which database stores the price, or which web framework received the request. When it does, each change of technology becomes a change of business code, and the business rules cannot be tested without a database and a web server.

## The idea that all these patterns share

Hexagonal, onion, and clean architecture are three descriptions of one idea: put the business logic in the center, and make all dependencies point toward it.

The tool that makes this possible is dependency inversion. The business code defines an interface for what it needs, such as "save an order". The technical code implements that interface. The business code then depends only on its own interface, and the database code depends on the business code. The direction of the dependency is the opposite of the direction of the call.

## The patterns in this section

| Pattern | Main idea | Read it when |
|---|---|---|
| [Hexagonal architecture](/learn/hexagonal) | The application talks to the outside only through ports, and adapters connect them to real technology | You want the clearest version of the idea |
| [Clean and onion architecture](/learn/clean-onion) | Rings around the business rules, with a strict direction for dependencies | You meet these names in a team or an interview |
| [Vertical slices](/learn/vertical-slices) | Organize code by feature, not by technical layer | Layers make each feature touch many folders |
| [Domain model patterns](/learn/domain-model) | Entities, value objects, aggregates, and repositories | The business rules are complex |
| [CQRS and event sourcing](/learn/cqrs-event-sourcing) | Separate models for writing and reading, and a history of events as the stored data | Reads and writes have very different needs |

## How to select

- **Simple data in, data out, few rules:** plain layers are enough. More structure is cost with no return.
- **Real business rules that will live for years:** hexagonal, or one of its relatives.
- **Many independent features:** vertical slices, alone or inside a hexagonal core.
- **Complex rules about what is valid:** add the domain model patterns.
- **Very different read and write load, or a need for full history:** consider CQRS, and event sourcing only with a strong reason.

The same rule applies as at system level: select the simplest structure that solves the problem you have.
