## What product thinking is

Product thinking starts from a user problem and a business result, not from a solution. The question is not "what do we build?". The question is "what must change for the user, and why does the business care?".

A feature request is a guess about a solution. "Add a text message when the order is ready" is a guess. The problem behind it is that customers wait in the shop. Other solutions can fix it, and some cost less.

Josh Seiden, in Outcomes Over Output, names three levels:

| Level   | What it is                                  | Lunch Rush example                                                        |
| ------- | ------------------------------------------- | ------------------------------------------------------------------------- |
| Output  | Something the team ships                    | A "your order is ready" text message                                      |
| Outcome | A change in what users do                   | Customers arrive close to the pickup time, and do not wait at the counter |
| Impact  | The business result that the outcomes cause | More orders served in the lunch peak, and more revenue for each shop      |

Seiden's point is to manage by outcomes. An output can have no effect. An impact is too slow to steer a team. An outcome is in the middle: a team can change it in weeks.

This page is for architects who work with product teams, and for people who prepare for technical product roles. Where the advice is different, the page says so.

## Who does what in a product team

A product team is small and cross-functional. Each role owns a different question.

| Role                        | Owns                                                      | Main question                             |
| --------------------------- | --------------------------------------------------------- | ----------------------------------------- |
| Product manager             | Value and viability. The "why" and the "what"             | Is this worth building, and for whom?     |
| Product owner               | The backlog and its order, in Scrum                       | What does the team build next?            |
| Designer                    | Usability and the experience                              | Can users understand and use it?          |
| Engineering manager         | People, hiring, and the delivery process                  | Is the team healthy and able to deliver?  |
| Tech lead                   | Technical direction of one team                           | How do we build it well?                  |
| Architect or staff engineer | Feasibility, long-term structure, and quality attributes  | Will it still work at ten times the load? |
| Technical product manager   | A product for technical users: a platform, an API, a tool | What do the developers who use it need?   |

The product owner is a role in the Scrum Guide. It is accountable for the value of the product and for the backlog. In many companies, the product manager is also the product owner. In others, the product manager works on strategy and discovery, and a separate product owner refines the backlog with the team. This split works only when both people share the same goals. If not, the team gets two sets of priorities.

For platform teams, see [Team Topologies](/learn/team-topologies). For who decides and who is consulted, see [The RACI matrix](/learn/raci) and [How decisions are made](/learn/decision-making).

### The four product risks

Marty Cagan, in Inspired, names four risks that each product idea has. A good team reduces all four before it builds the full solution.

| Risk               | The question                                                   | Who covers it first                |
| ------------------ | -------------------------------------------------------------- | ---------------------------------- |
| Value              | Will customers buy it, or choose to use it?                    | Product manager                    |
| Usability          | Can users find out how to use it?                              | Designer                           |
| Feasibility        | Can we build it with the time, skills, and technology we have? | Engineers: tech lead and architect |
| Business viability | Does it work for the business: cost, sales, legal, support?    | Product manager, with the business |

The architect owns much of feasibility, and helps with viability. A popular feature that costs more to run than it earns is not viable.

## From strategy to backlog

Product work goes from a long-term picture to the next task in five levels:

1. **Vision.** The future the company wants to create. It changes rarely.
2. **Strategy.** Which users, which problems, and what the company will not do.
3. **Goals.** The outcomes for this quarter or year. Many companies use OKRs.
4. **Roadmap.** The order in which the team works on problems.
5. **Backlog.** The specific items that the team builds next.

OKR means objectives and key results. Andy Grove used them at Intel. John Doerr learned them there and made them popular, first at Google and then in his book Measure What Matters. An objective is a qualitative goal. Each key result is a number that shows progress to the objective. A key result is an outcome, not a task. "Ship the ready message" is a task. "Cut the median wait at the counter to two minutes" is a key result.

An outcome-based roadmap lists problems to solve, not features with dates. A common format has three columns: Now, Next, and Later. Janna Bastow of ProdPad made this format popular. Items in "Later" are broad, because the team knows less about them. The columns show order and confidence, not dates.

A north star metric is the one number that best shows the value users get from the product. It must grow when users get more value. It is too slow to steer daily work, so teams break it into **input metrics**: the few numbers that drive it, which one team can move in weeks.

### Example: Lunch Rush

The Lunch Rush kata is a chain of 40 sandwich shops that adds online ordering. Here is one possible chain from vision to backlog:

- **Vision:** Lunch without the queue.
- **Strategy:** Win office workers with a short lunch break, with fast and reliable pickup. Add delivery partners only after pickup works well.
- **Objective:** Make online pickup the normal way to order lunch.
- **Key results:** 30% of lunch orders are online. 90% of online orders are ready at the pickup time. 40% of first-time online customers order again within 30 days.
- **North star:** Online orders picked up on time each week.
- **Input metrics:** First-order conversion, the share of orders ready on time, and the repeat rate.
- **Roadmap:** Now: order ahead and pay at pickup, in five pilot shops. Next: online payment and the ready message. Later: delivery partners.
- **Backlog:** "Sort the kitchen screen by pickup time" is one item for "Now".

The key results are targets that the team chooses, not facts about the market.

## Discovery and delivery

**Discovery** finds out what to build, with cheap tests. **Delivery** builds the ideas that survive, to production quality. Cagan and Jeff Patton call this dual-track work: both run in the same team each week.

### Assumptions and experiments

Each idea rests on assumptions. Write them down, and test the riskiest one first. For the ready message, one assumption is "the kitchen knows when an order is really ready". A test can be small: five interviews, a fake button that counts clicks, or a paper prototype. Do not ship a prototype as production code.

### Minimum viable product

Eric Ries made the term minimum viable product (MVP) popular in The Lean Startup. An MVP is the smallest product that lets the team learn whether its main assumption is true. The loop is build, measure, learn.

An MVP is not a bad version 1 with low quality. For Lunch Rush, an MVP can be order ahead in five shops, with pay at pickup. It tests the main assumption, that customers want to order ahead. It does not need online payment or delivery partners.

For architects: an MVP still needs the qualities that the test depends on. If the kitchen screen fails at 12:15, the test measures the failure, not the idea.

### A/B tests

An A/B test shows two versions to two groups of users and compares one metric. It is not valid in these cases:

- **Low traffic.** The test needs months to show a real difference. 40 shops can have too few orders for a small effect.
- **Novelty effect.** Users try a new thing because it is new. The early result is too high, and it falls later.
- **Early stops.** The team looks each day and stops when the result looks good. This finds false wins.

Without a valid A/B test, use interviews, a pilot in a few shops, or a comparison before and after.

### The opportunity solution tree

Teresa Torres, in Continuous Discovery Habits, gives a tree. The root is the desired outcome. Under it are opportunities: needs, pain points, and wishes. Under each are possible solutions, and under each solution are tests of its assumptions. The tree stops a jump from an outcome to one favorite feature.

## Product metrics

| Metric     | What it measures                             | Lunch Rush example                         |
| ---------- | -------------------------------------------- | ------------------------------------------ |
| Activation | New users who reach the first real value     | A first online order picked up             |
| Engagement | How often and how much users use the product | Online orders for each customer each month |
| Retention  | Users who come back after a period           | Customers who order again within 30 days   |
| Conversion | Users who move from one step to the next     | Menu visits that become paid orders        |
| Churn      | Users or customers who stop                  | Regular customers with no order in 60 days |

A **leading indicator** moves early and predicts a result. A **lagging indicator** shows the result after it occurs. The share of orders ready on time is leading. Revenue for the quarter is lagging. Steer the team with leading indicators, and check the strategy with lagging ones.

A **guardrail metric** must not get worse while you improve the main metric. If a new design raises conversion, the guardrails check that refunds, complaints, and page speed stay inside their limits.

Quality targets are product metrics too. Page speed and availability at the peak change conversion and retention. Define them as exact numbers with a load, as in [Measuring and protecting characteristics](/learn/measuring-characteristics#make-the-definition-exact).

## How architecture serves the product

This section is mainly for architects. Product roles can use it to know what to ask of architects.

### Characteristics come from product goals

The [architecture characteristics](/learn/characteristics) come from the product goals and the constraints. The [method](/learn/method) ties each characteristic to a sentence in the problem. In a real company, that sentence is often a key result.

| Product goal                                  | Characteristic                           | Design choice                                                    |
| --------------------------------------------- | ---------------------------------------- | ---------------------------------------------------------------- |
| Online pickup becomes the normal way to order | Availability and performance at the peak | Size the order flow for 11:30 to 13:30, and test it at that load |
| Shops take orders when the internet is slow   | Fault tolerance                          | The kitchen screen keeps a local copy and syncs when it can      |
| Add delivery partners next year               | Extensibility                            | Publish order events, and put each channel behind an interface   |
| Test a new pickup flow each month             | Deployability and testability            | One deployable unit with feature flags and a fast pipeline       |

If a design choice has no product goal on its row, ask why it is there.

### Keep options open where the product is uncertain

Where the product team is sure, build the simple thing. Where it is still in discovery, keep the design easy to change. In Lunch Rush, pickup is certain. Delivery partners are a plan for next year, and nobody knows which partners. A small interface for order channels is a cheap option. A full integration platform is not. See [Sell options](/learn/architect-role#sell-options) and [Decisions as options](/learn/trade-offs#decisions-as-options).

### Design for flags and experiments

A team cannot run an experiment that the system cannot express. Feature flags turn a feature on for some shops, and need a plan to remove old flags. Experiments need a stable way to put each user in a group. Measurement needs product events, such as "order picked up", not only logs. Add these early, when they cost little.

### Build, buy, or partner

| Option  | Choose it when                                            | Main cost                                    | Lunch Rush example                |
| ------- | --------------------------------------------------------- | -------------------------------------------- | --------------------------------- |
| Build   | It makes the product different, or no good product exists | Team time to build and to run it for years   | The kitchen flow and pickup slots |
| Buy     | It is a common need with mature products                  | Fees, less control, and a vendor dependency  | Card payments, text messages      |
| Partner | Another company owns the customers or the capability      | Shared revenue, and their roadmap, not yours | Delivery partners                 |

A team of four must build little, because it also runs each part that it builds.

### Cost and unit economics

Unit economics means the revenue and the cost for one unit of business: one user, one order, one shop. Express the cost of the architecture in the same unit. "The cloud bill is high" starts an argument. "Each order costs 4 cents in hosting and 10 cents in text messages" starts a decision. These numbers are only an illustration. Get the volumes from [Estimation](/learn/estimation).

### Time to market and technical debt

A product in discovery needs speed, because most ideas fail. A product that works and grows needs a structure that lasts. Technical debt is a product decision. Present each large item with its product effect: "Each change to the menu takes three days, because prices live in two places." Then the product manager can rank it against features. See [Prioritization](/learn/prioritization).

## Speak the language of product

A technical proposal wins support when it states the user effect and the business effect first.

**Before:** "We must move the kitchen screen to a local-first design with a sync queue."

**After:** "Today, a shop with a slow connection stops taking online orders at lunch. With this change, the shop continues to work, and orders sync when the connection comes back. It costs two developers about three weeks. It protects the lunch peak, when most orders arrive."

Bring a technical constraint to the product discussion early, while the solution is still open:

1. Join discovery, not only delivery.
2. State each constraint as a product effect.
3. Give options with their costs, not a "no". For example: "Live stock for each shop costs six weeks. Stock that updates each 5 minutes costs one."
4. Write the decision and its reason in a [decision record](/learn/decision-records).

For product roles: ask the architect for these options before you fix a solution. A constraint found in delivery costs much more than one found in discovery. See [Know who cares about what](/learn/teams#know-who-cares-about-what).

## Product sense questions

Interviews for product roles often ask "improve product Y". Architects in product companies get a lighter form. The usual structure has seven steps, shown here for "Improve pickup for Lunch Rush".

1. **Clarify the goal.** Ask what the business wants. Assume more repeat online orders, and confirm it with the interviewer.
2. **Choose a user segment.** Pick one group, and say why. Office workers with a 30-minute break feel each delay most.
3. **List pain points.** Walk through a real journey. The order is not ready on time. The customer waits in the walk-in queue.
4. **Prioritize.** Choose one or two by impact and effort. "Not ready on time" breaks the main promise, so start there. See [Prioritization](/learn/prioritization).
5. **Propose solutions.** Give two or three, from cheap to ambitious. Sort the kitchen screen by pickup time. Limit orders for each 15-minute slot. Add a pickup shelf.
6. **Define success metrics.** Main: the share of orders ready at the pickup time. Outcome: the repeat rate within 30 days. Guardrails: orders served in the peak hour, and cancellations.
7. **Name trade-offs and risks.** Slot limits turn some customers away at the peak. For the architect: the slot count must include counter orders, and stay correct when the shop connection is slow.

## Common mistakes

- **Feature factory.** The team measures success by features shipped, not by outcomes. John Cutler named this pattern. Melissa Perri calls the same problem the build trap.
- **Solution first.** Nobody asks which problem a feature request solves.
- **Vanity metrics.** Eric Ries uses this name for numbers that look good but do not guide a decision. Total sign-ups since launch only goes up.
- **The roadmap as a promise of dates.** A date for a problem that nobody understands yet is a guess. When it slips, trust goes down.
- **Architecture with no link to product goals.** The design is good at qualities that nobody asked for.
- **Gold-plating.** The team builds more quality or more features than the outcome needs. A 99.99% target for a report that head office reads once a week is an example.

## In a kata

Product thinking improves each of the five steps of the [method](/learn/method):

1. **Set the scope.** Name the user problem and the business result. Keep the functions that move that result.
2. **Select characteristics.** Tie each one to a product goal. "Most orders arrive between 11:30 and 13:30" means the peak is the business.
3. **Select a style.** Prefer a style that lets the team change fast where the product is uncertain. In Lunch Rush, a modular monolith fits a team of four.
4. **Draw.** Show the product events, the flags, and the parts you buy or partner with.
5. **State trade-offs.** Write each trade-off in user and business terms first. Then add the technical detail.

## In an interview

For architects: in a system design interview, ask "who uses this, and what makes it a success?" before you draw. See [The system design interview](/learn/interview-format). Prepare two stories: a design you changed because of a product goal, and architecture work you got onto the roadmap.

For product roles: expect a product sense round, a metrics round, and a behavioral round. A metrics round often gives a metric that fell, and asks why. Check the data first, then segment the users, then look for a recent change. See [Behavioral interviews](/learn/behavioral-interviews).

## Interview questions

**"What is the difference between an output and an outcome?"**

- An output is what the team ships, such as a feature.
- An outcome is a change in what users do. Impact is the business result.
- Teams steer by outcomes, because an output can have no effect.

**"How would you improve the pickup experience for a restaurant ordering app?"**

- Clarify the business goal, and choose one user segment.
- List pain points along a real journey, and prioritize one or two.
- Give solutions from cheap to ambitious.
- Define one main metric and one guardrail, and name the risks.

**"Which metrics would you track for a new feature, and how would you know it failed?"**

- Choose one main metric that the feature must move.
- Add guardrail metrics that must not get worse.
- Use leading indicators to decide early, and lagging ones to confirm.

**"How do you build a roadmap without promising dates?"**

- List problems to solve, not features.
- Show order and confidence, for example with Now, Next, and Later.
- Give dates only for items that are understood and sized.

**"How do you get architecture work onto the roadmap?"**

- State the work as a product effect: speed, reliability, cost, or a new option.
- Use numbers: days lost for each change, cost per order, failed orders at the peak.
- Link it to a key result that the product team already owns.

**"How do product goals change your architecture?"**

- The characteristics come from the goals and the constraints.
- Map each goal to a characteristic and a design choice.
- Keep options open where the product is uncertain, and build simple where it is not.

**"When do you build, buy, or partner?"**

- Build what makes the product different.
- Buy common needs that have mature products.
- Partner when another company owns the customers or the capability.
- Count the cost to run each part, not only the cost to build it.

## Go deeper

- **Inspired**, Marty Cagan, the parts on the product team and on discovery. It adds the four risks.
- **Outcomes Over Output**, Josh Seiden, the whole short book. It adds output, outcome, and impact, and how to set goals with them.
- **Continuous Discovery Habits**, Teresa Torres, the part on the opportunity solution tree. It adds weekly habits to talk to customers and test assumptions.
- **The Lean Startup**, Eric Ries, the parts on the MVP and validated learning. It adds the build, measure, learn loop and vanity metrics.
- **Measure What Matters**, John Doerr, the parts on how to write OKRs. It adds the history from Intel to Google, and examples of key results.

## Further reading

- [The four big risks](https://www.svpg.com/four-big-risks/), by Marty Cagan
- [Objectives and key results](https://en.wikipedia.org/wiki/Objectives_and_key_results) on Wikipedia
- [Minimum viable product](https://en.wikipedia.org/wiki/Minimum_viable_product) on Wikipedia
- [A/B testing](https://en.wikipedia.org/wiki/A/B_testing) on Wikipedia
- [Product management](https://en.wikipedia.org/wiki/Product_management) on Wikipedia
