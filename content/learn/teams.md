## The other half of the job

A correct design that nobody follows has no value. At senior level, the technical part is expected. The difference is made by how well you understand the organization, explain a decision, and get agreement.

An architect usually has influence but no authority. The developers do not report to you, and the business owner does not need your permission. Your tools are clear explanations, good questions, trust, and a record of good advice. This page covers how to work with a team, how to work with the rest of the organization, and how both show in an interview.

## Conway's law

Organizations build systems that copy their own communication structure. Three teams that build a compiler produce a compiler with three stages.

What this means for you:

- **The team structure is an input to the design.** Parts owned by one team can be closely connected. Parts owned by different teams need clear, stable interfaces.
- **A design that fights the organization loses.** If the diagram says "one shared module" and three teams with three managers own it, expect three versions.
- **You can change the teams to get the architecture.** If you want independent services, create teams that each own one service from start to production.

That last idea is the **inverse Conway maneuver**: design the teams first, so that the system takes the shape you want. [Team Topologies](/learn/team-topologies) explains it, with the team types and the ways that teams interact.

A useful test: can a team deliver a change for its users without waiting for another team? Where it cannot, look at the [boundaries](/learn/boundaries).

## Three architect personalities

Richards and Ford, in Fundamentals of Software Architecture, describe three ways an architect can work with a development team. The difference is in how tight the boundaries are that the architect sets for the team.

| Personality         | What the architect does                                                                    | Result                                                                     |
| ------------------- | ------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------- |
| Control freak       | Makes each decision, down to class names and libraries. Boundaries are too tight           | Developers stop thinking. The architect becomes the bottleneck             |
| Armchair architect  | Draws high-level boxes and leaves. Has not written code in years. Boundaries are too loose | The team does the real architecture with no guidance. The diagram is wrong |
| Effective architect | Sets the right boundaries, gives the reasons, and stays near the team                      | The team decides inside the boundaries, and asks when it reaches the edge  |

The effective boundary is not fixed. It changes with the team and the project. The book names factors that tell you how much control to use:

- **Team familiarity.** People who worked together before need less guidance.
- **Team size.** A large team needs more coordination than a small one.
- **Overall experience.** A team of juniors needs closer guidance.
- **Project complexity.** A hard problem needs the architect closer to the work.
- **Project duration.** A long project gives more time for drift, so it needs more attention.

Check the factors again during the project. A team that was new in the first month can be strong six months later. Loosen the boundaries as trust grows.

## Warning signs in a team

Fundamentals also names three signs that a team is too large or works badly:

- **Process loss.** Each new person adds less than the one before, because of the cost of coordination. This is the idea behind Brooks's law: adding people to a late project makes it later. A sign is many merge conflicts.
- **Pluralistic ignorance.** Each person privately disagrees with a plan, but each thinks the others agree, so nobody speaks. A sign is silence in a design review, then complaints after it.
- **Diffusion of responsibility.** In a large group, each person expects someone else to act. A sign is a known problem that stays open for weeks.

The architect can act on each one. Keep teams small. Ask each person for an opinion directly, not "any objections?". Give each open problem a named owner.

## Checklists

A checklist catches the steps that a skilled person forgets under pressure. Fundamentals recommends a few short checklists for a team, for example:

- **Code completion.** Before a developer says "done": error handling, logs, tests, the decision record updated.
- **Testing.** The unusual cases that are often missed: empty input, a very large input, a timeout.
- **Release.** The steps of a release that are not automatic: the order of a migration, the flags to switch, the people to tell.

Rules for a useful checklist:

1. Put only the items that people often skip on it.
2. Do not list what a tool already checks. Automate it instead, for example with a [fitness function](/learn/evolution#fitness-functions).
3. Keep it short. A list of 40 items is not read.
4. Remove an item when it is never missed.

A checklist is not a lack of trust. Pilots and surgeons use them because experts also forget.

## Know who cares about what

| Person             | Cares about                             | Wants to hear                                    |
| ------------------ | --------------------------------------- | ------------------------------------------------ |
| Business owner     | Cost, time, risk, income                | What it enables, what it costs, when it is ready |
| Product manager    | Features and dates                      | What becomes faster or possible                  |
| Developers         | A system they can understand and change | The reason, and where they have freedom          |
| Operations         | Stability, alerts at night              | How it fails and how it is repaired              |
| Security and legal | Data, access, the law                   | Where the data is and who can see it             |

Explain the same decision in a different way to each of them. This is not dishonest. It is translation.

Listen for the words people use. A business owner who says "we cannot lose a single order" tells you about reliability and consistency. A product manager who says "we must react to the market" tells you about how fast the system can change. Turn the words into [characteristics](/learn/characteristics), and confirm the translation with the person.

## The architect elevator

Gregor Hohpe, in The Software Architect Elevator, uses a picture of a tall building. The executives work in the penthouse, where they make strategy. The engineers work in the engine room, where they build and run the systems. Many floors of management sit between them.

Information gets lost on each floor. Executives make decisions with an old picture of the technology. Engineers build without knowing the strategy. The architect rides the elevator between the floors. The value is in the connection: carry the business goals down, and carry the real technical limits and options up.

What this means in practice:

- **Speak the language of each floor.** In the penthouse, talk about risk, speed, cost, and options. In the engine room, talk about interfaces, data, and failure.
- **Do not stay on one floor.** An architect who only meets executives loses the technical truth. An architect who only codes cannot change the direction.
- **Make the decision easy to take.** Executives have little time. Give the options, the consequences, and a recommendation. Leave out the details unless asked.

Hohpe also treats the architect as an agent of change in the organization. A team that understands why a system is slow to change makes better choices for years. A single decision helps once.

## How to get a decision accepted

- **Ask before you tell.** People who helped to shape a decision support it.
- **Show options, not one answer.** Bring two or three, with the [trade-offs](/learn/trade-offs), and a recommendation.
- **Use numbers and examples.** "Too slow" starts an argument. "Four seconds for the order page" starts a discussion.
- **Write it down.** A short [decision record](/learn/decision-records) ends the same debate from starting again each quarter.
- **Disagree, and then commit.** Say your concern clearly once. If the decision goes the other way, help it succeed.
- **Give developers the reason, not only the rule.** A team that understands why makes the right choice in the cases you did not foresee.

## Negotiate with each group

Fundamentals gives advice for negotiation with three groups. The advice below is in our own words.

### With business stakeholders

- **Find out before you meet.** Learn what the stakeholder needs and why, so that you can talk about their goals.
- **Turn demands into cost and time.** A stakeholder asks for 99.999% availability. Show what it costs against 99.9%, and how much downtime each allows each year. See [Observability](/learn/observability).
- **Divide the demand.** Often only one part needs the strict level. For a ticket seller, checkout can need high availability, while the reports can stop for an hour at night.

### With other architects

The authors give a short rule: "demonstration defeats discussion". If two architects disagree on a design, build a small test of both options. Measure the result. A number from a real test ends a debate that opinions cannot end. Stay calm and respectful. The aim is the best design, not a win.

### With developers

- **Give the reason first.** A rule with a reason gets respect. A rule without one gets workarounds.
- **Let the developer find the answer.** Ask a question that leads to the problem, for example "what occurs to this call if the price service is slow?". A developer who finds the problem owns the fix.
- **Accept a better idea.** If a developer proposes a better design, take it, and say where it came from.

## The 4 Cs of architecture

Richards and Ford list four qualities that an effective architect brings to a team: **communication, collaboration, clarity, and conciseness**.

| C             | In practice                                                                  |
| ------------- | ---------------------------------------------------------------------------- |
| Communication | The team knows the decisions, the reasons, and the open questions            |
| Collaboration | Decisions are made with the people who build and run the system              |
| Clarity       | One meaning for each term and each diagram. No hidden assumptions            |
| Conciseness   | Short documents, short meetings, one point per diagram. Remove what is extra |

The book links these to a wider warning: architects tend to add complexity. A simple design that the team understands is better than a complex one that only the architect understands. Ask of each part: is this complexity in the problem, or did we add it?

Two more points from the same part of the book:

- **Be pragmatic, yet visionary.** Plan for the future, but make sure the plan can be built with this team, this budget, and this date.
- **Lead by example.** Developers respect an architect who solves real problems with them, not one who gives orders from a distance.

## Stay technical

An architect who has not built anything for years loses the trust of developers and the feeling for cost. Keep some time for real work: a prototype, a code review, a fitness function, a kata.

Fundamentals warns about the **bottleneck trap**. An architect who owns code on the critical path of a release delays the team each time a meeting takes their day. Do the code work that is off the critical path:

- A proof of concept for a risky choice.
- A fix for a bug or a small piece of technical debt.
- Tools and automation, such as a [fitness function](/learn/evolution#fitness-functions) or a build script.
- Code reviews, which also show you how the design is really used.

## In an interview

The way you treat the interviewer is seen as the way you would treat a team. Ask questions, think aloud, take a hint, and change your mind when the argument is good. See [The system design interview](/learn/interview-format).

For a senior role, expect a behavioral round as well. Prepare three or four short stories from your work: a decision you got accepted, a disagreement, a mistake you made and repaired, and a migration you led. For each story, state the situation, what you did, and the result as a number when you can.

## In a kata

Each kata has people and teams in it. Use them as an input to the design:

- The [Lunch Rush kata](/kata/lunch-rush) has four developers. A design with ten services is too much for them to build and run. A [modular monolith](/learn/modular-monolith) is a better match.
- The [Waiting Room kata](/kata/waiting-room) has 120 clinics that move over two years. State who owns each part of the migration, and how the clinics get the news of each change.

In the rationale, name the people who care about each decision, in the words they use.

## Interview questions

**"How do you make developers follow the architecture?"**

- Explain the reasons, not only the rules.
- Involve them in the decisions, and record each one in a decision record.
- Turn the important rules into fitness functions.
- Stay near the team: code reviews, pairing, a prototype.

**"Tell me about a time you disagreed with a technical decision."**

- Describe the situation and the options in short.
- Show that you used data, a prototype, or a test, not only opinion.
- Show that you accepted the result if it went the other way, and helped it succeed.
- Say what you learned.

**"A stakeholder wants 100% availability. What do you say?"**

- Ask what the business loses for each hour of downtime.
- Show the cost of each extra level of availability.
- Divide the system: the strict level only where it matters.
- Agree on a service level objective and write it down.

**"How much do you guide a new team?"**

- Name the factors: experience, familiarity, size, complexity, duration.
- Start closer, with clear boundaries and reasons.
- Loosen the boundaries as the team shows it can decide well.
- Avoid both extremes: the control freak and the armchair architect.

**"How does the team structure affect your design?"**

- Use Conway's law: the system copies the communication structure.
- Put strong interfaces where team boundaries are.
- Change the teams, the inverse Conway maneuver, if the design needs it.

## Go deeper

- **Fundamentals of Software Architecture**, Mark Richards and Neal Ford, the parts on making teams effective and on negotiation and leadership skills. They add the three personalities, the control factors, checklists, and the 4 Cs.
- **The Software Architect Elevator**, Gregor Hohpe, the parts on the architect role and on communication. It adds the elevator, and how to connect the strategy with the technology.
- **Team Topologies**, Matthew Skelton and Manuel Pais. It adds team types, interaction modes, and cognitive load. See [Team Topologies](/learn/team-topologies).
- **Accelerate**, Forsgren, Humble, and Kim, the part on culture. It adds the evidence that a culture of trust links to better delivery.

## Further reading

- [Conway's law](https://en.wikipedia.org/wiki/Conway%27s_law) on Wikipedia
- [Team Topologies, key concepts](https://teamtopologies.com/key-concepts)
- [Brooks's law](https://en.wikipedia.org/wiki/Brooks%27s_law) on Wikipedia
- [The Software Architect Elevator](https://architectelevator.com/), the site of Gregor Hohpe
