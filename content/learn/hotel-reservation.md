## The question

Try the [Hotel Booking kata](/kata/hotel-booking) before you read this page.

"Design the reservation system of a hotel group. A guest searches for hotels, looks at room types and prices, and books a room for some nights. Hotel staff manage rooms and prices. A room must never be sold twice."

The traffic of this case is small. The hard part is correctness under concurrency. Two guests try to book the last room at the same second. One guest presses "Book" twice. The payment succeeds, but the reservation service crashes before it records the result. The vocabulary that interviewers expect: inventory by date, idempotency key, pessimistic and optimistic locks, overbooking, and the consistency between services.

## Questions to ask first

| Question                                          | Why it changes the design                                                                                 |
| ------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| Does a guest book a room type or a specific room? | Most hotels sell a type, such as "double with sea view". The desk assigns the room number at check-in.    |
| Do guests pay at booking, or at the hotel?        | Payment at booking adds a payment flow and a hold that expires if the payment does not complete.          |
| Do we allow overbooking?                          | Many hotels sell a few rooms more than they have, because some guests cancel or do not arrive.            |
| How far ahead can a guest book?                   | This sets the number of inventory rows: one for each room type and each date.                             |
| Do prices change by date?                         | Usually yes. A price for each room type and each date is a separate table, read often and written seldom. |
| Can a guest cancel, and until when?               | A cancellation gives the rooms back to the inventory, and can start a refund.                             |
| Do other channels sell the same rooms?            | Travel agencies and booking sites keep their own copy of the availability. Then the copies can disagree.  |

For this page, assume: one hotel group, guests book a room type, payment at booking, overbooking allowed by a rule for each hotel, bookings up to two years ahead, and cancellations allowed.

Non-functional requirements:

- **Correctness:** the system never sells more rooms than the overbooking rule allows. A guest is never charged twice.
- **Concurrency:** many guests can try to book the same room type for the same dates at the same time.
- **Latency:** search and hotel pages are fast. A booking can take a second or two.
- **Availability:** search must stay up. A short pause in bookings is less harmful than a double sale.

## Estimates

Rough numbers, my own. See [Estimation](/learn/estimation) for the method.

- The group has 4,000 hotels and 500,000 rooms in all.
- Occupancy is about 70%, and the average stay is 3 nights. Each day, about 500,000 × 0.7 ÷ 3 ≈ 117,000 new reservations start.
- 117,000 reservations in 86,400 seconds is about 1.4 each second. Take a peak of ten times: about 14 each second.
- The funnel narrows at each step. Assume 10 hotel page views for each visit to the booking page, and 10 booking page visits for each completed booking. Then the hotel pages get about 1.4 × 100 = 140 views each second on average, and 1,400 at the peak.
- Inventory rows: 4,000 hotels × about 20 room types × 730 days ≈ 58 million rows. At about 50 bytes each, that is about 3 GB.
- Reservations: 117,000 a day × 365 ≈ 43 million rows a year. At about 500 bytes each, that is about 21 GB a year.

These numbers fit one relational database with replicas for reads. **Throughput is not the problem. The problem is that a few writes for the same row compete, and each one must be correct.**

## The first design

```diagram
{
  "nodes": [
    { "id": "guest", "label": "Guest app\nor browser", "shape": "actor", "col": 0, "row": 0 },
    { "id": "staff", "label": "Hotel staff", "shape": "person", "col": 0, "row": 2 },
    { "id": "gw", "label": "API gateway", "shape": "box", "col": 1, "row": 0 },
    { "id": "hotel", "label": "Hotel service\n(hotels, rooms)", "shape": "box", "col": 2, "row": 0 },
    { "id": "rate", "label": "Rate service\n(price by date)", "shape": "box", "col": 3, "row": 0 },
    { "id": "res", "label": "Reservation service", "shape": "box", "col": 2, "row": 1 },
    { "id": "db", "label": "Reservation DB\n(reservations,\ninventory)", "shape": "store", "col": 3, "row": 1 },
    { "id": "cache", "label": "Inventory cache", "shape": "store", "col": 1, "row": 1 },
    { "id": "pay", "label": "Payment service", "shape": "box", "col": 2, "row": 2 },
    { "id": "psp", "label": "PSP", "shape": "external", "col": 3, "row": 2 }
  ],
  "edges": [
    { "from": "guest", "to": "gw", "label": "search, book" },
    { "from": "gw", "to": "hotel" },
    { "from": "hotel", "to": "rate" },
    { "from": "gw", "to": "res", "label": "reserve\n+ key" },
    { "from": "res", "to": "db", "label": "one\ntransaction" },
    { "from": "res", "to": "cache", "label": "availability" },
    { "from": "db", "to": "cache", "label": "change\nevents", "async": true },
    { "from": "res", "to": "pay" },
    { "from": "pay", "to": "psp" },
    { "from": "staff", "to": "hotel", "label": "manage" }
  ]
}
```

- **The API gateway** authenticates the caller, applies rate limits, and routes each request.
- **The hotel service** serves hotel and room type data. This data changes seldom, so a CDN and a cache can serve most reads.
- **The rate service** gives the price of each room type for each date.
- **The reservation service** owns the inventory and the reservations. It is the only writer of both tables. This is the part that must be correct.
- **The payment service** charges the guest through a PSP (payment service provider). See [Payment system](/learn/payment-system).
- **The inventory cache** answers "how many rooms are free" for search pages. It is never the final check.
- **The hotel management service**, here part of the hotel service, lets staff change rooms, prices, and the overbooking rule. It is an internal tool with low traffic.

The API, in short:

| Method and path                  | Purpose                                                         |
| -------------------------------- | --------------------------------------------------------------- |
| `GET /v1/hotels?city=&from=&to=` | Search for hotels with free rooms for the dates                 |
| `GET /v1/hotels/{id}/rooms`      | Room types of one hotel, with the price for each date           |
| `POST /v1/reservations`          | Make a reservation. The body has the idempotency key            |
| `GET /v1/reservations/{id}`      | Show one reservation and its state                              |
| `DELETE /v1/reservations/{id}`   | Cancel a reservation. In practice, a state change, not a delete |

## Deep dives

### The data model: room types and inventory by date

A first idea is a table of rooms, and a reservation that points to one room. That model makes a simple question slow: "Is a double room free from the 3rd to the 6th?" The query must look at every room of that type and every reservation that overlaps the dates.

A better model counts rooms for each room type and each date:

| Table                 | Key                            | Main columns                                                 |
| --------------------- | ------------------------------ | ------------------------------------------------------------ |
| `hotel`               | `hotel_id`                     | name, address, overbooking percent                           |
| `room_type`           | `room_type_id`                 | `hotel_id`, name, capacity                                   |
| `room_type_rate`      | `hotel_id, room_type_id, date` | price in the smallest currency unit                          |
| `room_type_inventory` | `hotel_id, room_type_id, date` | `total_inventory`, `total_reserved`, `version`               |
| `reservation`         | `reservation_id`               | guest, hotel, room type, start date, end date, state, amount |

A stay of three nights touches three inventory rows, one for each night. A booking is valid only if each of the three rows has a free room. The check is simple: for each night, `total_reserved + rooms_wanted` must not be more than the limit.

A scheduled job adds a new row each day for the date two years ahead. Staff changes, such as a room closed for repair, change `total_inventory` for the affected dates.

The reservation is a **state machine**: `pending → paid → confirmed`, or `pending → expired`, and later `cancelled` or `refunded`. A pending reservation holds the rooms. If the payment does not complete in, for example, 15 minutes, a job moves it to `expired` and gives the rooms back. Without the expiry, abandoned checkouts slowly remove rooms from sale.

### Double-booking from a double click

A guest presses "Book", sees no answer, and presses again. Or the app retries after a timeout. Without protection, the system makes two reservations and charges twice.

The fix is an **idempotency key**: one value for one intended booking, sent with every attempt.

1. When the system shows the booking page, it creates a reservation ID and puts it in the page. A UUID or an ID from a [unique ID generator](/learn/unique-ids) is enough.
2. The client sends this ID with each attempt to book.
3. The reservation service inserts the reservation with this ID as the primary key.
4. A second insert with the same ID fails on the unique constraint. The service then returns the first reservation, not an error.

Make the key from the intent, not from the attempt. A new key on each click gives no protection. The same idea protects the call to the PSP. See [Idempotency](/learn/distributed-transactions#idempotency) and the [Payment system](/learn/payment-system) case.

Also disable the button after the first click. That helps the user, but it is not a guarantee: a retry from the network layer does not pass through the button.

### Double-booking from concurrency

The second cause is two different guests. One double room is left for the 4th. Guest A and guest B both read `total_reserved = 19` with `total_inventory = 20`. Both see one free room. Both write `total_reserved = 20`, and both get a confirmation. This is a race condition, a [lost update](/learn/transactions-isolation#lost-updates). Read committed, the default isolation level in many databases, does not stop it.

There are three common fixes.

**1. Pessimistic lock.** Lock the rows before the read, so that the second transaction waits:

```sql
BEGIN;
SELECT total_inventory, total_reserved
  FROM room_type_inventory
  WHERE hotel_id = 7 AND room_type_id = 3
    AND date >= '2027-03-03' AND date < '2027-03-06'
  ORDER BY date
  FOR UPDATE;
-- check the counts in the application, then:
UPDATE room_type_inventory SET total_reserved = total_reserved + 1 WHERE ...;
INSERT INTO reservation (...) VALUES (...);
COMMIT;
```

It is simple and always correct. The costs: transactions wait for each other, and a transaction that holds a lock too long blocks others. Two transactions that lock the same dates in a different order can deadlock, so always lock in date order. Keep the transaction short, and never call the PSP while it holds the lock.

**2. Optimistic lock with a version.** Read without a lock, and include the version that you read in the update:

```sql
UPDATE room_type_inventory
  SET total_reserved = total_reserved + 1, version = version + 1
  WHERE hotel_id = 7 AND room_type_id = 3 AND date = '2027-03-04'
    AND version = 41;
```

If the update changes zero rows, another transaction was first. Roll back, read again, and retry. There is no waiting, and it is fast when conflicts are rare. When many guests compete for the same dates, most attempts fail and retry, and the guests see errors. This is compare-and-set. See [Lost updates](/learn/transactions-isolation#lost-updates).

**3. Database constraint.** Let the database refuse an invalid state:

```sql
ALTER TABLE room_type_inventory
  ADD CONSTRAINT not_oversold
  CHECK (total_reserved <= total_inventory);
```

Then a plain `UPDATE ... SET total_reserved = total_reserved + 1` fails when it would sell too many. The rule lives in one place, and no code path can forget it. The costs: the rule is in the schema, so a change to it is a migration. A rule that depends on another table, such as an overbooking percent, is hard to put in a `CHECK`. Not every store supports such constraints.

| Option           | Correct under concurrency | Behavior under heavy contention  | Best fit                                 |
| ---------------- | ------------------------- | -------------------------------- | ---------------------------------------- |
| Pessimistic lock | Yes                       | Waits, and a risk of deadlocks   | High contention, short transactions      |
| Optimistic lock  | Yes                       | Many retries and failed bookings | Low to moderate contention               |
| Constraint       | Yes                       | Fast failures, clear errors      | A fixed rule that the schema can express |
| Read, then write | No                        | Double sales                     | Never                                    |

**The choice.** For a hotel, contention is moderate. Few guests want the same room type for the same night at the same second, except at a sale. A good default is one conditional update for all nights, in one transaction with the reservation insert:

```sql
UPDATE room_type_inventory
  SET total_reserved = total_reserved + 1
  WHERE hotel_id = 7 AND room_type_id = 3
    AND date >= '2027-03-03' AND date < '2027-03-06'
    AND total_reserved + 1 <= total_inventory;
-- the application checks that 3 rows changed, or it rolls back
```

The database takes a row lock for each row it changes, so two of these updates cannot both pass the condition. Keep the `CHECK` constraint as a second guard. If one row is very hot, for example a flash sale of 100 cheap rooms, change the design: see [Trade-offs and alternatives](/learn/hotel-reservation#trade-offs-and-alternatives).

### Overbooking as a business rule

Hotels know that some guests cancel late or do not arrive. A hotel that sells exactly its capacity has empty rooms on most nights. So many hotels sell a small percent more, and move a guest to a nearby hotel on the rare night when all guests arrive.

For the system, overbooking is a rule, not a bug. Store the percent for each hotel, or for each room type, and use it in the check:

```sql
AND total_reserved + 1 <= FLOOR(total_inventory * 1.05)
```

Here the limit for a room type with 20 rooms is 21. Three points matter in an interview:

- **The rule belongs to the business.** Revenue managers set it, and it changes. Keep it in data, not in code.
- **The limit is still a hard limit.** The concurrency fixes above protect 21 instead of 20. Overbooking does not make the race condition acceptable.
- **The desk needs a process.** When more guests arrive than rooms exist, staff need a list of overbooked nights and a way to move guests. The system can show the risk ahead of time.

### A monolith or services, and the consistency between them

The reservation and the inventory change together. If the reservation is saved but the inventory is not updated, the room is sold twice. If the inventory is updated but the reservation is lost, a room disappears from sale.

**Option 1: one service, one database.** The reservation service owns both tables. One local transaction updates both. This is the simplest and strongest option, and the load allows it. This is the choice for this page.

**Option 2: separate services.** A team wants a separate inventory service with its own database. Now one booking changes two databases, and there is no shared transaction. The options:

- **Two-phase commit** gives atomicity, but it blocks when the coordinator fails, and few modern stores support it across services. See [Two-phase commit](/learn/distributed-transactions#two-phase-commit).
- **A saga**: the reservation service records a pending reservation, the inventory service holds the rooms, and the payment service charges. If a step fails, earlier steps are undone by compensating steps, such as "release the hold". See [Saga](/learn/distributed-transactions#saga).
- **An outbox** makes each step's state change and its event atomic. See [The outbox](/learn/distributed-transactions#the-outbox).

A saga gives eventual consistency. For a short time, the inventory can show a room as held while the reservation is not yet confirmed. That is acceptable if the hold has an expiry and each step is idempotent. Ask whether the split gives enough benefit to pay for this. Often it does not: the inventory and the reservation are one [bounded context](/learn/bounded-contexts).

**The payment is always a separate system.** The PSP cannot take part in your transaction. So the order of steps matters:

1. In one transaction, update the inventory and insert the reservation as `pending`.
2. Charge the guest with the reservation ID as the idempotency key.
3. On success, move the reservation to `paid`. On a clear failure, move it to `cancelled` and release the rooms.
4. On a timeout, keep it `pending`, ask the PSP for the status, and wait for the webhook.

Hold the rooms before the charge. The opposite order can charge a guest for a room that is no longer free.

### Caching the inventory, and its risk

Search pages ask "how many rooms are free" for many hotels and many dates. These reads are far more frequent than bookings. A cache helps:

- **Key:** `hotel_id:room_type_id:date`. **Value:** the number of free rooms.
- **Fill:** the database is the source of truth. A [change data capture](/learn/cqrs-event-sourcing#change-data-capture) stream from the inventory table updates the cache after each commit.
- **Reads:** search and hotel pages read the cache. The booking itself always checks the database.

The risk is a stale cache. There are two kinds of error:

| The cache says | The truth | Effect                                                                  |
| -------------- | --------- | ----------------------------------------------------------------------- |
| Free           | Sold out  | The guest starts a booking, and the database refuses it. Annoying, safe |
| Sold out       | Free      | The hotel loses a sale. Costs money, but is safe                        |

Both are acceptable if the cache is only a hint. The dangerous design is to decrement the count in the cache and treat the cache as the truth. Then a cache restart or a lost update sells rooms that do not exist. See [How a cache fails](/learn/caching#how-a-cache-fails).

Keep the gap small: short time-to-live values as a backstop, and an alert when the change stream lags.

## Trade-offs and alternatives

| Decision                | This design                                  | Alternative                                  | When the alternative wins                                         |
| ----------------------- | -------------------------------------------- | -------------------------------------------- | ----------------------------------------------------------------- |
| What a guest books      | A room type, counted by date                 | A specific room                              | Small properties where the guest selects the room, such as cabins |
| Concurrency control     | Conditional update plus a `CHECK` constraint | Pessimistic or optimistic locks in the code  | Complex rules that SQL cannot express in one statement            |
| Reservation, inventory  | One service and one database                 | Separate services with a saga                | Separate teams, or inventory shared with many sales channels      |
| Availability for search | Cache filled by change events                | Read replicas only                           | Small scale, where replicas carry the read load                   |
| Hot sales               | Same path, with rate limits                  | A queue in front of the booking for one sale | A flash sale where thousands compete for a few rooms              |

For a flash sale, contention changes the problem. A [waiting room](/kata/waiting-room) or a queue lets in a limited number of buyers at a time. Another option is to split the hot row into several counters, each with part of the rooms, so that buyers compete on different rows.

When the system grows to many hotel groups, partition the inventory and the reservations by `hotel_id`. A booking touches one hotel, so each transaction stays on one partition. See [Partitioning](/learn/scaling-data#partitioning).

## What interviewers probe

**"Why not a table of rooms and a check for overlapping reservations?"**

- Guests book types, not rooms. The room number comes at check-in.
- Counting by date makes the availability check one row for each night.
- The overlap query is slow and hard to lock correctly.

**"The guest pressed the button twice. What happens?"**

- The reservation ID is created when the page is shown, and sent on each attempt.
- The primary key refuses the second insert. The service returns the first reservation.
- The same ID is the idempotency key for the charge.

**"Two guests want the last room. Walk me through it."**

- Read, then write is a lost update. Name the race.
- Fixes: a row lock, a version check, or a constraint or conditional update.
- The choice depends on contention. Lock in date order to avoid deadlocks.

**"How does overbooking change your design?"**

- It is a business rule with a percent stored in data.
- The limit is still enforced with the same concurrency control.
- Operations needs a view of overbooked nights.

**"You split inventory into its own service. How do they stay consistent?"**

- No shared transaction. Use a saga with holds that expire, and compensations.
- An outbox and idempotent consumers on each step.
- Ask first if the split is worth it. One database is often the better answer.

## Go deeper

- System Design Interview (Alex Xu and Sahn Lam), Volume 2, the chapter on a hotel reservation system: the data model by room type and date, the concurrency options, and the trade-off of splitting the services.
- Designing Data-Intensive Applications (Martin Kleppmann), the part on transactions: lost updates, write skew, explicit locks, compare-and-set, and serializable isolation.
- DDIA, the part on the future of data systems: constraints, end-to-end request IDs, and correctness without distributed transactions.
- Building Microservices (Sam Newman), the part on workflow across services: sagas and the cost of splitting data that changes together.

## Further reading

- [Optimistic concurrency control](https://en.wikipedia.org/wiki/Optimistic_concurrency_control) and [Overbooking](https://en.wikipedia.org/wiki/Overselling) on Wikipedia
- [Saga](https://microservices.io/patterns/data/saga.html) on microservices.io
- [Transactions and isolation](/learn/transactions-isolation) and [Distributed transactions](/learn/distributed-transactions) in this wiki
