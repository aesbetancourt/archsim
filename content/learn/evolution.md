## Architecture is never finished

Katas start from an empty page. Real work almost never does. Most of the work of a senior architect is to change a system that is in use, with a team that also delivers features, and with no permission to stop for a year. The Waiting Room kata has this shape: 120 clinics move to a new system, one at a time, over two years.

An **evolutionary architecture** supports guided change in small steps across several dimensions. The term comes from Neal Ford, Rebecca Parsons, and Patrick Kua, and Fundamentals of Software Architecture uses the same ideas. "Guided" is the key word. The architecture can change, and automatic checks keep the important properties while it changes.

Two properties make change easy:

- **Small, independent parts.** A change in one part does not force a change in others. See [Modularity](/learn/modularity) and [Architecture quantum](/learn/architecture-quantum).
- **A fast, safe path to production.** A small change that takes a month to release is not small. See [Delivery performance](/learn/delivery-performance).

## Never plan a full rewrite as one step

A rewrite that replaces everything on one day has a long period with cost and no value, a moving target, and one very dangerous day at the end. Prefer a change in small steps, where each step is in production and can be reversed.

The problems of a full rewrite are well known:

- **The old system keeps changing.** The business cannot wait two years for features. Each new feature goes into the old system and must also go into the new one.
- **The old system holds rules that nobody wrote down.** Many of them are found only when the new system gets them wrong.
- **No feedback until the end.** Design mistakes stay hidden until real users and real data arrive.
- **The value comes last.** The project can lose its budget before it delivers anything.

A rewrite in one step can be correct for a small system, or when the old platform is about to lose support. Even then, plan a period when both run, and a way back.

## The strangler fig

The standard pattern for a replacement in steps:

1. Put a layer in front of the old system that can send each request to the old or the new system.
2. Build one small function in the new system.
3. Send the requests for that function to the new system. Keep the old path for a quick return.
4. Repeat, function by function.
5. Remove the old system when nothing uses it.

The hard part is the data. While both systems run, each piece of data needs one owner, and the other system needs a copy that is kept current. Decide this for each step, not once at the start.

Martin Fowler named the pattern after a fig tree that grows around its host. Sam Newman, in Building Microservices, applies it to a monolith. The layer in front is usually an HTTP proxy or an API gateway. For messages, it can be a router that sends each message to the old or the new consumer.

This is a parcel service in the middle of a migration. Tracking has moved to a new service. All other functions stay in the monolith:

```diagram
{
  "nodes": [
    { "id": "client", "label": "Customer app", "shape": "actor", "col": 0, "row": 1 },
    { "id": "proxy", "label": "Routing proxy", "shape": "box", "col": 1, "row": 1 },
    { "id": "mono", "label": "Parcel monolith", "shape": "box", "col": 2, "row": 0 },
    { "id": "track", "label": "Tracking service\n(new)", "shape": "box", "col": 2, "row": 2 },
    { "id": "olddb", "label": "Monolith database", "shape": "store", "col": 3, "row": 0 },
    { "id": "cdc", "label": "Change events", "shape": "pipe", "col": 3, "row": 1 },
    { "id": "newdb", "label": "Tracking data", "shape": "store", "col": 3, "row": 2 }
  ],
  "edges": [
    { "from": "client", "to": "proxy", "label": "all requests" },
    { "from": "proxy", "to": "mono", "label": "other paths" },
    { "from": "proxy", "to": "track", "label": "/tracking/*" },
    { "from": "mono", "to": "olddb", "label": "reads and writes" },
    { "from": "olddb", "to": "cdc", "label": "parcel changes\n(CDC)", "async": true },
    { "from": "cdc", "to": "track", "label": "parcel created", "async": true },
    { "from": "track", "to": "newdb", "label": "reads and writes" }
  ]
}
```

Select the first function with care. A good first step has real value, few dependencies on the rest of the monolith, and a low cost of failure. Tracking in the parcel service is a good candidate: it reads much and writes little, and an error does not lose a parcel. Billing is a bad first candidate.

For the full method, including where to cut and how to split a shared database, see [Decomposing a monolith](/learn/decomposing-a-monolith) and [Data ownership](/learn/data-ownership).

## Other techniques for change in steps

| Technique               | Use                                                                                                                         |
| ----------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| Branch by abstraction   | Put an interface in front of the part to replace. Build the new part behind it, and switch                                  |
| Parallel run            | Run old and new with the same input, and compare the results before you trust the new one                                   |
| Decorating collaborator | Let the old system do its work, then add the new behavior in a new service, based on the result                             |
| Change data capture     | React to the changes in the old database, without a change to the old code                                                  |
| Expand and contract     | Add the new structure, move the users of it, then remove the old structure. See [Deployment and release](/learn/deployment) |
| Feature flags           | Switch on the new path for a few users first                                                                                |

Newman describes the first four as migration patterns for a monolith. They solve different problems. The sub-parts below explain each one.

### Branch by abstraction

Use it when the part to replace is deep inside the old code, so a proxy in front cannot catch the calls.

1. Make an interface for the function, for example `NotificationSender`.
2. Change all callers to use the interface. The old code is the first implementation.
3. Build the new implementation behind the same interface. It can call a new service.
4. Switch to the new implementation, often with a feature flag.
5. Remove the old implementation. Remove the interface too if it has no other use.

The code stays in one branch the whole time. Each step merges to the main line and goes to production. This is the "branch" in the name: a branch in the code, not in version control.

### Parallel run

Use it when an error is expensive, for example in pricing, tax, or payments. Both implementations get the same input. The old one stays the source of truth, and its answer goes to the user. A job compares the two answers and records each difference.

A ticket seller that moves its price rules can run both price engines for two weeks. When the differences are zero, or each difference is explained, the new engine takes over. Libraries such as GitHub's Scientist help with this pattern in code.

Do not run side effects twice. If both versions send an email or charge a card, the customer gets two. Run the new version in a mode that only calculates.

### Decorating collaborator

Use it when the new behavior depends on what the old system did, and you cannot change the old system. A proxy sends the request to the old system as normal. When the answer comes back, the proxy also calls a new service with the result.

For a lunch shop, the old system places the order. The proxy sees "order placed" in the answer and calls a new Rewards service that adds a stamp to the loyalty card. The old code does not change. This pattern works only when the answer holds the data that the new service needs.

### Change data capture

Use it when the new service must react to changes, but the old code has no events and is too risky to touch. A tool reads the transaction log of the old database and publishes each change as an event. Debezium is a common tool for this.

The risk is coupling to the old schema. The new service now depends on the table structure of the old system. A change to a column in the monolith can break it. Map the raw changes to stable events as early as possible.

## Fitness functions

An architecture decays when nobody checks it. A fitness function is an automatic check of an architecture rule, run with the tests:

- No module reads the tables of another module.
- The order page answers in less than 300 milliseconds in the performance test.
- No service has a dependency on the layer above it.

A rule that is only in a document is broken in months. A rule that fails the build stays.

A fitness function is any objective check of an architecture characteristic. It can be a unit test, a metric, a monitor, or a chaos experiment. For how to put a number on each characteristic, see [Measuring characteristics](/learn/measuring-characteristics).

### Kinds of fitness function

| Kind      | Meaning                                                      | Example for a ticket seller                                             |
| --------- | ------------------------------------------------------------ | ----------------------------------------------------------------------- |
| Atomic    | Checks one characteristic in one context                     | The seat module has no dependency on the payment module                 |
| Holistic  | Checks several characteristics together, in a shared context | With the cache on, checkout stays fast and still shows only paid seats  |
| Triggered | Runs on an event: a commit, a build, a deploy                | A latency test runs in the pipeline before each release                 |
| Continual | Runs all the time, usually in production                     | A monitor checks that 99% of seat searches answer in less than 1 second |

Holistic checks matter because characteristics interact. A change that makes a system faster can make it less secure or less consistent. Atomic checks alone do not find that.

Other pairs exist: **static** against **dynamic** (a fixed limit, or one that changes with the load), and **automated** against **manual** (a build rule, or a legal review).

### Fitness functions in code

Tools exist for most languages: ArchUnit for Java, NetArchTest for .NET, and dependency-cruiser for JavaScript and TypeScript. This dependency-cruiser rule stops the orders module from reading the internals of billing:

```js
module.exports = {
  forbidden: [
    {
      name: "orders-not-into-billing-internals",
      severity: "error",
      from: { path: "^src/orders" },
      to: { path: "^src/billing/internal" },
    },
  ],
};
```

Start with two or three rules that protect the decisions that matter most. Add a rule each time the team makes an important decision. Link each rule to its [decision record](/learn/decision-records), so that a developer who breaks it can read why it exists.

## Technical debt

Technical debt is a shortcut that costs more work later. Some debt is a good decision: it buys speed when speed matters. Treat it like a loan:

- Take it deliberately, and write it down. See [Architecture decision records](/learn/decision-records).
- Know the interest: what does it cost each month?
- Pay back the debt in the parts that change often. Debt in code that nobody touches costs nothing.

Fowler sorts debt on two axes: deliberate or inadvertent, and reckless or prudent.

|             | Reckless                                  | Prudent                                                           |
| ----------- | ----------------------------------------- | ----------------------------------------------------------------- |
| Deliberate  | "No time for design." The cost is ignored | "Ship now, fix after the launch." The cost is known and planned   |
| Inadvertent | The team did not know a better design     | The team learned the better design only after it built the system |

Prudent, deliberate debt is a tool. Reckless debt is a problem of skill or culture, and a debt register does not fix it.

To find the debt that costs most, combine how often a file changes with how hard it is to change. Version control history gives the first fact.

## Options and old systems

Gregor Hohpe, in The Software Architect Elevator, describes architecture as a way to sell options. An option is the right to make a decision later. An interface in front of a payment provider is an option: it lets the team change provider without a rewrite. An option has a price. The interface costs time today.

The value of an option grows with uncertainty. If the business is sure it keeps one payment provider for ten years, the interface has little value. If the business plans to enter three new countries, it has much more. This gives a way to argue for flexibility in business terms.

Hohpe also warns about systems that nobody switches off. Each migration that stops at 80% leaves two systems to run, to secure, and to understand. A plan for change must include the step that removes the old system, and a budget for it. Count a migration as done only when the old part is gone.

## Failure modes of a migration

| Failure                       | What occurs                                               | Prevention                                                                               |
| ----------------------------- | --------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| The half-finished migration   | Two systems run for years, and each change goes into both | A date and a budget for the removal of the old part                                      |
| Dual writes                   | The code writes to two databases, and one write fails     | One owner for each piece of data, and a copy through events                              |
| The new system copies the old | The new code repeats the old model and its problems       | Model the domain again before you build. See [Bounded contexts](/learn/bounded-contexts) |
| No measure of done            | Nobody can say what share of the traffic moved            | Measure the share of requests on the new path, each week                                 |

## How to argue for a change

"The architecture is bad" gets no budget. Connect the change to a result the business cares about: "Each new partner takes six weeks, because of X. After this change, it takes one." See [Teams and communication](/learn/teams).

A strong case has four parts:

1. **The cost today**, in money, time, or risk. "Each release needs two days of manual tests."
2. **The change**, in one sentence, with the first step.
3. **The result**, as a number. "Releases each day, with one hour of tests."
4. **The way back.** Show that each step can be reversed. This makes the decision small.

Ask for the first step, not the full program. A first step that delivers value earns the budget for the second.

## In a kata

The [Waiting Room kata](/kata/waiting-room) asks for a move of 120 clinics over two years. Show the migration in the design, not only the end state:

- Name the first clinics or functions to move, and why.
- Show the layer that sends each clinic to the old or the new system.
- State the owner of the patient record while both systems run.
- Name one or two fitness functions, for example "patient data never leaves the country".
- Say how a clinic moves back if the new system fails.

## Interview questions

**"How would you move this monolith to services with no downtime?"**

- Put a proxy in front, and use the strangler fig pattern.
- Select a first function with value and few dependencies.
- Use branch by abstraction for parts deep inside the code.
- Give each piece of data one owner, and copy it with events or change data capture.
- Remove the old code for each function that moves.

**"How do you stop an architecture from decaying?"**

- Turn the important rules into fitness functions that fail the build.
- Use continual checks in production for latency and availability.
- Link each rule to a decision record.
- Review the rules when the business goals change.

**"How do you replace a price engine where errors cost money?"**

- Use a parallel run, with the old engine as the source of truth.
- Compare each result, and explain each difference.
- Do not repeat side effects.
- Switch with a flag, and keep the old engine ready for a quick return.

## Go deeper

- **Fundamentals of Software Architecture**, Mark Richards and Neal Ford, the part on measuring and governing characteristics. It adds fitness functions as a tool for architecture governance.
- **Building Microservices**, Sam Newman, the part on splitting the monolith. It adds the migration patterns, and the patterns for moving data. His book Monolith to Microservices, not on this list, goes further.
- **Software Architecture: The Hard Parts**, Ford and others, the part on component-based decomposition. It adds a step-by-step method to find the parts to move.
- **The Software Architect Elevator**, Gregor Hohpe, the parts on options and on retiring old systems. It adds how to argue for change in business terms.

## Further reading

- [Strangler fig application](https://martinfowler.com/bliki/StranglerFigApplication.html), by Martin Fowler
- [Branch by abstraction](https://martinfowler.com/bliki/BranchByAbstraction.html), by Martin Fowler
- [Parallel change](https://martinfowler.com/bliki/ParallelChange.html), by Martin Fowler, on expand and contract
- [Technical debt quadrant](https://martinfowler.com/bliki/TechnicalDebtQuadrant.html), by Martin Fowler
- [Technical debt](https://en.wikipedia.org/wiki/Technical_debt) on Wikipedia
