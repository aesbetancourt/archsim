## Divide by business area

There are two ways to cut a system into parts.

| | Technical partitioning | Domain partitioning |
|---|---|---|
| The parts are | Layers: screens, rules, data access | Business areas: orders, payments, menu |
| A new business feature touches | Each layer | Usually one part |
| Good for | Small systems, teams organized by skill | Systems that change often, teams organized by product |

Most modern designs divide by business area first. The reason is simple: the business asks for changes in business terms. "Add delivery partners" must land in one place.

## How to find the areas

1. **List the main actions** in the problem, with the words the business uses: place an order, change the menu, pay, notify.
2. **Group the actions that use the same data and change together.** "Charge the card" and "refund" belong together. "Change the menu" does not belong with them.
3. **Look at the words.** When one word means different things to different people, there is a boundary. "Product" for the warehouse is a box with a weight. "Product" for the shop is a page with a price. Domain-driven design calls each such area a bounded context.
4. **Give each area its data.** If two areas must write the same table, they are probably one area.

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

## A test for your boundaries

Take three changes that the business could ask for next year. For each one, count the parts you must change. If the answer is usually one, the boundaries are good.

## In a kata

Step 4 of the [method](/learn/method) asks for one clear responsibility for each box. Name boxes with business words. A box named "Service 2" or "Backend" shows that the boundary is not yet clear. See also [Modularity, cohesion, and coupling](/learn/modularity).

## Further reading

- [Bounded context](https://martinfowler.com/bliki/BoundedContext.html), by Martin Fowler
- [Domain-driven design](https://en.wikipedia.org/wiki/Domain-driven_design) on Wikipedia
