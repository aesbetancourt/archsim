## What the round tests

A behavioral interview asks about your past work: "Tell me about a time you…". How you acted in real situations is a better guide to your next job than what you say you would do. Research on hiring also finds that structured interviews, with set questions and a set way to score, predict success better than a free talk.

For a senior engineer, a staff engineer, or an architect, this round often decides the offer. The design round shows that you can design. The behavioral round shows that other people will follow your designs.

The questions are the same at each level. The bar changes:

| Signal    | Mid-level engineer            | Senior, staff, or architect                                          |
| --------- | ----------------------------- | -------------------------------------------------------------------- |
| Scope     | One feature or one service    | Several teams, a product line, or the whole platform                 |
| Influence | Convinces their own team      | Convinces teams, managers, and executives that do not report to you  |
| Ambiguity | Gets a clear task and does it | Finds the problem, frames it, and decides what to do first           |
| Judgment  | Makes a good technical choice | Makes a choice with incomplete data, names the risk, and can undo it |
| Growth    | Learns from others            | Makes other engineers better                                         |

### How the panel scores

Most companies give each interviewer a list of competencies to test, for example influence, conflict, and ownership. Amazon uses its leadership principles as this list. The interviewer asks one or two main questions for each competency, then asks follow-ups: "What did you do next?", "What was the other option?", "What did your manager think?".

After the interview, each interviewer writes notes and gives a score for each competency, often on a four-point scale from "strong no" to "strong yes". The panel then meets and decides. Two facts follow from this:

- **The interviewer needs evidence for the notes.** A vague answer gives nothing to write. A specific action and a number give a line in the notes.
- **The follow-ups test if the story is real.** A true story has details at every depth. An invented or borrowed story breaks after two follow-ups.

## The shape of a good answer

Use STAR: situation, task, action, result. Then add a reflection: what you learned, or what you would do differently. Some people call this STAR-L or CARL. The name does not matter. The parts do.

| Part       | What it contains                                    | Rough time in a 2 to 3 minute answer |
| ---------- | --------------------------------------------------- | ------------------------------------ |
| Situation  | The company, the system, the scale, and the problem | 15 to 20 seconds                     |
| Task       | Your role and what you had to achieve               | 10 to 15 seconds                     |
| Action     | What you did, step by step, and why                 | 60 to 90 seconds                     |
| Result     | What changed, with numbers                          | 15 to 25 seconds                     |
| Reflection | What you learned, or what you would change          | 10 to 20 seconds                     |

The times are rough. The proportion matters more: about half of the answer is the action. Most weak answers spend a minute on the situation and ten seconds on the action.

Four rules make the difference:

1. **Say "I", not "we".** The panel hires you, not your team. Say "we" for the team's goal, and "I" for each thing you did. "We had to cut the checkout errors. I ran the load test and I wrote the proposal."
2. **Put numbers in the result.** Use the error rate, the latency, the cost, the time saved, the number of teams, or the incidents each month. A rough number is fine: "about 40% fewer pages". If you have no number, name a visible change: "the team stopped the weekly sync meeting".
3. **Show the decision.** Name the options you saw, the one you chose, and the cost you accepted. This is the same pattern as in a [trade-off analysis](/learn/trade-offs), and it is what makes a story senior.
4. **Stop at the end.** Finish with the reflection, then stop. The interviewer asks a follow-up if they want more.

## What an architect is asked about

Each competency below is a family of questions. The last column links to the lesson that gives you the vocabulary.

| Competency                           | What the panel wants to hear                                                                 | Related lesson                                                               |
| ------------------------------------ | -------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| Influence without authority          | You moved people who did not report to you, with data, a prototype, or a written proposal    | [Teams](/learn/teams#how-to-get-a-decision-accepted)                         |
| Technical decision under uncertainty | You framed the options, decided with incomplete data, and kept a way back                    | [Trade-offs](/learn/trade-offs), [Decision records](/learn/decision-records) |
| Disagreement and conflict            | You stated the other view fairly, separated the people from the problem, and committed after | [Teams](/learn/teams#negotiate-with-each-group)                              |
| A failure or a wrong decision        | You own the mistake, you repaired it, and you changed how you work                           | [Decision records](/learn/decision-records)                                  |
| Saying no                            | You said no to a person with more power, with a reason and an alternative                    | [The architect role](/learn/architect-role#the-architect-elevator)           |
| Simplifying a complex system         | You removed parts, not only added them, and the team moved faster after                      | [Evolution](/learn/evolution#technical-debt)                                 |
| Mentoring and growing others         | Someone is better at the job because of you, and you can name what changed                   | [Teams](/learn/teams)                                                        |
| Working with product and executives  | You translated between business goals and technical options, in their words                  | [The architect role](/learn/architect-role#the-architect-elevator)           |
| An incident                          | You stayed calm, restored service first, and led a blameless follow-up                       | [Incident response](/learn/incident-response#blameless-postmortems)          |
| A migration                          | You moved a live system in steps, with a plan to stop or go back                             | [Evolution](/learn/evolution#the-strangler-fig)                              |
| Raising quality                      | You changed a practice for many teams: tests, reviews, fitness functions, or standards       | [Evolution](/learn/evolution#fitness-functions)                              |

Team structure appears in many of these stories. A migration story often includes a change of team ownership. A conflict story often comes from two teams in the wrong interaction mode. See [Team Topologies](/learn/team-topologies#the-three-interaction-modes) for the words to describe it.

## Build a story bank

Do not prepare one answer for each question. Prepare 8 to 12 true stories, and learn to tell each one from several angles.

One good story serves several competencies. A migration that you led has a decision under uncertainty, a disagreement with another team, a moment when a plan went wrong, and a result with numbers. You tell the same facts, but you put the focus on a different part.

### A reuse matrix

Make a table with your stories as rows and the competencies as columns. Mark the competencies that each story can answer well. The example below uses six invented stories.

| Story                                       | Influence | Decision | Conflict | Failure | Saying no | Incident | Migration | Mentoring |
| ------------------------------------------- | --------- | -------- | -------- | ------- | --------- | -------- | --------- | --------- |
| Seat-hold redesign at a ticket seller       | Yes       | Yes      | Yes      |         |           |          |           |           |
| Tracking database split at a parcel service |           | Yes      |          |         |           |          | Yes       |           |
| Label printer outage on a peak day          |           |          |          | Yes     |           | Yes      |           |           |
| A new event bus that I pushed too early     |           | Yes      |          | Yes     |           |          |           |           |
| A request from a vice president for a date  |           |          | Yes      |         | Yes       |          |           |           |
| A senior engineer who became tech lead      |           |          |          |         |           |          |           | Yes       |

Look for empty columns, and for columns with only one mark. In the example, decision, conflict, and failure have two stories or more. Influence, saying no, incident, migration, and mentoring have only one each. Each competency needs at least two stories, so you can use a second one if the panel asks two similar questions. Look also for a story that fills too many columns. If you use it three times in one loop, the panel sees a narrow career.

### How to write each story

Write a short note for each story, not a script. A script sounds memorized. Use the same fields for each story:

1. **Title.** A short name you can recall under stress.
2. **STAR in five lines.** One line each for the situation and the task. Two lines for the actions. One line for the result.
3. **The numbers.** Scale, before and after, time, money, and people.
4. **The decision.** The options, the choice, and the reason.
5. **The trade-off.** What the choice cost, and who paid for it.
6. **The conflict.** Who disagreed, and their best argument.
7. **The lesson.** One sentence about what you do differently now.

Practice each story aloud, with a timer. Then practice the follow-ups. Ask a friend to ask "why?" three times on each action.

The [Notebook](/notebook) has a Story bank for this. Keep your notes there, and mark the competencies that each story covers.

## A worked example

The story is invented, in the style of the app's katas. The question is: "Tell me about a time you changed a technical direction that you did not own."

### The weak answer

> We had a lot of problems on big on-sale days at the ticket company. The checkout was slow and people complained. We looked into it and decided to change the seat locking. We also added a waiting room. After that it worked much better and the business was happy. I think it was a good project for the team.

### The strong answer

> **Situation.** I was the architect for the checkout area of a ticket seller. At large on-sales, about 12% of checkout attempts failed in the first ten minutes. The payments team, which did not report to me, planned a nine-month move to a new event-driven platform to fix it.
>
> **Task.** I did not own the payments roadmap. But I thought the cause was somewhere else, and I had to show it before the team spent nine months on the wrong fix.
>
> **Action.** First, I ran a load test that copied the traffic of the last big on-sale. About 70% of the failures came from lock waits on one seat table, not from payments. I showed the result in the weekly architecture review. Then I wrote a decision record with three options: the platform move, a seat hold with a ten-minute timeout, and a queue for each event. I recommended the seat hold, plus a waiting room in front of checkout. The cost was that some fans would see "sold out" and then see seats come back when holds expired. The product manager accepted that, with a clear message on the page. We tried it on one mid-size on-sale first.
>
> **Result.** Checkout failures at peak dropped from about 12% to below 1%. The change took six weeks. The payments team moved the platform work to the next year, as a separate decision.
>
> **Reflection.** I showed the data in that review before I talked to the payments lead. The lead felt surprised in front of the team, and that cost me two weeks of trust. Now I share data with the owner first.

### What makes the difference

| Weak answer          | Strong answer                                                             |
| -------------------- | ------------------------------------------------------------------------- |
| "We" for everything  | "I ran", "I wrote", "I recommended": each action has an owner             |
| "A lot of problems"  | 12% of checkouts failed, in the first ten minutes                         |
| No conflict          | Another team had a different plan, and it was a reasonable plan           |
| No options           | Three options, one choice, and the cost that the product manager accepted |
| "Worked much better" | From 12% to below 1%, in six weeks instead of nine months                 |
| No lesson            | A specific mistake, and a specific habit that came from it                |

The strong answer is about two and a half minutes aloud. It also invites follow-ups that you can answer, such as "How did you design the load test?".

## Common mistakes

| Mistake                         | The fix                                                                                      |
| ------------------------------- | -------------------------------------------------------------------------------------------- |
| The answer is too long          | Keep it to 2 to 3 minutes. Cut the situation to two sentences. Let follow-ups add detail.    |
| No result                       | End with what changed, with a number. If the project failed, say that, and what you learned. |
| Blame                           | Describe the other side's reasons fairly. Talk about the problem, not the person.            |
| All "we"                        | Say "I" for each of your actions. Say "we" only for the team's goal.                         |
| A story with no conflict        | Choose a story where someone disagreed, or where the right path was not clear.               |
| A hero story                    | Show the people who helped. A staff role is about making others succeed, not a solo rescue.  |
| An answer that is not a story   | "I usually…" is an opinion. Give one specific time, with a date and a place.                 |
| Invented stories                | Use only true stories. Follow-ups find invented ones, and the panel stops trusting you.      |
| No reflection                   | Add one sentence about what you learned or would change. It shows judgment.                  |
| A failure that is not a failure | "I work too hard" is not a failure. Choose a real mistake with a real cost.                  |

## Questions to ask the interviewer

The last minutes are yours. Good questions show what you care about, and they give you facts to decide on the offer.

| Question                                                                      | What it reveals                                                               |
| ----------------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| "How does an architecture decision get made here, from idea to accepted?"     | If architects decide, advise, or only document. If records exist.             |
| "Tell me about a recent decision that an architect got wrong. What happened?" | If mistakes are safe to admit, and if the company learns from them.           |
| "Which teams would I work with most, and how do they work together today?"    | The real scope of the role, and the friction between teams.                   |
| "How much of the role is hands-on: code, prototypes, reviews?"                | If you can [stay technical](/learn/teams#stay-technical), or only draw boxes. |
| "What does success look like in this role after one year?"                    | If the goals are clear and if they match your strengths.                      |
| "What is the biggest technical risk in the system today?"                     | The real problems, and if the interviewer is open about them.                 |
| "How does the company handle incidents and postmortems?"                      | If the culture is blameless, and how much on-call the role has.               |

## Interview questions

The questions follow the order of the competencies above. Answer each one aloud with a story from your bank.

**"Tell me about a time you changed the mind of a team that did not report to you."**

- A real disagreement, with the reason of the other side stated fairly.
- What you did: data, a prototype, a written proposal, or a small trial.
- The result, with a number or a visible change.
- What you learned about influence.

**"Tell me about a time you had to get several teams to agree on one standard."**

- Why one standard mattered, and the cost of no standard.
- How you collected the needs of each team before you proposed.
- How you made the decision visible, for example a decision record.

**"Describe a proposal of yours that people rejected."**

- What you proposed, and why the others said no.
- How you checked if their reasons were right.
- What you did next: a changed proposal, a trial, or acceptance.

**"Tell me about a technical decision you made with incomplete information."**

- What you knew, what you did not know, and why you could not wait.
- The options you compared, and the one you chose.
- How you kept the decision reversible, or limited the damage.
- How it turned out, and what new data you got later.

**"Tell me about a time you chose a simpler solution over a more advanced one."**

- The advanced option and why it was attractive.
- The requirements that made the simple option good enough.
- The cost you accepted, and the condition that would change the choice.

**"Describe the most important architecture decision you made in your last role."**

- The business problem behind it, in business terms.
- The options and the trade-off, with numbers.
- Who had to agree, and how you got them to agree.

**"Tell me about a strong disagreement with another engineer or architect."**

- The two positions, both stated fairly.
- How you kept it about the problem, not the person.
- How it was decided: data, a trial, or an escalation with both views written down.
- How you supported the result, also if it went the other way.

**"Tell me about a conflict between two teams that you helped to resolve."**

- The cause of the conflict: unclear ownership, a shared component, or different goals.
- What you did to make the cause visible.
- The change: a new boundary, a new owner, or a clear interaction mode.

**"Tell me about a time you disagreed with your manager."**

- The topic, and why it mattered.
- How and where you raised it: in private, with facts.
- The decision, and how you acted after it.

**"Tell me about a decision of yours that turned out to be wrong."**

- The decision, and why it looked right at the time.
- The moment you saw it was wrong, and the signal that showed it.
- How you repaired it, and how much it cost.
- What you changed in how you decide.

**"Describe a project that failed."**

- Your role, and the part of the failure that was yours.
- The cost: time, money, users, or trust.
- What you did when it began to fail.
- The change in your practice since then.

**"Tell me about a time you noticed a problem too late."**

- The problem, and why the early signals were missed.
- What you did when you saw it.
- The check, alert, or habit you added so it does not happen again.

**"Tell me about a time you said no to a senior stakeholder."**

- The request, and why it was a bad idea for the system or the business.
- How you said no: with a reason, a cost, and an alternative.
- The result: what was built instead.

**"Tell me about a time you pushed back on a deadline."**

- The deadline, and the risk you saw in it.
- The options you offered: less scope, more time, or more risk accepted in writing.
- The decision, and who made it.
- What happened at the deadline.

**"Tell me about a time you made a complex system simpler."**

- What made it complex, with a measure: services, dependencies, steps, or lines.
- What you removed or merged, and why it was safe.
- How you convinced the people who liked the old design.
- The result: faster changes, fewer incidents, or fewer people needed.

**"Tell me about someone you mentored who grew because of you."**

- Where the person started, and what they wanted.
- What you did: pairing, feedback, a stretch task, or a sponsor role.
- What the person can do now that they could not do before.

**"How have you raised the design skills of a whole team?"**

- The gap you saw, with an example.
- The practice you started: design reviews, decision records, katas, or guilds.
- How you made it last after you stepped back.

**"Tell me about a time you delegated a decision you could have made yourself."**

- Why you chose to delegate it.
- How you set the boundaries and the support.
- What happened, also if the result was different from your choice.

**"Tell me about a time you explained a technical risk to an executive."**

- The risk, translated into money, time, or customers.
- The format you used: one page, a picture, or a few numbers.
- The decision the executive made.

**"Tell me about a time product and engineering wanted different things."**

- The two goals, stated fairly.
- How you found an option that served both, or made the trade-off explicit.
- Who decided, and with which information.

**"Tell me about a serious incident you were part of."**

- Your role in the response, and the first action you took.
- How the team restored service before it found the cause.
- The postmortem: the causes, not the person.
- The change to the system or the process, and if the incident came back.

**"Tell me about a time a design of yours failed in production."**

- What failed, and the effect on users.
- How you found the cause.
- The fix, and the design lesson behind it.

**"Tell me about a large migration you led."**

- Why the migration was needed, in business terms.
- How you split it into steps that each delivered value.
- How you kept a way back at each step.
- The result: time, cost, and what you would plan differently.

**"Tell me about a migration that you stopped or changed halfway."**

- The signal that the plan was wrong.
- How you decided to stop or change it, and who agreed.
- What you kept from the work done.

**"Tell me about a time you raised the quality bar across several teams."**

- The quality problem, with a measure: defects, incidents, or review time.
- The practice or tool you introduced, and why that one.
- How you got teams to adopt it without an order from above.
- The change in the measure.

**"Tell me about a time you made an automated check part of the build."**

- The rule that people kept breaking, and its cost.
- The check you added, for example a fitness function or a contract test.
- How you handled the first failures, so teams did not turn it off.

**"Tell me about a time you worked on an ambiguous problem with no clear owner."**

- How you found out what the real problem was.
- How you framed it, and who you brought in.
- The first step you took, and why that one.
- Who owns the problem now.

**"Why do you want to be an architect, and not a senior engineer or a manager?"**

- What you like about the work of an architect, with an example.
- How you stay technical and still work through others.
- What you know about the cost of the role: less code, more meetings.

## Go deeper

- **The Software Architect Elevator**, Gregor Hohpe, the parts on the architect's role and on communication with management. It adds the elevator: the architect connects the executive floor and the engine room.
- **Fundamentals of Software Architecture**, Mark Richards and Neal Ford, the parts on negotiation and leadership skills. They add how to negotiate with each group, and the 4 Cs. See [Teams](/learn/teams#the-4-cs-of-architecture).
- **Team Topologies**, Matthew Skelton and Manuel Pais, the parts on team interaction modes and cognitive load. They give you the words for many conflict and migration stories. See [Team Topologies](/learn/team-topologies).

## Further reading

- [Situation, task, action, result](https://en.wikipedia.org/wiki/Situation,_task,_action,_result) on Wikipedia
- [Gregor Hohpe's site for The Software Architect Elevator](https://architectelevator.com/)
- [Team Topologies, key concepts](https://teamtopologies.com/key-concepts)
