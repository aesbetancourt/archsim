## Monolithic and distributed styles

An architecture style is a named shape for the whole system: how the code is divided, how the parts are deployed, and how they talk. A style gives the team a shared vocabulary. When you say "service-based", a reviewer knows the rough topology, the data shape, and the usual trade-offs before you draw one box.

Richards and Ford (Fundamentals of Software Architecture) put the styles in two families. The first question is not "which style", but "which family".

| Family      | Styles on this site                                                                                                                                  | Deployment                     | Usual number of quanta |
| ----------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------ | ---------------------- |
| Monolithic  | [Layered](/learn/layered), [modular monolith](/learn/modular-monolith), [microkernel](/learn/microkernel), [pipeline](/learn/pipeline)               | One unit                       | One                    |
| Distributed | [Service-based](/learn/service-based), [event-driven](/learn/event-driven), [space-based](/learn/space-based), [microservices](/learn/microservices) | Several units across a network | One to many            |

An [architecture quantum](/learn/architecture-quantum) is the smallest part that deploys alone and has its own set of characteristics. A monolithic style is one quantum, so the whole system has one level of scalability, one level of availability, and one release cadence. A distributed style can have several quanta, so each part can get the characteristics that it needs.

That is the real choice. You pick a distributed style when different parts need different characteristics, and you accept the costs that a network adds. See [One deployment or many](/learn/distributed) for the costs: the fallacies of distributed computing, partial failure, distributed logging, distributed transactions, and contracts.

A monolithic style is not a legacy style. Newman (Building Microservices) separates three kinds of monolith: the single-process monolith, the modular monolith, and the distributed monolith. Only the last one is a failure, and it is a distributed system. A clean single-process system is a correct choice for many problems.

## A short history

The styles of today are answers to the problems of earlier styles. A short history helps you explain why each style exists.

### The big ball of mud

Foote and Yoder named the big ball of mud in a 1997 paper: a system with no visible structure. Any class can call any other class. The database is read and written from everywhere. Nobody can say where a feature lives.

It is common in practice, because it is what you get when nobody makes structural decisions. The cost grows slowly. Each change becomes harder to make and harder to test, because a change in one place can break code anywhere. Richards and Ford treat it as the anti-pattern that a style exists to prevent.

A team that does not choose a style gets one by accident. In most frameworks, that accidental style is a [layered](/learn/layered) application, with folders for controllers, services, and repositories.

### Client/server

The first step away from one large program was to split the user interface from the data.

1. **Two tiers.** A desktop program held the screens and most of the logic. It connected directly to a shared database server. Each change to the logic meant a new install on each desktop.
2. **Browser and web server.** The browser showed the screens. The web server held the logic and talked to the database. A release now meant one deploy on the server.
3. **Three tiers.** A separate application server held the business logic, between the web tier and the database. This era also tried distributed objects, which hid network calls behind local method calls. That idea failed often, because a network call is not a local call.

The lesson that survives: put a boundary where the parts change for different reasons, and make the network visible in the design.

### Orchestration-driven service-oriented architecture

In the 2000s, large companies tried to get reuse across the whole enterprise. The result was orchestration-driven service-oriented architecture (SOA). Richards and Ford describe it as a warning.

```diagram
{
  "nodes": [
    { "id": "place", "label": "Business service\nPlace order", "shape": "box", "col": 0, "row": 0 },
    { "id": "ship", "label": "Business service\nShip parcel", "shape": "box", "col": 2, "row": 0 },
    { "id": "esb", "label": "Enterprise service bus\n(orchestration engine)", "shape": "pipe", "col": 1, "row": 1 },
    { "id": "customer", "label": "Enterprise service\nCustomer", "shape": "box", "col": 0, "row": 2 },
    { "id": "address", "label": "Enterprise service\nAddress", "shape": "box", "col": 2, "row": 2 },
    { "id": "db", "label": "Shared database", "shape": "store", "col": 1, "row": 3 }
  ],
  "edges": [
    { "from": "place", "to": "esb" },
    { "from": "ship", "to": "esb" },
    { "from": "esb", "to": "customer" },
    { "from": "esb", "to": "address" },
    { "from": "customer", "to": "db" },
    { "from": "address", "to": "db" }
  ]
}
```

The design had a taxonomy of service layers. Business services described the work at a high level. Enterprise services held shared, reusable pieces, such as "customer" or "address". An integration hub, the enterprise service bus, orchestrated each workflow across them and translated between protocols.

Why it failed in many companies:

- **Reuse made coupling.** Every workflow used the shared "customer" service. One change to it needed tests and releases across the company.
- **The bus became the center.** All workflows ran through one integration hub. It was a bottleneck for load, for change, and for the team that owned it.
- **Technical partitioning at company scale.** The layers were technical roles. One business concept, such as an order, was spread across many services and the bus.
- **Slow change and weak scaling.** Every workflow was a long chain of synchronous calls through the bus.

[Microservices](/learn/microservices) are in part a reaction to this. They favor duplication over shared reuse, and smart endpoints with simple pipes over a smart bus. When a design proposes a central "integration layer" that holds business rules, name this history.

## Partitioning in each style

The top-level partitioning is the first structural decision in a code base. Technical partitioning divides by technical role: screens, business rules, data access. Domain partitioning divides by business area: orders, menus, payments. See [Two levels of architecture](/learn/code-architecture#technical-partitioning-and-domain-partitioning) for the full comparison.

Each style has a usual partitioning:

| Style                    | Usual partitioning   | What it means for a change to one business feature                     |
| ------------------------ | -------------------- | ---------------------------------------------------------------------- |
| Layered                  | Technical            | The change touches each layer                                          |
| Pipeline                 | Technical            | The change touches the filters that the data flows through             |
| Microkernel              | Technical or domain  | A change to one variation stays in one plug-in                         |
| Modular monolith         | Domain               | The change stays in one module                                         |
| Service-based            | Domain               | The change stays in one service, unless the shared schema changes      |
| Event-driven             | Technical, usually   | A workflow is spread across several event processors                   |
| Space-based              | Technical and domain | Processing units are often per domain, around shared infrastructure    |
| Microservices            | Domain               | The change stays in one service, if the boundaries are correct         |
| Orchestration-driven SOA | Technical            | The change touches business services, enterprise services, and the bus |

Partitioning matters because of [Conway's law](/learn/teams#conway-s-law): the structure of the system follows the structure of the teams. Technical partitioning fits teams organized by skill. Domain partitioning fits teams that own a business area from screen to database. Most organizations now prefer the second, so most new designs use domain partitioning at the top.

## How to select a style

Richards and Ford list the inputs to the choice. In my words:

| Input                    | The question to ask                                                                 |
| ------------------------ | ----------------------------------------------------------------------------------- |
| The domain               | What is its shape? A stable core with many variations? A one-way data flow? Bursts? |
| The characteristics      | Which three to seven characteristics matter most? Do they differ between parts?     |
| The data                 | Where must the data live? Which data must change in one atomic transaction?         |
| The organization         | How many teams? What budget? Is a merger, a sale, or a cloud move coming?           |
| The teams and operations | Can the teams run many deployments, with automation, monitoring, and tracing?       |

Some domains have a natural match to a style. Richards and Ford call this domain and architecture isomorphism: the shape of the problem fits the shape of the style. Tax software with one rule set for each region fits a microkernel. A nightly import fits a pipeline. A system that must react to many independent occurrences fits event-driven. When the problem has such a shape, say it.

The selection produces three structural decisions:

1. **Monolithic or distributed.** Is one set of characteristics enough for the whole system? If yes, choose a monolithic style. If no, find the quanta.
2. **Where the data lives.** One database, or one database for each quantum. This decision often matters more than the style name. See [Data ownership](/learn/data-ownership).
3. **Synchronous or asynchronous communication.** Richards and Ford advise synchronous calls by default, and asynchronous calls where you need them. Asynchronous calls add design work for order, repeats, and errors. See [Synchronous and asynchronous](/learn/sync-async).

Write each of these as a [decision record](/learn/decision-records), with the trade-off that you accepted.

## Why the fashion changes

Styles go in and out of fashion. A senior candidate can explain why, instead of "microservices are modern".

- **Lessons from the past.** Each style answers the pain of the last one. Microservices answered the shared enterprise services of SOA.
- **Changes in the ecosystem.** Free open-source tools, containers, Kubernetes, and cloud platforms made many small deployments cheap. Before them, each new server was a purchase.
- **New capabilities.** Managed queues, managed databases, and serverless functions made some distributed styles possible for small teams.
- **Changes in the domain.** A business that merges, grows into new countries, or changes its model can outgrow a style.
- **External factors.** Licence costs, cloud bills, and hiring markets push teams one way or the other.

The current swing is a good example. From about 2014, many teams split systems into microservices, often before the boundaries were clear. Many paid the operating cost and did not get the benefit. A number of public cases since then describe a move back to fewer, larger deployments. The common advice now is a [modular monolith](/learn/modular-monolith) first, and a split only for a named reason. Fowler writes about this as "monolith first" on his site.

The point for an interview: a style is a set of trade-offs for a context. When the context changes, the best style changes too.

## A decision procedure

This is a procedure for a kata or an interview. It is a start, not a law.

1. **Write the top characteristics.** Three is enough. Mark the ones that apply only to one part of the system.
2. **Ask the family question.** If one set of characteristics fits all parts, go to step 3. If not, go to step 4.
3. **Pick a monolithic style.**
   - A small system, mostly forms and tables, or a problem not yet understood: layered.
   - Clear business areas, and a team that wants them to stay clear: modular monolith. This is the usual default.
   - A stable core and many variations by customer, region, or device: microkernel.
   - One-way data processing: pipeline.
4. **Find the quanta.** Group the parts by characteristic. Count them with the procedure in [Architecture quanta](/learn/architecture-quantum#how-to-count-the-quanta-in-a-design).
5. **Pick a distributed style.**
   - Four to twelve business areas, a shared database is acceptable, a medium budget: service-based.
   - Work arrives in bursts, or one occurrence starts many independent reactions: event-driven.
   - Extreme, sudden load peaks on a small part of the data: space-based for that part.
   - Many teams, uneven load, and mature operations: microservices.
6. **Check the data.** List the operations that must be atomic. Keep each one inside one quantum. If you cannot, plan a saga. See [Distributed transactions](/learn/distributed-transactions).
7. **Check the organization.** Count the teams. Ask who operates the system at night. A style that the team cannot run is the wrong style.
8. **Allow a hybrid.** Most real systems mix styles. Service-based with an event-driven part for notifications is common. Name each part and its style.

| If you are unsure about | Choose               | Why                                                               |
| ----------------------- | -------------------- | ----------------------------------------------------------------- |
| The boundaries          | Modular monolith     | A wrong boundary costs little to move in one code base            |
| The load                | Monolithic, measured | Measure first. Split the hot part when the numbers show it        |
| The team's operations   | Fewer deployments    | Each deployment needs a pipeline, monitoring, and someone on call |

## Common mistakes

- **Style first, problem second.** The candidate says "microservices" before the requirements. Start from the characteristics.
- **A style name with no topology.** "Event-driven" can mean a broker with no central control, or a mediator that orchestrates. Draw which one.
- **Many services, one database, and a claim of independence.** That is one quantum. Say so, or split the data.
- **One style for the whole system.** A batch import and a live checkout can need different styles.
- **No path to change.** Say how the design grows: which module leaves first, and what triggers the move. See [Evolve an architecture](/learn/evolution).

## In a kata

1. After you list the characteristics, write the family decision in one sentence: "One quantum is enough, because…" or "Two quanta, because…".
2. Pick the style for each quantum with the procedure above.
3. Write a decision record for the style. Name one style that you rejected, and why.
4. State the trigger that would change the style. For example: "When the kitchen screens need to work offline, the screen becomes its own quantum."

In [Lunch Rush](/kata/lunch-rush), a modular monolith is a strong answer for a small team. In [Front Row](/kata/front-row), the seat sale needs extreme elasticity, but ticket delivery does not, so two quanta with different styles make sense.

## Interview questions

**"How do you choose an architecture style?"**

- Start from the top characteristics, the domain shape, the data, and the organization.
- First decide monolithic or distributed: does one set of characteristics fit all parts?
- Then decide where the data lives, and synchronous or asynchronous communication.
- Pick the simplest style that meets the characteristics. Record the trade-off.

**"When is a monolith the right answer?"**

- When one set of characteristics fits the whole system.
- When the boundaries are not yet clear, or the team is small.
- When the team cannot yet operate many deployments.
- Prefer a modular monolith, so the move to services stays possible.

**"What was wrong with service-oriented architecture?"**

- Enterprise-wide reuse coupled every workflow to shared services.
- The service bus held orchestration and became a bottleneck.
- Technical partitioning spread each business concept across many parts.
- Microservices answered with domain partitioning, owned data, and simple pipes.

**"What is the difference between technical and domain partitioning?"**

- Technical: top-level parts by role, such as screens, rules, data. Fits teams by skill.
- Domain: top-level parts by business area. A feature change stays in one part.
- Domain partitioning gives the natural lines for a later split into services.

**"Microservices are popular. Why not always use them?"**

- They cost a lot to operate: pipelines, monitoring, tracing, contracts, on-call.
- Transactions across services need sagas and eventual consistency.
- Wrong boundaries are expensive to move across a network.
- The benefit is real only when parts need different characteristics or teams need autonomy.

## Go deeper

- **Fundamentals of Software Architecture** (Richards, Ford), the parts on architecture styles and on choosing the appropriate style: the two families, the history, partitioning, and the inputs to the choice.
- **Software Architecture: The Hard Parts** (Ford, Richards, Sadalage, Dehghani), the parts on architecture quanta and on decomposition: how to find the quanta that decide the family.
- **Building Microservices** (Newman), the part on the monolith: the kinds of monolith, and when not to use microservices.
- **Team Topologies** (Skelton, Pais), the part on Conway's law: why the team structure pushes the partitioning.

## Further reading

- [Big ball of mud](https://en.wikipedia.org/wiki/Big_ball_of_mud) on Wikipedia
- [Monolith First](https://martinfowler.com/bliki/MonolithFirst.html), by Martin Fowler
- [Microservices](https://martinfowler.com/articles/microservices.html), by James Lewis and Martin Fowler
- [Service-oriented architecture](https://en.wikipedia.org/wiki/Service-oriented_architecture) on Wikipedia
