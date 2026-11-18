## The first structural decision

Before you select a [style](/learn/styles), decide one thing: is the system one deployment, or several that talk through a network? Layered, modular monolith, and microkernel are usually one deployment. Service-based, event-driven, microservices, and space-based are distributed.

A network call looks like a function call in the code. It is not one.

Richards and Ford (Fundamentals of Software Architecture) put this choice first because it changes everything after it. A distributed design gets new powers, and it also gets a new class of problems. This page lists both, so that you can decide with open eyes.

The unit to count is not the number of boxes. It is the number of parts that you can deploy alone and that keep working alone. Fundamentals calls such a part an architecture quantum. See [Architecture quantum](/learn/architecture-quantum).

## What a network adds

A well-known list, the fallacies of distributed computing, names the wrong assumptions that developers make. L. Peter Deutsch and others at Sun Microsystems wrote the first seven in the 1990s. James Gosling added the eighth. Fundamentals uses all eight to explain the cost of a distributed style.

| Wrong assumption                | What is true                                             | What the design must do                                                 |
| ------------------------------- | -------------------------------------------------------- | ----------------------------------------------------------------------- |
| 1. The network is reliable      | Calls fail, time out, and arrive twice                   | [Timeouts, retries](/learn/resilience), and operations safe to repeat   |
| 2. Latency is zero              | Each call adds time, and the slow tail is much slower    | Few calls for each request, no long chains, know the p99 latency        |
| 3. Bandwidth is infinite        | Large messages fill the network under load               | Send only the fields the receiver needs                                 |
| 4. The network is secure        | Each open port and each call is a place to attack        | Authenticate and encrypt each call between services                     |
| 5. The topology does not change | Servers, addresses, and routes change all the time       | Service discovery, and no fixed addresses in the code                   |
| 6. There is one administrator   | Many teams and providers operate parts of the network    | Shared runbooks, and [observability](/learn/observability) across teams |
| 7. Transport cost is zero       | Each call costs money: hardware, gateways, cloud traffic | Count the cost of the calls in the budget                               |
| 8. The network is homogeneous   | Hardware, protocols, and providers differ                | Test across the real mix, and expect different failure behavior         |

Some notes on the fallacies that designers forget most:

- **Latency.** A call inside one data center takes, roughly, below a millisecond. A call between regions takes, roughly, tens to more than a hundred milliseconds. A chain of ten calls multiplies the slow tail, not the average. See [Estimation](/learn/estimation).
- **Bandwidth.** Fundamentals uses the term stamp coupling for this problem. A ticket seller sends the full event record of 200 fields to a service that needs only the event name. Under load, the waste fills the network.
- **Topology.** A network engineer changes a route on a Tuesday night. A timeout that was safe yesterday is now too short. The architect must talk with the people who operate the network.

Inside one deployment, a call either works or the whole program has a fault. Across a network there is a third result: you do not know. The request can be lost, or the answer can be lost after the work was done. Most hard problems in distributed systems come from this third result.

### More wrong assumptions

Richards and Ford add more assumptions in the same spirit:

- **Versioning is easy.** Each contract between services will change, and old and new versions must work at the same time.
- **Compensating updates always work.** An action that undoes an earlier step can also fail. Then the data is wrong, and a person must fix it.
- **Observability is optional.** Without logs, metrics, and traces across services, nobody can find the cause of a failure.

## Partial failure

Kleppmann (Designing Data-Intensive Applications) names the central problem: partial failure. In one computer, a fault usually stops the whole program. In a distributed system, some parts fail while others continue. The failures are also not predictable: the same call works now and fails a second later.

Take a ticket seller that calls a payment provider. The seller waits, and no answer comes. The cause can be any of these:

1. The request was lost on the network.
2. The request waits in a queue because the provider is overloaded.
3. The provider crashed before it did the work.
4. The provider did the work, and then crashed before it answered.
5. The provider is paused for a short time, for example by garbage collection.
6. The answer was lost or delayed on the way back.

```diagram
{
  "nodes": [
    { "id": "seller", "label": "Ticket seller", "shape": "box", "col": 0, "row": 0 },
    { "id": "net", "label": "Network", "shape": "pipe", "col": 1, "row": 0 },
    { "id": "pay", "label": "Payment\nprovider", "shape": "external", "col": 2, "row": 0 }
  ],
  "edges": [
    { "from": "seller", "to": "net", "label": "charge\n(lost? late?)" },
    { "from": "net", "to": "pay", "label": "done?\ncrashed? paused?" },
    { "from": "pay", "to": "seller", "label": "answer (lost? late?)", "async": true }
  ]
}
```

The seller cannot tell these cases apart. It knows only that no answer came in time. The only tool is a timeout, and no timeout is correct. A short timeout declares a slow part dead, and a retry can charge the card twice. A long timeout makes users wait for a part that is really down.

What a design does about it:

- Make each operation safe to repeat, with an idempotency key. Then a retry after case 4 does no harm. See [Distributed transactions](/learn/distributed-transactions#idempotency).
- Select timeouts from measured latency, not from a guess.
- Do not trust the clock of another machine to order events.
- Let a group decide, not one node. A node can be wrong about its own state, for example when it is paused.

The details of unreliable networks, clocks, and process pauses have their own page: [Clocks and failures](/learn/clocks-and-failures). For how a group of nodes agrees in spite of them, see [Consensus](/learn/consensus).

## Distributed logging

In one deployment, the log of a request is in one file, in order. In a distributed system, one user action writes lines in ten logs on ten machines. Each machine has its own clock.

Fundamentals lists this as a cost of distribution. A design must answer it from the start:

1. Give each request a correlation ID at the edge, and pass it on each call and message.
2. Send all logs to one central store, where you can search by that ID.
3. Use one log format across all services, so that a tool can read them.
4. Add traces, which record the time of each step of a request across services.

Without these, the cause of a failure is a guess. See [Observability](/learn/observability).

## Distributed transactions

In one database, a transaction changes several rows, and all changes succeed or none do. Across services, each service has its own data, and no shared transaction covers them.

Fundamentals notes that distributed styles depend on eventual consistency. The data in different services is different for a short time, and becomes the same later. The common tools:

| Tool             | What it does                                                       |
| ---------------- | ------------------------------------------------------------------ |
| Saga             | A sequence of local transactions, with a step that undoes each one |
| Outbox           | Writes the change and the message in one local transaction         |
| Two-phase commit | A coordinator makes all parties commit or abort together           |

Two-phase commit is rare between services. It locks data while it waits, and the coordinator is a single point of failure. A saga is the usual choice, and its undo steps can fail too. See [Distributed transactions](/learn/distributed-transactions) and [Consistency](/learn/consistency).

The simplest answer is often a boundary change. If two pieces of data must always change together, keep them in one service.

## Contract maintenance

A contract is the agreement between two services: the operations, the fields, their types, and their meaning. In one deployment, the compiler checks it. Between services, nothing checks it until a call fails in production.

Fundamentals names contract maintenance and versioning as a cost of distribution. Each contract change needs:

- A version, so that old and new callers work at the same time.
- A plan to retire the old version, with a date.
- Communication with each team that calls the service.

Rules that reduce the cost:

- Add fields. Do not rename or remove them.
- Let receivers ignore fields that they do not know.
- Use consumer-driven contract tests: each caller writes a test of what it needs, and the provider runs those tests before each release.

See [Encoding and evolution](/learn/encoding-and-evolution) and [API design](/learn/api-design).

## What you get in return

- Parts can scale separately, so the busy part gets more machines.
- A fault in one part does not have to stop the others.
- Teams can release separately.
- Parts can use different technology where there is a real need.

Each benefit has a condition. Separate scale works only if the busy part does not wait on the others. Fault isolation works only with timeouts, fallbacks, and [bulkheads](/learn/resilience). Separate releases work only if the contracts are stable and the data is not shared. Without these conditions, you pay the costs above and get no benefit.

How small each service must be is a separate question. See [Service granularity](/learn/service-granularity).

## When not to distribute

Newman (Building Microservices) is a strong supporter of microservices, and he still names cases where they are a bad idea:

| Situation                       | Why distribution hurts                                            |
| ------------------------------- | ----------------------------------------------------------------- |
| The domain is not clear         | Wrong boundaries are much more expensive to move across a network |
| A new product or a startup      | The product changes fast, so the boundaries change fast too       |
| Software that customers install | The customer must operate many parts, and usually cannot          |
| No clear reason                 | The team pays the costs and cannot name the benefit               |

Newman's advice: start from the outcome you need, for example separate releases for one team. Then ask if a simpler change gives that outcome. Distribution is a tool, not a goal.

## How to decide

Distribute only when you can name the benefit you need and it is one of the four above. "It is more modern" is not on the list.

A common and safe path is to start with a [modular monolith](/learn/modular-monolith) that has clean [boundaries](/learn/boundaries), and to move a module out when one of the reasons becomes real. A move in the other direction, from many services back to one, is much more expensive.

A short procedure:

1. Name the benefit, and the part of the system that needs it.
2. Check that the costs are acceptable: logging, transactions, contracts, operations.
3. Check the conditions: no shared data, stable contracts, few calls that wait.
4. Move out that one part. Keep the rest together.
5. Measure the result before you move the next part.

See [Decomposing a monolith](/learn/decomposing-a-monolith) for the patterns.

## In a kata

Look at the team size and the numbers. A team of four with a few thousand users almost never needs a distributed design. If you select one, the review will ask what you get for the cost.

In the rationale, write the benefit and the cost in one pair of sentences. For example, in the [Front Row](/kata/front-row) kata: "Seat sales scale apart from the rest, because sales open at fixed times. The cost is a saga between sales and payment." For each arrow between deployments, say what occurs when no answer comes.

## Interview questions

**"Name the fallacies of distributed computing. Which ones matter most in practice?"**

- The eight: reliable network, zero latency, infinite bandwidth, secure network, fixed topology, one administrator, zero transport cost, homogeneous network.
- Reliability and latency drive most design choices: timeouts, retries, few calls.
- Bandwidth shows up as large messages under load.
- Topology and administrators show up in operations, often as an outage.

**"A call to another service times out. What do you know?"**

- Nothing for sure. The request or the answer can be lost, or the other side can be slow or paused.
- The work can be done already, so a retry can repeat it.
- Make the operation safe to repeat, with an idempotency key.
- Select the timeout from measured latency.

**"When are microservices a bad idea?"**

- The domain is not clear, so the boundaries will move.
- A new product that changes fast.
- Software that customers must install and operate.
- No named benefit that a modular monolith cannot give.

**"How do you keep data consistent across services?"**

- There is no shared transaction. Accept eventual consistency where the business can.
- Use a saga with undo steps, and the outbox for reliable messages.
- Keep data that must always change together in one service.
- Plan for an undo step that fails.

**"What does a distributed design cost that a monolith does not?"**

- Network failures, latency, and partial failure.
- Distributed logging and tracing to find faults.
- Transactions across services become sagas.
- Contracts between teams need versions and tests.
- More to deploy, monitor, and secure.

## Go deeper

- **Fundamentals of Software Architecture** (Richards, Ford), the part on the foundations of styles: the fallacies of distributed computing, distributed logging, distributed transactions, and contract maintenance.
- **Designing Data-Intensive Applications** (Kleppmann), the part on the trouble with distributed systems: partial failure, unreliable networks, unreliable clocks, and process pauses.
- **Building Microservices** (Newman), the first part: the benefits and costs of microservices, and when they are a bad idea.
- **Software Architecture: The Hard Parts** (Ford and others), the parts on the architecture quantum and on distributed transactions and sagas.
- **Release It!** (Nygard), the parts on integration points and stability patterns: what a network call does to a system in production.

## Further reading

- [Fallacies of distributed computing](https://en.wikipedia.org/wiki/Fallacies_of_distributed_computing) on Wikipedia
- [Monolith first](https://martinfowler.com/bliki/MonolithFirst.html), by Martin Fowler
- [Microservice premium](https://martinfowler.com/bliki/MicroservicePremium.html), by Martin Fowler
- [Consumer-driven contracts](https://martinfowler.com/articles/consumerDrivenContracts.html), by Ian Robinson, on martinfowler.com
