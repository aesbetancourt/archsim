## Why this is the core skill

Each architecture decision improves some qualities and makes others worse. A shared database gives simple transactions and couples the services. A cache gives speed and makes data old. The skill is not to find the option with no cost. It is to select the cost that this business can best accept, and to say so clearly.

Richards and Ford make this the first law of software architecture: everything is a trade-off (Fundamentals of Software Architecture). If you see an option with no cost, look again. The cost is there, and it is often in a quality that nobody asked about yet: operability, the cost of change, or the skills of the team.

The same option can be right in one system and wrong in another. A single database is a good choice for a lunch shop with one team. It is a poor choice for a parcel service with twenty teams that must deploy alone. The technology did not change. The context did. That is why an architect answers "it depends", and then says on what.

## A method in five steps

1. **State the decision as a question.** "How do the order service and the payment service share data?" A vague question gives a vague answer.
2. **List two or three real options.** Include the simplest one, even if you expect to reject it. One option is not an analysis.
3. **Select the characteristics that matter here.** Use the three driving [characteristics](/learn/characteristics) of the system, plus cost and the skills of the team.
4. **Score each option against each characteristic.** Better, worse, or the same is enough. Write one sentence of reason for each score.
5. **Select, and write what you gave up.** Use the form: "We select A because of X. We accept Y. We will look again if Z occurs."

Step 3 is where most analyses go wrong. If you score against ten characteristics, every option wins somewhere and the table decides nothing. Keep to the few that the business really needs. A characteristic that is not a driver can still be a limit: "it must cost less than the current system". Treat a limit as pass or fail, not as a score.

Step 5 has three parts, and each one has a purpose. "Because of X" names the driver. "We accept Y" names the cost, so nobody is surprised later. "We will look again if Z" names the signal that the context changed. Without the third part, a decision stays in place long after its reason is gone.

## Example

Decision: how does the kitchen screen get new orders?

|              | Screen asks every 10 seconds        | Server pushes on an open connection |
| ------------ | ----------------------------------- | ----------------------------------- |
| Simplicity   | Better: a normal request            | Worse: connection handling          |
| Delay        | Worse: up to 10 seconds             | Better: immediate                   |
| Weak network | Better: each request is independent | Worse: connections drop             |

"We select the 10-second request because the shop network is weak and the team is small. We accept a delay of up to 10 seconds. We will look again if pickup times become shorter than two minutes."

## A deeper method for hard parts

Ford, Richards, Sadalage, and Dehghani (Software Architecture: The Hard Parts) focus on decisions in distributed systems, where the hard part is usually coupling. Their approach has three steps:

1. **Find what is entangled.** Which parts of the system change together, share data, or call each other? Draw them.
2. **Analyze how they are coupled.** Is it a shared database, a synchronous call, a shared library, a shared transaction? Each kind of coupling has its own cost.
3. **Assess the trade-offs by the impact of change.** For each option, ask what happens when one part changes, scales, or fails. The option that limits the damage of likely changes is usually the better one.

This method moves the question from "which pattern is best?" to "what does this coupling cost us when things change?". That is a question you can answer with the facts of the system.

## Qualitative and quantitative analysis

A quantitative analysis uses numbers: latency in milliseconds, cost each month, requests each second. A qualitative analysis uses judgment: better, worse, the same, with a reason.

The Hard Parts makes a point that surprises many engineers. Most architecture analysis must be qualitative. Each architecture is unique, so you cannot run a fair experiment that compares two full designs. You cannot build the parcel service twice, once with events and once with direct calls, and measure which is better.

| Kind         | When to use it                                                         | Example                                                     |
| ------------ | ---------------------------------------------------------------------- | ----------------------------------------------------------- |
| Quantitative | A part is small enough to measure, or the question is about one number | "Can one database server hold the write rate?"              |
| Qualitative  | The question is about a whole structure, or about change over time     | "Is it easier to change pricing with one service or three?" |

Use numbers where you can get them cheaply. A rough [estimate](/learn/estimation) or a small load test often ends an argument. Where you cannot measure, make the qualitative analysis disciplined: the same criteria for each option, and one written reason for each score.

## Make a MECE list of options

The Hard Parts recommends that you compare options in a list that is MECE: mutually exclusive and collectively exhaustive.

- **Mutually exclusive:** the options do not overlap. "Use a queue" and "use events" overlap, because events often travel on a queue. "One shared database" and "a database for each service" do not.
- **Collectively exhaustive:** the list covers the real space of options. If a reasonable person asks "why not just X?" and X is not on the list, the list is not complete.

Example decision for a tutor marketplace: how does the booking service know if a tutor is free?

| Option                                      | Exclusive? | Notes                                   |
| ------------------------------------------- | ---------- | --------------------------------------- |
| Call the calendar service on each booking   | Yes        | Always current, adds a runtime coupling |
| Keep a local copy, updated by events        | Yes        | Fast and independent, data can be old   |
| Merge calendar and booking into one service | Yes        | No coupling, a larger service           |

These three cover the space: ask each time, copy, or merge. A fourth option, "use a cache", is not a new option. It is a version of the second. The MECE test stops you from comparing a real option with a slight variant of itself.

## Avoid out-of-context decisions

An out-of-context decision copies a conclusion from another place without its reason. "Shared libraries are bad in microservices." "Never use a distributed transaction." Each rule was true somewhere, for some reason.

The Hard Parts warns against this trap. A trade-off is only valid for its context. A shared library for date formats is harmless. A shared library for the rules that price an order couples every service that uses it, and each change needs a coordinated release. The kind of coupling is the same. The rate of change is different, so the conclusion is different.

To avoid the trap, ask of each rule: what problem did it solve, and do we have that problem? If you cannot say, you do not understand the rule well enough to apply it.

## Model the domain cases

An abstract comparison hides the details that decide. The Hard Parts recommends that you test each option against real cases from the domain. Walk each case through each option, step by step.

Example: in a parcel service, is label printing its own service, or a part of the shipment service? Do not compare "separate" and "together" in general. Take the real cases:

| Case                                     | Separate label service                   | Part of shipment service           |
| ---------------------------------------- | ---------------------------------------- | ---------------------------------- |
| A customer reprints a lost label         | Simple: label service has all it needs   | Simple                             |
| The carrier's label system is down       | Shipments still accepted; labels wait    | Shipment creation can fail with it |
| Peak week: label volume triples          | Scale label service alone                | Scale the whole shipment service   |
| A shipment's address changes after print | Two services must agree on the new label | One transaction                    |

The cases show what the general comparison hid. Separation helps with failure and scale. It hurts when an address changes. Now the question is concrete: how often do addresses change after print, and how bad is a wrong label?

## Give the bottom line

After a long analysis, it is tempting to show all of it: twelve criteria, five options, three pages of tables. The Hard Parts advises the opposite. Prefer the bottom line over overwhelming evidence.

The people who decide, or who pay for the decision, need three things:

1. The decision, in one sentence.
2. The main cost, in one sentence.
3. The condition that would change your mind.

Keep the full analysis available, for example in a [decision record](/learn/decision-records). Lead with the conclusion. A reader who must dig through evidence to find your recommendation assumes that you do not have one.

The same advice applies to the language. Translate technical costs into business terms. "Higher coupling" means little to a product owner. "Each change to pricing needs three teams to release on the same day" means a lot.

## Decisions as options

Gregor Hohpe (The Software Architect Elevator) treats architecture as the business of selling options. An option is the right to make a choice later, at a known price. A clean interface around a payment provider is an option to change provider. A queue between two services is an option to add consumers.

This view adds time to the trade-off analysis:

- **An option has a price now.** The interface, the queue, the extra abstraction: each one costs time and complexity today.
- **An option has value later.** The value is the saving if you need the change.
- **The value grows with uncertainty.** If the future is clear, an option is worth little. If the market changes each year, it is worth a lot.

Ask of each flexible design: what option does this buy, how likely is it that we use it, and what does it cost to hold? A team that buys every option builds a slow, complex system. A team that buys none is stuck at the first change. The skill is to buy options only where change is both likely and expensive.

This also explains the advice to delay decisions. A decision that you delay is an option that you keep. It is free if you lose nothing by the wait. It is expensive if the delay blocks other work.

## Common mistakes

- **Only benefits.** A design with no stated cost is a sales text.
- **Comparison with a weak alternative.** If the rejected option is clearly bad, you did not compare with a real one.
- **Decisions by fashion.** "Large companies use microservices" is not a reason. Their constraints are not yours.
- **Decisions too early.** If a decision is cheap to delay and you will know more later, delay it and say what you are waiting for.
- **Evangelism.** The Hard Parts warns against the architect who promotes one tool or style everywhere. An architect who always selects the same answer is not analyzing.
- **Too many criteria.** A score table with fifteen rows hides the two rows that decide.
- **No signal to look again.** A decision with no review condition stays in place after its reason is gone.

## The word "least worst"

A common saying in the field is that there are no best architectures, only the least worst set of trade-offs. When two options seem equal, prefer the one that is easier to change later.

The Hard Parts uses this idea as its main message. In a distributed system, every option has a real cost. A search for the best design never ends, because no design is best on all the characteristics. The useful search is for the design whose costs this business can live with.

The phrase also sets expectations with the stakeholders. If you promise the best architecture, every cost that appears later looks like your mistake. If you present the least worst option, with its costs named, the costs are part of the agreement.

## In a kata

Each kata asks for a rationale. Use this page there. For the two or three main decisions, write the options as a MECE list, walk one real case from the problem through each option, and close with the three-part sentence: select, accept, look again.

In [Tutor Marketplace](/kata/tutor-marketplace), for example, walk the case "a tutor cancels five minutes before a session" through each design. In [Lunch Rush](/kata/lunch-rush), walk "the kitchen screen loses its connection at noon".

## Interview questions

**How do you decide between two architectures?**

- Name the decision as a question, and list two or three real options, MECE.
- Select the few characteristics that drive this system.
- Walk real cases from the domain through each option.
- State the choice, the cost you accept, and the signal to look again.

**Your design has a weakness. Why did you accept it?**

- Name the weakness without defense.
- Name the characteristic you gained by it.
- Explain why the business values the gain more than the cost.
- Say what would make you change the choice.

**Can you measure which architecture is better?**

- Only parts of it. A whole architecture is unique, so most analysis is qualitative.
- Use numbers where they are cheap: estimates, load tests, cost models.
- Make qualitative analysis disciplined: the same criteria and a written reason for each score.

**A team says "shared code is bad in microservices". Do you agree?**

- It depends on what the code is and how often it changes.
- Stable utilities are fine to share. Volatile business rules couple the releases.
- Avoid out-of-context rules. Ask what problem the rule solved.

**When do you add flexibility to a design?**

- Treat flexibility as an option with a price now and value later.
- Buy it where change is likely and expensive.
- Do not buy it where the future is clear, or where change is cheap anyway.

## Go deeper

- Fundamentals of Software Architecture, Mark Richards and Neal Ford, the parts on architectural thinking and on the laws of software architecture: why every decision is a trade-off, and how to analyze it.
- Software Architecture: The Hard Parts, Ford, Richards, Sadalage, and Dehghani, the part on building your own trade-off analysis: qualitative analysis, MECE lists, the out-of-context trap, domain cases, and the bottom line.
- The Software Architect Elevator, Gregor Hohpe, the part on architecture as selling options: how to give flexibility a price and a value.

## Further reading

- [Architecture tradeoff analysis method](https://en.wikipedia.org/wiki/Architecture_tradeoff_analysis_method), a formal version of this method, on Wikipedia
- [MECE principle](https://en.wikipedia.org/wiki/MECE_principle) on Wikipedia
- [Real options valuation](https://en.wikipedia.org/wiki/Real_options_valuation) on Wikipedia, the finance idea behind options in design
