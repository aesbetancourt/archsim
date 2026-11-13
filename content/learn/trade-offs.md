## Why this is the core skill

Each architecture decision improves some qualities and makes others worse. A shared database gives simple transactions and couples the services. A cache gives speed and makes data old. The skill is not to find the option with no cost. It is to select the cost that this business can best accept, and to say so clearly.

## A method in five steps

1. **State the decision as a question.** "How do the order service and the payment service share data?" A vague question gives a vague answer.
2. **List two or three real options.** Include the simplest one, even if you expect to reject it. One option is not an analysis.
3. **Select the characteristics that matter here.** Use the three driving [characteristics](/learn/characteristics) of the system, plus cost and the skills of the team.
4. **Score each option against each characteristic.** Better, worse, or the same is enough. Write one sentence of reason for each score.
5. **Select, and write what you gave up.** Use the form: "We select A because of X. We accept Y. We will look again if Z occurs."

## Example

Decision: how does the kitchen screen get new orders?

| | Screen asks every 10 seconds | Server pushes on an open connection |
|---|---|---|
| Simplicity | Better: a normal request | Worse: connection handling |
| Delay | Worse: up to 10 seconds | Better: immediate |
| Weak network | Better: each request is independent | Worse: connections drop |

"We select the 10-second request because the shop network is weak and the team is small. We accept a delay of up to 10 seconds. We will look again if pickup times become shorter than two minutes."

## Common mistakes

- **Only benefits.** A design with no stated cost is a sales text.
- **Comparison with a weak alternative.** If the rejected option is clearly bad, you did not compare with a real one.
- **Decisions by fashion.** "Large companies use microservices" is not a reason. Their constraints are not yours.
- **Decisions too early.** If a decision is cheap to delay and you will know more later, delay it and say what you are waiting for.

## The word "least worst"

A common saying in the field is that there are no best architectures, only the least worst set of trade-offs. When two options seem equal, prefer the one that is easier to change later.

## Further reading

- [Architecture tradeoff analysis method](https://en.wikipedia.org/wiki/Architecture_tradeoff_analysis_method), a formal version of this method, on Wikipedia
