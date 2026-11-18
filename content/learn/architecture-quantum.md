## What a quantum is

An architecture quantum is the smallest part of a system that has its own set of architecture characteristics. In physics, a quantum is the smallest amount of something. Richards and Ford brought the term into software architecture in Fundamentals of Software Architecture. The Hard Parts (Ford, Richards, Sadalage, Dehghani) gives the definition that most people now use.

A quantum is an independently deployable artifact with four properties together:

| Property                     | What it means                                                       | A quick test                                                 |
| ---------------------------- | ------------------------------------------------------------------- | ------------------------------------------------------------ |
| Independently deployable     | It goes to production alone, with all it needs to run               | Can you release it with no release of another part?          |
| High functional cohesion     | It does one business job well, for example "sell seats"             | Can you name its job in business words, with no "and"?       |
| High static coupling         | Its own parts are wired tightly together: code, database, libraries | What must be present for it to start?                        |
| Synchronous dynamic coupling | Its parts call each other and wait for the answer while they work   | Which other parts must answer before a request can complete? |

The two kinds of coupling are the core of the idea. Static coupling draws the edge of the quantum at deploy time. Dynamic coupling can join two quanta for the length of a call at run time.

## Why an architect needs it

A characteristic belongs to a quantum, not to a whole system. A quantum has one level of scalability, one level of availability, and one deploy cadence, because it deploys and runs as one unit.

This answers a question that [One deployment or many](/learn/distributed) asks: what do you get for a distributed design? You get the ability to give different parts different characteristics. A monolith is one quantum, so the whole system must meet the strictest target that any part needs. Several quanta let each part pay only for what it needs.

The idea also shows the true structure of a system. A diagram with twelve service boxes can describe one quantum, if all twelve share one database. Then the team pays for twelve deployments and gets the characteristics of one. That is a [distributed monolith](/learn/modularity#the-distributed-monolith).

Use the quanta to scope the characteristics. See [Measure and protect characteristics](/learn/measuring-characteristics#scope-characteristics-per-quantum).

## Static coupling

Static coupling is how a part is wired. It is everything that the part needs to start and to run: its code, its libraries, its framework, its database, its message broker, and the platform it runs on.

A simple test: list what must be up before the part can start and serve one request. All the things on that list belong to the same quantum as the part, or the quanta share them.

Static coupling is not bad inside a quantum. A service and its own database are tightly coupled, and that is correct. The problem is static coupling that crosses the line between two parts that must be separate.

Common sources of static coupling between services:

- **A shared database.** The strongest one. See the next section.
- **A shared library with business rules.** All users must upgrade together, or they run different rules.
- **A shared schema or contract that must change in one step.** Two services that must deploy together are one quantum in practice.

Operational parts, such as a container platform or a log collector, are usually not counted. Each service can run without a change to them, and they do not hold business rules.

## Dynamic coupling

Dynamic coupling is how quanta talk to each other while they run. The Hard Parts describes it on three dimensions.

| Dimension     | Options                       | What it decides                                             |
| ------------- | ----------------------------- | ----------------------------------------------------------- |
| Communication | Synchronous or asynchronous   | Does the caller wait for the answer?                        |
| Consistency   | Atomic or eventual            | Must all parts agree at the end of the request, or later?   |
| Coordination  | Orchestration or choreography | Does one part direct the workflow, or does each part react? |

Communication matters most for the quantum. When service A calls service B and waits, the two are joined for the length of the call. If B is slow, A is slow. If B is down, that function of A is down. If B cannot scale, A cannot scale past B. For that call, A and B have one set of characteristics.

An asynchronous message breaks this link. A puts a message on a queue and continues. B reads it when it can. A keeps its own availability and its own scalability, and B can be down for a short time with no effect on A.

So a synchronous call between two quanta does not make them one quantum all the time. It joins them for each call. If one quantum depends on another with a synchronous call for its main function, treat them as one unit when you reason about the characteristics of that function.

The other two dimensions come into play when a workflow changes data in several quanta. They are the subject of [Distributed transactions](/learn/distributed-transactions) and [Messaging](/learn/messaging).

## A shared database makes one quantum

A database is part of the static coupling of each service that uses it. When several services use the same database, they all depend on one part that must be up for any of them to start. They form one quantum, however many deployments they have.

```diagram
{
  "nodes": [
    { "id": "booking", "label": "Booking\nservice", "shape": "box", "col": 0, "row": 0 },
    { "id": "dispatch", "label": "Dispatch\nservice", "shape": "box", "col": 1, "row": 0 },
    { "id": "billing", "label": "Billing\nservice", "shape": "box", "col": 2, "row": 0 },
    { "id": "db", "label": "Parcels database\n(one schema)", "shape": "store", "col": 1, "row": 1 }
  ],
  "groups": [{ "id": "q", "label": "One quantum", "col": 0, "row": 0, "cols": 3, "rows": 2 }],
  "edges": [
    { "from": "booking", "to": "db", "label": "SQL" },
    { "from": "dispatch", "to": "db", "label": "SQL" },
    { "from": "billing", "to": "db", "label": "SQL" }
  ]
}
```

The three services of this parcel service deploy separately. But:

- When the database is down, all three are down. They cannot have different availability.
- A change to a shared table needs a change in each service that reads it.
- The database must scale for the sum of all three loads.

This is not always a mistake. A [service-based architecture](/learn/service-based) often has a few large services and one shared database on purpose. The team gets separate deploys and simple transactions, and accepts one quantum. Richards and Ford rate service-based architecture as usually one quantum for this reason. The mistake is to expect the characteristics of several quanta from this shape.

To get several quanta, each one needs its own data. See [Data ownership](/learn/data-ownership) for how to split the data and keep it consistent.

## Each quantum can have its own characteristics

Here is the ticket seller from the [Front Row](/kata/front-row) kata, with two quanta.

```diagram
{
  "nodes": [
    { "id": "buyer", "label": "Buyer", "shape": "actor", "col": 0, "row": 0.5 },
    { "id": "sales", "label": "Seat sales", "shape": "box", "col": 1, "row": 0 },
    { "id": "pay", "label": "Payments", "shape": "box", "col": 1, "row": 1 },
    { "id": "seats", "label": "Seats and holds", "shape": "store", "col": 2, "row": 0.5 },
    { "id": "topic", "label": "Seat sold\nevents", "shape": "pipe", "col": 2, "row": 2 },
    { "id": "tickets", "label": "Ticket delivery", "shape": "box", "col": 3, "row": 2 },
    { "id": "tdb", "label": "Tickets", "shape": "store", "col": 3, "row": 3 }
  ],
  "groups": [
    { "id": "q1", "label": "Quantum 1: sale", "col": 1, "row": 0, "cols": 2, "rows": 1.6 },
    { "id": "q2", "label": "Quantum 2: delivery", "col": 3, "row": 1.6, "cols": 1, "rows": 2.4 }
  ],
  "edges": [
    { "from": "buyer", "to": "sales", "label": "HTTPS" },
    { "from": "sales", "to": "seats", "label": "hold" },
    { "from": "sales", "to": "pay", "label": "charge" },
    { "from": "sales", "to": "topic", "label": "publish", "async": true },
    { "from": "topic", "to": "tickets", "async": true },
    { "from": "tickets", "to": "tdb" }
  ]
}
```

Seat sales and payments call each other and wait. A seat is sold only when the payment succeeds, so they share one atomic workflow. They form one quantum. Ticket delivery reads events from a topic and has its own store, so it is a second quantum.

| Characteristic | Quantum 1: sale                                      | Quantum 2: delivery                               |
| -------------- | ---------------------------------------------------- | ------------------------------------------------- |
| Elasticity     | Very high: from 5,000 to 2 million buyers in minutes | Low: it can work through the queue in an hour     |
| Consistency    | Atomic: never one seat for two buyers                | Eventual: a ticket can arrive a few minutes later |
| Availability   | Very high during an on-sale                          | Normal: a short outage only delays tickets        |
| Deploy cadence | Frozen during a major on-sale                        | Any time                                          |

If delivery were inside the sale quantum, it would need elasticity for 2 million buyers, and a fault in it could stop sales. As a separate quantum, it costs little and cannot hurt the sale.

### Two more examples

- **The lunch shop** ([Lunch Rush](/kata/lunch-rush)). One [modular monolith](/learn/modular-monolith) with one database is one quantum. That is the right answer for a team of four. The kitchen screen in each shop can be a second quantum: it runs on a device in the shop, keeps a local copy of the orders, and works when the internet is slow.
- **The tutor marketplace** ([Tutor Marketplace](/kata/tutor-marketplace)). The recommendation model trains in batch on a schedule, with its own data and its own platform. It is a separate quantum. Booking can call it, but with a short timeout and a fallback list, so a slow model does not join the two quanta for long.

## How to count the quanta in a design

1. Draw each deployment and each data store.
2. Group each deployment with the stores it needs to start. Join two groups that share a store.
3. Join two groups that must deploy together, for example because of a shared business library.
4. For each arrow between groups, mark it as synchronous or asynchronous.
5. For each main function, follow the synchronous arrows. The parts on that path share characteristics for that function.

The result is often fewer quanta than boxes. That is useful information, not a failure. Say it out loud in a review: "These five services are one quantum, because they share the orders database."

## Failure modes

- **Many services, one quantum.** Separate deployments with a shared database or shared business libraries. All the cost of distribution, none of the separate characteristics.
- **A hidden synchronous chain.** Service A calls B, which calls C, which calls D. Each looks independent in the diagram. At run time, A is only as available as the product of all four. Four services at 99.9% each give roughly 99.6% for the chain.
- **A quantum with no clear job.** A part with low functional cohesion has several reasons to change and several sets of needs. Split it along business lines.
- **Too many quanta.** Each quantum adds a deploy pipeline, monitoring, and contracts to keep. Split only where two parts truly need different characteristics. See [How large a service must be](/learn/service-granularity).

## In a kata

After you draw the first design, count the quanta with the procedure above. Then:

1. Write the top characteristics for each quantum, not for the whole system.
2. For each quantum, say why it is separate: which characteristic differs from its neighbors.
3. For each synchronous arrow between quanta, say what occurs when the far end is slow. Add a timeout, a fallback, or a queue.

A reviewer who sees "each quantum has its own characteristics, and here they are" knows that you thought about the structure, not only the boxes.

## Interview questions

**"What is an architecture quantum?"**

- An independently deployable part with high functional cohesion.
- High static coupling inside it: its code, its data, and what it needs to start.
- Synchronous dynamic coupling inside it: its parts wait for each other.
- It is the unit that has one set of architecture characteristics.

**"You have ten microservices and one database. How many quanta do you have?"**

- One. The database is static coupling that all ten share.
- They cannot have different availability or scale separately at the data layer.
- That can be acceptable, as in service-based architecture, but say it clearly.
- To get more quanta, give each service its own data, and accept eventual consistency between them.

**"What is the difference between static and dynamic coupling?"**

- Static: how parts are wired. Dependencies, databases, libraries. It is visible at deploy time.
- Dynamic: how parts talk at run time. Synchronous or asynchronous, atomic or eventual, orchestrated or choreographed.
- A synchronous call joins the characteristics of two quanta for the length of the call.

**"Why would you split a system that works as one deployment?"**

- Because one part needs a different characteristic: much higher scale, higher availability, stronger security, or a different deploy cadence.
- A separate quantum lets only that part pay for it.
- If no characteristic differs, do not split.

## Go deeper

- **Software Architecture: The Hard Parts** (Ford, Richards, Sadalage, Dehghani), the part on architecture quanta and dynamic coupling: the full definition, and the three dimensions of communication, consistency, and coordination.
- **Fundamentals of Software Architecture** (Richards, Ford), the part on the scope of architecture characteristics: the first form of the idea, and the quanta of each style.
- **Building Microservices** (Newman), the parts on independent deployability and on coupling: the same goal seen from the side of one service.
- **Release It!** (Nygard), the part on integration points: what a synchronous call to another quantum does to your stability.

## Further reading

- [Database per service](https://microservices.io/patterns/data/database-per-service.html) and [Shared database](https://microservices.io/patterns/data/shared-database.html) on microservices.io
- [Connascence](https://en.wikipedia.org/wiki/Connascence) on Wikipedia, a vocabulary for static and dynamic coupling
- [Microservices](https://martinfowler.com/articles/microservices.html), by James Lewis and Martin Fowler
