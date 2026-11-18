## Two kinds of event

Richards and Ford separate two kinds of event (Fundamentals of Software Architecture, the part on event-driven architecture):

- An **initiating event** starts a business flow. It usually comes from outside: a customer places an order, a sensor sends a reading, a nightly timer fires.
- A **processing event** is made inside the system, as a part of the flow. A component that has finished its step tells the rest of the system what it did.

In a lunch shop, "customer placed an order" is the initiating event. "Payment taken", "order sent to kitchen", and "loyalty points added" are processing events.

The style has two main topologies. They differ in one question: **is there a central part that knows the flow?**

## Broker topology

In the broker topology, there is no central part. A light message broker, usually with topics, carries the events. Each **event processor** subscribes to the events that it cares about. After it finishes its work, it publishes a new processing event to say what it did.

```diagram
{
  "nodes": [
    { "id": "app", "label": "Order app", "shape": "actor", "col": 0, "row": 1 },
    { "id": "orders", "label": "Order\nprocessor", "shape": "box", "col": 1, "row": 1 },
    { "id": "t1", "label": "order-placed", "shape": "pipe", "col": 2, "row": 0 },
    { "id": "pay", "label": "Payment\nprocessor", "shape": "box", "col": 3, "row": 0 },
    { "id": "t2", "label": "payment-taken", "shape": "pipe", "col": 2, "row": 1.5 },
    { "id": "kitchen", "label": "Kitchen\nprocessor", "shape": "box", "col": 3, "row": 1.5 },
    { "id": "loyalty", "label": "Loyalty\nprocessor", "shape": "box", "col": 3, "row": 2.7 }
  ],
  "edges": [
    { "from": "app", "to": "orders", "label": "place order" },
    { "from": "orders", "to": "t1", "async": true },
    { "from": "t1", "to": "pay", "async": true },
    { "from": "pay", "to": "t2", "async": true },
    { "from": "t2", "to": "kitchen", "async": true },
    { "from": "t2", "to": "loyalty", "async": true }
  ]
}
```

The flow is a chain reaction. No component knows the full flow. Each one knows only what it reacts to and what it announces.

A good practice in this topology: **each processor announces what it did, even if no component listens now.** If the loyalty processor publishes "points added" and no one subscribes, the cost is small. Next year, a new marketing processor can subscribe with no change to the loyalty code. This is the main source of extensibility in the style.

### Trade-offs of the broker topology

| Gain                                                         | Cost                                                            |
| ------------------------------------------------------------ | --------------------------------------------------------------- |
| Processors are highly decoupled                              | No component controls the flow or knows when it is complete     |
| A new reaction is a new subscriber, with no change elsewhere | Error handling is hard: who knows that a step failed?           |
| High throughput and fast response                            | No restart: a failed flow cannot continue from where it stopped |
| Each processor scales and fails alone                        | Data across processors is consistent only after a delay         |

## Mediator topology

In the mediator topology, an **event mediator** knows the steps of the flow. The initiating event goes to the mediator, usually through a queue. The mediator then sends a message to each processor in the correct order, and waits for each answer when a step depends on the step before it.

```diagram
{
  "nodes": [
    { "id": "app", "label": "Order app", "shape": "actor", "col": 0, "row": 1 },
    { "id": "q", "label": "Initiating\nevent queue", "shape": "pipe", "col": 1, "row": 1 },
    { "id": "med", "label": "Order mediator\n(knows the steps)", "shape": "box", "col": 2, "row": 1 },
    { "id": "state", "label": "Flow state", "shape": "store", "col": 2, "row": 2.3 },
    { "id": "pay", "label": "Payment\nprocessor", "shape": "box", "col": 3, "row": 0 },
    { "id": "kitchen", "label": "Kitchen\nprocessor", "shape": "box", "col": 3, "row": 1 },
    { "id": "loyalty", "label": "Loyalty\nprocessor", "shape": "box", "col": 3, "row": 2 }
  ],
  "edges": [
    { "from": "app", "to": "q", "label": "order placed", "async": true },
    { "from": "q", "to": "med", "async": true },
    { "from": "med", "to": "state" },
    { "from": "med", "to": "pay", "label": "1. take payment", "both": true },
    { "from": "med", "to": "kitchen", "label": "2. prepare", "async": true },
    { "from": "med", "to": "loyalty", "label": "2. add points", "async": true }
  ]
}
```

The messages from a mediator are really **commands**: "take payment", "prepare the order". The messages in a broker topology are facts: "payment taken". See [Commands and events](/learn/messaging#commands-and-events).

The mediator can run steps in parallel where they do not depend on each other. Here, the kitchen and loyalty steps start at the same time after payment.

### Kinds of mediator

Richards and Ford suggest one mediator for each domain or each group of flows, not one for the full system. The complexity of the flow selects the tool:

| Flow                                    | Typical tool                                         |
| --------------------------------------- | ---------------------------------------------------- |
| Simple routing and error handling       | An integration framework, such as Apache Camel       |
| Many steps, conditions, and long waits  | A workflow engine, such as Temporal or a BPEL engine |
| Steps that wait for a person to approve | A business process (BPM) engine                      |

### Trade-offs of the mediator topology

| Gain                                               | Cost                                                      |
| -------------------------------------------------- | --------------------------------------------------------- |
| One place knows the flow and its state             | The processors are coupled to the mediator                |
| Errors are handled in one place                    | The mediator can become a bottleneck for throughput       |
| A failed flow can restart from the last good step  | The mediator is one more critical part to operate         |
| Better data consistency, because steps are ordered | Dynamic, unpredictable flows are hard to model in advance |

### How to choose a topology

| Choose the broker topology when                      | Choose the mediator topology when                     |
| ---------------------------------------------------- | ----------------------------------------------------- |
| The flow is short and simple                         | The flow has many steps, conditions, or error paths   |
| Throughput and extensibility matter most             | Control, recovery, and visibility matter most         |
| You expect new reactions to be added often           | The business must know when each flow is complete     |
| A step that fails can be fixed later, without a stop | A failure in one step must stop or reverse the others |

This is the same choice as choreography and orchestration in a [saga](/learn/distributed-transactions#saga). Many real systems use both: a mediator for the core flow, and broker-style topics for the side reactions around it.

## Asynchronous capabilities

The main gain of the style is that the sender does not wait. Two ideas are easy to mix up here:

- **Responsiveness** is how fast the user gets an acknowledgment.
- **Performance** is how fast the full work is done.

Take a tutor marketplace where a tutor posts a review of a lesson. A synchronous design checks the text, saves it, updates the tutor rating, and sends a notice. The tutor waits for all four steps, roughly a second or more. An asynchronous design saves the review, publishes "review posted", and answers at once, roughly tens of milliseconds. The full work takes the same time or longer, but the tutor waits less.

The cost is error handling. If the rating step fails after the user has seen "done", the system cannot tell the user in the same answer. The design must handle the failure later.

## Error handling: the workflow event pattern

Richards and Ford describe the **workflow event pattern** for this problem. It is a reactive pattern: the consumer does not stop when a message fails.

1. A processor gets a message that it cannot process, for example a review with a tutor ID that is not known.
2. The processor sends the message, with the error, to a **workflow processor**. Then it continues with the next message at once.
3. The workflow processor tries to repair the data. It can use rules, a lookup, or a person on a dashboard.
4. When the data is repaired, the workflow processor sends the message to the original queue again.
5. The original processor now processes it as a normal message.

The pattern keeps the throughput high when errors occur. It has two costs. The repaired message is now out of order. If the order of messages matters for one item, the processor must hold later messages for that item, or reject changes that are older than the stored state. And messages that no one can repair need a [dead-letter queue](/learn/messaging#patterns-for-workers) and an alert.

## Preventing data loss

An asynchronous flow can lose a message in three places. Each place has its own protection.

| Where the loss occurs                                     | Protection                                                                        |
| --------------------------------------------------------- | --------------------------------------------------------------------------------- |
| The producer sends, and the broker fails before it stores | Persistent queues, and a synchronous send: the broker confirms after it stores    |
| The consumer takes the message, then crashes              | Client acknowledge mode: the broker keeps the message until the consumer confirms |
| The consumer processes, then fails to save the result     | Confirm the message only after the database commit                                |

Richards and Ford call the last protection **last participant support**. The consumer commits its database change first. Then it confirms the message. If it crashes between the two, the message is delivered again. So the consumer must be safe to repeat: it must detect a message that it has already processed. See [Delivery promises](/learn/messaging#delivery-promises).

On the producer side, a service that writes to its database and then publishes can crash between the two steps. Use an [outbox](/learn/distributed-transactions#the-outbox) for this.

## Broadcast

A broadcast sends one event to each subscriber. The producer does not know who listens, or how many. A topic gives this. It gives the highest decoupling in the style: the producer has no list of receivers to change.

Use broadcast for facts that several parts react to, such as "menu changed" or "price list published". The cost is control. Each subscriber with access can read all the data in the event. Each new subscriber depends on the event format. Treat each event as a public contract, as in [API design](/learn/api-design#how-to-change-an-api).

## Request-reply over messaging

Some steps need an answer, but the team still wants a broker between the parts. Request-reply gives a pseudo-synchronous call over messaging. The two standard forms, from Hohpe and Woolf (Enterprise Integration Patterns):

1. **A correlation ID.** The sender puts a request on a request queue, with a unique message ID. It then waits on a shared reply queue for a reply whose correlation ID matches that message ID. The receiver copies the ID into the reply.
2. **A temporary reply queue.** The sender makes a new queue for each request and names it in the request. The receiver replies to that queue. The sender deletes the queue after it gets the answer.

The temporary queue is simpler for the sender, but the broker must make and delete a queue for each request. At high volume, this is a large load. The correlation ID scales better and needs a little more code.

A request-reply over messaging still needs a timeout. The answer can be late, or it can never arrive.

## Request-based or event-based

Richards and Ford compare the two models directly.

| Request-based model                                 | Event-based model                                         |
| --------------------------------------------------- | --------------------------------------------------------- |
| A component asks for data or an action, and waits   | A component announces a fact, and does not wait           |
| Good for well-structured requests: "show my orders" | Good for flexible reactions: "an order was placed"        |
| Certainty: the caller knows the result at once      | Responsiveness and scale: the caller continues at once    |
| Control of the order of steps                       | Dynamic flows: new reactions with no change to the sender |
| Simpler to test and to debug                        | Harder to test, debug, and see from end to end            |

Use the request-based model when the user needs a certain answer now, such as a seat that is held or a payment that is approved. Use the event-based model when one fact must start many independent reactions, or when work arrives in bursts. See [Synchronous and asynchronous communication](/learn/sync-async).

## Hybrid designs

Event-driven architecture is rarely the only style in a system. It often runs inside another one:

- **Microservices with events.** Services publish domain events, and other services keep their own copies of the data. See [Microservices](/learn/microservices).
- **Space-based with data pumps.** Processing units send their changes to the database through messages. See [Space-based architecture](/learn/space-based).
- **A request-based front, an event-driven back.** The user gets a synchronous answer for the critical step. The rest of the work runs from events.

Do not confuse event-driven architecture with [event sourcing](/learn/cqrs-event-sourcing#not-the-same-as-event-driven). Event-driven architecture is about how parts communicate. Event sourcing is about how one part stores its state.

## How the style handles each characteristic

| Characteristic  | How the style handles it                                                                                 |
| --------------- | -------------------------------------------------------------------------------------------------------- |
| Responsiveness  | Very good. The sender does not wait for the reactions                                                    |
| Scalability     | Very good. Each processor scales alone, and the broker absorbs bursts                                    |
| Fault tolerance | Good. A slow or failed processor delays only its own work. Messages wait in the broker                   |
| Extensibility   | Very good in the broker topology. A new reaction is a new subscriber                                     |
| Consistency     | Weak. Processors agree only after a delay                                                                |
| Testability     | Weak. A flow crosses many parts, with timing that changes from run to run                                |
| Observability   | Weak unless you add correlation IDs and traces from the start. See [Observability](/learn/observability) |

## Common mistakes

- **Commands disguised as events.** An event named "SendEmail" couples the sender to one receiver. Name events as facts in the past tense.
- **No owner for an event format.** Many subscribers depend on fields that the producer changes. Version each event, and only add fields.
- **Events with too little data.** Each subscriber calls the producer back for details, and the producer gets the full load again.
- **A broker topology for a flow that needs control.** The business asks "is this order complete?", and no component knows. Use a mediator for the core flow.
- **No correlation ID.** A flow that crosses six processors cannot be followed in the logs.

## How it fails

- **A consumer is slow.** The queue grows, and work is late. Alert on the age of the oldest message, not only on errors. See [Backpressure](/learn/messaging#backpressure).
- **A poison message** blocks a consumer that retries it forever.
- **The broker is down.** Producers cannot publish. Use a broker cluster with copies, and an outbox in each producer.
- **A silent stop in a broker flow.** One processor stops publishing. No error occurs, and no downstream work starts. Watch the rate of each event type, and alert when it falls.

## In a kata

- In [Lunch Rush](/kata/lunch-rush), "order placed" can start payment, the kitchen screen, and the "ready" message. The order itself is a request-based step, because the customer needs a certain answer.
- In [Tow Line](/kata/tow-line), storms create bursts of requests. A queue in front of dispatch absorbs them. The flow from request to assigned truck is a good case for a mediator, because the insurer must know when each job is complete.
- In [Agent Triggers](/kata/agent-triggers), each incoming email is an initiating event. A strong answer names how it prevents data loss at each of the three places, and how it makes the run start exactly once.

Name the topology. Say which steps are request-based and which are event-based, and why.

## Interview questions

**"What is the difference between the broker and the mediator topology?"**

- Broker: no central part. Processors react to events and announce what they did.
- Mediator: one part knows the steps, sends commands, and tracks the state.
- Broker gives decoupling, throughput, and extensibility. Mediator gives control, error handling, and restart.
- Many systems use a mediator for the core flow and broker topics for side reactions.

**"How do you make sure that no event is lost?"**

- Persistent queues and a synchronous send from the producer.
- Client acknowledge mode on the consumer.
- Confirm only after the database commit.
- An outbox for the producer, and consumers that are safe to repeat.

**"A consumer cannot process some messages. How do you handle that without stopping the flow?"**

- The workflow event pattern: send the message to a repair processor and continue.
- Repair by rules or by a person, then send the message again.
- Handle the order problem that the repair creates.
- A dead-letter queue with an alert for messages that cannot be repaired.

**"When would you not use an event-driven design?"**

- The user needs a certain answer at once.
- Several steps must succeed or fail as one transaction.
- The flow is simple, and the team cannot afford the tools to trace it.

**"How do you get an answer back over a message broker?"**

- Request-reply, with a correlation ID on a shared reply queue, or a temporary reply queue.
- A timeout, because the answer can be late or never arrive.

## Go deeper

- **Fundamentals of Software Architecture** (Richards, Ford), the part on event-driven architecture: the two topologies, asynchronous capabilities, error handling, data loss, and request-reply.
- **Software Architecture: The Hard Parts** (Ford, Richards, Sadalage, Dehghani), the parts on workflow and on transactional sagas: choreography and orchestration as a trade-off.
- **Designing Data-Intensive Applications** (Kleppmann), the part on stream processing: message brokers compared with logs, and how to keep derived data in step.
- **Building Microservices** (Newman), the part on communication styles: events as a way to reduce coupling between services, and what to put in an event.

## Further reading

- [What do you mean by "Event-Driven"?](https://martinfowler.com/articles/201701-event-driven.html), by Martin Fowler
- [Request-Reply](https://www.enterpriseintegrationpatterns.com/patterns/messaging/RequestReply.html) and [Correlation Identifier](https://www.enterpriseintegrationpatterns.com/patterns/messaging/CorrelationIdentifier.html), from Enterprise Integration Patterns
- [Event-driven architecture](https://en.wikipedia.org/wiki/Event-driven_architecture) on Wikipedia
