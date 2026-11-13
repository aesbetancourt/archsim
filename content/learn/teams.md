## The other half of the job

A correct design that nobody follows has no value. At senior level, the technical part is expected. The difference is made by how well you understand the organization, explain a decision, and get agreement.

## Conway's law

Organizations build systems that copy their own communication structure. Three teams that build a compiler produce a compiler with three stages.

What this means for you:

- **The team structure is an input to the design.** Parts owned by one team can be closely connected. Parts owned by different teams need clear, stable interfaces.
- **A design that fights the organization loses.** If the diagram says "one shared module" and three teams with three managers own it, expect three versions.
- **You can change the teams to get the architecture.** If you want independent services, create teams that each own one service from start to production. This is sometimes called the inverse Conway maneuver.

A useful rule: a team should be able to deliver a change for its users without waiting for another team. Where that is not true, look at the [boundaries](/learn/boundaries).

## Know who cares about what

| Person | Cares about | Wants to hear |
|---|---|---|
| Business owner | Cost, time, risk, income | What it enables, what it costs, when it is ready |
| Product manager | Features and dates | What becomes faster or possible |
| Developers | A system they can understand and change | The reason, and where they have freedom |
| Operations | Stability, alerts at night | How it fails and how it is repaired |
| Security and legal | Data, access, the law | Where the data is and who can see it |

Explain the same decision in a different way to each of them. This is not dishonest. It is translation.

## How to get a decision accepted

- **Ask before you tell.** People who helped to shape a decision support it.
- **Show options, not one answer.** Bring two or three, with the [trade-offs](/learn/trade-offs), and a recommendation.
- **Use numbers and examples.** "Too slow" starts an argument. "Four seconds for the order page" starts a discussion.
- **Write it down.** A short [decision record](/learn/decision-records) ends the same debate from starting again each quarter.
- **Disagree, and then commit.** Say your concern clearly once. If the decision goes the other way, help it succeed.
- **Give developers the reason, not only the rule.** A team that understands why makes the right choice in the cases you did not foresee.

## Stay technical

An architect who has not built anything for years loses the trust of developers and the feeling for cost. Keep some time for real work: a prototype, a code review, a fitness function, a kata.

## In an interview

The way you treat the interviewer is seen as the way you would treat a team. Ask questions, think aloud, take a hint, and change your mind when the argument is good. See [The system design interview](/learn/interview-format).

## Further reading

- [Conway's law](https://en.wikipedia.org/wiki/Conway%27s_law) on Wikipedia
- [Team Topologies, key concepts](https://teamtopologies.com/key-concepts)
