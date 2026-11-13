## Why an architect cares

How often and how safely a team can release is a quality of the architecture. A system that can only be released as a whole, at night, with all teams present, is slow to change, and that is a structural problem. The characteristic is called deployability. See [Architecture characteristics](/learn/characteristics).

## Deploy and release are different

- **Deploy:** put new code on the servers.
- **Release:** make a new function available to users.

When these are separate, each one is less dangerous. Code can be in production, switched off, for days.

## The pipeline

A change goes from a developer to production through automatic steps: build, tests, security checks, deployment to a test environment, deployment to production. This is continuous integration and continuous delivery (CI/CD). The architect makes sure that each deployment unit can go through this pipeline alone.

## Release strategies

| Strategy | How it works | Good at | Cost |
|---|---|---|---|
| Rolling | Replace the copies a few at a time | Simple, no extra machines | Two versions run together for a while |
| Blue-green | Start a full second environment, then move all traffic to it | Immediate return to the old version | Double the machines during the release |
| Canary | Send a small share of users to the new version, and watch | Finds problems with few users affected | Needs good [measurements](/learn/observability) |
| Feature flag | New code is deployed switched off, then switched on for selected users | Release with no deployment, fast switch-off | Flags must be removed later, or they pile up |

## What every strategy requires

During a release, the old version and the new version run at the same moment. This puts rules on the design:

- **The database must work with both versions.** Change it in steps: first add the new column, then deploy code that uses it, then remove the old column in a later release. Never rename in one step.
- **APIs and messages must be compatible.** See [API design and contracts](/learn/api-design).
- **A return to the old version must be possible.** If a release changes data in a way the old code cannot read, you cannot go back.

## Infrastructure as code

Servers, networks, and settings are described in files that are kept with the code and applied automatically. An environment can then be created again, exactly, and each change has a history. An environment that somebody configured by hand cannot be trusted or repeated.

## In a design discussion

Useful questions for any design: Can each part be released alone? How long from a finished change to production? What do we do when a release is bad, and how long does that take?

## Further reading

- [Blue-green deployment](https://martinfowler.com/bliki/BlueGreenDeployment.html), [Canary release](https://martinfowler.com/bliki/CanaryRelease.html), and [Feature toggles](https://martinfowler.com/articles/feature-toggles.html), on martinfowler.com
