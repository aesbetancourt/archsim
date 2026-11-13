## The problem

A customer books a lesson. The booking service must reserve the slot, and the payment service must charge the card. They have separate databases, so no single [transaction](/learn/consistency) covers both. If the charge succeeds and the reservation fails, the customer paid for nothing.

The first answer is always: can these two things be in one service with one database? If yes, do that. The patterns below are for when the answer is no.

## Saga

A saga is a sequence of local transactions, one in each service. If a step fails, the saga runs a compensation for each step that was already done: an action that reverses it.

| Step | Action | Compensation |
|---|---|---|
| 1 | Reserve the slot | Release the slot |
| 2 | Charge the card | Refund the charge |
| 3 | Confirm the lesson | (last step) |

Two ways to run a saga:

- **Orchestration:** one coordinator tells each service what to do and tracks the state. It is easy to follow and to monitor. The coordinator is one more part to operate.
- **Choreography:** each service reacts to the event of the service before it. There is no central part. The full flow is hard to see, and it gets hard to change with more than three or four steps.

A saga is not a transaction. Between the steps, other users can see the half-done state, such as a reserved slot that will be released. The design must make that state visible as a real state: "pending".

## The outbox

A service changes its data and must also publish an [event](/glossary#event). If it writes to the database and then the publish fails, the other services never learn of the change.

With an outbox, the service writes the event into a table in its own database, in the same transaction as the data change. A separate process reads that table and publishes the events. The event is now published if and only if the change was saved. It can be published more than once, so receivers must tolerate repeats.

## Idempotency

In a distributed system, each request can arrive twice: the sender repeats after a timeout, or a queue delivers again. An operation is idempotent when the second arrival changes nothing.

The standard method is an [idempotency key](/glossary#idempotency-key): the sender puts a unique value on the request, and the receiver records each key it has handled. The Payment System and Agent Triggers worked examples both depend on this.

## How to use this in a design

1. Find each action that changes data in more than one service.
2. For each one, try to remove it by moving a boundary.
3. If it stays, name the steps, the compensations, and the "pending" state.
4. Make each step safe to repeat.
5. Add a check that finds the cases your logic missed. See [reconciliation](/glossary#reconciliation).

## Further reading

- [Saga pattern](https://microservices.io/patterns/data/saga.html) and [Transactional outbox](https://microservices.io/patterns/data/transactional-outbox.html) on microservices.io
