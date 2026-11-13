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

## The principle

Things that change together live together. Coupling is kept low between slices and is permitted to be high inside a slice. See [Modularity, cohesion, and coupling](/learn/modularity).

Each slice selects the structure it needs. "List orders" can be one query with no abstraction. "Place order" can have a full domain model. Layered code forces each feature through the same layers, also when a layer only passes data to the next one.

## Compared with layers

| | By layer | By slice |
|---|---|---|
| A new feature | Touches each layer folder | Adds one folder |
| To understand a feature | Read files in many places | Read one folder |
| Shared logic | Natural: it is in the service layer | Needs a decision: copy it, or move it to a shared part |
| Risk | Layers that do nothing but pass data | Duplicated rules that drift apart |
| To delete a feature | Hard to find all the pieces | Delete the folder |

## The hard part: shared code

Two slices often need the same rule, such as how the price of an order is calculated. If each slice has its own copy, the copies will differ after a year.

The usual answer: start with the code in the slice. When a second slice needs the same business rule, move that rule to a shared domain model, and keep the slices as thin use cases on top of it. Technical helpers can also be shared. Do not share only because two pieces of code look similar. Share when they must change together.

## How it combines with the other patterns

Vertical slices and [hexagonal architecture](/learn/hexagonal) answer different questions. Slices decide how the folders are grouped. Hexagonal decides the direction of dependencies. Many teams use both: one slice for each use case, a shared domain model in the center, and adapters at the edge.

At system level, a slice is not a service. Slices are folders in one deployment. A group of related slices is a natural candidate for a module in a [modular monolith](/learn/modular-monolith).

## When it fits

- An application with many features that are mostly independent.
- Teams where developers own features, not layers.
- APIs where most endpoints are simple and a few are complex.

It fits less well when almost every feature uses the same complex rules. Then the shared domain model is the main thing, and the slices are thin.

## Further reading

- [Vertical slice architecture](https://www.jimmybogard.com/vertical-slice-architecture/), by Jimmy Bogard
