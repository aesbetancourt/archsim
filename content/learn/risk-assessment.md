## What risk assessment is

Every architecture has risks: a part that cannot scale, a database that is a single point of failure, a provider that nobody has tested under load. A risk assessment finds them, rates them, and decides what to do about each one. It turns a vague worry, "I think the tracking service is fragile", into a rating that a team can compare, discuss, and track over time.

An architect needs this for three reasons:

- **Limited time.** A team cannot fix every weakness. A rating shows which ones to fix first.
- **A shared view.** Each person sees a different part of the system. A structured assessment collects what they see before it becomes an outage.
- **A conversation with the business.** A business owner cannot judge a design. They can judge "a high risk that parcel tracking fails on the busiest day of the year", and decide to pay for the fix.

Richards and Ford give the tools on this page: the risk matrix, the risk assessment, risk direction, and risk storming (Fundamentals of Software Architecture, the part on analyzing architecture risk). The examples use a parcel service with a customer app, a tracking service, a routing service, a driver app, and billing.

## The risk matrix

A risk has two parts: how bad it is if it occurs, the **impact**, and how probable it is, the **likelihood**. The risk matrix rates each on a scale of 1 to 3, and multiplies them.

| Impact \ Likelihood | Low (1) | Medium (2) | High (3) |
| ------------------- | ------- | ---------- | -------- |
| **High (3)**        | 3       | 6          | 9        |
| **Medium (2)**      | 2       | 4          | 6        |
| **Low (1)**         | 1       | 2          | 3        |

The result falls in one of three bands:

| Score | Band   | Usual color |
| ----- | ------ | ----------- |
| 1–2   | Low    | Green       |
| 3–4   | Medium | Yellow      |
| 6–9   | High   | Red         |

Rate the impact first, then the likelihood. Impact is usually easier to agree on. "If billing loses invoices, we lose money and trust" is clear. Likelihood depends on knowledge that people have in different amounts.

The scale works only if people use it in the same way. Before a session, write down what each level means for this system:

| Level  | Impact on the parcel service                    | Likelihood                                 |
| ------ | ----------------------------------------------- | ------------------------------------------ |
| Low    | A few users see a delay. No data is lost        | Not seen before, and well protected        |
| Medium | Many users cannot track parcels for an hour     | Seen in other systems, or once here        |
| High   | Parcels are lost or misrouted, or money is lost | Seen here more than once, or no protection |

A 3-by-3 scale is coarse on purpose. A 1-to-10 scale invites long debates about 6 or 7 that change no decision.

## Risk assessments

A **risk assessment** is a table that rates each risk for each part of the system. The rows are the architecture characteristics that matter. The columns are areas of the system: services, domains, or containers. Each cell holds a score from the risk matrix.

An example for the parcel service:

| Characteristic | Customer app | Tracking | Routing | Driver app | Billing | Total |
| -------------- | ------------ | -------- | ------- | ---------- | ------- | ----- |
| Scalability    | 2            | **9**    | 4       | 2          | 1       | 18    |
| Availability   | 3            | **6**    | 4       | **6**      | 2       | 21    |
| Performance    | 2            | 4        | **6**   | 2          | 1       | 15    |
| Security       | 4            | 2        | 1       | 3          | **6**   | 16    |
| Data integrity | 1            | 3        | 2       | 4          | **9**   | 19    |
| **Total**      | 12           | 24       | 17      | 17         | 19      |       |

The table answers two questions at once:

- **The row totals** show which characteristic is most at risk across the system. Here it is availability.
- **The column totals** show which area is most at risk. Here it is tracking.

Choose the rows from the driving characteristics of the system, not from a full list. See [Architecture characteristics](/learn/characteristics). Five rows that matter are better than fifteen that dilute the totals.

### Filter for the audience

The full table is for the architects and the team. A business owner needs less. Fundamentals suggests filtering: show only the high risks, and hide the rest. For the parcel service, the filtered view has six cells: tracking under load, the availability of tracking and of the driver app, route calculation time, and the security and integrity of billing. Each red cell then needs a plan.

## Risk direction

One assessment is a picture of one moment. The next question is whether each risk is getting better or worse. **Risk direction** adds that information to each cell.

| Characteristic | Tracking | Driver app | Billing |
| -------------- | -------- | ---------- | ------- |
| Scalability    | 9 ↓      | 2          | 1       |
| Availability   | 6 ↑      | 6 ↓        | 2       |
| Data integrity | 3        | 4          | 9 ↓     |

An arrow up means the risk grows since the last assessment. An arrow down means it shrinks. Here the scalability risk of tracking is still high, but falls, because the team added a cache. Its availability risk grows, because the new cache is one more part that can fail.

Base the direction on measures, not on feelings, where you can. A [fitness function](/learn/measuring-characteristics#fitness-functions) for p99 latency, or an availability [SLO](/learn/observability), gives an objective signal. When the measure gets worse, the risk goes up, and the next assessment shows it.

Repeat the assessment on a regular schedule, for example each quarter, and after each large change. The trend across several assessments says more than any one of them.

## Risk storming

An architect alone sees only part of the risks. **Risk storming** is a collaborative exercise to find the risks of an architecture with a group. Fundamentals describes it in three steps: identification, consensus, and mitigation. Simon Brown, who created the C4 model, describes a similar exercise with the same name.

### Prepare

1. **Choose the diagram.** Use an architecture diagram that shows the parts and their connections. A C4 container diagram works well. See [Diagrams and the C4 model](/learn/diagrams#the-c4-model).
2. **Choose the scope.** A whole system, or one area that is about to change.
3. **Choose the dimension.** A session can look at one characteristic, such as availability, or at several. One characteristic gives a deeper discussion. Several give a wider view in the same time.
4. **Invite the right people.** Architects, senior developers, and tech leads. Developers know where the code is weak. An operations engineer knows what failed last year.
5. **Send the diagram and the rating scale before the session.**

### Step 1: Identification

Each person works alone. They look at the diagram and write each risk they see on a sticky note: the score from the risk matrix, and a few words of reason. Color helps: green, yellow, and red notes for the bands.

This step is individual on purpose. When people talk first, they follow the first or the most senior voice. Each person must form an opinion before the group meets.

### Step 2: Consensus

The group places all notes on the diagram, next to the part each one is about. Then it discusses.

- **Notes that agree** need little time. Four people rated the tracking database a 9. It is a 9.
- **Notes that disagree** are the value of the session. One developer rated the routing service a 2, and another a 6. Usually one of them knows something the other does not: "routing calls the map provider for each stop, and the provider limits us to 50 calls each second". After the talk, the group agrees on one score.
- **Parts with no notes** deserve a question too. Nobody knows them, or nobody thought about them.

The output is an agreed risk assessment, in the form of the table above.

### Step 3: Mitigation

For each high risk, the group looks for changes that lower it. Each change has a cost, so this step is a [trade-off analysis](/learn/trade-offs).

For the parcel service, the tracking database is a 9 for scalability. The options:

| Option                               | Effect on the risk                   | Cost                                     |
| ------------------------------------ | ------------------------------------ | ---------------------------------------- |
| Read replicas for tracking queries   | 9 to 4: reads scale                  | A few servers. Reads can be slightly old |
| A cache for the latest location      | 9 to 4: most reads skip the database | One more part that can fail              |
| A separate store for location events | 9 to 2: writes and reads scale       | A large change, months of work           |
| Accept the risk                      | Stays 9                              | An outage on the busiest day             |

The architect then takes the options to the business owner, in business terms: "For the cost of a few servers, tracking survives the holiday peak. For several months of work, it survives five times that peak." The business chooses. Record the decision and the accepted risk in a [decision record](/learn/decision-records).

### Ways to respond to a risk

Risk management in general names four responses. Each mitigation option is one of them:

| Response | Meaning                            | Example                                            |
| -------- | ---------------------------------- | -------------------------------------------------- |
| Reduce   | Lower the impact or the likelihood | Add a replica, a timeout, or a fallback            |
| Avoid    | Remove the cause                   | Do not build the live map in the first release     |
| Transfer | Give the risk to someone else      | Use a managed database with a contract for uptime  |
| Accept   | Live with it, with open eyes       | A low risk, or a fix that costs more than the loss |

"Accept" is a valid answer. It must be a decision with a name and a date, not silence.

## Agile story risk analysis

The same matrix works for work items, not only for architecture. Fundamentals suggests rating user stories during planning:

- **Impact:** how bad it is if this story is not done in this iteration.
- **Likelihood:** how probable it is that the story is not done, for example because of unknowns or dependencies.

A story with a high score gets attention first. The team starts it early, splits it, or assigns its strongest people. For the parcel service: "drivers scan parcels offline" has a high impact, because the depot cannot work without it. It also has a high likelihood of delay, because nobody has built offline sync before. That makes it a 9, so the team starts it in the first week.

## Risk in the wider work of an architect

Risk assessment connects to several other practices:

- **Trade-offs.** Each design choice moves risk from one place to another. The cache lowered a scalability risk and raised an availability risk. See [Trade-offs](/learn/trade-offs).
- **Decision records.** A record names the risks the team accepts. A later assessment checks if they are still acceptable.
- **Measures.** Fitness functions and SLOs turn some risks into numbers that the build or the monitoring checks. See [Measuring characteristics](/learn/measuring-characteristics).
- **Error budgets.** Site reliability engineering treats some unreliability as an accepted risk, with a budget. When the budget runs out, the team changes priorities. See [Observability](/learn/observability).
- **A pre-mortem.** Before a launch, imagine that it failed, and ask why. It finds risks from a different angle than a diagram does.

## Failure modes

| Failure                                    | What occurs                                                   | Fix                                                 |
| ------------------------------------------ | ------------------------------------------------------------- | --------------------------------------------------- |
| No shared scale                            | One person's 6 is another person's 2. The totals mean nothing | Write down each level, with examples, before rating |
| Group discussion before individual ratings | The group follows the loudest voice                           | Rate alone first, then compare                      |
| Too many characteristics                   | Every area looks equally risky                                | Use the few driving characteristics                 |
| A one-time exercise                        | The table is old after the next large change                  | Repeat on a schedule, and track direction           |
| Risks found, no owner                      | The same red cells at each review                             | An owner and a date for each high risk              |
| Only technical people in the room          | Mitigations that the business will not pay for                | Bring the options to the business owner, with costs |
| Accepted risks that nobody wrote down      | A later team does not know the risk is there                  | A decision record for each accepted risk            |

## In a kata

Add a short risk part to the design:

1. Pick the three driving characteristics.
2. Make a small risk assessment: those characteristics against the main parts of your diagram.
3. Name the two or three high risks, with one mitigation and its cost for each.
4. Say which risk you accept, and why.

In the [Front Row kata](/kata/front-row), the seat sale has a high risk for scalability and for data integrity: a seat sold twice. Rate both, and show how a queue in front of the sale lowers the first. In the [Payment System kata](/kata/payment-system), rate the card provider for availability, and show that the mitigation is retries with idempotency keys, because no fallback exists.

## Interview questions

**"How do you find the risks in an architecture?"**

- A risk storming session with architects and senior developers, on one diagram.
- Each person rates risks alone first, to avoid groupthink.
- The group discusses the disagreements, which show gaps in knowledge.
- The result is a risk assessment: characteristics against areas, with scores.

**"How do you rate a risk?"**

- Impact times likelihood, each from 1 to 3.
- Scores of 1 to 2 are low, 3 to 4 medium, and 6 to 9 high.
- Rate the impact first, and agree on the meaning of each level beforehand.

**"You found ten high risks and have time to fix three. What do you do?"**

- Rank by score, then by the cost of the mitigation.
- Bring the options and costs to the business owner, in business terms.
- Accept the others explicitly, in a decision record, with an owner.
- Track their direction, so a growing risk gets attention.

**"Your mitigation added a cache. Is the risk gone?"**

- The scalability risk is lower. A new availability risk appears: the cache can fail.
- A mitigation moves risk. The next assessment must rate the new part.
- Risk direction shows the change over time.

**"How do you show architecture risk to a non-technical stakeholder?"**

- Filter the assessment to the high risks only.
- Describe each in business terms: what fails, for whom, and how often.
- Give two or three options with their costs, and let the business choose.

## Go deeper

- **Fundamentals of Software Architecture**, Richards and Ford, the part on analyzing architecture risk: the risk matrix, risk assessments, risk direction, risk storming, and story risk analysis.
- **Site Reliability Engineering**, Beyer and others, the part on embracing risk: how a target for unreliability and an error budget turn risk into a number the team manages.
- **Software Architecture: The Hard Parts**, Ford, Richards, Sadalage, and Dehghani, the part on trade-off analysis: how to compare the options that a mitigation step produces.

## Further reading

- [Risk-storming](https://riskstorming.com/), by Simon Brown
- [Risk matrix](https://en.wikipedia.org/wiki/Risk_matrix) on Wikipedia
- [Pre-mortem](https://en.wikipedia.org/wiki/Pre-mortem) on Wikipedia
- [Embracing Risk](https://sre.google/sre-book/embracing-risk/), from the Google SRE book
