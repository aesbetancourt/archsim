## The first structural decision

Before you select a [style](/learn/styles), decide one thing: is the system one deployment, or several that talk through a network? Layered, modular monolith, and microkernel are usually one deployment. Service-based, event-driven, microservices, and space-based are distributed.

A network call looks like a function call in the code. It is not one.

## What a network adds

A well-known list, the fallacies of distributed computing, names the wrong assumptions that developers make. The important ones for design:

| Wrong assumption | What is true | What the design must do |
|---|---|---|
| The network is reliable | Calls fail and time out | [Timeouts, retries](/learn/resilience), and safe repeats |
| There is no delay | Each call adds milliseconds | Few calls for each request, no long chains |
| The other part is there | Parts are down or slow at times | A plan for each dependency that fails |
| Data changes together | There is no shared transaction | [Sagas or an outbox](/learn/distributed-transactions) |
| One team operates it | Many parts need many deployments | Automation and [observability](/learn/observability) |

Inside one deployment, a call either works or the whole program has a fault. Across a network there is a third result: you do not know. The request can be lost, or the answer can be lost after the work was done. Most hard problems in distributed systems come from this third result.

## What you get in return

- Parts can scale separately, so the busy part gets more machines.
- A fault in one part does not have to stop the others.
- Teams can release separately.
- Parts can use different technology where there is a real need.

## How to decide

Distribute only when you can name the benefit you need and it is one of the four above. "It is more modern" is not on the list.

A common and safe path is to start with a [modular monolith](/learn/modular-monolith) that has clean [boundaries](/learn/boundaries), and to move a module out when one of the reasons becomes real. A move in the other direction, from many services back to one, is much more expensive.

## In a kata

Look at the team size and the numbers. A team of four with a few thousand users almost never needs a distributed design. If you select one, the review will ask what you get for the cost.

## Further reading

- [Fallacies of distributed computing](https://en.wikipedia.org/wiki/Fallacies_of_distributed_computing) on Wikipedia
- [Monolith first](https://martinfowler.com/bliki/MonolithFirst.html), by Martin Fowler
