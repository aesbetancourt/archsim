## What it is

An architecture decision record (ADR) is a short text file that holds one decision and its reason. A project keeps its ADRs with the code, with a number for each.

The problem it solves: six months later, nobody remembers why the system uses a queue between two services. A new developer removes it. The fault that the queue prevented comes back. An ADR is the answer to "why is it like this?".

## The format

| Part | Content |
|---|---|
| Title | A number and a short statement: "7. Use a queue between orders and notifications" |
| Status | Proposed, accepted, or replaced by another ADR |
| Context | The situation and the forces: requirements, constraints, what makes this hard |
| Decision | What we do, in active voice: "We will…" |
| Consequences | What becomes easier, what becomes harder, and what we now must do |

One page is the usual limit. If it is longer, it probably holds more than one decision.

## Example

> **7. Use a queue between orders and notifications**
>
> **Status:** accepted
>
> **Context:** A customer must get a message when an order is ready. The message provider is slow at lunch and fails a few times each week. An order must not fail because a message cannot be sent.
>
> **Decision:** The orders module will put a "send message" job in a queue. A separate worker will send the messages and repeat a failed send.
>
> **Consequences:** An order succeeds when the provider is down. Messages can be late. We must monitor the length of the queue. We must make a repeated send safe, so a customer does not get two messages.

## Rules that make ADRs useful

- **Write the consequences that hurt.** They are the part a future reader needs.
- **Never edit an accepted ADR to change the decision.** Write a new one that replaces it. The history is the value.
- **Write one when a decision is hard to reverse**, or when the team argued about it. Do not write one for each small choice.

## In a kata or an interview

The "rationale" box in a kata is a small ADR. Use the same structure: the forces from the problem, the decision, and the consequences. See [How to analyze a trade-off](/learn/trade-offs).

## Further reading

- [adr.github.io](https://adr.github.io/), templates and tools for decision records
