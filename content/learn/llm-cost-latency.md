## What drives cost and latency

A model call has two numbers that a design must control: what it costs, and how long it takes. Both depend mostly on tokens. Input tokens are what you send. Output tokens are what the model writes.

A senior answer gives both numbers early, with the assumptions said aloud. "About 3 cents for each call, about $600 each month, and the brief is ready 2 minutes after the call ends" starts a design discussion. "It depends on the model" ends it.

This lesson uses one running example: a sales team records 1,000 calls each working day and sends about 3,000 emails. The company wants a brief for each rep before the follow-up, and themes for marketing each week. For the model as a part of a system, see [Building with language models](/learn/llm-systems). For the general method of rough numbers, see [Estimation](/learn/estimation).

All prices in this lesson are assumptions for practice. Prices change often, and each provider has its own. Check the provider before you use a number in a real decision.

## Tokens

A token is a piece of text that the model reads or writes as one unit. A token is often a short word, a part of a long word, or a punctuation mark. The model has a fixed vocabulary of tokens, made by a method such as byte pair encoding.

Use these rough ratios for English text. They are assumptions, not facts about one model.

| Rule of thumb             | Rough value      |
| ------------------------- | ---------------- |
| Tokens for each word      | About 4/3 (1.33) |
| Words for each token      | About 0.75       |
| Characters for each token | About 4          |
| One page of text          | About 500 words  |
| One minute of speech      | About 150 words  |

Code, numbers, tables, and many other languages use more tokens for each word. Two models can count the same text differently, because each model has its own tokenizer. For a real estimate, run a sample through the token counter of the provider.

### Input and output tokens

Providers price input and output tokens separately, and output tokens cost more. In this lesson, assume that output costs 5 times as much as input.

| Kind                | What it is                                                  | Price in this lesson (assumed) |
| ------------------- | ----------------------------------------------------------- | ------------------------------ |
| Input tokens        | Instructions, examples, documents, the conversation so far  | $3 for each million            |
| Output tokens       | The text that the model writes                              | $15 for each million           |
| Cached input        | An input prefix that the provider kept from an earlier call | $0.30 for each million         |
| Small model, input  | The same input on a smaller, faster model                   | $0.30 for each million         |
| Small model, output | The same output on a smaller, faster model                  | $1.50 for each million         |

Output also costs time. The model reads all input tokens in parallel, but it writes output tokens one at a time. A long answer is slow and expensive.

Some models think before they answer. Those hidden reasoning tokens are billed as output tokens, though the user never sees them. Count them in the estimate.

## Estimate the cost step by step

Use the same steps for each feature. Write each assumption down, so that the interviewer can change one.

1. **Items each day.** Count the calls, emails, documents, or user questions.
2. **Input tokens for each item.** Add the instructions, the item text, and any retrieved context or examples.
3. **Output tokens for each item.** Estimate the length of the answer, and add hidden reasoning tokens.
4. **Model calls for each item.** One extraction is one call. An agent loop or a retry adds calls.
5. **Price.** Use the input price and the output price. Say that they are assumptions.
6. **Cost for each item.** Input tokens × input price + output tokens × output price.
7. **Cost each day and each month.** Multiply by the items. Then add a margin, for example 20%, for retries and reprocessing.

The formula for one call, with prices for each million tokens:

```
cost = (input tokens × input price + output tokens × output price) ÷ 1,000,000
```

## Example: 1,000 call transcripts each day

| Assumption                       | Value                                         |
| -------------------------------- | --------------------------------------------- |
| Calls each working day           | 1,000                                         |
| Length of a call                 | 30 minutes                                    |
| Words each minute, both speakers | 150                                           |
| Instructions and output format   | 1,000 tokens                                  |
| Output: summary and fields       | 500 tokens                                    |
| Emails each working day          | 3,000, of about 300 words each                |
| Working days each month          | 20                                            |
| Price, large model               | $3 input, $15 output, for each million tokens |

**One call.**

- Words: 30 minutes × 150 words = 4,500 words.
- Transcript tokens: 4,500 × 4/3 = 6,000 tokens.
- Input: 6,000 + 1,000 for the instructions = 7,000 tokens.
- Input cost: 7,000 × $3 ÷ 1,000,000 = $0.021.
- Output cost: 500 × $15 ÷ 1,000,000 = $0.0075.
- Total: $0.0285, or about 3 cents.

**All calls.**

- Each day: 1,000 × $0.0285 = $28.50.
- Each month: 20 × $28.50 = $570.

**The emails.**

- One email: 300 words × 4/3 = 400 tokens, plus 600 tokens of instructions = 1,000 input tokens. Assume 100 output tokens.
- Input each day: 3,000 × 1,000 = 3 million tokens. 3 × $3 = $9.
- Output each day: 3,000 × 100 = 300,000 tokens, or 0.3 million. 0.3 × $15 = $4.50.
- Total: $13.50 each day.

**Together.** $28.50 + $13.50 = $42 each day, and $840 each month. With a 20% margin, plan for about $1,000 each month.

What the numbers mean: the model bill is small for this company. The larger costs are the engineering time, the time people spend to review outputs, and the cost of a wrong fact in front of a customer. The next section shows why.

## Cost per task and value per task

A cost has meaning only next to the value it buys. Put both in the same unit: one call, one email, one ticket. This is unit economics, as in [Product thinking](/learn/product-thinking#how-architecture-serves-the-product).

Assume that a brief saves a rep 5 minutes of notes and preparation for each call. Assume that a rep costs the company $60 each hour, which is $1 each minute.

| For each call                | Value              |
| ---------------------------- | ------------------ |
| Model cost                   | About $0.03        |
| Time saved: 5 minutes × $1   | $5.00              |
| Ratio of value to model cost | More than 150 to 1 |

Each day, 1,000 × $5 = $5,000 of saved time, against $28.50 of model cost. Even if the saving is only 1 minute, the value is $1,000 each day.

Now add the human review. If a manager reads each brief for 1 minute, that is 1,000 minutes, or $1,000 each day. That is 35 times the model cost. So review where an error is expensive: anything that goes to a customer or to marketing. For the rest, review a sample, for example 5%. That is 50 minutes, or $50, each day.

The saved time is an assumption. The real value is a change in results: more follow-ups on time, or more deals won. Measure it with a pilot. Give briefs to half of the reps for four weeks, and compare the two groups. See [Evaluating AI systems](/learn/llm-evals).

## Make it cheaper

Use the levers in order of effect on this pipeline. A lever that saves 2% of the bill is not worth a week of work.

### Smaller models and routing

A smaller model costs much less and answers faster. Model routing sends each item to the cheapest model that does the task well enough. A small model or a simple rule decides the route.

In the example, many emails are simple: "thanks", a meeting time, an out-of-office reply. Send all emails to the small model:

- Input: 3 million tokens × $0.30 per million = $0.90 each day.
- Output: 300,000 tokens × $1.50 per million = $0.45 each day.
- Total: $1.35 each day, against $13.50. The saving is $12.15 each day.

Check the quality of each route with a test set before you switch. A cheap model that misses a buying signal costs more than it saves.

### Prompt caching

Prompt caching lets the provider keep the processed form of a repeated input prefix. A later call with the same prefix reads it at a lower price, and its time to first token is shorter. Assume here that cached input costs a tenth of normal input.

In the example, only the 1,000 tokens of instructions repeat. The saving is 1,000 calls × 1,000 tokens × ($3 − $0.30) per million = $2.70 each day. That is small, because the transcript is new each time.

Caching saves much more when the shared prefix is large. Examples: a 20,000-token product manual in each support question, or a long conversation where each turn sends all earlier turns again. See the cost of a voice call in [Voice agents](/learn/voice-agents#cost-per-minute).

Rules for caching:

- Put the stable content first: instructions, tools, documents. Put the new content last.
- A cache lives for a short time, often minutes. Calls that are far apart do not share it.
- A provider caches only a prefix above a minimum length, often about 1,000 tokens or more. The 1,000 tokens of instructions in the example can be too short to cache.
- Some providers charge extra to write the cache. Check the rules of the provider.

### Batch APIs

Many providers offer a batch API. You send many requests in one job, and the results come back later. The usual price is about half of the normal price, and the usual window is up to 24 hours. These are assumptions: check the provider.

For the calls, half price saves $14.25 each day, or $285 each month. The cost is time: a result can arrive up to a day later. Plan for the end of the window, not for the usual case. Use a batch API only when the person acts after that window. See [Batch or per event](#batch-or-per-event).

### Shorter context and shorter output

- Remove what the model does not need: timestamps on each line, filler words, hold music, signatures, and quoted earlier emails.
- Send only the relevant part of a long document. See [Building with language models](/learn/llm-systems).
- Ask for fields, not prose. A fixed output format with a length limit cuts the expensive output tokens.
- Do not send the same transcript three times for three questions. Ask for all fields in one call, if the quality stays good.

### Process once, use many times

Each later use of a call needs the same facts: who called, what they want, objections, next steps, competitors named. Extract these facts once, when the call ends. Store them as rows. Then each later use reads the rows, not the transcript.

```diagram
{
  "nodes": [
    { "id": "src", "label": "Transcripts\nand emails", "shape": "store", "col": 0, "row": 1 },
    { "id": "extract", "label": "Extract once\n(model, each item)", "shape": "box", "col": 1, "row": 1 },
    { "id": "facts", "label": "Call facts\n(structured rows)", "shape": "store", "col": 2, "row": 1 },
    { "id": "brief", "label": "Rep brief\n(before follow-up)", "shape": "box", "col": 3, "row": 0 },
    { "id": "weekly", "label": "Weekly themes\n(one model call)", "shape": "box", "col": 3, "row": 1 },
    { "id": "search", "label": "Search and\ndashboards", "shape": "box", "col": 3, "row": 2 }
  ],
  "edges": [
    { "from": "src", "to": "extract", "label": "new item", "async": true },
    { "from": "extract", "to": "facts", "label": "write" },
    { "from": "facts", "to": "brief" },
    { "from": "facts", "to": "weekly" },
    { "from": "facts", "to": "search" }
  ]
}
```

Compare two ways to make the weekly themes from 5,000 calls (1,000 each day for 5 days):

| Method                                 | Input tokens each week     | Cost each week (assumed prices) |
| -------------------------------------- | -------------------------- | ------------------------------- |
| Read all transcripts again             | 5,000 × 7,000 = 35 million | 35 × $3 = $105                  |
| Read the stored facts, 100 tokens each | 5,000 × 100 = 500,000      | 0.5 × $3 = $1.50                |

The second method is also better. Counts such as "120 calls named a competitor" come from a database query, so they are exact. The model only writes the summary of the counts. The first method does not fit in one context window, so it needs many calls and a merge step.

## Latency

### Time to first token and total time

Time to first token (TTFT) is the time from the request to the first output token. It includes the network, the queue at the provider, and the time to read the input. A longer input gives a longer TTFT.

Total time is TTFT plus the time to write all output tokens:

```
total time = time to first token + output tokens ÷ output speed
```

Assume a TTFT of 0.5 seconds and an output speed of 50 tokens each second.

- A brief of 500 tokens: 0.5 + 500 ÷ 50 = 10.5 seconds.
- An answer of 50 tokens: 0.5 + 50 ÷ 50 = 1.5 seconds.

The length of the output decides most of the time. To make a call faster, ask for less output first. Hidden reasoning tokens also add to the total time.

### Streaming

Streaming sends each output token to the client as the model writes it. The user sees the first words after the TTFT, not after the total time. The total time does not change.

Streaming helps when a person reads the answer. It helps less when a program needs complete JSON. In a voice agent, the text goes to speech one sentence at a time, so the agent starts to talk early. See [Voice agents](/learn/voice-agents#stream-every-step).

### A latency budget

A latency budget splits a target time across the steps of a request. Each step gets a share, and each team knows its limit. Measure the full path, not only the model step. A model step of 500 milliseconds is not the time the user waits.

Example: a rep asks an assistant about an account. The target is the first word in 1 second at p50, and in 2.5 seconds at p95.

| Step                             | p50 (ms) | p95 (ms) |
| -------------------------------- | -------- | -------- |
| Network and sign-in check        | 50       | 100      |
| Search for the account documents | 150      | 300      |
| Tool call to the sales system    | 200      | 600      |
| Model: time to first token       | 500      | 1,200    |
| Total to the first word          | 900      | 2,200    |

The sum of the p95 values is a safe upper limit. The real p95 of the total is usually lower, because the slow cases of each step seldom occur together. Measure the end-to-end p95 with [distributed tracing](/learn/observability#logs-correlation-ids-and-traces).

### p50 and p95

The p50 (median) is the time that half of the requests beat. The p95 is the time that 95% of requests beat. See [Measure the slow requests](/learn/scalability#measure-the-slow-requests).

Model calls have long tails. The causes are load at the provider, long outputs, and retries after a rate limit. An average of 1 second can hide a p95 of 4 seconds. Report both numbers, and set the target on the p95.

Set a timeout on each model call, and decide the fallback: a smaller model, a shorter answer, or a clear message. See the timeouts in [The stability patterns](/learn/resilience#the-stability-patterns).

### Parallel calls

When two calls do not need each other's result, run them at the same time. The time is then the time of the slowest call, not the sum.

Example: three questions on one transcript. The summary takes 3 seconds, the action items 2 seconds, and the sentiment 1 second.

- In sequence: 3 + 2 + 1 = 6 seconds.
- In parallel: 3 seconds, the slowest of the three.
- In one combined call: one TTFT, and the transcript is sent once. The input is 7,000 tokens, not 21,000.

Parallel calls cut the time but multiply the input cost and the load on your rate limit. One combined call cuts the cost but makes one prompt do three jobs. Choose with a test set. See [The cost of a chain of calls](/learn/sync-async#the-cost-of-a-chain-of-calls).

## Batch or per event

Start from one question: when does the person act on the result? Then choose the cheapest way that is ready before that moment, with time left for a failure and a retry.

| When the person acts    | Processing                                    | Example                            |
| ----------------------- | --------------------------------------------- | ---------------------------------- |
| During the conversation | Streaming, in less than a second              | The reply of a voice agent         |
| Within minutes          | Per event, from a queue                       | A brief for a call-back in an hour |
| The next working day    | Per event, or a nightly batch that ends early | A brief for a next-day follow-up   |
| Once a week             | A weekly batch                                | Themes for the marketing meeting   |

A weekly batch for briefs is a design error when reps follow up the next day. The brief arrives up to a week after the follow-up, so it has no value. The token cost of per-event work is the same as a batch. Only the batch discount is lost.

Per-event work still uses a queue, so a peak of calls at 17:00 does not overload the model quota. See [Batch processing](/learn/batch-and-stream#batch-processing) and the dead-letter queue in [Patterns for workers](/learn/messaging#patterns-for-workers).

## Common mistakes

- **No number.** "It depends on the model" is not an estimate. Give a range with assumptions.
- **Output tokens forgotten.** They cost more than input tokens, and hidden reasoning tokens count too.
- **Cost with no value.** $1,000 each month means nothing until you compare it with the time or revenue it buys.
- **Review cost forgotten.** People who check each output often cost more than the model.
- **Only the model step measured.** The user waits for the network, search, tools, and the model together.
- **The average, not the p95.** Model calls have long tails.
- **The same document read many times.** Extract the facts once, and reuse them.
- **A batch that ends after the person acts.** A cheap result that arrives late is worth nothing.
- **Prices stated as facts.** Prices change. State them as assumptions, and show how the result moves if they double.

## In a kata

Put a short block at the top of the design:

1. **Volume.** Items each day, and tokens for each item, input and output.
2. **Cost.** For each item, each day, and each month, with the prices as assumptions.
3. **Value.** The value of one item in the same unit, and how you will measure it.
4. **Timing.** When the person acts, and the processing that is ready before then.
5. **Latency budget.** A table of steps, with p50 and p95, for each path that a person waits on.

In [Agent Triggers](/kata/agent-triggers), each trigger starts an agent run. Estimate the runs each day and the cost of one run before you discuss a price for the customer.

To practice this lesson end to end, do [Call Insights](/kata/call-insights). It has a model budget, a review step, and a report that arrives too late.

## In an interview

When a prompt names a volume, such as "1,000 transcripts a day", do the cost estimate in the first ten minutes. Say each assumption aloud, then show the multiplication. Then compare the result with the value of one item.

When the prompt has a person who waits, give a latency budget from that person's point of view. Name every step, not only the model. When the prompt has a person who acts later, ask when they act. Then choose the timing of the processing.

A strong closing sentence has three parts: the cost, the value, and the main lever. For example: "About $1,000 each month against about $100,000 of saved time. The largest cost is human review, so we review a 5% sample and everything that goes to customers."

## Interview questions

**"Estimate the daily model cost of summarizing 1,000 call transcripts of 30 minutes."**

- State the assumptions: 150 words each minute, 4/3 tokens for each word, 1,000 tokens of instructions, 500 output tokens.
- Tokens: 30 × 150 = 4,500 words, × 4/3 = 6,000 tokens, + 1,000 = 7,000 input tokens.
- Assume $3 input and $15 output for each million tokens. Prices change, so check the provider.
- One call: 7,000 × $3 ÷ 1M = $0.021, plus 500 × $15 ÷ 1M = $0.0075. Total about $0.03.
- Each day: 1,000 × $0.0285 = $28.50. Each month of 20 working days: $570.
- Conclude: the model bill is small, so review time and quality decide the design.

**"Is this AI feature worth what it costs?"**

- Put cost and value in the same unit, such as one call.
- Model cost about $0.03 for each call. A saving of 5 minutes at $1 each minute is $5.
- Each day: $5,000 of value against $28.50 of model cost.
- Add the cost of review: 1 minute for each brief is $1,000 each day, more than the model.
- Measure the real value with a pilot group, not with the assumption.

**"How would you cut the model cost of this pipeline?"**

- Find the largest line first. Do not optimize a 2% part.
- Route simple items to a smaller model. In the example, emails go from $13.50 to $1.35 each day.
- Cache the stable prefix. It helps most when the shared prefix is large.
- Use a batch API, at about half price, when the timing allows it.
- Shorten the input and ask for short, fixed fields. Extract once and reuse the facts.

**"Make weekly themes for marketing from all calls. Do you send all transcripts to the model each week?"**

- No. 5,000 calls × 7,000 tokens = 35 million tokens, about $105 each week, and it does not fit one context.
- Extract facts once, when each call ends, and store them as rows.
- Each week: 5,000 × 100 tokens = 500,000 tokens, about $1.50.
- Count with a database query, so the numbers are exact. The model writes the summary.
- A person reviews the themes before they go out.

**"The assistant feels slow. Where do you look first?"**

- Split time to first token from total time.
- If the total time is long, the output is probably long. Ask for less, and stream it.
- Trace every step: network, search, tools, model. The model is often not the whole delay.
- Look at the p95, not the average. Check for retries after rate limits.

**"Do you process each call when it ends, or in a nightly batch?"**

- Ask when the person acts on the result.
- If reps follow up the next morning, a nightly job that ends before work starts can work.
- If reps call back within an hour, process each call when it ends, from a queue.
- A batch API saves about half, but the result can take up to a day. Plan for the end of the window.
- Never choose a schedule that ends after the person acts.

**"How do you set a latency target for a feature that calls a model?"**

- Start from what the user does while waiting: reads, talks, or waits for a page.
- Set the target on the p95, and give a p50 too.
- Split the target into a budget for each step.
- Set a timeout and a fallback on each model call.

## Go deeper

- **AI Engineering**, Chip Huyen, the part on inference optimization. It adds how time to first token and output speed come from the hardware and the serving system.
- **Designing Machine Learning Systems**, Chip Huyen, the part on batch prediction and online prediction. It adds when to compute results in advance and when on request.
- **Designing Data-Intensive Applications**, Martin Kleppmann, the part on describing performance. It adds percentiles and why the tail matters.

## Further reading

- [Byte pair encoding](https://en.wikipedia.org/wiki/Byte_pair_encoding) on Wikipedia
- [Tokenizer](https://platform.openai.com/tokenizer), a token counter from OpenAI, one example among others
- [Prompt caching](https://platform.openai.com/docs/guides/prompt-caching), in the OpenAI documentation
- Prompt caching, and Batch processing, in the Anthropic API documentation
- [Batch API](https://platform.openai.com/docs/guides/batch), in the OpenAI documentation
- [Latency optimization](https://platform.openai.com/docs/guides/latency-optimization), in the OpenAI documentation
- "The Tail at Scale", Jeffrey Dean and Luiz André Barroso, Communications of the ACM, 2013
