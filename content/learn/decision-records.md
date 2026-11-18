## What it is

An architecture decision record (ADR) is a short text file that holds one decision and its reason. A project keeps its ADRs with the code, with a number for each.

The problem it solves: six months later, nobody remembers why the system uses a queue between two services. A new developer removes it. The fault that the queue prevented comes back. An ADR is the answer to "why is it like this?".

Michael Nygard proposed the format in a short blog post in 2011, and it spread because it is small. Richards and Ford (Fundamentals of Software Architecture) made it the standard tool for the second law of software architecture: why is more important than how. The code shows how. Only a record keeps why.

An ADR log also does work that nobody plans for. A new team member reads twenty ADRs and understands the shape of the system in an hour. An auditor asks why customer data is in one region, and the answer is in ADR 14. A team that wants to change a decision finds the original forces, and can check if they still apply.

## Which decisions need a record

Not every decision is architecture. A record for each library choice is noise, and nobody reads it. Write an ADR for a decision that is architecturally significant.

Richards and Ford, following Nygard, name five areas where a decision is usually significant:

| Area                    | Example from a ticket seller                                         |
| ----------------------- | -------------------------------------------------------------------- |
| Structure               | Seat booking is a separate service from the event catalog.           |
| Characteristics         | A seat must never be sold twice, even if booking becomes slower.     |
| Dependencies            | The booking service does not call the payment service synchronously. |
| Interfaces              | Partners get tickets through a public API with versions.             |
| Construction techniques | All services use the same framework and deployment pipeline.         |

Two more tests help. Write a record when a decision is hard to reverse. Write one when the team argued about it, because the argument shows that a future reader will have the same doubt.

## The format

| Part         | Content                                                                           |
| ------------ | --------------------------------------------------------------------------------- |
| Title        | A number and a short statement: "7. Use a queue between orders and notifications" |
| Status       | Proposed, accepted, or replaced by another ADR                                    |
| Context      | The situation and the forces: requirements, constraints, what makes this hard     |
| Decision     | What we do, in active voice: "We will…"                                           |
| Consequences | What becomes easier, what becomes harder, and what we now must do                 |

One page is the usual limit. If it is longer, it probably holds more than one decision.

Richards and Ford add two optional parts to Nygard's five:

| Part       | Content                                                                            |
| ---------- | ---------------------------------------------------------------------------------- |
| Compliance | How the team will measure that the decision is followed: a review, a test, a check |
| Notes      | Metadata: author, date, who approved it, which ADR replaced it, last change        |

Each part has a job:

- **Context** says what forced the decision. It names the alternatives the team considered. A reader who does not see the alternatives assumes that nobody thought of them.
- **Decision** states the choice firmly. "We will use a queue" is a decision. "We think a queue is probably a good idea" is not. Include the justification here: the technical reason and the business reason.
- **Consequences** is the most important part for a future reader. It lists the costs as well as the benefits. A record that lists only benefits is not trusted.
- **Compliance** turns the decision into something you can check. Without it, the decision lives only in the document.

## Statuses

The status says where a decision is in its life.

| Status                     | Meaning                                                                  |
| -------------------------- | ------------------------------------------------------------------------ |
| Proposed                   | Written, not yet approved. Open for discussion.                          |
| Request for comments (RFC) | Open for comments until a fixed date. Richards and Ford add this status. |
| Accepted                   | Approved and in effect. Teams must follow it.                            |
| Superseded by ADR n        | Replaced by a newer decision. The text stays for history.                |
| Deprecated                 | No longer applies, with no replacement. Part of Nygard's original list.  |

An RFC status with a deadline solves a common problem: a proposal that waits forever for opinions. Set the date, collect the comments, and decide.

Supersession goes in both directions. The old ADR says "superseded by 19". The new ADR says "supersedes 7". A reader who finds either one can follow the chain.

Who can move a record from proposed to accepted? Decide this once, for the whole organization. A common rule is that a team can accept a decision that affects only its own system. A decision that affects other teams, or that costs money, needs approval from an architect or a review group.

## Example

> **7. Use a queue between orders and notifications**
>
> **Status:** accepted
>
> **Context:** A customer must get a message when an order is ready. The message provider is slow at lunch and fails a few times each week. An order must not fail because a message cannot be sent. We considered a direct call with retries, and a queue with a separate worker.
>
> **Decision:** The orders module will put a "send message" job in a queue. A separate worker will send the messages and repeat a failed send. A direct call keeps the order waiting on the provider, so we reject it.
>
> **Consequences:** An order succeeds when the provider is down. Messages can be late. We must monitor the length of the queue. We must make a repeated send safe, so a customer does not get two messages.
>
> **Compliance:** A test fails the build if the orders module imports the message provider's client.
>
> **Notes:** Author: platform team. Accepted after review on the date in the file history.

## Rules that make ADRs useful

- **Write the consequences that hurt.** They are the part a future reader needs.
- **Never edit an accepted ADR to change the decision.** Write a new one that replaces it. The history is the value.
- **Write one when a decision is hard to reverse**, or when the team argued about it. Do not write one for each small choice.
- **Write it before the decision, not after.** A proposed ADR is a good way to run the discussion. A record written months later reconstructs reasons that nobody remembers.
- **Keep the language plain.** The reader can be a product owner, an auditor, or a developer who joins in two years.
- **Keep one decision for each record.** A record that holds three decisions cannot be partly replaced.

## Three anti-patterns

Richards and Ford describe three anti-patterns around architecture decisions. Each one has a clear fix.

### Covering your assets

The architect avoids or delays a decision, because they fear that it is wrong. The team waits, or the team decides alone without the architect's knowledge.

The fix has two parts. First, decide at the last responsible moment: wait until you have enough information, but not until the delay causes damage. Second, work with the developers who implement the decision. They find the problems early, and the decision gets better before it is fixed in code.

### Groundhog day

Nobody knows why a decision was made, so the team discusses it again and again. Each new person reopens the question. Each meeting ends without an end.

The cause is a missing justification. The fix is to write both reasons in the record: the technical reason and the business value. "We use one database" invites the same argument each month. "We use one database because the shop has one team, and two databases would double the work of operations" closes it.

### Email-driven architecture

People forget the decision, lose it, or never hear about it. The decision was sent in an email, said in a meeting, or written in a chat thread. Six months later, nobody can find it.

The fix is one system of record. Keep the ADRs in one place, such as the repository or a wiki. Do not copy the decision text into emails. Send a short notice with a link, and send it only to the people the decision affects. A copy goes old. A link always shows the current status.

## Governance: from decision to practice

A decision that nobody follows is not a decision. Governance is the work to make sure the architecture in the code matches the architecture in the records. Richards and Ford list it among the eight expectations of an architect.

Manual governance is slow and does not scale: an architect reviews code, finds a violation, and asks for a change. The Hard Parts recommends automated governance through fitness functions. A fitness function is an automatic check that a characteristic or a decision still holds. See [Evolution and migration](/learn/evolution#fitness-functions).

| Decision                                            | A check that governs it                              |
| --------------------------------------------------- | ---------------------------------------------------- |
| The orders module does not call payments directly   | A dependency test in the build                       |
| Each service owns its tables                        | A check that no service connects to another's schema |
| The booking API responds in less than 300 ms at p99 | A latency alert on the production metric             |
| No secrets in the code                              | A scan in the pipeline                               |

The compliance part of the ADR is where you name the check. If you cannot think of one, ask if the decision is clear enough. A vague decision cannot be governed.

Governance has a social side, too. A check that fails without explanation makes people work around it. Link each check to its ADR, so the person who sees the failure also sees the reason.

## Records as options

Gregor Hohpe (The Software Architect Elevator) describes architecture as the business of selling options: a small price now for the freedom to change later. An ADR is where that purchase is written down.

A good record says which option the team bought, and why it was worth the price. "We put an interface around the payment provider. It costs a week. It lets us change provider, because the current contract ends next year." When the contract is renewed for five years, the next team can see that the option has less value, and decide if it is worth its cost.

Hohpe also describes the architect as a person who rides the elevator between the executives and the engineers. A record helps on both floors. The context and consequences explain the decision in business terms. The decision and compliance parts explain it in technical terms. Write for both readers.

## Where to keep them

| Place                          | Strength                                    | Weakness                                     |
| ------------------------------ | ------------------------------------------- | -------------------------------------------- |
| In the repository, as Markdown | Versioned with the code, reviewed like code | Hard to find for people who do not read code |
| In a wiki                      | Easy for all readers to search and comment  | Drifts from the code, no review step         |
| Both, with a link              | Each reader finds it                        | Two places to keep in step                   |

The repository is the common default for decisions about one system. A decision that crosses many systems often goes in a shared place. Whatever you choose, make it one place, and make it the place people look.

## In a kata or an interview

The "rationale" box in a kata is a small ADR. Use the same structure: the forces from the problem, the decision, and the consequences. See [How to analyze a trade-off](/learn/trade-offs).

In an interview, you do not write a record, but you talk like one. "The context is A. I considered B and C. I select B because of D. The cost is E." That structure shows the interviewer that you know what a decision is.

## Interview questions

**How do you document architecture decisions?**

- ADRs: title, status, context, decision, consequences, and optionally compliance and notes.
- One decision for each record, kept in one system of record.
- Records are never edited to change a decision. A new record supersedes the old one.

**How do you decide which decisions need a record?**

- Architecturally significant: structure, characteristics, dependencies, interfaces, construction techniques.
- Hard to reverse, or argued about in the team.
- Not every library or style choice.

**How do you make sure teams follow a decision?**

- Name a compliance check in the record.
- Automate it as a fitness function where possible.
- Link each failing check to its record, so people see the reason.

**The team keeps reopening the same decision. What do you do?**

- This is the groundhog day anti-pattern: the justification is missing.
- Write the technical reason and the business value.
- Make the record easy to find, and point to it in the discussion.
- If the context has really changed, write a new record that supersedes the old one.

**How do you handle a decision when you do not have enough information?**

- Decide at the last responsible moment, not earlier and not later.
- Say what information you are waiting for, and by when.
- Work with the developers who will implement it, so problems appear early.

## Go deeper

- Fundamentals of Software Architecture, Mark Richards and Neal Ford, the part on architecture decisions: significant decisions, the extended ADR format, the statuses, and the three anti-patterns.
- Software Architecture: The Hard Parts, Ford, Richards, Sadalage, and Dehghani, the parts on architecture decision records and fitness functions: how each hard decision gets a record and an automated check.
- The Software Architect Elevator, Gregor Hohpe, the parts on decisions and options: how to explain a decision to executives and to engineers.

## Further reading

- [adr.github.io](https://adr.github.io/), templates and tools for decision records
- [Documenting architecture decisions](https://cognitect.com/blog/2011/11/15/documenting-architecture-decisions), the original post by Michael Nygard
- [Architectural decision](https://en.wikipedia.org/wiki/Architectural_decision) on Wikipedia
