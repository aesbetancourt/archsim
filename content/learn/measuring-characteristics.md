## Why measure a characteristic

A list of [characteristics](/learn/characteristics) is a good start. "The system must be fast and available" is not yet a decision. Two people read "fast" in two different ways, and nobody can say when the system stops being fast.

An architect turns each important characteristic into a number, and then puts a check on the number. The number makes the requirement exact. The check keeps it true while the team adds features for years.

This page has two halves:

- **Measure**: the three kinds of measure, and how to define each characteristic so that a test can check it.
- **Protect**: fitness functions, the automatic checks that stop a characteristic from decaying.

Richards and Ford give both halves in Fundamentals of Software Architecture. The idea of the fitness function comes from Building Evolutionary Architectures (Ford, Parsons, Kua).

## Explicit and implicit characteristics

Some characteristics are in the requirements. Others are not, but the system fails without them.

| Kind     | Where you find it                            | Ticket seller example                                        |
| -------- | -------------------------------------------- | ------------------------------------------------------------ |
| Explicit | The requirements text says it, in some words | "Popular shows sell out in minutes": elasticity, performance |
| Implicit | Nobody says it. Each user expects it         | Security of card data, availability during an on-sale        |

Explicit characteristics hide in the words of the business. "Sells out in minutes" means a short, very high peak. "A failed sale is front-page news" means high availability at that peak, and no time to recover by hand.

Implicit characteristics are easy to forget, because each stakeholder thinks that they are obvious. Availability, reliability, and security are implicit in almost every system. Write them down when the system needs more than the normal level. A lunch shop needs normal security. A clinic system with health data needs much more, and that changes the design.

Keep the final list short. Richards and Ford advise against a list with each "-ility" on it. Each extra characteristic adds cost and complexity to the design. Select the few that drive the structure, usually three to seven, and name the top three.

## Three kinds of measure

Fundamentals of Software Architecture puts measures in three groups.

| Kind        | What it measures                    | Examples                                                             | Where you measure            |
| ----------- | ----------------------------------- | -------------------------------------------------------------------- | ---------------------------- |
| Operational | How the running system behaves      | Latency percentiles, requests each second, error rate, uptime        | Load tests, production       |
| Structural  | The shape of the code               | Cyclomatic complexity, cycles between modules, coupling, layer rules | Static analysis in the build |
| Process     | How the team builds and releases it | Test coverage, deploy frequency, time to deploy, failed deploys      | The pipeline and its history |

### Operational measures

Operational measures are the most familiar ones: performance, scalability, availability. Two rules make them useful.

1. **Use percentiles, not averages.** An average hides the slow requests. The p99 is the time that 99% of requests stay below. One slow page in a hundred is many angry users each day.
2. **State the load.** "p99 below 300 ms" means nothing without "at 2,000 orders a minute". A system is fast at low load and slow at the peak.

Some teams also keep a baseline for each measure and flag a value far outside it. This finds a slow drift that no fixed limit catches. See [Observability and service levels](/learn/observability#service-levels) for how a service level objective (SLO) turns an operational measure into a target with an error budget.

### Structural measures: cyclomatic complexity

Structural measures look at the code, not at the running system. They support characteristics such as maintainability, testability, and modularity.

Cyclomatic complexity is the standard example. Thomas McCabe defined it in 1976. It counts the independent paths through a function. For one function, a simple way to count it: start at 1, and add 1 for each decision (each `if`, loop, `case`, `&&`, or `||`).

```ts
function lunchPrice(order: Order): number {
  let total = 0; // start: 1
  for (const item of order.items) {
    // loop: 2
    total += item.price;
    if (item.extraCheese) total += 1; // if: 3
  }
  if (order.loyaltyCard && total > 20) total *= 0.9; // if: 4, &&: 5
  return total;
}
```

This function has a complexity of 5. The formal definition uses the graph of the code: edges minus nodes plus 2.

What the number tells you:

- Each path needs at least one test. A function with a complexity of 30 is hard to test well.
- A high value usually means a function that does too many things.
- A common rule of thumb, from McCabe, is a limit of about 10 for each function. Teams set their own limit, often lower.

A structural measure is cheap. It runs on each build, it is exact, and it needs no production traffic. Other structural measures are in [Modularity, cohesion, and coupling](/learn/modularity): LCOM, afferent and efferent coupling, and the distance from the main sequence.

### Process measures

Process measures cover characteristics that describe the team, not the code: agility, deployability, testability.

- **Testability**: test coverage, and the time the test suite takes.
- **Deployability**: how often the team deploys, how long a deploy takes, and the share of deploys that fail.
- **Agility**: a composite. Break it into the parts above.

The four key metrics of Accelerate (Forsgren, Humble, Kim) are process measures of this kind. See [Delivery performance](/learn/delivery-performance).

## Make the definition exact

Many characteristics are composites. "Agility" or "reliability" is not one number. Break each one into parts that you can measure, and give each part a target.

| Vague statement          | Exact definition                                                                   |
| ------------------------ | ---------------------------------------------------------------------------------- |
| The site is fast         | Seat map loads with p99 below 800 ms at 50,000 buyers online                       |
| The system is available  | 99.95% of checkout requests succeed in each 30-day window                          |
| The code is maintainable | No function above complexity 10. No cycles between modules                         |
| The team is agile        | Deploy each day. A deploy takes less than 15 minutes. Less than 5% of deploys fail |

Agree on the definitions with the team and the business. A number that only the architect knows does not change a decision. Record it in an [architecture decision record](/learn/decision-records).

## Fitness functions

A fitness function is any automatic or repeatable check that gives an objective answer about one architecture characteristic. The name comes from evolutionary computing, where a fitness function scores how close a solution is to the goal. In architecture, it scores how close the system is to the characteristics it must have.

Fitness functions are a tool of governance. Governance here means the work to keep the system in line with the architecture decisions. Without a check, each decision decays. A developer under time pressure adds one import across a layer. Nothing fails, so the next developer does the same. In a year, the layers exist only in the diagram.

A fitness function makes the rule part of the build. The architect does not have to review each change by hand.

Building Evolutionary Architectures sorts fitness functions on several axes. The most useful:

| Axis             | One end                                        | Other end                                                                                      |
| ---------------- | ---------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| Scope            | **Atomic**: one characteristic, one part       | **Holistic**: several characteristics together, for example latency while a security scan runs |
| When it runs     | **Triggered**: on a commit, a build, a release | **Continual**: all the time, in production                                                     |
| What it looks at | **Static**: the code or the configuration      | **Dynamic**: the running system                                                                |

A test in the build is atomic, triggered, and static. A monitor that alerts when the p99 goes up is atomic, continual, and dynamic. A tool that stops random servers in production, as Netflix did with Chaos Monkey, is a holistic, continual check of resilience.

## Examples of fitness functions

### No cycles between modules

A cycle means two modules depend on each other. Neither one can change, test, or deploy alone. A cycle check is one of the cheapest and most useful fitness functions.

In Java, ArchUnit writes the rule as a unit test:

```java
@Test
void modulesHaveNoCycles() {
    slices().matching("com.parcels.(*)..").should().beFreeOfCycles()
        .check(new ClassFileImporter().importPackages("com.parcels"));
}
```

In TypeScript, a tool such as dependency-cruiser does the same job with a rule in its configuration.

### Layer rules

A layer rule says which part can depend on which. For example: the domain code must not import the web code. Here it is as a dependency-cruiser rule:

```json
{
  "forbidden": [
    {
      "name": "domain-not-to-web",
      "severity": "error",
      "from": { "path": "^src/domain" },
      "to": { "path": "^src/web" }
    }
  ]
}
```

The same kind of rule protects a [modular monolith](/learn/modular-monolith): no module imports the internals of another module. See [Managing dependencies](/learn/dependencies) for the direction of dependencies inside one application.

### Latency

A latency check runs in a load test in the pipeline. The build fails when the p99 goes above the target. Here is the target as a threshold in the k6 load test tool:

```js
export const options = {
  thresholds: { http_req_duration: ["p(99)<300"] },
};
```

A load test in the pipeline is a triggered check. Pair it with a continual check in production: an SLO with an alert on the error budget. The test finds a slow change before release. The SLO finds slow behavior that only real traffic shows.

### Other common examples

- **Security**: a scan of dependencies for known weaknesses on each build.
- **Data ownership**: no service reads the tables of another service. A check can compare the database users with the tables they touch.
- **Resilience**: a scheduled test that stops one copy of a service and checks that requests still succeed.
- **Deployability**: an alert when the time from commit to production goes above a limit.

## How to introduce fitness functions

1. Start with the top three characteristics. Write one fitness function for each.
2. Make each failure explain the rule and the reason. "Domain code must not import web code, see ADR 12" teaches. "Rule 7 failed" annoys.
3. Run the checks in the same build as the tests. A check in a separate report gets ignored.
4. Agree on the rules with the developers. A rule that the team does not accept turns into a list of exceptions.
5. Review the set from time to time. Remove checks for decisions that changed.

Fitness functions also make change safer. When the team changes the architecture, the checks show at once what the change breaks. This is the link to [Evolution and change in steps](/learn/evolution#fitness-functions): an architecture can change often only when its important rules are checked.

## Scope characteristics per quantum

A system does not have to have one set of characteristics. An architecture quantum is a part that deploys alone, with its own data, and with no synchronous dependency on the other parts. Each quantum can have its own characteristics.

In the ticket seller, the seat sale must scale to 2 million buyers and never sell one seat twice. The promoter tools serve a few hundred users. If both are in one quantum, the whole system must meet the strictest target. If they are separate quanta, only the seat sale pays for that target.

So write the characteristics for each quantum, not once for the whole system. The fitness functions follow the same scope. See [Architecture quanta](/learn/architecture-quantum).

## Failure modes

- **Measure what is easy, not what matters.** Test coverage is easy to count. It does not show if the tests check anything. Goodhart's law applies: a measure that becomes a target stops being a good measure.
- **Averages.** An average latency of 100 ms can hide a p99 of 4 seconds.
- **A number with no load.** A latency target with no load stated passes on a quiet test machine and fails at the peak.
- **Flaky checks.** A load test that fails at random teaches the team to ignore red builds. Make it stable, or move it out of the blocking path.
- **Too many characteristics.** Each one costs design effort and checks. A list of fifteen means no clear priority.
- **A rule only in a document.** It is broken in months. A rule that fails the build stays.

## In a kata

In step 1 of the [method](/learn/method), you find the characteristics. Go one step further:

1. For each of the top three, write one exact definition with a number and a load.
2. Mark each one as explicit (from the text) or implicit (your addition). Say why you added each implicit one.
3. If parts of the system need different characteristics, say which quantum each one belongs to.
4. Name one fitness function for each of the top three.

In [Front Row](/kata/front-row), a strong answer says: "Seat holds: p99 below 200 ms at 2 million buyers, checked by a load test before each on-sale. No seat sold twice: checked by a test that runs many buyers against one seat."

## Interview questions

**"How do you know if your design meets its performance requirement?"**

- Turn "fast" into a percentile target at a stated load.
- Check it twice: a load test in the pipeline, and an SLO in production.
- Name the error budget, and what the team does when it runs out.

**"What is a fitness function? Give an example."**

- An automatic check of one architecture characteristic.
- Examples: no cycles between modules, a layer rule, a p99 threshold in a load test.
- It is how the architect governs the system without a review of each change by hand.

**"How do you stop an architecture from decaying over time?"**

- Write the important rules as fitness functions in the build.
- Make each failure explain the rule.
- Watch structural measures over time: complexity, cycles, coupling.
- Review the rules when decisions change, and record the decisions in ADRs.

**"Which characteristics are implicit in most systems?"**

- Availability, reliability, and security.
- The requirements rarely state them, but the system fails without them.
- State them when the system needs more than a normal level, for example for health or payment data.

**"Do all parts of a system need the same availability?"**

- No. Scope the characteristics per quantum.
- Only the parts that need a strict target pay for it.
- This is a main reason to split a system into separate deployments.

## Go deeper

- **Fundamentals of Software Architecture** (Richards, Ford), the parts on identifying, measuring, and governing characteristics: explicit and implicit characteristics, the three kinds of measure, and fitness functions for governance.
- **Software Architecture: The Hard Parts** (Ford and others), the part on architecture quanta: how to scope characteristics to one quantum.
- **Site Reliability Engineering** (Beyer and others), the part on service level objectives: how to turn availability and latency into targets with an error budget.
- **Accelerate** (Forsgren, Humble, Kim), the part on measuring delivery: four process measures that predict the results of a team.

## Further reading

- [Cyclomatic complexity](https://en.wikipedia.org/wiki/Cyclomatic_complexity) and [Goodhart's law](https://en.wikipedia.org/wiki/Goodhart%27s_law) on Wikipedia
- [ArchUnit](https://www.archunit.org/), a library for architecture tests in Java
- [Service level objectives](https://sre.google/sre-book/service-level-objectives/), from the Google SRE book
