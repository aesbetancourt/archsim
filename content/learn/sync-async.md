## The choice

When one part needs something from another, it can call and wait for the answer (synchronous), or send a message and continue (asynchronous). In the diagrams of this app, a solid arrow is a call that waits, and a dashed arrow is a message that does not wait.

| | Synchronous call | Asynchronous message |
|---|---|---|
| The caller | Waits for the answer | Continues immediately |
| If the receiver is down | The caller fails or waits | The message waits in a queue |
| If the receiver is slow | The caller is slow | Nothing visible to the caller |
| The result | Known immediately | Known later, or never by the caller |
| To understand and debug | Easy: one path | Harder: work occurs in several places and times |

## When to wait

Use a synchronous call when the caller cannot continue without the answer.

- The user asks a question and must see the answer: "is this seat free?".
- The next step depends on the result: do not ship before the payment is confirmed.

## When not to wait

Use a message when the work can occur later, or when the caller does not care who reacts.

- Side effects of an action: send the email, update the search index, count the click.
- Work that takes long: convert a video, create a report.
- Load that arrives in bursts: a queue lets workers process at a steady rate.
- Several independent reactions to one occurrence.

A good rule for a request from a user: do the minimum that makes the action true, answer the user, and do the rest in the background.

## The cost of a chain of calls

If service A calls B, B calls C, and C calls D, and each is up 99.9% of the time, the chain is up only about 99.6% of the time. The delays also add up. Long synchronous chains are the most common fault in distributed designs. Shorten them: join parts that always call each other, or replace a call with data that the caller keeps as a copy.

## What asynchronous work requires

- The user interface must show a "pending" state.
- Each message can arrive twice, so the receiver must be [safe to repeat](/learn/distributed-transactions).
- Messages can arrive out of order.
- Somebody must watch the queue length and the failed messages. See [Messaging](/learn/messaging).

## In a kata

Put a label on each arrow and select solid or dashed deliberately. The review reads this. A design where each arrow is a call that waits usually has an availability problem. A design where each arrow is a message usually has a place where the user needs an answer and does not get one.

## Further reading

- [Request–response](https://en.wikipedia.org/wiki/Request%E2%80%93response) and [Message passing](https://en.wikipedia.org/wiki/Message_passing) on Wikipedia
