## What delivery performance is

Delivery performance is how fast and how safely a team gets changes into the hands of users. It is a property of the whole system: the code, the architecture, the pipeline, the team, and the culture.

Accelerate, by Nicole Forsgren, Jez Humble, and Gene Kim, reports on several years of surveys of thousands of technical professionals. The research program behind it is DORA (DevOps Research and Assessment). Its main results:

- Four metrics describe delivery performance well.
- Teams that are fast are also stable. Speed and stability are not a trade-off.
- A set of capabilities predicts good delivery performance. Architecture is one of the strongest.
- Better delivery performance goes together with better results for the organization, such as profitability and market share.

An architect needs this for two reasons. First, the architecture decides much of the delivery performance. A design where every change needs five teams cannot be fast. Second, these metrics give you evidence. "We deploy once a month, and a third of the releases fail" is a stronger argument for a change than "the architecture is old".

## The four key metrics

| Metric                  | Question it answers                                                 | Measures  |
| ----------------------- | ------------------------------------------------------------------- | --------- |
| Lead time for changes   | How long from a commit to that code running in production?          | Speed     |
| Deployment frequency    | How often does the team deploy to production?                       | Speed     |
| Change failure rate     | What share of changes cause a failure that needs a fix?             | Stability |
| Time to restore service | After a failure that affects users, how long until service is back? | Stability |

### Lead time for changes

Lead time starts when a developer commits the code and ends when the code runs in production. Accelerate measures only this delivery part. The design and discovery part before the commit varies too much to measure the same way.

Long lead times usually come from waiting, not from work. Code waits for a review, for a test environment, for a release train, or for an approval board.

### Deployment frequency

Deployment frequency counts deploys to production. Accelerate uses it as a proxy for batch size. A team that deploys many times a day sends small changes. A team that deploys once a quarter sends large ones. Small batches are a core idea of lean manufacturing, and they apply to software too.

### Change failure rate

The change failure rate is the percentage of deploys that cause a degraded service and need a fix: a rollback, a hotfix, or a patch. It does not count a bug that a test found before production.

### Time to restore service

Time to restore is how long it takes to bring service back after an incident that affects users. It measures detection, diagnosis, and the speed of a fix or rollback. The [incident response](/learn/incident-response) lesson covers the human side. Note: it measures restore, not the final fix of the cause.

### Rough values

The surveys group teams into clusters. The exact limits change from year to year, so use these values as rough orders of size only.

| Metric               | High performers, roughly       | Low performers, roughly |
| -------------------- | ------------------------------ | ----------------------- |
| Lead time            | Less than a day                | Weeks to months         |
| Deployment frequency | On demand, several times a day | Monthly or less often   |
| Change failure rate  | Low                            | Much higher             |
| Time to restore      | Less than an hour or a day     | Days to weeks           |

## Speed and stability go together

Many organizations believe that safety needs slow, careful releases. The surveys show the opposite. The best teams are better on all four metrics at the same time. The worst teams are slow and also unstable.

The mechanisms explain why:

- **Small changes are easy to check.** A deploy with one change has one suspect. A deploy with 300 changes needs a long investigation.
- **Practice makes deploys routine.** A team that deploys daily has an automated, well-tested process. A team that deploys quarterly does it by hand from a long checklist, and something is always different.
- **A short lead time shortens restore time.** If a fix can reach production in an hour, an incident is shorter. If every fix must wait for the next release window, it is long.
- **Fast feedback finds problems sooner.** A developer who sees a bug in production the same day still remembers the code.

The opposite also holds. A slow release process makes each release large. Large releases fail more often. Failed releases make people add more approvals. More approvals make the process slower. This is a negative loop, and it explains why many organizations get stuck.

## The capabilities

Accelerate lists 24 capabilities that improve delivery performance, in five groups. The table gives examples from each group.

| Group                          | Examples                                                                                                                                     |
| ------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------- |
| Continuous delivery            | Version control for everything, deployment automation, continuous integration, trunk-based development, test automation, shift security left |
| Architecture                   | A loosely coupled architecture. Teams that can choose their own tools.                                                                       |
| Product and process            | Work in small batches, get customer feedback, make the flow of work visible, let teams experiment                                            |
| Lean management and monitoring | Lightweight change approval, monitoring that informs decisions, limits on work in progress                                                   |
| Culture                        | A generative culture, support for learning, collaboration between teams, transformational leadership                                         |

### Continuous delivery

Continuous delivery is the ability to release any good version of the software to production at any time, safely and quickly. The code is always in a deployable state. A deploy is a business decision, not a technical project. See [Deployment and release](/learn/deployment) for the pipeline and the release strategies.

Some of the practices need a short explanation:

- **Trunk-based development.** Developers merge small changes to the main branch at least daily. Long-lived branches delay integration and make merges large and risky.
- **Test automation.** Tests that run on every commit and that developers trust. A flaky test suite is ignored, so it gives no safety.
- **Shift left on security.** Include security in design and in the pipeline, not only in a review at the end.

### Lean management

Lean management applies ideas from lean manufacturing to software work. Make the work visible, limit work in progress, and use data from monitoring to make decisions.

Accelerate reports a strong result on change approval. An approval board outside the team, which must accept each production change, did not reduce the change failure rate. It did make lead time, deployment frequency, and restore time worse. Peer review of changes inside the team, plus automated tests, worked better.

### Culture: the Westrum model

Ron Westrum, a sociologist, classified organizations by how information moves in them. Accelerate uses his model and finds that the culture type predicts both delivery performance and organizational performance.

| Type         | Oriented to | How information moves                                                   | After a failure                   |
| ------------ | ----------- | ----------------------------------------------------------------------- | --------------------------------- |
| Pathological | Power       | People hide information that does not help them. Bad news is punished.  | Look for someone to blame         |
| Bureaucratic | Rules       | Information follows official channels. Each department guards its area. | Look for the rule that was broken |
| Generative   | Performance | People share information that others need. Bad news is welcome.         | Ask what to learn and improve     |

A generative culture is the basis for [blameless postmortems](/learn/incident-response#blameless-postmortems). In a pathological culture, people hide the facts that a postmortem needs. Culture is not fixed. The research suggests that a change in practices, such as continuous delivery, can also change the culture.

## Architecture and delivery performance

Accelerate found that architecture is one of the biggest predictors of continuous delivery. The type of system mattered less than expected. A team with an old system could get good results, and a team with a new, cloud-based system could get bad ones. What mattered was the shape of the architecture.

A team in a high-performing organization can usually:

- Make large changes to the design of its system without permission from people outside the team.
- Complete its work without much coordination with other teams.
- Deploy and release its service on demand, independently of the services it depends on.
- Do most of its testing on demand, without an integrated test environment.
- Deploy during normal business hours with little or no downtime.

The authors call this a loosely coupled architecture, and they also say that the teams must be loosely coupled. The architecture and the team structure must match. This is [Conway's law](/learn/teams#conway-s-law) in practice, and it is the core idea of [Team Topologies](/learn/team-topologies).

### How coupling hurts each metric

| Kind of coupling                      | Effect on the metrics                                                                                   |
| ------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| Services must deploy together         | Deployment frequency drops to the pace of the slowest team. Lead time includes the wait for the others. |
| A shared database schema              | A schema change needs every team that reads the table. Lead time grows, and change failures increase.   |
| A shared integration test environment | Teams wait in a queue for the environment. One broken service blocks the tests of all others.           |
| Fine-grained synchronous calls        | A failure in one service affects many others, so the change failure rate and restore time both rise.    |
| A component that several teams own    | Changes need meetings. Nobody feels responsible for its health, so incidents last longer.               |

A system of services that must deploy together is a **distributed monolith**. It has the costs of [microservices](/learn/microservices) and the coupling of a monolith. It often has worse delivery performance than the monolith it replaced.

```diagram
{
  "nodes": [
    { "id": "ta", "label": "Team A", "shape": "person", "col": 0, "row": 0 },
    { "id": "tb", "label": "Team B", "shape": "person", "col": 0, "row": 2 },
    { "id": "sa", "label": "Orders service", "shape": "box", "col": 1, "row": 0 },
    { "id": "sb", "label": "Billing service", "shape": "box", "col": 1, "row": 2 },
    { "id": "db", "label": "Shared database\n(one schema)", "shape": "store", "col": 2, "row": 1 },
    { "id": "env", "label": "Shared test\nenvironment", "shape": "box", "col": 3, "row": 1 }
  ],
  "edges": [
    { "from": "ta", "to": "sa", "label": "changes" },
    { "from": "tb", "to": "sb", "label": "changes" },
    { "from": "sa", "to": "db" },
    { "from": "sb", "to": "db" },
    { "from": "sa", "to": "env", "label": "tests wait" },
    { "from": "sb", "to": "env", "label": "tests wait" }
  ]
}
```

In the diagram, the two teams own separate services, but they share a schema and a test environment. Each team waits for the other. The fix is to give each service its own data and to test each service alone, with contracts at the boundary. See [data ownership](/learn/data-ownership) and [architecture quantum](/learn/architecture-quantum).

### Testable and deployable

Accelerate names two architectural characteristics that matter most: testability and deployability. A system is testable when a team can test most of its changes without the rest of the system. It is deployable when a team can deploy its part alone. Put both on your list of [characteristics](/learn/characteristics) when delivery speed matters to the business.

A modular monolith can have both properties for a small organization, with one pipeline and good tests. Microservices are not necessary for good metrics. Independent deployability becomes important when several teams work on one system. See [Modular monolith](/learn/modular-monolith).

## DORA after Accelerate

The DORA research continued after the book. DORA joined Google Cloud in 2018 and still publishes a report each year. Some changes are well established:

- In 2018, the reports added an "elite" cluster above the high performers.
- The reports added a fifth measure for operational performance. It was first called availability, and later reliability. It asks if the service meets its targets for users, so it connects the delivery metrics to the [service levels](/learn/observability#service-levels) of a system.
- Later reports renamed "time to restore service" to "failed deployment recovery time". The new name measures recovery from a failed change, not from every kind of incident.

The DORA website has a quick self-check and guides for each capability.

## Using the metrics well

The metrics are a tool for learning. They become harmful when people use them in the wrong way.

1. **Measure teams and systems, not people.** A ranking of developers by deploy count makes people split changes to game the number.
2. **Measure all four together.** A team that only pushes deployment frequency can raise the change failure rate. The four metrics balance each other.
3. **Measure from your tools.** Get lead time from version control and the pipeline, deploys from the deploy tool, and failures and restores from the incident records. Surveys work to start.
4. **Compare a team with its own past.** Teams have different systems and constraints. The trend matters more than a comparison between teams.
5. **Find the constraint.** Map the flow from commit to production and see where work waits. Fix the longest wait first.

When a metric becomes a target, people change their behavior to move the number, and it stops measuring what you wanted. This is Goodhart's law, and it applies here.

## Example: the parcel service

A parcel service runs one large application. Four teams work in it. They release once a month in a weekend window. Before each release, an integration test phase takes a week, and a change board meets to approve the release.

Their numbers are roughly: lead time of three to five weeks, a monthly deploy, about one release in three needs a hotfix, and a restore time of half a day, because a fix waits for an emergency approval.

The team does not start with microservices. It takes these steps:

1. Automate the deploy, so that it takes 20 minutes and needs no weekend.
2. Move to trunk-based development and run the test suite on each commit.
3. Replace the change board with peer review and automated checks for normal changes.
4. Deploy weekly, then daily.
5. Draw module boundaries inside the application, and give each module its own tables.
6. Extract one module that changes often, the pricing rules, into a service with its own pipeline.

After a year, the lead time is about two days, the team deploys daily, and the change failure rate and restore time are both much lower. The architecture change came after the pipeline change, and the second made the first visible. See [Decomposing a monolith](/learn/decomposing-a-monolith) for the extraction steps.

## In a kata

Use delivery performance to justify structure:

- When the kata has several teams, or plans to grow, list **deployability** and **testability** as characteristics. Draw the boundaries so that each team can deploy alone.
- When the kata has a small team, as in [Lunch Rush](/kata/lunch-rush), say that one deployable unit with a good pipeline gives good metrics. Separate deploys would add cost and no speed.
- Name the shared parts that would force teams to coordinate: a shared database, a shared library with frequent changes, a shared test environment. Explain how the design avoids them.
- In the rationale, state the release strategy and how fast you can roll back. This is your answer to time to restore.

## Interview questions

**What are the four key metrics, and why these four?**

- Lead time for changes and deployment frequency measure speed. Change failure rate and time to restore measure stability.
- They measure outcomes of the whole delivery system, not activity.
- Together they balance each other, so a team cannot improve one by hurting another without it being visible.

**Your organization believes that slower releases are safer. How do you answer?**

- The DORA research shows that the best teams are both faster and more stable.
- Small batches make each change easier to test, review, and roll back.
- Frequent deploys make the process automatic and routine.
- Show the current numbers, and start with a small change such as automated deploys.

**How does architecture affect delivery performance?**

- Loosely coupled architecture is one of the strongest predictors of good delivery.
- Teams must be able to change, test, and deploy their part without other teams.
- Shared databases, lockstep deploys, and shared test environments add waits and failures.
- Team structure must match the architecture, which is Conway's law.

**You are asked to move to microservices to deploy faster. What do you check first?**

- Measure the four metrics now, and find where work waits.
- Often the constraint is the pipeline, the tests, or the approval process, not the architecture.
- Splitting services without separate data and separate deploys gives a distributed monolith.
- A modular monolith with a good pipeline can be enough for a few teams.

**How do you measure lead time in practice?**

- From the commit timestamp in version control to the deploy event of that commit in production.
- Use the median and look at the spread, not only the average.
- Track it as a trend for one team, and use it to find the longest wait.

## Go deeper

- **Accelerate** (Forsgren, Humble, Kim), the parts on measuring performance, on the capabilities, on architecture, and on culture: the research, the method behind it, and the full list of capabilities.
- **Team Topologies** (Matthew Skelton, Manuel Pais), the parts on team types and on cognitive load: how to shape teams so that they can deliver alone.
- **Building Microservices** (Sam Newman), the parts on independent deployability and on deployment: what it takes for services to deploy alone.
- **Fundamentals of Software Architecture** (Mark Richards, Neal Ford), the parts on characteristics and on the architecture quantum: how to treat deployability as a characteristic and find the units that deploy together.
- **Site Reliability Engineering** (Beyer and others), the part on error budgets: a mechanism that balances release speed and reliability with data.

## Further reading

- [DORA research](https://dora.dev/), the program behind the metrics
- [Continuous delivery](https://martinfowler.com/bliki/ContinuousDelivery.html) and [Continuous integration](https://martinfowler.com/articles/continuousIntegration.html), by Martin Fowler
- [Conway's law](https://martinfowler.com/bliki/ConwaysLaw.html), by Martin Fowler
- [Goodhart's law](https://en.wikipedia.org/wiki/Goodhart%27s_law) on Wikipedia
