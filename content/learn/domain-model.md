## What a domain model is

A domain model is code that expresses the business rules in the words of the business. An `Order` object that refuses to be cancelled after it is shipped is a domain model. A set of data classes with the rules spread over many service functions is not. The second form is sometimes called an anemic model.

The patterns on this page come from domain-driven design. They are worth their cost when the rules are complex. For an application that only stores and shows data, they are too much.

## The building blocks

| Block | What it is | Example |
|---|---|---|
| Entity | An object with an identity that stays the same while its data changes | An order, a customer |
| Value object | An object defined only by its values. It does not change, and two with the same values are equal | Money (amount and currency), an address, a date range |
| Aggregate | A group of entities and value objects that changes as one unit, with one entity as the root | An order with its lines |
| Repository | An interface that loads and saves whole aggregates | `OrderRepository` |
| Domain service | A rule that does not belong to one entity | A transfer between two accounts |
| Domain event | A fact that the business cares about | "Order placed" |
| Factory | Code that creates a valid aggregate | Create an order from a cart |

## Value objects

Value objects are the cheapest and most useful of these patterns. A price as a plain number can be added to a weight, can have the wrong currency, and can be negative. A `Money` value object makes these mistakes impossible, and the check is in one place. Use them freely.

## Aggregates: the important one for architects

An aggregate is a consistency boundary. Its rules are:

1. Outside code talks only to the root. To add a line, call the order. Do not change a line directly.
2. The root keeps the rules of the whole group true. "The total is the sum of the lines" is always correct, because all changes go through the root.
3. One [transaction](/learn/consistency) changes one aggregate.
4. One aggregate refers to another only by its ID.

Rule 3 is the link to system architecture. If two things must be consistent at each moment, they belong in one aggregate. If a short delay is acceptable, they are separate aggregates, and a domain event carries the change from one to the other. Small aggregates give fewer conflicts between users and are easy to move to separate stores or services later.

A common mistake is an aggregate that is too large: a customer that contains all its orders. Each new order then loads and locks the full history.

## Repositories and ports

A repository is the [output port](/learn/hexagonal) for stored data. The core defines `OrderRepository` with methods such as `save(order)` and `findById(id)`. A database adapter implements it. The domain model does not know that SQL exists.

A repository works with whole aggregates. It is not a general query tool. Screens that need lists and reports can read the database more directly. See [CQRS](/learn/cqrs-event-sourcing).

## Strategic and tactical

Domain-driven design has two parts. The patterns here are the tactical part: how to write the code. The strategic part is about boundaries between areas of the business, and it matters more to an architect. See bounded contexts in [How to find component boundaries](/learn/boundaries).

## Further reading

- [Domain-driven design](https://en.wikipedia.org/wiki/Domain-driven_design) on Wikipedia
- [DDD aggregate](https://martinfowler.com/bliki/DDD_Aggregate.html) and [Anemic domain model](https://martinfowler.com/bliki/AnemicDomainModel.html), by Martin Fowler
