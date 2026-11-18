## The question

Try the [Payment System kata](/kata/payment-system) before you read this page.

"Design the payment system of a ticket marketplace. Buyers pay by card for tickets. The marketplace keeps a fee and pays the rest to event organizers later. A buyer must never be charged twice."

Most system design cases are about scale. This one is about correctness. The traffic is modest, but each error costs real money and trust. The external card provider can time out with no answer, every message can arrive twice, and the books must agree to the cent. The vocabulary that interviewers expect is precise: idempotency key, double-entry ledger, reconciliation, PSP, and PCI scope.

## Questions to ask first

| Question                                            | Why it changes the design                                                                 |
| --------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| Do we process cards ourselves, or use a PSP?        | Almost every company uses a PSP. Then the design is about integration, not card networks. |
| Pay-in only, or also pay-out to sellers?            | Pay-out adds balances for each seller and transfers to bank accounts.                     |
| Which currencies and countries?                     | Many currencies need exchange rates, and many countries need local payment methods.       |
| Charge at once, or authorize now and capture later? | A shop that ships goods often captures at shipment. Tickets are often captured at once.   |
| Refunds, in full or in part?                        | A refund is a new movement of money, with its own record and its own failure modes.       |
| What is the peak?                                   | A popular ticket release can be many times the average for some minutes.                  |

For this page, assume: one PSP, cards only, one currency, charge at once, refunds in full or in part, and pay-out to organizers each week.

Non-functional requirements:

- **Correctness:** never charge twice, and never lose a payment. This comes before latency.
- **Auditability:** each movement of money is recorded and can be explained years later.
- **Availability:** a checkout must work at the peak of a big ticket release.
- **Security:** the marketplace never stores card numbers.

## Estimates

Rough numbers, my own. See [Estimation](/learn/estimation) for the method.

- 2 million payments a day. 2 million in 86,400 seconds is about 23 each second on average.
- Peak: a big release can bring 20 times the average for a short time, so about 500 each second.
- Records: one payment makes a payment row, one or more payment orders, about three ledger entries, and some events. Say about 5 KB for each payment in all. That is 10 GB a day, or about 3.6 TB a year.
- Retention: financial records must be kept for many years, as the law of each country requires.

These numbers fit a well-run relational database with replicas, and partitions after some years. Throughput is not the hard part. **The hard part is that each request must have exactly one effect, on systems that fail in the middle.**

## The first design

```diagram
{
  "nodes": [
    { "id": "buyer", "label": "Buyer browser", "shape": "actor", "col": 0, "row": 0 },
    { "id": "checkout", "label": "Checkout\n(order service)", "shape": "box", "col": 1, "row": 0 },
    { "id": "pay", "label": "Payment service", "shape": "box", "col": 2, "row": 0 },
    { "id": "paydb", "label": "Payment DB\n(states, keys)", "shape": "store", "col": 3, "row": 0 },
    { "id": "exec", "label": "Payment executor", "shape": "box", "col": 1, "row": 1.2 },
    { "id": "wallet", "label": "Wallets\n(organizer balances)", "shape": "store", "col": 3, "row": 1.2 },
    { "id": "psp", "label": "PSP\n(hosted page)", "shape": "external", "col": 0, "row": 2.4 },
    { "id": "recon", "label": "Reconciliation", "shape": "box", "col": 1, "row": 2.4 },
    { "id": "ledger", "label": "Ledger\n(double-entry)", "shape": "store", "col": 2, "row": 2.4 }
  ],
  "edges": [
    { "from": "buyer", "to": "checkout", "label": "place order" },
    { "from": "checkout", "to": "pay", "label": "payment\n+ idempotency key" },
    { "from": "pay", "to": "paydb" },
    { "from": "pay", "to": "exec", "label": "payment order" },
    { "from": "exec", "to": "psp", "label": "register,\nask status" },
    { "from": "buyer", "to": "psp", "label": "card details" },
    { "from": "psp", "to": "pay", "label": "webhook", "async": true },
    { "from": "pay", "to": "ledger", "label": "entries" },
    { "from": "pay", "to": "wallet", "label": "credit\norganizer" },
    { "from": "psp", "to": "recon", "label": "settlement\nfile", "async": true },
    { "from": "recon", "to": "ledger", "label": "compare" }
  ]
}
```

- **The checkout service** owns the order. When the buyer pays, it sends a payment request with an idempotency key to the payment service.
- **The payment service** owns the payment and its state. It splits a payment into **payment orders**, one for each organizer when a cart has tickets from several. It records every state change in the payment DB.
- **The payment executor** sends each payment order to the PSP and records the answer. It is the only part that talks to the PSP.
- **The PSP** (payment service provider) is an external company that connects to the card networks and banks. It shows the buyer a hosted payment page.
- **The ledger** is the financial record: an append-only list of entries in double-entry form.
- **Wallets** keep the balance that the marketplace owes each organizer.
- **Reconciliation** compares the internal records with the PSP's settlement file each day.

## Deep dives

### The pay-in flow and the hosted payment page

The card number must never reach the marketplace's servers. A **hosted payment page** does this: the PSP shows the card form, either as a page or as a frame inside the checkout. The flow:

1. The buyer presses "Pay". Checkout sends a payment request to the payment service, with an idempotency key for this order.
2. The payment service stores the payment in the state "created". The executor registers it with the PSP, with the same key. The PSP returns a token for this payment.
3. The browser shows the PSP's payment page with that token. The buyer enters the card there. The card data goes only to the PSP.
4. The PSP asks the card network and the bank. It can also ask the buyer for extra authentication.
5. The PSP sends the browser back to the marketplace with a status. Do not trust this alone, because the buyer can close the tab first.
6. The PSP also sends a **webhook**: a server-to-server call with the final status. The payment service records "succeeded" or "failed".
7. On success, the payment service writes the ledger entries and credits the organizer's wallet. Checkout marks the order paid and issues the tickets.

Model each payment as a **state machine**: `created → pending → succeeded` or `failed`, and later `refunded` or `partly refunded`. Accept only valid moves. A late or repeated event that tries an invalid move is recorded and ignored.

### Idempotency and exactly-once

A network call can fail in three places: before the request arrives, during the work, or after the work while the answer travels back. The caller cannot tell which. So the caller retries, and the receiver must make a repeat harmless.

An **idempotency key** is a unique value that the caller makes once for one intended operation, and sends with every attempt. The receiver uses it like this:

1. Insert the key into a table with a unique constraint, in the state "in progress", in the same transaction as the new payment.
2. If the insert fails because the key exists, do not do the work again. If the first attempt is done, return its stored result. If it is still in progress, answer "try again later".
3. If the same key comes with a different request body, refuse it. That is a bug in the caller.
4. When the work completes, store the result with the key.

Choose the key from the business intent, not from the attempt. For a checkout, "order 4711, attempt 1" is a good key. A new random key on each click is not, because a double click then pays twice.

**Exactly-once is not a delivery guarantee.** No network can deliver a message exactly once. What you build is **at-least-once delivery plus idempotent receivers**. The sender retries until it gets an acknowledgement. Each receiver drops repeats by key. The effect is that each operation happens once. DDIA makes this point in its discussion of end-to-end correctness: a request ID that travels from the client to the database is the safe way to suppress duplicates. See also [Idempotency](/learn/distributed-transactions#idempotency).

Apply this on every hop: checkout to payment service, payment service to executor, executor to PSP, PSP webhook to payment service, and payment service to ledger and wallet.

### Timeouts, retries, and webhooks

Nygard calls a call to an external system an integration point, and the first place where systems break (Release It!). The PSP is exactly this.

**The unknown state.** The executor sends a charge and gets a timeout. The charge can have succeeded or not. Two wrong responses: mark it failed (but the buyer can be charged already), or send a new charge with a new key (then the buyer can be charged twice). The right response:

1. Keep the payment order in the state "pending".
2. Retry with the **same** idempotency key. The PSP returns the result of the first attempt if there was one.
3. Or ask the PSP for the status of that key.
4. Wait for the webhook, and reconcile at the end of the day if nothing else works.

**Retries.** Sort errors first:

| Error                                        | Retry?                                    |
| -------------------------------------------- | ----------------------------------------- |
| Timeout, connection error, server error      | Yes, with the same key                    |
| Rate limited by the PSP                      | Yes, after the wait that the PSP asks for |
| Card declined, wrong amount, invalid request | No. Tell the buyer, or fix the bug        |

Retry with **exponential backoff and a random part** (jitter), and a maximum number of attempts. See [Rules for retries](/learn/resilience#rules-for-retries). Put retries on a retry queue, not in a loop that holds a request open. After the last attempt, move the order to a **dead-letter queue**, a queue for messages that need a person, and alert. Use a circuit breaker on the PSP, so that a PSP outage fails fast and does not use all threads.

**Webhooks.** The PSP calls the marketplace when a status changes. Treat each webhook as untrusted, repeated, and out of order:

- **Check the signature.** The PSP signs each webhook with a shared secret. Refuse a webhook with a bad signature.
- **Deduplicate** by the PSP's event ID. The PSP retries until it gets a success answer, so repeats are normal.
- **Answer fast.** Store the event and answer with success at once. Process it from a queue. A slow answer makes the PSP retry.
- **Order does not matter.** Apply events through the state machine. A "succeeded" that arrives after a "refunded" does not move the payment back.
- **Do not depend on webhooks only.** A webhook can be lost. A job asks the PSP for the status of each payment that stays pending too long.

### The ledger and the wallet

**Double-entry.** Each movement of money is recorded as entries on at least two accounts. The debits and the credits of one movement must sum to the same amount. So the sum of all entries in the ledger is always zero, and money cannot appear or disappear without a record.

An example with my own numbers. A buyer pays $100 for tickets. The organizer gets $95, and the marketplace fee is $5:

| Account                 | Debit | Credit |
| ----------------------- | ----- | ------ |
| PSP receivable          | 100   |        |
| Owed to organizer       |       | 95     |
| Marketplace fee revenue |       | 5      |

Later, the PSP pays the marketplace $97 into its bank account, after a PSP fee of $3:

| Account         | Debit | Credit |
| --------------- | ----- | ------ |
| Bank account    | 97    |        |
| PSP fee expense | 3     |        |
| PSP receivable  |       | 100    |

The PSP receivable account is now back to zero for this payment. If it is not zero after settlement, something is wrong, and reconciliation finds it.

Rules for the ledger:

- **Append only.** Never update or delete an entry. A refund or a correction is a new set of entries.
- **Integers in the smallest unit**, such as cents, with a currency code. Never use floating-point numbers for money.
- **One transaction for one movement.** All entries of a movement are written together, or none.
- **Link each entry** to the payment, the payment order, and the idempotency key, for audit.

**The wallet.** The organizer's wallet is the balance that the marketplace owes. It is a view of the ledger: the sum of the "owed to organizer" entries minus the pay-outs. Keep it as a separate balance for fast reads, but treat the ledger as the truth.

**Consistency between internal services.** The payment state, the ledger, and the wallet must agree. Two options:

- **One database transaction.** If the payment service owns all three in one database, update them together. This is the simplest and strongest option, and enough for this load.
- **Separate services.** If the ledger and the wallet are separate services, the payment service writes its state change and an event in one local transaction, with an [outbox](/learn/distributed-transactions#the-outbox). A relay publishes the event. The ledger and the wallet consume it idempotently. Each step is a local transaction, as in a [saga](/learn/distributed-transactions#saga). A refund or a failed pay-out is a compensating set of entries, never a delete.

Avoid a two-phase commit across services and the PSP. The PSP does not take part in your transactions, so the boundary is always eventual.

### Reconciliation

Each component can be correct and the system can still be wrong. A webhook was lost, a bug wrote one entry twice, or the PSP made a mistake. **Reconciliation** is the last line of defense.

Each day, the PSP sends a **settlement file**: every transaction it processed, its fees, and the amount it paid out. The reconciliation job:

1. Reads the settlement file for the day.
2. Matches each line with the payment records and the ledger entries, by PSP reference and amount.
3. Also compares internal records with each other: payment states against ledger entries, and ledger sums against wallet balances.
4. Sorts each mismatch.

| Mismatch                                 | Response                                           |
| ---------------------------------------- | -------------------------------------------------- |
| Known cause, with a safe fix             | Fix it automatically, for example a missed webhook |
| Known cause, but money must move by hand | A task for the finance team                        |
| Cause unknown                            | Investigate. It can be a bug or a fraud signal.    |

Reconciliation runs after the fact, so it does not prevent errors. It makes sure that no error stays hidden. In an interview, name it without being asked.

### Security and PCI scope

PCI DSS is the security standard for systems that store, process, or send card data. Each system that touches a card number is "in scope" and must meet a long list of controls. The hosted payment page keeps card numbers away from the marketplace, so most of its systems are out of scope. The marketplace stores only the PSP's token and the last four digits for display.

Other points to mention briefly: TLS on every call, signed webhooks, secrets in a vault, least privilege for staff, an audit log, and a fraud check before a charge. See [Security](/learn/security).

## Trade-offs and alternatives

| Decision                | This design                                  | Alternative                        | When the alternative wins                                       |
| ----------------------- | -------------------------------------------- | ---------------------------------- | --------------------------------------------------------------- |
| Card form               | PSP hosted page                              | Own card form, own card processing | A very large company that wants lower fees and accepts PCI cost |
| Payment, ledger, wallet | One database, one transaction                | Separate services with an outbox   | Separate teams, or very high load                               |
| Final status            | Webhook, plus a status poll                  | Synchronous answer only            | Never for cards. Some local methods answer synchronously.       |
| Number of PSPs          | One                                          | Several, with routing              | Global scale, or when one PSP outage costs too much             |
| Wallet                  | A stored balance, checked against the ledger | Always calculated from the ledger  | Low volume, where the sum is cheap                              |

The central trade-off is availability against correctness. When the PSP is slow or the state is unknown, the design waits, retries with the same key, and reconciles. It does not guess. A buyer who waits a minute for a confirmation is a small problem. A buyer charged twice is a large one.

## What interviewers probe

**"How do you make sure the buyer is never charged twice?"**

- An idempotency key from the business intent, sent on every attempt.
- A unique constraint that stores the key with the result.
- The same key on retries to the PSP. At-least-once plus idempotent receivers.

**"The PSP timed out. What do you do?"**

- The state is unknown, not failed. Keep the order pending.
- Retry with the same key, or ask the PSP for the status.
- Webhook and reconciliation are the final safety nets.

**"Why double-entry?"**

- Each movement balances, so the ledger always sums to zero.
- Append-only entries give a full audit trail. Corrections are new entries.
- Imbalances show bugs at once.

**"How do you know that your records agree with the PSP?"**

- A daily settlement file, matched against payments and ledger.
- Internal reconciliation between payment, ledger, and wallet.
- Mismatches sorted into automatic fix, manual fix, and investigation.

**"How do you keep the payment service, ledger, and wallet consistent?"**

- One local transaction when they share a database.
- Otherwise an outbox and idempotent consumers, with compensating entries.
- No distributed transaction with the PSP. It cannot take part.

## Go deeper

- System Design Interview (Alex Xu), Volume 2, the chapter on a payment system: the pay-in and pay-out flows, the payment executor, the ledger, reconciliation, and handling of failed payments.
- System Design Interview (Alex Xu), Volume 2, the chapter on a digital wallet: balances at scale, and event sourcing for an audit trail.
- Designing Data-Intensive Applications (Martin Kleppmann), the part on the future of data systems, on correctness: the end-to-end argument and duplicate suppression with request IDs.
- DDIA, the part on transactions: the isolation that makes "check the key, then insert" safe.
- Release It! (Michael Nygard), the part on stability patterns: timeouts and circuit breakers at an integration point.

## Further reading

- [Double-entry bookkeeping](https://en.wikipedia.org/wiki/Double-entry_bookkeeping) and [Payment Card Industry Data Security Standard](https://en.wikipedia.org/wiki/Payment_Card_Industry_Data_Security_Standard) on Wikipedia
- [Idempotence](https://en.wikipedia.org/wiki/Idempotence) on Wikipedia
- [Transactional outbox](https://microservices.io/patterns/data/transactional-outbox.html) and [Saga](https://microservices.io/patterns/data/saga.html) on microservices.io
- [Distributed transactions](/learn/distributed-transactions) and [Resilience](/learn/resilience) in this wiki
