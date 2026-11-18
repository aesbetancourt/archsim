## The core system and the plug-ins

The microkernel style, also called the plug-in architecture, separates what is always the same from what varies. Richards and Ford (Fundamentals of Software Architecture) describe two kinds of part.

| Part        | What it holds                                                                         | How often it changes     |
| ----------- | ------------------------------------------------------------------------------------- | ------------------------ |
| Core system | The minimum logic that the system needs to run: the usual path, with no special cases | Rarely                   |
| Plug-ins    | One feature, one variation, or one special case each                                  | Often, and independently |

The idea is easiest to see in code that does not use it. An insurance claims system without plug-ins has a large function full of conditions: if the claim is from region A, apply these checks; if it is from region B, apply those; if it is a car claim in region C after a certain date, add another step. Each new region or rule change edits the same function, and each edit can break another region.

In a microkernel, the core receives the claim, stores it, and runs the workflow. It does not know the rules of any region. A plug-in for each region holds that region's rules. A new region is a new plug-in. A rule change is a change to one plug-in.

The core is not always tiny. It can be a full application with its own internal structure, such as a [layered](/learn/layered) or [modular](/learn/modular-monolith) design. The rule is that the core holds no variation. If a new customer, region, or device forces a change to the core, the line between core and plug-in is in the wrong place.

A microkernel can be technically or domain partitioned. Plug-ins for file formats or devices are technical. Plug-ins for regions or products are domain parts.

## How a request moves

A claim arrives at the claims system.

1. The core reads the claim and saves it.
2. The core reads the region from the claim.
3. The core asks the plug-in registry for the rules plug-in for that region.
4. The core calls the plug-in through the contract and passes the claim data.
5. The plug-in returns an assessment: approved, rejected, or sent for manual review, with reasons.
6. The core records the result and continues the workflow: payment, letters, audit.

The plug-in never writes to the core database. It gets the data it needs from the core and returns a result. The core stays in control of the workflow and of the data.

## The plug-in registry

The core must know which plug-ins exist, what each one does, and how to reach it. The registry holds this information. For each plug-in it records:

- A name or key, for example the region code.
- The contract it implements, and the contract version.
- How to reach it: a class to load, a file to open, or a network address.

In the simplest form, the registry is a map in memory that is filled at start-up. Here is a sketch in TypeScript for the claims system:

```typescript
// The contract that each claims rules plug-in implements.
export interface ClaimRules {
  readonly region: string;
  readonly contractVersion: 2;
  assess(claim: ClaimData): Assessment;
}

const registry = new Map<string, ClaimRules>();

// Each plug-in calls this function when it loads.
export function register(plugin: ClaimRules): void {
  registry.set(plugin.region, plugin);
}

// The core calls this function for each claim.
export function rulesFor(region: string): ClaimRules {
  const plugin = registry.get(region);
  if (!plugin) throw new Error(`No claims rules for region ${region}`);
  return plugin;
}
```

A larger system can keep the registry in configuration, in a database table, or in a service registry when the plug-ins are remote. The core must also decide what to do when no plug-in matches: reject the request, use a default plug-in, or send the case to a person.

## Contracts

The contract is the interface between the core and the plug-ins. It defines the input, the output, and the behavior. In the claims example, the input is the claim data and the output is an assessment.

The contract is the most expensive part of the style to change. Each plug-in depends on it. With 40 regional plug-ins, a change to the contract can mean 40 changes, perhaps by 40 different owners. Design it with care:

- **Pass data, not core objects.** A plug-in that gets a plain claim record cannot depend on the internals of the core.
- **Keep it small.** A contract with three operations is easier to keep stable than one with twenty.
- **Version it.** Put a version in the contract. The core can support version 1 and version 2 for a time, while plug-ins move.
- **Use an adapter for plug-ins you do not control.** When a third-party component has its own interface, write a small adapter that turns it into your contract. The core never sees the third-party interface.

The contract often needs one escape for data that only some plug-ins use. A common choice is a field for extra values, such as a map of key-value pairs. Use it sparingly. Each extra value is part of the contract, even if the type system does not show it.

## Plug-ins at compile time and at run time

A plug-in connects to the core in one of two ways.

| Way             | How it works                                                                                         | Gain                                                | Cost                                                           |
| --------------- | ---------------------------------------------------------------------------------------------------- | --------------------------------------------------- | -------------------------------------------------------------- |
| At compile time | Plug-ins are libraries in the build. A new plug-in needs a new build and release of the whole system | Simple. Type checks catch contract errors           | Each plug-in change is a release of the whole unit             |
| At run time     | The core loads plug-ins when it starts or while it runs                                              | Add or change a plug-in with no rebuild of the core | Harder to test the full set. Version errors appear at run time |

Run-time loading needs a mechanism in the platform. In Java, OSGi and the platform module system are the classic examples. The Eclipse IDE is built on OSGi. Other platforms load plug-ins as dynamic libraries, script files, or separate processes.

Many products start with compile-time plug-ins and add run-time loading only when customers or partners write their own plug-ins.

### Isolation of plug-ins

A plug-in that runs in the core process can crash the core, leak memory, or read data it must not see. For your own plug-ins, that is usually acceptable. For third-party plug-ins, it is a risk. Options:

- Run plug-ins in a separate process. Visual Studio Code, for example, runs its extensions in a separate extension host process, so a faulty extension does not freeze the editor.
- Give plug-ins only the permissions they declare. Browser extensions declare their permissions in a manifest.
- Run untrusted code in a sandbox with limits on time, memory, and access.

## Remote plug-ins

A plug-in does not have to run in the same process. The core can call it over the network, with REST or with messages.

```diagram
{
  "nodes": [
    { "id": "api", "label": "Claims API", "shape": "actor", "col": 0, "row": 0 },
    { "id": "core", "label": "Claims core\n(workflow)", "shape": "module", "col": 1, "row": 0 },
    { "id": "reg", "label": "Plug-in\nregistry", "shape": "store", "col": 1, "row": 1.3 },
    { "id": "db", "label": "Claims\ndatabase", "shape": "store", "col": 0, "row": 1.3 },
    { "id": "pa", "label": "Region A rules\n(plug-in)", "shape": "module", "col": 2, "row": 0 },
    { "id": "pb", "label": "Region B rules\n(plug-in)", "shape": "module", "col": 2, "row": 1 },
    { "id": "fraud", "label": "Fraud check\n(remote plug-in)", "shape": "box", "col": 3, "row": 2.2 }
  ],
  "groups": [{ "id": "proc", "label": "One process", "col": 0, "row": 0, "cols": 3, "rows": 2 }],
  "edges": [
    { "from": "api", "to": "core" },
    { "from": "core", "to": "db" },
    { "from": "core", "to": "reg", "label": "find plug-in" },
    { "from": "core", "to": "pa", "label": "assess()" },
    { "from": "core", "to": "pb" },
    { "from": "core", "to": "fraud", "label": "REST" }
  ]
}
```

A remote plug-in gives you:

- Its own deployment and its own scaling. A heavy fraud model can run on its own machines.
- Isolation. A crash in the plug-in does not crash the core.
- Freedom of technology. The fraud team can use a different language.

It costs you:

- The system is now distributed. Each remote plug-in can be a separate [quantum](/learn/architecture-quantum). A synchronous call still joins it to the core for the length of the call.
- Latency and partial failure. The core needs timeouts, retries, and a decision for "plug-in not available". See [Resilience patterns](/learn/resilience).
- More work to operate and to monitor.

A remote plug-in that the core calls with a message, and does not wait for, keeps the core available when the plug-in is down. Use that shape for work that can complete later, such as a fraud score that can arrive after the claim is accepted.

## Plug-in data

Richards and Ford advise that plug-ins do not use the core database. The core owns its data. It passes each plug-in the data it needs, and the plug-in returns a result. A plug-in that needs its own data, such as a table of regional limits, keeps it in its own store or in its own configuration.

This rule keeps the core schema free to change. If 40 plug-ins read the core tables, the core schema becomes a second contract that nobody can change.

Plug-ins also must not depend on each other. If the plug-in for region B calls the plug-in for region A, the two can no longer change alone, and the order of loading starts to matter. Put shared logic in the core, or in a library that each plug-in includes.

## Examples

| Domain                | The core                                        | The plug-ins                                         |
| --------------------- | ----------------------------------------------- | ---------------------------------------------------- |
| Code editors and IDEs | Open, edit, and save files. A command system    | Languages, debuggers, themes, version control        |
| Insurance claims      | Receive, store, and route claims                | Rules for each region or product, fraud checks       |
| Tax software          | Collect income data and compute the main return | One plug-in for each extra form, schedule, or region |
| Web browsers          | Load and show pages                             | Extensions that block content or add tools           |
| Build and CI servers  | Run jobs and keep results                       | Source control, build tools, notifications           |
| A parcel service      | Book, track, and deliver parcels                | One plug-in for each partner carrier's interface     |

Many products that you do not think of as "plug-in systems" use the style inside. A payment service with one adapter for each payment provider is a microkernel at a small scale.

## How it handles each characteristic

| Characteristic  | How the microkernel style behaves                                                                 |
| --------------- | ------------------------------------------------------------------------------------------------- |
| Extensibility   | Its main strength. A new variation is a new plug-in.                                              |
| Maintainability | High for the variations. Each one is in one place. Low for the contract, which is hard to change. |
| Testability     | Good for each plug-in alone. Hard for all combinations of plug-ins together.                      |
| Simplicity      | High, while the plug-ins are local.                                                               |
| Cost            | Low. Usually one deployment.                                                                      |
| Scalability     | Limited. The core is one unit. Remote plug-ins can scale separately, at the cost of distribution. |
| Fault tolerance | Low for local plug-ins. A bad plug-in can stop the core. Separate processes help.                 |
| Performance     | Good for local calls. Can be tuned by unloading features that a customer does not use.            |

## The limits

- **There must be a natural core.** If every feature depends on every other feature, there is nothing stable to put in the core. Other styles fit better.
- **The contract freezes.** After many plug-ins exist, each contract change is a migration across all of them.
- **The core grows by accident.** A plug-in needs one more hook, then another. Over time, the variation moves back into the core. Review each new hook.
- **Combinations are hard to test.** Ten plug-ins with two versions each give many combinations. Test each plug-in against the contract, and test the common sets together.
- **Third-party plug-ins bring risk.** Security, stability, and support become your problem when customers install them.
- **It does not scale by itself.** The core is one quantum. When load is the problem, another style must help.

## Compared with its neighbors

| Compared with    | The difference                                                                                                                                  |
| ---------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| Hexagonal        | Also ports and adapters around a core. Hexagonal adapters connect the core to technology. Microkernel plug-ins add features or variations.      |
| A rules engine   | The rules are data, written in a rule language, often by business users. A microkernel plug-in is code. A rules engine can itself be a plug-in. |
| Modular monolith | Modules are peers, one for each business area. In a microkernel, one core is in charge and plug-ins hang from it.                               |
| Microservices    | Remote plug-ins look like services. The difference is control: the core directs every call, and plug-ins do not call each other.                |

The microkernel is also a common shape inside a larger system. One service in a [service-based](/learn/service-based) or [microservices](/learn/microservices) design can be a microkernel inside.

## In a kata

In [Waiting Room](/kata/waiting-room), each of the 120 clinics uses different software today. A microkernel can hold the shared appointment and check-in logic in the core, with one integration plug-in for each clinic software product. A strong answer:

1. Names what is in the core and what is in the plug-ins.
2. Writes the contract in one or two lines: the input, the output, and the version.
3. Says if the plug-ins load at compile time or at run time, and why.
4. Says what occurs when a plug-in fails or no plug-in matches.
5. Names the limit: the core is one quantum, so scaling and availability need another plan if they matter.

## Interview questions

**"What goes in the core of a microkernel, and what goes in a plug-in?"**

- The core holds the minimum logic that the system always needs, with no special cases.
- Each plug-in holds one variation or one feature.
- Test: if a new customer or region needs a change to the core, the line is wrong.

**"How does the core find and call the plug-ins?"**

- A registry records each plug-in's key, its contract version, and how to reach it.
- The core looks up the plug-in for the request, then calls it through the contract.
- The core decides what to do when no plug-in matches.

**"What are the risks of plug-ins that load at run time?"**

- Contract and version errors appear in production, not in the build.
- A faulty plug-in in the same process can crash the core.
- Many combinations of plug-ins are hard to test.
- Isolation helps: separate processes, declared permissions, sandboxes.

**"When do you make a plug-in remote?"**

- When it needs its own scaling, its own technology, or isolation from the core.
- Accept the cost: network latency, partial failure, timeouts, and monitoring.
- Prefer an asynchronous message when the core does not need the answer now.

**"When is a microkernel the wrong choice?"**

- When there is no stable core, because the features depend on each other.
- When the main need is high scalability or high availability.
- When the variations are so many and so dynamic that a rules engine fits better.

## Go deeper

- **Fundamentals of Software Architecture** (Richards, Ford), the part on the microkernel architecture style: the core system, plug-in components, the registry, contracts, and remote plug-ins.
- **A Philosophy of Software Design** (Ousterhout), the parts on general-purpose modules and information hiding: how to design a contract that hides the core and stays stable.
- **Building Microservices** (Newman), the parts on interfaces and on changes that break consumers: how to version a contract that many parties depend on.

## Further reading

- [Plug-in (computing)](https://en.wikipedia.org/wiki/Plug-in_%28computing%29) on Wikipedia
- [OSGi](https://en.wikipedia.org/wiki/OSGi) on Wikipedia
- [Microkernel](https://en.wikipedia.org/wiki/Microkernel) on Wikipedia, the operating system idea that gave the style its name
