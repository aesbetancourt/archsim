## Pipes and filters

The pipeline style is also called **pipes and filters**. Richards and Ford describe it as one of the oldest styles, and one of the simplest (Fundamentals of Software Architecture, the part on pipeline architecture). It has only two kinds of part.

- A **filter** does one task on the data. It gets input, does its work, and passes its output on. A filter is self-contained and usually stateless: it does not remember earlier records, and it does not know the other filters.
- A **pipe** carries data from one filter to the next. A pipe goes in one direction, and it usually connects exactly two filters: one writer and one reader.

The data that moves in a pipe can be in any format: lines of text, JSON records, rows of a file, or objects in memory. Small records are better than large ones. Each filter then starts work sooner, and less data waits in each pipe.

## The four kinds of filter

Richards and Ford name four kinds of filter. Each one has a fixed role in the chain.

| Filter      | Role                                                          | Example in a chain of lunch shops                      |
| ----------- | ------------------------------------------------------------- | ------------------------------------------------------ |
| Producer    | The start. It only sends data. Also called the source         | Reads the sales file of each shop at night             |
| Transformer | Changes each record and passes it on                          | Converts local prices to one currency                  |
| Tester      | Checks each record against a rule, and passes on some of them | Drops test orders, or sends refunds to a separate pipe |
| Consumer    | The end. It writes or shows the result. Also called the sink  | Writes the daily totals to the head office database    |

A transformer is like `map` in functional programming: one record in, one changed record out. A tester is like `filter`: it keeps some records and drops the others. Some testers also have two outputs, for example "valid" and "rejected". That is how a pipeline makes a branch.

```diagram
{
  "nodes": [
    { "id": "src", "label": "Producer\n(read shop files)", "shape": "box", "col": 0, "row": 0 },
    { "id": "t1", "label": "Transformer\n(one currency)", "shape": "box", "col": 1, "row": 0 },
    { "id": "test", "label": "Tester\n(valid order?)", "shape": "box", "col": 2, "row": 0 },
    { "id": "sink", "label": "Consumer\n(daily totals)", "shape": "store", "col": 3, "row": 0 },
    { "id": "rej", "label": "Consumer\n(rejected records)", "shape": "store", "col": 2, "row": 1.3 }
  ],
  "edges": [
    { "from": "src", "to": "t1", "label": "pipe" },
    { "from": "t1", "to": "test", "label": "pipe" },
    { "from": "test", "to": "sink", "label": "valid" },
    { "from": "test", "to": "rej", "label": "rejected" }
  ]
}
```

## One-way flow

Data in a pipeline moves only forward. A filter never sends data back to the filter before it, and never asks it a question. This rule gives the style its main strengths:

- **Each filter is simple.** It has one input, one task, and one output.
- **Each filter is easy to test.** Give it input, and check the output. No other filter is necessary.
- **Filters can be reused.** A "convert currency" filter works in the sales pipeline and in the refunds pipeline.
- **The chain is easy to change.** You add, remove, or reorder filters, if the format of the data in each pipe matches.

The rule also gives the main limit. If a step needs an answer from a later step, the problem is not a pipeline.

## How data moves

A pipeline can move its data in two ways.

| Mode                 | How it works                                               | Gain                                               | Cost                                               |
| -------------------- | ---------------------------------------------------------- | -------------------------------------------------- | -------------------------------------------------- |
| One record at a time | Each filter passes each record on as soon as it is done    | Low delay. Little memory. Filters work in parallel | A slow filter slows all filters before it          |
| One batch at a time  | Each filter finishes the full input before the next starts | Simple to restart from the last finished step      | Higher delay. Each step must store its full output |

Unix pipes use the first mode. Each tool starts as soon as data arrives. When a pipe is full, the writer waits. This is a simple form of [backpressure](/learn/messaging#backpressure): a slow filter slows the ones before it, and no data is lost.

## Examples

### Shell pipelines

The Unix shell is the best known pipeline. Each tool is a filter, and the `|` character is a pipe. This command counts the failed orders for each shop in a log:

```bash
grep "status=failed" orders.log | cut -d' ' -f3 | sort | uniq -c | sort -rn
```

Here, `grep` is a tester, `cut` is a transformer, and the terminal is the consumer. Each tool knows nothing about the others. They agree only on one format: lines of text. Kleppmann uses this idea to explain large batch systems (DDIA, the part on batch processing). See [Batch processing](/learn/batch-and-stream#batch-processing).

### Extract, transform, load (ETL)

An ETL job moves data from one system to another:

1. **Extract** the data from the source systems. This is the producer.
2. **Transform** it: clean it, join it, convert units and codes. These are transformers and testers.
3. **Load** it into the target, often a data warehouse. This is the consumer.

ETL is the most common use of the style in business systems. Tools such as Apache Airflow run each job, and start the next job when its input is ready. See [Analytical data](/learn/analytical-data) for where the data goes after the load.

### Electronic data interchange (EDI)

EDI is the exchange of business documents between companies in standard formats, such as orders, invoices, and insurance claims. An EDI system is usually a pipeline:

1. Read the internal records.
2. Check each one against the rules of the partner.
3. Convert it to the standard format.
4. Send it, and log the receipt.

A clinic group that sends billing data to several insurers has one pipeline for each insurer. The first filters are shared. Only the conversion and the send filters differ for each insurer.

### Compilers and media processing

A compiler is a pipeline too: read the text, split it into tokens, parse, check, and generate code. A video service runs each upload through a chain: check, transcode, make thumbnails, and publish. See [Video platform](/learn/video-platform).

## Deployment and quanta

Most pipelines run as one application, with the filters as modules and the pipes as calls or queues in memory. The full pipeline is then one [architecture quantum](/learn/architecture-quantum). It scales as one unit, and it fails as one unit.

You can also deploy each filter as a separate process, with a message queue as each pipe. Each filter then scales alone. You add more copies of the slow filter. But you now have a distributed system, with its costs: brokers to operate, messages that can be repeated or lost, and failures between steps. At that point, the design is close to [event-driven architecture](/learn/event-driven) with a fixed flow.

## Pipelines and stream processing

A stream processor, such as Apache Flink or Kafka Streams, runs a pipeline at the scale of many machines. Each operator is a filter. Each topic or internal channel is a pipe. The data never stops: the producer reads an endless stream of events.

Stream processing adds what a simple pipeline does not have:

- **State.** A count of orders for each shop in the last five minutes needs memory across records.
- **Windows and time.** The processor must decide when a time window is complete. Late events make this hard.
- **Recovery.** The processor saves its state at intervals, so a restart does not lose or repeat work.

For these ideas, see [Batch and stream processing](/learn/batch-and-stream). The pipeline style gives the base: one-way flow, small independent steps, and one data format between them.

## How the style handles each characteristic

| Characteristic  | How the style handles it                                                      |
| --------------- | ----------------------------------------------------------------------------- |
| Simplicity      | Very good. Two kinds of part, and one direction                               |
| Modularity      | Good. Each filter is a separate, replaceable part                             |
| Testability     | Good. Each filter tests alone, with input and expected output                 |
| Cost            | Low. Usually one application and no special infrastructure                    |
| Scalability     | Weak when deployed as one unit. Better when each filter is a separate process |
| Fault tolerance | Weak when deployed as one unit. A fault in one filter stops the chain         |
| Elasticity      | Weak. A batch pipeline rarely changes size during a run                       |

## The limits

- **No interaction.** A user who waits for an answer needs a request and a reply. A pipeline gives a result at the end, not a conversation.
- **No feedback.** A filter cannot ask a later filter for help. If a later step finds an error, it cannot send the record back. It can only reject it.
- **Bad records.** One bad record can stop a full run. Decide in advance: stop the run, or move the record to a rejected output and continue. Most business pipelines must continue and report.
- **Coupling through the data format.** Filters do not know each other, but each one depends on the format in its pipe. A change to a field can break each filter after it. Treat the format as a contract.
- **State across records.** A stateless filter cannot count, sort, or join. A filter that does these must hold data, and the simple model gets harder. `sort` in the shell must read all its input before it writes one line.
- **Long chains.** Each step adds delay. A chain of twenty small filters can be slower and harder to debug than five larger ones.

## Common mistakes

- **Filters that share a database.** Two filters that read and write the same tables are no longer independent. Pass the data in the pipe.
- **A pipeline for a process with many branches and loops.** That is a workflow. Use a workflow engine or a mediator. See [Event-driven architecture](/learn/event-driven#mediator-topology).
- **No rerun plan.** A nightly job fails at step 4. Can you start again from step 4, or must you start from the beginning? Can a rerun write the same data twice? Make each consumer safe to repeat.
- **Silent rejects.** Rejected records go to a file that no one reads. Count them, and alert when the count is high.

## How it fails

- **One slow filter.** All earlier filters wait, and the run is late. Measure the time of each filter.
- **A crash in the middle of a run.** Part of the output is written and part is not. Write the output to a new place, and switch to it at the end. Kleppmann notes this as a key strength of batch work: inputs do not change, so a rerun is safe.
- **A change in the source format.** The producer reads a file with a new column, and each record fails. Check the format at the producer, and reject the file early.

## Compared with its neighbors

|             | Pipeline                        | Event-driven                         | Microkernel                      |
| ----------- | ------------------------------- | ------------------------------------ | -------------------------------- |
| Flow        | Fixed, one direction            | Dynamic, many reactions to one event | A core calls its plug-ins        |
| Parts know  | Only the format of their pipe   | Only the events they use             | Only the plug-in contract        |
| Typical use | Import, convert, enrich, export | Many independent reactions, bursts   | A stable core with many variants |
| Deployment  | Usually one unit                | Many processors and a broker         | Usually one unit                 |

## In a kata

- In [Waiting Room](/kata/waiting-room), the billing data for several insurers is a pipeline: read the visits, check them, convert them for each insurer, send, and log. It runs next to the interactive parts, not in place of them.
- In [Lunch Rush](/kata/lunch-rush), a nightly sales report for head office is a small pipeline. It needs no new infrastructure.
- In [Agent Triggers](/kata/agent-triggers), the path from an incoming email to a queued run can be a short pipeline: receive, deduplicate, match the trigger, start the run. Each step must be safe to repeat.

Use the pipeline for the one-way part of the problem. Name the producer, the testers, and the consumer, and say what occurs to a bad record.

## Interview questions

**"What are the parts of a pipeline architecture?"**

- Pipes: one-way, usually point to point.
- Filters: producer, transformer, tester, consumer. Each is self-contained and does one task.
- The data format in each pipe is the only contract between filters.

**"How does a pipeline handle a bad record?"**

- Decide in advance: stop the run, or reject the record and continue.
- A tester with a second output sends bad records to a rejected store.
- Count the rejects, and alert on a high count.

**"When is a pipeline the wrong choice?"**

- When a user waits for an answer, or the process needs many branches, loops, or feedback.
- When parts need independent scale and uptime, unless you distribute the filters.

**"How does a pipeline relate to stream processing?"**

- A stream processor is a distributed pipeline over an endless input.
- It adds state, time windows, and recovery from checkpoints.

## Go deeper

- **Fundamentals of Software Architecture** (Richards, Ford), the part on pipeline architecture: pipes, the four kinds of filter, and the characteristics of the style.
- **Designing Data-Intensive Applications** (Kleppmann), the parts on batch processing and stream processing: the Unix philosophy, and how pipelines run across many machines.
- **Enterprise Integration Patterns** (Hohpe, Woolf), the pattern named Pipes and Filters: the same idea for messaging between systems.

## Further reading

- [Pipes and Filters](https://www.enterpriseintegrationpatterns.com/patterns/messaging/PipesAndFilters.html), from Enterprise Integration Patterns
- [Pipeline (Unix)](https://en.wikipedia.org/wiki/Pipeline_%28Unix%29) on Wikipedia
- [Extract, transform, load](https://en.wikipedia.org/wiki/Extract,_transform,_load) on Wikipedia
