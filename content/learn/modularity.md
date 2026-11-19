## The question

How do you know if a system is divided into the right parts? Two measures answer most of it: cohesion and coupling. Good structure has high cohesion in each part and low coupling between the parts.

A module is a group of code that has one name and one boundary: a package, a namespace, a component, or a service. The ideas on this page apply at each of these sizes. Richards and Ford (Fundamentals of Software Architecture) call modularity an organizing principle. Many other goals, such as testability and deployability, depend on it.

## Cohesion

Cohesion is how strongly the things in one part belong together. A part with high cohesion does one job, and all its code changes for the same kind of reason.

A test: describe the part in one sentence with no "and". "Calculates the price of an order" is cohesive. "Handles customers and sends emails and exports reports" is three parts in one box.

### Types of cohesion, from best to worst

The classic list comes from structured design, and Fundamentals uses it to judge components. The order goes from the strongest reason to be together to no reason at all.

| Type            | The parts are together because ...                       | Lunch shop example                                          |
| --------------- | -------------------------------------------------------- | ----------------------------------------------------------- |
| Functional      | Each part is necessary for one function                  | A module that calculates the price of one order             |
| Sequential      | The output of one part is the input of the next          | Read the basket, then apply discounts, then add the tax     |
| Communicational | The parts use the same data, but make different results  | Print the kitchen ticket and write the order log            |
| Procedural      | The parts must run in a fixed order, with no shared data | Open the till, then switch on the menu screen               |
| Temporal        | The parts run at the same time                           | A "start of day" module that clears caches and sends emails |
| Logical         | The parts are the same kind of thing, not the same job   | An "exports" module with menu, payroll, and stock exports   |
| Coincidental    | No reason                                                | A "utils" module                                            |

The first three are usually good. Procedural and temporal cohesion are acceptable in small, local code. Logical and coincidental cohesion are signs that the module must be split.

### LCOM, a structural measure

LCOM (lack of cohesion in methods) is a code metric from Chidamber and Kemerer. The idea: look at which methods of a class use which fields. If the methods split into groups that share no fields, the class is really two or more classes in one file.

A high LCOM value shows a structural problem. It cannot show a logical problem. A class can share fields well and still mix two business jobs. Use the metric to find places to look, and use your judgement to decide.

## Coupling

Coupling is how much one part depends on another. If a change in part A forces a change in part B, they are coupled.

| Type of coupling           | Example                                        | Strength    |
| -------------------------- | ---------------------------------------------- | ----------- |
| Shared database tables     | Two services read and write the same table     | Very strong |
| Shared code                | Two services use one library of business rules | Strong      |
| Direct call that waits     | A calls B and needs the answer to continue     | Medium      |
| Message that does not wait | A publishes an event, B reacts later           | Weak        |

Some coupling is necessary. A system with no coupling does nothing. The goal is to make coupling visible, deliberate, and as weak as the job permits.

### Afferent and efferent coupling

Two counts describe the coupling of one component:

- **Afferent coupling (Ca)**: the number of components that depend on this one. These are the incoming arrows.
- **Efferent coupling (Ce)**: the number of components that this one depends on. These are the outgoing arrows.

A component with high Ca is hard to change, because many parts break when it changes. A component with high Ce is fragile, because a change in many other parts can break it.

### Abstractness, instability, and the main sequence

Robert Martin defined three more numbers from these counts. Fundamentals uses them to judge a code base.

| Metric          | Formula                         | Meaning                                              |
| --------------- | ------------------------------- | ---------------------------------------------------- |
| Abstractness, A | Abstract types ÷ all types      | 0 is all concrete code, 1 is all interfaces          |
| Instability, I  | Ce ÷ (Ca + Ce)                  | 0 is very stable (many users), 1 is easy to change   |
| Distance, D     | The absolute value of A + I − 1 | 0 is on the main sequence, 1 is as far off as can be |

The main sequence is the ideal line where A + I = 1. A component on the line has a good balance: stable parts are abstract, and concrete parts are easy to change.

Two zones are far from the line:

- **The zone of pain**: concrete and stable. Many parts use the component, and it has no abstraction to protect them. Each change hurts. A shared database schema is often here.
- **The zone of uselessness**: abstract and unstable. The component has interfaces that nobody uses.

Tools calculate these numbers from the code. They help in a large code base, but they cannot judge the business job of a component.

## Connascence

Connascence is a more exact vocabulary for coupling, from Meilir Page-Jones. Two parts are connascent if a change in one forces a change in the other to keep the system correct. Fundamentals uses it to discuss coupling between components and services.

### Static connascence

Static connascence is visible in the source code.

| Type      | Both parts must agree on ...           | Ticket seller example                                          |
| --------- | -------------------------------------- | -------------------------------------------------------------- |
| Name      | The name of a thing                    | The caller uses the method name `reserveSeat`                  |
| Type      | The type of a value                    | Both sides treat the price as whole cents                      |
| Meaning   | What a value means (also "convention") | Status 3 means "refunded" in two places                        |
| Position  | The order of values                    | `book("Ana", 12, "B")`: which number is the seat?              |
| Algorithm | One algorithm                          | The box office and the gate scanner hash a ticket the same way |

### Dynamic connascence

Dynamic connascence is visible only when the system runs. It is stronger and harder to find.

| Type      | Both parts must agree on ...     | Ticket seller example                                          |
| --------- | -------------------------------- | -------------------------------------------------------------- |
| Execution | The order of calls               | Hold the seat before you take the payment                      |
| Timing    | When things occur                | Two buyers race for the last seat                              |
| Values    | Values that must change together | The seats sold in all zones must not be more than the hall has |
| Identity  | One shared instance              | Two components must use the same hold record                   |

The list goes from weak to strong. Connascence of name is the weakest, and an editor can rename for you. Connascence of identity is the strongest.

### Strength, locality, and degree

Three properties tell you how serious one case of connascence is:

- **Strength**: how hard it is to find and fix. A weaker type is better.
- **Locality**: how close the two parts are. Strong connascence inside one function is acceptable. The same type between two services is dangerous.
- **Degree**: how many parts are affected. A convention that two lines share is a small problem. The same convention in forty places is a large one.

Page-Jones gives two rules. Change strong forms into weaker forms: replace a magic number (meaning) with a named constant (name). As the distance between two parts grows, accept only weaker forms.

The practical result: keep strong connascence inside a module, and let only weak connascence cross its boundary.

### Deep modules

Ousterhout (A Philosophy of Software Design) adds a related test: a good module has a small interface and hides much work behind it. That is a different view of the same goal, and it has its own page: [Deep modules](/learn/deep-modules).

## Coupling between services

Newman (Building Microservices) names four types of coupling between services. The list goes from loose to tight.

| Type         | What it is                                                            | Parcel service example                                      |
| ------------ | --------------------------------------------------------------------- | ----------------------------------------------------------- |
| Domain       | One service needs a function that another service gives               | Booking asks Pricing for the price of a parcel              |
| Pass-through | A service sends data to another only because a third one needs it     | Booking sends the label format to Dispatch, only for Labels |
| Common       | Several services use the same data                                    | Booking and Dispatch both write to one "parcels" table      |
| Content      | One service changes the internal state of another, past its interface | Dispatch writes straight into the tables of Billing         |

Domain coupling is normal. Keep it small: one service that calls ten others is a sign of a bad boundary.

Pass-through coupling makes a change in the last service travel through the services in the middle.

```diagram
{
  "nodes": [
    { "id": "booking", "label": "Booking", "shape": "box", "col": 0, "row": 0 },
    { "id": "dispatch", "label": "Dispatch", "shape": "box", "col": 1, "row": 0 },
    { "id": "labels", "label": "Labels", "shape": "box", "col": 2, "row": 0 }
  ],
  "edges": [
    { "from": "booking", "to": "dispatch", "label": "parcel +\nlabel format" },
    { "from": "dispatch", "to": "labels", "label": "label format" }
  ]
}
```

When Labels needs a new field, Booking and Dispatch must both change. Fixes: Booking calls Labels directly, or Dispatch owns the label data, or Dispatch passes the data on without reading it.

Common coupling is risky when several services write the same data. Nobody owns the rules for it. Content coupling is the worst type: the other service has no boundary at all. See [Data ownership](/learn/data-ownership).

## Two kinds that people forget

- **Temporal coupling.** If A waits for B, then A is down when B is down: both must be up at the same time. Newman uses this name in Building Microservices. It is not the same as connascence of timing, which is about when code runs, for example a race between two threads. See [Synchronous and asynchronous communication](/learn/sync-async).
- **Deployment coupling.** If A and B must be released together, they are one deployment in practice, with the costs of two.

## How to measure it in practice

Look at the history of changes. If one business change usually touches one part, the structure is good. If each change touches five parts, the boundaries are in the wrong places. This is a better measure than any diagram.

Practical steps:

1. Take the last fifty changes from the version control history.
2. For each change, list the modules it touched.
3. Find the pairs of modules that change together often. This is called change coupling.
4. For each pair, decide: join the two modules, or move the shared rule into one of them.

Use the metrics on this page as a second source. A tool can show cycles between packages, components in the zone of pain, and classes with a high LCOM. You can add a fitness function that fails the build when a new cycle appears. See [Measuring characteristics](/learn/measuring-characteristics).

## The distributed monolith

The worst result is a system with many deployments that are strongly coupled: shared tables, chains of direct calls, releases that must occur together. It has the operating cost of [microservices](/learn/microservices) and the change cost of a monolith. It usually comes from a split by technical layer or by team habit, not by business area. See [How to find component boundaries](/learn/boundaries).

The signs:

- One feature needs a release of three services in a fixed order.
- Services share a database, or one service reads the tables of another (common or content coupling).
- A request goes through a long chain of calls that wait.
- Teams must meet to agree on each change to a shared library or schema.

The fix is not more services. Join the parts that change together, or move the boundaries to match the business areas. See [Decomposing a monolith](/learn/decomposing-a-monolith).

## In a kata

Use this page when you review your own diagram:

1. For each box, write its job in one sentence with no "and". If you cannot, split the box or rename it.
2. For each arrow, say the type of coupling: domain, pass-through, common, or content. Remove each content coupling.
3. Find each table that two boxes write. Give it one owner.
4. For each arrow that waits, ask if a message can do the job. That changes timing connascence into a weaker form.

In the [Tutor Marketplace](/kata/tutor-marketplace) kata, booking and payments share strong connascence of values: a lesson is booked only if it is paid. That is a reason to keep them in one part.

## Interview questions

**"How do you tell if two services are too tightly coupled?"**

- They must be released together, or in a fixed order.
- They share tables, or one reads the data of the other (common or content coupling).
- One business change usually touches both. The change history shows it.
- Name the fix: join them, or move the shared rule to one owner.

**"What is cohesion, and how do you measure it?"**

- Define it: how much the parts of a module belong together.
- Name the range: functional is best, coincidental is worst.
- LCOM measures structural cohesion only. It cannot see two business jobs that share fields.
- The practical measure: one business change touches one module.

**"What is connascence, and why is it useful?"**

- Two parts are connascent if a change in one forces a change in the other.
- Static types (name, type, meaning, position, algorithm) are in the code. Dynamic types (execution, timing, values, identity) appear only at run time.
- Judge each case by strength, locality, and degree.
- The rule: strong forms stay inside a module. Only weak forms cross a boundary.

**"A team has 30 microservices and each release is painful. What do you look for?"**

- Signs of a distributed monolith: shared database, call chains, releases in a fixed order.
- Pass-through coupling, where data travels through services that do not use it.
- Shared business libraries that force upgrades together.
- A plan: measure change coupling, then join or move boundaries. Do not add more services.

## Go deeper

- **Fundamentals of Software Architecture** (Richards, Ford), the part on modularity: types of cohesion, LCOM, the coupling metrics, the main sequence, and connascence.
- **A Philosophy of Software Design** (Ousterhout), the parts on deep modules and information hiding: why a small interface over much work reduces coupling.
- **Building Microservices** (Newman), the part on coupling and cohesion: domain, pass-through, common, and content coupling between services.
- **Software Architecture: The Hard Parts** (Ford and others), the parts on coupling and granularity: static and dynamic coupling between services.

## Further reading

- [Cohesion](<https://en.wikipedia.org/wiki/Cohesion_(computer_science)>) and [Coupling](<https://en.wikipedia.org/wiki/Coupling_(computer_programming)>) on Wikipedia
- [Connascence](https://en.wikipedia.org/wiki/Connascence), a more exact vocabulary for types of coupling
- [connascence.io](https://connascence.io/), a reference with an entry for each type
- [Software package metrics](https://en.wikipedia.org/wiki/Software_package_metrics) on Wikipedia: instability, abstractness, and distance
