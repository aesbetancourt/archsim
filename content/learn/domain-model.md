## What a domain model is

A domain model is code that expresses the business rules in the words of the business. An `Order` object that refuses to be cancelled after it is shipped is a domain model. A set of data classes with the rules spread over many service functions is not. The second form is sometimes called an anemic model.

The patterns on this page come from domain-driven design, which Eric Evans described in Domain-Driven Design. They are worth their cost when the rules are complex. For an application that only stores and shows data, they are too much.

The examples on this page come from a tutor marketplace. Learners book lessons with tutors. A tutor sets the times when they are free. A learner can cancel free of charge until 24 hours before the lesson.

## The ubiquitous language in code

Evans starts with language, not with classes. The team and the business experts agree on one set of words for the domain, and use them everywhere: in talk, in documents, in tests, and in the code. He calls this the ubiquitous language.

At code level, this has concrete effects:

| Without the language                   | With the language                              |
| -------------------------------------- | ---------------------------------------------- |
| `booking.setStatus("CANCELLED")`       | `booking.cancelByLearner(now)`                 |
| `BookingManager.process(data)`         | `BookLesson.execute(request)`                  |
| `if (b.st === 3 && diff < 86400000)`   | `if (booking.isInFreeCancellationWindow(now))` |
| A table `tbl_bkg` with a column `flg2` | A `Booking` with a `noShow` flag               |

The first column works. But a business expert cannot read it, and a developer cannot tell which rule it applies. In the second column, a sentence from the expert ("a learner cancels inside the free window") maps to one method.

The language also has a rule for change. When the experts change a word, or the team learns that a word means two things, the code changes too. A rename is a model change, not cosmetics. Words like `Manager`, `Processor`, `Helper`, and `Data` are a sign that a concept has no name yet.

A word means one thing only inside one boundary. "Lesson" can mean a booked time in the booking area and a set of exercises in the course area. That boundary is a [bounded context](/learn/bounded-contexts).

## The building blocks

| Block          | What it is                                                                                       | Example                                               |
| -------------- | ------------------------------------------------------------------------------------------------ | ----------------------------------------------------- |
| Entity         | An object with an identity that stays the same while its data changes                            | An order, a customer                                  |
| Value object   | An object defined only by its values. It does not change, and two with the same values are equal | Money (amount and currency), an address, a date range |
| Aggregate      | A group of entities and value objects that changes as one unit, with one entity as the root      | An order with its lines                               |
| Repository     | An interface that loads and saves whole aggregates                                               | `OrderRepository`                                     |
| Domain service | A rule that does not belong to one entity                                                        | A transfer between two accounts                       |
| Domain event   | A fact that the business cares about                                                             | "Order placed"                                        |
| Factory        | Code that creates a valid aggregate                                                              | Create an order from a cart                           |

## Entities

An entity has a thread of identity through its life. A booking is created, moved to a new time, paid, and at times cancelled. Its time, price, and status all change. It is still the same booking, because it has the same ID.

- **Equality is by ID.** Two bookings with the same time and price are still two bookings.
- **The ID must be stable and unique.** Generate it early, often in the application, so that the entity has it before it is saved. See [Unique IDs](/learn/unique-ids).
- **Keep entities focused.** Put on the entity the behavior that keeps its own rules true. Move attributes that only describe it into value objects.

A useful question: "If all the attributes change, is it still the same thing to the business?" If yes, it is an entity. If no, it is a value.

## Value objects

Value objects are the cheapest and most useful of these patterns. A price as a plain number can be added to a weight, can have the wrong currency, and can be negative. A `Money` value object makes these mistakes impossible, and the check is in one place. Use them freely.

Their properties:

- **Immutable.** To change a price, create a new `Money`. No other code can change a value that you hold.
- **Equal by value.** Two `Money(40, "EUR")` objects are equal.
- **Valid when created.** The constructor refuses a negative amount or an unknown currency. After that, no code needs to check again.
- **Behavior with no side effects.** `price.add(fee)` returns a new value and changes nothing.

Good candidates are everywhere: `LessonSlot` (a start and an end, in one time zone), `EmailAddress`, `Rating` (1 to 5), `Duration`. Each one removes a class of bugs and gives a name to a concept of the language.

## Aggregates: the important one for architects

An aggregate is a consistency boundary. Its rules are:

1. Outside code talks only to the root. To add a line, call the order. Do not change a line directly.
2. The root keeps the rules of the whole group true. "The total is the sum of the lines" is always correct, because all changes go through the root.
3. One [transaction](/learn/consistency) changes one aggregate.
4. One aggregate refers to another only by its ID.

Rule 3 is the link to system architecture. If two things must be consistent at each moment, they belong in one aggregate. If a short delay is acceptable, they are separate aggregates, and a domain event carries the change from one to the other. Small aggregates give fewer conflicts between users and are easy to move to separate stores or services later.

A common mistake is an aggregate that is too large: a customer that contains all its orders. Each new order then loads and locks the full history.

Evans defined the aggregate and its root. Vaughn Vernon (Implementing Domain-Driven Design) later wrote the design rules that most teams now use. Protect only true invariants inside the boundary. Design small aggregates. Refer to other aggregates by identity. Use eventual consistency outside the boundary.

```diagram
{
  "nodes": [
    { "id": "booking", "label": "Booking\n(root)", "shape": "module", "col": 0, "row": 0 },
    { "id": "slot", "label": "LessonSlot\n(value)", "shape": "module", "col": 0, "row": 1 },
    { "id": "price", "label": "Price: Money\n(value)", "shape": "module", "col": 1, "row": 1 },
    { "id": "tutor", "label": "Tutor\n(root)", "shape": "module", "col": 3, "row": 0 },
    { "id": "avail", "label": "Availability\n(entity)", "shape": "module", "col": 3, "row": 1 },
    { "id": "learner", "label": "Learner\n(root)", "shape": "module", "col": 2, "row": 2.4 }
  ],
  "groups": [
    { "id": "gb", "label": "Booking aggregate", "col": 0, "row": 0, "cols": 2, "rows": 2 },
    { "id": "gt", "label": "Tutor aggregate", "col": 3, "row": 0, "cols": 1, "rows": 2 }
  ],
  "edges": [
    { "from": "booking", "to": "slot" },
    { "from": "booking", "to": "price" },
    { "from": "tutor", "to": "avail" },
    { "from": "booking", "to": "tutor", "label": "tutorId only" },
    { "from": "booking", "to": "learner", "label": "learnerId only" }
  ]
}
```

### How to find the boundary

Start from the invariants: the rules that must be true after every change. List them with a business expert, and ask for each: "Is a short delay acceptable?"

| Rule                                                   | A delay acceptable? | Consequence                               |
| ------------------------------------------------------ | ------------------- | ----------------------------------------- |
| A booking has one slot and one price                   | No                  | Inside the booking aggregate              |
| A learner cancels free only outside the 24-hour window | No                  | A method on the booking                   |
| The tutor's average rating includes the newest review  | Yes, some seconds   | A separate aggregate, updated by an event |
| A tutor never has two bookings at the same time        | No                  | Needs a decision. See below.              |

The last rule crosses many bookings. There are three common options. Make a `TutorSchedule` aggregate for each tutor and day, which holds the booked slots and refuses a second booking at the same time. Or keep bookings separate and add a unique constraint in the database on the tutor and the start time. Or accept the rare conflict, detect it, and fix it with a message to the learner. The first keeps the rule in the model. The second is simple and strong. The third fits only when a conflict is cheap. Each is a real trade-off, and an interviewer expects you to name one and say why.

### Why small aggregates

- **Fewer conflicts.** Two learners who book different tutors never touch the same aggregate. With one large `Tutor` aggregate that holds all bookings, they would conflict for no reason.
- **Easy to move.** A small aggregate with ID references can move to another store or service later with no change to its rules.

### Concurrency inside one aggregate

Two requests can change one aggregate at the same time. The usual protection is optimistic concurrency. Each aggregate has a version number. A save succeeds only if the version in the store is the version that was loaded. Otherwise the save fails, and the use case reloads and tries again, or reports a conflict. Because one transaction changes one aggregate, the version on the root protects the whole group. See [Transactions and isolation](/learn/transactions-isolation).

## Domain services

Some rules do not belong to one entity or value. A domain service holds such a rule. Evans gives three signs. The operation is a domain concept that is not a natural part of one entity or value. Its interface uses other elements of the model. It has no state of its own.

Example: the price of a lesson depends on the tutor's rate, the learner's package, and a promotion. None of these three owns the calculation. A `LessonPricing` service takes all three and returns a `Money`.

Do not confuse it with two other kinds of service:

| Kind                   | Holds                                          | Example         | Ring                   |
| ---------------------- | ---------------------------------------------- | --------------- | ---------------------- |
| Domain service         | A business rule across objects                 | `LessonPricing` | Domain                 |
| Application service    | The steps of one use case, and the transaction | `BookLesson`    | Application (use case) |
| Infrastructure service | A technical capability                         | An email sender | Adapter                |

Use domain services rarely. If every rule moves into services, the entities become empty. That is the anemic model again.

## Domain events

A domain event records a fact that the business experts care about, in the past tense: `LessonBooked`, `BookingCancelled`, `TutorRated`. Evans added domain events to the pattern language after the first book. They are now a standard part of it.

Domain events do three jobs:

1. **Connect aggregates.** The booking aggregate raises `LessonCompleted`. A handler later updates the tutor's lesson count in another transaction. This is how rule 3 works in practice.
2. **Connect contexts and services.** An event published to a topic tells other parts of the system. See [Event-driven architecture](/learn/event-driven).
3. **Record history.** With [event sourcing](/learn/cqrs-event-sourcing), the events are the stored data.

Two practical rules. An event is raised by the aggregate, as part of a change, not by a controller. And an event that leaves the service is a public contract, so publish it through an outbox and version its schema. See [Encoding and evolution](/learn/encoding-and-evolution).

## Factories

A factory creates an aggregate that is valid from its first moment. Use one when the creation is more than a constructor call.

- A **factory method** on another object: `tutor.offerSlot(start, duration)` creates a slot that is inside the tutor's free times.
- A **separate factory**, when the creation needs data from several places, for example a booking made from a slot, a learner's package, and a price.
- **Reconstitution**: the repository rebuilds an aggregate from stored data. This path does not repeat the checks of creation, and it does not raise a "created" event.

A factory is not needed for every class. Most value objects and simple entities only need a constructor that refuses bad input.

## Repositories and ports

A repository is the [output port](/learn/hexagonal) for stored data. The core defines `OrderRepository` with methods such as `save(order)` and `findById(id)`. A database adapter implements it. The domain model does not know that SQL exists.

A repository works with whole aggregates. It is not a general query tool. Screens that need lists and reports can read the database more directly. See [CQRS](/learn/cqrs-event-sourcing).

Evans describes a repository as the illusion of a collection in memory: you add an aggregate, and you find it again later. Three rules follow:

- **One repository for each aggregate root,** not for each entity. There is a `BookingRepository`, but no `LessonSlotRepository`.
- **Methods in the language of the domain.** `findUpcomingForLearner(learnerId)` is better than `findByFilter(map)`.
- **No transaction control.** The use case owns the transaction. The repository works inside it.

## The anemic domain model

Martin Fowler named the anemic domain model as an anti-pattern. The classes have the names of the domain, but only fields with getters and setters. All the behavior lives in service classes that read and change the fields.

```ts
// Anemic: any code can set any status. The rule lives somewhere else, or nowhere.
booking.status = "CANCELLED";
booking.refund = booking.price;

// Rich: the rule lives with the data, and the method name is the business sentence.
booking.cancelByLearner(now); // refunds in full inside the free window, else refuses or charges
```

The problem is not the style itself. The problem is that you pay the cost of a domain model, with repositories, mapping, and ORM entities, and get none of its benefit. The rules are spread out and repeated. Nothing stops a service from leaving an object in an invalid state.

For simple applications, Fowler's transaction script is a fair choice: one procedure for each request, with the logic inside it. It is honest about what it is. The anemic model is the worst of both: the structure of objects, with the logic of scripts.

To move from anemic to rich, do it one rule at a time:

1. Find a rule that services repeat, such as "can this booking be cancelled?".
2. Move it into a method on the entity, and call that method from each service.
3. Make the field private, so the method is the only way to change it.
4. Repeat with the next rule.

## Strategic and tactical

Domain-driven design has two parts. The patterns here are the tactical part: how to write the code. The strategic part is about boundaries between areas of the business, and it matters more to an architect. See bounded contexts in [How to find component boundaries](/learn/boundaries), and the full treatment in [Bounded contexts](/learn/bounded-contexts).

The two parts connect. An aggregate lives inside one bounded context. A domain event is often the message that crosses from one context to another. A service boundary that cuts an aggregate in two is almost always wrong.

## In a kata

In the [Tutor Marketplace kata](/kata/tutor-marketplace), name the main aggregates: `Booking`, `Tutor`, `Learner`. Say that a booking refers to the tutor by ID. Then name the hard invariant, "no double booking of a tutor", and the option you choose for it. In the [Front Row kata](/kata/front-row), the same question appears as "never sell one seat to two buyers". There, a seat hold aggregate with optimistic concurrency, or a unique constraint on the seat and the show, is the center of the design.

## Interview questions

**"How do you decide the boundary of an aggregate?"**

- List the invariants that must be true after each change.
- Put in one aggregate only what must be consistent at once. Use events for the rest.
- Keep it small. Refer to other aggregates by ID.

**"Why change only one aggregate in one transaction?"**

- Fewer locks and conflicts between users.
- Each aggregate can move to a separate store or service later.
- Cross-aggregate rules then use domain events and eventual consistency.

**"What is the difference between an entity and a value object?"**

- An entity has an identity that lasts while its data changes. Equality is by ID.
- A value object is defined by its values, is immutable, and is valid when created.
- Prefer value objects. Most concepts are values.

**"What is an anemic domain model, and is it always bad?"**

- Domain classes with only data, and the rules in services.
- It costs the structure of a domain model and gives none of its protection.
- For simple applications, a transaction script is honest and fine.

**"A rule spans many aggregates. What do you do?"**

- Ask if a short delay is acceptable. If yes, use an event.
- If no, options: a new aggregate around the rule, a database constraint, or detect and fix.
- Name the trade-off of the option you pick.

## Go deeper

- **Domain-Driven Design** (Evans), the parts on the building blocks of a model-driven design and on the life cycle of a domain object: entities, values, services, aggregates, factories, and repositories.
- **Domain-Driven Design** (Evans), the part on the ubiquitous language: why the model and the code must use one set of words.
- **Software Architecture: The Hard Parts** (Ford, Richards, Sadalage, Dehghani), the parts on data ownership and transactional sagas: what happens when aggregates live in different services.

## Further reading

- [Domain-driven design](https://en.wikipedia.org/wiki/Domain-driven_design) on Wikipedia
- [DDD aggregate](https://martinfowler.com/bliki/DDD_Aggregate.html) and [Anemic domain model](https://martinfowler.com/bliki/AnemicDomainModel.html), by Martin Fowler
- [Value object](https://martinfowler.com/bliki/ValueObject.html) and [Domain event](https://martinfowler.com/eaaDev/DomainEvent.html), by Martin Fowler
- [DDD Reference](https://www.domainlanguage.com/ddd/reference/), by Eric Evans
