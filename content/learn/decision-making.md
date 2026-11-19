## Why deciding is its own skill

To be right and to decide well are two different skills. An engineer can find the best option and still fail. The team waits three weeks for an answer, nobody knows who has the final word, and the next meeting reopens the question.

Bad decision-making has two costs, and neither one is about the quality of the option:

- **The cost of slow decisions.** Each week of waiting blocks work and delays what users get. A late good decision can cost more than an early adequate one.
- **The cost of unclear decisions.** If people do not know what was decided, or who decided, each team acts on its own guess. The result is rework.

Annie Duke (Thinking in Bets) adds a third point. A good decision can have a bad outcome. She calls the habit of judging a decision only by its result "resulting". Judge a decision by the information and the process at the time.

The analysis of options is in [How to analyze a trade-off](/learn/trade-offs). The written record is in [Decision records](/learn/decision-records).

The skill is the same for architects and for product roles, but the position differs. An architect often gives advice and does not own the decision. A product manager often owns the decision and depends on advice.

## One-way and two-way doors

Jeff Bezos, in his 2015 letter to Amazon shareholders, divides decisions into two types:

- **Type 1, a one-way door.** The decision has large consequences and is almost impossible to reverse. Take it slowly, with care.
- **Type 2, a two-way door.** The decision is reversible at a small cost. One person or a small group can take it fast.

His warning is that large organizations tend to use the heavy Type 1 process for all decisions. The result is slowness and less invention. The opposite mistake also exists: a one-way decision taken as if it were cheap.

The type sets the speed and the number of people:

|                   | Two-way door                 | One-way door                          |
| ----------------- | ---------------------------- | ------------------------------------- |
| Architect example | A log library in one service | The main database, a public API       |
| Product example   | Button text, an A/B test     | The pricing model, deleting user data |
| Who decides       | One owner, often the team    | A named decider, with wide input      |
| Time              | Hours or days                | Days or weeks, with a deadline        |
| Record            | A line in a decision log     | A full ADR or decision document       |

Many decisions that look like one-way doors are two-way doors with a price. Ask what it costs to reverse. You can often turn a one-way door into a two-way door with a feature flag, an interface around a vendor, or a pilot. See [decisions as options](/learn/trade-offs#decisions-as-options).

### Decide with about 70% of the information

In his 2016 letter, Bezos writes that most decisions can be made with about 70% of the information you want. If you wait for 90%, you are probably slow. His condition: you must see and correct bad decisions quickly. Then being wrong costs less than being slow.

The 70% figure is a rule of thumb and his opinion, not a measurement. It applies best to two-way doors. For a one-way door, decide at the [last responsible moment](/learn/decision-records#three-anti-patterns). Wait until you know enough, but not until the wait causes damage.

## Who decides

Each decision has three groups of people. If you mix them up, the decision is slow or does not stick.

- **The decider.** One person, or a small group with a clear rule, who makes the final call. The decider is accountable for the result.
- **The people who give input.** They know facts, risks, or costs. The decider must hear them before the decision. They do not vote.
- **The people told after.** They need the result to do their work.

Name the decider before the discussion starts. If nobody is named, the loudest or most senior person often becomes the decider by default.

Input is not approval. A security review that can stop a launch is a different role from a security engineer who gives an opinion. Write down which one it is.

Decision rights must also match authority. A decider who cannot get the budget, the people, or the time to act has a title, not a right. [The RACI matrix](/learn/raci) shows how to map these roles across many tasks.

### Where the advice differs

- **Architects and staff engineers.** You often own technical decisions inside agreed limits, and give input on product decisions. See [what is yours to decide](/learn/architect-role#what-is-yours-to-decide).
- **Product roles.** You often own what to build and in which order. Your main risk is to decide alone on a question with a one-way technical cost.

## Frameworks for group decisions

A framework names the roles, so each person knows their part before the meeting. The idea is the same in each: one clear decider and clear input.

| Framework      | Roles or rule                               | Origin                            | Fits when                                        |
| -------------- | ------------------------------------------- | --------------------------------- | ------------------------------------------------ |
| DACI           | Driver, Approver, Contributors, Informed    | Intuit; made popular by Atlassian | A project decision that needs a person to run it |
| RAPID          | Recommend, Agree, Perform, Input, Decide    | Bain & Company                    | Large organizations with formal vetoes           |
| Consent        | Go ahead if nobody has a reasoned objection | Sociocracy                        | A team that must own the result and can adjust   |
| Consensus      | Go ahead when all agree; each can block     | Many traditions                   | A small group that needs full support            |
| Advice process | One person decides after asking for advice  | Dennis Bakke at AES               | High trust, decisions spread across many people  |

Notes on each:

- **DACI.** The Driver runs the process: collects options, sets the meeting, and writes the result. The Approver decides. Atlassian's play recommends one Approver.
- **RAPID.** Paul Rogers and Marcia Blenko of Bain described it in Harvard Business Review in 2006. The letters do not show the order of the steps. "Agree" is a formal right to block, often held by legal.
- **Consent.** The question is not "do you like it?" but "is it safe enough to try?". An objection must say why the proposal causes harm. A preference is not an objection.
- **Advice process.** Any person can decide, but must first ask the people it affects and the experts. The decider does not have to follow the advice. Frederic Laloux made it widely known in Reinventing Organizations.

Recommendation: for most product and architecture decisions, use a single owner with advice, written down as DACI. Use consent for team agreements, such as working rules. Keep consensus for the few decisions that need active support from each member. This is an opinion: teams with a flat culture use consent much more.

### DACI in practice

How to use it:

1. Write the decision as one question.
2. Name one person for each role, before the work starts. Put the names at the top of a short document.
3. The Driver collects the facts and the options, and asks each Contributor for input by a date.
4. The Approver decides, in a meeting or in writing.
5. The Driver writes the result in the document and tells the Informed people.

Example: the garden tool shop from the [worked example](#worked-example-build-or-buy-search) must decide: "Do we stop support for mobile app versions older than two years?" About 6% of users still have an old version, and each release must still test it.

| Role         | Who                       | What they do in this decision                                         |
| ------------ | ------------------------- | --------------------------------------------------------------------- |
| Driver       | The mobile tech lead      | Writes the document, gets the usage data, and sets the date: 12 March |
| Approver     | The head of product       | Makes the decision                                                    |
| Contributors | Support lead              | Says how many tickets the old versions cause                          |
|              | Security engineer         | Says that the old versions use an old encryption library              |
|              | Marketing lead            | Says how to tell the users, and how many orders the 6% make           |
| Informed     | Customer service, finance | Must know the date, to answer customers and to plan revenue           |

The document has one page:

```text
Decision:      Do we stop support for app versions older than two years?
Driver:        Mobile tech lead       Approver: Head of product
Contributors:  Support, security, marketing      Informed: Customer service, finance
Decide by:     12 March
Options:       A. Keep the support   B. Stop in 3 months, with a message in the app
               C. Stop now
Recommendation: B. The old versions cause 30% of the crash reports and use an old
               encryption library. The 6% of users get three months and a clear message.
Decision:      (the Approver writes it here, with the date)
```

On 12 March, the Approver selects B. The Driver writes the decision in the document, and tells customer service and finance the date. Nobody asks later "who agreed to this?", because the names were there from the start.

### RAPID in practice

How to use it:

1. The **Recommend** person writes a proposal.
2. They ask the **Input** people for facts and risks. Input is advice. It does not bind.
3. They get the **Agree** people to sign off. An Agree person can block. Then the Recommend person changes the proposal, or takes the conflict to the Decide person.
4. The **Decide** person makes the final call.
5. The **Perform** people do the work.

Example: a bank wants to replace the password reset by text message with a reset in the bank's app.

| Role      | Who                                | Their part                                                           |
| --------- | ---------------------------------- | -------------------------------------------------------------------- |
| Recommend | Product manager for accounts       | Writes the proposal: reset in the app, with a face check             |
| Input     | Fraud team, support, user research | Fraud: text messages are often stolen. Support: 9,000 resets a month |
| Agree     | Compliance                         | Must confirm that the face check follows the law on biometric data   |
| Decide    | Head of digital channels           | Makes the final call                                                 |
| Perform   | Mobile team, web team              | Build and release the new flow                                       |

Compliance does not agree. Biometric data needs the user's consent, so users must be able to refuse the face check. The product manager adds a reset by a letter with a code, and compliance agrees. Then the head of digital channels decides. The Agree role found the problem before the build, not after the launch. This is why large companies with legal limits use RAPID.

### Consent in practice

How to use it:

1. One person reads the proposal.
2. **Questions round.** Each person asks questions to understand it. No opinions yet.
3. **Reaction round.** Each person says what they think, once.
4. **Objection round.** Each person answers: "Do you see a reason why this causes harm, or why we cannot safely try it?"
5. Change the proposal to remove each real objection. Then ask again.

Example: a team proposes "each code review starts within one working day".

- **A preference, not an objection:** "I prefer four hours." The proposal is still safe to try.
- **A real objection:** "The on-call engineer cannot do reviews in an on-call week. The rule makes them fail it." This is a harm.

The team changes the proposal: "...except for the engineer who is on call." Nobody objects, so the rule starts. The team agrees to look at it again in one month. A new rule is a two-way door.

### The advice process in practice

How to use it:

1. Write what you want to decide, and why.
2. Ask for advice from the people who the decision affects, and from the experts.
3. Decide. You do not have to follow each piece of advice.
4. Tell everyone what you decided, whose advice you asked for, and what you did with it.

Example: an engineer wants to add a shared library for feature flags. They ask three teams that will use it, the platform lead, and security. The platform lead advises against a new library, because one exists. The engineer reads that library, finds it fits, and decides to use it. The note to the teams says: "I asked mobile, web, checkout, platform, and security. Platform showed me the existing library. I will use it, not a new one." Each person can see that their advice was heard.

## Disagree and commit

The phrase is often linked to Intel under Andy Grove. In High Output Management, Grove describes three stages: free discussion, a clear decision, and full support. Bezos used "disagree and commit" in his 2016 letter, with a case where he disagreed with a team and committed to its plan.

The idea: when a group does not agree, a person states the disagreement, and then supports the decision fully. It is not a tool to end a discussion early.

### How to disagree well

1. Disagree before the decision, not after it.
2. Disagree once and clearly, with your reasons and your data.
3. Disagree with the option, not with the person.
4. Say what would change your mind.
5. Ask the decider to put your concern in the record.

### What commit requires

Commit is more than silence. It means:

- You act as if the decision were your own. You do not wait for it to fail.
- You do not reopen the decision without new information.
- You explain the decision to your team fairly, without "they decided this".
- You watch for the agreed signal to revisit, and raise it when it appears.

### An example

In the [search decision](#worked-example-build-or-buy-search), the platform lead prefers to run an open-source engine. Before the decision, in the meeting, they say:

> "I recommend option B. A hosted service costs about three times more after two years, and we cannot change the ranking much. If the vendor can show an EU region and a one-year contract, my main concern goes away. Please put the cost concern in the record."

This follows the five steps: before the decision, once, about the option, with what would change their mind, and on the record.

The head of product selects C. After the meeting, the platform lead:

- Builds the search interface so that the hosted service works well. They do not build it so that it fails and proves them right.
- Tells their team: "We use a hosted service for one year. The reason is the spring date. I preferred to run our own, and the cost is in the record."
- Sets an alert for the agreed signal: a yearly license above the cost of one engineer.

Ten months later, the license is near that limit. The platform lead brings the new numbers. That is not reopening the decision. It is the agreed trigger.

Commit does not apply to a decision that is unsafe, illegal, or unethical. Escalate those.

The practice is contested. Critics say that leaders can use it to silence dissent. Without a real hearing first, it is compliance, not commitment.

## How to prepare a decision

Many decision meetings fail before they start. Prepare these items in writing, before the meeting:

| Item            | Question it answers                           |
| --------------- | --------------------------------------------- |
| Problem         | What is wrong now, and for whom?              |
| Decision        | What exactly must we decide?                  |
| Door type       | What does it cost to reverse?                 |
| Decider         | Who makes the final call?                     |
| Input           | Whose facts or risks must we hear?            |
| Criteria        | What makes an option good, in priority order? |
| Options         | Which two or three real options exist?        |
| Deadline        | By which date do we decide?                   |
| Revisit trigger | What signal makes us look again?              |

- **Frame the problem before the decision.** "Which search vendor?" assumes that you buy. "How do users get relevant results by spring?" keeps the options open.
- **Agree the criteria before you score the options.** If you score first, people select the criteria that favor their option. Keep to three or four criteria. Treat a hard limit as pass or fail.
- **Widen the options.** Chip and Dan Heath (Decisive) call the "this or not" question "narrow framing". See [How to analyze a trade-off](/learn/trade-offs).
- **Set a deadline.** It also tells people when their input is due.
- **Bring a recommendation.** Propose one option, with its main cost.

## Product and architecture decisions

Product owns the "what" and the "why". Engineering and architecture own the "how". Many important decisions sit across the line, and each needs a named decider.

| Decision                             | Usual decider                                    | Must give input                  |
| ------------------------------------ | ------------------------------------------------ | -------------------------------- |
| Which problem to solve next          | Product                                          | Engineering: cost, risk          |
| Language, framework, data store      | Engineering                                      | Operations                       |
| Service boundaries and API contracts | Architecture                                     | Product: future needs            |
| Scope cut to meet a date             | Product                                          | Engineering: what is safe to cut |
| Quality targets                      | Shared: product sets need, architect states cost | Operations, finance              |
| Build or buy                         | Shared, often one senior approver                | Finance, security, legal         |
| Launch date                          | Product                                          | Engineering, support             |
| Technical debt work                  | Engineering, inside agreed capacity              | Product: timing                  |

This table shows a common split, not a rule. Agree on your own version once, and write it down.

Most conflict starts in shared decisions. Two rules help:

- **Give each shared decision one decider anyway.** "Shared" must not mean "nobody".
- **Translate the cost for the other side.** "This latency target doubles the hosting cost" is clear to product. See [the lesson on teams](/learn/teams).

Make quality targets [measurable](/learn/measuring-characteristics) first. For the order of work, see [Prioritization](/learn/prioritization).

### Avoid hidden decisions

- **Architects.** Do not decide a product question by technical means. A design that quietly blocks a feature is a hidden product decision. Make the cost visible, and let product decide.
- **Product roles.** Do not decide the "how" through a date. A date that forces one design is a hidden technical decision. Ask for options with their costs.

## Record and revisit

Not every decision needs an ADR. Use two levels of record:

- **A decision log** for two-way doors and product decisions. One row: date, decision, decider, revisit trigger, link.
- **An ADR** for one-way, architecturally significant decisions. One page next to the code. See [Decision records](/learn/decision-records).

Write the revisit trigger with the decision. Revisit when the trigger occurs, when new facts appear, or on the review date. Do not revisit only because the person who lost asks again.

### Reverse a two-way door without drama

1. State in the original decision that it is a trial, with a date and a metric.
2. When the data says "reverse", let the decider announce it, with the reason.
3. Record the reversal as a new entry that links to the first one.
4. Do not edit or delete the first entry.

A planned reversal is the process at work, not a failure.

## Failure modes

| Failure                     | Sign                                                | Fix                                                           |
| --------------------------- | --------------------------------------------------- | ------------------------------------------------------------- |
| Decision by committee       | Many voices, no owner, a weak compromise            | Name one decider; others give input                           |
| HiPPO                       | The most senior person speaks, the discussion stops | Senior people speak last; collect positions in writing first  |
| The reopened decision       | The same question in every meeting                  | Record the reason and the trigger; reopen only with new facts |
| A decider with no authority | Decisions are made, nothing changes                 | Match the decision right to budget and people                 |
| Analysis paralysis          | More data is requested each week                    | Set a deadline; classify the door                             |
| Silent veto                 | Agreement in the meeting, slow blocking after       | Ask each person directly; make vetoes explicit                |

HiPPO means "the highest paid person's opinion". Others stop talking because they expect the result.

The reopened decision is the [groundhog day](/learn/decision-records#three-anti-patterns) anti-pattern. The cause is usually a missing reason.

A silent veto is the hardest to see. Ask each person by name: "can you commit to this?"

## Worked example: build or buy search

An online shop for garden tools has eight engineers. Search uses simple text matching in the main database, and users cannot find products that exist. Product wants better search before spring, four months away.

**Frame.** The decision: how do users get relevant search results before spring?

**Door type.** The shop keeps its own catalog and copies data to the search engine. To switch away later costs about one quarter of work: a two-way door with a price. A three-year contract would make it close to one-way, so the team asks for one year.

**Framework and roles.** DACI. The Driver is a staff engineer. The Approver is the head of product, who owns the budget and the date. Contributors are the platform lead, finance, and security. Marketing is Informed.

**Criteria, agreed first.** Ready before spring. Total cost over two years. Control over the ranking of results. Customer data stays in the EU, as a pass-or-fail limit.

**Options.**

| Option                       | Before spring | Two-year cost        | Ranking control | EU data         |
| ---------------------------- | ------------- | -------------------- | --------------- | --------------- |
| A. Improve database search   | Yes           | Lowest               | Low             | Pass            |
| B. Run an open-source engine | At risk       | Medium, plus on-call | High            | Pass            |
| C. Buy a hosted service      | Yes           | Highest              | Medium          | Pass, EU region |

Next year's query volume is unknown. The door is two-way, so the team decides anyway.

**Decision.** The Approver selects C, with a one-year contract. The shop calls search through its own interface, so the vendor stays replaceable. The platform lead preferred B, has the concern recorded, and commits.

**Revisit trigger.** Look again if the yearly license costs more than one engineer, or if ranking needs go beyond the vendor's features.

**Record.** A decision log entry holds the purchase, the decider, and the trigger. An ADR holds the search interface and the data copy, because those are architecture.

## In a kata

The [kata method](/learn/method) has five steps. In a kata you decide alone, so write who would decide in a real team.

- **Set the scope.** Scope is a product decision. Write what you assume the product owner decided.
- **Select characteristics.** This decision is shared: product sets the need, and you state the cost. See [characteristics](/learn/characteristics).
- **Select a style.** This is usually a one-way door. Spend most of your time here. See [styles](/learn/styles).
- **Draw.** Most choices here are two-way doors. Do not over-analyze them.
- **State trade-offs.** Write each main decision with its door type, its cost, and its revisit trigger.

## In an interview

**Architects and staff engineers** are tested in two rounds. In the design round, spend time on the one-way doors, and state assumptions for the rest. In the behavioral round, expect "a time you disagreed". See [Behavioral interviews](/learn/behavioral-interviews).

**Product candidates** are tested in product sense and execution rounds. Expect scope against date, incomplete data, and a senior stakeholder who overrules the team. Interviewers listen for a named decider, early criteria, and a metric.

For both, include one story with a bad outcome from a good process. It shows that you judge decisions, not luck.

## Interview questions

**"How do you decide when the team cannot agree?"**

- Make sure a decider is named, and that each person was heard.
- Classify the door: a two-way door can be a short trial.
- Decide, record the dissent, and ask each person to commit.

**"As a product manager, tell me about a decision you made with incomplete information."**

- Say what you knew, what you did not know, and why waiting cost more.
- Name the door type, and the metric and date you set to check it.
- Say what the data showed and what you changed.

**"Engineering says the date is impossible, and sales has promised it. What do you do?"**

- Separate the date from the scope: ask what can ship by the date.
- Ask engineering for options with their costs, not one answer.
- Tell sales and the customer early, with the chosen option.

**"As the architect, which technical decisions need you?"**

- One-way doors: structure, data ownership, public interfaces, main characteristics.
- Decisions that cross teams or cost real money.
- Leave two-way doors inside one team to that team, and say so explicitly.

**"As the architect, you disagree with a product decision. What do you do?"**

- Accept that product owns it, and state the technical cost once, in business terms.
- Say what would change your mind, and ask for the concern in the record.
- After the decision, commit and help it succeed.

**"Who owns a build-or-buy decision, and how do you run it?"**

- It is a shared decision: name one approver, often the budget owner.
- Get input from engineering, finance, security, and legal, on criteria agreed first.
- Keep it reversible: short contract, own interface around the vendor.

## Go deeper

- **High Output Management**, Andy Grove, the part on decision-making. It adds the three stages and the questions to settle first: what, when, who decides, who is asked, who can veto, who is told.
- **The Effective Executive**, Peter Drucker, the chapters on decisions. It adds that a good decision needs disagreement, and is not complete until someone is responsible for carrying it out.
- **Thinking in Bets**, Annie Duke. It adds the difference between decision quality and outcome, and how to learn from results without "resulting".
- **Decisive**, Chip and Dan Heath. It adds the WRAP process and the trap of narrow framing.

## Further reading

- [DACI: a decision-making framework](https://www.atlassian.com/team-playbook/plays/daci), the Atlassian Team Playbook
- [Consensus decision-making](https://en.wikipedia.org/wiki/Consensus_decision-making) on Wikipedia
- [Sociocracy](https://en.wikipedia.org/wiki/Sociocracy) on Wikipedia, the source of the consent rule
- [Analysis paralysis](https://en.wikipedia.org/wiki/Analysis_paralysis) on Wikipedia
- [Responsibility assignment matrix](https://en.wikipedia.org/wiki/Responsibility_assignment_matrix) on Wikipedia
