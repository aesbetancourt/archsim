## The job in one sentence

A software architect makes the decisions that are expensive to change later, and makes sure that the people who build the system understand why.

Most decisions in a project are cheap to change: a function name, a library for dates, a screen layout. A few are not: how many deployments the system has, who owns which data, how the parts talk, which qualities the system must have. Those few are the architecture.

## What is yours to decide

| Area | Example decision |
|---|---|
| Characteristics | "Availability matters more than consistency for the product catalog." |
| Structure | "Orders and payments are one deployment. Search is separate." |
| Data | "Each service owns its tables. No service reads the tables of another." |
| Communication | "The order service tells the others through events, and does not wait." |
| Principles | "Prefer a boring technology that the team already operates." |

An architect usually does not decide how a class is written or which pattern a developer uses in a module. Those are design decisions, and the team that writes the code makes them better.

## How architects think

- **Everything is a trade-off.** No option is best in general. An option is best for a set of [characteristics](/learn/characteristics), at a cost. If you cannot name the cost of your choice, you have not finished the analysis. See [How to analyze a trade-off](/learn/trade-offs).
- **"Why" matters more than "how".** A diagram shows how a system is built. It does not show why it is not built another way. The reason is the part that people forget, so it is the part you write down. See [Architecture decision records](/learn/decision-records).
- **Breadth before depth.** A developer needs to know a few tools very well. An architect needs to know that many tools exist and when each one fits. It is better to know five ways to solve a problem at a basic level than one way in full detail.
- **Constraints come from the business.** The team size, the budget, the deadline, and the law decide more than the technology does.

## What changes at senior level

A junior architect answers "what is the right design?". A senior architect also answers these questions:

1. What is the simplest design that is good enough, and what will force us to change it?
2. Which decision can we delay, and what do we need to learn first?
3. How do we get from the system we have to the system we want, with the system in use? See [Evolution and migration](/learn/evolution).
4. Who must agree, and what do they care about? See [Teams and communication](/learn/teams).

## How to use this app for that

Concepts come from these pages. Judgment comes only from repetition: take a kata, make the decisions, write the trade-offs, and compare your reasoning with the review and with a worked example.
