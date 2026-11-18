## Divide by business area

There are two ways to cut a system into parts.

|                                | Technical partitioning                  | Domain partitioning                                   |
| ------------------------------ | --------------------------------------- | ----------------------------------------------------- |
| The parts are                  | Layers: screens, rules, data access     | Business areas: orders, payments, menu                |
| A new business feature touches | Each layer                              | Usually one part                                      |
| Good for                       | Small systems, teams organized by skill | Systems that change often, teams organized by product |

Most modern designs divide by business area first. The reason is simple: the business asks for changes in business terms. "Add delivery partners" must land in one place.

Richards and Ford (Fundamentals of Software Architecture) call this choice the top-level partitioning. It is one of the first decisions in a design, and it is hard to change later. It also follows [Conway's law](/learn/teams#conway-s-law): a system that is cut by layer usually belongs to teams that are cut by skill.

Technical partitioning is not wrong. It is simple, and many developers know it. A layered design with a few business areas inside each layer is a good start for a small team. The cost appears when the business changes often: each change goes through each layer, and often through each team.

A domain partition can still have layers inside each part. The order matters: business area first, technical layer second. See [Layered architecture](/learn/layered) and [Modular monolith](/learn/modular-monolith).

## How to find the areas

1. **List the main actions** in the problem, with the words the business uses: place an order, change the menu, pay, notify.
2. **Group the actions that use the same data and change together.** "Charge the card" and "refund" belong together. "Change the menu" does not belong with them.
3. **Look at the words.** When one word means different things to different people, there is a boundary. "Product" for the warehouse is a box with a weight. "Product" for the shop is a page with a price. Domain-driven design calls each such area a bounded context.
4. **Give each area its data.** If two areas must write the same table, they are probably one area.

The rest of this page gives more exact methods for steps 1 and 2, and a loop to improve the result.

## The component identification flow

Fundamentals describes component design as a loop, not a single step. You make a first guess, then you test it against the requirements and the characteristics, and you change it.

```diagram
{
  "nodes": [
    { "id": "find", "label": "1. Find the first\ncomponents", "shape": "module", "col": 0, "row": 0 },
    { "id": "assign", "label": "2. Assign the\nrequirements", "shape": "module", "col": 1, "row": 0 },
    { "id": "roles", "label": "3. Check roles and\nresponsibilities", "shape": "module", "col": 2, "row": 0 },
    { "id": "chars", "label": "4. Check the\ncharacteristics", "shape": "module", "col": 2, "row": 1 },
    { "id": "restructure", "label": "5. Restructure\nthe components", "shape": "module", "col": 1, "row": 1 }
  ],
  "edges": [
    { "from": "find", "to": "assign" },
    { "from": "assign", "to": "roles" },
    { "from": "roles", "to": "chars" },
    { "from": "chars", "to": "restructure" },
    { "from": "restructure", "to": "assign", "label": "again" }
  ]
}
```

1. **Find the first components.** Use one of the approaches below. The first set is a guess, and it will be wrong in places.
2. **Assign the requirements.** Put each user story or action in one component. A story that fits nowhere shows a missing component. A component with no stories is not necessary.
3. **Check roles and responsibilities.** Write the job of each component in one sentence. Look for low [cohesion](/learn/modularity#cohesion).
4. **Check the characteristics.** Ask if a component has parts with different needs: scale, availability, security. Those parts can need their own component.
5. **Restructure.** Split, join, or move components. Then go back to step 2.

The loop continues for the life of the system. New features and new knowledge change the best boundaries.

## Ways to find the first components

| Approach       | How it works                                                       | Good for                                         |
| -------------- | ------------------------------------------------------------------ | ------------------------------------------------ |
| Actor/actions  | List the actors (people and systems) and the actions each one does | Systems with clear roles and formal requirements |
| Event storming | Find the business events, then the commands and rules around them  | Complex domains, with the business in the room   |
| Workflow       | Follow the main flows of work from start to end                    | Teams that do not use domain-driven design       |

### Actor/actions

Take the [Tutor Marketplace](/kata/tutor-marketplace). The actors are the student, the tutor, an administrator, and the payment provider. The student searches, books, pays, and writes a review. The tutor sets times, holds lessons, and gets paid. Group the actions that work on the same data. Search and tutor profiles go together. Booking and payment go together.

### Event storming

Event storming is a workshop method from Alberto Brandolini. People from the business and from the technical team write domain events on notes, in the past tense, and put them on a long wall in time order. A domain event is a fact that the business cares about.

For the tutor marketplace: "Tutor signed up", "Time slot published", "Lesson booked", "Lesson paid", "Lesson held", "Review written", "Tutor paid out".

Then the group adds, for each event, the command that caused it and the actor who gave the command. Clusters of events that use the same data and rules become the first components. Places where the words change, or where the people in the room disagree, are candidate boundaries.

### Workflow

The workflow approach is similar to event storming, with less ceremony. Draw the main flows as steps, and find the roles that do each step. Then group the steps into components.

## The entity trap

Fundamentals names a common mistake: the entity trap. The designer takes the database entities and makes one component for each: `TutorManager`, `StudentManager`, `LessonManager`, `PaymentManager`.

The result looks clean, but each component only reads and writes one table. The real business work, such as "book a lesson", now goes across four components. Each business change touches several of them.

| Sign of the entity trap                                    | What it shows                                 |
| ---------------------------------------------------------- | --------------------------------------------- |
| Component names end in "Manager" or "Service" after a noun | The parts are tables, not jobs                |
| Each component has create, read, update, delete            | The design is a database with a network on it |
| One user action calls many components in sequence          | The workflow has no home                      |

The fix: name components after the business work they do. "Booking", "Payouts", and "Tutor search" are better names than "Lesson" and "Tutor". If the system is really only create, read, update, and delete of records, you do not need an architecture of components. A simple framework is enough.

## Information hiding

Newman (Building Microservices) starts the search for boundaries with an old idea: information hiding. David Parnas described it in 1972. Each module hides a decision that is likely to change, and shows only what other modules need.

For a service, this means:

- The outside sees a small, stable contract: an API, or the events it publishes.
- The inside can change freely: the tables, the code structure, the language.
- No other service reads the database of the service.

Information hiding is what makes separate releases possible. If the contract stays the same, the team can release the inside at any time. If other parts see the inside, each internal change becomes a shared change.

A good boundary hides a lot. If a service must show most of its data to do its job, the boundary is probably in the wrong place. See [Deep modules](/learn/deep-modules) for the same idea at the level of code.

## Domain-driven design as a tool

Newman uses domain-driven design (DDD) as the main tool to find service boundaries. Three ideas from Evans (Domain-Driven Design) are the most useful:

- **Ubiquitous language.** The code uses the words of the business. A word that changes meaning shows a boundary.
- **Aggregate.** A group of objects that must stay consistent together, with one root. An aggregate must not be split across services. See [Domain model](/learn/domain-model).
- **Bounded context.** An area with its own model and its own language. It is the usual first candidate for a service.

Newman's advice: start with large services that match bounded contexts. Split a context into smaller services later, along the aggregates inside it, when you have a reason. A bounded context is a business boundary. A service is a deployment boundary. They often match, but they do not have to.

The relations between contexts, such as a shared kernel or an anti-corruption layer, have their own page: [Bounded contexts](/learn/bounded-contexts).

## How large must a part be

Start with larger parts and split only for a reason. These are reasons to split a part:

- One piece has a very different load from the rest.
- One piece changes much more often.
- One piece must stay up when the rest fails.
- One piece needs stronger security.
- A different team owns one piece.

These are reasons to keep pieces together, or to join them again:

- They must change data in one [transaction](/learn/consistency).
- Each request needs both of them, so they call each other all the time.
- They always change together.

In the Tutor Marketplace worked example, booking and payments stay together for the first of these reasons.

Newman also names boundaries that do not come from the business domain:

| Boundary from | Example in a parcel service                                     |
| ------------- | --------------------------------------------------------------- |
| Volatility    | Pricing rules change each week, so pricing gets its own part    |
| Data          | Customer addresses are personal data, so one part holds them    |
| Technology    | Route planning needs a graph library that the rest does not use |
| Organization  | A separate team in another city owns the tracking app           |

Use these as second reasons. Business areas come first. For a full set of reasons to split and to join, see [Service granularity](/learn/service-granularity). For the move from one deployment to many, see [Decomposing a monolith](/learn/decomposing-a-monolith).

## A test for your boundaries

Take three changes that the business could ask for next year. For each one, count the parts you must change. If the answer is usually one, the boundaries are good.

More tests:

1. **Data test.** For each table, name the one part that writes it. Two writers mean a wrong boundary.
2. **Language test.** Explain each part with the words of the business. A part that needs technical words only is a technical part.
3. **Call test.** For one main user action, count the calls between parts. Many calls in a chain mean the workflow is cut into pieces.
4. **Team test.** Give each part to one team. A part that two teams must change together is a shared part, and shared parts are slow.

## In a kata

Step 4 of the [method](/learn/method) asks for one clear responsibility for each box. Name boxes with business words. A box named "Service 2" or "Backend" shows that the boundary is not yet clear. See also [Modularity, cohesion, and coupling](/learn/modularity).

A fast procedure for the time limit of a kata:

1. Write the actors and their actions in two minutes.
2. Write five to ten domain events in time order.
3. Group them, and name each group with a business word.
4. Give each group its data.
5. Run the three-changes test on the result.

Say in the rationale why you kept parts together. "Booking and payment are one part because a lesson is booked only when it is paid" is a strong sentence in a review.

## Interview questions

**"How do you decide on the boundaries of services?"**

- Start from the business domain, not from layers or tables.
- Use a method: actor/actions, event storming, or the main workflows.
- Use bounded contexts as the first candidates. Do not split an aggregate.
- Give each service its own data, and hide its internals.
- Test with changes the business could ask for.

**"What is the entity trap?"**

- One component for each database entity, each with create, read, update, and delete.
- Business workflows have no home, so they go across many components.
- The fix: name and build components around business work, such as booking.

**"Technical or domain partitioning: which do you select, and why?"**

- Domain partitioning matches how the business asks for changes, so most changes stay in one part.
- Technical partitioning is simple and good for a small team or a simple system.
- Conway's law: the choice must match how the teams are organized.
- Layers inside each domain part are a common mix.

**"What is information hiding, and why does it matter for microservices?"**

- Parnas: each module hides a decision that is likely to change.
- A service shows a small contract and hides its data and code.
- This makes separate releases possible.
- A shared database breaks it.

**"Your team has a monolith. How do you find the first service to extract?"**

- Look for an area with a clear boundary, little shared data, and a real reason to move.
- Good reasons: different load, much more change, a separate team.
- Use the change history to see which areas change alone.
- See the [decomposing a monolith](/learn/decomposing-a-monolith) lesson for the patterns.

## Go deeper

- **Fundamentals of Software Architecture** (Richards, Ford), the part on component-based thinking: technical and domain partitioning, the component identification flow, the entity trap, and the approaches to find components.
- **Building Microservices** (Newman), the part on how to model microservices: information hiding, coupling and cohesion, DDD as a tool, and boundaries that do not come from the domain.
- **Domain-Driven Design** (Evans), the part on strategic design: bounded contexts and the language of the business. Read the [bounded contexts](/learn/bounded-contexts) lesson first.
- **Team Topologies** (Skelton, Pais), the part on fracture planes: how to cut a system so that each team owns one part.

## Further reading

- [Bounded context](https://martinfowler.com/bliki/BoundedContext.html), by Martin Fowler
- [Domain-driven design](https://en.wikipedia.org/wiki/Domain-driven_design) on Wikipedia
- [Event storming](https://en.wikipedia.org/wiki/Event_storming) on Wikipedia
- [Information hiding](https://en.wikipedia.org/wiki/Information_hiding) on Wikipedia, with a link to the paper by Parnas
