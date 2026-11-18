## Three names, one idea

Onion architecture (Jeffrey Palermo) and clean architecture (Robert C. Martin) are close relatives of [hexagonal architecture](/learn/hexagonal). All three put the business rules in the center and make dependencies point inward. They differ in how many rings they name and in the words they use.

If you understand one, you understand all three. In a team or an interview, the useful skill is to translate between the vocabularies.

Palermo named onion architecture as an answer to one habit: the database as the base of the application. In his rings, the domain model is at the center. Domain services and application services surround it. The user interface, the infrastructure, and the tests are all in the outer ring, as equal neighbors. The database is a detail at the edge, not the foundation.

## The rings of clean architecture

```diagram
{
  "nodes": [
    { "id": "frameworks", "label": "Frameworks and drivers\n(web, database, UI)", "shape": "module", "col": 0, "row": 0 },
    { "id": "adapters", "label": "Interface adapters\n(controllers, gateways)", "shape": "module", "col": 1, "row": 0 },
    { "id": "usecases", "label": "Use cases\n(application rules)", "shape": "module", "col": 2, "row": 0 },
    { "id": "entities", "label": "Entities\n(business rules)", "shape": "module", "col": 3, "row": 0 }
  ],
  "edges": [
    { "from": "frameworks", "to": "adapters", "label": "depends on" },
    { "from": "adapters", "to": "usecases", "label": "depends on" },
    { "from": "usecases", "to": "entities", "label": "depends on" }
  ]
}
```

The diagram shows the rings from the outside (left) to the center (right). The usual drawing is four circles, one inside the other.

**The dependency rule:** code in a ring can depend only on rings closer to the center. The entities know nothing of the use cases. The use cases know nothing of the web or the database.

The number four is not a rule. Martin says that the circles are a schema, and a system can need more rings or fewer. Only the dependency rule is fixed.

## How the names map

| Hexagonal                       | Onion                         | Clean                                      | Content                                            |
| ------------------------------- | ----------------------------- | ------------------------------------------ | -------------------------------------------------- |
| Domain model                    | Domain model                  | Entities                                   | Business rules that are true for the whole company |
| Use cases, application services | Application services          | Use cases                                  | The actions of this application                    |
| Ports                           | Interfaces in the inner rings | Boundaries: input and output ports         | What the core offers and needs                     |
| Adapters                        | Infrastructure, UI            | Interface adapters; frameworks and drivers | Everything technical                               |

Two more words from clean architecture appear often:

- **Gateway:** an interface in the use case ring for stored data or an outside service. It is the same as an output port or a repository.
- **Interactor:** the class that implements one use case. It is the same as an application service in the other two vocabularies.

## What clean architecture adds

- **A split between entities and use cases.** Entities hold rules that would exist with no software, such as how interest is calculated. Use cases hold the rules of this application, such as the steps to open an account.
- **Plain data across each boundary.** A use case receives and returns simple data structures. It does not receive a web request or return a database row.
- **Frameworks at the edge.** The framework is a detail that the core does not see. In practice this is the hardest rule to keep, because frameworks want to be everywhere.

## Crossing a boundary

Clean architecture is precise about how a request crosses the rings. Follow one request in a parcel service: "track parcel P-123".

1. A **controller** in the interface adapters ring reads the HTTP request. It builds a plain **request model**: `{ parcelId: "P-123" }`.
2. It calls the **input boundary**, an interface that the use case ring defines.
3. The **interactor** loads the `Parcel` entity through a gateway and asks it for its status.
4. The interactor builds a plain **response model** and sends it to the **output boundary**, another interface in the use case ring.
5. A **presenter** implements the output boundary. It converts the response model to a **view model**: text and dates in the format that the screen shows.
6. The view shows the view model and contains almost no logic.

The flow of control goes outward at step 4, from the interactor to the presenter. But the source dependency still points inward, because the presenter implements an interface that the inner ring owns. This is dependency inversion again.

The thin view is an example of the humble object pattern. You put the logic that is hard to test (the screen) in a very small part with almost no code. You put all the logic that is easy to test (the presenter) in a separate part. Many teams skip the presenter and let the controller return the response model. That is a common, acceptable simplification for an API with no screens.

## Mapping between rings, and its cost

The rule of plain data at each boundary gives a chain of conversions. For one screen, the data can pass from a database row, to an entity, to a response model, to a view model. Each arrow is mapping code.

| Gain                                                      | Cost                                                        |
| --------------------------------------------------------- | ----------------------------------------------------------- |
| A change to the screen format does not touch the use case | Three or four classes with similar fields for one screen    |
| A change to a table does not touch the entity             | Mapping code to write, test, and keep in step               |
| The use case can be tested with plain data                | A forgotten field in a mapper fails in silence              |
| The same use case serves a web page and an API            | New developers ask why the "same" object exists three times |

Keep the mapping where it protects something. Map at the public API, because clients depend on it. Map at the database when the table shape and the business shape differ. If a model is a copy of the next one, with the same fields and no different reason to change, one model is enough. The [hexagonal page](/learn/hexagonal) compares the mapping strategies.

## Transactions and tests in the rings

The interactor is the natural transaction boundary. One use case is one unit of work. The entities do not know about transactions. The database ring provides the transaction through a gateway or a wrapper. Do not let an entity call `commit`.

Tests follow the rings:

- **Entities:** plain unit tests, with no doubles at all. These are the cheapest tests in the system.
- **Interactors:** tests with fake gateways and a fake output boundary that records the response model.
- **Presenters:** tests that give a response model and check the view model. No browser is needed.
- **Adapters:** contract tests against the real database or provider.

Messaging follows the same rule as in hexagonal: a consumer is a controller in the adapter ring, and a publisher is a gateway. See [Adapters for messaging](/learn/hexagonal#adapters-for-messaging).

## Screaming architecture

Martin asks what the top-level folders of a code base tell a new reader. If they say `controllers`, `models`, `views`, the code base announces its framework. If they say `shipments`, `tracking`, `billing`, it announces what the system does. He calls the second form a screaming architecture.

This is the domain partitioning that Richards and Ford describe (see [Technical and domain partitioning](/learn/code-architecture#technical-partitioning-and-domain-partitioning)). It combines well with [vertical slices](/learn/vertical-slices): group by business area at the top, and use the rings inside each area.

## Compared with layered code

Traditional [layered](/learn/layered) code also has rings in a sense: presentation, business, data access. The difference is the direction of one dependency.

|                           | Traditional layers                  | Onion, clean, hexagonal                  |
| ------------------------- | ----------------------------------- | ---------------------------------------- |
| Business logic depends on | The data access layer               | Nothing technical                        |
| Data access depends on    | The database                        | The business logic, through an interface |
| To test business rules    | You need a database, or heavy mocks | You need nothing                         |
| To change the database    | Business code changes               | Only an adapter changes                  |

In layered code, the database is the foundation and everything stands on it. In the other three, the business rules are the foundation.

The change from one to the other can be small. Move the repository interfaces from the data layer into the business layer. Make the data layer implement them. The arrow between the two layers now points the other way, and the business layer is the center.

## When to use which name

Use the vocabulary your team already has. Do not mix them in one code base, and do not argue about whether the pattern is "really" onion or clean. Agree on the one rule that matters, and check it automatically: nothing in the core imports from the outside.

## Across services

Each service in a system can have clean architecture inside. Do not share the entity ring between services as a common library. Newman (Building Microservices) warns that shared domain code couples the services: a change to the library forces all of them to change and deploy together. Inside one service, avoid duplication. Across services, some duplication is the cheaper choice. Each service keeps its own entities, in the language of its own [bounded context](/learn/bounded-contexts).

## The cost

The same as for hexagonal: more structure, more conversion of data, more to learn. A simple application that reads and writes records gets no benefit.

The signs of over-engineering are specific to this style:

- Four rings, each with its own models, for an application with ten tables and no rules.
- An interactor that only calls one gateway method and returns the result.
- A presenter and a view model for an API that returns JSON with the same fields.
- Entities with no methods, only fields. The rules live in the interactors, so the center ring is empty. See [the anemic domain model](/learn/domain-model#the-anemic-domain-model).

Reduce the rings to what the rules need. Two rings are often enough: a core with the entities and use cases, and the adapters around it.

## In a kata

In the [Waiting Room kata](/kata/waiting-room), the clinics move to the new system one at a time, and each has different old software. The appointment rules are the same everywhere. Say: "The appointment service has the rules in the inner rings. Each old clinic system connects through its own adapter while the move takes place. When a clinic moves, we delete its adapter." This shows why the dependency direction matters in a migration.

## Interview questions

**"What is the dependency rule?"**

- Source code dependencies point only toward the center.
- Inner rings know nothing about outer rings: no names, no types, no frameworks.
- Control can flow outward, through interfaces that the inner ring owns.

**"Clean, onion, and hexagonal: what is the difference?"**

- The same core idea: business rules at the center, dependencies inward.
- Clean names more rings and splits entities from use cases. Onion stresses that the database is not the center. Hexagonal talks of ports and adapters.
- Pick one vocabulary for the team and check the rule in the build.

**"Why plain data across boundaries?"**

- The inner ring must not depend on web or database types.
- It lets you test a use case with simple inputs.
- The cost is mapping code. Map where it protects a contract or a different shape.

**"How do you move a layered code base toward clean architecture?"**

- Move the repository interfaces into the business layer, and invert one dependency.
- Then move rules out of controllers and into entities, one feature at a time.
- Add an import check, so the new direction stays.

## Go deeper

- **Fundamentals of Software Architecture** (Richards, Ford), the part on the layered style and on technical partitioning: what goes wrong when the database is the foundation.
- **Building Microservices** (Newman), the parts on information hiding and on code reuse across services: why each service keeps its own model.
- **Domain-Driven Design** (Evans), the part on layered architecture with an isolated domain: the source of the idea of a protected core.

## Further reading

- [The clean architecture](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html), by Robert C. Martin
- [Screaming architecture](https://blog.cleancoder.com/uncle-bob/2011/09/30/Screaming-Architecture.html), by Robert C. Martin
- [The onion architecture](https://jeffreypalermo.com/2008/07/the-onion-architecture-part-1/), by Jeffrey Palermo
- [Dependency inversion principle](https://en.wikipedia.org/wiki/Dependency_inversion_principle) on Wikipedia
