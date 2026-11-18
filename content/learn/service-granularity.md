## The question

When you design with services, each service has a size. Too large, and one service holds several business jobs with different needs. Too small, and a simple request crosses five network calls and a change touches six repositories.

There is no correct size in lines of code. The Hard Parts (Ford, Richards, Sadalage, Dehghani) gives a better approach. A set of forces pushes a service to split, and another set pushes services to stay together. The architect names the forces that apply, weighs them against the business goals, and decides.

Two terms are easy to mix up:

- **Modularity** is how a system is divided into parts. See [Modularity, cohesion, and coupling](/learn/modularity).
- **Granularity** is the size of each part. This page is about granularity.

A system can be modular and still have the wrong granularity. Twenty clean services that must always change together are modular but too fine.

This page gives the full set of forces. [How to find component boundaries](/learn/boundaries#how-large-must-a-part-be) gives the short version for a kata.

## How to measure size

"Size" needs a measure. Two simple measures are common:

- **The number of statements** in the service. This is more stable than lines of code, because it does not depend on the format of the code.
- **The number of public operations**: the endpoints or message types that the service handles. This shows how many jobs the service does.

Neither number decides anything alone. A service with 200 operations is a reason to look closely. A service with one operation can be correct, if that operation has a very different need from its neighbors.

## Disintegrators: forces that split a service

The Hard Parts names six granularity disintegrators. Each one is a reason to split a service into smaller ones.

### Service scope and function

Does the service do one cohesive job? A service named "Customer" that handles sign-up, loyalty points, support tickets, and marketing email does four jobs. Each one changes for a different reason.

This force alone is weak. "It is too big" is an opinion. Use it to find candidates, then check them against the other forces. A service with a clear single job does not need a split only because it is large.

### Code volatility

Does one part of the service change much more often than the rest? In a parcel service, the pricing rules change each week for new promotions. The label format changes once a year. If both are in one service, each pricing change means a release and a full test of label code that did not change.

Split the volatile part. The stable part then has fewer releases and less risk.

### Scalability and throughput

Does one part get much more load than the rest? In the ticket seller, the seat map gets millions of reads during an on-sale. The promoter reports get a few hundred. If they are one service, each new copy for the seat map also carries the report code and its memory.

Split the part with the different load, so that it scales alone.

### Fault tolerance

Can one part crash or run out of memory and stop the rest? In the lunch shop, the PDF receipt generator uses much memory and fails at times. If it is in the order service, a failure in it stops new orders.

Split the part that fails often, or the part that must stay up when the others fail. This is the same reasoning as a [bulkhead](/learn/resilience).

### Security

Does one part handle data that needs stronger protection? In the tutor marketplace, the payout service holds the bank details of tutors. The profile service holds names and photos. In one service, each developer with access to the profile code also has access to the bank data path.

Split the sensitive part. It can then have its own access rules, its own network limits, and its own audit.

### Extensibility

Will the business add more variants of one function? The parcel service supports three carriers today and plans ten. If each carrier is a separate service behind one interface, a new carrier is a new deployment with no change to the others.

Split only when the plan is real. A split for an extension that never comes is cost with no value.

## Integrators: forces that keep services together

The Hard Parts names four granularity integrators. Each one is a reason to keep functions in one service, or to join services again.

### Database transactions

Must two functions change data in one atomic step? In the ticket seller, "hold the seat" and "record the payment" must succeed or fail together. In one service, a database transaction does this. In two services, you need a [saga](/learn/distributed-transactions) with compensation, and buyers can see a state in the middle.

If the business cannot accept that middle state, keep the functions together.

### Workflow and choreography

Do the services call each other all the time to complete one request? If the order service calls pricing, then stock, then pricing again, each request pays the network cost three times. Each call is also a new place for a timeout and a partial failure.

Many calls for each request is a sign of services that are too small. Join them, or move the boundary so that one service has all it needs. See [Synchronous and asynchronous communication](/learn/sync-async).

### Shared code

Do several services share a library with business rules? If a change to the rule for "valid parcel weight" needs a new release of five services, the five are coupled through the code. A library for a technical job, such as logging, is not a problem. A library that holds business rules that change often is a strong reason to join the services that use it.

### Data relationships

Do the functions use the same data, with strong relationships between the tables? If the order and the order lines live in separate services, each read of an order needs two calls and a join in code. If one service must read the data of another for most of its work, the data split is wrong.

This force is closely tied to the database split. See [Data ownership](/learn/data-ownership) for how to decide who owns each table.

## The forces at a glance

| Force                      | Direction | The question to ask                                            | Lunch shop example                                |
| -------------------------- | --------- | -------------------------------------------------------------- | ------------------------------------------------- |
| Service scope and function | Split     | Does the service do more than one business job?                | Orders, menus, and loyalty in one service         |
| Code volatility            | Split     | Does one part change much more often?                          | Menu specials change daily, payment code yearly   |
| Scalability and throughput | Split     | Does one part get a much higher or different load?             | Menu reads at noon are 50 times the order writes  |
| Fault tolerance            | Split     | Can one part stop the others when it fails?                    | Receipt PDF generator runs out of memory          |
| Security                   | Split     | Does one part need stronger protection?                        | Card data for online payment                      |
| Extensibility              | Split     | Will the business add more variants of one function?           | Delivery partners next year, one adapter for each |
| Database transactions      | Join      | Must two functions change data in one atomic step?             | Place the order and reserve the pickup slot       |
| Workflow and choreography  | Join      | Do the services call each other for most requests?             | Orders calls Prices for each line of each order   |
| Shared code                | Join      | Do the services share business rules that change together?     | One rule for opening hours in four services       |
| Data relationships         | Join      | Do the functions read and write the same tightly related data? | Order and order lines in separate services        |

## How to balance the forces

The forces conflict. Security says to split payments from orders. Database transactions say to keep them together. The answer comes from the business, not from the forces.

1. **List the candidate split.** For example: "Move payments out of the order service."
2. **Name each force that applies, and its direction.** Write them in two columns: split and join.
3. **Turn each force into a business result.** "Security" becomes "card data in a smaller scope, so the audit for card data covers one service". "Transactions" becomes "no order with a payment but no slot".
4. **Ask the business which result matters more now.** A product owner can choose between "faster audit" and "simpler order flow". A product owner cannot choose between "disintegrator" and "integrator".
5. **Decide, and record it** in an [architecture decision record](/learn/decision-records), with the forces on each side.
6. **Name the signal that changes the decision.** "If we add a second payment provider, we split payments."

Ford and his co-authors stress that granularity is a trade-off. Neither side wins in general. A good decision names what it gives up.

## Newman on size

Newman (Building Microservices) treats size as a less useful question than most teams think. The goal of a microservice is independent deployability: a team can change and release it with no change to other services. Size matters only through that goal.

Points from his discussion:

- **Model services around business domains.** A service that matches a business capability has a clear boundary and a clear owner. See [Bounded contexts](/learn/bounded-contexts).
- **Hide information.** A service with a small interface over its internals can change those internals freely. A large interface couples it to each caller.
- **Count how many services you can operate.** Each service needs a pipeline, monitoring, on-call, and contracts. The right number depends on the maturity of the team and its automation, not only on the domain.
- **Start with fewer, larger services.** Splitting a service later is easier than joining two services that grew apart. Split when a real force appears.

A rough guide that many teams use: one team owns a few services. If each developer owns several services, the services are probably too small. This is a rule of thumb, not a law.

## The problems of nano-services

A nano-service is a service so small that its costs are larger than its value. The term is common in the field for this anti-pattern. Typical examples are one service for each database table, or one service for each function.

The costs that a small service does not reduce:

- **Network calls.** Each call adds latency and a new way to fail.
- **Distributed transactions.** A write that was one transaction becomes a saga.
- **Operations.** Each service has its own pipeline, alerts, logs, and dependency updates.
- **Change cost.** One business change needs changes and releases in several services, often in a fixed order.
- **Understanding.** A new developer must read ten services to follow one request.

The signs of nano-services:

1. Most requests go through a chain of three or more synchronous calls.
2. Several services always deploy together.
3. A service has no data of its own, or only one small table.
4. Several services share a business library that changes often.

The fix is to join them. Group the nano-services along the integrators: the ones that share transactions, data, or a workflow. Joining services is a normal correction, not a defeat.

## Failure modes

- **A split by technical layer.** "API service", "logic service", "data service" is a distributed layered monolith. Each feature touches all three.
- **A split by noun.** One service for each entity (customer, order, product) usually gives many calls and many sagas. Split by business capability instead.
- **A split with no named force.** "Microservices must be small" is not a reason. Each split must name at least one disintegrator.
- **Ignoring the integrators.** A split that breaks a needed transaction gives data errors in production.
- **A decision that never changes.** The forces change as the business grows. Look at the granularity again when the load, the team, or the domain changes.

## In a kata

For each service in your design:

1. Name its one business job.
2. For each split you made, name the disintegrator that caused it.
3. For each pair of services that you kept together, name the integrator.

In [Tutor Marketplace](/kata/tutor-marketplace), a strong answer keeps booking and payment together for the database transaction, and splits the recommendation engine for scalability and code volatility. In [Lunch Rush](/kata/lunch-rush), a team of four is a strong reason for few services: the operations cost of each service falls on the same four people.

See also [Architecture quanta](/learn/architecture-quantum): a split that does not create a separate quantum gives few of the benefits.

## Interview questions

**"How do you decide how large a service must be?"**

- No fixed size. Name the forces.
- Disintegrators: scope, code volatility, scalability, fault tolerance, security, extensibility.
- Integrators: database transactions, workflow, shared code, data relationships.
- Turn each force into a business result, and let the business choose the priority.

**"Your team split a system into 60 services, and each feature is slow to ship. What do you do?"**

- Look for signs of nano-services: call chains, services that deploy together, shared business libraries.
- Find the change coupling in the version history.
- Join services along the integrators. Keep the splits that have a clear disintegrator.
- Measure lead time before and after.

**"When would you keep two functions in one service even though they are different business jobs?"**

- When they must change data in one atomic step, and a saga's middle state is not acceptable.
- When they call each other on almost every request.
- When the team is small and the operations cost of one more service is high.

**"Do you give each entity its own service?"**

- No. A service for each entity gives many calls and distributed transactions.
- Split by business capability. An entity can appear in several services, each with its own view of it.

## Go deeper

- **Software Architecture: The Hard Parts** (Ford, Richards, Sadalage, Dehghani), the part on service granularity: the full set of disintegrators and integrators, and how to discuss them with the business.
- **Building Microservices** (Newman), the parts on modeling services and on size: independent deployability, information hiding, and why size is a weak guide.
- **Domain-Driven Design** (Evans), the part on bounded contexts: where a model starts and stops, which is a natural service boundary.
- **Team Topologies** (Skelton, Pais), the part on cognitive load: how many services one team can own.

## Further reading

- [Decompose by business capability](https://microservices.io/patterns/decomposition/decompose-by-business-capability.html) on microservices.io
- [Microservice prerequisites](https://martinfowler.com/bliki/MicroservicePrerequisites.html), by Martin Fowler
- [Microservices](https://martinfowler.com/articles/microservices.html), by James Lewis and Martin Fowler
