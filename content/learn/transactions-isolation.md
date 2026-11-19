## Why isolation matters

Many users change the same data at the same time. Two buyers click on one seat. Two dispatchers load one van. Two browser tabs spend one gift card. Each transaction is correct when it runs alone. When they overlap, the result can be wrong, and no error message tells you.

**Isolation** is the promise that a database gives about overlapping transactions. The strongest promise, serializability, says that the result is the same as if the transactions ran one after another. Most databases give a weaker promise by default, because the strong one costs performance. Each weaker level permits some specific errors, called **anomalies**.

An architect needs to know which anomalies the selected level permits, and which of them can break a rule of the business. Kleppmann covers it in DDIA, in the part on transactions.

## What ACID means

The [consistency lesson](/learn/consistency#transactions-and-acid) gives the four letters. The precise meanings are narrower than the names suggest.

| Letter      | What it really promises                                                                                 | Common misunderstanding                                                                                                                                            |
| ----------- | ------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Atomicity   | If a transaction fails part way, the database discards all its writes. "Abortability" is a better name. | That it is about concurrency. It is not.                                                                                                                           |
| Consistency | The data rules of the application hold after the transaction.                                           | That the database ensures this. The application defines the rules, and its transactions must keep them. The database checks only the constraints that you declare. |
| Isolation   | Overlapping transactions do not see each other's partial work.                                          | That every database gives full serializability by default.                                                                                                         |
| Durability  | A committed write survives a crash: it is on disk, or on several replicas.                              | That it is absolute. A failure of all copies loses data.                                                                                                           |

Atomicity lets the application retry safely after an error. Retry has its own traps:

- The transaction can succeed while the reply to the client is lost. A blind retry then does the work twice. Use an [idempotency key](/learn/distributed-transactions#idempotency).
- If the error is overload, a retry makes the overload worse. Use backoff and a limit, as in [Resilience](/learn/resilience#rules-for-retries).
- A transaction with side effects outside the database, such as an email, repeats those effects on retry.

## Read committed

**Read committed** is the default level in PostgreSQL, Oracle, and SQL Server. It gives two promises.

### No dirty reads

A **dirty read** is a read of data that another transaction wrote but did not commit yet. If that transaction then aborts, the reader acted on data that never existed. Read committed shows only committed data.

### No dirty writes

A **dirty write** overwrites data that another transaction wrote but did not commit yet. Example: buyers A and B both buy seat 14C. Each transaction sets the seat owner and then writes an invoice. If the steps interleave, the seat can belong to B while the invoice goes to A. Read committed prevents this: the second writer waits until the first commits or aborts.

### How databases do it

- For writes, the database locks each row that a transaction changes, until the transaction ends.
- For reads, most databases keep the old committed value of each changed row. Other transactions read that old value until the writer commits. So readers do not wait for writers.
- SQL Server is an exception. By default, its read committed level uses read locks, so readers wait for writers. The option `READ_COMMITTED_SNAPSHOT` changes this.

## Snapshot isolation and MVCC

Read committed still permits an error called **read skew**, also called a nonrepeatable read. A transaction reads two values at different moments and sees an inconsistent state.

Example: a lunch chain moves 20 sandwiches from shop A to shop B in one transaction. Before the move, A has 50 and B has 30, so the chain has 80. A stock report reads shop A and gets 50. Then the move commits. The report reads shop B and gets 50. The report says the chain has 100.

For one screen, a refresh fixes this. For a backup, a long report, or a check of the data rules, it is a real fault. A backup made this way can hold a state that never existed.

**Snapshot isolation** fixes read skew. Each transaction reads from a consistent snapshot of the database, as it was when the transaction started. Changes that commit later are not visible to it.

### Multi-version concurrency control

Databases implement snapshots with **multi-version concurrency control (MVCC)**. The database keeps several versions of each row.

1. Each transaction gets an ID from a counter that always increases.
2. Each row version records the ID of the transaction that created it, and later the ID of the transaction that deleted it.
3. An update writes a new version and marks the old one as deleted.
4. A reader sees a version only if its creator committed before the reader started, and no committed deleter existed at that time.
5. A background process removes versions that no transaction can still see. PostgreSQL calls this vacuum.

The key rule is that **readers never block writers, and writers never block readers.** Writes still take locks against other writes.

### Names differ between products

The SQL standard does not define snapshot isolation, so products use other names for it. PostgreSQL calls it "repeatable read". In Oracle, the level called "serializable" is snapshot isolation, which is weaker than true serializability. MySQL InnoDB has a "repeatable read" level that is similar but not equal. Read the documentation of your database. Do not trust the name of the level.

## Lost updates

A **lost update** occurs when two transactions read a value, change it, and write it back. The second write overwrites the first, so one change disappears. This pattern is a read-modify-write cycle.

Example: a sandwich has a stock of 10. Two orders arrive at the same time. Each transaction reads 10 and writes 9. The correct stock is 8. Snapshot isolation alone does not prevent this, because both transactions read a valid snapshot.

There are four fixes.

### Atomic write operations

Let the database do the read and the write in one step:

```sql
UPDATE stock SET count = count - 1 WHERE item_id = 42 AND count > 0;
```

The database locks the row for the duration of this one statement. This is the best fix when the change fits in one statement. Object-relational mappers often generate a read and a separate write instead, and they cause lost updates without a visible sign.

### Explicit locks

When the logic is too complex for one statement, lock the rows that you read:

```sql
SELECT * FROM seats WHERE show_id = 7 AND seat = '14C' FOR UPDATE;
```

Other transactions that want the same row wait until this one commits. The risk is that a developer forgets the lock in one code path.

### Automatic detection

Some databases detect a lost update under snapshot isolation and abort one of the transactions. PostgreSQL does this at its repeatable read level. MySQL InnoDB at repeatable read does not. The application must then retry the aborted transaction.

### Compare-and-set

Write only if the value did not change since you read it. A version column makes this simple:

```sql
UPDATE seats SET owner = 'A', version = 8 WHERE id = '14C' AND version = 7;
```

If the statement changes zero rows, another writer was first. Read again and decide again. This is optimistic locking. Make sure that your database checks the condition against the current row, not an old snapshot.

### Lost updates across replicas

Locks and compare-and-set assume one current copy of the data. With multi-leader or leaderless [replication](/learn/scaling-data#replication), two replicas can accept writes at the same time. Then the system must keep both versions and merge them, or use operations whose order does not matter, such as a counter increment. The common default, last write wins, loses updates. See [Partial failure, clocks, and pauses](/learn/clocks-and-failures).

## Write skew and phantoms

**Write skew** is the hardest anomaly to see. Two transactions read the same data, make a decision, and then each writes a **different** row. Neither write overwrites the other, so it is not a lost update. But each write changes the facts on which the other decision depended.

### Example: a van that is too full

A parcel van can carry 500 kg. It already holds 200 kg. Two dispatchers each assign one more parcel at the same moment.

1. Dispatcher A wants to add a 250 kg parcel. The transaction sums the load: 200 kg. 200 + 250 is below 500, so it inserts the assignment.
2. Dispatcher B wants to add a 200 kg parcel. The transaction sums the load from its snapshot: 200 kg. 200 + 200 is below 500, so it inserts the assignment.
3. Both commit. The van holds 650 kg.

Each transaction is correct alone. Snapshot isolation permits the result, because the two transactions wrote different rows.

The pattern always has three steps:

1. A query checks a condition: "the load is below the limit", "the slot is free", "the user has no account with this name".
2. The application decides from the result.
3. A write changes the result of the query in step 1.

### Phantoms

In the van example, a fix is easy: lock the van row with `SELECT ... FOR UPDATE` before the sum. Both transactions lock the same row, so the second waits.

Sometimes there is no row to lock. Example: a ticket seller permits at most 4 tickets for each buyer for one show. A buyer with no tickets opens two browser tabs and buys 3 tickets in each. Each transaction counts the buyer's tickets for the show: zero. Each inserts 3. The buyer has 6.

The query looked for rows that did not exist yet. A write in one transaction that changes the result of a search in another is a **phantom**. Locks on existing rows do not stop it.

### Fixes for write skew

| Fix                         | How it works                                                                     | Limit                                              |
| --------------------------- | -------------------------------------------------------------------------------- | -------------------------------------------------- |
| A constraint                | A unique constraint, or a check that the database enforces                       | Works only for rules that a constraint can express |
| Lock the rows you depend on | `SELECT ... FOR UPDATE` on the rows that the decision uses                       | Fails for phantoms: no row to lock                 |
| Materialize the conflict    | Make a row to lock, such as one row for each buyer and show, with a ticket count | Moves a concurrency detail into the data model     |
| Serializable isolation      | The database prevents the anomaly                                                | Costs performance, and needs retries               |

A unique constraint solves the case of two users who claim one username. For most other rules, serializable isolation is the clean fix.

## The isolation levels compared

| Level              | Prevents                                                            | Allows                                                                                                                    |
| ------------------ | ------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| Read uncommitted   | Dirty writes                                                        | Dirty reads, read skew, lost updates, write skew, phantoms                                                                |
| Read committed     | Dirty writes, dirty reads                                           | Read skew, lost updates, write skew, phantoms                                                                             |
| Snapshot isolation | Dirty writes, dirty reads, read skew, phantoms in read-only queries | Write skew, phantoms that cause write skew. Lost updates in some products: PostgreSQL detects them, MySQL InnoDB does not |
| Serializable       | All of the anomalies on this page                                   | None of them. The cost is waits or aborts                                                                                 |

## Serializable isolation

Three methods give true serializability.

### Actual serial execution

The simplest method is to run one transaction at a time, on one thread. There is no concurrency, so there are no anomalies. VoltDB and Redis work this way, and so did H-Store, a research system.

It is practical only with these conditions:

- The data fits in memory, so no transaction waits for the disk.
- Each transaction is short. The application sends it as one unit, often as a stored procedure, not as a conversation of many network round trips.
- The write rate fits one CPU core. To grow, you partition the data and give each partition its own thread. A transaction that touches several partitions is much slower.

### Two-phase locking

**Two-phase locking (2PL)** was the main method for about 30 years. Do not confuse it with two-phase commit, which is a different protocol. See [Leaders, consensus, and coordination](/learn/consensus).

1. A transaction that reads a row takes a shared lock. Several readers can hold it at the same time.
2. A transaction that writes a row takes an exclusive lock. It waits until no other transaction holds a lock on the row.
3. The transaction keeps all its locks until it commits or aborts.

Writers block readers and readers block writers. This is the opposite of snapshot isolation. To stop phantoms, the database also locks the conditions of searches, not only rows. In practice it locks ranges of an index, which is called index-range locking or next-key locking.

The costs:

- Throughput is lower, and response times are unstable. One slow transaction holds locks that many others wait for.
- **Deadlocks** occur when two transactions each wait for a lock that the other holds. The database detects them and aborts one, which must retry.

MySQL InnoDB and SQL Server use 2PL at their serializable level.

### Serializable snapshot isolation

**Serializable snapshot isolation (SSI)** is optimistic. It is from 2008. Transactions run on snapshots as in snapshot isolation, with no waits for reads. The database tracks what each transaction read. At commit, it checks if a premise of the transaction is now false:

- The transaction read a row that another transaction changed and committed after the snapshot.
- Another transaction wrote data that this transaction read, and committed first.

If so, the database aborts the transaction. The application retries it, and the retry sees the new data. In the van example, one dispatcher gets an error, retries, sums 450 kg, and refuses the parcel.

PostgreSQL uses SSI at its serializable level. CockroachDB uses serializable isolation by default. SSI works well when conflicts are rare and read-write transactions are short. With many conflicts, the abort rate grows and throughput falls.

| Method            | Waits                    | Main risk                         | Good for                                   |
| ----------------- | ------------------------ | --------------------------------- | ------------------------------------------ |
| Serial execution  | None, one at a time      | Limited to one core per partition | Small, fast transactions on data in memory |
| Two-phase locking | Readers and writers wait | Deadlocks, unstable latency       | Many conflicts, when aborts are expensive  |
| SSI               | No waits for reads       | Aborts under heavy conflict       | Few conflicts, mixed reads and writes      |

## Failure modes and traps

- **You assume the default is serializable.** PostgreSQL, Oracle, and SQL Server default to read committed. MySQL InnoDB defaults to its repeatable read. Write down the level that each critical transaction needs.
- **Read-modify-write in application code.** An ORM loads an object, changes a field, and saves it. Two requests lose an update. Use an atomic update or a version column.
- **A check in the application, then an insert.** "Is the slot free? Then book it." This is write skew. Use a constraint, a lock, or serializable isolation.
- **No retry for aborts.** Serializable levels abort transactions by design. The application must retry, with a limit, and the transaction must be safe to repeat.
- **Long transactions.** Under MVCC, a transaction that stays open for hours keeps old row versions alive and makes the database grow. Under 2PL, it blocks other work.
- **Isolation across services.** Each database isolates only its own transactions. Two services with two databases get no isolation from each other. See [Distributed transactions](/learn/distributed-transactions).

## In a kata

Find the one rule that must never break, and say how the design protects it.

- In [Front Row](/kata/front-row), the system must never sell one seat to two buyers. Write the hold as an atomic conditional update on the seat row, or as a unique constraint on show and seat. A check followed by an insert is not enough.
- In [Tutor Marketplace](/kata/tutor-marketplace), a booking that confirms a slot can use the same method. A limit across rows, such as a maximum number of lessons each week, is write skew. Use serializable isolation for that one transaction, or a row that holds the count.
- In [Lunch Rush](/kata/lunch-rush), stock counters need atomic decrements, not a read and a write.

Then name the isolation level in the rationale. Say why the weaker default is enough for the other data.

## Interview questions

**What is the difference between a lost update and write skew?**

- A lost update: two transactions write the same row, and one overwrites the other.
- Write skew: two transactions read the same data and write different rows. Each write breaks the premise of the other.
- Snapshot isolation can detect lost updates in some products. It never prevents write skew.

**How does MVCC give snapshot isolation?**

- The database keeps several versions of each row, tagged with the IDs of the transactions that created and deleted them.
- A reader sees only versions that were committed when it started.
- Readers do not block writers. Old versions are removed when no transaction can see them.

**Two users book the last slot of a tutor at the same time. How do you stop a double booking?**

- A unique constraint on tutor and slot, if the rule is "one booking for each slot".
- Otherwise an atomic conditional update, or `SELECT ... FOR UPDATE` on the slot row.
- If the rule spans rows that do not exist yet, use serializable isolation, or make a row to lock.
- Retry on conflict, and make the booking safe to repeat.

**Compare two-phase locking with serializable snapshot isolation.**

- 2PL is pessimistic: transactions wait for locks, and deadlocks occur.
- SSI is optimistic: transactions run without waits and abort at commit if a premise changed.
- SSI is better with few conflicts. 2PL is better when conflicts are frequent and aborts are expensive.

**Why do databases not use serializable isolation by default?**

- The cost: waits and deadlocks with 2PL, aborts with SSI, one core with serial execution.
- Many applications work correctly at read committed.
- The application must handle retries at serializable levels.

## Go deeper

- Designing Data-Intensive Applications, Martin Kleppmann: the part on transactions. It defines each anomaly precisely and compares the three methods of serializability.
- Software Architecture: The Hard Parts, Ford, Richards, Sadalage, and Dehghani: the parts on transactional sagas and data ownership. They show what you lose when one transaction becomes several services.
- Building Microservices, Sam Newman: the part on database transactions across services. It explains why sagas replace them.

## Further reading

- [Isolation (database systems)](https://en.wikipedia.org/wiki/Isolation_%28database_systems%29), [Snapshot isolation](https://en.wikipedia.org/wiki/Snapshot_isolation), and [Two-phase locking](https://en.wikipedia.org/wiki/Two-phase_locking) on Wikipedia
- [Transaction isolation](https://www.postgresql.org/docs/current/transaction-iso.html), in the PostgreSQL documentation
- [Hermitage](https://github.com/ept/hermitage), Kleppmann's tests of the isolation levels of real databases
