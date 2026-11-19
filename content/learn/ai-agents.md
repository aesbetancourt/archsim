## What an agent is

An **agent** is a program where a model chooses the next action in a loop. The model reads the goal and the history, and it asks for a tool call. Your code runs the tool and gives the result back. The model then chooses again, until it gives a final answer or a limit stops it.

A **tool** is a function that your code exposes to the model, with a name, a description, and a typed input. The model does not run the tool. It only asks for it. Your code decides whether the call is allowed, runs it, and returns the result.

This page uses three examples:

- **A support agent** for an online shop. It looks up orders, explains the return policy, and can start a refund.
- **A document agent** that processes supplier invoices. It extracts fields, matches the invoice to a purchase order, and sends exceptions to a person.
- **An email agent** that starts when an email arrives in a finance inbox. The [Agent Triggers kata](/kata/agent-triggers) covers how the email becomes one run.

Read [Building with language models](/learn/llm-systems) first. It covers structured output, rules in code, and prompt injection. This page builds on them.

## The agent loop

```diagram
{
  "nodes": [
    { "id": "input", "label": "Goal and history", "shape": "person", "col": 0, "row": 0.5 },
    { "id": "model", "label": "Model\n(choose next step)", "shape": "external", "col": 1, "row": 0.5 },
    { "id": "guard", "label": "Guard in code\n(allowed? valid?)", "shape": "module", "col": 2, "row": 0.5 },
    { "id": "tool", "label": "Tool\n(order lookup, refund)", "shape": "box", "col": 3, "row": 0.5 },
    { "id": "answer", "label": "Final answer", "shape": "module", "col": 1, "row": 1.6 }
  ],
  "edges": [
    { "from": "input", "to": "model", "label": "context" },
    { "from": "model", "to": "guard", "label": "tool call" },
    { "from": "guard", "to": "tool", "label": "runs" },
    { "from": "tool", "to": "model", "label": "result" },
    { "from": "model", "to": "answer", "label": "done" }
  ]
}
```

Each turn of the loop is one model call and zero or more tool calls. The code around the loop owns these limits:

- **A step limit.** For example, at most 10 tool calls for one support request. A loop with no limit can run for minutes and cost a lot.
- **A time limit.** The whole run has a deadline, not only each call.
- **A cost limit.** Count the tokens. Stop the run when it goes above its budget.
- **A stop rule.** When a limit stops the run, the agent hands off to a person. It does not fail silently.

The pattern where the model reasons about the next step, acts with a tool, and reads the result is often called ReAct, after a 2022 paper by Yao and others.

## Workflow or agent

Anthropic's article "Building effective agents" draws a clear line:

| Kind     | Who decides the steps       | Example                                                        |
| -------- | --------------------------- | -------------------------------------------------------------- |
| Workflow | Your code, in a fixed order | Extract invoice fields, then validate, then match to the order |
| Agent    | The model, at each step     | A support chat where the next question depends on the answer   |

A workflow can still call the model at each step. The difference is who controls the order. A workflow is easier to test, cheaper, and faster. An agent handles open-ended tasks, where you cannot list the steps in advance.

Use the simplest design that works. Start with one model call. Add a fixed workflow when one call is not enough. Use an agent only when the steps really depend on the input.

Common workflow patterns from the same article:

- **Prompt chaining.** One call feeds the next, with a check in code between them.
- **Routing.** A first call classifies the input, and code sends it to the right path.
- **Parallelization.** Several calls run at the same time on parts of the task, or vote on one answer.
- **Orchestrator and workers.** One call splits the task, and other calls do the parts.
- **Evaluator and optimizer.** One call writes, another call scores it, and the first call improves it.

The document agent is a workflow. The steps are always the same. The support agent is a workflow around a small agent: code routes the request, and an agent handles only the open questions.

## Tool design

The tools are the real interface of an agent. A bad tool gives a bad agent, whatever the prompt says.

| Property           | What it means                                             | Support agent example                                     |
| ------------------ | --------------------------------------------------------- | --------------------------------------------------------- |
| Narrow             | One clear job, not a general entry point                  | `get_order_status(order_id)`, not `run_sql(query)`        |
| Typed              | A schema for the input, with enums and limits             | `reason` is one of `damaged`, `late`, `wrong_item`        |
| Scoped to the user | The code adds the user and the permissions, not the model | The customer ID comes from the session                    |
| Idempotent         | A second identical call has no extra effect               | `start_refund` takes an idempotency key                   |
| Safe to repeat     | Read tools have no side effects, so a retry is harmless   | `get_order_status` only reads                             |
| Clear errors       | The error tells the model what to do next                 | "Order not found. Ask the customer for the order number." |
| Small results      | Return the fields the model needs, not the full record    | Status, date, and items, not 80 database columns          |

An **idempotency key** is a unique value sent with a request. If the same key arrives again, the system returns the first result and does not act twice. Models repeat tool calls, and networks retry them. Every tool that changes something needs this protection. See [Idempotency](/learn/distributed-transactions#idempotency).

Write the tool description for the model, like documentation for a new colleague. Say when to use the tool and when not to. Give an example input. Test the descriptions with evals, because a small change in a description can change which tool the model chooses.

Protocols such as the Model Context Protocol (MCP) let one tool server work with many agents. They standardize how tools are described and called. They do not make a tool safe. You still need the checks in your own code.

## State machines and deterministic guards

Interviewers call an agent "simplistic" when it is one prompt with all the tools, and the model decides everything. A stronger design puts the conversation in a **state machine**: a fixed set of states, and allowed moves between them. Code owns the state. The model works inside one state at a time.

```diagram
{
  "nodes": [
    { "id": "identify", "label": "Identify\ncustomer", "shape": "module", "col": 0, "row": 0 },
    { "id": "understand", "label": "Understand\nissue", "shape": "module", "col": 1, "row": 0 },
    { "id": "resolve", "label": "Resolve\n(tools)", "shape": "module", "col": 2, "row": 0 },
    { "id": "confirm", "label": "Confirm\nwith customer", "shape": "module", "col": 3, "row": 0 },
    { "id": "handoff", "label": "Hand off\nto a person", "shape": "person", "col": 1.5, "row": 1.4 },
    { "id": "closed", "label": "Closed", "shape": "module", "col": 3, "row": 1.4 }
  ],
  "edges": [
    { "from": "identify", "to": "understand", "label": "ID confirmed" },
    { "from": "understand", "to": "resolve", "label": "category set" },
    { "from": "resolve", "to": "confirm", "label": "action done" },
    { "from": "confirm", "to": "closed", "label": "customer agrees" },
    { "from": "understand", "to": "handoff", "label": "angry or legal" },
    { "from": "resolve", "to": "handoff", "label": "guard fails" }
  ]
}
```

Each state has:

- **A goal and a prompt.** In "Understand issue", the model only classifies the issue into a fixed set of categories.
- **The tools of that state.** `start_refund` exists only in "Resolve". In "Identify customer", the model cannot call it.
- **An exit condition in code.** The move from "Identify" to "Understand" needs a confirmed customer ID. The model cannot claim it.
- **Guards.** A **deterministic guard** is a check in code that gives the same answer for the same input, every time.

Examples of guards in the support agent:

- Refund only if the order belongs to the customer, the order is delivered, and the amount is at most 100 euros.
- Hand off at once if the customer mentions a lawyer, a chargeback, or a safety problem. A keyword list in code catches the clear cases. A classifier catches the rest.
- Hand off after three turns in one state with no progress.
- Hand off if the model output fails validation twice.

The state machine makes the agent testable. You can test each guard with unit tests. You can test each state with its own eval set. You can draw it on a whiteboard, and the interviewer sees where the control is.

## Memory and state

An agent has several kinds of memory. Keep them apart.

| Kind             | What it holds                                     | Where it lives                             |
| ---------------- | ------------------------------------------------- | ------------------------------------------ |
| Conversation     | The messages of this session                      | The context, cut or summarized when long   |
| Run state        | The current state, collected fields, tool results | A database row for each run, owned by code |
| Long-term memory | Facts about the user across sessions              | A store that the agent reads with a tool   |
| Knowledge        | Policies, manuals, product data                   | Documents for retrieval, or a service      |

Do not keep the run state only in the model's context. If the process restarts, the context is gone. Store the state after each step, so a run can continue. This is the same idea as a [saga](/learn/distributed-transactions#state-management): a long process with a stored state and clear steps.

When the conversation gets long, summarize the old turns, or keep only the facts in structured fields. Long-term memory needs rules: what you store, for how long, and how the user can delete it. It is personal data.

## What the user sees and what stays inside

The internal state of an agent is not a message for the customer. Labels such as "urgency: medium", "category: refund_eligible", or "sentiment: negative" help the code. A customer who reads "I have classified your issue as medium urgency" loses trust.

Keep two outputs apart:

1. **The internal decision.** A structured object with the category, the urgency, the next state, and the reason. Code reads it.
2. **The reply to the user.** Plain language, written for the user, with no internal labels.

Make this separation in the design:

- Ask for the decision and the reply in separate fields of the schema, or in separate calls.
- Write the reply prompt with the user's words: "Your refund has started. It arrives in 5 to 10 days."
- Add a check in code that blocks known internal labels in the reply.
- Use templates for messages with legal or financial content, and fill the numbers from code.

The same applies to errors. A tool error such as "HTTP 500 from orders-service" is for the logs. The user sees "I cannot see your order right now. I have passed your request to a colleague."

## People in the loop

A **human-in-the-loop** design puts a person at the points where the agent is not trusted to act alone. There are three main points.

### Approval for risky actions

The agent prepares the action, and a person approves it. Use approval when the action is costly, hard to undo, or sends something outside the company.

| Action                         | Risk                | Rule                                          |
| ------------------------------ | ------------------- | --------------------------------------------- |
| Look up an order               | Low                 | The agent acts alone                          |
| Refund up to 100 euros         | Medium, reversible  | The agent acts, within guards                 |
| Refund above 100 euros         | High                | A person approves                             |
| Pay a supplier invoice         | High, hard to undo  | A person approves, always                     |
| Send an email to a new address | High, data can leak | A person approves, or the tool does not exist |

The approval request must show the facts: the amount, the account, the source document, and the agent's reason. A person who sees only "approve?" approves everything.

### Handoff and escalation

A **handoff** moves the conversation to a person. A good handoff:

- Happens on clear triggers: a guard fails, the user asks for a person, the step limit is reached, or a sensitive topic appears.
- Passes a summary, the collected fields, and the history, so the user does not repeat everything.
- Tells the user what happens next and how long it takes.

Measure the **escalation rate**: the share of conversations that go to a person. A rate that is too high means the agent does not help. A rate that is too low can mean that the agent keeps cases that it must hand off. See [Evaluating AI systems](/learn/llm-evals).

### Review of samples

For the document agent, a person reviews a random sample of processed invoices each week. This finds errors that no guard catches, and it gives new test cases.

## Observability

An agent run is a chain of decisions. When the result is wrong, you must see each step. Log each run as a **trace**: one record for the run, with a span for each model call and each tool call. See [Logs, correlation IDs, and traces](/learn/observability#logs-correlation-ids-and-traces).

For each model call, record:

- The model, the prompt version, and the parameters.
- The input and output tokens, the latency, and the cost.
- The full input and output, with personal data masked as your policy requires.
- The stop reason: finished, tool call, length limit, or refused.

For each tool call, record the arguments, the result, the latency, and whether a guard blocked it.

For each run, record the final state, the number of steps, the total cost, and whether a person took over. The OpenTelemetry project has conventions for generative AI spans, so traces can go to standard tools.

Traces are also the source of eval data. A run with a thumbs-down, a handoff, or a guard block is a candidate for the test set.

## More than one agent

A **multi-agent** system uses several agents that pass work between them. It can help when:

- The parts are truly independent and can run in parallel, such as research on five topics at the same time.
- The parts need very different tools or instructions, and one prompt cannot hold them well.
- Each part has a separate owner or a separate permission boundary.

It costs more than it looks. Each agent adds model calls, tokens, and latency. Context is lost at each handoff between agents. Errors compound: if each of three agents is right 90% of the time, the chain is right only about 73% of the time.

Start with one agent and good tools. Split only when an eval shows that one agent cannot do the task. In an interview, say why one agent is not enough before you draw five.

## Common mistakes

- **One prompt with all the tools.** The model decides everything, and nothing in code controls the flow.
- **Rules only in the prompt.** The refund limit is a sentence in the prompt, not a guard in the tool.
- **The model chooses the user.** The customer ID is a tool argument that the model fills.
- **Internal labels in the reply.** The customer reads "medium urgency" or "intent: cancel".
- **Tools that are too general.** A tool that runs any query or any HTTP call gives the model, and an attacker, too much power.
- **No step limit.** The agent loops between two tools until the timeout.
- **Write tools with no idempotency.** A retry creates two refunds.
- **A handoff with no context.** The person asks the customer to explain everything again.
- **Multi-agent by default.** Five agents where one workflow is enough.

## In a kata

When a kata has an agent, draw the control, not only the model:

1. **Set the scope.** Say if it is a workflow or an agent, and why.
2. **Draw the states.** Show the state machine, the tools in each state, and the guards.
3. **Draw the people.** Show the approval points and the handoff queue.
4. **Name the tools.** For each tool, say if it reads or writes, and how a repeat is safe.
5. **State trade-offs.** More autonomy gives fewer handoffs and more risk. More approvals give safety and slower service.

In the [Agent Triggers kata](/kata/agent-triggers), the trigger must start exactly one run. Use an idempotency key from the email ID. Say which states the email agent has, and which actions need approval.

## In an interview

Show control first: "Code owns the state and the guards. The model works inside one state, with the tools of that state." Then draw the state machine and name two guards.

Separate the internal decision from the reply. Say it out loud, because interviewers check it: "The customer never sees the urgency label. It goes into a structured field for routing."

Name the handoff triggers, and the metric that tells you the agent works: task success rate and escalation rate. Then link to evals: "Each state has its own eval set, and each production failure becomes a new case."

## Interview questions

**"Design a customer support agent that can issue refunds."**

- Start with the states: identify, understand, resolve, confirm, hand off.
- Tools are narrow, typed, scoped to the session user, and idempotent for writes.
- Guards in code: ownership, order status, amount limit. Approval above the limit.
- The reply is separate from the internal decision. No internal labels reach the customer.
- Clear handoff triggers, with a summary for the person.

**"When do you use a workflow, and when an agent?"**

- A workflow has fixed steps in code. An agent lets the model choose the steps.
- Workflows are cheaper, faster, and easier to test.
- Use an agent only when the steps depend on the input and you cannot list them.
- Often the best design is a workflow with a small agent inside one step.

**"How do you design tools for an agent?"**

- One clear job for each tool, with a typed input and enums.
- The code adds the user and the permissions. The model never chooses them.
- Write tools take an idempotency key. Read tools have no side effects.
- Errors tell the model what to do next. Results are small.

**"How do you stop an agent from doing something dangerous?"**

- Deterministic guards in the tools, not rules in the prompt.
- Only the tools of the current state are available.
- Approval by a person for costly or irreversible actions.
- Step, time, and cost limits, with a handoff when a limit is reached.

**"How do you debug an agent that gave a wrong answer in production?"**

- Open the trace of the run: each model call, each tool call, each guard result.
- Find the first wrong step: bad retrieval, wrong tool choice, or wrong reading of a result.
- Add the case to the eval set, fix it, and run the evals before the deploy.

**"When is a multi-agent design justified?"**

- When parts are independent and can run in parallel, or need very different tools or permissions.
- Each agent adds cost, latency, and lost context. Errors compound along the chain.
- Start with one agent. Split only when an eval shows a need.

## Go deeper

- **Building effective agents**, Anthropic, the whole article. It adds the workflow patterns and the advice to start simple.
- **AI Engineering**, Chip Huyen, the chapter on agents. It adds planning, tool selection, and failure modes of agents.
- **12-Factor Agents**, Dex Horthy and contributors, the factors on owning the control flow and the state. It adds a practical case for code-owned state.
- **Release It!**, Michael Nygard, the parts on timeouts and circuit breakers. Tools are remote calls, and the same patterns apply.

## Further reading

- [Building effective agents](https://www.anthropic.com/engineering/building-effective-agents), by Anthropic
- [ReAct: Synergizing Reasoning and Acting in Language Models](https://arxiv.org/abs/2210.03629), by Shunyu Yao and others
- [12-Factor Agents](https://github.com/humanlayer/12-factor-agents), by Dex Horthy
- [Model Context Protocol](https://modelcontextprotocol.io/), the specification and documentation
- [Semantic conventions for generative AI](https://opentelemetry.io/docs/specs/semconv/gen-ai/), from OpenTelemetry
- "Don't Build Multi-Agents", by Walden Yan, on the Cognition blog
