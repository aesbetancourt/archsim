## The purpose of a diagram

A diagram exists so that another person understands the system the way you do. If two readers get two different systems from your diagram, it failed, however good the design is.

## The C4 model

C4 is a simple, common way to draw software. It has four levels of zoom, like a map.

| Level | Shows | Reader |
|---|---|---|
| 1. Context | Your system as one box, with its users and the other systems around it | Everyone, including people outside engineering |
| 2. Container | The deployable parts in your system: applications, databases, queues | Architects and developers |
| 3. Component | The main parts inside one container | The team that builds it |
| 4. Code | Classes and functions | Rarely drawn |

The diagrams in the worked examples of this app are level 2. It is the level for a kata and for an interview. In a real project, draw level 1 first: it forces you to state who uses the system and what it depends on.

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

## Different diagrams for different questions

| Question | Diagram |
|---|---|
| What are the parts and how do they connect? | Container diagram |
| What occurs, in what order, for one action? | Sequence diagram |
| Where does it run? | Deployment diagram |
| What states can an order have? | State diagram |

A sequence diagram is the best tool for a hard flow, such as "what occurs when the payment times out?". Use one in the deep-dive part of an [interview](/learn/interview-format).

## In a kata

The review reads your labels and your arrows. On the canvas, put text inside each shape and attach each arrow to two shapes, so the connection is real and not only visual. Arrange the main flow in one direction, left to right or top to bottom.

## Further reading

- [The C4 model](https://c4model.com/), by Simon Brown
- [Sequence diagram](https://en.wikipedia.org/wiki/Sequence_diagram) on Wikipedia
