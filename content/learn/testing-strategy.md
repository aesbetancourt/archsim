## What a testing strategy is

A testing strategy says what you test, at which level, and where: on a laptop, in the pipeline, or in production. Each test gives some confidence and has a cost in time and in upkeep. The strategy buys the most confidence for the least cost.

An architect owns this decision because the structure decides what is easy to test. A service with its own data and clear ports can be tested alone in seconds. A service that shares a database with four others can only be tested with all five running. The second system is slow to change, and no test tool fixes that.

Richards and Ford list **testability** as an architecture characteristic, part of agility with deployability and modularity (Fundamentals of Software Architecture). Newman gives the levels of tests for services (Building Microservices). Accelerate shows that test automation predicts delivery performance.

The examples on this page use a ticket seller. Its order service calls a seat service, a card provider, and an email service.

## Testability as a characteristic

A system is testable when a team can test most of its changes without the rest of the system. That depends on structure more than on tools.

| Structure                                       | Effect on tests                                                 |
| ----------------------------------------------- | --------------------------------------------------------------- |
| Ports for each dependency                       | A test replaces each one with a fake. Tests are fast and exact  |
| Each service owns its data                      | A test starts one database, with only the data it needs         |
| Several services share one database             | A test of one service needs the schema and data of all of them  |
| Long chains of synchronous calls                | A test needs a stub or a real copy of each service in the chain |
| Time, random numbers, and IDs come from outside | A test fixes them, so the result is the same on each run        |

The tools for the first row are on other pages. See [Dependencies and injection](/learn/dependencies#test-doubles) for stubs, fakes, and mocks, and [Hexagonal architecture](/learn/hexagonal) for tests through ports.

Fundamentals names code coverage as a rough process measure of testability. A test with no assertion raises coverage and checks nothing. Use coverage to find code that no test runs, not as proof that the tests are good. See [Measuring characteristics](/learn/measuring-characteristics).

Testability has a scope. Each [architecture quantum](/learn/architecture-quantum) needs its own tests, which a team can run without other quanta. If the tests of one quantum need another quantum to be up, the two are coupled in practice, even if they deploy apart.

## The test pyramid

Mike Cohn drew the test pyramid: many small tests at the bottom, few large tests at the top. Newman adapts it for services with three levels.

| Level      | Scope                                                               | Speed        | When it fails, you know           | Rough number |
| ---------- | ------------------------------------------------------------------- | ------------ | --------------------------------- | ------------ |
| Unit       | One function or class, with doubles                                 | Milliseconds | The exact line                    | Thousands    |
| Service    | One service through its API, others stubbed                         | Seconds      | Which service, and which call     | Hundreds     |
| End-to-end | Several real services, through the user interface or the public API | Minutes      | That something is wrong somewhere | A few dozen  |

The numbers are rough. The rule behind them is firm: the higher the test, the more confidence it gives that the parts work together, and the slower and less exact it is.

### Unit tests

A unit test checks one small part, and it replaces the dependencies of that part with doubles. It runs in milliseconds, so a developer runs thousands of them on each change. Most tests of business rules belong here. For the ticket seller: "a seat on hold for more than 10 minutes becomes free again".

Unit tests check behavior, not the inside of the code. A test that checks which private method ran breaks on each refactor.

### Service tests

A service test checks one service through its API. The real database runs, often in a container. Every other service is replaced by a stub that the test controls.

```diagram
{
  "nodes": [
    { "id": "test", "label": "Service test", "shape": "actor", "col": 0, "row": 0.6 },
    { "id": "order", "label": "Order service\n(real code)", "shape": "box", "col": 1, "row": 0.6 },
    { "id": "db", "label": "Orders database\n(real, in a container)", "shape": "store", "col": 2, "row": 0 },
    { "id": "seat", "label": "Seat service\n(stub)", "shape": "external", "col": 2, "row": 1.2 },
    { "id": "card", "label": "Card provider\n(stub)", "shape": "external", "col": 3, "row": 0.6 }
  ],
  "groups": [{ "id": "scope", "label": "What the test checks", "col": 1, "row": 0, "cols": 2, "rows": 1 }],
  "edges": [
    { "from": "test", "to": "order", "label": "HTTP" },
    { "from": "order", "to": "db", "label": "SQL" },
    { "from": "order", "to": "seat", "label": "fixed answers" },
    { "from": "order", "to": "card", "label": "fixed answers" }
  ]
}
```

The stubs make the test fast and stable. They also let the test create cases that are hard to get from a real service: the seat is gone, the card is refused, the provider times out. The risk is that a stub drifts from the real service. Contract tests, below, close that gap.

### End-to-end tests

An end-to-end test runs the real services together and acts like a user. It buys a ticket through the web page and checks that an email arrives. It gives the most confidence that the parts fit. It also has the most problems, which have their own section below.

## The limits of the pyramid

The pyramid is a heuristic, not a law. Other shapes, such as the "testing trophy" and the "honeycomb", put more weight on integration and service tests. All agree on one point: many fast tests, few slow ones.

Choose the shape from where the risk is:

- A service with rich rules, such as pricing or seat allocation, needs many unit tests.
- A thin service that maps HTTP to SQL has little logic. Most of its risk is in the database queries, so service tests give more value.
- A system with many teams has most of its risk at the boundaries. Contract tests matter most there.

The pyramid also leaves out exploratory, usability, and performance tests. Newman uses the testing quadrants of Brian Marick to show these other kinds.

## The problems of end-to-end tests

Newman spends a large part of his testing chapter on end-to-end tests. They look like the safest tests. In a system with many services, they often become the most expensive part of delivery.

### Flaky tests

A flaky test fails sometimes for reasons that are not a fault in the code: a timeout, a network error, data from an earlier test, a service that started late. The more services a test touches, the more causes of failure it has.

A flaky test is worse than no test. The team learns to run the suite again until it passes. Soon a real failure gets the same treatment. When a test is flaky, fix it at once or remove it from the gate. Martin Fowler's article on non-determinism in tests lists the usual causes and fixes.

### Brittle tests

A brittle test breaks when something it does not care about changes. A test of the purchase flow fails because a button moved, or because the email service changed a field the test never needed. Each brittle test costs time from a team that did nothing wrong.

### Who owns them

An end-to-end test covers the work of many teams. Three common owners:

| Owner                         | What occurs                                                          |
| ----------------------------- | -------------------------------------------------------------------- |
| Nobody                        | Tests fail, nobody fixes them, and the suite decays                  |
| A separate test team          | Developers get feedback late, from people who do not know their code |
| Shared, each team contributes | Works best, but needs agreed rules for adding and fixing tests       |

Newman argues against a separate team that writes tests for others. The people who write the code must feel the pain of a broken test.

### Slow feedback and the pile-up

A suite that takes an hour runs a few times each day, so each run holds many changes. When it fails, nobody knows which change caused it.

### The metaversion

Newman warns about a subtle effect. When the team tests all services together at fixed versions, people start to think of the whole set as one version: "release 4.2 of the platform". Next, they deploy the set together, because that is what they tested. Independent deployment is gone, and the system is a [distributed monolith](/learn/distributed).

### What to do instead

1. Keep a few end-to-end tests for the journeys that matter most to the business. For the ticket seller: find a show, hold a seat, pay, get the ticket.
2. Do not add an end-to-end test for each new story. Test a story at the lowest level that can show it works.
3. Move the checks of how services fit together to consumer-driven contracts.
4. Move the checks of the full flow to production, with synthetic transactions and canaries.

## Consumer-driven contracts

A contract test checks that two services agree about the shape and meaning of their calls. In a **consumer-driven contract**, the caller writes down what it needs, and the provider runs that as a test in its own build. [API design](/learn/api-design) introduces the idea. This section shows how it works.

Pact is the common tool. The steps for the order service, which calls the seat service:

1. The order team writes a consumer test. The test starts a Pact mock server, which acts as the seat service. It states one interaction: "given that seat A12 is free, a hold request returns `201` with a hold ID".
2. The test runs the real order client against the mock. When it passes, Pact writes a contract file in JSON with all such interactions.
3. The order build publishes the contract to a shared store, the Pact Broker.
4. The seat build fetches all contracts that name it. It replays each request against the real seat service. A **provider state** sets up the data, for example "seat A12 is free".
5. The seat build publishes the result to the broker.
6. Before each deployment, the pipeline asks the broker if this version is compatible with the versions in production. The Pact command for this is `can-i-deploy`.

```diagram
{
  "nodes": [
    { "id": "consumer", "label": "Order build\n(consumer test)", "shape": "box", "col": 0, "row": 0 },
    { "id": "mock", "label": "Pact mock\n(acts as seat service)", "shape": "external", "col": 0, "row": 1.2 },
    { "id": "broker", "label": "Pact Broker\n(contracts, results)", "shape": "store", "col": 1.5, "row": 0 },
    { "id": "provider", "label": "Seat build\n(real service)", "shape": "box", "col": 3, "row": 0 },
    { "id": "deploy", "label": "Deploy step\n(can-i-deploy)", "shape": "box", "col": 1.5, "row": 1.2 }
  ],
  "edges": [
    { "from": "consumer", "to": "mock", "label": "test calls" },
    { "from": "consumer", "to": "broker", "label": "publish contract" },
    { "from": "broker", "to": "provider", "label": "fetch and replay" },
    { "from": "provider", "to": "broker", "label": "publish result" },
    { "from": "deploy", "to": "broker", "label": "compatible?" }
  ]
}
```

What this gives you:

- The seat team learns that a change breaks the order service before release, in its own build, in minutes.
- Each service is tested alone. No shared test environment is necessary.
- The contract shows the seat team exactly which fields each caller uses. A field that no contract names can change.

What it does not give you:

- It checks the examples in the contract, not every possible request.
- It does not check performance, or what occurs when the provider is down.
- It works only if the consumer team writes good contracts and the provider team runs them in each build.

For events on a message broker, the same idea applies to messages. A schema registry that rejects incompatible schemas is a simpler form of it. See [Encoding and evolution](/learn/encoding-and-evolution).

## Testing in production

No test environment is the same as production: the data, the load, and the users differ. So some faults reach production whatever you do. Newman concludes that a team must also invest in the mean time to repair, not only in the mean time between failures.

| Method                | How it works                                                                | What it finds                                   |
| --------------------- | --------------------------------------------------------------------------- | ----------------------------------------------- |
| Smoke test            | A few checks right after a deployment, before traffic arrives               | A version that does not start or cannot connect |
| Synthetic transaction | A fake user action that runs all the time, with a test account              | A broken flow, even when no real user is active |
| Canary release        | A small share of real traffic goes to the new version, and you compare      | Faults that appear only with real data and load |
| Parallel run          | Old and new code handle the same request. Users get the old answer          | A difference in an important calculation        |
| A/B test              | Two versions run for two groups of users, and you compare a business result | Which version the users prefer, not if it works |
| Chaos engineering     | You cause a controlled failure and watch the response                       | Recovery paths that do not work                 |

A synthetic transaction is what Newman calls semantic monitoring. See [Observability](/learn/observability). Canaries and parallel runs are on the [Deployment](/learn/deployment#release-strategies) page. Chaos engineering is on the [Resilience](/learn/resilience) page.

Tests in production need rules, or they cause harm:

- Mark each test account and each test order clearly in the data.
- Never charge a real card or send a real email from a test. Use a test mode of the provider.
- Exclude test data from reports and from analytics. A synthetic order every minute is 1,440 false sales each day. See [Analytical data](/learn/analytical-data).
- Remove or expire the data that tests create, so it does not grow.

## Separate deployment from release

Testing in production is safe only when deployment and release are separate steps. New code goes to production switched off. The team then switches it on for staff, then for a small share of users, then for all. See [Deploy and release are different](/learn/deployment#deploy-and-release-are-different).

This separation changes the testing strategy. The team does not have to prove that a function is perfect before deployment. It must prove that the function is safe to deploy while it is off. The test of the function itself then continues with real users, in small and controlled steps.

## Cross-functional tests

Newman calls the tests of qualities such as speed and robustness **cross-functional tests**. He prefers this name to "nonfunctional", because these qualities are part of what the system must do. Each one maps to an architecture characteristic.

### Performance tests

A load test sends a known load and measures latency and errors. Rules that make the result useful:

- Use realistic data volumes. A query that is fast on 1,000 rows can be slow on 50 million.
- Use a realistic mix of requests, from production logs if possible.
- Compare the result with the [service level objectives](/learn/observability), not with a feeling. A test with a limit that fails the build is a [fitness function](/learn/measuring-characteristics#fitness-functions).
- Run the test often, for example each night, and watch the trend. A slow decline is hard to see in one run.

A **soak test** runs a normal load for many hours. It finds memory leaks, connection leaks, and disks that fill. These are the faults of the steady state pattern in [Resilience](/learn/resilience).

### Robustness tests and test harnesses

Normal tests use a remote part that works. Production has remote parts that fail in strange ways. Nygard's answer is a **test harness**: a fake remote part that misbehaves on purpose (Release It!, the part on stability patterns).

A harness for the card provider can act out each of these:

| Behavior                                 | What it tests in the caller                        |
| ---------------------------------------- | -------------------------------------------------- |
| Refuses the connection                   | The error path, and the circuit breaker            |
| Accepts the connection and never answers | The read timeout                                   |
| Sends one byte every 30 seconds          | A timeout on the whole call, not only on each read |
| Returns an answer of 2 GB                | A limit on the size of the answer                  |
| Returns HTML instead of JSON             | The parsing of errors                              |
| Returns `200` with an error in the body  | The checks of the meaning of the answer            |
| Closes the connection halfway            | Retries, and operations that are safe to repeat    |

A normal integration test cannot create these cases, because the real provider in a test environment behaves well. The harness makes each failure repeatable. Each integration point must survive each behavior before it goes to production. See [Stability antipatterns](/learn/stability-antipatterns) for the failures this prevents.

## Test automation as a capability

Accelerate lists test automation as one of the capabilities of continuous delivery. Its findings about tests are specific:

- Tests must be reliable. A suite that fails at random is ignored, and gives no safety.
- Developers must create and maintain the acceptance tests, and run them on their own machines. Automated tests that only a separate QA group or an outside company writes did not predict better delivery performance.
- The tests run on each commit, as part of continuous integration.
- Test data management is a capability of its own. A team needs enough test data, and must be able to create it on demand.

Testers still have a role, for example in exploratory testing. But the main suite belongs to the people who change the code. See [Delivery performance](/learn/delivery-performance) for the full list of capabilities.

## Failure modes

| Failure                          | What occurs                                              | Fix                                                               |
| -------------------------------- | -------------------------------------------------------- | ----------------------------------------------------------------- |
| An ice-cream cone                | Few unit tests, many manual and end-to-end tests         | Move each check to the lowest level that can show it              |
| One shared test environment      | Teams wait for each other, and one bad deploy blocks all | Service tests with stubs, and contract tests                      |
| Mocks for everything             | Tests pass, and the parts do not fit together            | Fakes with adapter contract tests, and contracts between services |
| End-to-end gate across all teams | The metaversion, and coupled releases                    | A few journeys, plus contracts and canaries                       |

## In a kata

Put a short testing part in the design, next to deployment. Name:

1. The levels you use for each kind of service, and why.
2. How services are tested alone: stubs, and consumer-driven contracts at each boundary between teams.
3. The few journeys that have an end-to-end test or a synthetic transaction.
4. The cross-functional tests that match the driving characteristics.

In the [Front Row kata](/kata/front-row), the seat sale must scale to millions of buyers. Name a load test at that scale, and a test harness for the card provider. In the [Payment System kata](/kata/payment-system), name the harness cases for the provider timeout, and a parallel run for a new ledger calculation.

## Interview questions

**"How do you test a system of 30 microservices?"**

- Most tests are unit and service tests, run in the build of each service.
- Each service is tested alone, with stubs for the services it calls.
- Consumer-driven contracts check each boundary, and block a deploy that breaks a caller.
- A few end-to-end tests for core journeys, plus synthetic transactions and canaries in production.

**"Why not test everything end to end?"**

- They are slow, flaky, and brittle, and the number of causes of failure grows with each service.
- Ownership is unclear, so broken tests stay broken.
- Teams start to test and deploy all services as one version, and lose independent deployment.
- A failure says that something is wrong, not where.

**"What is a consumer-driven contract, and what does it not catch?"**

- The caller writes what it needs. The provider runs it in its own build, against the real code.
- A broker keeps the contracts and the results, and the pipeline checks compatibility before a deploy.
- It does not catch performance problems, provider outages, or cases outside the examples.

**"What does testing in production mean, and how do you make it safe?"**

- Smoke tests, synthetic transactions, canaries, parallel runs, and controlled fault injection.
- Deploy with the function switched off, then release in small steps.
- Mark and exclude test data, and never touch real money or real users.
- Invest in fast detection and fast recovery, because some faults reach production anyway.

## Go deeper

- **Building Microservices**, Sam Newman, the part on testing: the levels of tests, the problems of end-to-end tests and the metaversion, consumer-driven contracts, testing in production, and cross-functional tests.
- **Release It!**, Michael Nygard, the part on stability patterns: the test harness, and why integration tests against healthy systems miss real failures.
- **Accelerate**, Forsgren, Humble, and Kim, the part on technical practices: test automation, test data management, and who must write the tests.
- **Fundamentals of Software Architecture**, Richards and Ford, the parts on architecture characteristics and on measuring them: testability as a characteristic, and its measures.
- **Site Reliability Engineering**, Beyer and others, the part on testing for reliability: tests of configuration, load, and production behavior at Google.

## Further reading

- [The Practical Test Pyramid](https://martinfowler.com/articles/practical-test-pyramid.html), by Ham Vocke, on martinfowler.com
- [Eradicating Non-Determinism in Tests](https://martinfowler.com/articles/nonDeterminism.html), by Martin Fowler
- [Consumer-Driven Contracts](https://martinfowler.com/articles/consumerDrivenContracts.html), by Ian Robinson, on martinfowler.com
- [Pact documentation](https://docs.pact.io/)
- [Testing for Reliability](https://sre.google/sre-book/testing-reliability/), from the Google SRE book
