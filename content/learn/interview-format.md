## What the interviewer looks for

A system design interview is not a test of one correct design. The interviewer wants to see how you handle an open problem: if you find the hard part, if you make decisions with reasons, and if you see the weak points of your own design.

A candidate who draws a correct diagram in silence usually does worse than a candidate who thinks aloud, makes one mistake, and corrects it.

The question is vague on purpose. "Design a ticket seller" has no single answer, and the interviewer knows it. The vagueness is a test of how you work with uncertainty. A real project starts the same way: a business person with a goal, and many questions nobody has asked yet.

Most interviewers judge a few signals, though each company names them differently:

| Signal              | What it looks like in the room                                       |
| ------------------- | -------------------------------------------------------------------- |
| Problem framing     | You ask questions that change the design, and you set a clear scope. |
| Design ability      | You produce a design that works end to end, with clear parts.        |
| Depth               | You go deep on the hard part and know the real mechanisms.           |
| Trade-off reasoning | You name options, select one, and say what it costs.                 |
| Communication       | You think aloud, take hints, and keep the interviewer with you.      |
| Operational sense   | You know how the system fails and how you would see it fail.         |

Alex Xu (System Design Interview) compares the session to a work meeting with a colleague. The interviewer plays a teammate who knows the problem. You lead, but you design together. A candidate who ignores the teammate fails, even with a good design.

## The four-step framework

Xu gives a framework of four steps for a session of about 45 minutes. The time ranges are rough, and the interviewer can change them.

| Step                                          | Rough time   | Goal                                                        |
| --------------------------------------------- | ------------ | ----------------------------------------------------------- |
| 1. Understand the problem and set the scope   | 3 to 10 min  | Agree on the functions, the scale, and what is out of scope |
| 2. Propose a high-level design and get buy-in | 10 to 15 min | A design that the interviewer agrees is a good start        |
| 3. Deep dive                                  | 10 to 25 min | Detail on the parts that make this problem hard             |
| 4. Wrap up                                    | 3 to 5 min   | Bottlenecks, failures, and what you would do next           |

Two words in the framework matter most. **Buy-in** in step 2 means that you stop and ask the interviewer if the design is a good base before you go deep. **Deep** in step 3 means that you spend most of your time on one or two parts, not a little on everything.

The plan below is the same framework with the estimate as its own step, and with the wrap-up focused on weak points.

## A plan for 45 minutes

| Minutes  | Step                             | Result                                                       |
| -------- | -------------------------------- | ------------------------------------------------------------ |
| 0 to 8   | Ask questions and set the scope  | A short list of functions, numbers, and what is out of scope |
| 8 to 12  | Estimate                         | Requests each second, data size, the one number that is hard |
| 12 to 25 | Draw the main design             | Boxes for the core flow, with data stores and arrow labels   |
| 25 to 40 | Go deep on one or two hard parts | The details of the part that makes this problem difficult    |
| 40 to 45 | Weak points and operation        | What fails first, how you would know, what you would do next |

Watch the clock. The most common time failure is a design that is still at step 3 when the interviewer says "five minutes left". Look at the time at each step change. If you are late, say so and move on: "I am short on time. I will leave the admin functions and go to the hard part."

Some interviews are 60 minutes. Keep the same shares, and use the extra time in the deep dive. Some interviewers drive the session with their own questions. Follow them. The plan is a default, not a script.

## Step 1: questions

Do not start to draw immediately. Ask what you need for the design, and state an assumption when the interviewer has no answer.

- Who uses it, and what are the two or three main actions?
- How many users, and how many actions each day?
- What must never go wrong? (lost money, double booking, lost message)
- What can be slow or a little old?
- What exists already, and what can we buy?

This is step 1 and step 2 of the [kata method](/learn/method): find what is hard, and select the [characteristics](/learn/characteristics).

Good questions change the design. Before you ask a question, know what you will do with each answer. "Is it read-heavy or write-heavy?" decides the cache and the storage. "Do users need to see their own post at once?" decides the consistency. "What is the favorite color of the users?" decides nothing.

Write the result where the interviewer can see it:

- **In scope:** two to four functions.
- **Out of scope:** what you will not design, said aloud.
- **Numbers:** users, actions each day, data size.
- **Characteristics:** two or three, for example "availability over consistency for the feed".

An explicit out-of-scope list protects you. It shows that you saw the topic and made a choice. A silent omission looks like you missed it.

## Step 2: numbers

Convert the user numbers to requests each second and to data size. The purpose is to find which part needs a special design. See [Capacity estimation](/learn/estimation).

Keep it short and rough. Round the numbers, say them aloud, and connect each result to a decision. "About 1,000 writes each second fits one database server. About 100 TB of video does not fit one disk, so storage is a separate concern." A number with no consequence is not worth the time.

Skip this step if the interviewer says the numbers do not matter, or if the scale is small. Some interviewers prefer that you estimate inside step 3, when a number is needed.

## Step 3: the main design

Follow one request from the user to the data and back. Put a name on each box and a label on each arrow: does the caller wait or not? Say which data each store holds. See [Diagrams and the C4 model](/learn/diagrams).

A complete first design usually has these parts:

1. **The API.** Two to four calls, with their main inputs and outputs. See [API design](/learn/api-design).
2. **The main components.** Clients, a load balancer or gateway, the services, the stores, and any queue.
3. **The data model.** The main entities, their keys, and the store for each. See [Data stores](/learn/data-stores).
4. **The core flows.** Walk the two most important actions through the diagram.

Start simple. A first design with one service and one database is fine if it works for the numbers. Then say where it breaks, and add parts for a reason. Each box you add without a reason is a box you must defend.

At the end of this step, stop and ask for buy-in: "This is the main design. Before I go deeper, does this look like a good base? Is there a part you want me to focus on?" The answer tells you where to spend the next fifteen minutes.

## Step 4: go deep

Select the hardest part yourself and say why it is the hardest: "The seat must never be sold twice, and this is the busiest path. I want to go deeper here." This is the moment that separates a senior answer from a junior one.

Typical hard parts and the topics they lead to:

| Problem shape                             | Likely deep dive                                                                      |
| ----------------------------------------- | ------------------------------------------------------------------------------------- |
| One item, many buyers (tickets, stock)    | [Consistency](/learn/consistency) and [transactions](/learn/distributed-transactions) |
| Many readers, few writers (feed, catalog) | [Caching](/learn/caching) and fan-out                                                 |
| Very large data (video, files, logs)      | [Scaling data](/learn/scaling-data) and object storage                                |
| Real-time delivery (chat, notifications)  | Connections, [messaging](/learn/messaging), and delivery guarantees                   |
| Money (payments, wallets)                 | Idempotency, reconciliation, and an audit trail                                       |

In the deep dive, show options before you select one. "For the seat lock, I see three options: a database row lock, a reservation with a timeout, or a single queue for each event. I select the reservation with a timeout because…" That one sentence shows breadth, a decision, and a reason.

## Step 5: weak points

Finish with honesty: "This design fails first at X. I accepted that because of Y. With more time I would look at Z." Include how you would [operate it](/learn/observability).

Xu lists the usual topics for the wrap-up. Pick two or three that fit the time:

- The bottleneck: which part reaches its limit first as the load grows.
- Failures: what happens when a server, a store, or a region is lost.
- Operations: the metrics, logs, and alerts you would add.
- The next scale: what changes at ten times the load.
- A short recap of the design and its main trade-off.

Do not think that you are done when the diagram is complete. The wrap-up is often where a strong candidate separates from a good one.

## How a senior answer sounds

Richards and Ford (Fundamentals of Software Architecture) state the first law of software architecture: everything is a trade-off. A senior candidate shows this law in every decision. A junior candidate states choices as facts.

| Topic    | Junior answer                 | Senior answer                                                                                       |
| -------- | ----------------------------- | --------------------------------------------------------------------------------------------------- |
| Database | "We use Cassandra."           | "Writes are heavy and reads are by key, so a wide-column store fits. We lose joins."                |
| Cache    | "We add Redis for speed."     | "Most reads hit a few items, so a cache helps. Data can be up to a minute old."                     |
| Queue    | "We put Kafka in the middle." | "The sender must not wait for the slow step, so I add a queue. Delivery becomes at least once."     |
| Scale    | "It scales horizontally."     | "The service is stateless, so it scales out. The database is the limit, at about this many writes." |

The pattern of a senior answer:

1. Name the need from the requirements.
2. Name the option that meets it.
3. Name the cost you accept.
4. Optionally, name the condition that would change the choice.

"It depends" is a correct start, but never a full answer. Always say on what it depends, and then decide for this case. See [How to analyze a trade-off](/learn/trade-offs).

A senior candidate also knows the limits of their knowledge. "I have not operated this store at that scale. I would test it before I commit." This sentence earns trust. A confident wrong answer loses it.

## Habits that work

Xu lists habits that help in the room. In short:

- **Ask for clarification** before you design. Never assume silently.
- **Think aloud.** The interviewer can judge only what you say.
- **Suggest more than one approach** for a hard decision, then select.
- **Get agreement on the main design** before you go deep.
- **Go to the critical parts first** in the deep dive.
- **Use the interviewer.** Ask for a hint when you are stuck. Treat a question as a hint.
- **Do not give up.** A partial design with good reasoning scores better than silence.

Practice aloud, with a timer, and with a person if you can. Reading designs is useful, but the interview tests the ability to produce one under time pressure.

## Common mistakes

- You design for a scale that the problem did not ask for.
- You name products ("we use Kafka") and do not say what job the part does.
- You draw only boxes, with no data and no labels on the arrows.
- You defend the design when the interviewer shows a problem. A hint is a gift. Use it.
- You start to draw before you ask a single question.
- You go deep on the first component you draw, and run out of time for the rest.
- You think in silence for minutes. The interviewer cannot help or give credit.
- You stop when the diagram is done, and skip the weak points.
- You prepare a memorized answer, and do not notice that the question is different.

## In a kata

The interview katas train this format: [Link Shortener](/kata/link-shortener), [Chat Messaging](/kata/chat-messaging), [News Feed](/kata/news-feed), [Video Streaming](/kata/video-streaming), [Notification Service](/kata/notification-service), and [Payment System](/kata/payment-system).

To practice, set a timer for 45 minutes and follow the plan. Say each step aloud, even when you are alone. At the end, compare your time at each step with the plan. Then read the system design case for the same problem, for example the [URL shortener](/learn/url-shortener), and note which deep dive you missed.

## Interview questions

These are the follow-up questions that appear in most system design sessions.

**How would your design handle ten times the load?**

- Find the first part that reaches its limit, with a rough number.
- Say how you scale it: more copies, partitions, a cache, or async work.
- Name the new cost: consistency, operations, or money.

**What happens when this component fails?**

- Say what the user sees.
- Name the protection: redundancy, a timeout, a retry, a fallback. See [Resilience](/learn/resilience).
- Say how you detect it: the metric or alert.

**Why did you select this database?**

- Start from the access pattern and the consistency need, not the product.
- Name the main alternative and why it fits less well.
- Name the cost of your choice.

**What would you change with more time?**

- Name the weakest part of your design honestly.
- Give one concrete improvement and its trade-off.
- Mention operations: monitoring, deployment, data migration.

**How do you make sure a message, a payment, or a booking is not lost or doubled?**

- Separate "at least once" delivery from "exactly once" effect.
- Use an idempotency key, so a repeated request has no second effect.
- Keep a durable record before you confirm to the user.

## Go deeper

- System Design Interview, Alex Xu, the part on the framework for system design interviews: the four steps, how to share the time, and the dos and don'ts. The case chapters give practice problems.
- Fundamentals of Software Architecture, Mark Richards and Neal Ford, the parts on architectural thinking and trade-offs: how to show reasoning, not only an answer.
- Designing Data-Intensive Applications, Martin Kleppmann, the parts on replication, partitioning, and consistency: the mechanisms behind most deep dives.

## Further reading

- [The system design primer](https://github.com/donnemartin/system-design-primer), a free collection of topics and practice problems
- [Back-of-the-envelope calculation](https://en.wikipedia.org/wiki/Back-of-the-envelope_calculation) on Wikipedia
