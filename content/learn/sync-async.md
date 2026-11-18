## The choice

When one part needs something from another, it can call and wait for the answer (synchronous), or send a message and continue (asynchronous). In the diagrams of this app, a solid arrow is a call that waits, and a dashed arrow is a message that does not wait.

|                         | Synchronous call          | Asynchronous message                            |
| ----------------------- | ------------------------- | ----------------------------------------------- |
| The caller              | Waits for the answer      | Continues immediately                           |
| If the receiver is down | The caller fails or waits | The message waits in a queue                    |
| If the receiver is slow | The caller is slow        | Nothing visible to the caller                   |
| The result              | Known immediately         | Known later, or never by the caller             |
| To understand and debug | Easy: one path            | Harder: work occurs in several places and times |

This choice is one of the decisions that an interviewer reads first. It controls availability, latency, consistency, and how hard the system is to debug.

## Two questions, not one

Newman separates two questions that people often mix (Building Microservices, the part on communication styles).

1. **Does the caller block?** In a blocking call, the caller stops until the answer arrives. In a nonblocking call, the caller continues and handles the answer later.
2. **What is the shape of the collaboration?** In request-response, one part asks another for something and expects an answer. In event-driven collaboration, a part announces that something occurred. It does not tell anyone what to do.

The two questions are independent. A request-response can be nonblocking: the caller sends a request to a queue and reads the reply from a second queue later. An event is almost always nonblocking, because the publisher does not wait for anyone.

| Style                        | Example in a lunch shop                               | Coupling                                        |
| ---------------------------- | ----------------------------------------------------- | ----------------------------------------------- |
| Blocking request-response    | The till asks the payment service to charge the card  | Highest: both parts must be up at the same time |
| Nonblocking request-response | The till asks for a receipt PDF and gets a link later | The receiver can be down for a short time       |
| Event-driven                 | The till announces "order placed". The kitchen reacts | Lowest: the publisher does not know who listens |
| Common data                  | The till writes a daily file that accounting reads    | Coupled to the format of the data, not the time |

Newman lists common data as a fourth style. One part writes to a shared place, such as a file or a data lake, and others read it later. It is slow, but it is simple and handles very large volumes.

## Temporal coupling

**Temporal coupling** means that two parts must both be up at the same moment for the work to succeed. A blocking call always has it. A queue removes it: the producer can write while the consumer is down, and the consumer catches up later.

A queue removes only the coupling in time. The consumer still depends on the meaning and the format of the message. If the producer changes the format, the consumer breaks, with or without a queue. See [Encoding and evolution](/learn/encoding-and-evolution).

Richards and Ford make a related point (Fundamentals of Software Architecture, the part on architecture quanta). During a synchronous call, the two parts share their operational characteristics. If the caller must scale to 10,000 requests per second, the receiver must scale too. If the receiver is down, the caller is down. An asynchronous link lets each side have its own characteristics. See [Architecture quantum](/learn/architecture-quantum).

## When to wait

Use a synchronous call when the caller cannot continue without the answer.

- The user asks a question and must see the answer: "is this seat free?".
- The next step depends on the result: do not ship before the payment is confirmed.
- The answer must be consistent now. A read of your own last write is an example.
- The work is short, and the receiver is reliable and close.

A synchronous call is also easier to build, test, and trace. If all of the above are true, it is usually the correct choice. Asynchronous messaging is not a default. It is a tool with a cost.

## When not to wait

Use a message when the work can occur later, or when the caller does not care who reacts.

- Side effects of an action: send the email, update the search index, count the click.
- Work that takes long: convert a video, create a report.
- Load that arrives in bursts: a queue lets workers process at a steady rate.
- Several independent reactions to one occurrence.
- A receiver that is often slow or down, such as an external provider.

A good rule for a request from a user: do the minimum that makes the action true, answer the user, and do the rest in the background.

```diagram
{
  "nodes": [
    { "id": "user", "label": "Customer\n(phone app)", "shape": "actor", "col": 0, "row": 1 },
    { "id": "orders", "label": "Order service", "shape": "box", "col": 1, "row": 1 },
    { "id": "pay", "label": "Card provider", "shape": "external", "col": 1, "row": 0 },
    { "id": "db", "label": "Orders", "shape": "store", "col": 1, "row": 2 },
    { "id": "topic", "label": "order-placed\n(topic)", "shape": "pipe", "col": 2, "row": 1 },
    { "id": "kitchen", "label": "Kitchen screen", "shape": "box", "col": 3, "row": 0.5 },
    { "id": "email", "label": "Email sender", "shape": "box", "col": 3, "row": 1.5 }
  ],
  "edges": [
    { "from": "user", "to": "orders", "label": "place order" },
    { "from": "orders", "to": "pay", "label": "charge" },
    { "from": "orders", "to": "db", "label": "save" },
    { "from": "orders", "to": "topic", "label": "OrderPlaced", "async": true },
    { "from": "topic", "to": "kitchen", "async": true },
    { "from": "topic", "to": "email", "async": true }
  ]
}
```

The charge is a call that waits, because the order is not true until the card is charged. The kitchen and the email react to an event. If the email sender is down, the customer still gets the food.

## The cost of a chain of calls

If service A calls B, B calls C, and C calls D, and each is up 99.9% of the time, the chain is up only about 99.6% of the time. The delays also add up. Long synchronous chains are the most common fault in distributed designs. Shorten them: join parts that always call each other, or replace a call with data that the caller keeps as a copy.

### The arithmetic

For parts in a chain, multiply the availabilities. Each part must be up for the request to succeed.

| Parts in the chain, each 99.9% | Availability of the chain | Rough downtime in a year |
| ------------------------------ | ------------------------- | ------------------------ |
| 1                              | 99.9%                     | 9 hours                  |
| 4                              | 99.6%                     | 35 hours                 |
| 10                             | 99.0%                     | 3.6 days                 |

Redundant copies work the other way. Two copies of a part, each up 99%, give about 99.99%, if their failures are independent. Calculate the chance that both are down: 0.01 × 0.01 = 0.0001. The condition "independent" is important. Two copies on the same rack, with the same bad configuration, fail together.

Latency adds up in the same chain. If each of four calls takes 50 milliseconds at the median, the request takes at least 200 milliseconds. The slow tail is worse. A request that fans out to many parts waits for the slowest of them. See [Scalability](/learn/scalability).

### How to shorten a chain

1. **Join parts that always change and call together.** They are one service in two processes.
2. **Keep a local copy of the data you read.** Subscribe to events from the owner and keep the fields you need.
3. **Move work out of the path of the user.** Answer after the essential steps, and send an event for the rest.
4. **Call in parallel, not in sequence**, when the calls do not depend on each other.
5. **Give each call a timeout and a fallback.** See [Design for failure](/learn/resilience).

The local copy trades consistency for availability. The copy can be some seconds old. Decide if the use accepts that. See [Consistency](/learn/consistency).

## Asynchronous answers to a user

Sometimes the user needs a result, but the work takes too long to wait for in one request. Three patterns handle this.

| Pattern            | How it works                                                                   | Good for                                   |
| ------------------ | ------------------------------------------------------------------------------ | ------------------------------------------ |
| Status resource    | The server answers `202 Accepted` with a job address. The client asks it later | Reports, exports, video conversion         |
| Callback (webhook) | The client gives an address. The server calls it when the work is done         | Calls between companies, payment providers |
| Open connection    | The server pushes the result over a WebSocket or server-sent events            | Live screens: chat, delivery tracking      |

In all three, the first request must return a job identifier. The client then uses that identifier to find the result. Store the job state, so a second request with the same key does not start the work again.

For a request-response over queues, the sender puts a **correlation ID** on the request. The receiver copies it onto the reply. The sender uses it to match each reply to its request.

## Communication in a saga

Hard Parts treats communication as one of three dimensions of a distributed workflow (Software Architecture: The Hard Parts, the part on transactional sagas):

- **Communication:** synchronous or asynchronous.
- **Consistency:** atomic (all or nothing) or eventual.
- **Coordination:** orchestrated (one part directs the steps) or choreographed (each part reacts to events).

The three choices give eight combinations, and the book gives a name to each. The point for an interview: the choices interact. Asynchronous communication with atomic consistency is very hard to build, because a part must hold state while it waits for others. Asynchronous communication with eventual consistency and choreography scales well, but it is the hardest to follow and to debug. See [Distributed transactions](/learn/distributed-transactions).

## What asynchronous work requires

- The user interface must show a "pending" state.
- Each message can arrive twice, so the receiver must be [safe to repeat](/learn/distributed-transactions).
- Messages can arrive out of order.
- Somebody must watch the queue length and the failed messages. See [Messaging](/learn/messaging).
- The write to the database and the publish of the event must not get out of step. Use an outbox. See [Distributed transactions](/learn/distributed-transactions).
- A trace must cross the queue. Put a trace ID in each message, or the trace stops at the broker. See [Observability](/learn/observability).

## Common mistakes

| Mistake                                  | What occurs                                                                     | Better                                                   |
| ---------------------------------------- | ------------------------------------------------------------------------------- | -------------------------------------------------------- |
| A synchronous call inside a message loop | The worker is as slow and fragile as the call. The queue fills                  | A timeout, a limit on calls, and a retry later           |
| Waiting on a queue for an answer         | The design is synchronous, with extra parts and extra latency                   | A direct call, or a real asynchronous flow with a status |
| An event that is a hidden command        | "SendWelcomeEmail" from the user service. The publisher depends on one reaction | Publish "UserRegistered". Let the email part decide      |
| Each arrow is a message                  | The user waits for a result that nobody returns                                 | Call and wait for the part that makes the action true    |

## In a kata

Put a label on each arrow and select solid or dashed deliberately. The review reads this. A design where each arrow is a call that waits usually has an availability problem. A design where each arrow is a message usually has a place where the user needs an answer and does not get one.

For each solid arrow, be ready to say why the caller must wait. For each dashed arrow, be ready to say what the user sees before the work is done. In the [Lunch Rush kata](/kata/lunch-rush), the order and the payment wait, and the kitchen ticket is an event. In the [Notification Service kata](/kata/notification-service), almost every arrow after the first one is a message.

## Interview questions

**"Your checkout calls five services in sequence. What is wrong, and what do you change?"**

- Availability multiplies: five parts at 99.9% give about 99.5%. Latencies add.
- Find which calls make the order true. Keep only those in the path.
- Move the others to events after the answer: email, loyalty points, analytics.
- Call independent services in parallel, with timeouts.

**"When do you not use a queue?"**

- When the caller needs the answer to continue, and the work is short.
- When the extra parts cost more than the decoupling gives: a small team, low load.
- When the user must see a consistent result immediately.

**"What is temporal coupling, and does a queue remove all coupling?"**

- Both parts must be up at the same time. A blocking call has it.
- A queue removes it. The format and the meaning of the message stay shared.
- Changes to the message need the same care as changes to an API.

**"The user starts a report that takes ten minutes. Design the API."**

- `POST /reports` returns `202 Accepted` and a report ID, at once.
- A worker takes the job from a queue. The status is stored.
- The client asks `GET /reports/{id}`, or gets a push or a webhook when it is done.
- The same idempotency key returns the same job, not a second one.

## Go deeper

- **Building Microservices**, Sam Newman, the part on communication styles: blocking and nonblocking calls, request-response and event-driven collaboration, and common data.
- **Fundamentals of Software Architecture**, Mark Richards and Neal Ford, the part on architecture quanta: how a synchronous call couples the characteristics of two parts.
- **Software Architecture: The Hard Parts**, Ford, Richards, Sadalage, and Dehghani, the part on transactional sagas: communication, consistency, and coordination as three dimensions.
- **Designing Data-Intensive Applications**, Martin Kleppmann, the part on modes of dataflow: through databases, service calls, and asynchronous messages.
- **Release It!**, Michael Nygard, the part on integration points: why each call to another part is a risk to stability.

## Further reading

- [Request–response](https://en.wikipedia.org/wiki/Request%E2%80%93response) and [Message passing](https://en.wikipedia.org/wiki/Message_passing) on Wikipedia
- [What do you mean by "Event-Driven"?](https://martinfowler.com/articles/201701-event-driven.html), by Martin Fowler
