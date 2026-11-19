## The job in one sentence

A software architect makes the decisions that are expensive to change later, and makes sure that the people who build the system understand why.

Most decisions in a project are cheap to change: a function name, a library for dates, a screen layout. A few are not: how many deployments the system has, who owns which data, how the parts talk, which qualities the system must have. Those few are the architecture.

The cost of change is the test. If a team can reverse a choice in an afternoon, it is not an architecture decision, even when it feels important. If a reversal takes a quarter, a data migration, and three teams, it is one. The architect finds those decisions early, makes them with care, and writes down the reasons.

## What is yours to decide

| Area            | Example decision                                                        |
| --------------- | ----------------------------------------------------------------------- |
| Characteristics | "Availability matters more than consistency for the product catalog."   |
| Structure       | "Orders and payments are one deployment. Search is separate."           |
| Data            | "Each service owns its tables. No service reads the tables of another." |
| Communication   | "The order service tells the others through events, and does not wait." |
| Principles      | "Prefer a boring technology that the team already operates."            |

An architect usually does not decide how a class is written or which pattern a developer uses in a module. Those are design decisions, and the team that writes the code makes them better.

A principle is a special kind of decision. It does not select one option. It guides the many small decisions that the teams make without the architect. "Prefer a boring technology" removes a hundred arguments before they start. A good principle states a preference and the cost it accepts.

## Architecture or design

The line between architecture and design is not sharp. Richards and Ford (Fundamentals of Software Architecture) treat it as a spectrum, not two boxes. To place a decision on the spectrum, ask three questions:

| Question                        | Closer to architecture                     | Closer to design                         |
| ------------------------------- | ------------------------------------------ | ---------------------------------------- |
| Strategic or tactical?          | Affects many teams and a long time         | Affects one module and this sprint       |
| How much effort to change?      | Weeks or months, with data migration       | Hours or days, inside one code base      |
| How significant are trade-offs? | Large: it changes the main characteristics | Small: the qualities stay about the same |

In a lunch shop system, "Orders and the kitchen screen share one database" is architecture: it decides coupling, scale, and who can deploy alone. "The order screen uses a state machine for the order status" is design: one team can change it next week.

The spectrum has a practical use. It tells you who must be in the room. A decision near the design end belongs to the team. A decision near the architecture end needs the architect, and often the people who pay for the consequences.

## The eight expectations

Richards and Ford list eight things that an organization expects from an architect, whatever the job title. They are a useful checklist for your own growth, and for an interview about the role.

| Expectation                      | What it means in practice                                                     |
| -------------------------------- | ----------------------------------------------------------------------------- |
| Make architecture decisions      | Set the decisions and principles that guide the teams. Do not pick each tool. |
| Analyze the architecture         | Check again and again if the structure still fits the business and the load.  |
| Keep current with trends         | Follow new technology and practice, because your decisions last for years.    |
| Make sure decisions are followed | Find where the code drifts from the decisions, and correct the cause.         |
| Have diverse exposure            | Know several platforms, languages, and styles, so you can compare them.       |
| Know the business domain         | Speak the language of the business, and understand what makes money.          |
| Have interpersonal skills        | Lead, explain, listen, and help teams to work well together.                  |
| Understand politics              | Expect that each decision is challenged, and know how to get agreement.       |

Four of the eight are about people and the business, not technology: decisions that are followed, the domain, interpersonal skills, and politics. That is not an accident. A correct decision that nobody accepts has no effect. See [Teams and communication](/learn/teams).

The expectation to analyze the architecture again and again is easy to forget. A structure that was right for 500 orders each day can be wrong for 50,000. A lunch shop that adds delivery has a new driving characteristic.

## The two laws

Richards and Ford state two laws of software architecture.

**The first law:** "Everything in software architecture is a trade-off." They add a corollary in their own words: if you think you found a decision with no trade-off, you have not found the trade-off yet. This law is the reason that "it depends" is the honest start of most answers. The skill is to say on what it depends. See [How to analyze a trade-off](/learn/trade-offs).

**The second law:** why is more important than how. A person can study a running system and find how it is built. Nobody can find from the code why the team rejected the other options. That reason is the most fragile part of the architecture, so you write it down. See [Architecture decision records](/learn/decision-records).

The two laws work together. The first law says that each decision has a cost. The second law says that the cost, and the reason to accept it, must survive after the people who decided leave the team.

## Breadth before depth

A developer grows by depth: one language, one framework, one database, known very well. An architect grows by breadth: many options, each known well enough to know when it fits and what it costs.

Richards and Ford show this with a knowledge pyramid of three layers:

1. **What you know.** The tools you use each day. You must maintain this knowledge, or it goes old.
2. **What you know that you do not know.** You know that a graph database exists and roughly what it is for. You have never operated one.
3. **What you do not know that you do not know.** The options that you cannot consider, because you have never heard of them.

The top layer is expensive. Each tool that you know in depth needs time to stay current. The middle layer is cheap: a few hours of reading move a technology from the bottom layer to the middle. An architect makes the middle layer as wide as possible. The goal is to make the bottom layer small, because a solution you do not know cannot enter your analysis.

This change is hard for a strong developer. Your depth was the reason for your promotion, and now some of it must go. Two traps follow:

- **You keep all your depth.** You spend your time to stay expert in five tools, and you have no time to learn what else exists.
- **You stop at old knowledge.** Richards and Ford call this the frozen caveman anti-pattern: an architect who rejects each new idea because of one bad experience long ago. The risk was real once, and it is not the same risk now.

A practical habit: keep a short personal list of technologies, sorted into "use", "try", "watch", and "stop". Look at it each few months. This is the idea of a technology radar, applied to one person.

## The architect elevator

Gregor Hohpe (The Software Architect Elevator) describes a large organization as a tall building. Executives work in the penthouse. They decide strategy, budget, and risk. Engineers work in the engine room. They write the code and run the systems. Many floors of management are between them.

```diagram
{
  "nodes": [
    { "id": "top", "label": "Penthouse\nstrategy, budget, risk", "shape": "person", "col": 0, "row": 0 },
    { "id": "mid", "label": "Middle floors\nprograms, products", "shape": "box", "col": 0, "row": 1 },
    { "id": "eng", "label": "Engine room\ncode, operations", "shape": "box", "col": 0, "row": 2 },
    { "id": "arch", "label": "Architect", "shape": "person", "col": 1.5, "row": 1 }
  ],
  "edges": [
    { "from": "top", "to": "mid", "label": "plans" },
    { "from": "mid", "to": "eng", "label": "tasks" },
    { "from": "arch", "to": "top", "label": "options and\ntheir cost", "both": true },
    { "from": "arch", "to": "eng", "label": "constraints and\nreality", "both": true }
  ]
}
```

Information gets lost on each floor. A strategy turns into a slide, then into a task list. Technical reality goes up as a green status light. The penthouse decides with a wrong picture of the engine room, and the engine room builds without the reason for the strategy.

Hohpe's architect rides the elevator. In the penthouse, the architect explains a technical decision in business terms: cost, risk, speed, and options. In the engine room, the architect explains the business goal in technical terms, and listens to what the code really allows. Both trips are necessary. An architect who stays in the penthouse becomes a person who makes slides. An architect who stays in the engine room becomes the best developer in a team, and the organization loses its connection.

## Sell options

Hohpe compares a good architecture decision with a financial option. An option is the right, but not the duty, to do something later at a known price. A clear interface around the payment provider costs a few days now. It buys the option to change provider later at a low price.

The value of an option grows with uncertainty. If the business will never change provider, the interface has little value. If the market changes each year, it has high value. This lets you argue for flexibility in business terms: you do not ask for "clean architecture", you sell an option with a price and a benefit.

Options also have a cost, so you cannot buy all of them. A system that keeps everything flexible is slow and hard to understand. Buy options only where change is likely and expensive. See [Decisions as options](/learn/trade-offs#decisions-as-options).

## The architect as a connector

An architect is rarely the person with the deepest knowledge in the room. Hohpe's point is that the value of an architect is to connect: people, levels, and ideas. The architect connects a business goal to a technical decision. The architect connects two teams that solve the same problem in two ways. The architect connects today's choice to the cost that it causes in two years.

A useful measure follows. A good architect makes the teams around them make better decisions without help. If each decision must go through you, you are a bottleneck, not a connector.

Richards and Ford describe three types of architect in relation to a team:

| Type                | Behavior                                               | Result                                    |
| ------------------- | ------------------------------------------------------ | ----------------------------------------- |
| Control freak       | Decides every detail, down to class names              | Slow teams, frustrated developers         |
| Armchair architect  | Draws diagrams, then leaves; rarely sees the code      | Designs that cannot be built or that fail |
| Effective architect | Sets clear limits, and gives the team the space inside | Fast teams that make good local decisions |

The right amount of control depends on the team. A new team on an unfamiliar platform needs more guidance. An experienced team that knows the domain needs less. The effective architect changes the amount as the team grows.

## Stay technical without blocking

An architect must keep the ability to write code, or the estimates and the advice go wrong. But code on the critical path of a release is a trap: meetings take your time, and the team waits for you. Richards and Ford suggest work that does not block: proofs of concept, bug fixes, team tools, and fitness functions, which are automatic checks that a decision is followed. See [Evolution and migration](/learn/evolution#fitness-functions).

## How architects think

- **Everything is a trade-off.** No option is best in general. An option is best for a set of [characteristics](/learn/characteristics), at a cost. If you cannot name the cost of your choice, you have not finished the analysis. See [How to analyze a trade-off](/learn/trade-offs).
- **"Why" matters more than "how".** A diagram shows how a system is built. It does not show why it is not built another way. The reason is the part that people forget, so it is the part you write down. See [Architecture decision records](/learn/decision-records).
- **Breadth before depth.** It is better to know five ways to solve a problem at a basic level than one way in full detail. See [Breadth before depth](/learn/architect-role#breadth-before-depth).
- **Constraints come from the business.** The team size, the budget, the deadline, and the law decide more than the technology does.
- **Decide at the last responsible moment.** Delay a decision until you have the information you need, but not until the delay itself causes damage.

## What changes at senior level

A junior architect answers "what is the right design?". A senior architect also answers these questions:

1. What is the simplest design that is good enough, and what will force us to change it?
2. Which decision can we delay, and what do we need to learn first?
3. How do we get from the system we have to the system we want, with the system in use? See [Evolution and migration](/learn/evolution).
4. Who must agree, and what do they care about? See [Teams and communication](/learn/teams).

## How to use this app for that

Concepts come from these pages. Judgment comes only from repetition: take a kata, make the decisions, write the trade-offs, and compare your reasoning with the review and with a worked example.

## In a kata

Each kata asks you to act as the architect, not as the developer. Before you draw, list the three or four decisions that are expensive to change in this problem. Spend your time on those. Leave the rest as design detail for the team. In [Lunch Rush](/kata/lunch-rush), for example, the split between the order flow and the kitchen screen is architecture. The layout of the menu page is not.

In the rationale, write one sentence for the penthouse: what the business gets and what it costs. Then write the technical trade-offs for the engine room.

## Interview questions

**What is the difference between architecture and design?**

- It is a spectrum, not a line.
- Place a decision by three tests: strategic or tactical, effort to change, and size of trade-offs.
- Give one example of each from a system you know.
- Say who makes each kind of decision.

**How do you stay technical as an architect?**

- Breadth over depth: the knowledge pyramid, and the goal to shrink what you do not know that you do not know.
- Code that does not block: proofs of concept, bug fixes, tools, fitness functions.
- A regular habit to review new technology, such as a personal radar.

**How do you get a decision accepted by people who disagree?**

- Find what each group cares about: cost, risk, speed, or ease of work.
- Explain the decision in their terms, with the trade-off stated openly.
- Write the decision and its reasons in a record that everyone can read.
- Accept a better argument, and show that you did.

**How much control do you take over a team's design?**

- It depends on the team's experience, the domain, and the risk.
- Avoid both extremes: the control freak and the armchair architect.
- Set clear limits and principles, and leave the decisions inside them to the team.

**How do you explain a technical investment to an executive?**

- Use the language of options: a small price now for a choice later.
- Connect the value of the option to a real uncertainty in the business.
- State the cost and the point at which you would stop.

## Go deeper

- Fundamentals of Software Architecture, Mark Richards and Neal Ford, the parts on the architect's expectations, architectural thinking, and making teams effective: the eight expectations, the knowledge pyramid, and the three types of architect.
- The Software Architect Elevator, Gregor Hohpe, the parts on the architect's role and on selling options: how to connect the penthouse and the engine room, and how to argue for flexibility in business terms.
- Team Topologies, Matthew Skelton and Manuel Pais, the part on enabling teams: how a small expert group helps other teams without control. See [Team Topologies](/learn/team-topologies).

## Further reading

- [Who needs an architect?](https://martinfowler.com/ieeeSoftware/whoNeedsArchitect.pdf), by Martin Fowler
- [The Software Architect Elevator](https://architectelevator.com/book/), the book page by Gregor Hohpe
- [Software architecture](https://en.wikipedia.org/wiki/Software_architecture) on Wikipedia
