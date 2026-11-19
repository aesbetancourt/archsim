## The idea

Layered code groups files by technical role: all controllers together, all services together, all repositories together. To add one feature, a developer changes a file in each group.

Vertical slice architecture groups files by feature. All the code for "place an order" is in one folder: the endpoint, the validation, the logic, and the data access. A feature is a slice through all the technical layers.

```diagram
{
  "nodes": [
    { "id": "a", "label": "Place order\n(endpoint, logic, data)", "shape": "module", "col": 0, "row": 0 },
    { "id": "b", "label": "Cancel order\n(endpoint, logic, data)", "shape": "module", "col": 1, "row": 0 },
    { "id": "c", "label": "List orders\n(endpoint, query)", "shape": "module", "col": 2, "row": 0 },
    { "id": "db", "label": "Database", "col": 1, "row": 1.2 }
  ],
  "edges": [
    { "from": "a", "to": "db" },
    { "from": "b", "to": "db" },
    { "from": "c", "to": "db" }
  ]
}
```

Jimmy Bogard gave the pattern its name. Richards and Ford (Fundamentals of Software Architecture) describe the larger idea behind it: domain partitioning, where the top level of a code base follows the business, not the technical roles. See [Technical and domain partitioning](/learn/code-architecture#technical-partitioning-and-domain-partitioning).

## What is in a slice

A slice usually has one request type, one handler, and one response type. The folder for "hold seats" in a ticket seller can look like this:

```text
features/
  hold-seats/
    hold-seats.endpoint.ts   # reads the HTTP request, calls the handler
    hold-seats.handler.ts    # the rules and the data access for this one action
    hold-seats.test.ts       # tests for this action only
  release-hold/
  list-shows/
```

Each slice is either a command, which changes data, or a query, which only reads. This makes vertical slices a natural partner of [CQRS](/learn/cqrs-event-sourcing) at its lowest level: the "list shows" query can read straight from a view, and the "hold seats" command can use a full domain model.

Many teams send each request through a small dispatcher, such as a mediator library. The dispatcher finds the handler for a request type and can run common steps around it: logging, validation, a transaction. This is convenient, but not required. A direct call from the endpoint to the handler is also a slice.

## The principle

Things that change together live together. Coupling is kept low between slices and is permitted to be high inside a slice. See [Modularity, cohesion, and coupling](/learn/modularity).

Each slice selects the structure it needs. "List orders" can be one query with no abstraction. "Place order" can have a full domain model. Layered code forces each feature through the same layers, also when a layer only passes data to the next one.

A useful test of the principle: take a typical change request, and count the folders it touches. In layered code, "add a gift message to an order" touches the controller, the service, the repository, and the data model. In a sliced code base, it touches the "place order" folder and the table.

## Compared with layers

|                         | By layer                             | By slice                                               |
| ----------------------- | ------------------------------------ | ------------------------------------------------------ |
| A new feature           | Touches each layer folder            | Adds one folder                                        |
| To understand a feature | Read files in many places            | Read one folder                                        |
| Shared logic            | Natural: it is in the service layer  | Needs a decision: copy it, or move it to a shared part |
| Risk                    | Layers that do nothing but pass data | Duplicated rules that drift apart                      |
| To delete a feature     | Hard to find all the pieces          | Delete the folder                                      |

## The hard part: shared code

Two slices often need the same rule, such as how the price of an order is calculated. If each slice has its own copy, the copies will differ after a year.

The usual answer: start with the code in the slice. When a second slice needs the same business rule, move that rule to a shared domain model, and keep the slices as thin use cases on top of it. Technical helpers can also be shared. Do not share only because two pieces of code look similar. Share when they must change together.

## Duplication against coupling

Every shared piece of code is a coupling. When two slices use one function, a change for one slice can break the other. Every copy is a risk of drift. When a rule exists twice, one copy can be fixed and the other forgotten. You cannot remove both costs. You select which one to pay.

The key question is whether two pieces of code hold the same knowledge, or only look the same.

| Kind of duplication | Example                                                                           | Action                                                   |
| ------------------- | --------------------------------------------------------------------------------- | -------------------------------------------------------- |
| Real                | "A hold expires after 10 minutes" in the hold slice and in the payment slice      | Share it. One rule must live in one place.               |
| Accidental          | Two slices that each check an email format and a name length, for different forms | Keep the copies. They will change for different reasons. |
| Technical           | Logging, error responses, paging of lists                                         | Share it as a technical helper.                          |

The "don't repeat yourself" principle, as Hunt and Thomas wrote it, is about knowledge, not about lines of code. Two identical blocks of code can be two different pieces of knowledge.

A wrong shared abstraction is often more expensive than a copy. It starts as one function for two slices. Then a third slice needs a small difference, and the function gets a flag. After a few years, it has six flags, and nobody can change it safely. Many teams use a rough rule: wait for the third real use before you extract a shared part.

The same choice exists between services, at a larger scale. Ford, Richards, Sadalage, and Dehghani (Software Architecture: The Hard Parts) compare the reuse options: replicate the code, share a library, share a service, or use a sidecar. Each moves the balance between drift and coupling. Inside one code base, a shared module is cheap to change. Between services, a shared library forces coordinated releases.

## Shared kernel

Evans (Domain-Driven Design) names a pattern for the code that two parts must share: the shared kernel. Two teams agree on a small part of the model that both use. Neither team changes it alone. Both teams run its tests.

Inside a sliced code base, a shared kernel is a small module that slices can import:

- Value objects that all slices use, such as `Money`, `SeatId`, and `ShowTime`.
- The few business rules that must be the same everywhere, such as the rule that rounds money amounts.
- No data access, no endpoints, and no code that only one slice uses.

Keep it small and keep it strict. A shared kernel that grows into a `common` folder of everything becomes the service layer again, with all its coupling. Give it an owner, and review each addition.

## How it combines with the other patterns

Vertical slices and [hexagonal architecture](/learn/hexagonal) answer different questions. Slices decide how the folders are grouped. Hexagonal decides the direction of dependencies. Many teams use both: one slice for each use case, a shared domain model in the center, and adapters at the edge.

At system level, a slice is not a service. Slices are folders in one deployment. A group of related slices is a natural candidate for a module in a [modular monolith](/learn/modular-monolith).

### Slices and bounded contexts

A slice and a [bounded context](/learn/bounded-contexts) are different sizes. A slice is one action. A bounded context is an area of the business with one model and one language, and it holds many slices.

```diagram
{
  "nodes": [
    { "id": "hold", "label": "Hold seats", "shape": "module", "col": 0, "row": 0 },
    { "id": "buy", "label": "Pay for hold", "shape": "module", "col": 0, "row": 1 },
    { "id": "map", "label": "Edit seat map", "shape": "module", "col": 2, "row": 0 },
    { "id": "release", "label": "Release seats", "shape": "module", "col": 2, "row": 1 },
    { "id": "kernel", "label": "Shared kernel\n(Money, SeatId)", "shape": "module", "col": 1, "row": 2.2 }
  ],
  "groups": [
    { "id": "sales", "label": "Sales context", "col": 0, "row": 0, "cols": 1, "rows": 2 },
    { "id": "venue", "label": "Venue context", "col": 2, "row": 0, "cols": 1, "rows": 2 }
  ],
  "edges": [
    { "from": "hold", "to": "kernel" },
    { "from": "map", "to": "kernel" },
    { "from": "release", "to": "hold", "label": "SeatsReleased", "async": true }
  ]
}
```

Group the slices by context first, and then by action. The rules:

1. Slices in one context can share that context's domain model.
2. Slices in different contexts do not share models. A "seat" in sales has a price and a hold. A "seat" in the venue context has a row, a number, and a view.
3. A slice does not read the tables of another context. It uses an event or an interface that the other context offers.
4. Only the shared kernel crosses the line, and it stays small.

These rules keep the option to split a context into its own service later. If slices reach across contexts freely, that option is gone.

## Slices and teams

Conway's law says that a system's structure tends to copy the communication structure of the organization that builds it. Slices make it easy to align code with teams.

- **Feature teams.** A team that owns a set of features owns their slices from the endpoint to the table. It can deliver a change with no hand-off to a database team.
- **Stream-aligned teams.** Skelton and Pais (Team Topologies) describe a team that owns a flow of change for one area of the business. Give that team one bounded context, with all its slices. See [Team Topologies](/learn/team-topologies).
- **Layer teams.** A team that owns "the back end" or "the data layer" fits layered code, and works against slices. Each feature needs work from several teams.

Two teams must not own slices in one context. They would share one model, and each change would need both teams. Split the context, or give it to one team.

## When it fits

- An application with many features that are mostly independent.
- Teams where developers own features, not layers.
- APIs where most endpoints are simple and a few are complex.

It fits less well when almost every feature uses the same complex rules. Then the shared domain model is the main thing, and the slices are thin.

## How it fails

| Failure                            | Sign                                           | Fix                                                              |
| ---------------------------------- | ---------------------------------------------- | ---------------------------------------------------------------- |
| Rules drift                        | Two slices give different prices for one order | Move the rule to the domain model or the shared kernel           |
| Slices call slices                 | A handler calls another handler directly       | Extract the shared rule, or send an event                        |
| The common folder grows            | Most slices import most of `common`            | Split it. Move code back into the slices that use it             |
| Each slice invents its own style   | Five ways to validate input, three ways to log | Agree on technical helpers and a template for a new slice        |
| No domain model where it is needed | Complex rules sit as long scripts in handlers  | Add [domain model patterns](/learn/domain-model) in that context |

## In a kata

In the [Front Row kata](/kata/front-row), most actions are simple reads: list shows, show the seat map, show my tickets. One action is very hard: hold seats with no double sale. Say: "The sales module uses vertical slices. The read slices are plain queries against a view. The hold slice has a domain model with a seat hold aggregate, because that is where the hard rule is." This shows that you put structure where the rules are, not everywhere.

## Interview questions

**"Why organize code by feature instead of by layer?"**

- A change to one feature stays in one folder.
- Each feature selects the structure it needs, from a plain query to a full domain model.
- Features are easy to find, to own, and to delete.

**"How do you stop duplicated rules in a sliced code base?"**

- Separate real duplication (the same knowledge) from accidental duplication (similar code).
- Share the real rules in a domain model or a small shared kernel.
- Keep accidental copies. A wrong shared abstraction costs more than a copy.

**"What is a shared kernel, and what is the risk?"**

- A small part of the model that two parts agree to share and change together.
- The risk is growth. It turns into a `common` folder that couples everything.
- Keep it small, give it an owner, and review each addition.

**"How do slices relate to bounded contexts and to services?"**

- A slice is one action. A bounded context holds many slices with one model.
- Group slices by context. Slices in different contexts do not share models or tables.
- A context, not a slice, is the candidate for a later service.

## Go deeper

- **Fundamentals of Software Architecture** (Richards, Ford), the part on component-based thinking: domain partitioning against technical partitioning.
- **Software Architecture: The Hard Parts** (Ford, Richards, Sadalage, Dehghani), the part on reuse patterns: the trade-offs of copies, shared libraries, and shared services.
- **Domain-Driven Design** (Evans), the part on strategic design: the shared kernel and the bounded context.
- **Team Topologies** (Skelton, Pais), the part on stream-aligned teams: how code ownership follows the flow of change.

## Further reading

- [Vertical slice architecture](https://www.jimmybogard.com/vertical-slice-architecture/), by Jimmy Bogard
- [Bounded context](https://martinfowler.com/bliki/BoundedContext.html), by Martin Fowler
- [Conway's law](https://en.wikipedia.org/wiki/Conway%27s_law) on Wikipedia
