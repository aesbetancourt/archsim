## Why an architect cares

How often and how safely a team can release is a quality of the architecture. A system that can only be released as a whole, at night, with all teams present, is slow to change, and that is a structural problem. The characteristic is called deployability. See [Architecture characteristics](/learn/characteristics).

The structure decides what a deployment can be. If two services share a database table, a change to the table needs both services at once. If a library is shared by ten services, a fix in it needs ten releases. Independent deployment is the main promise of [microservices](/learn/microservices). Sam Newman puts it at the center of his book: a team must be able to change and deploy one service without a change to any other (Building Microservices, the part on independent deployability).

Small, frequent releases are safer than large, rare ones. A small change has fewer ways to fail, and when it fails, the cause is easy to find. To measure how well a team delivers, see [Delivery performance](/learn/delivery-performance). That page covers the four measures from Accelerate. This page covers the mechanisms.

## Deploy and release are different

- **Deploy:** put new code on the servers.
- **Release:** make a new function available to users.

When these are separate, each one is less dangerous. Code can be in production, switched off, for days.

The separation lets a team deploy many times each day with no effect on users. The team then releases each function when the business is ready: to staff first, then to one city, then to all. A failed deployment is a technical event. A failed release is a business event. Keeping them apart means that each one can be undone with its own tool.

## Principles of deployment

Newman names five principles for the deployment of services (Building Microservices, the part on deployment). They apply to any system with more than one deployment unit.

| Principle                | Meaning                                                          | What breaks without it                              |
| ------------------------ | ---------------------------------------------------------------- | --------------------------------------------------- |
| Isolated execution       | Each service runs in its own environment, with its own resources | One service uses all memory, and its neighbors fail |
| Focus on automation      | Each step from commit to production runs with no manual work     | Releases become rare, slow, and different each time |
| Infrastructure as code   | The environment is described in files under version control      | Nobody knows how to build the server again          |
| Zero-downtime deployment | A release causes no outage for users                             | Releases wait for the night, so they become large   |
| Desired state management | You declare what must run, and a platform keeps it so            | A crashed copy stays down until somebody notices    |

Isolated execution has degrees. Several services on one machine share its faults. A virtual machine for each service isolates well but costs more. A container gives most of the isolation at a lower cost. Most teams today run containers on a platform such as Kubernetes, which also gives desired state management: you say "run three copies", and the platform replaces a copy that fails.

Zero-downtime deployment is the principle with the largest effect on the design. When a release has no outage, the team can release in work hours, when people are available to watch. Then releases can be small and frequent.

## The pipeline

A change goes from a developer to production through automatic steps: build, tests, security checks, deployment to a test environment, deployment to production. This is continuous integration and continuous delivery (CI/CD). The architect makes sure that each deployment unit can go through this pipeline alone.

```diagram
{
  "nodes": [
    { "id": "dev", "label": "Developer", "shape": "person", "col": 0, "row": 0 },
    { "id": "build", "label": "Build\nand fast tests", "shape": "box", "col": 1, "row": 0 },
    { "id": "registry", "label": "Artifact registry\n(one image, tagged)", "shape": "store", "col": 2, "row": 0 },
    { "id": "test", "label": "Test environment\n(slower tests)", "shape": "box", "col": 3, "row": 0 },
    { "id": "canary", "label": "Canary\n(5% of traffic)", "shape": "box", "col": 3, "row": 1.2 },
    { "id": "prod", "label": "Production\n(all traffic)", "shape": "box", "col": 2, "row": 1.2 },
    { "id": "metrics", "label": "Metrics\nand SLOs", "shape": "store", "col": 1, "row": 1.2 }
  ],
  "edges": [
    { "from": "dev", "to": "build", "label": "commit" },
    { "from": "build", "to": "registry", "label": "push" },
    { "from": "registry", "to": "test", "label": "deploy" },
    { "from": "test", "to": "canary", "label": "tests pass" },
    { "from": "canary", "to": "metrics", "label": "compare", "async": true },
    { "from": "canary", "to": "prod", "label": "healthy" }
  ]
}
```

Rules that keep a pipeline trustworthy:

- **Build once.** The pipeline builds one artifact, such as a container image, and deploys that same artifact to each environment. A rebuild for production can produce something different from what you tested.
- **Keep configuration out of the artifact.** Each environment gives its own settings and secrets when the artifact starts.
- **Put fast tests first.** Tests that finish in minutes run on each commit. Slow tests run later, on fewer builds.
- **One pipeline for each deployment unit.** A pipeline that builds all services together brings back the coupled release.
- **Integrate often.** Developers merge small changes into the main branch at least once each day. Long-lived branches hide conflicts until the merge.

### Release engineering

Google treats the pipeline as a discipline of its own, release engineering (Site Reliability Engineering, the part on release engineering). The SRE book lists a few aims:

- **Self-service.** Each team releases on its own schedule, with no central release team as a bottleneck.
- **High velocity.** Frequent releases with few changes in each, so that a fault is easy to find.
- **Hermetic builds.** A build depends only on known, fixed versions of its inputs. The same inputs always give the same result.
- **Enforced policies.** The pipeline itself checks the rules, for example a code review for each change.

Configuration is code too. A bad configuration change causes outages as often as a bad code change. Send configuration through the same review and the same gradual rollout.

## Release strategies

| Strategy     | How it works                                                           | Good at                                     | Cost                                            |
| ------------ | ---------------------------------------------------------------------- | ------------------------------------------- | ----------------------------------------------- |
| Rolling      | Replace the copies a few at a time                                     | Simple, no extra machines                   | Two versions run together for a while           |
| Blue-green   | Start a full second environment, then move all traffic to it           | Immediate return to the old version         | Double the machines during the release          |
| Canary       | Send a small share of users to the new version, and watch              | Finds problems with few users affected      | Needs good [measurements](/learn/observability) |
| Feature flag | New code is deployed switched off, then switched on for selected users | Release with no deployment, fast switch-off | Flags must be removed later, or they pile up    |

### Canarying

A canary release sends a small share of traffic to the new version and compares it with the old version. The SRE Workbook gives the method in detail (the part on canarying releases). The main points:

1. **Compare with a control group.** Run the old version on a group of the same size, at the same time. Compare the canary with the control, not with yesterday. Traffic changes during a day, so a comparison with yesterday misleads.
2. **Choose a few metrics.** Use the SLIs of the service: error rate, latency, and perhaps one business result. Too many metrics give false alarms.
3. **Keep the canary small and short.** A few percent of traffic, for long enough to see a difference. A canary that runs for days delays every other release.
4. **Automate the decision.** If the canary is worse than the control by more than a set margin, the pipeline stops the release and moves the traffic back.

A canary catches faults that tests miss: a slow query on real data, a memory leak under real load, a client that sends something unexpected. It cannot catch a fault that appears only at full load, or only after hours.

### Progressive delivery

Progressive delivery is the name for a release that grows in steps, with a check at each step. Newman uses the term for the family of methods that includes canaries and feature flags (Building Microservices, the part on deployment). A typical plan:

1. Deploy the new version with the function switched off.
2. Switch it on for staff.
3. Switch it on for 1% of users, then 10%, then 50%, with a check of the SLIs at each step.
4. Switch it on for all users.
5. Remove the flag and the old code path.

Step 5 is the one teams forget. Each flag that stays doubles the number of paths through the code. Give each release flag an owner and an end date.

A **parallel run** is another form. Both the old and the new implementation handle the same real request. Users get the old answer. The team compares the two answers. Use it to replace an important calculation, such as a price or a tax amount.

## What every strategy requires

During a release, the old version and the new version run at the same moment. This puts rules on the design:

- **The database must work with both versions.** Change it in steps: first add the new column, then deploy code that uses it, then remove the old column in a later release. Never rename in one step.
- **APIs and messages must be compatible.** See [API design and contracts](/learn/api-design) and [Encoding and evolution](/learn/encoding-and-evolution).
- **A return to the old version must be possible.** If a release changes data in a way the old code cannot read, you cannot go back.
- **Each copy must be ready before it gets traffic.** A readiness check tells the load balancer when a new copy can take requests. A copy that is stopped must finish its current requests first.

## Database changes: expand and contract

A database change is the most difficult part of a release with no downtime. The code can go back in a minute. The data often cannot. The expand and contract pattern, also called parallel change, splits one breaking change into several safe ones.

Example: in a tutor marketplace, the `tutors` table has a column `phone`. The team wants a column `mobile_phone` and a column `landline` in its place.

1. **Expand.** Add the new columns. Allow empty values. The old code ignores them.
2. **Write to both.** Deploy code that writes to the old column and to the new columns. It still reads the old column.
3. **Copy the old data.** Run a background job that fills the new columns for old rows. Run it in small batches, so it does not lock the table.
4. **Read from the new columns.** Deploy code that reads the new columns. It still writes both, so a return to step 2 is safe.
5. **Stop writing the old column.** Deploy code that uses only the new columns.
6. **Contract.** Remove the old column, in a later release, when no running code uses it.

Each step is a separate release, and each one can be undone. The cost is time: a rename becomes a week of small releases. That cost is small against an outage or a lost column.

The same pattern works for an API field, a message format, or a service that replaces another one.

## Rollback and roll forward

When a release is bad, a team has two choices.

| Choice       | What you do                            | Good when                                       |
| ------------ | -------------------------------------- | ----------------------------------------------- |
| Roll back    | Deploy the previous version again      | The fault is serious and the cause is not clear |
| Roll forward | Fix the fault and deploy a new version | The fix is small and the pipeline is fast       |
| Switch off   | Turn off the feature flag              | The fault is inside a function behind a flag    |

Make rollback the default first action. It is fast, and it needs no diagnosis. It works only if the data and the contracts are still compatible with the old version, which is the reason for expand and contract.

## Infrastructure as code

Servers, networks, and settings are described in files that are kept with the code and applied automatically. An environment can then be created again, exactly, and each change has a history. An environment that somebody configured by hand cannot be trusted or repeated.

Two styles exist:

- **Declarative.** You describe the end state: "three servers of this size, behind this load balancer". A tool such as Terraform or a Kubernetes controller calculates the steps. Most teams prefer this style.
- **Imperative.** You write the steps: "create a server, then install this, then start that". It is easier to start with but harder to repeat safely.

Infrastructure as code also enables immutable infrastructure. You never change a running server. To change it, you build a new one from the files and remove the old one. Drift, the slow difference between servers that must be the same, then cannot occur.

GitOps is a variant: the files in a repository are the only source of truth, and an agent keeps the environment equal to them.

## In a design discussion

Useful questions for any design: Can each part be released alone? How long from a finished change to production? What do we do when a release is bad, and how long does that take?

Further questions that show experience:

- Which changes need two parts to release together? That is coupling to remove.
- How does a database change reach production with no downtime?
- How does the team know that a canary is healthy? Which SLIs decide?
- Who can release, and does a release need another team?

## In a kata

Add one short part on delivery to the design:

1. Name the deployment units, and show that each one can be released alone.
2. Choose a release strategy for each, with a reason. A payment flow gets a canary and feature flags. An internal report gets a rolling release.
3. Name the one change that is most difficult to release safely, often a data change, and show its expand and contract steps.

In the [Gavel kata](/kata/gavel), auctions occur a few times each month. Never release during an auction. Release between auctions, when traffic is near zero.

## Interview questions

**"How do you deploy this with no downtime?"**

- A rolling or blue-green release, with readiness checks.
- Old and new versions must run together, so contracts stay compatible.
- Database changes use expand and contract.
- The previous version stays ready for a fast rollback.

**"What is the difference between deploy and release?"**

- Deploy puts code on servers. Release makes a function available.
- Feature flags keep them apart.
- Each one then has its own way back.

**"How do you know that a canary is safe to promote?"**

- Compare it with a control group of the same size, at the same time.
- Use a few SLIs: errors, latency, a business result.
- Let the pipeline decide automatically against a set margin.

**"You must rename a column in a large table. Describe the steps."**

- Add the new column, write to both, copy the old data in batches.
- Switch reads, stop writes to the old column, then remove it later.
- Each step is a separate release that you can undo.

**"Two services must always deploy together. What does that tell you?"**

- They are coupled, through a shared database, a shared library, or a contract with no versions.
- Find the shared part and remove it, or merge the two services into one.
- See [Service granularity](/learn/service-granularity).

## Go deeper

- **Building Microservices** (Sam Newman), the part on deployment: the five principles, containers, desired state, and progressive delivery.
- **Site Reliability Engineering** (Beyer and others), the part on release engineering: hermetic builds, self-service releases, and configuration as code.
- **The Site Reliability Workbook** (Beyer and others), the part on canarying releases: control groups, metric choice, and automatic decisions.
- **Accelerate** (Forsgren, Humble, Kim): the evidence that frequent, small releases go with stability. See [Delivery performance](/learn/delivery-performance).
- **Release It!** (Michael Nygard), the part on deployment: releases with no downtime and the problems of data migration.

## Further reading

- [Blue-green deployment](https://martinfowler.com/bliki/BlueGreenDeployment.html), [Canary release](https://martinfowler.com/bliki/CanaryRelease.html), and [Feature toggles](https://martinfowler.com/articles/feature-toggles.html), on martinfowler.com
- [Parallel change](https://martinfowler.com/bliki/ParallelChange.html), on martinfowler.com: the expand and contract pattern
- [Release engineering](https://sre.google/sre-book/release-engineering/), from the Google SRE book
- [Canarying releases](https://sre.google/workbook/canarying-releases/), from the Google SRE Workbook
