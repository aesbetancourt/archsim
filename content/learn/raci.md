## The problem it solves

Most work that fails between teams does not fail on technology. It fails on ownership. Four symptoms are common:

- **Unclear ownership.** A decision waits for weeks, because each person thinks someone else must make it.
- **Duplicate work.** Two teams write the same migration script, because both thought it was theirs.
- **Work that nobody does.** Nobody tells the support team about the change, and the first customer call is a surprise.
- **Too many people in each meeting.** Everyone attends everything, because nobody knows who really needs to be there.

A **responsibility assignment matrix** fixes these with a table. The rows are activities or decisions. The columns are roles. Each cell says what that role does for that row. RACI is the most common form of the matrix. It comes from project management practice, and the PMBOK Guide (PMI) describes it as an example of a responsibility assignment matrix.

The matrix does not create authority. It makes the agreement visible, so that people see the gaps before they cost time. It is a direct fix for the diffusion of responsibility that [Teams and communication](/learn/teams#warning-signs-in-a-team) warns about.

## The four letters

| Letter | Role        | Question it answers                       | Communication                | How many per row  |
| ------ | ----------- | ----------------------------------------- | ---------------------------- | ----------------- |
| R      | Responsible | Who does the work?                        | Does the work, reports to A  | At least one      |
| A      | Accountable | Who answers for the result and signs off? | Approves, decides at the end | Exactly one       |
| C      | Consulted   | Whose input do we need before we act?     | Two-way, before the work     | As few as you can |
| I      | Informed    | Who must know the result?                 | One-way, after the work      | As many as needed |

The two letters that people confuse most are R and A:

- **Responsible** is the person or team that does the work. A row can have several. They write the code, the plan, or the contract.
- **Accountable** is the one person who answers for the result. This person approves the work, signs it off, and takes the question "why did this go wrong?". A can delegate the work, but not the accountability.

C and I differ in direction and in timing:

- **Consulted** people give input before the work. It is a conversation, usually with experts such as security or legal.
- **Informed** people hear the result after it. It is a message, not a discussion, for example to the support team before a launch.

A simple test: if you must wait for a person's answer, they are C. If you only send them the result, they are I.

## The rules

Apply these rules to each row:

1. **One A per row.** Two As means nobody is accountable. When they disagree, the work stops.
2. **At least one R per row.** An A without an R is a task that nobody does.
3. **A and R can be the same person.** Write "A/R". This is normal for small decisions.
4. **Keep C small.** Each C adds a conversation and a delay. Two or three is usually enough.
5. **I is not a meeting invite.** Informed people get a message, a release note, or a link. They do not attend the decision.

Then check the columns. Each column shows the load on one role:

- **A column with no empty cells.** This role is in everything. It is overloaded, or it is a bottleneck. Remove the rows where it adds nothing.
- **A column with many As.** This person approves too much. Delegate some rows to the people who do the work.
- **A column with only I.** This role is perhaps not needed in the matrix. Send it a summary instead.

Finally, check the rows as a group. A row with many Cs is slow. A row with no I is often a row where someone downstream gets a surprise.

## How to build one

1. **List the activities or decisions as rows.** Use verbs: "select the provider", not "provider". A topic has no owner. An action does.
2. **Use roles as columns, not names.** People change jobs. Roles stay. Keep a separate list that maps roles to names.
3. **Fill in the A column first.** For each row, agree on the one accountable role. Most arguments start here, so do this first.
4. **Fill in R next.** Name who does the work.
5. **Add C and I last.** Add a C only when the input changes the result. Add an I only when the person must act on the news.
6. **Review the matrix with the people in it.** A person who learns from a document that they are accountable did not agree to it.
7. **Publish it where the work happens.** Put it in the project page, the repository, or the ticket. A matrix in a slide deck is lost after one meeting.
8. **Revisit it at each change of phase or team.** The roles for design are not the roles for the launch.

Keep the matrix to one screen, about ten rows and eight columns. A larger one usually means that the rows are too small.

## A worked example: a new payment provider

A shop moves checkout payments to a new payment provider. The old provider is expensive and has had outages.

In the table, PM is the product manager and EM is the engineering manager. The tech lead column stands for the development team that does the work.

| Activity                                 | PM  | EM  | Architect | Tech lead | Security | Finance | Support | Legal |
| ---------------------------------------- | --- | --- | --------- | --------- | -------- | ------- | ------- | ----- |
| Decide to switch provider                | A/R | C   | C         | I         | –        | C       | I       | C     |
| Select the provider                      | A   | I   | R         | C         | C        | R       | –       | C     |
| Design the integration                   | I   | I   | C         | A/R       | C        | –       | –       | –     |
| Approve the architecture decision record | I   | I   | A         | R         | C        | –       | –       | –     |
| Write the code                           | –   | A   | –         | R         | –        | –       | –       | –     |
| Run the security review                  | –   | I   | C         | C         | A/R      | –       | –       | –     |
| Set the launch date                      | A/R | C   | –         | C         | I        | I       | C       | I     |
| Migrate the stored cards                 | I   | A   | C         | R         | C        | –       | I       | C     |
| Tell customers                           | A   | –   | –         | –         | –        | –       | R       | C     |
| Run the rollback                         | I   | I   | –         | A/R       | –        | –       | I       | –     |

### Why the matrix looks like this

- **The PM is A for why and when, not how.** The PM owns the decision to switch, the selection, the date, and the message to customers. The PM is not in the rows about code.
- **Two Rs on the selection.** The architect evaluates the technical fit: API quality, uptime record, card migration support. Finance evaluates the fees and the contract. One A, the PM, weighs both against the goal for checkout.
- **The architect is A for one row.** The architect approves the [decision record](/learn/decision-records), which the tech lead writes. The architect is C on the design and not present on the code. This keeps the team in charge of its own work.
- **Security owns its review.** Security is A/R for the review. Nobody else can approve it on their behalf.
- **Support is R for telling customers.** Support writes the messages and answers the questions. The PM is A, because the message is part of the product.

### The deliberate trade-off

The rollback row gives the tech lead A/R. The PM is only I. This is on purpose. During a failed launch, payments fail each minute, and a rollback cannot wait for a meeting. The matrix trades product control for speed.

The condition is that the PM agrees to the rollback criteria before the launch. For example: "roll back if the payment error rate is above 2% for five minutes." The PM is C on those criteria in the launch plan. On the day, the tech lead acts, and the PM hears about it after.

Apply the column check to this matrix. The tech lead has few empty cells. That is a real risk on a project this size. One fix is to give the card migration to a second engineer as R.

## Architecture decisions in a product team

The same tool answers a question that causes friction in many companies: who decides which technical question? The answer depends on the reach of the decision.

| Decision                                        | Owning team tech lead | Other teams | Architect | Platform team | PM  |
| ----------------------------------------------- | --------------------- | ----------- | --------- | ------------- | --- |
| Choose a library or database inside one service | A/R                   | –           | C         | I             | –   |
| Change a public API that other teams use        | A/R                   | C           | C         | –             | I   |
| Choose a platform technology for all teams      | C                     | C           | A         | R             | I   |
| Set a quality target, such as a checkout SLO    | R                     | –           | C         | C             | A   |

How to read it:

- **Inside one team, the team is A.** The architect is C. An architect who is A for a choice inside one service becomes a bottleneck and takes ownership away from the team.
- **Across teams, the architect is A.** A message broker or a deployment platform affects everyone. The platform team does the work, and the stream-aligned teams are C as its customers. [Team Topologies](/learn/team-topologies#the-three-interaction-modes) explains why the platform team needs that input.
- **A quality target is a product decision.** An SLO trades reliability against features and cost. The PM is A, the team is R for the numbers, and the architect is C. In some companies an engineering or reliability lead is A instead. Pick one and write it down.

Record each of these decisions in a [decision record](/learn/decision-records). The record names the decision. The RACI names who makes the next one.

## Variants

| Variant | Letters                                                  | What it adds                                    | Helps when                                              | Only adds letters when                         |
| ------- | -------------------------------------------------------- | ----------------------------------------------- | ------------------------------------------------------- | ---------------------------------------------- |
| RASCI   | R, A, S (Support), C, I                                  | People who help R but do not own the work       | A shared team gives effort, for example a platform team | The supporters are already clear from the plan |
| RACI-VS | R, A, C, I, V (Verifier), S (Signatory)                  | A check against criteria, and a formal sign-off | Regulated work, audits, contracts                       | Nobody outside the team checks the work        |
| CAIRO   | C, A, I, R, O (Out of the loop)                          | A clear "this role is not involved"             | People join meetings that they do not need              | The empty cell already says the same thing     |
| DACI    | D (Driver), A (Approver), C (Contributors), I (Informed) | A driver who moves one decision to its end      | One decision, not a whole project                       | You use it for ongoing work with many tasks    |

DACI is for decisions, not for work. The driver collects the options and pushes for the decision. The approver decides. See [How decisions are made](/learn/decision-making).

Start with plain RACI. Add a letter only for a real gap, such as an auditor who must sign off.

## Common mistakes

| Mistake                    | What occurs                                                | Fix                                                              |
| -------------------------- | ---------------------------------------------------------- | ---------------------------------------------------------------- |
| Many As in a row           | Each A waits for the other, or both decide differently     | Agree on one A. Make the others C                                |
| No A in a row              | The work is done, but nobody approves it or answers for it | Name the A before the work starts                                |
| A without real authority   | The A signs off, and a manager overrules the result        | Give A to the person who can really decide                       |
| Everyone is C              | Each decision needs ten conversations                      | Keep the C whose input changes the result                        |
| RACI for small tasks       | The matrix is larger than the work                         | Use it for cross-team work and important decisions only          |
| A matrix that nobody reads | People follow habits, not the matrix                       | Publish it where the work happens. Review it at each phase       |
| RACI as a blame tool       | People avoid A, and the matrix fills with Cs               | Use it to plan the work, not to find a culprit after an incident |
| Names and roles mixed      | The matrix is wrong after the first change of team         | Use roles as columns. Keep names in a separate list              |

The blame mistake does the most damage. If an A gets punished after a failure, nobody accepts an A again. Pair the matrix with [blameless postmortems](/learn/incident-response#blameless-postmortems).

## RACI for architects and product roles

### For an architect or staff engineer

An architect is usually:

- **A** for cross-team technical decisions: shared platforms, integration styles, data ownership rules, and the decision records for them.
- **R** for technical evaluations, proofs of concept, and the decision records that they write themselves.
- **C** for the design inside a team, for quality targets, and for product decisions with a large technical cost.

The danger is to be A for things that the team must own. If the architect approves each library and each schema, the team stops thinking, and the architect becomes the bottleneck. [The architect role](/learn/architect-role#what-is-yours-to-decide) lists what is yours to decide. Use the matrix to give the rest away explicitly.

If a team can ignore your approval, you are C in practice. Fix the matrix, or get the authority.

### For a product manager or product owner

A product manager is usually A for outcomes and scope: what to build, why, for whom, and when. The PM is rarely A for how, and must not be. The PM is C on technical design when it changes the cost, the date, or the user experience.

For a launch, a PM uses a RACI like this:

1. List each launch activity, including the ones outside engineering: support training, legal review, marketing, pricing.
2. Fill in A for each row with the people who own it, in one meeting.
3. Find the rows with no A. These are the launch risks.
4. Send the matrix to everyone in it, and link it in the launch plan.
5. Check it again at the go or no-go meeting.

## In a kata

When the problem names several teams, a partner, or a provider, a small RACI makes the design more realistic. Use it in the five steps:

1. **Set the scope.** List the parties in the problem text: teams, partners, and providers. Note which functions each one owns.
2. **Select the characteristics.** Ask who is A for each driving characteristic. An availability target with no A is a weak target.
3. **Select a style.** A part with a different A often needs a clear boundary and a stable interface.
4. **Draw the diagram.** Mark the owner of each component, or add a short legend.
5. **State the trade-offs.** Add a RACI of four to six rows for the decisions that cross a boundary. Name one trade-off, such as a fast rollback without product approval.

Keep it small. The reviewer looks for ownership, not a project plan.

## In an interview

Questions about RACI rarely use the word. They ask "who decided?", "how did you get the teams to agree?", or "what did you do when nobody owned it?". Answer with a story, and name the roles: who was A, who did the work, and who you consulted.

For an architect role, show that you gave decisions to the teams and kept the cross-team ones. For a product role, show that you found the gaps before the launch. In both, avoid blame. See [Behavioral interviews](/learn/behavioral-interviews).

## Interview questions

**"What is the difference between responsible and accountable?"**

- Responsible does the work. A row can have several.
- Accountable answers for the result, approves it, and signs it off. Exactly one per row.
- A can delegate the work, but not the accountability.
- One person can be both, written A/R.

**"Why must each row have only one accountable person?"**

- Two As means each waits for the other, or both decide differently.
- One A gives a clear point of decision and a clear escalation path.
- Shared accountability usually becomes no accountability.

**"Who is accountable for the architecture of a service that one team owns?"**

- The team, usually through its tech lead.
- The architect is C, and sets the boundaries and principles around it.
- The architect is A for cross-team decisions, such as a shared platform.
- If the architect approves everything, they become the bottleneck.

**"A platform choice affects five teams. How do you set up the roles?"**

- One A, usually the architect or the head of the platform.
- The platform team is R. The five teams are C, as customers.
- Record the decision and the reasons in a decision record.
- Keep C to one person for each team, to avoid a meeting of twenty.

**"You are the PM for a launch that needs five teams. How do you make sure nothing is missed?"**

- List all launch activities, including support, legal, and marketing.
- Agree on one A for each, with the people involved.
- Treat a row with no A as a launch risk.
- Publish the matrix in the launch plan, and check it at go or no-go.

**"Engineering wants to delay the launch, and you want to keep the date. Who decides?"**

- Name the A for the launch date before the conflict. Usually the PM.
- Consult engineering on the risk, in numbers: what can fail, and how badly.
- Offer options: a smaller scope, a staged rollout, or a later date.
- Decide, write it down, and agree the rollback criteria with the tech lead.

## Go deeper

- **A Guide to the Project Management Body of Knowledge (PMBOK Guide)**, Project Management Institute, the part on resource management. It describes the responsibility assignment matrix and RACI as one form of it.
- **Team Topologies**, Matthew Skelton and Manuel Pais, the parts on team types and interaction modes. It adds who must own what between teams, which shapes the columns of a matrix.
- **The Software Architect Elevator**, Gregor Hohpe, the parts on the architect in the organization. It adds how an architect works with influence more than formal authority.
- **High Output Management**, Andrew Grove, the parts on decision making and on managers. It adds a manager's view of who decides, and how to involve others before a decision.

## Further reading

- [Responsibility assignment matrix](https://en.wikipedia.org/wiki/Responsibility_assignment_matrix) on Wikipedia
- [DACI decision-making framework](https://www.atlassian.com/team-playbook/plays/daci), from the Atlassian Team Playbook
- [Diffusion of responsibility](https://en.wikipedia.org/wiki/Diffusion_of_responsibility) on Wikipedia
- [Team Topologies, key concepts](https://teamtopologies.com/key-concepts)
