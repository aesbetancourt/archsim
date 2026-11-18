## The purpose of a diagram

A diagram exists so that another person understands the system the way you do. If two readers get two different systems from your diagram, it failed, however good the design is.

A diagram is a view of the design, not the design. Each view answers one question for one reader. Before you draw, write down two things: who reads it, and what question it answers. A diagram with no reader in mind tries to show everything and explains nothing.

There is no single standard notation. UML, C4, and ArchiMate are common, and many good diagrams use plain boxes and lines. Richards and Ford make this point in Fundamentals of Software Architecture: the notation matters less than consistency and a key that explains it. Select one notation for a project, and use it the same way in each diagram.

## Start with low fidelity

Richards and Ford name a trap the Irrational Artifact Attachment. The more time a person puts into an artifact, the stronger the attachment to it. This attachment has no relation to the quality of the artifact.

The consequence is direct. A polished diagram that took four hours is hard to throw away, even when the design is wrong. A sketch that took four minutes is easy to change.

1. Start on a whiteboard, on paper, or with a rough sketch tool.
2. Change the sketch freely while the team discusses the design.
3. Make a clean version only when the design is stable.
4. Keep the clean version in the repository, next to the code and the [decision records](/learn/decision-records), so that it changes with them.

In an interview and in a kata, the same rule applies. Draw fast and rough first, then improve the parts that carry the argument.

## The C4 model

C4 is a simple, common way to draw software. Simon Brown made it. It has four levels of zoom, like a map.

| Level        | Shows                                                                  | Reader                                         |
| ------------ | ---------------------------------------------------------------------- | ---------------------------------------------- |
| 1. Context   | Your system as one box, with its users and the other systems around it | Everyone, including people outside engineering |
| 2. Container | The deployable parts in your system: applications, databases, queues   | Architects and developers                      |
| 3. Component | The main parts inside one container                                    | The team that builds it                        |
| 4. Code      | Classes and functions                                                  | Rarely drawn                                   |

The diagrams in the worked examples of this app are level 2. It is the level for a kata and for an interview. In a real project, draw level 1 first: it forces you to state who uses the system and what it depends on.

In C4, a **container** is a part that runs or stores data on its own: a web application, a mobile app, an API, a database, a queue. It is not a Docker container, although it often runs in one. A **component** is a group of code behind one interface inside a container, for example "Pricing" inside the order API.

C4 is independent of notation. It tells you which things to show at each level, not which shapes to use. Brown asks for a title, a key, and on each box the name, the kind, the technology, and a short job.

This is a level 2 diagram for an online lunch shop:

```diagram
{
  "nodes": [
    { "id": "customer", "label": "Customer", "shape": "person", "col": 0, "row": 0 },
    { "id": "cook", "label": "Cook", "shape": "person", "col": 0, "row": 2 },
    { "id": "app", "label": "Order app\n(mobile, React Native)", "shape": "actor", "col": 1, "row": 0 },
    { "id": "screen", "label": "Kitchen screen\n(tablet web app)", "shape": "device", "col": 1, "row": 2 },
    { "id": "api", "label": "Order API\n(takes orders)", "shape": "box", "col": 2, "row": 0 },
    { "id": "queue", "label": "Order events\n(queue)", "shape": "pipe", "col": 2, "row": 1 },
    { "id": "kitchen", "label": "Kitchen service\n(routes tickets)", "shape": "box", "col": 2, "row": 2 },
    { "id": "db", "label": "Orders\n(PostgreSQL)", "shape": "store", "col": 3, "row": 0 },
    { "id": "pay", "label": "Payment provider", "shape": "external", "col": 3, "row": 1 }
  ],
  "edges": [
    { "from": "customer", "to": "app", "label": "orders lunch" },
    { "from": "app", "to": "api", "label": "places order\n(HTTPS)" },
    { "from": "api", "to": "db", "label": "reads and writes" },
    { "from": "api", "to": "pay", "label": "charges card" },
    { "from": "api", "to": "queue", "label": "order placed", "async": true },
    { "from": "queue", "to": "kitchen", "label": "order placed", "async": true },
    { "from": "kitchen", "to": "screen", "label": "shows ticket" },
    { "from": "cook", "to": "screen", "label": "marks ready" }
  ]
}
```

Each box has a name and a job. Each arrow has a verb. The payment provider looks different because the shop does not own it. The dashed arrows show the messages that do not wait.

## The supporting C4 diagrams

The four levels show static structure. C4 adds three supporting diagrams for other questions.

| Diagram          | Shows                                                                    | Use it when                                                       |
| ---------------- | ------------------------------------------------------------------------ | ----------------------------------------------------------------- |
| System landscape | All the software systems of an organization and the people who use them  | You plan across many systems, for example in a large company      |
| Dynamic          | The parts that work together for one feature, with numbered steps        | The order of the steps matters more than the full structure       |
| Deployment       | Where each container runs: regions, clusters, machines, managed services | You discuss availability, cost, network limits, or data residency |

A **system landscape** diagram is a context diagram with no single system at the center. It answers "which system owns customer data?" for an organization with many teams.

A **dynamic** diagram shows one feature, such as "the cook marks an order as ready". It is close to a UML collaboration diagram. For a long flow, a sequence diagram is usually clearer.

A **deployment** diagram puts each container inside the nodes that run it. Draw one for each environment that differs, for example production with two regions and a test environment with one. The Waiting Room kata needs one, because the law requires the data to stay in the country.

## Rules for a readable diagram

- **Each box has a name and a job.** "Orders (takes and tracks orders)", not "Service A".
- **Each box shows its kind:** application, database, queue, external system. Use a consistent shape or a word.
- **Each arrow has a label with a verb:** "places order", "reads list".
- **Each arrow has a direction** from the part that starts the action.
- **Show waits against does not wait.** Solid for a call that waits, dashed for a message.
- **Show where data lives** and who owns it.
- **Mark what is not yours.** External systems look different.
- **Add a legend** if you use more than two line styles or colors.
- **One level of zoom in one diagram.** Do not mix a data center, a service, and a class.

Fundamentals of Software Architecture gives guidance for each element of a diagram. The sub-parts below use that list, in our own words.

### Titles

Give each diagram a title that names the system, the level, and the scope. "Lunch shop: containers, production" is clear. A title that states the point is better still: "Orders reach the kitchen through a queue".

### Lines

Lines carry most of the meaning. Use a solid line for a call that waits, and a dashed line for a message that does not wait. Put an arrowhead on each line. Use a line style for one meaning only, in all the diagrams of a project.

### Shapes

No shape set is standard, so consistency matters more than the choice. Use one shape for a service, one for a data store, one for a queue, and one for a person. Do not use a shape only for decoration.

### Labels

Label each item. An unlabeled box forces the reader to guess, and two readers guess differently. Put the technology on a box when it matters for the decision, for example "PostgreSQL" or "Kafka".

### Color

Use color to separate groups, for example "ours" and "external", or "changed in this release". Do not use color as the only signal. Some readers cannot see the difference, and many diagrams are printed in black and white. Add a shape, a line style, or a word as well.

### Keys

Add a key that explains each shape, line style, and color. A diagram without a key depends on the memory of the person who drew it.

Fundamentals also asks for **representational consistency**. Before you show a detailed view, show where that part sits in the larger picture. A reader who sees a component diagram first does not know which container it belongs to.

## Different diagrams for different questions

| Question                                    | Diagram                  |
| ------------------------------------------- | ------------------------ |
| Who uses the system, and what does it need? | Context diagram          |
| Which systems exist in the organization?    | System landscape diagram |
| What are the parts and how do they connect? | Container diagram        |
| What occurs, in what order, for one action? | Sequence diagram         |
| Where does it run?                          | Deployment diagram       |
| What states can an order have?              | State diagram            |
| Where does the data go, and who copies it?  | Data flow diagram        |

A sequence diagram is the best tool for a hard flow, such as "what occurs when the payment times out?". Use one in the deep-dive part of an [interview](/learn/interview-format).

A sequence diagram shows time from top to bottom, so it can show what a container diagram cannot: a timeout, a retry, a message that arrives twice, or two calls that run at the same time. Draw the failure path, not only the happy path. Most of the interesting decisions are on the failure path. See [Resilience](/learn/resilience).

A state diagram is useful for anything with a life cycle: an order, a payment, a ticket. It shows which changes are allowed. It often finds a missing state, such as "refund requested".

## A diagram that tells a story

Gregor Hohpe, in The Software Architect Elevator, writes about diagrams as a tool for communication with busy people. Three ideas from his book are useful here.

- **Emphasis over completeness.** A diagram that shows all 40 services shows no decision. Leave out what does not support the point. Say what you left out.
- **The lines matter more than the boxes.** A set of boxes is only a list. The decisions are in the connections: who calls whom, what waits, and what crosses a boundary.
- **Build a ramp for the reader.** Start from what the reader already knows, then add one new idea at a time. Do not start with the most detailed view.

A good architecture diagram makes a decision visible. Compare two pictures of the lunch shop: one with a direct call from the order API to the kitchen, and one with a queue between them. The difference between the two pictures is the decision. Show both when you explain it.

A useful test: cover the text around the diagram. Can a reader state the main point from the diagram alone? If not, change the title, remove detail, or split it into two diagrams.

## Present a design

A document is read in space: the reader moves through it at their own speed. A talk is given in time: the audience sees what you show, when you show it. Richards and Ford build their advice on presentations on this difference.

- **Use incremental builds.** Show a diagram one part at a time, in the order of the story. Start with the user and the main flow. Add the queue, then the failure path. The audience follows each step, and does not read ahead.
- **Avoid slides full of bullets.** Fundamentals calls a slide that only lists text a Bullet-Riddled Corpse. The speaker reads it, and the audience reads faster than the speaker.
- **Do not force one idea into one slide.** The book calls this the Cookie-Cutter antipattern. Some ideas need three slides, and some need half of one.
- **Use a blank slide** when you want the audience to look at you and listen, for example for a story or a question.

An **infodeck** is a set of slides made to be read, not presented. It has no speaker, so each slide must carry its full meaning. It is like a short document in slide format. Use an infodeck to send a design to people who were not at the meeting. Do not present an infodeck, and do not send presentation slides as an infodeck: the first has too much text for a talk, and the second has too little to read alone.

## Common failures

| Failure                                      | Fix                                                            |
| -------------------------------------------- | -------------------------------------------------------------- |
| Boxes named "Service A" or "Backend"         | Name each box and give it a job                                |
| Arrows with no label or no direction         | Add a verb and an arrowhead                                    |
| All arrows look the same                     | Separate calls that wait from messages                         |
| A class, a service, and a region in one view | Split by level of zoom                                         |
| A polished diagram nobody dares to change    | Sketch first. Polish only stable parts                         |
| A diagram from two years ago                 | Keep it next to the code, and change it with the code          |
| Every part of the system in one diagram      | Show the parts that support one point, and say what is missing |

## In a kata

The review reads your labels and your arrows. On the canvas, put text inside each shape and attach each arrow to two shapes, so the connection is real and not only visual. Arrange the main flow in one direction, left to right or top to bottom.

Draw a level 2 container diagram for the main design. Then add one sequence or state diagram for the hardest flow. In the [Lunch Rush kata](/kata/lunch-rush), that flow is an order when the shop connection is slow. In the [Payment System kata](/kata/payment-system), it is a payment that times out.

In an interview, build the diagram while you talk, like an incremental build. Draw the user and the main flow first. Add a part only when you explain why you need it.

## Interview questions

**"Walk me through your design."**

- Start at C4 level 1 in one sentence: the users and the other systems.
- Then show level 2: the containers and the main flow, left to right.
- Name what each arrow carries, and which arrows wait.
- Say what you left out, and offer to go deeper on one part.

**"Which diagrams would you give a new developer on the team?"**

- A context diagram for the scope and the dependencies.
- A container diagram for the parts and the technologies.
- A deployment diagram for where it runs.
- Sequence diagrams for the two or three flows that are hard or that fail often.
- Keep them in the repository, so that they change with the code.

**"How do you explain this design to the executives?"**

- Use a context diagram, or a simple before-and-after view.
- Lead with the result for the business: cost, risk, time.
- Show one point per diagram, with a title that states it.
- Keep the technical detail for questions.

**"What occurs when this call times out?"**

- Switch to a sequence diagram.
- Show the timeout, the retry, and the [idempotency key](/learn/distributed-transactions).
- Show what the user sees during the failure.

## Go deeper

- **Fundamentals of Software Architecture**, Mark Richards and Neal Ford, the part on diagramming and presenting. It adds the Irrational Artifact Attachment, the guidance for each element of a diagram, and the antipatterns of presentations.
- **The Software Architect Elevator**, Gregor Hohpe, the part on communication. It adds how to draw and write for busy readers, and how to make a diagram carry a decision.
- **System Design Interview**, Alex Xu, the part on the interview framework. It shows the high-level diagram first, then the deep dives.

## Further reading

- [The C4 model](https://c4model.com/), by Simon Brown
- [Sequence diagram](https://en.wikipedia.org/wiki/Sequence_diagram) on Wikipedia
- [UML as sketch](https://martinfowler.com/bliki/UmlAsSketch.html), by Martin Fowler
- [The Software Architect Elevator](https://architectelevator.com/), the site of Gregor Hohpe
