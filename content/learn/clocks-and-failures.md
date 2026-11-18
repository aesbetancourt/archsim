## Why distributed systems are different

A program on one computer is predictable. It works, or the computer crashes and the program stops. Hardware is designed so that a fault stops the machine, not that it gives a wrong answer.

A system on several computers does not behave like this. Some parts work while others fail, and the system cannot always tell which parts. This is a **partial failure**. It is also nondeterministic: the same request can succeed, fail, or succeed without an answer. Kleppmann describes these problems in DDIA, in the part on the trouble with distributed systems.

An architect needs this knowledge for three reasons:

- Each arrow in a diagram is a network call that can fail in ways that a function call cannot. See [Distributed architecture](/learn/distributed#what-a-network-adds).
- Many designs depend on time: a hold that expires, the order of two bids, a lock with a time limit. Clocks on different machines do not agree.
- Interviewers probe this area to see if a candidate knows where a design is fragile.

The rest of this page covers the three main sources of trouble: the network, the clocks, and the pauses. Then it shows the tools that make a system correct anyway.

## Unreliable networks

Most data centers and the internet use **asynchronous packet networks**. A node sends a packet, and the network gives no promise about when it arrives, or if it arrives. When a node sends a request and gets no reply, it cannot tell what occurred:

1. The request was lost.
2. The request waits in a queue, and it arrives later.
3. The remote node crashed.
4. The remote node is paused, and it continues later.
5. The remote node did the work, but the reply was lost.
6. The reply waits in a queue, and it arrives later.

From the sender's view, all six look the same. Cases 5 and 6 are the dangerous ones. The work was done, so a retry does it twice. A request that changes data must be safe to repeat. See [idempotency](/learn/distributed-transactions#idempotency).

Network faults are frequent, even inside one data center. Cables break, switches restart, a configuration change cuts a rack off, and a busy link drops packets. A **network partition** occurs when one group of nodes cannot reach another, while each group still works.

## Timeouts and unbounded delays

The only general way to detect a failed node is a **timeout**: if no reply arrives in a fixed time, treat the node as dead. There is no correct value.

| Timeout is | Benefit                         | Risk                                                                                  |
| ---------- | ------------------------------- | ------------------------------------------------------------------------------------- |
| Short      | Fast detection of real failures | Declares a slow node dead. Its work moves to other nodes, which can then overload too |
| Long       | Few false alarms                | Users wait a long time before the system reacts to a real failure                     |

A false alarm is not harmless. When the system declares a node dead, it moves the node's load to others. If the node was only slow because of high load, the others now get that load as well. This can spread until the whole system fails.

### Where the delay comes from

Network delay has no upper limit, mostly because of queues:

- A network switch queues packets when several senders use one link.
- The operating system queues packets when all CPU cores are busy.
- A virtual machine waits while the host runs another machine.
- TCP retransmits a lost packet after its own timeout, and the application sees only the delay.

Telephone networks are different. They reserve a fixed bandwidth for each call, so delay is bounded. Data networks do not do this, because they want high use of the link for bursty traffic. The result is variable delay. This is a trade-off, not a defect that a better network removes.

### How to set a timeout

1. Measure the distribution of response times in production, over a long period.
2. Set the timeout above a high percentile, such as the 99.9th, with a margin.
3. Prefer a failure detector that adapts to measured delays. Cassandra and Akka use the phi accrual failure detector, which does this.
4. Make the timeout of a caller longer than the sum of the timeouts and retries below it.

Nygard calls each remote call an integration point, and he treats a call without a timeout as a main cause of outages (Release It!). See [Resilience](/learn/resilience).

## Two kinds of clock

Each computer has a quartz clock, and it is not exact. A computer has two clocks that serve different purposes.

| Clock       | What it gives                               | Can jump                                    | Use it for                          | Example calls                                               |
| ----------- | ------------------------------------------- | ------------------------------------------- | ----------------------------------- | ----------------------------------------------------------- |
| Time-of-day | The current date and time, often since 1970 | Yes, back and forward, when NTP corrects it | A timestamp that a person reads     | `System.currentTimeMillis()`, `CLOCK_REALTIME`              |
| Monotonic   | A count that only increases                 | No. Its speed can change a little           | Durations: timeouts, response times | `System.nanoTime()`, `CLOCK_MONOTONIC`, `performance.now()` |

The value of a monotonic clock has no meaning by itself. It is not comparable between two computers. Only the difference between two readings on one machine is useful.

**Rule:** measure a duration with the monotonic clock. A timeout that uses the time-of-day clock can fire immediately, or never, when NTP moves the clock.

### How wrong clocks are

The **Network Time Protocol (NTP)** sets a clock from time servers over the network. Its accuracy is limited by the network delay. Some rough numbers:

- A quartz clock drifts. A drift of 200 parts per million, which some systems assume, is about 17 seconds a day.
- Over the internet, NTP keeps clocks within tens of milliseconds at best. When the network is busy, the error is larger.
- A server with a broken NTP configuration can be wrong by minutes, and nothing alerts you.
- A leap second, or a virtual machine that resumes after a pause, makes the clock jump.

A system that needs accurate time must monitor the clock offset of each node. It must remove a node whose clock drifts too far.

## Clock skew and last-write-wins

**Clock skew** is the difference between the clocks of two machines. It is dangerous when a system uses timestamps to order events across machines.

The common case is **last-write-wins (LWW)**. Many databases with multi-leader or leaderless replication resolve a conflict this way: keep the write with the highest timestamp, and drop the other.

Example: a parcel service stores the status of each parcel in a replicated store.

1. Node A, whose clock is 80 ms fast, records "out for delivery" at 10:00:00.080.
2. 30 ms later, node B, whose clock is correct, records "delivered" at 10:00:00.030.
3. The store keeps the write with the higher timestamp: "out for delivery".
4. The last real event, "delivered", is gone. No error occurs, and no log shows the loss.

The problems of LWW:

- A node with a fast clock wins against later writes from other nodes.
- Two writes in the same millisecond get an arbitrary order.
- LWW cannot tell a write that came after another from a write that occurred at the same time.

Use **logical clocks**, such as version numbers or version vectors, to order events. They count events, not seconds. See [Leaders, consensus, and coordination](/learn/consensus).

### Confidence intervals

A clock reading is really a range: the time is between two values. Most systems hide this range. Google Spanner exposes it. Its TrueTime API returns an earliest and a latest time, and it uses GPS receivers and atomic clocks to keep the range small, a few milliseconds. Before a commit, Spanner waits for the length of the range. Then the order of timestamps matches the real order of transactions. Without such hardware, do not assume that timestamps from two machines show the real order.

## Process pauses

A node can stop for a long time while it runs, and it does not know that it stopped. Causes:

- **Garbage collection.** A stop-the-world collection, for example in a Java or .NET runtime, stops all threads. It is usually short, but long pauses of seconds do occur.
- **A virtual machine** that the host suspends or moves to another host.
- **A laptop or device** that goes to sleep.
- **The operating system** switches to other threads, or the host gives the CPU to another virtual machine.
- **Disk access.** A thread waits for slow storage, or memory swaps to disk.
- **A signal** such as `SIGSTOP`.

After the pause, the code continues on the next line. It does not see that time passed.

The danger is a check followed by an action:

```text
if lease.isValid():        # true at 10:00:00
    # a garbage collection pause of 15 seconds occurs here
    writeToStorage(data)   # at 10:00:15, the lease expired
```

The lease was valid at the check. During the pause, it expired, and the system gave it to another node. Now two nodes think they own the resource. A shorter garbage collection pause does not fix this. You must design for pauses of any length.

## The truth is defined by the majority

A node cannot trust its own view of the system. It can think it is the leader while the others already elected a new one. It can think it is alive while the others declared it dead after a pause.

So distributed systems decide by **quorum**: a vote of more than half of the nodes. If a majority of nodes declares a node dead, it is dead, and it must accept this when it returns. Two majorities always share at least one node, so two groups cannot both make a decision that conflicts.

A majority quorum of 3 nodes survives the loss of 1. A quorum of 5 survives the loss of 2. Use an odd number of nodes, because an even number adds cost without more fault tolerance.

## Leases and fencing tokens

A **lease** is a lock with a time limit. A node that holds a lease can act on a resource until the lease expires. If the node crashes, the lease expires, and another node can take it. This is better than a lock without a limit, which stays forever when its owner crashes.

But a lease alone is not safe, because of pauses. The fix is a **fencing token**: a number that increases each time the lock service grants the lease.

Example: in a tutor marketplace, one worker at a time writes the daily payout file.

1. The lock service gives the lease to worker 1 with token 33.
2. Worker 1 pauses for garbage collection. Its lease expires.
3. The lock service gives the lease to worker 2 with token 34. Worker 2 writes the file with token 34.
4. Worker 1 continues and tries to write with token 33.
5. The storage has already seen token 34. It refuses token 33.

```diagram
{
  "nodes": [
    { "id": "lock", "label": "Lock service\n(gives tokens)", "shape": "box", "col": 0, "row": 1 },
    { "id": "w1", "label": "Worker 1\n(paused)", "shape": "box", "col": 1, "row": 0 },
    { "id": "w2", "label": "Worker 2", "shape": "box", "col": 1, "row": 2 },
    { "id": "store", "label": "Payout storage\n(highest token: 34)", "shape": "store", "col": 2, "row": 1 }
  ],
  "edges": [
    { "from": "lock", "to": "w1", "label": "lease, token 33" },
    { "from": "lock", "to": "w2", "label": "lease, token 34\n(after 33 expires)" },
    { "from": "w2", "to": "store", "label": "write, token 34:\naccepted" },
    { "from": "w1", "to": "store", "label": "write, token 33:\nrefused" }
  ]
}
```

Two points matter:

- **The resource must check the token.** The client cannot protect itself, because it does not know that it paused.
- **The token must come from a source that orders it reliably**, such as a consensus system. ZooKeeper and etcd give numbers that work as tokens. See [Leaders, consensus, and coordination](/learn/consensus).

If the storage cannot check tokens, a lease gives efficiency, not correctness. Two workers can still overlap. Kleppmann makes this point in his post on distributed locking, listed below.

## Byzantine faults

All of the above assumes that nodes are slow or broken, but honest. A **Byzantine fault** occurs when a node sends wrong or conflicting messages, by error or on purpose. Protocols that tolerate this need more than two-thirds of the nodes to be correct, and they are expensive.

Aircraft systems and blockchains need them. Most company systems do not, because all nodes belong to one organization. Simple checks still help against corrupt data: checksums on messages, and validation of input from users.

## System models

To reason about an algorithm, you state a **system model**: what the algorithm assumes can go wrong.

Models of timing:

| Model                 | Assumption                                                                   | Realistic?                             |
| --------------------- | ---------------------------------------------------------------------------- | -------------------------------------- |
| Synchronous           | Delays, pauses, and clock errors have known upper limits                     | No, for most systems                   |
| Partially synchronous | The system is synchronous most of the time, and sometimes exceeds the limits | Yes, the usual model                   |
| Asynchronous          | No timing assumptions at all, and no clocks                                  | Very strict; few algorithms work in it |

Models of node failure:

| Model          | What a node can do                                                        |
| -------------- | ------------------------------------------------------------------------- |
| Crash-stop     | It stops and never returns                                                |
| Crash-recovery | It stops and returns later. Data on disk survives; data in memory is lost |
| Byzantine      | Anything, including lies                                                  |

The usual choice for real systems is partially synchronous with crash-recovery.

An algorithm has two kinds of properties:

- **Safety:** nothing bad occurs. For example, two nodes never hold the same lock with the same token. If safety breaks, the damage is done, and you can point to the moment.
- **Liveness:** something good occurs eventually. For example, a request eventually gets a reply.

A good algorithm keeps safety in all cases of the model, and it gives liveness when the network is stable enough.

## Design rules

1. Put a timeout on each remote call. Base it on measured response times.
2. Make each request that changes data safe to repeat.
3. Measure durations with a monotonic clock.
4. Do not order events from different machines by their timestamps. Use version numbers or one sequencer.
5. Treat a lease as possibly lost after any pause. Protect the resource with fencing tokens.
6. Let a majority decide which node is the leader or which node is dead.
7. Monitor clock offset on each node.

## In a kata

- In [Gavel](/kata/gavel), a bid that arrives late or out of order has legal consequences. Do not order bids by the clocks of the browsers, or of several servers. Let one sequencer for each auction give each bid a number, and record the server time only for the audit.
- In [Tow Line](/kata/tow-line), phones have weak coverage. Requests time out and repeat, so each request needs an idempotency key. A job must go to one operator only: use a conditional write or a fenced lease, not a timer in the application.
- In [Front Row](/kata/front-row), a seat hold expires after a few minutes. Let the database decide expiry with its own clock in a conditional update. Do not compare the clocks of several application servers.

## Interview questions

**A service does not reply. What can have occurred, and what do you do?**

- The request or the reply was lost or delayed, or the service crashed or paused.
- The caller cannot tell these apart. The work can be done already.
- Use a timeout, retry with backoff and a limit, and make the operation idempotent.

**Why is last-write-wins dangerous?**

- It orders writes by timestamps from different clocks, which disagree.
- A node with a fast clock wins against later writes, and the system drops data without an error.
- Use version numbers or version vectors, or keep one leader for the data.

**What is the difference between a time-of-day clock and a monotonic clock?**

- Time-of-day gives a date and time, and it can jump back when NTP corrects it.
- Monotonic only increases, and it is good for durations on one machine.
- Never use time-of-day for timeouts, and never compare monotonic values across machines.

**A worker holds a lock with a time limit, pauses, and then writes. What goes wrong, and how do you fix it?**

- The lock expired during the pause, and another worker got it. Both write.
- The fix is a fencing token that increases with each grant.
- The storage refuses a write with a token lower than one that it saw.

**Why do clusters use 3 or 5 nodes, not 2 or 4?**

- Decisions need a majority, and two majorities always overlap.
- 3 nodes tolerate 1 failure, and 5 tolerate 2. 4 nodes also tolerate only 1.
- With 2 nodes, a partition leaves neither side with a majority.

## Go deeper

- Designing Data-Intensive Applications, Martin Kleppmann: the part on the trouble with distributed systems. It covers networks, clocks, pauses, fencing, and system models in depth.
- Release It!, Michael Nygard: the parts on integration points and timeouts. They show how slow responses spread failure in production.
- Site Reliability Engineering, Google: the part on managing critical state with consensus. It shows how Google uses consensus for leaders and locks, and why simpler methods fail.
- Fundamentals of Software Architecture, Mark Richards and Neal Ford: the part on the fallacies of distributed computing.

## Further reading

- [Fallacies of distributed computing](https://en.wikipedia.org/wiki/Fallacies_of_distributed_computing) and [Network Time Protocol](https://en.wikipedia.org/wiki/Network_Time_Protocol) on Wikipedia
- [How to do distributed locking](https://martin.kleppmann.com/2016/02/08/how-to-do-distributed-locking.html), by Martin Kleppmann, on fencing tokens
- [Byzantine fault](https://en.wikipedia.org/wiki/Byzantine_fault) on Wikipedia
