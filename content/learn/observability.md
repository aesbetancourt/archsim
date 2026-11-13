## The question

A design is not complete until you can say how you will know that it works. Observability is the ability to understand what a running system does from the data it produces.

Interviewers ask this more and more: "how would you know it is working, and how would you find out when it is not?". It is one of the clearest signs of experience.

## Three kinds of data

| Signal | What it is | Answers |
|---|---|---|
| Metrics | Numbers measured over time | Is there a problem? How large? |
| Logs | A record of each event, with details | What exactly occurred for this request? |
| Traces | The path of one request through all the parts, with times | Where is the time lost? Which part failed? |

Give each request an ID at the entry point and pass it to each part. Without it, logs from different services cannot be connected.

## What to measure

For each service that answers requests, four measurements cover most problems:

- **Rate:** requests each second.
- **Errors:** the share of requests that fail.
- **Duration:** how long requests take, as percentiles.
- **Saturation:** how full the resources are: processor, memory, connections, queue length.

For background work, measure the delay: the age of the oldest item in the queue. For a business flow, measure the business result: orders each minute, payments confirmed. A fall in orders finds faults that no technical signal shows.

## Service levels

| Term | Meaning | Example |
|---|---|---|
| Indicator (SLI) | A measurement of what users experience | The share of redirects that answer in less than 100 milliseconds |
| Objective (SLO) | The target for the indicator | 99.9% each month |
| Agreement (SLA) | A promise to a customer, with a penalty | 99.5%, or the customer gets money back |

An objective makes "available" exact. It also gives an error budget: 99.9% each month permits about 43 minutes of failure. If the budget is used, the team stops new features and works on reliability. If the budget is not used, the team can release faster.

Each added "9" costs much more than the one before it. Select the objective from what users need, not from what sounds good.

## Alerts

- Alert on what users feel: errors, delay, a business result that falls. Do not alert on each technical number.
- Each alert must need an action from a person now. If it does not, it is a report, not an alert.
- Too many alerts are as bad as none, because people stop reading them.

## The silent failure

The most dangerous failure produces no error: a trigger that stopped, a job that no longer runs, a queue that nobody reads. "No events" looks the same as "all is well". Protect against it with a signal that must arrive: a [canary check](/glossary#canary), or an alert when an expected event does not occur. The Agent Triggers worked example has a full section on this.

## Further reading

- [Service level objectives](https://sre.google/sre-book/service-level-objectives/) and [Monitoring distributed systems](https://sre.google/sre-book/monitoring-distributed-systems/), from the Google SRE book
