## Why normal tests are not enough

A normal test compares the output to one expected value. A model gives a different text each time, and many different texts are correct. So exact-match tests fail on good answers, and they pass bad answers that happen to match.

String distance does not fix this. **Levenshtein distance** counts the character edits that change one string into another. Look at three replies of a support agent:

| Reply                                      | Distance to "Your refund of 64 euros has started." | Meaning               |
| ------------------------------------------ | -------------------------------------------------- | --------------------- |
| "I have started the refund of 64 euros."   | Large                                              | Correct               |
| "Your refund of 64 euros has not started." | Small: 4 edits                                     | Opposite, and wrong   |
| "Your refund of 46 euros has started."     | Small: 2 edits                                     | Wrong amount, harmful |

String distance measures the form of the text, not its meaning or its effect. Similarity of embeddings is better at meaning, but it also misses a "not" or a wrong number.

An **eval** (evaluation) is a repeatable test of an AI system on a set of cases, with a way to grade each output. The grade asks the questions that matter: is the answer correct, did the agent follow the policy, did it use the right tool, did it hand off when it had to?

Evals are the main tool of AI engineering. Without them, each change to a prompt or a model is a guess. With them, you can say "the new prompt passes 91% of cases, and the old one passed 84%".

This page uses the same examples as [Building with language models](/learn/llm-systems) and [Agents and tools](/learn/ai-agents): a support agent, a document agent for invoices, and an email agent for a finance inbox.

## The eval loop

```diagram
{
  "nodes": [
    { "id": "prod", "label": "Production\ntraces", "shape": "box", "col": 0, "row": 0.5 },
    { "id": "review", "label": "Error analysis\n(people read traces)", "shape": "person", "col": 1, "row": 0 },
    { "id": "set", "label": "Golden set\n(cases + labels)", "shape": "store", "col": 2, "row": 0 },
    { "id": "graders", "label": "Graders\n(code, judge)", "shape": "module", "col": 3, "row": 0.5 },
    { "id": "ci", "label": "CI eval run\n(each change)", "shape": "pipe", "col": 2, "row": 1.2 },
    { "id": "deploy", "label": "Deploy\n(canary)", "shape": "box", "col": 1, "row": 1.2 }
  ],
  "edges": [
    { "from": "prod", "to": "review", "label": "sample" },
    { "from": "review", "to": "set", "label": "new cases" },
    { "from": "set", "to": "graders", "label": "run" },
    { "from": "graders", "to": "ci", "label": "scores" },
    { "from": "ci", "to": "deploy", "label": "passes" },
    { "from": "deploy", "to": "prod", "label": "online metrics" }
  ]
}
```

The loop never stops. Production shows new failures. People read them and add cases. Each change runs against all cases before it ships.

## Start with error analysis

Do not start with a list of generic metrics, such as "helpfulness" or "toxicity". Start by reading real outputs. Hamel Husain and others call this **error analysis**:

1. Collect 50 to 100 real traces, or realistic ones if you have no users yet.
2. Read each trace. Write a short note on the first thing that went wrong.
3. Group the notes into failure types. For the support agent: "wrong policy", "did not hand off", "internal label in reply", "asked for the order number twice".
4. Count each type. Fix the most common ones first.
5. Write an eval for each failure type that matters.

The failure types are specific to your product. A generic "helpfulness" score does not tell you what to fix. "The agent refunds orders that are not delivered" does.

One person with knowledge of the domain must own the labels. For the support agent, it is a senior support lead, not the engineer. The engineer knows the code. The support lead knows what a good answer is.

## The golden set

A **golden set** is a fixed set of test cases with known good outcomes. Each case has an input, the context, and what a correct output must do.

| Field       | Support agent example                                   |
| ----------- | ------------------------------------------------------- |
| Input       | "My parcel arrived broken, I want my money back."       |
| Context     | Order 4417, delivered, 64 euros, identity confirmed     |
| Must do     | Call `start_refund` with reason `damaged` and amount 64 |
| Must not do | Ask for the order number. Mention internal labels       |
| Tags        | `refund`, `damaged`, `happy-path`                       |

Build it from real cases:

- **Common cases**, so you measure the normal experience.
- **Hard cases** from error analysis, such as an angry customer or a partial refund.
- **Edge cases and attacks**, such as an email with a prompt injection, or an invoice with two totals.
- **Cases that must escalate**, such as a legal threat. An agent that never hands off can score well on the other cases.

Size: start with 50 to 100 cases. That is enough to find large problems. Small differences need more cases. With 100 cases and a pass rate near 80%, the 95% interval is about plus or minus 8 points. A change from 80% to 83% on 100 cases can be noise.

Keep the set in version control. Tag each case, so you can see results by type. Remove personal data, or use synthetic data in the shape of real data.

## Code-based checks first

Many things are checkable with plain code. Code checks are fast, free, and deterministic. Use them before you use a model as a grader.

| Check                       | Example                                                     |
| --------------------------- | ----------------------------------------------------------- |
| Schema valid                | The email agent's output parses and matches the schema      |
| Correct label               | `category` equals the labeled category                      |
| Correct fields              | The invoice total equals the labeled total, to the cent     |
| Right tool, right arguments | `start_refund` was called once, with amount 64              |
| Forbidden content           | No internal label such as "urgency" in the reply            |
| Handoff                     | The run ended in the "handoff" state for a legal threat     |
| Limits                      | Fewer than 8 steps, less than 15 seconds, cost under budget |

For classification and extraction, use the normal metrics: accuracy, and **precision** and **recall** for each class. Precision is the share of predicted items that are correct. Recall is the share of real items that the system found. For the email agent, recall on "invoice" matters most, because a missed invoice is a late payment.

For agents, grade the outcome and the path. The outcome is the final state, for example "refund created for 64 euros". The path is the sequence of tool calls. Grade the outcome first. Grade the path only where it matters, such as "never called `start_refund` before the identity check passed". Two different paths can both be correct.

These checks are the same idea as unit tests in the [test pyramid](/learn/testing-strategy#the-test-pyramid): many cheap checks, and few expensive ones.

## LLM as a judge

Some qualities need judgment: is the reply polite, does it answer the question, is the summary faithful to the document? For these, use **LLM-as-judge**: a model grades the output of another model call, with a written rubric.

A **rubric** is a list of criteria with a clear test for each. A good judge prompt:

- Grades one criterion at a time. "Does the reply state the refund amount correctly? Pass or fail."
- Uses a binary pass or fail, not a scale of 1 to 10. A binary grade is easier to define and to check. The difference between a 6 and a 7 has no clear meaning.
- Asks for a short reason before the verdict. The reason helps people check the judge.
- Gets the context that it needs: the input, the policy, the reference answer if one exists.
- Has examples of pass and fail from the labeled data.

Example rubric for the support agent:

1. **Correct facts.** All amounts, dates, and order numbers in the reply match the context.
2. **Policy.** The reply does not promise anything that the policy does not allow.
3. **No internal language.** The reply contains no internal labels, codes, or tool names.
4. **Next step.** The reply tells the customer what happens next.

### The biases of a judge

A model judge has known biases. Research by Zheng and others in 2023 described three of them:

| Bias            | What happens                                                  | Counter-measure                                                             |
| --------------- | ------------------------------------------------------------- | --------------------------------------------------------------------------- |
| Position        | In a comparison, the judge prefers the first or second answer | Run both orders, and count only consistent results                          |
| Length          | The judge prefers the longer answer                           | State in the rubric that length is not a criterion. Check results by length |
| Self-preference | The judge prefers outputs from its own model family           | Use a judge from another model family, or calibrate                         |

A judge can also be wrong on facts, like any model. It is not a source of truth. It is a measuring tool that you must calibrate.

### Calibrate the judge against people

Before you trust a judge, measure it against human labels:

1. Take 100 to 200 outputs. A domain expert labels each one as pass or fail.
2. Split them. Use one part to improve the judge prompt, and keep the other part for the final check.
3. Run the judge on the held-out part. Compare its verdicts to the human labels.
4. Report two numbers: the share of human passes that the judge passes, and the share of human fails that the judge fails.
5. Improve the prompt until both numbers are high enough for your use, for example above 90%.

Report both numbers, not only the accuracy. If 95% of outputs pass, a judge that always says "pass" has 95% accuracy and finds no failures. **Cohen's kappa** is a common single number for agreement that corrects for chance.

Calibrate again when you change the judge model or the rubric. People also change their criteria as they see more outputs. Shreya Shankar and others call this **criteria drift**. Review the human labels from time to time.

## Pairwise comparison

A **pairwise comparison** shows the judge two outputs for the same input, and asks which one is better. People and models are better at comparing than at giving an absolute score.

Use it to choose between two prompts or two models:

1. Run both versions on the golden set.
2. For each case, ask the judge "which reply follows the rubric better: A, B, or a tie?"
3. Run each case again with A and B swapped. Count a win only when both orders agree.
4. Report the win rate, the loss rate, and the ties.

Pairwise results tell you which version is better. They do not tell you if either version is good enough. Use absolute checks for the release gate, and pairwise for the choice.

## Simulated users

A conversational agent cannot be tested with one input and one output. The next message of the user depends on the reply. To test full conversations, use **simulated users**: a second model plays the user, with a persona and a goal.

A scenario has:

- **A persona.** "An impatient customer who writes short messages and does not give the order number at first."
- **A goal.** "Get a refund for a damaged parcel."
- **Hidden facts.** The order number, which the persona gives only when asked.
- **A success test.** The run ends with a refund of the right amount, or with a correct handoff.

Run each scenario several times, because each run is different. Report the share of runs that succeed. For reliability, also report how often all of k runs succeed. The τ-bench benchmark calls this pass^k. If the runs are independent, an agent that succeeds in 80% of single runs succeeds in all five runs only about 33% of the time.

Include hard personas: a confused user, a user who changes the request, a user who tries a prompt injection, and a user who asks for a person. A simulated user is not a real user. Check from time to time that the simulated conversations look like real ones.

## Evals in CI

Run the evals on every change that can change the behavior:

- A change to a prompt, a tool description, or a schema.
- A new model or a new model version.
- A change to retrieval: chunking, the embedding model, the number of results.
- A change to the guards or the state machine.

Use two levels, like the [test pyramid](/learn/testing-strategy#the-test-pyramid):

| Level     | When it runs        | What it contains                                      |
| --------- | ------------------- | ----------------------------------------------------- |
| Fast eval | Each pull request   | Code checks on 50 to 100 key cases. Minutes, low cost |
| Full eval | Before each release | All cases, the judges, and simulated conversations    |

Set a release gate: no case tagged "must escalate" or "attack" can fail, and the total pass rate must not fall more than a set margin. Keep the results of each run, so you can compare versions.

Store the model outputs of each run. When a judge or a check changes, you can grade the old outputs again without new model calls.

## Offline and online metrics

**Offline** evals run on a fixed set before a release. **Online** metrics come from real use after it. You need both. The golden set never covers everything real users do.

| Metric                  | What it shows                                         | Example target (assumption)     |
| ----------------------- | ----------------------------------------------------- | ------------------------------- |
| Task success rate       | The share of runs that reach the goal                 | 85% of refund requests resolved |
| Escalation rate         | The share of runs handed to a person                  | 10% to 20%                      |
| Thumbs up and down      | Direct user feedback, rare and biased to strong views | Track the trend, not the level  |
| Draft acceptance        | The share of drafts sent with no change               | 60% of email drafts             |
| Cost per task           | Total model and tool cost for one resolved task       | Below a budget per task         |
| Latency p95             | The time that 95% of replies are faster than          | Under 6 seconds per reply       |
| Guard and fallback rate | How often a guard blocks or a fallback runs           | Alert on a sudden change        |

The targets are examples, not facts. Set your own from the business case. For the latency and cost numbers, see [Cost and latency of AI systems](/learn/llm-cost-latency).

Edit distance has a good use here. For the email agent, the edit distance between the draft and the email that the person sends shows how much work the draft saved. It is an online signal about real use, not a test of correctness.

Watch implicit signals too: the user rephrases the same question, the user types "agent" or "human", or the user leaves in the middle. These are more frequent than thumbs.

For changes with risk, release to a small share of traffic first, and compare the online metrics. A **shadow** run sends real inputs to the new version but does not show its output. You can grade the outputs offline. See [Testing in production](/learn/testing-strategy#testing-in-production).

## Every failure becomes a test case

Each production failure is a free test case. Make the path from failure to case short:

1. A trace gets a thumbs-down, a handoff, a guard block, or a complaint.
2. Someone reviews it and writes what went wrong.
3. The case goes into the golden set, with the correct outcome and a tag.
4. The fix runs against the full set, so it does not break other cases.

Over time, the golden set becomes a record of everything that went wrong. This is the same idea as a regression test for a bug, and as the action items of a [blameless postmortem](/learn/incident-response#blameless-postmortems).

For a voice agent, the same loop applies, with audio and timing added. See [Voice agents](/learn/voice-agents).

## Common mistakes

- **Exact match or string distance as the grade.** It fails good answers and passes harmful ones.
- **Generic metrics first.** A "helpfulness" score from a library, with no error analysis behind it.
- **A judge with no calibration.** Nobody checked that the judge agrees with an expert.
- **Scores from 1 to 10.** The difference between a 6 and a 7 means nothing, and the judge is not consistent.
- **Only happy paths.** The set has no attacks, no hard personas, and no cases that must escalate.
- **Evals only at launch.** A prompt change ships a month later with no eval run.
- **Too few cases for the claim.** "The new prompt is 2% better" on 50 cases.
- **The engineer owns the labels.** The person who knows what a good answer is does not label.
- **Production failures stay in the logs.** The same failure comes back after the next change.

## In a kata

When a kata has a model or an agent, add a short evaluation part next to the testing strategy:

1. **Name the failure that matters most.** For the email agent, it is a missed invoice or a reply to the wrong person.
2. **Name the checks in code.** Schema, labels, tool calls, and forbidden content.
3. **Name the judge criteria.** One or two, with a binary grade, and say how you calibrate them.
4. **Name the online metrics.** Task success, escalation rate, cost per task, and p95 latency.
5. **Show the loop.** Traces, review, new cases, CI run, canary.

In the [Agent Triggers kata](/kata/agent-triggers), the operation question asks how you know that it works. Answer with offline evals for the classification of emails, and online metrics for runs started, runs that succeeded, and runs handed off.

## In an interview

When an interviewer asks how you evaluate an agent, do not start with a metric. Start with the process: "I read real traces, group the failures, and build a golden set from them. I grade with code checks first, then with a model judge for the qualities that need judgment. I calibrate the judge against expert labels."

Then add the system parts: evals in CI on each prompt and model change, simulated users for conversations, online metrics after the release, and each failure back into the set.

Name the biases of a judge and one counter-measure for each. This is a common follow-up question.

## Interview questions

**"How would you evaluate a support agent before launch?"**

- Do error analysis on real or realistic conversations, and group the failures.
- Build a golden set with common cases, hard cases, attacks, and cases that must escalate.
- Grade with code checks first: tool calls, amounts, final state, forbidden labels.
- Use a model judge with a binary rubric for tone and policy, calibrated against expert labels.
- Test full conversations with simulated users, several runs for each scenario.

**"Why not compare the output to the expected answer with a string distance?"**

- Many different texts are correct, so good answers get a bad score.
- A small edit, such as "not" or a wrong number, changes the meaning and gets a good score.
- Grade the meaning and the effect: facts, policy, tool calls, final state.

**"How do you know that your LLM judge is reliable?"**

- Label 100 to 200 outputs with a domain expert, and keep part of them held out.
- Compare the judge to the labels: the share of passes it agrees with, and the share of fails.
- Do not use accuracy alone when most outputs pass. Use both rates, or Cohen's kappa.
- Calibrate again after a change to the judge model or the rubric.

**"What biases does an LLM judge have?"**

- Position bias: run comparisons in both orders.
- Length bias: say in the rubric that length is not a criterion, and check results by length.
- Self-preference: use a judge from another model family, or calibrate against people.

**"How do you stop a prompt change from making the agent worse?"**

- Run a fast eval on each pull request and a full eval before each release.
- Gate the release: no failure on critical tags, and no drop beyond a set margin.
- Release to a small share of traffic, and compare the online metrics.

**"Which metrics would you track for an agent in production?"**

- Task success rate and escalation rate.
- Cost per task and latency p95.
- User feedback, implicit signals, and draft acceptance where it applies.
- Guard and fallback rates, with alerts on sudden changes.

**"What do you do with a failure that a customer reports?"**

- Find the trace, and find the first wrong step.
- Add the case to the golden set with the correct outcome and a tag.
- Fix it, and run the full set so the fix does not break other cases.

## Go deeper

- **AI Engineering**, Chip Huyen, the chapters on evaluation methods and on evaluating AI systems. It adds the metrics, the judge methods, and how to build an evaluation pipeline.
- **Your AI Product Needs Evals**, Hamel Husain, the whole article. It adds the levels of evals and how error analysis drives them.
- **Judging LLM-as-a-Judge with MT-Bench and Chatbot Arena**, Lianmin Zheng and others, the part on the limits of judges. It adds the measurements of position, length, and self-preference bias.
- **Who Validates the Validators?**, Shreya Shankar and others. It adds criteria drift, and how people and judges agree over time.

## Further reading

- [Your AI Product Needs Evals](https://hamel.dev/blog/posts/evals/), by Hamel Husain
- [Creating a LLM-as-a-Judge That Drives Business Results](https://hamel.dev/blog/posts/llm-judge/), by Hamel Husain
- [Judging LLM-as-a-Judge with MT-Bench and Chatbot Arena](https://arxiv.org/abs/2306.05685), by Lianmin Zheng and others
- [Patterns for Building LLM-based Systems and Products](https://eugeneyan.com/writing/llm-patterns/), by Eugene Yan, the part on evals
- [Evals guide](https://platform.openai.com/docs/guides/evals), in the OpenAI documentation
- "τ-bench: A Benchmark for Tool-Agent-User Interaction in Real-World Domains", by Shunyu Yao and others
