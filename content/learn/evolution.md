## Architecture is never finished

Katas start from an empty page. Real work almost never does. Most of the work of a senior architect is to change a system that is in use, with a team that also delivers features, and with no permission to stop for a year. The Waiting Room kata has this shape: 120 clinics move to a new system, one at a time, over two years.

## Never plan a full rewrite as one step

A rewrite that replaces everything on one day has a long period with cost and no value, a moving target, and one very dangerous day at the end. Prefer a change in small steps, where each step is in production and can be reversed.

## The strangler fig

The standard pattern for a replacement in steps:

1. Put a layer in front of the old system that can send each request to the old or the new system.
2. Build one small function in the new system.
3. Send the requests for that function to the new system. Keep the old path for a quick return.
4. Repeat, function by function.
5. Remove the old system when nothing uses it.

The hard part is the data. While both systems run, each piece of data needs one owner, and the other system needs a copy that is kept current. Decide this for each step, not once at the start.

## Other techniques for change in steps

| Technique | Use |
|---|---|
| Branch by abstraction | Put an interface in front of the part to replace. Build the new part behind it, and switch |
| Parallel run | Run old and new with the same input, and compare the results before you trust the new one |
| Expand and contract | Add the new structure, move the users of it, then remove the old structure. See [Deployment and release](/learn/deployment) |
| Feature flags | Switch on the new path for a few users first |

## Fitness functions

An architecture decays when nobody checks it. A fitness function is an automatic check of an architecture rule, run with the tests:

- No module reads the tables of another module.
- The order page answers in less than 300 milliseconds in the performance test.
- No service has a dependency on the layer above it.

A rule that is only in a document is broken in months. A rule that fails the build stays.

## Technical debt

Technical debt is a shortcut that costs more work later. Some debt is a good decision: it buys speed when speed matters. Treat it like a loan:

- Take it deliberately, and write it down. See [Architecture decision records](/learn/decision-records).
- Know the interest: what does it cost each month?
- Pay back the debt in the parts that change often. Debt in code that nobody touches costs nothing.

## How to argue for a change

"The architecture is bad" gets no budget. Connect the change to a result the business cares about: "Each new partner takes six weeks, because of X. After this change, it takes one." See [Teams and communication](/learn/teams).

## Further reading

- [Strangler fig application](https://martinfowler.com/bliki/StranglerFigApplication.html), by Martin Fowler
- [Technical debt](https://en.wikipedia.org/wiki/Technical_debt) on Wikipedia
