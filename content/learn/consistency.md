## Two meanings of one word

"Consistency" is used for two different things. Keep them apart.

- **Rules hold.** A seat has one owner. An account does not go below zero. This is the consistency of a [transaction](/glossary#transaction).
- **Copies agree.** All servers show the same value at the same moment. This is the consistency of a distributed system.

## Transactions and ACID

A database transaction groups several changes. ACID names the four promises:

| Letter | Promise | Without it |
|---|---|---|
| Atomic | All changes occur, or none | The money leaves one account and does not arrive in the other |
| Consistent | The rules of the data hold after the transaction | A seat with two owners |
| Isolated | Transactions that run at the same time do not disturb each other | Two buyers both see the seat as free |
| Durable | A confirmed change survives a crash | A confirmed payment is gone after a restart |

Inside one database, transactions are cheap and reliable. This is a strong reason to keep data that must change together in one database. See [How to find component boundaries](/learn/boundaries).

## Copies and delay

When data is copied to several servers, a write reaches the copies at slightly different times.

- **Strong consistency:** a read always returns the latest confirmed write. The system must wait for the copies to agree, so it is slower, and it stops if the copies cannot reach each other.
- **Eventual consistency:** a read can return an old value for a short time. The system is faster and stays up, and the application must tolerate old data.

## The CAP theorem

When the network between copies breaks (a partition), a system must select: refuse some requests to stay consistent, or answer all requests and permit the copies to differ. It cannot do both. Partitions do occur, so the real choice is between consistency and availability during a fault.

| The data is | Prefer | Reason |
|---|---|---|
| Money, stock, seats | Consistency | A wrong answer costs more than no answer |
| Feeds, catalogs, counters | Availability | An old answer is better than an error |

Most systems make this choice for each kind of data, not once for the whole system.

## How to talk about it in a design

Do not write "eventually consistent" and stop. Say three things: which data can be old, for how long, and what the user sees. The Tutor Marketplace worked example does this: the search index is minutes behind, and the booking service checks the slot again before it confirms.

## Further reading

- [ACID](https://en.wikipedia.org/wiki/ACID), [CAP theorem](https://en.wikipedia.org/wiki/CAP_theorem), and [Eventual consistency](https://en.wikipedia.org/wiki/Eventual_consistency) on Wikipedia
