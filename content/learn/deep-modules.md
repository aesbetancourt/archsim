## Why complexity is the real enemy

Most code is read and changed many more times than it is written. The cost of a code base over its life is mostly the cost of change. Ousterhout (A Philosophy of Software Design) puts one idea at the center: the main job of design is to reduce complexity.

He defines complexity in a practical way. Complexity is anything in the structure of a system that makes it hard to understand or to change. It is not the size of the system. A large system with clear parts can be simple to work in. A small one with tangled parts can be very hard.

An architect needs this idea for two reasons:

1. **It gives words for a feeling.** "This code is bad" starts an argument. "This change touches nine files, and nobody knew about the tenth" describes a cost.
2. **It works at each size.** The same rules apply to a class, a package, a component, and a service. A service is a module with a network between it and its callers.

This page explains the symptoms, the causes, and the design rules that reduce complexity. [Modularity, cohesion, and coupling](/learn/modularity) gives the measures. This page gives the design judgement.

## The three symptoms

Ousterhout names three ways in which complexity shows itself.

| Symptom              | What it is                                                                  | Lunch shop example                                                                                |
| -------------------- | --------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| Change amplification | A small change in behavior needs changes in many places                     | A new tax rate needs edits in the checkout, the receipt, the kitchen ticket, and three reports    |
| Cognitive load       | A developer must know a lot to make a change safely                         | To add a discount, you must know the order of six price steps and two global flags                |
| Unknown unknowns     | It is not clear what you must change, or what you must know, to do the task | A change to the menu format breaks the till in the shops, and no code or document showed the link |

Unknown unknowns are the worst of the three. With change amplification, you can at least find all the places. With cognitive load, you can learn what you need. With an unknown unknown, you only find the problem in production.

## The two causes

Complexity comes from two causes.

- **Dependencies.** A dependency exists when you cannot understand or change one piece of code alone. Some dependencies are necessary: a caller depends on the signature of a function. The goal is fewer dependencies, and dependencies that are obvious.
- **Obscurity.** Obscurity exists when important information is not obvious. Examples: a vague name, a variable used for two purposes, a rule that is written down nowhere, an order of calls that is required but not stated.

Dependencies cause change amplification and a high cognitive load. Obscurity causes unknown unknowns, and it also adds to cognitive load. A typical unknown unknown is a dependency that nobody can see.

### Complexity is incremental

No single change makes a code base complex. Each shortcut adds a small dependency or a small obscurity. Hundreds of them make the code hard to change, and by then each one is too small to fix alone.

This is why Ousterhout separates tactical and strategic programming. A tactical programmer makes the current feature work as fast as possible. A strategic programmer also invests a little time in each change, so that the design stays good. See [Strategic and tactical programming](/learn/code-architecture#strategic-and-tactical-programming) for the details and his rough budget of 10 to 20 percent.

## Deep and shallow modules

A module is any unit with an interface and an implementation: a function, a class, a package, a service. Ousterhout describes the value of a module as a comparison:

- **The interface** is the cost. Each caller must learn it. It includes the signatures, and also the informal part: the order of calls, the side effects, the errors, the performance.
- **The implementation** is the benefit. It is the work that callers do not have to do or understand.

A **deep module** has a simple interface and a lot of functionality behind it. A **shallow module** has an interface that is almost as complex as its implementation. A shallow module gives little benefit, because callers must learn nearly as much as they would to write the code themselves.

| Design                                                                                                   | Depth   | Why                                                                             |
| -------------------------------------------------------------------------------------------------------- | ------- | ------------------------------------------------------------------------------- |
| `priceOrder(order)` returns the final price. Inside: menu prices, specials, discounts, tax, rounding.    | Deep    | One call. The caller knows nothing about the six steps.                         |
| `applyDiscount(price, rule)`, `addTax(price, region)`, `roundPrice(price)`, all public, in a fixed order | Shallow | The caller must know the steps and their order. A new step changes each caller. |
| `shipParcel(parcel, address)` returns a tracking number. Inside: carrier choice, rates, labels, retries. | Deep    | The caller does not know which carrier was used.                                |
| A `ParcelRepository` with one method for each column of the table                                        | Shallow | It shows the table through a second interface, and hides nothing.               |

### Classitis

Ousterhout warns against a common belief: that classes and functions must always be small. He calls the result "classitis". Many tiny classes each add an interface, and the system gets more interfaces with less behind each one.

The total complexity is often higher. To do one task, a developer must read eight small classes and understand how they connect. A few deeper classes would hide the same work behind fewer interfaces.

This view disagrees with advice that each function must be only a few lines long. Small units are good when each one hides something. They are bad when they only split one idea into pieces that must always be read together.

## Information hiding and information leakage

Information hiding is the main way to make a module deep. David Parnas described it in 1972. Each module hides some design decisions: a data format, an algorithm, a choice of external system. Other modules depend only on the interface, so the hidden decision can change.

[How to find component boundaries](/learn/boundaries#information-hiding) applies the same idea to services.

**Information leakage** is the opposite. One design decision is visible in more than one module. When the decision changes, each of those modules must change.

Leakage is not always through an interface. Two modules can share knowledge with no call between them. For example, a writer and a reader of one file format both know the format. If the format changes, both must change. This is a back-door leak, and it is often an unknown unknown.

The fix for leakage is usually to bring the knowledge into one module. If the writer and the reader both know the format, make one module that owns the format, with `save` and `load` operations.

### Temporal decomposition

A common cause of leakage is temporal decomposition. The structure of the code follows the order in which things occur: first read, then change, then write. Each step becomes a module.

The problem is that the steps often share knowledge. A "read the order file" module and a "write the order file" module both know the format of the file. The format leaks into two places.

The rule: when you design modules, think about the knowledge each one needs, not the order of the steps. Put the steps that share knowledge in one module, even if they occur at different times.

## General-purpose modules

Ousterhout recommends modules that are "somewhat general-purpose". The interface is general enough to support several uses. The implementation does what the current needs require, and no more.

A general interface is often simpler than a special one. A notification module with `send(recipient, message, channel)` supports many features. A module with `sendOrderReadySms`, `sendWeeklyPromoEmail`, and `sendRefundNotice` has many methods, and each new feature of the shop leaks into it.

Three questions help you find the right level:

1. What is the simplest interface that covers all the current needs?
2. In how many places will this method be used? A method with one use is often too special.
3. Is the interface easy to use for the current needs? If each caller needs a lot of extra code, it is too general.

## Different layer, different abstraction

In a well-designed system, each layer gives a different abstraction from the layers above and below it. A layer for payments speaks of charges and refunds. The HTTP layer below it speaks of requests and responses.

When two neighbor layers have the same abstraction, one of them adds little value. The usual signs:

- **Pass-through methods.** A method that only calls another method with the same signature. The class adds an interface and hides nothing.
- **Pass-through variables.** A value passed through a long chain of methods that do not use it, only to reach one method at the end. Each method in the chain now depends on it. A shared context object can hold such values.
- **Decorators that add little.** A wrapper class that forwards 20 methods to add one small behavior. It is shallow by design.

Not every duplicate signature is bad. A dispatcher that selects one of several implementations with the same interface does useful work.

The same problem appears between services. A gateway service that only forwards each call to one other service is a pass-through at the level of the architecture. It adds a network hop and a deployment, and it hides nothing.

## Pull complexity downward

When some complexity is necessary, put it in the module, not in its callers. A module has one implementation and many users. If the module handles the hard part once, each user is simpler.

The rule is that a simple interface is more important than a simple implementation.

Configuration parameters are a common way to push complexity up. A module that asks each caller for a retry count, a timeout, and a buffer size makes each caller learn the module. Often the module can calculate a good value itself, from what it observes. Give a parameter only when the caller knows something that the module cannot know.

### Better together or better apart

Two pieces of code belong together when:

- They share information.
- They are always used together.
- They overlap in concept.
- You cannot understand one without the other.

Split code apart when one part is general and the other is special to one use. Do not split one method into many small methods only to make each one short. A split that forces the reader to jump between pieces to understand one idea is a bad split.

## Define errors out of existence

Exceptions and error codes are a large part of each interface. Each error that a module can return is something that each caller must handle. Ousterhout argues that many errors can be removed by a change of the definition of the operation.

Some techniques:

- **Define the operation so that the error case is normal.** "Cancel this seat hold" can succeed when the hold has already expired. The caller wanted the hold to be gone, and it is gone. The same idea makes many operations idempotent, which is useful in distributed systems.
- **Mask the error at a low level.** A message client retries a short network fault inside. The caller sees a slower call, not an error.
- **Aggregate the errors.** Handle many kinds of error in one place, at a high level, instead of in each method. A job runner can catch each failure of a job in one place, and mark the job as failed.
- **Just crash.** For errors that are rare and that the program cannot really handle, such as memory exhaustion, stop with a clear message. Code that tries to recover is often wrong and never tested.

This rule has limits. Do not hide an error that the caller must know about. A failed payment must be an error. The goal is fewer error cases in the interface, not silent failures.

## Design it twice

Your first idea for an interface is rarely the best. Ousterhout recommends that you design each important module at least twice, with very different approaches, and compare them.

1. Sketch two or three interfaces that differ in a radical way. For a parcel module: one call that does everything, an object for each step, and an event-based design.
2. For each one, write how the main callers would use it.
3. Compare them for simplicity for callers, generality, and efficiency.
4. Choose one, or combine the best parts.

The cost is small: an hour of sketches before days of code. The same idea at the level of a system is to compare options with [trade-offs](/learn/trade-offs) before you choose a style.

## Comments and names

Ousterhout gives comments a design role. Code shows what it does. It cannot show why, what the caller can rely on, or what the units of a value are.

Rules:

- **Write comments that describe what the code does not make obvious.** A comment that repeats the code adds nothing. "Timeout in seconds, after which the hold is released" adds information.
- **Write interface comments separately from implementation comments.** An interface comment says what a caller needs. It does not describe how the module works inside.
- **Write the interface comment first.** If the comment is long and hard to write, the interface is probably too complex. This makes the comment a design tool.
- **Choose precise names.** A name such as `data`, `info`, or `handle` hides the meaning. If you cannot find a precise name, the thing probably does more than one job.
- **Use one name for one idea.** If `order` sometimes means a basket and sometimes a paid purchase, readers must guess. This is the [ubiquitous language](/learn/bounded-contexts#ubiquitous-language) of DDD at the size of a function.

### Red flags

These signs, in the spirit of the book, show where a design adds complexity.

| Red flag                 | What you see                                                        |
| ------------------------ | ------------------------------------------------------------------- |
| Shallow module           | The interface is nearly as complex as the implementation            |
| Information leakage      | One design decision appears in several modules                      |
| Temporal decomposition   | Modules follow the order of steps, not the knowledge they share     |
| Pass-through method      | A method only forwards to another with the same signature           |
| Repetition               | The same piece of code appears in several places                    |
| Conjoined methods        | You cannot understand one method without reading another            |
| Comment repeats the code | The comment gives no information that the name and code do not give |
| Vague or hard name       | No precise name fits, so the thing is not one clear idea            |

## A service is a module with a network between

Each rule on this page applies to services, and the cost of a bad module is higher there. A call between services can fail, takes time, and needs a version. A shallow service pays those costs and hides nothing.

The interface of a service is more than its API. It includes the events it publishes, the data formats, the failure behavior, the latency, and the order of calls that it needs. Each of these is something that other teams must learn.

Compare two designs for checkout in a parcel service:

```diagram
{
  "nodes": [
    { "id": "checkoutA", "label": "Checkout", "shape": "box", "col": 0, "row": 1 },
    { "id": "address", "label": "Address\nservice", "shape": "box", "col": 1, "row": 0 },
    { "id": "rates", "label": "Rate\nservice", "shape": "box", "col": 1, "row": 1 },
    { "id": "labels", "label": "Label\nservice", "shape": "box", "col": 1, "row": 2 },
    { "id": "checkoutB", "label": "Checkout", "shape": "box", "col": 2, "row": 1 },
    { "id": "shipping", "label": "Shipping\nservice", "shape": "box", "col": 3, "row": 1 },
    { "id": "carriers", "label": "Carriers", "shape": "external", "col": 3, "row": 2 }
  ],
  "groups": [
    { "id": "shallow", "label": "Shallow: checkout knows the steps", "col": 0, "row": 0, "cols": 2, "rows": 3 },
    { "id": "deep", "label": "Deep: one call", "col": 2, "row": 0, "cols": 2, "rows": 3 }
  ],
  "edges": [
    { "from": "checkoutA", "to": "address", "label": "1. check" },
    { "from": "checkoutA", "to": "rates", "label": "2. price" },
    { "from": "checkoutA", "to": "labels", "label": "3. label" },
    { "from": "checkoutB", "to": "shipping", "label": "ship(parcel)" },
    { "from": "shipping", "to": "carriers" }
  ]
}
```

In the shallow design, checkout knows the steps, their order, and the errors of three services. A new step, such as a customs form, changes checkout. In the deep design, checkout knows one operation. The shipping team can add steps, change carriers, and retry failures with no change in checkout.

The links to architecture:

- **Entity services are shallow.** A service for each table, with create, read, update, and delete, shows the data and hides no decision. The business logic moves to the callers, and each change touches several services. This is the [entity trap](/learn/boundaries#the-entity-trap).
- **A shared database is information leakage.** Two services that read one schema both know its format. See [Data ownership](/learn/data-ownership).
- **Chatty calls are a sign of a split in the wrong place.** If one user action needs ten calls between two services, the knowledge is in two places. See [Service granularity](/learn/service-granularity).
- **A port is a deep module.** In [hexagonal architecture](/learn/hexagonal), a good port speaks the language of the business and hides the technology behind it.
- **Define errors out of existence across the network.** Idempotent operations let callers retry safely. The caller then needs much less error-handling logic.

Leakage between services leads to a [distributed monolith](/learn/modularity#the-distributed-monolith): services that must be released together because they share knowledge.

## In a kata

Use the ideas on this page when you draw and check components.

1. For each box, write its interface in one line: the main operations or events. If the line is long, the box is probably shallow.
2. Ask what each box hides. "It hides the carrier choice" is a good answer. "It stores parcels" is a weak one.
3. Look for one user action that crosses many boxes in sequence. Move that workflow into one deep component.
4. Check the error paths. Can an operation be idempotent, so that the caller can retry without special logic?
5. Sketch a second, very different design before you commit. Say why you chose the first.

In [Tow Line](/kata/tow-line), a dispatch component can hide the rules for operator selection behind one "assign job" operation. In the [Tutor Marketplace](/kata/tutor-marketplace), the recommendation engine is a deep module: the rest of the system asks for tutors and does not know the model.

## Interview questions

**What makes a module deep, and why does it matter?**

- A simple interface over a lot of functionality.
- The interface is the cost to each caller. The implementation is the benefit.
- Deep modules reduce the knowledge that each caller needs, so changes stay local.
- The idea applies at each size: a class, a package, a service.

**What is information leakage? Give an example.**

- One design decision is visible in several modules, so a change of the decision changes all of them.
- It can be through an interface or through shared knowledge, such as a file format or a shared table.
- Temporal decomposition is a common cause.
- The fix: move the knowledge into one module that owns it.

**Is it always good to make functions and classes small?**

- No. Small units each add an interface. Many tiny units can add total complexity.
- A unit is good when it hides something, not because it is short.
- Split code when one part is general and another is special.
- Keep together code that shares information or that you must read together.

**How do these ideas apply to microservices?**

- A service is a module with a network between it and its callers.
- Its interface includes the API, events, formats, failure behavior, and latency.
- Entity services and pass-through gateways are shallow. They pay network costs and hide nothing.
- Shared databases and chatty calls are signs of leakage and wrong boundaries.

**What does "define errors out of existence" mean, and what is the risk?**

- Change the definition of an operation so that a common error is a normal result.
- Examples: idempotent cancel, retries masked inside a client, errors handled in one place.
- It removes error cases from the interface, which simplifies each caller.
- The risk: hiding an error that the caller must know. A failed payment must stay an error.

## Go deeper

- **A Philosophy of Software Design** (John Ousterhout), the whole book. It is short. The parts on deep modules, information hiding, and errors are the most useful for architects.
- **Fundamentals of Software Architecture** (Mark Richards, Neal Ford), the part on modularity: cohesion, coupling, and connascence give measures for the same goal. See [Modularity](/learn/modularity).
- **Building Microservices** (Sam Newman), the part on how to model services: it starts from information hiding, and it applies it to service boundaries.
- **Domain-Driven Design** (Eric Evans), the parts on the ubiquitous language and supple design: names and interfaces that state the intent.

## Further reading

- [John Ousterhout's home page](https://web.stanford.edu/~ouster/), with links to the book
- [Information hiding](https://en.wikipedia.org/wiki/Information_hiding) on Wikipedia
- [Is high quality software worth the cost?](https://martinfowler.com/articles/is-quality-worth-cost.html), by Martin Fowler
