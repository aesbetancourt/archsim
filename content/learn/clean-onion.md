## Three names, one idea

Onion architecture (Jeffrey Palermo) and clean architecture (Robert C. Martin) are close relatives of [hexagonal architecture](/learn/hexagonal). All three put the business rules in the center and make dependencies point inward. They differ in how many rings they name and in the words they use.

If you understand one, you understand all three. In a team or an interview, the useful skill is to translate between the vocabularies.

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

## How the names map

| Hexagonal | Onion | Clean | Content |
|---|---|---|---|
| Domain model | Domain model | Entities | Business rules that are true for the whole company |
| Use cases, application services | Application services | Use cases | The actions of this application |
| Ports | Interfaces in the inner rings | Boundaries: input and output ports | What the core offers and needs |
| Adapters | Infrastructure, UI | Interface adapters; frameworks and drivers | Everything technical |

## What clean architecture adds

- **A split between entities and use cases.** Entities hold rules that would exist with no software, such as how interest is calculated. Use cases hold the rules of this application, such as the steps to open an account.
- **Plain data across each boundary.** A use case receives and returns simple data structures. It does not receive a web request or return a database row.
- **Frameworks at the edge.** The framework is a detail that the core does not see. In practice this is the hardest rule to keep, because frameworks want to be everywhere.

## Compared with layered code

Traditional [layered](/learn/layered) code also has rings in a sense: presentation, business, data access. The difference is the direction of one dependency.

| | Traditional layers | Onion, clean, hexagonal |
|---|---|---|
| Business logic depends on | The data access layer | Nothing technical |
| Data access depends on | The database | The business logic, through an interface |
| To test business rules | You need a database, or heavy mocks | You need nothing |
| To change the database | Business code changes | Only an adapter changes |

In layered code, the database is the foundation and everything stands on it. In the other three, the business rules are the foundation.

## When to use which name

Use the vocabulary your team already has. Do not mix them in one code base, and do not argue about whether the pattern is "really" onion or clean. Agree on the one rule that matters, and check it automatically: nothing in the core imports from the outside.

## The cost

The same as for hexagonal: more structure, more conversion of data, more to learn. A simple application that reads and writes records gets no benefit.

## Further reading

- [The clean architecture](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html), by Robert C. Martin
- [Dependency inversion principle](https://en.wikipedia.org/wiki/Dependency_inversion_principle) on Wikipedia
