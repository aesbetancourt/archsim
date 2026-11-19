## Why prioritization is the core of the job

A team has fixed capacity. Each week has the same number of people and hours, whatever the size of the backlog. So each "yes" is also a "no" to something else. Economists call the value of the best option you gave up the **opportunity cost**.

Prioritization is the work of choosing what to do first, what to do later, and what not to do. It is also the work of explaining why, so that the people who did not get their item still trust the decision.

A list of features hides the reason for each one. Rank problems and outcomes first: "new customers drop out at the address step" or "the evening sort misses its cut-off twice each month". Then compare the solutions to the top problems. A feature with no problem behind it has no clear value, so it cannot win a fair comparison.

The advice is the same for both roles, with a different focus:

- **Architects and staff engineers** must make technical work compete in the same list as features, in the same terms.
- **Product managers and product owners** own the list in most organizations. They must make the trade-offs visible and defend them to stakeholders.

## The inputs

Each method on this page combines some of these inputs.

| Input              | Question                                          | Where to get it                               |
| ------------------ | ------------------------------------------------- | --------------------------------------------- |
| Value              | What does this change for users and the business? | Research, data, revenue, support tickets      |
| Effort             | How much team time does it take?                  | A rough estimate from the team                |
| Risk and certainty | How sure are we of the value and the effort?      | Evidence, prototypes, past work               |
| Urgency            | What does a week of waiting cost?                 | Deadlines, contracts, market events           |
| Dependencies       | What must come before it, and what does it block? | The architecture and the plans of other teams |
| Strategy fit       | Does it move the goal for this period?            | The product strategy and the company goals    |

Value has two sides: users and the business. Name both. Effort needs only a rough size, with the habits of [estimation](/learn/estimation). Uncertainty is a separate input. An untested large value is not the same as a large value with evidence. The [risk assessment](/learn/risk-assessment) lesson shows how to rate the probability and the impact of a risk.

## The methods

No method gives the answer. A method makes the inputs explicit and gives the group one way to compare.

### Value against effort

Draw two axes: value up, effort to the right. Put each item in one of four boxes.

| Box        | Value | Effort | What to do                              |
| ---------- | ----- | ------ | --------------------------------------- |
| Quick wins | High  | Low    | Do them first                           |
| Big bets   | High  | High   | Plan them, and split them where you can |
| Fill-ins   | Low   | Low    | Do them when there is spare time        |
| Money pits | Low   | High   | Do not do them                          |

How to use it:

1. Agree what "value" means for this period, for example "more repeat orders". Without one goal, each person scores their own goal.
2. Score the value of each item from 1 to 5, with product.
3. Score the effort from 1 to 5, with the engineers who will build it.
4. Put each item in its box. A score of 3 or more is high.
5. Challenge each quick win: "Is the effort really low? Who checked?"

Example: the parcel tracking app. The goal this quarter is fewer calls to support.

| Item                                   | Value | Effort | Box       | Why                                                 |
| -------------------------------------- | ----- | ------ | --------- | --------------------------------------------------- |
| Save the last delivery address         | 3     | 1      | Quick win | Fewer wrong addresses, a small form change          |
| A delivery window on the tracking page | 5     | 2      | Quick win | "When does it come?" is the top support call        |
| A live map of the driver               | 4     | 5      | Big bet   | Fewer calls, but needs GPS data from drivers        |
| A dark theme                           | 1     | 1      | Fill-in   | Users asked for it, but it does not cut calls       |
| A chatbot for all questions            | 2     | 5      | Money pit | Most calls are about time, which the window answers |

The team starts with the delivery window. It plans the live map as a big bet, and splits it: first a map for the last three stops only. The chatbot is dropped for now, because the window answers the same calls at a much lower cost.

**Strengths.** It is fast and visual.

**Traps.** Teams overrate value and underrate effort, so everything drifts to the quick-win box. The boxes give no order inside each box. Use it for a first sort, not the final rank.

### MoSCoW

MoSCoW puts each item in one of four categories for a fixed release or time box:

- **Must have.** The release fails without it: it is illegal, unsafe, or useless without it.
- **Should have.** Important, but the release still works without it, perhaps with a workaround.
- **Could have.** Useful, with less impact if it is left out.
- **Won't have this time.** Agreed to be out of this release. It is not "never".

Dai Clegg created MoSCoW at Oracle in 1994. The DSDM agile method later adopted it. DSDM guidance says that Must haves must take no more than about 60% of the effort. The rest is a buffer. If the team falls behind, it drops Could haves first, and the Musts still ship.

How to use it:

1. Fix the time box first: the release date and the team's capacity.
2. Put each item in a category, with the stakeholders in the room.
3. Test each Must: "If this is missing, do we cancel the release?" If not, move it down.
4. Add the effort of the Musts. Keep it at or below about 60% of the capacity.
5. Write the Won't items down, so nobody expects them.

Example: the first release of parcel tracking. The team has 20 person-weeks before the launch.

| Item                          | First proposal | After the test  | Effort (weeks) |
| ----------------------------- | -------------- | --------------- | -------------- |
| See the current status        | Must           | Must            | 6              |
| Enter a tracking number       | Must           | Must            | 2              |
| Sign in with a user account   | Must           | Should          | 4              |
| Notifications by text message | Should         | Should          | 3              |
| A delivery photo              | Could          | Could           | 3              |
| A live map                    | Could          | Won't this time | 10             |

Sales first called the user account a Must. The team asked: "Without an account, do we cancel the launch?" No: a tracking number is enough to see the status. So the account moved to Should.

The Musts now take 8 of 20 weeks, which is 40%. The Shoulds take 7 weeks more. That leaves 5 weeks as a buffer, so the Could item fits if nothing goes wrong. If the team falls behind, it drops the delivery photo first, then a Should. The Musts still ship.

**Strengths.** It is easy to explain to stakeholders, and "Won't this time" makes the scope explicit.

**Traps.** Everything becomes a Must, because each stakeholder pushes their item up. Ask of each Must: "If this is missing, do we cancel the release?" If the answer is no, it is not a Must. MoSCoW also gives no order inside a category.

### RICE

Sean McBride at Intercom described RICE. It gives each item one number:

**RICE score = Reach × Impact × Confidence ÷ Effort**

- **Reach.** The number of people or events the item affects in a fixed period, for example each quarter.
- **Impact.** The effect on each person, on Intercom's scale: 3 is massive, 2 is high, 1 is medium, 0.5 is low, 0.25 is minimal.
- **Confidence.** How sure you are of the other numbers: 100% is high, 80% is medium, 50% is low.
- **Effort.** Person-months of work from all roles.

Example: four ideas for a parcel tracking app. Reach is customers each quarter.

| Item                        | Reach  | Impact | Confidence | Effort | Calculation           | Score |
| --------------------------- | ------ | ------ | ---------- | ------ | --------------------- | ----- |
| Saved addresses             | 5,000  | 1      | 100%       | 1      | 5,000 × 1 × 1.0 ÷ 1   | 5,000 |
| Delivery-window alerts      | 8,000  | 2      | 80%        | 4      | 8,000 × 2 × 0.8 ÷ 4   | 3,200 |
| Live driver map             | 10,000 | 3      | 50%        | 10     | 10,000 × 3 × 0.5 ÷ 10 | 1,500 |
| Bulk upload for small shops | 600    | 3      | 80%        | 3      | 600 × 3 × 0.8 ÷ 3     | 480   |

The live map has the largest reach and impact. It ranks third, because nobody has evidence that it helps, and it is expensive.

**Strengths.** It forces people to state their numbers, and it punishes ideas with no evidence.

**Traps.** Reach counts people, not value per person. The bulk upload ranks last, but small shops can pay ten times more than a single customer. If strategy says "grow business customers", the score is wrong for this decision. Also, the score looks precise. A change in Impact from 2 to 3 moves an item by 50%.

### Cost of delay and WSJF

Don Reinertsen, in The Principles of Product Development Flow, argues that the most useful number in product work is the **cost of delay**. It is the value lost for each unit of time that an item is not done.

Divide the cost of delay by the duration to get an order. Reinertsen calls this weighted shortest job first (WSJF). Many teams call it CD3: cost of delay divided by duration. Do the item with the highest result first.

Example: three items, one team, one item at a time. The money is in thousands of dollars.

| Item                    | Cost of delay each week | Duration | CD3 = cost ÷ duration |
| ----------------------- | ----------------------- | -------- | --------------------- |
| X: new carrier contract | $10k                    | 5 weeks  | 2.0                   |
| Y: checkout bug fix     | $6k                     | 1 week   | 6.0                   |
| Z: invoice export       | $3k                     | 2 weeks  | 1.5                   |

Each item costs its weekly cost of delay until it is finished. Compare four orders:

| Order                     | Cost while waiting     | Total |
| ------------------------- | ---------------------- | ----- |
| Y, X, Z (CD3)             | 6 × 1 + 10 × 6 + 3 × 8 | $90k  |
| Y, Z, X (shortest first)  | 6 × 1 + 3 × 3 + 10 × 8 | $95k  |
| X, Y, Z (largest value)   | 10 × 5 + 6 × 6 + 3 × 8 | $110k |
| Z, X, Y (first requested) | 3 × 2 + 10 × 7 + 6 × 8 | $124k |

The work is the same in each row. Only the order changes, and the cost changes by more than a third. The intuition "do the most valuable item first" costs $20k more than CD3 here.

**Urgency profiles.** Cost of delay is not always constant. Kanban practice names four classes of service, each with a typical shape:

- **Expedite.** The cost is high and immediate, for example an outage. Drop other work.
- **Fixed date.** The cost is low until a date, then jumps, for example a legal deadline. Start early enough to finish in time.
- **Standard.** The cost grows steadily with each week. Use CD3.
- **Intangible.** No cost is visible now, but it can grow later, for example an old library. Give it a fixed share of capacity.

The Scaled Agile Framework (SAFe) uses WSJF with relative scores. Its cost of delay is the sum of three scores: business value, time criticality, and risk reduction or opportunity enablement. It divides that sum by job size.

**Strengths.** It puts urgency and value in one unit that the business understands: money each week.

**Traps.** The weekly cost is a guess. Make the assumptions visible, and compare orders of magnitude, not decimals.

### The Kano model

Noriaki Kano described how features relate to satisfaction. The categories:

- **Basic, or must-be.** Users expect them. Their presence gives no satisfaction. Their absence makes users angry. Example: the tracking number works.
- **Performance.** More is better, in a line. Example: faster delivery estimates.
- **Delighters.** Users do not expect them. Their presence pleases, and their absence goes unnoticed. Example: a photo of the parcel at the door.
- **Indifferent.** Users do not care either way.

Delighters become basic over time. A delivery photo surprised users once. Now many users expect it.

**How to use it: the Kano survey.** For each feature, ask users two questions:

- "How do you feel if the app **has** this feature?"
- "How do you feel if the app **does not have** this feature?"

Each answer is one of five: I like it, I expect it, I am neutral, I can live with it, I dislike it. The pair of answers gives the category. The four main rules:

| If the app has it…                          | If the app does not have it…                   | Category    |
| ------------------------------------------- | ---------------------------------------------- | ----------- |
| I like it                                   | I dislike it                                   | Performance |
| I like it                                   | Neutral, or I can live with it, or I expect it | Delighter   |
| I expect it, neutral, or I can live with it | I dislike it                                   | Basic       |
| Neutral, or I can live with it              | Neutral, or I can live with it                 | Indifferent |

Other pairs show a question that the user did not understand, for example "I like it" to both. Count the answers of all users, and give each feature its most common category.

Example: 20 users of the parcel app answer for three features.

| Feature                           | Basic | Performance | Delighter | Indifferent | Result      |
| --------------------------------- | ----- | ----------- | --------- | ----------- | ----------- |
| The tracking number works         | 16    | 3           | 0         | 1           | Basic       |
| A more exact delivery time        | 3     | 13          | 2         | 2           | Performance |
| A photo of the parcel at the door | 2     | 3           | 11        | 4           | Delighter   |

So the team makes sure that tracking never fails. It puts steady work into a more exact delivery time. It adds the photo as one small delighter. It does not build three more delighters while the delivery time is still vague.

Kano helps you balance a release, not rank single items. Make sure the basics work first. Then invest in performance, and add a few delighters.

A related tool is **opportunity scoring**, from Anthony Ulwick's outcome-driven innovation. Users rate how important an outcome is and how satisfied they are today, each from 0 to 10. Ulwick's formula:

**Opportunity = importance + (importance − satisfaction)**

If satisfaction is higher than importance, the part in brackets counts as 0. A score above 10 marks an opportunity. A score above 15 marks a strong one.

Example: average answers from parcel app users.

| Outcome the user wants                | Importance | Satisfaction | Calculation | Score |
| ------------------------------------- | ---------- | ------------ | ----------- | ----- |
| Know the hour when the parcel arrives | 9          | 2            | 9 + (9 − 2) | 16    |
| Change the address after the order    | 7          | 3            | 7 + (7 − 3) | 11    |
| See the parcel's route on a map       | 5          | 6            | 5 + 0       | 5     |

The delivery hour is the strong opportunity. Changing the address is an opportunity too, but a smaller one. The route map scores low: users find it nice, but they are already satisfied without it. This matches the value-and-effort example above, from a different direction.

### Choose a method

| Method               | Best for                                     | Main trap                                     |
| -------------------- | -------------------------------------------- | --------------------------------------------- |
| Value against effort | A first sort of a long list in a workshop    | Optimistic effort, no order inside each box   |
| MoSCoW               | The scope of one release or time box         | Everything becomes a Must                     |
| RICE                 | Comparing many ideas for one product         | Reach hides value per person; false precision |
| Cost of delay        | Ordering work when timing and urgency differ | Weekly costs are guesses presented as facts   |
| Kano                 | Balancing a release across kinds of features | Survey work, and categories change over time  |

## Technical work against features

A feature has a sponsor and a visible result. A migration has neither. If technical work enters the list in technical terms, it loses to features every time.

Make it compete fairly in one of four ways.

**1. Express it as cost of delay or risk.** Count what the problem costs each week:

- Incidents: how many each month, and what each one costs in refunds, support time, and lost orders.
- Slower delivery: how much longer each change takes because of the problem. A longer [lead time](/learn/delivery-performance#the-four-key-metrics) delays every feature in the list.
- Risk: the probability and impact of a failure, from the [risk assessment](/learn/risk-assessment).

**2. Allocate capacity.** Reserve a fixed share of each sprint or quarter for technical work. Teams commonly choose between 15% and 30%. That number is a choice, not a law. Inside the share, the engineers rank the work. Outside it, technical work competes in the main list. This stops the endless argument item by item.

**3. Use an error budget.** Site reliability engineering gives a rule agreed in advance. While the service meets its reliability target, the team ships features. When the budget is spent, reliability work comes first. See [error budgets](/learn/observability#error-budgets). The data decides, not the loudest person.

**4. Tie it to a product outcome.** Find the product goal that the work unblocks.

Example of a pitch, before and after:

- **Before:** "We must migrate the queue to a managed service. The current one is old and hard to operate."
- **After:** "The order queue failed twice last quarter, during the evening peak. Each failure stopped orders for about an hour. Two weeks of work move it to a managed service and remove that cause. It also lets us add a new carrier in one week instead of three, which the carrier-expansion goal needs."

The second version gives a cost, a duration, and a link to a goal. Now it can compete by cost of delay. Say where your numbers come from.

## How to say no and keep trust

Most requests get a "no" or a "not now". The way you say it decides whether people trust the next decision.

1. **Say "not now", with the reason.** "It ranks below the checkout fix, because that fix loses us $6k each week."
2. **Make the cost visible.** Show what moves down if this moves up. "We can do it next. The carrier contract then ships two weeks later."
3. **Keep a parking lot.** Record the item as "Won't have this time", with a date to look again. The requester can see that it is not lost.
4. **Offer a smaller version.** "We cannot build bulk upload this quarter. We can accept a spreadsheet by email for your top ten shops."
5. **Explain the rule, not only the result.** People accept a loss more easily when the method was clear before the decision.

A product manager uses this skill daily with customers, sales, and leaders. An architect uses it to reject a technology or a design, not the person.

## A process, not a spreadsheet

A score sheet does not prioritize. People do, in a repeated process.

**Decide who decides.** Make one role accountable for the order of the list, usually the product manager or product owner. Engineering, design, and the architect are consulted, and stakeholders are informed. The [RACI matrix](/learn/raci) lesson shows how to write this down. The [decision-making](/learn/decision-making) lesson shows how to choose who decides and how.

**Set a cadence.** Rank in depth each quarter, and adjust each sprint. The far items need only a rough order.

**Re-prioritize when facts change.** A competitor launches, an incident repeats, an estimate doubles. Change the order, and tell people why.

**Keep one visible ranked list.** A stack rank says "this item comes before that one". Buckets such as "high, medium, low" let twenty items share the label "high". Then the team decides the real order by accident. A ranked list forces the hard choice into the open.

**Distrust false precision.** A RICE score of 3,200 against 3,000 is a tie. The inputs are guesses with an error of 50% or more. Use scores to start a discussion and to find disagreement. Do not use them to end the discussion.

## Common mistakes

| Mistake                    | What occurs                                                  | Fix                                                      |
| -------------------------- | ------------------------------------------------------------ | -------------------------------------------------------- |
| HiPPO                      | The highest-paid person's opinion sets the order             | Agree on the method and the inputs before you rank       |
| The loudest customer       | One account drives the roadmap                               | Count reach and strategy fit, not volume of complaints   |
| Scoring theatre            | Scores are tuned until they support a choice already made    | Score before you discuss, and record the assumptions     |
| Effort ignored             | Big items win because only value was compared                | Divide by effort or duration                             |
| Dependencies ignored       | A top item waits for a low item that nobody started          | Map the dependencies and rank them together              |
| Too many items in parallel | Everything starts, nothing finishes, and cost of delay grows | Limit work in progress, and finish before you start more |
| A list never revisited     | The order reflects last year's facts                         | Review on a cadence, and after each large change         |

In the cost of delay example, if the team works on X, Y, and Z at once, all three finish in week 8. Each one carries its cost of delay for the whole time.

## In a kata

Prioritization shows in three places in the [five-step method](/learn/method):

1. **Setting the scope.** Step 1 asks for the two or three functions the design must do well, and what you leave out. That is a MoSCoW decision. Write the Musts, and write "Won't this time" for the rest.
2. **Ranking characteristics.** Step 2 asks for about three driving [characteristics](/learn/characteristics). Put them in order. When two of them conflict, the order tells you which one wins.
3. **Phasing the design.** Show what the first release needs and what comes later. A design that grows in steps is a prioritized design. See [evolution](/learn/evolution).

## In an interview

The skill shows differently by role.

**System design and architecture interviews.** Prioritization is the first five minutes. Ask which functions matter most, and say aloud what you leave out. Rank the characteristics. When the interviewer adds a requirement late, say what it pushes down. An interviewer values "I leave out search for now, because it does not change the core design" more than a design that tries to cover everything.

**Product interviews.** Many product interviews give you a backlog or a scenario and ask you to rank it. Follow a clear order:

1. Ask about the goal for this period and the users.
2. State the criteria you use, and why.
3. Rank the items, with a short reason for each.
4. Name what you cut, and how you tell the people who asked for it.
5. Say what new fact would change your order.

The interviewer checks your reasoning, not the method name.

## Interview questions

**"Walk me through how you would prioritize this backlog."**

- Ask for the goal of this period, the users, and the constraints before you rank.
- Group items by the problem they solve, and drop items with no clear problem.
- Compare value, effort, and urgency with one simple method, such as RICE or cost of delay.
- Give a stack rank with a reason for each of the top items.
- Name what you cut and what would change the order.

**"A key customer demands a feature that no one else needs. What do you do?"**

- Find the problem behind the request, not only the feature asked for.
- Size the value: the revenue at risk, and whether other customers have the same problem.
- Compare it with the list by the same rules as other items.
- Offer a smaller version, a workaround, or a date, and say what moves if it moves up.

**"How do you prioritize technical debt against new features?"**

- Put the debt in business terms: incident cost, slower lead time, or risk.
- Compare it by cost of delay with the features.
- Use a capacity share for steady work, for example 20%, chosen by the team.
- Use an error budget as an agreed rule for reliability work.

**"Two senior stakeholders each say their project is the top priority. How do you decide?"**

- Make the conflict visible: only one item can be first.
- Bring both back to the company goal and the agreed criteria.
- Show the cost of delay of each order.
- If they still disagree, take it to the person accountable for the decision, with a recommendation.

**"How do you convince leadership to fund a platform migration?"**

- Lead with the business problem, not the technology.
- Give a cost of delay: incidents, lost hours, or features the old platform blocks.
- Offer a phased plan with an early result.
- State the estimate and its uncertainty honestly.

**"When do you use RICE, and when do you use cost of delay?"**

- RICE compares many ideas by reach and impact, when timing matters little.
- Cost of delay orders work when urgency differs, for example deadlines or outages.
- Both rest on guesses. Use them to start the discussion, not to end it.

**"Your score sheet says one thing and your experience says another. What do you do?"**

- Check which input drives the score, and test that assumption.
- Small score differences are ties, so use judgment and say why.
- Change the order, and write the reason, so others can challenge it.

## Go deeper

- **The Principles of Product Development Flow**, Donald Reinertsen, the part on economics and on queues. It adds the case for cost of delay, WSJF, and limits on work in progress.
- **Inspired**, Marty Cagan, the part on product discovery. It adds how to test value before you build, so priorities rest on evidence.
- **Escaping the Build Trap**, Melissa Perri, the part on outcomes over outputs. It adds why a list of features is a weak plan.
- **Continuous Discovery Habits**, Teresa Torres, the part on the opportunity solution tree. It adds a way to rank problems before solutions.
- **Site Reliability Engineering**, Beyer and others, the part on error budgets. It adds a rule that decides between reliability work and features.

## Further reading

- [MoSCoW method](https://en.wikipedia.org/wiki/MoSCoW_method) on Wikipedia
- [Kano model](https://en.wikipedia.org/wiki/Kano_model) on Wikipedia
- [Cost of delay](https://en.wikipedia.org/wiki/Cost_of_delay) on Wikipedia
- [Opportunity cost](https://en.wikipedia.org/wiki/Opportunity_cost) on Wikipedia
- [RICE: simple prioritization for product managers](https://www.intercom.com/blog/rice-simple-prioritization-for-product-managers/), by Sean McBride at Intercom
- [Embracing risk](https://sre.google/sre-book/embracing-risk/), from the Google SRE book
