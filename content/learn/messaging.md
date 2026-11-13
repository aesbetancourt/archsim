## Two shapes

| | Queue | Topic (publish and subscribe) |
|---|---|---|
| Each message goes to | One worker | Each subscriber |
| Use it for | Work to be done once: "convert this video" | News that several parts react to: "order placed" |
| More workers | Share the work | Each subscriber group gets all messages |

A third form is a log: an ordered list of events that is kept for a period. Subscribers read it at their own position and can read it again from the start. It is used for very high volume and when a new subscriber must see old events.

## Commands and events

- A **command** asks for an action: "send this email". The sender expects it to be done. It usually goes to a queue.
- An **event** states a fact: "the order was placed". The sender does not know or care who reacts. It usually goes to a topic.

Name events in the past tense. If an "event" is named "SendEmail", it is a command, and the two parts are more coupled than the diagram shows.

## Delivery promises

| Promise | Meaning | Result |
|---|---|---|
| At most once | A message is sent one time and can be lost | No duplicates, lost work |
| At least once | A message is repeated until it is confirmed | No lost work, duplicates |
| Exactly once | The effect occurs one time | Not a delivery promise. It is "at least once" plus a receiver that detects repeats |

Design for "at least once" and make each receiver [safe to repeat](/learn/distributed-transactions). The Agent Triggers worked example is built on this.

## Order

Most systems keep order only inside one partition or one group. If order matters, give related messages the same key, so they go to the same partition and one worker handles them in sequence. The Chat Messaging example orders by conversation. A total order over all messages is very expensive and almost never necessary.

## What goes wrong

| Problem | What occurs | Protection |
|---|---|---|
| A message that always fails | The worker repeats it forever and blocks the others | After some attempts, move it to a [dead-letter list](/glossary#dead-letter) |
| Workers are too slow | The queue grows, work is late | Measure the delay of the queue, add workers automatically |
| A burst from one customer | All other customers wait | A limit or a separate queue for each customer or priority |
| The format of a message changes | Old receivers fail | Only add fields. See [API design](/learn/api-design) |

## In a kata

For each dashed arrow, be ready to answer: what occurs if the message arrives twice, arrives late, or never arrives?

## Further reading

- [Message queue](https://en.wikipedia.org/wiki/Message_queue) and [Publish–subscribe pattern](https://en.wikipedia.org/wiki/Publish%E2%80%93subscribe_pattern) on Wikipedia
