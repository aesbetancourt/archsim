The cases of the product drill. Each "## " heading is a filter of the drill. In it, a case is a bold line, and the points of a strong answer are the list below it. Every price is an assumption for practice. Real prices change.

## Cost

**"A sales team records 1,000 calls a day. Each call is 30 minutes. Estimate the daily model cost to summarize every call. Assume a person speaks 150 words a minute, a word is about 1.3 tokens, and the model costs $3 per million input tokens and $15 per million output tokens."**

- State the assumptions before the arithmetic, and keep the numbers round.
- One call: 30 × 150 = 4,500 words, which is about 6,000 input tokens.
- Input per day: 1,000 × 6,000 = 6 million tokens, so 6 × $3 = $18.
- Output per day: about 500 tokens a summary, so 0.5 million tokens × $15 = $7.50.
- Total: about $25 a day, or about $750 a month.
- Compare it with the value: if 200 reps each save 10 minutes a day, that is about 33 hours a day.
- Say what changes the number most: a longer context, more calls over the same transcript, or a larger model.

**"The same feature runs three model calls over each transcript: one to summarize, one to find objections, one to find competitor mentions. What happens to the cost, and what do you change?"**

- Each call reads the full transcript again, so the input cost is about three times larger: about $54 a day instead of $18.
- Process once, use many times: one call extracts all three results in one structured output.
- Or summarize once, and run the later calls on the summary, which is much shorter than the transcript.
- Name the trade-off: one large call is cheaper but harder to test and to change than three small calls.
- Measure the quality of each result before and after the change.

**"A document agent reads 2,000 audit documents a month. Each document is about 10,000 words, and the agent reads each one twice. Each document gets about 2,000 output tokens. Use the same prices. What does one document cost, and what is the monthly cost?"**

- Input: 10,000 words is about 13,000 tokens. Two reads is about 26,000 tokens.
- Input cost: 0.026 million × $3 = about $0.08.
- Output cost: 0.002 million × $15 = $0.03.
- About $0.11 a document, and 2,000 × $0.11 = about $220 a month.
- Compare it with the manual work: if a review takes 30 minutes and the agent removes 60% of it, that is 600 hours a month.
- Conclude that the model cost is small, and the real costs are review time, errors, and engineering time.

**"A phone support agent talks with customers. Estimate the cost of one minute of a call. Assume speech-to-text costs $0.01 a minute, text-to-speech costs $0.02 a minute, and the phone line costs $0.01 a minute. The model gets 4 turns a minute, each with about 2,000 input tokens and 50 output tokens."**

- Model input: 4 × 2,000 = 8,000 tokens a minute, so 0.008 million × $3 = $0.024.
- Model output: 4 × 50 = 200 tokens, so 0.0002 million × $15 = $0.003.
- Total: 0.01 + 0.02 + 0.01 + 0.024 + 0.003 = about $0.07 a minute.
- Compare it with a person: at $30 an hour, a person costs $0.50 a minute.
- Name the risk: the context grows with each turn, so a long call costs more for each minute.
- Name the levers: prompt caching of the fixed instructions, a shorter history, and a smaller model for easy turns.

**"An assistant feature has 10,000 daily users. Each user sends 5 messages a day. Each message has 3,000 input tokens and 300 output tokens. Use the same prices. What is the monthly cost, and is it a problem for a $10 a month plan?"**

- Input per day: 10,000 × 5 × 3,000 = 150 million tokens, so $450.
- Output per day: 10,000 × 5 × 300 = 15 million tokens, so $225.
- About $675 a day, or about $20,000 a month for 30 days.
- For each user: $20,000 / 10,000 = about $2 a month, which is 20% of a $10 plan.
- That margin can work, but heavy users can cost much more than the average.
- Name the levers: cache the fixed system prompt, cut the history, route easy messages to a smaller model, and set a fair-use limit.

## Value and proof

**"Product marketing says the tool saves them hours each week. How do you prove it before a wider launch?"**

- Measure a baseline first: time the same tasks for two weeks before the tool.
- Run the pilot on the same tasks, and measure the time again in the same way.
- Use a control group when you can: a similar team without the tool for the same period.
- Count the output too, not only the time: more briefs, or faster briefs of the same quality.
- Do not trust only what people say. Use logs, such as the time from request to delivery.
- Agree the success threshold before the pilot, for example 30% less time.

**"Which metric shows the return of a sales insights tool, and how do you know the tool caused it?"**

- Separate leading metrics from lagging metrics.
- Leading: the share of reps who use the insights each week, and the actions they take.
- Lagging: win rate, deal cycle time, and revenue for each rep.
- Lagging metrics move slowly and have many causes, so compare a pilot group with a control group.
- Compare similar segments, for example the same region and deal size.
- Say what you would accept as proof, and when you would stop the tool.

**"You build fast, with AI. How do you know a hypothesis worked?"**

- Write the hypothesis as a change in user behavior, with a metric and a threshold.
- Set the time box and the stop rule before you build.
- Build the smallest test that can prove it wrong, not the full feature.
- Check the result against the threshold, and decide: continue, change, or stop.
- A fast build does not remove the need for evidence. It makes more tests possible.

**"Everyone says adoption is the hard part. How do you measure it, and how do you grow it?"**

- Define activation: the first time a user gets value, for example the first insight used in a call.
- Measure weekly active use and retention by cohort, not only sign-ups.
- Measure depth: how many tasks a user does with the tool.
- Grow it by fitting the existing workflow: put the output where users already work.
- Use champions, training, and visible support from leaders.
- Remove the steps where users drop out. Find them in the funnel.

## Business model

**"Your product helps auditors check client companies. Who is the customer, who is the user, and who pays?"**

- Separate the buyer, the user, and the beneficiary. They are often different people.
- Name one buyer, for example the audit firm that pays for each audit or each client.
- Name the users, for example the auditors who do the checks, and the client staff who upload documents.
- Say why each one cares: the firm wants more audits for each auditor, and the client wants a faster audit.
- Do not answer "both". State who signs the contract, and say how the other side gets value.

**"Do you price an AI feature per seat or per use?"**

- The model cost grows with use, but a seat price does not.
- Per seat: simple to buy and to forecast, but heavy users can make it lose money.
- Per use: the price follows the cost, but the bill is hard to predict, and that can slow adoption.
- A hybrid is common: a seat price with a fair-use limit, or credits included in the plan.
- Choose by the customer: buyers who need a fixed budget prefer seats.

**"A plan costs $20 a user a month. A user runs 400 tasks a month, and each task costs $0.02 in model calls. Infrastructure costs $2 a user. What is the gross margin, and what threatens it?"**

- Model cost: 400 × $0.02 = $8 a user.
- Cost of serving: $8 + $2 = $10, so the gross margin is ($20 − $10) / $20 = 50%.
- A typical software margin is 70% to 80%, so this is low.
- The threat: heavy users. A user with 1,000 tasks costs $22 and loses money.
- The levers: cheaper models for easy tasks, caching, limits, or a higher plan for heavy use.

## Prioritization

**"Rank three items with RICE. A: reach 500, impact 2, confidence 80%, effort 4. B: reach 2,000, impact 0.5, confidence 100%, effort 2. C: reach 100, impact 3, confidence 50%, effort 1."**

- RICE score = reach × impact × confidence / effort.
- A: 500 × 2 × 0.8 / 4 = 200.
- B: 2,000 × 0.5 × 1 / 2 = 500.
- C: 100 × 3 × 0.5 / 1 = 150.
- The order is B, A, C.
- Say what can change it: a deadline, a dependency, a risk, or a strategic bet that the score does not show.
- Say that the score starts the discussion. It does not replace the decision.

**"A stakeholder asks for a large solution. You think a smaller one is enough. What do you do?"**

- Ask for the problem and the goal behind the request, with the numbers.
- Show the cost and the time of the large solution next to a smaller first step.
- Propose the smallest step that tests the goal, with a date to check the result.
- Agree what result makes you build the larger part.
- If the decider still chooses the large solution, disagree and commit, and record the decision.

**"Tell me what you decided not to build, and why."**

- Name a real feature that you cut, not a small detail.
- Give the reason: low value for the cost, a weak signal from users, or a risk.
- Say what you did instead, and the result.
- Say what would make you build it later.
- This shows judgment. Interviewers want to see that you can say no with a reason.

## Timing and adoption

**"Your design sends sales reps a weekly batch of insights. A rep says: I follow up the day after the call, so the batch is too late. What do you change?"**

- Accept the point: the timing of the output must match the moment when the user acts.
- Process each call when it ends, from an event, and deliver the insight within about an hour.
- Keep the weekly batch for the work that is weekly, such as the themes for marketing.
- Put the insight where the rep already works, such as the CRM record of the deal.
- Check the cost: per-call processing reads the same tokens as a batch. It loses only the discount of a batch interface, often about half the price.

**"What exactly does the user do with the output of your AI feature?"**

- Name the user, the moment, and the one action that the output supports.
- Example: before the follow-up email, the rep sees the two objections from the call and a suggested reply.
- An output with no clear action is a report. Users stop reading reports.
- Measure the action, for example the share of follow-ups that use the suggestion.
- Remove any output that does not lead to an action.

**"A marketer edits one line that the system flagged. What happens next?"**

- Save the edit as feedback, with the original line and the reason.
- Decide the scope of the fix: only this line, or the same issue in other drafts.
- Do not run the full process again for one edit. Change only what the edit touches.
- Use the edits to improve the system: each repeated edit becomes a test case.
- Show the marketer what changed, so they trust the system.
