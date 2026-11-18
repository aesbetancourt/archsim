## The layers and their jobs

A layered application divides the code by technical role. Richards and Ford (Fundamentals of Software Architecture) describe the usual four layers. The number is a convention, not a rule.

| Layer        | Its job                                              | It must not know about           |
| ------------ | ---------------------------------------------------- | -------------------------------- |
| Presentation | Screens or API endpoints. Read input, show output.   | How data is stored               |
| Business     | The rules: prices, limits, states, calculations.     | HTTP, HTML, or the screen layout |
| Persistence  | Read and write data. Map between objects and tables. | Business decisions               |
| Database     | Store the data.                                      | Anything above it                |

Each layer is an abstraction around one kind of work. A developer who works on the screens does not have to know SQL. A developer who tunes queries does not have to know the screen layout. That separation of concerns is the main reason the style is so common.

### Physical topologies

The layers are logical parts of the code. They do not have to be separate deployments. Three topologies are common:

| Topology               | What is deployed together               | Typical case                                                |
| ---------------------- | --------------------------------------- | ----------------------------------------------------------- |
| All layers in one unit | Presentation, business, and persistence | A small web application with an embedded database for tests |
| Database separate      | Code in one unit, database on its own   | The usual case: one application, one database server        |
| Presentation separate  | A front-end app, plus one back-end unit | A single-page app or a mobile app on top of one API         |

A separate front end does not make the system distributed in a deep sense. The back end is still one quantum. See [Architecture quanta](/learn/architecture-quantum).

## Closed and open layers

A layer is **closed** when a request must go through it. It cannot skip it to reach the layer below. A layer is **open** when a request can skip it.

In a design with all layers closed, the presentation layer calls the business layer, the business layer calls the persistence layer, and the persistence layer calls the database. The presentation layer never calls the persistence layer directly, even for a simple read.

Why the rule exists: it limits what each layer depends on. The presentation layer depends only on the business layer. If you change the persistence layer, the presentation layer does not change.

The cost: a simple read must pass through each layer, even when the middle layers add nothing. For a read-only report, the business layer can be a thin pass-through. Some teams open the business layer for reads to avoid this. That is a valid decision, but it is a trade. Each open layer adds direct dependencies, and the isolation gets weaker.

## Layers of isolation

The isolation idea follows from closed layers. A change inside one layer does not affect the other layers, as long as the contract between layers stays the same.

An example from a parcel service. The team replaces a hand-written SQL persistence layer with an object-relational mapper. The business layer still calls `findParcel(trackingNumber)` and gets the same object back. No line in the presentation or business layers changes.

Isolation also makes it possible to replace a whole layer. A team can add a mobile API next to the web screens, both on top of the same business layer.

Isolation breaks when a layer leaks its details upward. Common leaks:

- The business layer returns database entities with lazy-loaded fields. The presentation layer now triggers queries.
- The presentation layer catches database exceptions by type.
- A business rule hides in a SQL view or a stored procedure, so the business layer is not the only place that holds the rules.

For the general idea, see [Complexity and deep modules](/learn/deep-modules#information-hiding-and-information-leakage).

## Adding layers

Sometimes you need shared code that only some layers can use. Richards and Ford show the standard fix: add a layer.

Assume the business layer uses shared business helpers: currency rounding, date rules, audit logging. You want to stop the presentation layer from calling them. Put them in a new services layer below the business layer, and close the business layer. The presentation layer cannot reach through a closed layer, so it cannot call the helpers.

```diagram
{
  "nodes": [
    { "id": "ui", "label": "Presentation", "shape": "module", "col": 1, "row": 0 },
    { "id": "rules", "label": "Business\n(closed)", "shape": "module", "col": 1, "row": 1 },
    { "id": "shared", "label": "Services\n(open)", "shape": "module", "col": 1, "row": 2 },
    { "id": "access", "label": "Persistence\n(closed)", "shape": "module", "col": 1, "row": 3 },
    { "id": "db", "label": "Database", "shape": "store", "col": 1, "row": 4 }
  ],
  "edges": [
    { "from": "ui", "to": "rules" },
    { "from": "rules", "to": "shared", "label": "shared helpers" },
    { "from": "rules", "to": "access", "label": "skips the open layer" },
    { "from": "shared", "to": "access" },
    { "from": "access", "to": "db" }
  ]
}
```

The new services layer is **open**. The business layer can skip it and call the persistence layer directly when it does not need a helper. Without the open marker, each data access from the business layer would pass through the services layer for no reason.

The lesson is general. You must document which layers are open and which are closed, and why. If the team does not know the rules, the layers decay into a [big ball of mud](/learn/styles#a-short-history). A [fitness function](/learn/measuring-characteristics#examples-of-fitness-functions) can check the rules in each build.

## How a request moves

A customer of the parcel service asks for the status of a parcel.

1. The presentation layer reads the tracking number from the request and checks its format.
2. It calls the business layer: `getParcelStatus(trackingNumber)`.
3. The business layer asks the persistence layer for the parcel and its scan events.
4. The persistence layer runs two queries and maps the rows to objects.
5. The business layer applies the rules: is the parcel late, which status text to show.
6. The presentation layer formats the answer as JSON or HTML.

All six steps run in one process, usually in one database transaction. That is the main strength of the style for data consistency. It is also why one slow query or one memory leak affects every request.

## The sinkhole anti-pattern

A sinkhole request passes through the layers with no logic in them. The presentation layer calls the business layer, which calls the persistence layer, which runs a query. The middle layers only forward the call.

Some sinkholes are normal. A simple read of a reference list does not need rules. Richards and Ford give a rule of thumb, often called the 80-20 rule. If about 20% of requests are sinkholes, that is acceptable. If about 80% are, the layered style is a poor fit for the problem. The numbers are rough. The point is the ratio.

When most requests are sinkholes:

- The system is mostly create, read, update, and delete (CRUD). A simpler structure can do the work.
- Or the logic is in the wrong place, for example in the database or in the screens.
- Or the team added layers out of habit, and they cost more code than they save.

Options: open the business layer for reads, use a thin CRUD framework for the simple parts, or move to [vertical slices](/learn/vertical-slices), where each slice has only the layers that it needs.

## Why it is technically partitioned

The top-level parts of a layered application are technical roles. All the controllers are in one place, all the business services in another, all the repositories in a third. See [Two levels of architecture](/learn/code-architecture#technical-partitioning-and-domain-partitioning).

The consequence: a business change cuts across the layers. To add "deliver on Saturday" to the parcel service, a developer changes a screen, a business rule, a query, and a table. The change touches four places that often have four owners.

This fits an organization with teams by skill: a front-end team, a back-end team, a database team. By [Conway's law](/learn/teams#conway-s-law), those teams tend to produce layers. It fits poorly when teams own business features. Each feature then needs work from every skill team, and the hand-offs slow each release.

A variant reduces the pain. Inside each layer, divide the code by business area: `rules/parcels`, `rules/billing`, `persistence/parcels`, `persistence/billing`. The partitioning at the top is still technical, but each area is easier to find, and the later move to a modular monolith is shorter.

## How it handles each characteristic

| Characteristic  | How the layered style behaves                                                                                         |
| --------------- | --------------------------------------------------------------------------------------------------------------------- |
| Simplicity      | Strong. Most developers know it. Frameworks generate it.                                                              |
| Cost            | Low. One deployment, one database, one team.                                                                          |
| Testability     | Good for each layer alone. Weaker for features, because a feature test crosses every layer.                           |
| Deployability   | Weak as it grows. Each small change needs a release of the whole unit.                                                |
| Scalability     | Limited. You can run several copies behind a load balancer, but all parts scale together, and the database is shared. |
| Elasticity      | Weak. A large unit starts slowly.                                                                                     |
| Fault tolerance | Weak. A memory leak or a crash in one part stops all parts.                                                           |
| Evolvability    | Good while small. It falls as the code grows, because changes cross the layers.                                       |

## When it is a good first style

Richards and Ford present the layered style as a good start when you are not sure which style the system needs. Reasons:

- It is quick to build, so you learn about the domain early.
- It is cheap. A small budget goes into features, not infrastructure.
- Many frameworks give it to you by default, so the team needs no new skills.

It is a good fit for a small application, an internal tool, or a first version of a product. It is also a common choice when a deadline is tight.

A warning applies here. A team that never chooses a style usually gets a layered one by default. Richards and Ford call this "architecture by implication". The style is not wrong, but the choice must be conscious. Write a [decision record](/learn/decision-records) that says why the layered style fits now, and what would make you change it.

## How it evolves

A layered application that grows has three usual paths.

1. **Domain packages inside the layers.** The cheap first step, described above.
2. **Turn it inside out into a modular monolith.** Make the business areas the top-level parts. Each module keeps small layers inside it. This is the move from technical to domain partitioning. See [Modular monolith](/learn/modular-monolith).
3. **Protect the core.** Move the business layer to the center and make the persistence and presentation layers depend on it, not the other way around. That is the [hexagonal](/learn/hexagonal) or [clean](/learn/clean-onion) shape. It changes the direction of dependencies, but not the partitioning.

After step 2, a module can leave the deployment as a service if it needs different characteristics. See [Decomposing a monolith](/learn/decomposing-a-monolith). A direct split of a layered application by layer, for example "the persistence service", is a mistake. It gives a [distributed monolith](/learn/modularity#the-distributed-monolith), because every feature still needs every layer.

## Compared with its neighbors

| Compared with      | The difference                                                                                     |
| ------------------ | -------------------------------------------------------------------------------------------------- |
| Modular monolith   | Same deployment. Modules divide by business area, layers divide by role.                           |
| Hexagonal or clean | Both keep layers. Hexagonal points dependencies toward the business core, not toward the database. |
| Vertical slices    | Each feature is one slice with only the code it needs. No shared layer structure.                  |
| Service-based      | Several deployments by business area. Often each service is layered inside.                        |

## Common mistakes

- **Business rules in the wrong layer.** Validation in the screens, pricing in a stored procedure. The rules then exist in two places and differ.
- **Every layer open.** The team skips layers whenever it is convenient. The structure exists only in the folder names.
- **One shared model for all layers.** The database entity goes all the way to the screen. A column change then breaks the API.
- **Layers as services.** A separate deployment for each layer adds network calls to every request and gives no independence.
- **No rule checks.** Without a fitness function, the layer rules decay within months.

## In a kata

Use the layered style when the kata is small and the characteristics are modest. A good example is an internal tool or the first phase of a product. In your answer:

1. Name the layers, and mark each as open or closed.
2. Estimate the share of sinkhole requests. If most requests are simple reads, say how you handle them.
3. Say what triggers the next step: "When a second team joins, we reorganize the code by business area."

In [Lunch Rush](/kata/lunch-rush), a layered first version is defensible, but a [modular monolith](/learn/modular-monolith) costs about the same and gives cleaner boundaries for the ordering and kitchen areas.

## Interview questions

**"What is the difference between a closed and an open layer?"**

- A closed layer must be passed through. A request cannot skip it.
- An open layer can be skipped.
- Closed layers give isolation: a change in one layer does not spread.
- Open layers cut the pass-through work, but add direct dependencies. Document which is which.

**"What is the sinkhole anti-pattern?"**

- Requests pass through layers that add no logic.
- Some is normal. The rough rule of thumb is 80-20: about 20% sinkholes is fine, about 80% is a poor fit.
- The fix: open a layer for reads, use a simpler structure, or use vertical slices.

**"Why does a feature change touch every layer?"**

- The style is technically partitioned. A feature has screen, rule, and data parts, and each sits in a different layer.
- This fits teams by skill, and fits feature teams poorly.
- Domain packages inside each layer, or a modular monolith, reduce the spread.

**"Your layered application is slow to change. What do you do?"**

- Measure where changes land, and check how often one feature touches all layers.
- Reorganize by business area first, inside the one deployment.
- Add fitness functions for the new boundaries.
- Move a module out as a service only if it needs different characteristics.

## Go deeper

- **Fundamentals of Software Architecture** (Richards, Ford), the part on the layered architecture style: topologies, closed and open layers, adding layers, and the sinkhole anti-pattern.
- **A Philosophy of Software Design** (Ousterhout), the part on different layers and different abstractions: why a pass-through layer is a sign of a shallow design.
- **Building Microservices** (Newman), the part on splitting a monolith: why a split by technical layer gives poor services.

## Further reading

- [Multitier architecture](https://en.wikipedia.org/wiki/Multitier_architecture) on Wikipedia
- [Presentation Domain Data Layering](https://martinfowler.com/bliki/PresentationDomainDataLayering.html), by Martin Fowler
