## Why and when to split

Many systems start as one deployment, and that is usually correct. A monolith becomes a problem when one of these is true:

- Many teams work in one codebase, and their releases block each other.
- One part needs a different characteristic: much higher scale, more availability, or stronger security.
- A change in one area breaks other areas, because the code has no clear boundaries.

Before you plan a split, ask if a [modular monolith](/learn/modular-monolith) solves the problem. Clean module boundaries inside one deployment fix the third problem at a much lower cost. A split into services solves the first two, and only when each new service is a separate [architecture quantum](/learn/architecture-quantum).

When a split is the answer, there are two questions:

1. **What are the parts?** Find the services inside the code. The Hard Parts (Ford, Richards, Sadalage, Dehghani) gives two approaches: component-based decomposition and tactical forking.
2. **How do you move them out?** Move each part while the system stays in production. Newman (Building Microservices) describes the migration patterns for this.

For the size of each part, see [How large a service must be](/learn/service-granularity). For how to split the database, see [Data ownership](/learn/data-ownership). This page covers the path from one to the other.

## Is the code ready to split?

First, look at the structure that the code has now. Two very different cases exist.

| Case              | What the code looks like                                              | The approach                  |
| ----------------- | --------------------------------------------------------------------- | ----------------------------- |
| Some structure    | Packages or namespaces roughly follow business areas, with some leaks | Component-based decomposition |
| A big ball of mud | No clear packages. Each class can call each other class               | Tactical forking              |

To tell them apart, use the structural measures in [Modularity, cohesion, and coupling](/learn/modularity). Count the afferent and efferent coupling of each package. Look for cycles. If most packages depend on most other packages, the code has no components to extract.

A component here means a group of code with one job, usually one package or namespace. In the code, it has a path such as `parcels.billing.invoice`.

## Component-based decomposition

The Hard Parts describes six patterns that you apply in order. Each one makes a small change to the monolith. At the end, the code is a set of domains that can each become a service. The steps change the code inside the monolith first, so the system stays in production all the time.

The running example is a parcel service monolith with these packages: `booking`, `booking.pricing`, `tracking`, `billing`, `billing.invoice`, `billing.audit`, `labels`, `util`.

### 1. Identify and size components

List each component and measure its size, for example as the number of statements. Calculate the share of the whole code for each one.

Look for components that are much larger or much smaller than the others. A component with 30% of the code probably does several jobs and needs a split. A component with a few statements can join another one.

In the example, `billing` holds 25% of the code. It has invoices, refunds, and carrier payments. Split it into three components.

### 2. Gather common domain components

Find shared business functions that several components do in their own way. Typical examples are notification, audit, and address checks.

In the example, `booking`, `tracking`, and `billing` each send email with their own code. Gather this code into one `notify` component. Now one component owns the job, and a later service has one clear owner.

This pattern is about shared business functions. A technical helper, such as a date formatter, can stay a shared library.

### 3. Flatten components

A component must be a leaf in the package tree. If a package has its own code and also sub-packages, the code at the upper level has no clear home. These are called orphaned classes.

In the example, `billing` has classes of its own, and also `billing.invoice` and `billing.audit`. Move the classes at the top into a sub-package, such as `billing.payment`, or move the sub-packages up a level. After this step, each piece of code is in exactly one leaf component.

### 4. Determine component dependencies

Map the dependencies between the components. How many components does each one use, and how many use it?

This step tells you if the split is possible, and how much work it is. A component that many others use, such as `booking.pricing`, is hard to move out. A component that nobody else calls, such as `labels`, is easy. If the map shows dependencies from almost each component to almost each other one, stop. This code is closer to a big ball of mud, and tactical forking is a better fit.

### 5. Create component domains

Group the components into domains: sets of components that belong to one business area. Make the domain visible in the package names.

In the example:

| Domain   | Components                                                              |
| -------- | ----------------------------------------------------------------------- |
| Shipment | `shipment.booking`, `shipment.pricing`, `shipment.labels`               |
| Tracking | `tracking.events`, `tracking.public`                                    |
| Billing  | `billing.invoice`, `billing.payment`, `billing.refund`, `billing.audit` |
| Notify   | `notify.email`, `notify.sms`                                            |

The domains are still inside one deployment. This is a good place to stop for a while. The result is a modular monolith with clear domains.

### 6. Create domain services

Move each domain out into its own service. The result is a [service-based architecture](/learn/service-based): a few coarse services, often with a shared database at first.

From here, you can split one domain service further into [microservices](/learn/microservices), but only where a granularity force asks for it. Many systems stay at domain services.

```diagram
{
  "nodes": [
    { "id": "mono", "label": "Monolith\n(8 packages)", "shape": "module", "col": 0, "row": 1 },
    { "id": "comp", "label": "Leaf components\n(steps 1-4)", "shape": "module", "col": 1, "row": 1 },
    { "id": "dom", "label": "4 domains in\none deployment", "shape": "module", "col": 2, "row": 1 },
    { "id": "ship", "label": "Shipment", "shape": "box", "col": 3, "row": 0 },
    { "id": "track", "label": "Tracking", "shape": "box", "col": 3, "row": 1 },
    { "id": "bill", "label": "Billing", "shape": "box", "col": 3, "row": 2 }
  ],
  "edges": [
    { "from": "mono", "to": "comp", "label": "size, gather,\nflatten" },
    { "from": "comp", "to": "dom", "label": "step 5" },
    { "from": "dom", "to": "ship", "label": "step 6" },
    { "from": "dom", "to": "track" },
    { "from": "dom", "to": "bill" }
  ]
}
```

## Tactical forking

Tactical forking is the alternative when the code has no structure to extract. The idea is to delete code, not to extract it.

1. Make a full copy of the monolith for each team. Each copy starts as the whole system.
2. Each team owns one business area, for example tracking.
3. Each team deletes the code its area does not need, step by step, with the tests running.
4. Put a layer in front that sends each request to the right copy.

Deleting is often easier than extracting. A developer does not have to understand each dependency to find what to remove. The tests and the compiler show when a deletion went too far.

| Approach                      | Good when                                        | The cost                                                                   |
| ----------------------------- | ------------------------------------------------ | -------------------------------------------------------------------------- |
| Component-based decomposition | The code has packages that follow business areas | More analysis first. The result is clean                                   |
| Tactical forking              | The code is a big ball of mud                    | Each service keeps dead code and duplicate code. Teams must clean it later |

Tactical forking gives fast progress, but it leaves debt. Each service starts with much code that only one other service uses. Plan the time to clean it.

## Moving code out: the migration patterns

Once you know the parts, move them into production one at a time. Never plan a full rewrite as one step. See [Evolution and change in steps](/learn/evolution) for why.

Newman describes several patterns for this move, in Building Microservices and in more detail in his book Monolith to Microservices.

### Strangler fig

Put a layer in front of the monolith that can send each request to the old code or to the new service. Move one function at a time. The steps are in [Evolution and change in steps](/learn/evolution#the-strangler-fig).

```diagram
{
  "nodes": [
    { "id": "client", "label": "Shop and\ncarrier apps", "shape": "actor", "col": 0, "row": 1 },
    { "id": "proxy", "label": "Routing proxy", "shape": "box", "col": 1, "row": 1 },
    { "id": "mono", "label": "Monolith\n(all else)", "shape": "box", "col": 2, "row": 0 },
    { "id": "track", "label": "Tracking\nservice (new)", "shape": "box", "col": 2, "row": 2 },
    { "id": "mdb", "label": "Monolith\ndatabase", "shape": "store", "col": 3, "row": 0 },
    { "id": "tdb", "label": "Tracking\nstore", "shape": "store", "col": 3, "row": 2 }
  ],
  "edges": [
    { "from": "client", "to": "proxy", "label": "HTTPS" },
    { "from": "proxy", "to": "mono", "label": "other paths" },
    { "from": "proxy", "to": "track", "label": "/tracking" },
    { "from": "mono", "to": "mdb" },
    { "from": "track", "to": "tdb" },
    { "from": "mono", "to": "track", "label": "parcel events", "async": true }
  ]
}
```

Newman points out that the layer does not have to be an HTTP proxy. You can also intercept messages: the new service reads from the queue that the monolith used to read.

The pattern works best for functions that the outside world calls directly. It is hard to use for a function deep inside the monolith that only other monolith code calls.

### Branch by abstraction

Use this when the function to move is deep inside the monolith.

1. Put an interface in front of the function, inside the monolith. Make all callers use the interface.
2. Write a second implementation of the interface that calls the new service.
3. Switch the callers to the new implementation, for example with a feature flag.
4. Remove the old implementation, and later the interface if it adds nothing.

Each step is a small change that you can release. The main branch always works. The name means that the abstraction does the job of a long-lived branch, with no branch in version control.

### Parallel run

Use this when a mistake is expensive, for example in a calculation of prices or pay.

1. Send each request to both the old and the new implementation.
2. Use the result of the old one. Store the result of the new one.
3. Compare the two results, and investigate each difference.
4. Switch when the differences stop.

A parallel run costs double the work for that function for a while. It gives strong evidence that the new code is correct with real data.

### Other patterns

- **Decorating collaborator**: the new service listens to the requests and responses of the monolith through a proxy, and adds behavior. The monolith does not change.
- **Change data capture**: the new service reacts to changes in the monolith database, read from the database log. Use it when the monolith has no events to publish.

## The order of code and data

The code is the easy half. The data is the hard half. Newman compares three orders:

| Order                  | Benefit                                   | Risk                                                       |
| ---------------------- | ----------------------------------------- | ---------------------------------------------------------- |
| Code first, data later | Value soon. The new service deploys alone | The team stops here. The service still shares the database |
| Data first, code later | You find the hard data problems early     | No visible value for a long time                           |
| Both together          | One clean step                            | A large step that is hard to reverse                       |

Code first is the most common order. It is acceptable only with a plan to finish. A service that shares the monolith database is still in the same quantum. See [Data ownership](/learn/data-ownership) for how to split the tables and keep the copies consistent.

## Where to start

Select the first part with two measures: how easy it is to move, and how much value the move gives.

1. Start at the edge. A part with few incoming dependencies is easier to move. Use the map from step 4.
2. Prefer a part where the move fixes a real problem: a different load, a team that waits for releases, a security scope.
3. Avoid the core domain for the first move. The team learns the patterns on a part where a mistake costs less.
4. Make the first move small. It also builds the pipeline, the monitoring, and the contract tests that later moves need.

In the parcel service, tracking is a good first move. Customers call it directly, so a proxy can route it. It reads parcel events, but no other code calls it. It has the highest read load.

## Failure modes

- **The big bang.** A full rewrite with one switch at the end. Long cost with no value, and one very risky day.
- **Stopped halfway.** Services that share the monolith database. This is a distributed monolith: the cost of many deployments, the coupling of one. See [Modularity](/learn/modularity#the-distributed-monolith).
- **Too fine, too soon.** A split straight into many small services, before the domains are clear. Move to domain services first.
- **No observability.** A request now crosses several deployments. Without tracing, nobody can find where it fails. See [Observability](/learn/observability).
- **A feature freeze.** The business stops new work for the migration. Each step must also allow normal feature work, or the budget ends before the migration does.

## In a kata

The [Waiting Room](/kata/waiting-room) kata moves 120 clinics over two years. That is a migration problem. A strong answer:

1. Says the move is in steps, and names the pattern: a strangler fig at the level of each clinic, with a router that sends each clinic to the old or the new system.
2. Names the order of the parts, and why the first one is first.
3. States who owns each piece of data during the move, and how the other system gets a copy.
4. Names the way back for each step if it fails.

## Interview questions

**"How do you split a large monolith into services?"**

- First ask if a modular monolith is enough. Name the problem the split solves.
- Find the parts: component-based decomposition, or tactical forking if the code has no structure.
- Move them one at a time with a strangler fig or branch by abstraction.
- Plan the data split from the start. Do not stop with a shared database.

**"What is branch by abstraction, and when do you use it instead of a strangler fig?"**

- An interface inside the monolith, with the old and new implementations behind it.
- Use it for a function deep inside the code that no outside caller reaches.
- Each step can be released, and the main branch always works.

**"The code is a big ball of mud. How do you start?"**

- Measure the coupling first. If each package depends on each other, extraction is very slow.
- Tactical forking: copy the codebase for each team, and delete what each one does not need.
- Accept dead and duplicate code at first, and plan time to clean it.

**"Which part do you move out first?"**

- A part at the edge, with few incoming dependencies.
- A part where the move fixes a real problem.
- Not the core domain. Learn on a part where a mistake costs less.

**"Do you move the code or the data first?"**

- Code first is common, because it gives value sooner.
- The risk is to stop there with a shared database.
- State the plan for the data split, and when it occurs.

## Go deeper

- **Software Architecture: The Hard Parts** (Ford, Richards, Sadalage, Dehghani), the parts on decomposition: the six component-based decomposition patterns in order, and tactical forking.
- **Building Microservices** (Newman), the part on splitting the monolith: the strangler fig, branch by abstraction, parallel run, and the order of code and data. His book Monolith to Microservices covers the same patterns in more detail.
- **Fundamentals of Software Architecture** (Richards, Ford), the parts on component identification and on modularity: how to find the components and measure their coupling.
- **Domain-Driven Design** (Evans), the part on bounded contexts: how to find the business areas that become the domains.

## Further reading

- [Strangler fig application](https://martinfowler.com/bliki/StranglerFigApplication.html) and [Branch by abstraction](https://martinfowler.com/bliki/BranchByAbstraction.html), by Martin Fowler
- [How to break a monolith into microservices](https://martinfowler.com/articles/break-monolith-into-microservices.html), by Zhamak Dehghani
- [Strangler application](https://microservices.io/patterns/refactoring/strangler-application.html) on microservices.io
