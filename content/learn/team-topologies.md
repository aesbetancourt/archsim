## Why team structure is an architecture decision

The structure of the teams and the structure of the system shape each other. If you design a system and ignore the teams, the teams will reshape the system. [Teams and communication](/learn/teams#conway-s-law) introduces Conway's law. This page gives the vocabulary to design the teams.

Skelton and Pais (Team Topologies) give a small set of building blocks:

- Four team types, each with a clear purpose.
- Three interaction modes, which describe how two teams work together.
- Cognitive load, which sets the limit on how much one team can own.

The book treats the team, not the individual, as the unit of delivery. A team is a long-lived group of people, usually small, that works together on a shared goal. The rough size that the book gives is 5 to 9 people. Above that, trust and communication in the group become harder.

An architect needs this vocabulary for three reasons:

1. **Boundaries need owners.** A service or a [bounded context](/learn/bounded-contexts) with no clear owner team decays.
2. **Coupling between teams is coupling in the system.** Each team that must wait for another adds delay to each change. [Delivery performance](/learn/delivery-performance) depends on it.
3. **Interviews ask about it.** At senior level, "how would you organize the teams for this design" is a common follow-up.

## Conway's law and the reverse Conway maneuver

Mel Conway made the observation in 1968: a system tends to copy the communication structure of the organization that designs it. If two teams rarely talk, the interface between their parts will be formal and narrow. If one team owns two parts, they tend to grow together.

The practical consequence is that you cannot design the architecture and the organization separately. Team Topologies takes this as a design tool. The **reverse Conway maneuver** (also called the inverse Conway maneuver) means that you change the team structure first, to get the architecture you want.

| You want                                    | Shape the teams like this                                       |
| ------------------------------------------- | --------------------------------------------------------------- |
| Independent services for checkout and seats | Two teams, each one owns one service from code to production    |
| A clear platform for deployment and logs    | One platform team with a product mindset and internal customers |
| One modular application, not many services  | One or two teams that share one code base with clear modules    |

The maneuver does not work by itself. If the new teams still share one database and one release, the old structure returns. Team changes and boundary changes must go together.

## The four team types

| Team type             | Purpose                                                                              | Ticket seller example                                       | Typical interaction mode                                   |
| --------------------- | ------------------------------------------------------------------------------------ | ----------------------------------------------------------- | ---------------------------------------------------------- |
| Stream-aligned        | Delivers value for one stream of work: a product, a user journey, a type of customer | Buyer checkout, promoter tools, venue entry                 | X-as-a-Service with others; collaboration for a short time |
| Enabling              | Helps stream-aligned teams learn a new skill or practice, then steps back            | A team that helps others adopt load tests before a big sale | Facilitating                                               |
| Complicated-subsystem | Owns a part that needs deep specialist knowledge                                     | Dynamic pricing, or the seat-map rendering engine           | X-as-a-Service                                             |
| Platform              | Gives internal services that let stream-aligned teams deliver with less effort       | Deployment, runtime, logs and metrics, the data pipeline    | X-as-a-Service; collaboration when it finds new needs      |

### Stream-aligned teams

A stream is a continuous flow of work for one area of the business. A stream-aligned team owns that flow from the idea to production and to support. It does not hand work to another team to test, deploy, or run.

This is the main team type. Most teams in an organization are stream-aligned. The other three types exist to reduce the load on them.

A stream-aligned team needs a set of skills inside it: product, design, development, testing, and operations. It does not need a specialist for each thing, but it must not wait for others for normal work.

### Enabling teams

An enabling team is a small group of specialists in one area, such as testing, security practices, or observability. It helps a stream-aligned team to gain a capability, and then it moves to the next team.

The enabling team does not do the work for the other team. Its success is measured by how soon the other team does not need it. An enabling team that becomes a permanent dependency has become a bottleneck.

### Complicated-subsystem teams

A complicated-subsystem team owns a part that needs rare, deep knowledge. Examples are a pricing algorithm, a video codec, a fraud model, or a solver for routes.

The reason to create this team is cognitive load, not reuse. Without it, a stream-aligned team must also master the specialist area. Create this type only when the knowledge is really specialist. Most components do not need it.

### Platform teams

A platform team gives other teams a set of self-service capabilities, such as deployment pipelines, environments, logs, metrics, and databases. The goal is to reduce the cognitive load of stream-aligned teams.

A platform is a product with internal customers. It needs a product owner, a roadmap, documentation, and attention to the experience of its users. A platform that teams must use, but that does not help them, is a tax.

A large platform can itself be a group of teams: stream-aligned teams inside the platform, each for one platform service.

## Thinnest viable platform

The thinnest viable platform (TVP) is the smallest platform that speeds up the stream-aligned teams. The book is clear that a platform does not have to start as software.

A TVP can be:

1. A wiki page that lists the approved cloud services, with the standard setup for each.
2. A set of templates and scripts for a new service.
3. A small internal service, such as a shared deployment pipeline.
4. A full internal developer platform, only when the organization is large enough to need it.

The failure to avoid is a large platform built before anyone knows what the teams need. It takes a year, solves the wrong problems, and stream-aligned teams work around it. Start thin. Grow the platform from real requests.

## The three interaction modes

| Mode           | What it is                                                                  | Use it for                                               | The cost                                                 |
| -------------- | --------------------------------------------------------------------------- | -------------------------------------------------------- | -------------------------------------------------------- |
| Collaboration  | Two teams work closely together, with shared goals, for a defined period    | Discovery: new technology, a new boundary, a new product | High. Both teams lose some speed. Boundaries blur.       |
| X-as-a-Service | One team consumes something that another team provides, with little contact | Stable, well-understood capabilities                     | Low contact, but the provider must keep a good interface |
| Facilitating   | One team helps another team to learn or to remove obstacles                 | Spread of skills and practices                           | Time of the facilitators. It must end.                   |

Three rules for interaction modes:

- **Choose the mode on purpose.** Each pair of teams that interacts must know which mode it is in. Problems begin when one team thinks it is collaboration and the other thinks it is a service.
- **Time-box collaboration.** Collaboration is good for discovery and bad as a permanent state. Plan the move to X-as-a-Service when the boundary is clear.
- **Use the interactions as a signal.** If a team that consumes a service must always talk to its provider, the interface is not good enough. Either the boundary is wrong, or the service is not mature.

The team-level interface is sometimes called the team API. It includes the code interfaces, the documentation, how to ask for help, how the team plans its work, and which channels it uses. Each team must make its team API clear.

## An example organization

Here is an organization for a parcel service with about 50 engineers.

```diagram
{
  "nodes": [
    { "id": "sender", "label": "Sender app\n(stream-aligned)", "shape": "box", "col": 0, "row": 0 },
    { "id": "courier", "label": "Courier app\n(stream-aligned)", "shape": "box", "col": 1, "row": 0 },
    { "id": "business", "label": "Business API\n(stream-aligned)", "shape": "box", "col": 2, "row": 0 },
    { "id": "routing", "label": "Route optimization\n(complicated subsystem)", "shape": "box", "col": 0.5, "row": 1.5 },
    { "id": "enabling", "label": "Reliability coaches\n(enabling)", "shape": "box", "col": 3, "row": 0.75 },
    { "id": "platform", "label": "Delivery platform\n(platform)", "shape": "box", "col": 1.5, "row": 2.75 }
  ],
  "groups": [{ "id": "streams", "label": "Stream-aligned teams", "col": 0, "row": 0, "cols": 3, "rows": 1 }],
  "edges": [
    { "from": "sender", "to": "courier", "label": "collaboration\n(one quarter)", "both": true },
    { "from": "routing", "to": "courier", "label": "X-as-a-Service" },
    { "from": "enabling", "to": "business", "label": "facilitating" },
    { "from": "platform", "to": "sender", "label": "X-as-a-Service" },
    { "from": "platform", "to": "courier", "label": "X-as-a-Service" },
    { "from": "platform", "to": "business", "label": "X-as-a-Service" }
  ]
}
```

How to read it:

- **Three stream-aligned teams** follow three groups of users: people who send parcels, couriers, and business customers who use the API.
- **Sender and courier collaborate for one quarter.** They build live tracking together, because the boundary between the two apps is not yet clear. After the quarter, the courier team offers location as a service.
- **Route optimization is a complicated subsystem.** It needs specialists in optimization. The courier team gets the routes through an API and does not need to understand the solver.
- **The reliability coaches facilitate.** They help the business API team to define SLOs and alerts, because large customers now ask for an uptime commitment. Then they move to the next team.
- **The platform team** gives all teams deployment, runtime, and [observability](/learn/observability) as a self-service product.

## Cognitive load

Cognitive load is the amount of mental effort that a task needs. The idea comes from John Sweller's work in educational psychology. Team Topologies applies it to a whole team: the total amount of knowledge a team must hold to own its software.

There are three kinds:

| Kind       | What it is                                              | Example for a courier app team                             | What to do                                         |
| ---------- | ------------------------------------------------------- | ---------------------------------------------------------- | -------------------------------------------------- |
| Intrinsic  | The knowledge that the task itself needs                | How mobile apps work offline. How a delivery proof works.  | Train and hire. Give specialist parts to others.   |
| Extraneous | Effort on things that are not the task                  | Manual deployment steps. A slow, fragile test environment. | Remove it. A platform takes most of it.            |
| Germane    | Effort that builds understanding of the business domain | How couriers plan their day. What makes a delivery fail.   | Make space for it. This is where value comes from. |

The main rule: **limit the responsibilities of a team to what fits its cognitive load.** When a team owns too much, it cannot understand its software. Quality drops, changes slow down, and people burn out.

Some rough heuristics from the book:

- Give each domain to one team. Do not split one domain across teams.
- A team can usually own two or three simple domains.
- A team that owns a complex domain must not own other domains as well.

Signs that a team is over its limit: it cannot explain how its own services work, it is afraid to deploy, incidents in its area take a long time to diagnose, and it has no time to improve anything.

This is one of the strongest arguments for a [platform](#the-four-team-types) and against very fine-grained services. Each service that a team owns adds deployment, monitoring, and on-call load. Twenty small services can be more load than one well-structured service. See [Service granularity](/learn/service-granularity).

## Team-first boundaries and fracture planes

Team Topologies says that software boundaries must be sized to fit a team. A boundary that is too large for one team becomes shared, and shared ownership weakens ownership. A boundary that needs constant talk with another team is in the wrong place.

A fracture plane is a natural line along which to split a large system into parts that a team can own. The book lists several kinds:

| Fracture plane        | Split here when ...                                                                            |
| --------------------- | ---------------------------------------------------------------------------------------------- |
| Business domain       | The parts are different [bounded contexts](/learn/bounded-contexts). This is the first choice. |
| Regulatory compliance | One part has strict legal rules, such as card payments. Keep the strict scope small.           |
| Change cadence        | One part changes weekly, and another part changes once a year                                  |
| Team location         | Teams work in very different time zones                                                        |
| Risk                  | One part can tolerate more risk, such as an experiment, than another part                      |
| Performance isolation | One part has a very different load, such as the burst when a big tour goes on sale             |
| Technology            | One part uses very different technology, such as an old mainframe system                       |
| User personas         | Different groups of users need different features, such as buyers and promoters                |

Most of these are the same reasons that [How to find component boundaries](/learn/boundaries#how-large-must-a-part-be) gives for a split. The team view adds one test: can one team own this part and deliver changes for it without waiting for another team?

The business domain is the default fracture plane. The others are reasons to split further inside a domain, or to place a technical concern apart.

## Trade-offs and failure modes

Team design has trade-offs like any other architecture decision.

- **Too many team types.** The book gives four types on purpose. Teams named "integration team", "middleware team", or "DBA team" often hide a hand-off. Ask which of the four types each team is.
- **Component teams.** Teams organized by technical layer, such as a front-end team and a back-end team. Each feature needs both, so every change is a hand-off. This matches technical partitioning. See [How to find component boundaries](/learn/boundaries#divide-by-business-area).
- **Permanent collaboration.** Two teams that must always work together are really one team, or the boundary is wrong.
- **The platform as a gate.** A platform team that approves each change, instead of providing self-service, slows each stream.
- **Reorganization by chart.** Team changes made only on an organization chart, with no change in ownership of code and data, do not change the architecture.
- **Teams that are not stable.** Moving people between teams for each project destroys the team's knowledge of its domain. Long-lived teams own long-lived systems.
- **Ignoring the existing organization.** In an interview or in real work, the current teams are a constraint. A design that needs ten teams in a company with two is not realistic.

When the recommendation changes: for a startup with eight engineers, most of this is too much. One or two stream-aligned teams and a thin platform of good scripts are enough. The vocabulary becomes important when the organization has several teams that block each other.

## In a kata

Use this page at the end of a design, after you draw the components.

1. Read the constraints for the size of the team. [Lunch Rush](/kata/lunch-rush) has four developers. That is one team, so a [modular monolith](/learn/modular-monolith) fits better than many services.
2. Group the components by bounded context, and assign one stream-aligned team to each group.
3. Check the cognitive load. Does one team own too many contexts, or one very complex part?
4. Mark the specialist parts as possible complicated subsystems, such as the recommendation engine in [Tutor Marketplace](/kata/tutor-marketplace).
5. Say what the platform gives each team: deployment, logs, and the message broker.
6. State the interaction mode between the teams that share an interface.

In [Front Row](/kata/front-row), seat inventory under a burst of buyers is the core domain. It deserves its own stream-aligned team. A platform team can own the queue in front of the sale.

## Interview questions

**Name the four team types, and say why the stream-aligned type is the main one.**

- Stream-aligned, enabling, complicated-subsystem, platform.
- Stream-aligned teams deliver value to users directly.
- The other three types exist to reduce the load on stream-aligned teams.
- Most teams in a healthy organization are stream-aligned.

**How does Conway's law affect your design, and what is the reverse Conway maneuver?**

- The system tends to copy the communication structure of the organization.
- Team structure is an input to the design. Parts owned by different teams need clear interfaces.
- The reverse maneuver: shape the teams first to get the boundaries you want.
- It works only if the ownership of code and data changes too.

**What is cognitive load, and how does it limit a service design?**

- The mental effort that a team needs to own its software.
- Three kinds: intrinsic, extraneous, germane. Remove extraneous, give intrinsic specialist parts away, make space for germane.
- Each service adds deployment, monitoring, and on-call load to its team.
- Size the boundaries so that each team can understand all that it owns.

**When would you create a platform team, and how do you keep it useful?**

- When several stream-aligned teams repeat the same work, such as deployment and monitoring.
- Treat the platform as a product: users, a roadmap, documentation, self-service.
- Start with the thinnest viable platform, which can be a document or templates.
- Measure success by how much faster the stream-aligned teams deliver.

**Two teams always need each other for each feature. What do you do?**

- Find out why: a wrong boundary, a shared database, or one domain split across two teams.
- If it is discovery, make it a time-boxed collaboration with a goal.
- Otherwise, move the boundary or merge the teams.
- Aim for X-as-a-Service between them once the interface is clear.

## Go deeper

- **Team Topologies** (Matthew Skelton, Manuel Pais), the whole book: the team types, the interaction modes, cognitive load, and fracture planes. It is the source for this page.
- **Accelerate** (Forsgren, Humble, Kim), the parts on architecture and on team autonomy: evidence that loosely coupled teams and systems deliver faster. See [Delivery performance](/learn/delivery-performance).
- **Building Microservices** (Sam Newman), the part on organization and ownership: Conway's law, strong ownership of services, and how teams share code.
- **The Software Architect Elevator** (Gregor Hohpe), the parts on organizations: how an architect connects the technical floor and the management floor when the structure of the teams must change.

## Further reading

- [Team Topologies, key concepts](https://teamtopologies.com/key-concepts)
- [Team Topologies](https://martinfowler.com/bliki/TeamTopologies.html) and [Conway's law](https://martinfowler.com/bliki/ConwaysLaw.html), by Martin Fowler
- [Conway's law](https://en.wikipedia.org/wiki/Conway%27s_law) and [Cognitive load](https://en.wikipedia.org/wiki/Cognitive_load) on Wikipedia
