## The problem

A customer books a lesson. The booking service must reserve the slot, and the payment service must charge the card. They have separate databases, so no single [transaction](/learn/consistency) covers both. If the charge succeeds and the reservation fails, the customer paid for nothing.

The first answer is always: can these two things be in one service with one database? If yes, do that. The patterns below are for when the answer is no.

There are two families of answers. An atomic commit protocol, such as two-phase commit, makes several databases act as one transaction. A saga gives up the single transaction, and handles failure with more business steps. Most service architectures use sagas. You must still know two-phase commit, because interviewers ask why it is not the default.

## A saga, step by step

Follow one lesson booking through a saga with an orchestrator, from the happy path to three failures. The sections below explain each part in more detail. Use the buttons or the arrow keys.

```walkthrough
{
  "title": "A tutor marketplace books a lesson",
  "metrics": [
    { "id": "state", "label": "Booking state" },
    { "id": "slot", "label": "Slot status" },
    { "id": "money", "label": "Money taken", "unit": "USD" },
    { "id": "outbox", "label": "Messages in outbox" }
  ],
  "diagram": {
    "nodes": [
      { "id": "learner", "label": "Learner", "shape": "actor", "col": 0, "row": 1.25 },
      { "id": "orch", "label": "Booking\norchestrator", "shape": "box", "col": 1, "row": 1.25 },
      { "id": "sagadb", "label": "Booking DB\n(state, outbox)", "shape": "store", "col": 1, "row": 2.75 },
      { "id": "tutors", "label": "Calendar\nservice", "shape": "box", "col": 2, "row": 0 },
      { "id": "pay", "label": "Payment\nservice", "shape": "box", "col": 2, "row": 1.25 },
      { "id": "relay", "label": "Outbox relay", "shape": "module", "col": 2, "row": 2.75 },
      { "id": "msg", "label": "Message\nservice", "shape": "box", "col": 3, "row": 2.75 }
    ],
    "edges": [
      { "from": "learner", "to": "orch", "label": "book lesson" },
      { "from": "orch", "to": "sagadb", "label": "save state" },
      { "from": "orch", "to": "tutors", "label": "hold / release" },
      { "from": "orch", "to": "pay", "label": "charge" },
      { "from": "orch", "to": "msg", "label": "LessonBooked", "async": true },
      { "from": "sagadb", "to": "relay", "label": "new rows" },
      { "from": "relay", "to": "msg", "label": "LessonBooked", "async": true }
    ]
  },
  "steps": [
    {
      "kind": "problem",
      "title": "One booking, three services",
      "text": "A learner books a lesson with Ana, a tutor, on Tuesday at 17:00. The price is $40. The booking must hold the slot in the calendar service, charge the card in the payment service, and send a message to both people.\n\nEach service has its own database, so one transaction cannot cover all the steps. A booking orchestrator runs the steps in order, and it keeps the state of each booking in its own database.",
      "key": "A saga is a sequence of local transactions. Each step has a compensation that undoes its business effect.",
      "show": ["learner", "orch", "sagadb", "tutors", "pay", "msg"],
      "flow": ["learner>orch"],
      "focus": ["orch"],
      "metrics": { "state": "new", "slot": "free", "money": 0, "outbox": 0 }
    },
    {
      "kind": "technique",
      "title": "Hold the slot",
      "text": "The orchestrator saves the booking as \"slot pending\". Then it asks the calendar service to hold the slot for 10 minutes.\n\nThe slot is held, not booked. Other learners see it as not available. If the saga stops, the hold ends by itself. This pending state is a semantic lock: the data shows that a saga works on it.",
      "key": "Save the state before each step, so the orchestrator can continue after a crash.",
      "show": ["learner", "orch", "sagadb", "tutors", "pay", "msg"],
      "flow": ["orch>sagadb", "orch>tutors"],
      "focus": ["tutors"],
      "notes": { "tutors": "held for 10 min" },
      "metrics": { "state": "slot held", "slot": "held" }
    },
    {
      "kind": "technique",
      "title": "Charge the learner",
      "text": "The orchestrator saves \"charging\". Then it asks the payment service to charge $40, and the card is accepted.\n\nThe payment service commits the charge in its own database, and the orchestrator saves \"charged\". Each step commits at once. No lock crosses the services.",
      "key": "Put the steps that can fail before the step that cannot be undone.",
      "show": ["learner", "orch", "sagadb", "tutors", "pay", "msg"],
      "flow": ["orch>sagadb", "orch>pay"],
      "focus": ["pay"],
      "notes": { "pay": "charged $40" },
      "metrics": { "state": "charged", "money": 40 }
    },
    {
      "kind": "technique",
      "title": "Confirm and send the message",
      "text": "The orchestrator tells the calendar service to change the hold to a booking. It saves \"confirmed\" and publishes the event LessonBooked. The message service reads the event and sends a message to the learner and to Ana.\n\nThe saga is complete. The happy path is easy. The design work is in the failure paths.",
      "key": "A message to a person cannot be undone, so send it after the last step that can fail.",
      "show": ["learner", "orch", "sagadb", "tutors", "pay", "msg"],
      "flow": ["orch>tutors", "orch>msg"],
      "focus": ["msg"],
      "notes": { "tutors": "booked", "msg": "message to both" },
      "metrics": { "state": "confirmed", "slot": "booked" }
    },
    {
      "kind": "failure",
      "title": "The charge fails",
      "text": "A second learner books Ana's 18:00 slot. The hold succeeds. Then the payment service declines the card.\n\nThe slot is now held for a booking with no payment. Nothing rolls back by itself, because the hold is already committed. The orchestrator must undo the business effect of each step that succeeded.",
      "key": "In a saga, a failed step leaves the earlier steps committed.",
      "show": ["learner", "orch", "sagadb", "tutors", "pay", "msg"],
      "flow": ["orch>pay"],
      "focus": ["pay"],
      "notes": { "pay": "card declined" },
      "metrics": { "state": "charge failed", "slot": "held", "money": 0 },
      "changes": ["New booking: the 18:00 slot"]
    },
    {
      "kind": "technique",
      "title": "Compensate: release the slot",
      "text": "The orchestrator runs the compensations of the steps that succeeded, in reverse order. Here only the hold succeeded, so it asks the calendar service to release the slot. Then it saves \"cancelled\" and tells the learner that the card was declined.\n\nA compensation is a new action, not a rollback. For a short time, other learners saw the slot as taken. The release must succeed in the end, so the orchestrator retries it until it does.",
      "key": "A compensation undoes the business effect with a new transaction. It must be safe to retry.",
      "show": ["learner", "orch", "sagadb", "tutors", "pay", "msg"],
      "flow": ["orch>tutors", "orch>learner"],
      "focus": ["tutors"],
      "notes": { "tutors": "slot released", "learner": "card declined" },
      "metrics": { "state": "cancelled", "slot": "free" }
    },
    {
      "kind": "failure",
      "title": "A duplicate charge request",
      "text": "A third learner books the 19:00 slot. The orchestrator sends the charge, and the payment service charges $40. But the reply is lost on the network, and the orchestrator gets a timeout.\n\nThe orchestrator cannot know if the charge occurred, so it sends the charge again. Without protection, the payment service charges a second time, and the learner pays $80.",
      "key": "After a timeout, the caller cannot tell a lost request from a lost reply. So each step gets some requests twice.",
      "show": ["learner", "orch", "sagadb", "tutors", "pay", "msg"],
      "flow": ["orch>pay"],
      "focus": ["pay"],
      "notes": { "pay": "2 charges: $80" },
      "metrics": { "state": "charging", "slot": "held", "money": 80 },
      "changes": ["New booking: the 19:00 slot"]
    },
    {
      "kind": "technique",
      "title": "The idempotency key",
      "text": "The orchestrator puts an idempotency key on each charge, for example \"booking-512-charge\". The key stays the same when it sends the request again. The payment service saves the key and the charge in one transaction.\n\nWhen the same key arrives again, the payment service does not charge. It returns the result of the first charge. The learner pays $40 once, and the orchestrator saves \"charged\".",
      "key": "An idempotency key makes a repeat safe. The receiver returns the first result, not an error.",
      "show": ["learner", "orch", "sagadb", "tutors", "pay", "msg"],
      "flow": ["orch>pay"],
      "focus": ["pay"],
      "notes": { "pay": "same key: same result" },
      "metrics": { "state": "charged", "money": 40 }
    },
    {
      "kind": "technique",
      "title": "The outbox",
      "text": "The orchestrator saves \"confirmed\" and then publishes LessonBooked. If it crashes between these two actions, nobody gets a message. So it writes the event as a row in an outbox table, in the same transaction as the new state.\n\nAn outbox relay reads the new rows and publishes them. After a crash, it can publish a row twice. So the message service keeps the IDs of the events that it handled, and skips a repeat.",
      "key": "With an outbox, the event is published if and only if the change was saved.",
      "show": ["learner", "orch", "sagadb", "tutors", "pay", "msg", "relay"],
      "hide": ["orch>msg"],
      "flow": ["orch>sagadb", "sagadb>relay", "relay>msg"],
      "focus": ["sagadb"],
      "notes": { "sagadb": "state + outbox row", "msg": "skips known event IDs" },
      "metrics": { "state": "confirmed", "slot": "booked", "outbox": 1 }
    },
    {
      "kind": "recap",
      "title": "What you built",
      "text": "An orchestrator runs three steps: hold the slot, charge the card, confirm. It saves the state before each step. When the charge fails, it releases the slot. Each charge carries an idempotency key, so a repeat is safe.\n\nThe orchestrator writes each event to an outbox in the same transaction as the state. A relay publishes it, and the message service skips duplicates.",
      "key": "In a kata, name the steps, the compensation of each step, the pending states, and where each idempotency key is checked.",
      "show": ["learner", "orch", "sagadb", "tutors", "pay", "msg", "relay"],
      "hide": ["orch>msg"],
      "notes": { "relay": "row sent, marked done" },
      "metrics": { "outbox": 0 }
    }
  ]
}
```

## Two-phase commit

Two-phase commit (2PC) makes several databases commit together, or not at all. A coordinator runs it. Each database that takes part is a participant.

1. The coordinator starts a transaction on each participant. Each one makes its changes, and holds its locks.
2. **Phase 1, prepare.** The coordinator asks each participant: "can you commit?" A participant that says yes writes the changes to disk. From now on, it must commit if the coordinator says so. It can no longer decide alone.
3. The coordinator writes its decision to its own log. This is the commit point. If all said yes, the decision is commit. If one said no, or did not answer, the decision is abort.
4. **Phase 2, commit or abort.** The coordinator sends the decision to each participant. It retries until each one confirms.

### Why 2PC blocks

The weak point is the time between the two phases. A participant that said yes is "in doubt". It cannot commit, because the coordinator can still decide abort. It cannot abort, because the coordinator can already have decided commit.

If the coordinator crashes in that time, the participants wait. They keep their locks while they wait. Other transactions that need those rows also wait. The participants cannot agree among themselves, because none of them knows the decision. The wait ends only when the coordinator comes back and reads its log. If the log is lost, an operator must decide by hand. Kleppmann describes these in-doubt transactions and their locks in detail (DDIA, the part on distributed transactions).

Other costs:

- **Latency.** Each transaction needs two extra rounds of messages, and a disk write at each step.
- **Availability.** The transaction can commit only when all participants and the coordinator are up. With more participants, that is less likely.
- **The coordinator is a single point of failure,** unless it is itself replicated.

### XA

XA is the standard interface for 2PC across different products, for example a relational database and a message broker. The application server, or a library inside the application, is the coordinator.

XA works across products, but it has the problems above, and more. Many modern stores and cloud services do not support it. It supports only the features that all participants share. For example, it cannot detect a deadlock that spans two systems.

2PC inside one database product, between its own partitions, is common and works well. The product controls all parts. 2PC across services owned by different teams is rare. Newman advises against it for microservices (Building Microservices, the part on workflow).

## Saga

A saga is a sequence of local transactions, one in each service. If a step fails, the saga runs a compensation for each step that was already done: an action that reverses it.

| Step | Action             | Compensation      |
| ---- | ------------------ | ----------------- |
| 1    | Reserve the slot   | Release the slot  |
| 2    | Charge the card    | Refund the charge |
| 3    | Confirm the lesson | (last step)       |

Two ways to run a saga:

- **Orchestration:** one coordinator tells each service what to do and tracks the state. It is easy to follow and to monitor. The coordinator is one more part to operate.
- **Choreography:** each service reacts to the event of the service before it. There is no central part. The full flow is hard to see, and it gets hard to change with more than three or four steps.

```diagram
{
  "nodes": [
    { "id": "client", "label": "Student app", "shape": "actor", "col": 0, "row": 1 },
    { "id": "orch", "label": "Booking saga\n(orchestrator)", "shape": "box", "col": 1, "row": 1 },
    { "id": "state", "label": "Saga state\n(step, status)", "shape": "store", "col": 1, "row": 2.3 },
    { "id": "slots", "label": "Slot service", "shape": "box", "col": 2, "row": 0 },
    { "id": "pay", "label": "Payment service", "shape": "box", "col": 2, "row": 1 },
    { "id": "notify", "label": "Notification service", "shape": "box", "col": 2, "row": 2 },
    { "id": "psp", "label": "Card provider", "shape": "external", "col": 3, "row": 1 }
  ],
  "edges": [
    { "from": "client", "to": "orch", "label": "book" },
    { "from": "orch", "to": "state", "label": "save each step" },
    { "from": "orch", "to": "slots", "label": "1. reserve\n(or release)" },
    { "from": "orch", "to": "pay", "label": "2. charge\n(or refund)" },
    { "from": "orch", "to": "notify", "label": "3. confirm", "async": true },
    { "from": "pay", "to": "psp", "label": "charge" }
  ]
}
```

A saga is not a transaction. Between the steps, other users can see the half-done state, such as a reserved slot that will be released. The design must make that state visible as a real state: "pending".

In ACID terms, a saga gives atomicity in the end, through compensation. It does not give isolation. Two sagas can see and change each other's half-done data. The usual protection is a semantic lock: a status field, such as "pending", that tells other operations to wait or to refuse.

## The eight saga patterns

Ford, Richards, Sadalage, and Dehghani describe a saga by three choices, each with two options (Software Architecture: The Hard Parts, the part on transactional sagas):

- **Communication:** synchronous (the caller waits for the answer) or asynchronous (the caller sends a message and goes on).
- **Consistency:** atomic (all steps succeed, or all are reversed, before the workflow ends) or eventual (each step commits, and the system reaches agreement later).
- **Coordination:** orchestrated (a central coordinator) or choreographed (services react to each other).

Three choices with two options give eight patterns. The book gives each one a name:

| Name                 | Communication | Consistency | Coordination  | In short                                                                              |
| -------------------- | ------------- | ----------- | ------------- | ------------------------------------------------------------------------------------- |
| Epic Saga            | Synchronous   | Atomic      | Orchestrated  | Copies a monolith transaction. Simple to understand, tightly coupled                  |
| Phone Tag Saga       | Synchronous   | Atomic      | Choreographed | No orchestrator. Each service calls the next, and errors travel back along the chain  |
| Fairy Tale Saga      | Synchronous   | Eventual    | Orchestrated  | An orchestrator with relaxed consistency. A common, practical choice                  |
| Time Travel Saga     | Synchronous   | Eventual    | Choreographed | A chain of services, each passing the work on. Good for simple pipelines              |
| Fantasy Fiction Saga | Asynchronous  | Atomic      | Orchestrated  | Asks for atomicity with async calls. The orchestrator must track much in-flight state |
| Horror Story         | Asynchronous  | Atomic      | Choreographed | Atomicity with no coordinator and no waiting. The hardest to get right                |
| Parallel Saga        | Asynchronous  | Eventual    | Orchestrated  | An orchestrator that does not wait. Scales well, and is still easy to monitor         |
| Anthology Saga       | Asynchronous  | Eventual    | Choreographed | The loosest coupling and the best scale. The hardest flow to follow                   |

How to read the table:

- **Atomic and asynchronous fight each other.** An atomic saga must know the result of each step before it ends. Asynchronous steps make that slow to learn. The two atomic, asynchronous patterns are the hardest to build.
- **Eventual consistency removes much of the coupling.** The services do not need to undo each other at once. They report a state and fix problems later.
- **Orchestration helps when the workflow is complex** or has many error paths. Choreography helps when the workflow is simple and the scale is high.

A good default for a workflow with several error paths is an orchestrated, eventual saga: a Fairy Tale Saga, or a Parallel Saga when the steps can run without waiting. Move to choreography when the flow is short and stable, and throughput matters more than visibility.

## Compensating updates

A compensation is a new business action, not an undo. A refund is not "the charge never occurred". The card statement shows both. This is a semantic rollback: the business state is reversed, and the history stays. Newman stresses this point (Building Microservices, the part on sagas).

Compensations have their own problems:

- **A compensation can fail.** The refund call times out. The saga must retry it until it succeeds, so it must be idempotent. If it fails for good, a person must act.
- **Other parts saw the first change.** Between the charge and the refund, a receipt went out by email. You cannot take the email back. You can only send a second one.
- **Some steps cannot be reversed.** A lesson that occurred, or a parcel that left the warehouse. Put those steps last.
- **The saga holds no locks.** During compensation, another user can change the data. The compensation must check the current state, not assume it.

Two ways to reduce compensation:

1. **Order the steps.** Put the step most likely to fail first, and the step that cannot be reversed last. Newman gives this advice. If the card check fails often, check the card before you reserve the slot.
2. **Recover forward.** Some failures are short. Retry the failed step until it succeeds, instead of reversing the steps before it. Use backward recovery (compensation) only when the step cannot succeed.

## State management

The alternative to compensation is to accept the half-done state, and name it. Ford and his co-authors describe this as state management for sagas (Software Architecture: The Hard Parts, the part on transactional sagas).

The booking does not have two states, "booked" and "not there". It has several:

```diagram
{
  "nodes": [
    { "id": "req", "label": "Requested", "shape": "module", "col": 0, "row": 1 },
    { "id": "held", "label": "Slot held", "shape": "module", "col": 1, "row": 1 },
    { "id": "paid", "label": "Confirmed", "shape": "module", "col": 2, "row": 1 },
    { "id": "nopay", "label": "Payment failed\n(slot held 15 min)", "shape": "module", "col": 2, "row": 2 },
    { "id": "cancel", "label": "Cancelled", "shape": "module", "col": 3, "row": 2 }
  ],
  "edges": [
    { "from": "req", "to": "held", "label": "slot reserved" },
    { "from": "held", "to": "paid", "label": "charge ok" },
    { "from": "held", "to": "nopay", "label": "charge refused" },
    { "from": "nopay", "to": "paid", "label": "new card ok" },
    { "from": "nopay", "to": "cancel", "label": "time out" }
  ]
}
```

With states, a failed charge is not an error that undoes everything. It is the state "payment failed". The student gets 15 minutes to try another card, and the slot is still held. Only the time-out releases the slot. This is often a better user experience than an instant rollback.

Rules for state management:

- **Store the saga state in one place.** With orchestration, the orchestrator keeps it in its own database. With choreography, each service keeps its part, and a correlation ID links them.
- **Make each state visible.** The user, the support team, and the reports must all see "payment failed", not a missing booking.
- **Give each waiting state a time-out.** A saga that waits forever holds a slot forever.
- **Make each transition idempotent.** The event "charge ok" can arrive twice.

## Sagas in practice

Newman gives practical advice for sagas in a microservice system (Building Microservices, the part on workflow):

- **Model the saga as a business process.** Ask the domain experts what occurs when payment fails. They often have a better answer than "undo everything".
- **Prefer a small number of steps.** Each step adds a failure case and a compensation. A saga with eight services is a sign that the boundaries are wrong.
- **Watch for a fat orchestrator.** When the orchestrator holds the business rules, the services become thin data stores. Keep the rules in the services. The orchestrator only decides the order.
- **Make choreography visible.** Put a correlation ID on each event, and build a view of each saga from the events. Without that, nobody can answer "where is booking 42?".
- **Mix the two styles.** Use orchestration inside one team's area, and events between teams.

## The outbox

A service changes its data and must also publish an [event](/glossary#event). If it writes to the database and then the publish fails, the other services never learn of the change.

With an outbox, the service writes the event into a table in its own database, in the same transaction as the data change. A separate process reads that table and publishes the events. The event is now published if and only if the change was saved. It can be published more than once, so receivers must tolerate repeats.

The process that reads the outbox has two usual forms:

| Form                      | How it works                                                     | Trade-off                                    |
| ------------------------- | ---------------------------------------------------------------- | -------------------------------------------- |
| Polling                   | A worker reads new rows every second, publishes, marks them sent | Simple. Adds a small delay and database load |
| Change data capture (CDC) | A tool reads the database log and publishes each new outbox row  | Low delay. One more part to run              |

The outbox replaces 2PC between the database and the broker. That is the most common reason that teams want XA, and the outbox solves it with one local transaction.

## Idempotency

In a distributed system, each request can arrive twice: the sender repeats after a timeout, or a queue delivers again. An operation is idempotent when the second arrival changes nothing.

The standard method is an [idempotency key](/glossary#idempotency-key): the sender puts a unique value on the request, and the receiver records each key it has handled. The Payment System and Agent Triggers worked examples both depend on this.

Details that make it work:

- **Record the key and the change in one transaction.** If they are separate, a crash between them breaks the guarantee.
- **Return the first result on a repeat.** The second call must get the same answer as the first, not an error.
- **Keep the keys long enough.** Keep them at least as long as any sender can retry. A day is a usual rough value.
- **A key is for one operation.** A new key for the same intent makes a second charge.

## How to use this in a design

1. Find each action that changes data in more than one service.
2. For each one, try to remove it by moving a boundary.
3. If it stays, name the steps, the compensations, and the "pending" state.
4. Select the saga type: orchestrated or choreographed, atomic or eventual.
5. Order the steps: the most likely failure first, the step that cannot be reversed last.
6. Make each step safe to repeat.
7. Add a check that finds the cases your logic missed. See [reconciliation](/glossary#reconciliation).

## Interview questions

**"Why not use two-phase commit across the services?"**

- 2PC blocks: if the coordinator fails after prepare, participants wait with their locks.
- All participants must be up, so availability drops with each one.
- It couples the services' databases. Many stores and brokers do not support XA.

**"Design the checkout for an order across stock, payment, and shipping."**

- A saga with steps, compensations, and named states.
- Say orchestrated or choreographed, and why. Name the place that stores the saga state.
- Order the steps: reserve stock, charge, then ship last, because shipping cannot be reversed.

**"What happens if a compensation fails?"**

- Retry it, so it must be idempotent.
- After a limit, move it to a list for a person, and alert.
- A reconciliation job finds the cases that the saga missed.

**"How do you make sure an event is published when the data changes?"**

- The outbox: write the event in the same local transaction.
- A relay publishes it, at least once. Receivers remove duplicates by event ID.

**"Orchestration or choreography?"**

- Orchestration: one place that knows the flow, easy to monitor, risk of a fat orchestrator.
- Choreography: loose coupling and scale, but the flow is hard to see and change.
- Name the number of steps and error paths as the deciding factor.

## In a kata

In the [Payment System kata](/kata/payment-system), the charge, the ledger entry, and the merchant payout are separate steps. Show the saga, the idempotency key on each call to the card provider, and the reconciliation against the provider's report. In the [Tutor Marketplace kata](/kata/tutor-marketplace), the booking saga above is a good start. Name its states, and say what the student sees in each one.

## Go deeper

- **Software Architecture: The Hard Parts** (Ford, Richards, Sadalage, Dehghani), the part on transactional sagas: the eight patterns, their trade-offs, compensating updates, and state management.
- **Designing Data-Intensive Applications** (Martin Kleppmann), the part on distributed transactions and consensus: how 2PC works, why it blocks, and the problems of XA.
- **Building Microservices** (Sam Newman), the part on workflow: sagas in practice, semantic rollback, and why to avoid distributed transactions.

## Further reading

- [Saga pattern](https://microservices.io/patterns/data/saga.html) and [Transactional outbox](https://microservices.io/patterns/data/transactional-outbox.html) on microservices.io
- [Two-phase commit protocol](https://en.wikipedia.org/wiki/Two-phase_commit_protocol) and [X/Open XA](https://en.wikipedia.org/wiki/X/Open_XA) on Wikipedia
