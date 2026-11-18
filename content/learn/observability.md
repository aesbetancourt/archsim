## The question

A design is not complete until you can say how you will know that it works. Observability is the ability to understand what a running system does from the data it produces.

Interviewers ask this more and more: "how would you know it is working, and how would you find out when it is not?". It is one of the clearest signs of experience.

Monitoring and observability are related but not the same. Monitoring watches for problems that you expected: a full disk, a high error rate. Observability lets you answer questions that you did not expect, about a failure that nobody has seen before. Sam Newman makes this point for microservices (Building Microservices, the part on monitoring and observability). A system with many services fails in new ways, so a fixed set of dashboards is not enough.

## Three kinds of data

| Signal  | What it is                                                | Answers                                    |
| ------- | --------------------------------------------------------- | ------------------------------------------ |
| Metrics | Numbers measured over time                                | Is there a problem? How large?             |
| Logs    | A record of each event, with details                      | What exactly occurred for this request?    |
| Traces  | The path of one request through all the parts, with times | Where is the time lost? Which part failed? |

Give each request an ID at the entry point and pass it to each part. Without it, logs from different services cannot be connected.

The three kinds have different costs:

- **Metrics** are cheap to keep for a long time, because each one is a small number for each interval. They lose the detail of each request.
- **Logs** keep the detail, but they are large. A busy service writes gigabytes each day.
- **Traces** show the full path, but a trace of every request costs too much. Most teams keep a sample.

Use metrics to find that a problem exists. Use traces to find where it is. Use logs to find why.

## What to measure

For each service that answers requests, four measurements cover most problems:

- **Rate:** requests each second.
- **Errors:** the share of requests that fail.
- **Duration:** how long requests take, as percentiles.
- **Saturation:** how full the resources are: processor, memory, connections, queue length.

The Google SRE book calls these the four golden signals, with the names latency, traffic, errors, and saturation (Site Reliability Engineering, the part on monitoring distributed systems). Each one needs some care:

- **Latency.** Measure successful and failed requests apart. A failure that returns in 2 milliseconds makes the average look good while users get errors.
- **Traffic.** Choose the unit that fits the service: requests each second, messages each second, or bytes each second.
- **Errors.** Count the requests that return an error code. Also count the requests that return the wrong content, and the requests that are slower than a promise. A page that loads in 30 seconds is an error to the user.
- **Saturation.** Measure the resource that runs out first. Watch the trend, because a disk that fills by 2% each day is a problem next month.

Use percentiles for duration, not the average. The 99th percentile (p99) is the time that 99% of requests beat. Do not average percentiles from several servers: the result is not a percentile. Collect the full distribution as a histogram and calculate the percentile from it.

For background work, measure the delay: the age of the oldest item in the queue. For a business flow, measure the business result: orders each minute, payments confirmed. A fall in orders finds faults that no technical signal shows.

### Labels and their cost

A metric can have labels, for example the service, the endpoint, and the status code. Each new combination of label values makes a new time series. A label with a value for each user, or for each order ID, can create millions of series and overload the metrics store. This problem is called high cardinality. Put per-user and per-request detail in logs and traces, not in metric labels.

## Logs, correlation IDs, and traces

In a system with one server, you read one log file. In a system with twenty services and three copies of each, the logs for one request are on many machines. Newman gives the standard answers (Building Microservices, the parts on log aggregation and tracing).

### Log aggregation

1. Each service writes its logs to standard output, in a structured format such as JSON.
2. An agent on each machine collects the logs and sends them to one central store.
3. The store indexes the logs, so you can search all services at once.

Agree on a common format across teams: a time in UTC, a service name, a level, and the correlation ID. A team that invents its own format makes its logs hard to search with the others. Do not write passwords, tokens, or personal data to logs. Logs are copied to many places, and each copy is a risk. See [Security](/learn/security).

### Correlation IDs

A correlation ID is a unique value that the first service gives to a request. Each service passes it on, in each call and in each message. Each log line includes it. With one search for the ID, you see the full story of one request across all the services.

Pass the ID through queues and events as well as through calls. An asynchronous step with no ID breaks the chain at the point where problems are most difficult to find.

### Distributed tracing

A trace records the path of one request. It is a tree of spans. A span is one unit of work: a call, a query, a step. Each span has a start time, a duration, and a parent span.

```diagram
{
  "nodes": [
    { "id": "user", "label": "Customer", "shape": "actor", "col": 0, "row": 0 },
    { "id": "gw", "label": "Gateway\nspan 1: 240 ms", "shape": "box", "col": 1, "row": 0 },
    { "id": "order", "label": "Order service\nspan 2: 220 ms", "shape": "box", "col": 2, "row": 0 },
    { "id": "stock", "label": "Stock service\nspan 3: 15 ms", "shape": "box", "col": 3, "row": 0 },
    { "id": "pay", "label": "Payment provider\nspan 4: 190 ms", "shape": "external", "col": 3, "row": 1 },
    { "id": "collector", "label": "Trace collector", "shape": "pipe", "col": 1, "row": 2 },
    { "id": "traces", "label": "Trace store", "shape": "store", "col": 2, "row": 2 }
  ],
  "edges": [
    { "from": "user", "to": "gw", "label": "trace ID set" },
    { "from": "gw", "to": "order", "label": "trace ID" },
    { "from": "order", "to": "stock", "label": "trace ID" },
    { "from": "order", "to": "pay", "label": "trace ID" },
    { "from": "gw", "to": "collector", "label": "spans", "async": true },
    { "from": "collector", "to": "traces", "async": true }
  ]
}
```

In this trace, the payment provider uses 190 of the 240 milliseconds. Without the trace, the slow order service looks like the cause.

Each service sends its spans to a collector, with no wait. Most teams use OpenTelemetry, an open standard for the format and the libraries. Sampling keeps the cost low. Head sampling decides at the start of a request, for example 1 request in 100. Tail sampling decides at the end, so it can keep all slow and failed requests. Tail sampling finds more problems but needs more infrastructure.

## Service levels

| Term            | Meaning                                 | Example                                                          |
| --------------- | --------------------------------------- | ---------------------------------------------------------------- |
| Indicator (SLI) | A measurement of what users experience  | The share of redirects that answer in less than 100 milliseconds |
| Objective (SLO) | The target for the indicator            | 99.9% each month                                                 |
| Agreement (SLA) | A promise to a customer, with a penalty | 99.5%, or the customer gets money back                           |

An objective makes "available" exact. It also gives an error budget: 99.9% each month permits about 43 minutes of failure. If the budget is used, the team stops new features and works on reliability. If the budget is not used, the team can release faster.

Each added "9" costs much more than the one before it. Select the objective from what users need, not from what sounds good. See [Estimation](/learn/estimation#numbers-to-remember) for the downtime that each level permits.

### A good indicator

The SRE Workbook recommends an indicator as a ratio: good events divided by valid events. For example, of all valid search requests in the last 28 days, the share that returned a correct answer in less than 300 milliseconds. A ratio is easy to understand, and it goes from 0% to 100% for each service.

- **Measure near the user.** A load balancer log or a test from outside sees more failures than the server sees. A request that never reaches the server is invisible to the server.
- **Choose few indicators.** Two or three for each service. A team cannot act on twenty.
- **Choose a window.** A rolling window of 28 or 30 days is common. It gives each failure a fixed time to age out.

### The SLA is lower than the SLO

An SLA is a business contract. Set it lower than the internal objective, so the team finds and fixes a problem before the penalty starts. A service with no paying customers has SLOs and no SLA.

### No target of 100%

The SRE book argues that 100% is the wrong target for almost any service (the part on embracing risk). Users cannot tell 99.999% from 100%, because their own phone and network fail more often. Each added 9 slows feature work and costs more machines. The cost of the last step is almost never worth it.

## Error budgets

The error budget is 1 minus the objective. At 99.9% over 30 days, the budget is 0.1% of the requests, or about 43 minutes of full failure. The team can spend it on risky releases, on experiments, and on planned maintenance.

The budget changes the argument between product and operations. The question is no longer "is this release safe?". The question is "do we have budget left?". The data answers it, not the loudest person.

### The error-budget policy

An error-budget policy is an agreement, written before a problem, about what the team does when the budget runs out. Product, engineering, and operations agree to it together. A typical policy:

1. While budget remains, the team releases at its normal speed.
2. When the budget is spent, the team stops releases except for fixes and security changes.
3. The team works on the causes of the failures until the service is back inside its objective.
4. If one incident uses a large part of the budget, the team writes a review and fixes the cause. See [Incident response](/learn/incident-response).

Without a written policy, the budget is only a number. With it, the budget is a decision rule.

## Alerts

- Alert on what users feel: errors, delay, a business result that falls. Do not alert on each technical number.
- Each alert must need an action from a person now. If it does not, it is a report, not an alert.
- Too many alerts are as bad as none, because people stop reading them.

### Symptoms, not causes

The SRE book separates symptoms from causes. A symptom is what a user sees: "checkout fails". A cause is a reason: "the database has high processor load". Alert on symptoms. A high processor load that harms no user is not a reason to wake someone. A new cause that nobody predicted still produces a symptom, so symptom alerts catch it.

Use cause metrics on dashboards, for the person who investigates. They help to find the reason after the symptom alert fires.

### Black-box and white-box monitoring

- **Black-box monitoring** tests the system from outside, as a user does. A probe loads the home page every minute. It shows real problems now.
- **White-box monitoring** uses the data that the system produces from inside: metrics, logs, traces. It can show a problem before users feel it, for example a queue that grows.

Use both. A black-box probe catches the failure that the inside data cannot see, for example a DNS fault.

### Alerts on the burn rate

An alert on a short error spike fires too often. An alert on the monthly SLI fires too late. A burn-rate alert solves both problems. The burn rate is how fast the service uses its error budget, compared with the planned speed.

- A burn rate of 1 uses the full budget in exactly one window, for example 30 days.
- A burn rate of 10 uses the full 30-day budget in 3 days.
- A burn rate of 100 uses it in about 7 hours.

A common design has two alerts. A high burn rate over a short period pages a person now. A low burn rate over a long period opens a ticket for work hours. To avoid an alert that stays on after a problem ends, check the rate over a long and a short window together, and fire only when both are high. The SRE Workbook, the part on alerting on SLOs, gives the full method.

## The silent failure

The most dangerous failure produces no error: a trigger that stopped, a job that no longer runs, a queue that nobody reads. "No events" looks the same as "all is well". Protect against it with a signal that must arrive: a [canary check](/glossary#canary), or an alert when an expected event does not occur. The Agent Triggers worked example has a full section on this.

Other forms of the silent failure:

- A metric that stops arriving looks like zero errors. Alert when a metric is missing.
- A health check that only says "the process runs" passes while the service cannot reach its database. Make the check test the dependencies that matter.
- A synthetic transaction is a fake user action that runs all the time, for example a test order in a test account. Newman calls this semantic monitoring. It tests the full flow, not only each part.

## In a kata

Add a short part on operations to each design:

1. Name two or three SLIs that match what users of this system care about.
2. Give an SLO for each one, and say why that level is enough.
3. Say which symptom pages a person, and which one only opens a ticket.
4. Name the silent failure of this design, and the signal that catches it.
5. Say how a correlation ID passes through each queue in the diagram.

For example, in the [Tow Line kata](/kata/tow-line), an SLI is the share of help requests that get a truck assigned within 5 minutes. A storm can double the requests, so the saturation of the assignment queue is the first warning.

## Interview questions

**"How would you know that this system works?"**

- Name SLIs from the user's view, not server metrics.
- Give an SLO for each one, with a window.
- Add one business metric, such as orders each minute.
- Name the silent failure and the check that catches it.

**"What is the difference between an SLI, an SLO, and an SLA?"**

- The SLI is the measurement, as a ratio of good events to valid events.
- The SLO is the internal target.
- The SLA is a contract with a penalty, set lower than the SLO.

**"What do you alert on?"**

- Symptoms that users feel, not causes.
- Each alert must need an action from a person now.
- Use burn-rate alerts on the error budget, with a fast page and a slow ticket.
- Keep cause metrics on dashboards for the investigation.

**"A request is slow, and it crosses eight services. How do you find the cause?"**

- Use the trace for that request to see which span uses the time.
- Use the correlation ID to find the logs of the slow service.
- Check the saturation of that service, for example its connection pool.

**"What does the team do when the error budget is gone?"**

- It follows the error-budget policy that it agreed before.
- Releases stop, except fixes, until the service is back inside its objective.
- The policy turns an argument into a rule.

## Go deeper

- **Site Reliability Engineering** (Beyer and others), the parts on service level objectives, embracing risk, and monitoring distributed systems: SLIs, error budgets, the four golden signals, and alerts on symptoms.
- **The Site Reliability Workbook** (Beyer and others), the part on alerting on SLOs: burn-rate alerts step by step.
- **Building Microservices** (Sam Newman), the part on monitoring and observability: log aggregation, correlation IDs, distributed tracing, and semantic monitoring.
- **Release It!** (Michael Nygard), the parts on transparency: how a system must expose its state to the people who run it.

## Further reading

- [Service level objectives](https://sre.google/sre-book/service-level-objectives/) and [Monitoring distributed systems](https://sre.google/sre-book/monitoring-distributed-systems/), from the Google SRE book
- [Alerting on SLOs](https://sre.google/workbook/alerting-on-slos/) and [Error budget policy](https://sre.google/workbook/error-budget-policy/), from the Google SRE Workbook
- [OpenTelemetry](https://opentelemetry.io/docs/concepts/observability-primer/), an introduction to observability
