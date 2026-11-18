## What a bounded context is

A bounded context is an explicit boundary inside which one model, and one set of words, is valid. Inside the boundary, each term has one exact meaning. Outside it, the same word can mean something else.

Evans introduced the idea in Domain-Driven Design, in the part on strategic design. His point is simple: one model for a whole large business does not work. Different groups of people need different models of the same things. A single model that tries to serve all of them becomes vague, and each change breaks someone.

Take a ticket seller. The word "ticket" has at least three meanings:

- For the seat inventory, a ticket is one seat at one show, with a price and a status.
- For the gate, a ticket is a barcode that lets one person in, one time.
- For customer support, a ticket is a complaint with a queue and an owner.

Each meaning is correct in its own area. A shared `Ticket` class with all three sets of fields helps nobody. The bounded context gives each meaning a home.

An architect needs this idea for three reasons:

1. **It gives the first candidates for components and services.** A bounded context is a business boundary with its own data and rules. See [How to find component boundaries](/learn/boundaries).
2. **It shows where integration is necessary.** Each point where two contexts meet needs a translation, and each translation has a cost.
3. **It matches teams.** One team can own a context and change it alone. See [Team types and interaction modes](/learn/team-topologies).

A bounded context is not the same as a microservice. One context can be one module in a [modular monolith](/learn/modular-monolith), one service, or a small group of services. The context is a boundary of meaning. The deployment unit is a separate decision. See [Service granularity](/learn/service-granularity).

## Ubiquitous language

The ubiquitous language is the set of words that the business people and the developers share inside one context. The same words appear in conversation, in the documents, in the tests, and in the code.

When the business says "a hold expires after eight minutes", the code has a `Hold` with an `expire` operation. It does not have a `TempReservationRecord` with a `cleanup` job. When the words in the code and in the meetings differ, each conversation needs a translation in somebody's head, and errors occur in that translation.

Rules that make the language work:

- **Make the language exact.** "Customer" is too vague if a buyer and a promoter are both customers. Use "buyer" and "promoter".
- **Change the code when the language changes.** A new insight in a meeting is a reason to rename a class.
- **Write down the terms.** A short glossary for each context is enough. The [domain model](/learn/domain-model) lesson shows how the terms become code.
- **Listen for disagreement.** Two experts who argue about what a word means often work in two different contexts. That argument shows a boundary.

The language is "ubiquitous" only inside its context. It is not a company-wide dictionary. A company that tries to agree one meaning for each word across all departments usually fails, and the attempt takes months.

## Model integrity: one model in one place

Evans uses the term model integrity. Inside one context, the model must be consistent: no two classes for the same idea, no two meanings for one term. This is hard to keep when many people change the same code.

Two practices protect it inside a context:

- **Continuous integration.** Evans means more than a build server. The people who work in a context merge their work often and talk often, so that the model does not split into private versions.
- **One team for each context.** When two teams change one model, each one bends it to its own needs. Over time the model loses its shape.

Between contexts, integrity has a different meaning. Each context keeps its own model, and the boundary stops one model from leaking into the other. The context map is the tool that makes these boundaries visible.

### Context and subdomain

A subdomain is a part of the business problem, such as pricing or payments. It is in the problem space. A bounded context is a part of the solution: a model and its code. It is in the solution space.

In a new design, the two often match one to one. In an old system they often do not. One old application can cover five subdomains, or one subdomain can be spread across three systems. The context map shows the real state, not the wanted state.

## How to find the contexts

The first methods to find components are in [How to find component boundaries](/learn/boundaries#ways-to-find-the-first-components). This section adds what to look for when the goal is contexts.

Event storming, a workshop method from Alberto Brandolini, is a good tool for this. A domain event is a fact that the business cares about, written in the past tense: "Seats held", "Order paid", "Ticket scanned". The group puts the events on a long wall in time order.

Signals of a context boundary on the wall:

| Signal                                                                   | What it shows                                              |
| ------------------------------------------------------------------------ | ---------------------------------------------------------- |
| The same word means different things on two parts of the wall            | Two models, so two contexts                                |
| A pivotal event, after which other people and other rules take over      | A hand-off between two areas, for example "Order paid"     |
| Different people in the room know each part                              | Different experts, so probably different languages         |
| A part of the flow uses different data                                   | Data that belongs to a different owner                     |
| A hot spot: a note that marks a conflict or a question nobody can answer | An unclear boundary, or a boundary between two teams today |

A pivotal event is a good place to draw the first line. In the ticket seller, "Order paid" is pivotal. Before it, the work is about seats, prices, and holds. After it, the work is about tickets, delivery, and the gate.

The output of the workshop is a set of candidate contexts, not a final design. Test each candidate. Does it have its own data? Can one team own it? Can it change without changes in its neighbors for most business requests?

## The context map

A context map is a diagram, with notes, that shows each bounded context and the relationship between each pair that must integrate. It shows the present state, including the parts that are not good.

Two words describe the direction of each relationship:

- **Upstream.** The context whose model and decisions flow to the other. Changes upstream affect the downstream context.
- **Downstream.** The context that depends on the other one. It must react to changes upstream.

Upstream and downstream are about influence, not about the direction of the calls or the data. A downstream service often calls the upstream service.

The relationship is also a relationship between teams. Evans makes this point clearly: the pattern you can use depends on how much the two teams can talk and agree. A good technical pattern fails if the teams cannot work that way.

## The relationship patterns

Evans named most of these patterns. Partnership and big ball of mud were added later, in his short Domain-Driven Design Reference.

| Pattern              | What it is                                                                                          | Use it when                                                        | The cost                                                      |
| -------------------- | --------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------ | ------------------------------------------------------------- |
| Partnership          | Two teams succeed or fail together. They plan and release their integration together.               | Two contexts must change together for a period                     | Much coordination. Neither team can move alone.               |
| Shared kernel        | Two contexts share a small, explicit part of the model and its code. Neither team changes it alone. | The shared part is small, stable, and truly the same in both       | Each change to the kernel needs both teams. It tends to grow. |
| Customer-supplier    | The downstream team is a customer. The upstream team plans its work to meet the customer's needs.   | The upstream team is willing and able to listen                    | The upstream team carries the needs of its customers.         |
| Conformist           | The downstream team uses the upstream model as it is, with no translation.                          | The upstream team will not change, and its model is good enough    | The upstream model shapes your code. A bad model spreads.     |
| Anticorruption layer | The downstream context has a translation layer that turns the upstream model into its own model.    | The upstream model is bad, old, or foreign, and your model matters | A layer to build, test, and keep. Some latency.               |
| Open host service    | The upstream context offers a defined protocol or API that serves all its consumers.                | Many consumers need the same integration                           | The upstream team keeps the API stable and versioned.         |
| Published language   | A shared, documented format for exchange, such as a schema or an industry standard.                 | Often with an open host service, or between companies              | The language must evolve with care.                           |
| Separate ways        | The two contexts do not integrate at all. Each one solves its need alone.                           | The integration costs more than the value it gives                 | Some duplicate work. Users can see two systems.               |
| Big ball of mud      | An area with no clear model, where models are mixed. You mark it and put a boundary around it.      | An old system that you cannot fix now                              | Do not let its model leak out. Do not build new work in it.   |

### The anticorruption layer in detail

An anticorruption layer (ACL) is the pattern that architects use most in old systems. It is a set of adapters and translators in the downstream context. It calls the upstream system, takes its data in the upstream format, and gives the rest of the context objects in its own model.

For example, an old customer system stores a person as one record with 80 fields and status codes such as "A7". The ACL turns this into a `Buyer` with a name, an email, and a flag for "can buy presale tickets". The rest of the code never sees "A7".

The ACL is the same idea as an adapter in [hexagonal architecture](/learn/hexagonal), at the size of a whole context. It is also a key tool when you [decompose a monolith](/learn/decomposing-a-monolith): the new context talks to the old system only through its ACL.

### Conformist or anticorruption layer

This is the most common choice on a context map. Both describe a downstream team that cannot change the upstream model.

- Choose **conformist** when the upstream model is reasonable and close to your needs. Translation has a cost, and a good model does not need it. Many teams conform to the model of a large payment provider.
- Choose an **anticorruption layer** when the upstream model is poor, or when your context is core to the business. Your core model must not take the shape of somebody else's system.

### Open host service and published language

These two patterns often work together. The upstream context publishes one API or one set of events for all consumers. The format is documented and versioned. Consumers do not get custom integrations.

Events that cross a boundary are a good place for a published language. "Order paid", with a documented schema, lets other contexts react without knowledge of the ordering model. See [Encoding and evolution](/learn/encoding-and-evolution) for how such a format changes over time without breaking consumers.

## A context map for a ticket seller

Here is a context map for a ticket seller such as the one in the [Front Row kata](/kata/front-row). Each arrow goes from upstream to downstream. The label names the pattern.

```diagram
{
  "nodes": [
    { "id": "catalog", "label": "Show catalog\n(promoters)", "shape": "module", "col": 0, "row": 0 },
    { "id": "inventory", "label": "Seat inventory\n(core)", "shape": "module", "col": 1, "row": 0 },
    { "id": "ordering", "label": "Ordering\n(holds, checkout)", "shape": "module", "col": 1, "row": 1 },
    { "id": "ticketing", "label": "Ticketing\n(barcodes)", "shape": "module", "col": 1, "row": 2 },
    { "id": "support", "label": "Support desk", "shape": "module", "col": 0, "row": 2 },
    { "id": "crm", "label": "Old customer\nsystem", "shape": "external", "col": 2.5, "row": 0 },
    { "id": "payments", "label": "Payment\nprovider", "shape": "external", "col": 2.5, "row": 1 },
    { "id": "scanners", "label": "Scanner\nvendor", "shape": "external", "col": 2.5, "row": 2 }
  ],
  "groups": [{ "id": "ours", "label": "Our contexts", "col": 0, "row": 0, "cols": 2, "rows": 3 }],
  "edges": [
    { "from": "catalog", "to": "inventory", "label": "customer-supplier" },
    { "from": "inventory", "to": "ordering", "label": "open host service" },
    { "from": "crm", "to": "ordering", "label": "anticorruption\nlayer" },
    { "from": "payments", "to": "ordering", "label": "conformist" },
    { "from": "ordering", "to": "ticketing", "label": "Order paid\n(published language)", "async": true },
    { "from": "scanners", "to": "ticketing", "label": "conformist" }
  ]
}
```

How to read it:

- **Show catalog to seat inventory: customer-supplier.** Promoters create shows and price levels. Inventory needs them in a form it can sell. The catalog team plans its changes with the inventory team.
- **Seat inventory to ordering: open host service.** Inventory offers one API to hold, release, and sell seats. Ordering, the box office app, and the resale market all use the same API.
- **Old customer system to ordering: anticorruption layer.** The old system has a poor model. Ordering keeps its own `Buyer` model, and the ACL translates.
- **Payment provider to ordering: conformist.** The provider will not change its API for one customer. Its model is good, so ordering uses it with no translation.
- **Ordering to ticketing: published language.** Ordering publishes "Order paid" with a documented schema. Ticketing makes the barcodes. The two contexts share no code.
- **Scanner vendor to ticketing: conformist.** The vendor defines the barcode format, and ticketing follows it.
- **Support desk: separate ways.** It has no arrow. The support team uses its own tool, and an agent looks up an order by its number. An integration is not worth its cost now.

Note what the map does not show: a shared database. Each context owns its data. See [Data ownership](/learn/data-ownership).

## Distillation: core, supporting, generic

Not all contexts are equally important. Evans calls the process of finding the important part distillation. The result tells you where to put your best people, and what to buy instead of build.

| Kind of subdomain | What it is                                                        | Ticket seller example                  | What to do                                               |
| ----------------- | ----------------------------------------------------------------- | -------------------------------------- | -------------------------------------------------------- |
| Core domain       | The part that makes the business different from its competitors   | Seat inventory under a burst of buyers | Build it. Put the strongest team on it. Model it deeply. |
| Supporting        | Necessary and specific to this business, but not a differentiator | The show catalog, the promoter reports | Build it simply, or have it built. Keep it good enough.  |
| Generic           | A problem that many businesses share, with known solutions        | Login, email delivery, card payments   | Buy it or use open source. Do not invent it.             |

Evans uses the terms core domain and generic subdomains. The three-way split with "supporting" is the common form today, and later DDD authors made it popular.

Distillation has consequences for the context map:

- **Protect the core.** The core context uses an anticorruption layer against generic and old systems. It does not conform to them.
- **Conform to generic services.** For a login provider or a payment provider, conformist is usually correct. Your model of a card payment does not give you an advantage.
- **Do not over-build supporting contexts.** A simple [layered](/learn/layered) application with plain records can be enough. Save the rich [domain model](/learn/domain-model) for the core.

The core domain also changes over time. A ticket seller that adds dynamic pricing can find that pricing becomes core, and seat inventory becomes a solved problem.

## Trade-offs and failure modes

Bounded contexts are not free. Each boundary needs a translation, an API, or events, and each one must be built, tested, and kept.

Common failures:

- **The enterprise model.** One canonical model for the whole company, often a large shared schema. Each context must use it, so each change needs agreement across the company. Change becomes very slow.
- **Contexts that are too small.** A context for each entity gives many boundaries with chatty calls. It is the [entity trap](/learn/boundaries#the-entity-trap) at a larger size. A context usually holds several aggregates.
- **A shared kernel that grows.** It starts with three classes and becomes a shared library that each team must release together. That is a [distributed monolith](/learn/modularity#the-distributed-monolith).
- **A silent conformist.** A team conforms to a poor upstream model with no decision. Over time the poor model spreads through the code. Make the choice explicit, and write it in a [decision record](/learn/decision-records).
- **A map of the wanted state.** A context map that shows clean boundaries that do not exist is useless for decisions. Draw what is there, including the big ball of mud.
- **A context split across teams.** Two teams own parts of one model. The language splits, and the model loses integrity. Move the boundary, or move the people.
- **Language that drifts.** The code keeps old names after the business has changed its words. New people learn the wrong words.

A rule for the size: draw a boundary where the language changes, where the data has a different owner, or where a different team works. Do not draw a boundary only because a part of the code is large.

## In a kata

Use bounded contexts in step 4 of the [method](/learn/method), when you draw the components.

1. List the main events of the kata in time order. Find the pivotal events.
2. Name the contexts with business words. Write one sentence for each that says what it owns.
3. Find one word that means two things, and say which context owns each meaning. Interviewers notice this.
4. Draw the arrows between contexts, and name the pattern on the important ones: ACL, open host service, published language, conformist.
5. Mark the core domain. Say what you buy for the generic parts.

In [Lunch Rush](/kata/lunch-rush), the menu for head office and the order on the kitchen screen are different models of the same food. In [Waiting Room](/kata/waiting-room), each old clinic system needs an anticorruption layer during the two-year move.

## Interview questions

**What is a bounded context, and how is it different from a microservice?**

- A boundary inside which one model and one language are valid.
- It is a boundary of meaning. A service is a boundary of deployment.
- One context can be a module, one service, or several services.
- One context must not be split across teams. One team can own several contexts.

**How do you find bounded contexts in a new domain?**

- Talk to the experts. Listen for words that change meaning, and for disagreements.
- Use event storming. Look for pivotal events and changes of people and data.
- Test each candidate: own data, one owner team, changes stay mostly inside it.
- Start with larger contexts. Split later with a reason.

**You must integrate with an old system that has a poor model. What do you do?**

- Put an anticorruption layer in your context. Translate at the edge.
- Keep your own model clean, especially if your context is core.
- Do not read the old database directly if you can avoid it.
- Use the ACL as the seam for a later migration, with the strangler fig approach.

**When is a shared kernel a good idea?**

- When the shared part is small, stable, and really means the same in both contexts.
- Only when the two teams work closely and can agree each change.
- Watch for growth. A kernel that grows becomes a coupling point for releases.
- A published language is often a safer choice: share the format, not the code.

**What is the core domain, and why does it matter to an architect?**

- The part of the business that gives the advantage over competitors.
- It gets the best people, the richest model, and the strongest protection at its boundaries.
- Generic parts are bought or taken from open source.
- It tells you where custom complexity is worth its cost, and where it is not.

## Go deeper

- **Domain-Driven Design** (Eric Evans), the part on strategic design: bounded contexts, the context map patterns, and distillation. It is the original source for all of this page.
- **Building Microservices** (Sam Newman), the part on how to model services: why bounded contexts are good first service boundaries, and how to split them later.
- **Software Architecture: The Hard Parts** (Ford, Richards, Sadalage, Dehghani), the parts on service granularity and data ownership: how context boundaries meet data and transactions.
- **Team Topologies** (Matthew Skelton, Manuel Pais), the part on fracture planes: the bounded context as the first place to split work between teams.

## Further reading

- [Bounded context](https://martinfowler.com/bliki/BoundedContext.html) and [Ubiquitous language](https://martinfowler.com/bliki/UbiquitousLanguage.html), by Martin Fowler
- [Domain-Driven Design Reference](https://www.domainlanguage.com/ddd/reference/), by Eric Evans
- [Event storming](https://en.wikipedia.org/wiki/Event_storming) on Wikipedia
- [Decompose by subdomain](https://microservices.io/patterns/decomposition/decompose-by-subdomain.html), on microservices.io
