## Where the style comes from

James Lewis and Martin Fowler described the style and made it widely known in 2014. The name was already in use among architects from about 2011. Richards and Ford trace its main idea to domain-driven design (Fundamentals of Software Architecture, the part on microservices architecture). The unit of the style is the **bounded context**: a part of the domain where one model and one language apply. Each service models one bounded context, or one part of one. See [Bounded contexts](/learn/bounded-contexts).

A service contains all that it needs to work: its code, its data, and its dependencies. It runs in its own process, usually in a container. This gives the property that Newman puts first (Building Microservices, the part on what microservices are): **independent deployability**. A team can change and release one service with no change to any other service.

From this, two rules follow:

1. **Prefer duplication to coupling.** Two services can each have their own "tutor" class. A shared class couples their releases. Richards and Ford present this as the opposite of the usual push for reuse.
2. **Hide the internals.** A service shows a small interface. Its database, its classes, and its libraries stay private.

## Granularity

Size is the hardest decision in the style. Too large, and a service holds several jobs with different needs. Too small, and one request crosses many services. Richards and Ford give three guidelines to find the boundaries:

| Guideline    | The question                                         | Example in a tutor marketplace                                  |
| ------------ | ---------------------------------------------------- | --------------------------------------------------------------- |
| Purpose      | Is the service one cohesive business job?            | Booking is one job. Booking plus reviews is two                 |
| Transactions | Must these parts change data in one atomic step?     | "Reserve the slot" and "record the booking" belong together     |
| Choreography | Do these services call each other for most requests? | If search calls profiles for each result, the boundary is wrong |

The second and third guidelines push services together. A boundary that breaks a needed transaction, or that makes two services talk all the time, is a sign of a service that is too small. For the full set of forces, see [Service granularity](/learn/service-granularity).

A common mistake is to treat "micro" as the goal. The name describes the result, not the target size. Newman advises to start with fewer, larger services, and to split when a real force appears.

## Data isolation

Each service owns its data. No other service reads or writes the tables of that service. This is the rule that most designs break first, and the one that gives most of the benefit.

- **Each service selects its own store.** The search service uses a search index. The booking service uses a relational database. The lesson-chat service uses a document store. See [Data stores](/learn/data-stores).
- **There is no shared table that is the single source of truth for all.** Each service keeps the data it needs, in the form it needs.
- **Other services get the data through the API or through events.** A service that needs tutor names keeps its own copy and updates it from "tutor profile changed" events.

This is what makes each service its own [architecture quantum](/learn/architecture-quantum). It is also the source of the hardest problems: copies that are briefly out of date, and changes across several services. See [Data ownership](/learn/data-ownership) for how to split the data and keep copies in step.

## The API layer

Most designs put an API layer between the clients and the services. It is usually an [API gateway](/learn/api-design#the-api-gateway). It gives one address, checks identity, applies limits, and routes each request to the correct service.

Richards and Ford give one strong warning: **do not use the API layer as a mediator or an orchestrator.** If the gateway combines the results of several services with business rules, it becomes a shared part that each team must change. The business logic of a flow belongs in a service. A [backend for frontend](/learn/api-design#the-api-gateway) for each client type is a common way to shape data for screens without business rules in the shared gateway.

## Operational reuse: the sidecar and the service mesh

Duplication of business code is acceptable. Duplication of operational code is not. Each service needs the same things: logs, metrics, traces, timeouts, retries, circuit breakers, and secure connections. If each team writes these, the results differ, and a change to the logging format needs a change in each service.

The **sidecar** pattern solves this. A sidecar is a separate process that runs next to each service, in the same host or pod. It handles the operational concerns. The service talks to the network through its sidecar. A platform team owns the sidecar and updates it for all services at once.

```diagram
{
  "nodes": [
    { "id": "book", "label": "Booking\nservice", "shape": "box", "col": 0, "row": 0 },
    { "id": "s1", "label": "Sidecar\n(TLS, retries, metrics)", "shape": "module", "col": 1, "row": 0 },
    { "id": "s2", "label": "Sidecar\n(TLS, retries, metrics)", "shape": "module", "col": 2, "row": 0 },
    { "id": "pay", "label": "Payment\nservice", "shape": "box", "col": 3, "row": 0 },
    { "id": "ctrl", "label": "Mesh control plane\n(policy, certificates)", "shape": "box", "col": 1.5, "row": 1.4 },
    { "id": "obs", "label": "Metrics and traces", "shape": "store", "col": 1.5, "row": 2.6 }
  ],
  "groups": [
    { "id": "pod1", "label": "One pod", "col": 0, "row": 0, "cols": 2, "rows": 1 },
    { "id": "pod2", "label": "One pod", "col": 2, "row": 0, "cols": 2, "rows": 1 }
  ],
  "edges": [
    { "from": "book", "to": "s1" },
    { "from": "s1", "to": "s2", "label": "call" },
    { "from": "s2", "to": "pay" },
    { "from": "ctrl", "to": "s1", "label": "config" },
    { "from": "ctrl", "to": "s2", "label": "config" },
    { "from": "s1", "to": "obs", "async": true },
    { "from": "s2", "to": "obs", "async": true }
  ]
}
```

When all sidecars connect and share one control plane, the result is a **service mesh**. Istio and Linkerd are common examples. The mesh gives one place to set policy for all calls: which service can call which, the timeout for each call, and how to collect the metrics.

The cost is one more complex part to operate. A mesh is useful at dozens of services. At five services, a shared library and good defaults are usually enough. Hard Parts compares the options for reuse: copy the code, a shared library, a shared service, or a sidecar (Software Architecture: The Hard Parts, the part on reuse patterns). A sidecar fits operational concerns. It is a poor fit for business rules.

## Frontends

A microservices back end does not need a microservices front end. Richards and Ford describe two options:

| Frontend        | How it works                                                                   | Gain                                      | Cost                                            |
| --------------- | ------------------------------------------------------------------------------ | ----------------------------------------- | ----------------------------------------------- |
| Monolithic UI   | One web or mobile application calls the services through the API layer         | Simple, consistent, one team              | Each feature needs a front-end release          |
| Micro-frontends | The page is made of parts. Each part comes from the team that owns the service | Each team releases its feature end to end | Harder to keep a consistent look and fast pages |

Micro-frontends suit an organization where each team owns a full feature, from the screen to the data. For a small team, a monolithic UI is simpler. See [Micro frontends](https://martinfowler.com/articles/micro-frontends.html) by Cam Jackson.

## Communication

Services talk in two ways. A **synchronous** call waits for an answer, usually over HTTP or gRPC. An **asynchronous** message does not wait, usually through a broker. Most systems use both. See [Synchronous and asynchronous communication](/learn/sync-async).

Richards and Ford use the term **protocol-aware heterogeneous interoperability**. Each caller must know the protocol of the service it calls. Each service can be built in a different language or framework.

### Choreography or orchestration

When a business flow crosses several services, someone must coordinate it.

- **Choreography.** Each service reacts to the events of the others. No service is in charge. This is like the broker topology of [event-driven architecture](/learn/event-driven#broker-topology).
- **Orchestration.** One service coordinates the flow. It calls each service in order and handles the errors. This is like the mediator topology.

| Choreography                               | Orchestration                                        |
| ------------------------------------------ | ---------------------------------------------------- |
| No central part, so less coupling          | The orchestrator is coupled to each service it calls |
| The full flow is not in one place          | The full flow is in one place, easy to read          |
| Error handling is spread over the services | Error handling is in one place                       |
| Scales well for simple flows               | Fits complex flows with many error paths             |

With choreography, a common problem appears. The business asks "what is the state of this booking?", and no service knows. One fix: make the first service of the flow track the state, as a **front controller**. It then has two jobs, its own and the coordination. Richards and Ford present this as a compromise with its own costs.

Orchestration does not mean one central orchestrator for the full system. Use one orchestrator for each flow, owned by the team that owns the flow.

## Transactions and sagas

Richards and Ford give strong advice: do not make transactions across services. If two services need one transaction, the granularity is usually wrong. Join them.

When a flow must cross services and the business needs it to finish as a whole, use a **saga**: a sequence of local transactions with a compensation for each step. A saga is not an ACID transaction. Other users can see the half-done state. See [Distributed transactions](/learn/distributed-transactions#saga) for the patterns, and [Sagas in practice](/learn/distributed-transactions#sagas-in-practice) for the failure modes.

Treat a saga as an exception that needs a reason, not as the normal way to change data.

## How the style handles each characteristic

| Characteristic  | How the style handles it                                                                        |
| --------------- | ----------------------------------------------------------------------------------------------- |
| Deployability   | Very good. Each service releases alone, if the contracts are stable                             |
| Scalability     | Very good. Each service scales for its own load                                                 |
| Elasticity      | Very good. Small services start fast and scale out in small steps                               |
| Fault tolerance | Good, with timeouts, circuit breakers, and bulkheads. Without them, failures spread along calls |
| Evolvability    | Very good. A service can be rewritten behind its contract                                       |
| Performance     | A weak point. Each hop adds network time, serialization, and an identity check                  |
| Simplicity      | Weak. Many parts, contracts, pipelines, and dashboards                                          |
| Cost            | High. Each service needs a pipeline, monitoring, on-call, and infrastructure                    |

Performance needs care. A request that crosses five services in a chain pays five network delays and five chances to fail. Keep chains short, cache data that other services own, and prefer events for work that the user does not wait for. See [The cost of a chain of calls](/learn/sync-async#the-cost-of-a-chain-of-calls).

## What the style requires

Newman and Richards and Ford agree that the style is not possible without a base of tools and practices:

1. **Automated deployment** for each service, with its own pipeline. See [Deployment](/learn/deployment).
2. **Monitoring, logs with correlation IDs, and distributed traces.** See [Observability](/learn/observability).
3. **Service discovery**, so that callers find the instances that scale up and down.
4. **Contract tests**, so that a team knows when a change breaks a caller.
5. **Teams that own services from code to production.** See [Team topologies](/learn/team-topologies).

Fowler names three of these as microservice prerequisites: fast provisioning of servers, basic monitoring, and fast deployment. Without them, the style gives its costs and few of its benefits.

## When to avoid it

Newman is clear that microservices are not a default (Building Microservices, the part on when not to use microservices). Avoid the style in these cases:

- **The domain is not clear.** Boundaries drawn too early are expensive to move. A new product often changes its model each month.
- **The team is small.** Each service adds operating work. Four developers cannot run thirty services well.
- **Most business requests need ACID transactions** across what would be several services.
- **The product is installed and run by customers.** They cannot operate a mesh of services.
- **There is no named reason.** "Everybody uses microservices" is not a force.

A [modular monolith](/learn/modular-monolith) or a [service-based](/learn/service-based) design gives clear boundaries with much less cost. Either can move to microservices later, one service at a time. See [Decomposing a monolith](/learn/decomposing-a-monolith).

## Common mistakes

- **A distributed monolith.** Services that must deploy together, or that share one database. You pay the costs of distribution and keep the coupling.
- **A split by entity.** One service for each table gives long call chains and many sagas.
- **Business rules in the gateway or in a shared library.** Each change needs many teams.
- **A synchronous chain for each request.** One slow service makes all callers slow.
- **No contract discipline.** A changed field breaks callers in production.

## How it fails

- **A cascading failure.** One slow service holds the threads of its callers, and the failure moves back along the chain. Use timeouts, circuit breakers, and bulkheads. See [Design for failure](/learn/resilience).
- **Retry storms.** Each layer retries, and a small fault becomes a large overload.
- **Data copies drift.** An event is lost, and one service shows an old tutor name for weeks. Use an outbox, and reconcile the copies at times.
- **A failure that no one can trace.** A request crosses ten services with no correlation ID.

## In a kata

- In [Tutor Marketplace](/kata/tutor-marketplace), the recommendation engine has a different load, a different change rate, and a different team. It is a good candidate for its own service. Booking and payment share a transaction, so a strong answer keeps them close or names the saga.
- In [Front Row](/kata/front-row), seat holds and payments have very different load from the promoter tools. Split them, and give each its own data.
- In [Lunch Rush](/kata/lunch-rush), a team of four is a strong reason against microservices. Say so, and name the signal that would change the decision.

For each service, name its bounded context, its data, and the force that made it separate.

## Interview questions

**"How do you decide the boundaries of your microservices?"**

- Start from bounded contexts and business capabilities, not from entities or layers.
- Check each boundary against transactions and communication: a needed transaction or constant calls mean the boundary is wrong.
- Start coarse, and split when a real force appears.

**"Why can two services not share a database?"**

- A shared table couples their releases and their availability.
- They become one quantum, so they cannot scale or fail independently.
- Each service must own its data and expose it through an API or events.

**"A business flow crosses four services. How do you coordinate it?"**

- Choreography for short, stable flows where throughput matters.
- Orchestration for complex flows with many error paths, one orchestrator for each flow.
- A saga with compensations if the flow must finish as a whole. Make the middle state visible.

**"What does a service mesh give you, and when is it too much?"**

- Sidecars for timeouts, retries, TLS, and metrics, owned by a platform team.
- One control plane for policy across all calls.
- Too much for a handful of services: a shared library and defaults are enough.

**"When would you advise a team not to use microservices?"**

- Small team, unclear domain, strong transaction needs, or software that customers install.
- Recommend a modular monolith or service-based design, with a path to split later.

## Go deeper

- **Fundamentals of Software Architecture** (Richards, Ford), the part on microservices architecture: bounded contexts, granularity guidelines, the sidecar, frontends, choreography, and orchestration.
- **Building Microservices** (Newman), the parts on modeling services, communication, and when not to use microservices: independent deployability as the goal.
- **Software Architecture: The Hard Parts** (Ford, Richards, Sadalage, Dehghani), the parts on granularity, data ownership, reuse patterns, and sagas.
- **Designing Data-Intensive Applications** (Kleppmann), the parts on dataflow and on derived data: how services keep their copies of data correct.
- **Team Topologies** (Skelton, Pais), the parts on stream-aligned teams and platform teams: who owns each service and the sidecar.

## Further reading

- [Microservices](https://martinfowler.com/articles/microservices.html), by James Lewis and Martin Fowler
- [Microservice prerequisites](https://martinfowler.com/bliki/MicroservicePrerequisites.html), by Martin Fowler
- [Monolith first](https://martinfowler.com/bliki/MonolithFirst.html), by Martin Fowler
- [Microservice architecture](https://microservices.io/patterns/microservices.html) on microservices.io
- [Service mesh](https://en.wikipedia.org/wiki/Service_mesh) on Wikipedia
