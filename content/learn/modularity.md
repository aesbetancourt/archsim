## The question

How do you know if a system is divided into the right parts? Two measures answer most of it: cohesion and coupling. Good structure has high cohesion in each part and low coupling between the parts.

## Cohesion

Cohesion is how strongly the things in one part belong together. A part with high cohesion does one job, and all its code changes for the same kind of reason.

A test: describe the part in one sentence with no "and". "Calculates the price of an order" is cohesive. "Handles customers and sends emails and exports reports" is three parts in one box.

## Coupling

Coupling is how much one part depends on another. If a change in part A forces a change in part B, they are coupled.

| Type of coupling | Example | Strength |
|---|---|---|
| Shared database tables | Two services read and write the same table | Very strong |
| Shared code | Two services use one library of business rules | Strong |
| Direct call that waits | A calls B and needs the answer to continue | Medium |
| Message that does not wait | A publishes an event, B reacts later | Weak |

Some coupling is necessary. A system with no coupling does nothing. The goal is to make coupling visible, deliberate, and as weak as the job permits.

## Two kinds that people forget

- **Time coupling.** If A waits for B, then A is down when B is down. See [Synchronous and asynchronous communication](/learn/sync-async).
- **Deployment coupling.** If A and B must be released together, they are one deployment in practice, with the costs of two.

## How to measure it in practice

Look at the history of changes. If one business change usually touches one part, the structure is good. If each change touches five parts, the boundaries are in the wrong places. This is a better measure than any diagram.

## The distributed monolith

The worst result is a system with many deployments that are strongly coupled: shared tables, chains of direct calls, releases that must occur together. It has the operating cost of [microservices](/learn/microservices) and the change cost of a monolith. It usually comes from a split by technical layer or by team habit, not by business area. See [How to find component boundaries](/learn/boundaries).

## Further reading

- [Cohesion](https://en.wikipedia.org/wiki/Cohesion_(computer_science)) and [Coupling](https://en.wikipedia.org/wiki/Coupling_(computer_programming)) on Wikipedia
- [Connascence](https://en.wikipedia.org/wiki/Connascence), a more exact vocabulary for types of coupling
