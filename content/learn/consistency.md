## Two meanings of one word

"Consistency" is used for two different things. Keep them apart.

- **Rules hold.** A seat has one owner. An account does not go below zero. This is the consistency of a [transaction](/glossary#transaction).
- **Copies agree.** All servers show the same value at the same moment. This is the consistency of a distributed system.

An interviewer who asks "is it consistent?" can mean either. Ask which one, or answer both.

## Transactions and ACID

A database transaction groups several changes. ACID names the four promises:

| Letter     | Promise                                                          | Without it                                                    |
| ---------- | ---------------------------------------------------------------- | ------------------------------------------------------------- |
| Atomic     | All changes occur, or none                                       | The money leaves one account and does not arrive in the other |
| Consistent | The rules of the data hold after the transaction                 | A seat with two owners                                        |
| Isolated   | Transactions that run at the same time do not disturb each other | Two buyers both see the seat as free                          |
| Durable    | A confirmed change survives a crash                              | A confirmed payment is gone after a restart                   |

Inside one database, transactions are cheap and reliable. This is a strong reason to keep data that must change together in one database. See [How to find component boundaries](/learn/boundaries).

Three points that interviewers like to test:

- **The C is the application's job.** The database can enforce some rules, such as a unique key or a foreign key. Most rules ("a tutor cannot have two lessons at 10:00") live in the code. Atomicity and isolation help the code keep its rules. Kleppmann makes this point (DDIA, the part on transactions).
- **Isolation has levels.** Few databases give full isolation by default. Most give a weaker level, such as read committed or snapshot isolation, that permits some anomalies. See [Transactions and isolation](/learn/transactions-isolation) for the levels and the anomalies.
- **Durable is not absolute.** A write is durable when it is on disk, or on several machines. A disk can fail, and all copies can fail together. Durability is a reduction of risk, not a guarantee.

## Copies and delay

When data is copied to several servers, a write reaches the copies at slightly different times. The difference is replication lag. It is usually under a second. Under load, or after a fault, it can grow to minutes. See [Replication and partitioning](/learn/scaling-data) for how copies are kept.

- **Strong consistency:** a read always returns the latest confirmed write. The system must wait for the copies to agree, so it is slower, and it stops if the copies cannot reach each other.
- **Eventual consistency:** a read can return an old value for a short time. The system is faster and stays up, and the application must tolerate old data.

"Eventual" is a weak promise. It says that the copies agree when writes stop. It does not say when. Between these two ends there is a range of guarantees, and most real designs need one of them.

## The range of guarantees

Each guarantee below prevents one kind of surprise. Linearizable is the strongest, and eventual is the weakest. The three in the middle are not a strict ladder: each one prevents a different surprise, and a design can need one without the others.

| Guarantee         | Promise                                                                | Surprise it prevents                                 |
| ----------------- | ---------------------------------------------------------------------- | ---------------------------------------------------- |
| Linearizable      | The system acts as if there is one copy, and each operation is instant | Any old read, for any user                           |
| Causal            | If one write depends on another, all users see them in that order      | An answer that appears before its question           |
| Consistent prefix | Users see writes in the order they occurred, with no gaps              | A conversation in the wrong order                    |
| Monotonic reads   | A user never sees time go backward                                     | A comment that is there, then gone, then there again |
| Read-your-writes  | A user always sees their own writes                                    | "I saved my profile, and my change is not there"     |
| Eventual          | The copies agree at some time after writes stop                        | Nothing in the short term                            |

Monotonic reads and read-your-writes are promises to one user, not to all users. They are cheap, and they solve most of the complaints that users make. Kleppmann describes them as the problems of replication lag (DDIA, the part on replication).

### Linearizability

Linearizability is the strong guarantee. Once any read returns a new value, every later read returns that value or a newer one. The system behaves as if there is one copy of the data.

You need it in a few places:

- **A lock or a leader election.** Two servers must not both think that they hold the lock.
- **A uniqueness rule.** Two users must not both get the username "ana", or the same seat.
- **Two channels that must agree.** A service saves an image, then sends a message "resize image 42". The worker must find the image when it reads the message.

The cost is latency. Each write must reach a majority of copies, or one leader, before it is confirmed. This cost exists even when the network is healthy, not only during a fault. A system across two regions pays the round trip between the regions on each write. See [Consensus](/learn/consensus) for how a group of servers agrees on one value.

Do not confuse linearizability with serializability. Serializability is an isolation level: transactions act as if they ran one after the other. Linearizability is about one value and the latest write to it. A database can give one and not the other.

### Read-your-writes

A tutor changes their price and reloads the page. The reload goes to a follower that is behind. The tutor sees the old price and thinks the save failed.

Ways to give read-your-writes:

1. Read data that the user can change from the leader. Read other data from followers.
2. For one minute after a user writes, send all their reads to the leader.
3. Remember the time or log position of the user's last write. Read only from a copy that is at least that far.

The third way is hard when one user has several devices. The phone does not know the position of the write from the laptop.

### Monotonic reads

A user opens a lesson's comments twice. The first read goes to a fresh copy and shows a new comment. The second goes to a copy that is behind, and the comment is gone. Time went backward.

The usual fix: send all reads of one user to the same copy, for example by a hash of the user ID. If that copy fails, the user moves to another, and the guarantee can break for a moment.

### Consistent prefix reads

A student asks "Is 10:00 free?" and the tutor answers "Yes". With partitioned data, the two messages can be in different partitions with different lag. A third user sees the answer before the question.

The fix: keep writes that depend on each other in one partition, for example by conversation ID. Or track which writes each write depends on.

### Causal consistency

Causal consistency generalizes the case above. If write B was made by someone who saw write A, every user sees A before B. Writes with no relation can appear in any order.

Kleppmann notes that causal consistency is the strongest guarantee that does not slow down with network delay and stays available during a partition (DDIA, the part on consistency and consensus). It is a good target when linearizability costs too much. The price is that the system must track which writes depend on which. That needs version numbers or vector clocks. See [Clocks and failures](/learn/clocks-and-failures).

## The CAP theorem

When the network between copies breaks (a partition), a system must select: refuse some requests to stay consistent, or answer all requests and permit the copies to differ. It cannot do both. Partitions do occur, so the real choice is between consistency and availability during a fault.

| The data is               | Prefer       | Reason                                   |
| ------------------------- | ------------ | ---------------------------------------- |
| Money, stock, seats       | Consistency  | A wrong answer costs more than no answer |
| Feeds, catalogs, counters | Availability | An old answer is better than an error    |

Most systems make this choice for each kind of data, not once for the whole system.

### The limits of CAP

CAP is a useful first idea, and a poor tool for detailed design. Kleppmann lists its limits (DDIA, the part on consistency and consensus):

- **It has one model of consistency:** linearizability. It says nothing about the guarantees between linearizable and eventual.
- **It has one kind of fault:** a network partition. It says nothing about slow networks, crashed servers, or full disks.
- **Its "available" is narrow.** In CAP, available means each server that is up answers each request. A system that sends users to the healthy side of a partition is not "available" in CAP terms, but users see no error.
- **"Pick two of three" is wrong.** You cannot select "no partitions". The network decides that, not you.

So "this is a CP system" or "this is an AP system" says little. Say what each operation does during a partition, and what it does on a normal day.

### PACELC

Daniel Abadi extended CAP with the normal case. The name reads as a rule: if there is a Partition, select Availability or Consistency; Else, select Latency or Consistency.

The second half is the one that matters most days. A partition is rare. The cost of strong consistency in latency is paid on every request.

| System style                      | During a partition | On a normal day                  |
| --------------------------------- | ------------------ | -------------------------------- |
| One leader, synchronous followers | Consistency        | Consistency                      |
| Leaderless, low quorum            | Availability       | Latency                          |
| Consensus across regions          | Consistency        | Consistency, with a slower write |

Many databases let you set this for each request. A read with a low quorum is fast and can be old. A read with a high quorum is slower and fresh.

## How to talk about it in a design

Do not write "eventually consistent" and stop. Say three things: which data can be old, for how long, and what the user sees. The Tutor Marketplace worked example does this: the search index is minutes behind, and the booking service checks the slot again before it confirms.

A useful method for each kind of data:

1. Name the rule that must never break: "a slot has at most one booking".
2. Put that rule in one place that is strongly consistent, usually one database row with a constraint.
3. Let all other copies be eventual: search, feeds, counters, caches.
4. Give each user read-your-writes for their own changes.
5. Say what the user sees while a copy is behind.

## Interview questions

**"What is the difference between strong and eventual consistency?"**

- Strong: each read returns the latest confirmed write. Eventual: copies agree only after writes stop.
- Name the cost of strong: latency on each write, and refusal during a partition.
- Name the guarantees in the middle: read-your-writes, monotonic reads, causal.

**"Explain the CAP theorem. Is it still useful?"**

- During a partition, select consistency or availability.
- Name the limits: one consistency model, one fault, a narrow meaning of available.
- Add PACELC: on a normal day, the choice is latency or consistency.

**"A user updates their profile and does not see the change. Why, and what do you do?"**

- The read went to a follower with replication lag.
- Give read-your-writes: read own data from the leader, or track the last write position.
- Say what breaks when the user has several devices.

**"Where in this design do you need linearizability?"**

- Locks, leader election, and uniqueness rules, such as one booking for each seat.
- Everywhere else, a weaker guarantee is cheaper.
- Keep the linearizable part small, and name the store that gives it.

## In a kata

For each store in the design, write its guarantee next to it: "Bookings: one leader, strong" or "Search: eventual, about 1 minute behind". Then say which user action reads which store.

In the [Front Row kata](/kata/front-row), the seat must be linearizable: two buyers cannot get one seat. The list of seats on the map can be a few seconds old. In the [Chat Messaging kata](/kata/chat-messaging), the messages of one conversation need consistent prefix reads, so keep a conversation in one partition.

## Go deeper

- **Designing Data-Intensive Applications** (Martin Kleppmann), the part on replication: the problems of replication lag and the guarantees for one user. The part on consistency and consensus: linearizability, causality, and the limits of CAP. The part on transactions: what ACID really promises.
- **Building Microservices** (Sam Newman), the part on data: why consistency across services costs more than inside one.

## Further reading

- [ACID](https://en.wikipedia.org/wiki/ACID), [CAP theorem](https://en.wikipedia.org/wiki/CAP_theorem), and [Eventual consistency](https://en.wikipedia.org/wiki/Eventual_consistency) on Wikipedia
- [PACELC theorem](https://en.wikipedia.org/wiki/PACELC_theorem) and [Linearizability](https://en.wikipedia.org/wiki/Linearizability) on Wikipedia
- [Consistency models](https://jepsen.io/consistency), on the Jepsen site
