## The problem: who creates the parts?

A use case needs other parts to do its job. A render service needs a compiler and a clock. An order service needs a repository and a payment gateway.

There are two ways to get them:

- **The use case creates them itself.** It calls `new PostgresOrderRepository()` inside its own code. It is short, but the use case is now tied to PostgreSQL. A test must start a real database, and a change of database is a change of business code.
- **Someone else creates them and hands them in.** The use case only says what it needs. This is dependency injection.

## Dependency injection

Dependency injection means that a part receives its dependencies from outside, instead of creating them. The part declares what it needs, usually as constructor or function parameters, and the caller passes them in.

```ts
// The service declares what it needs.
type RenderServiceDeps = { compiler: TypstCompiler; clock: Clock; slots: RenderSlots };

export function createRenderService(deps: RenderServiceDeps) {
  // ... uses deps.compiler, deps.clock, deps.slots, and never creates them
}
```

What you get:

- **Tests are easy.** A test passes a fake compiler and a fixed clock. It needs no real tool and no real time.
- **Technology can change.** A new adapter replaces the old one, and the service code does not change.
- **The dependencies are visible.** The parameter list shows everything the part needs. Nothing is hidden in a global variable.

There are three common forms. They are the same idea:

| Form                  | How the dependency arrives                     | Typical use                      |
| --------------------- | ---------------------------------------------- | -------------------------------- |
| Constructor injection | As a constructor parameter                     | Classes. The most common form    |
| Parameter injection   | As a function parameter, often a `deps` object | Functions and factory functions  |
| Setter injection      | Through a method after construction            | Rare. Optional dependencies only |

## The composition root

If every part receives its dependencies, something must create them all. That place is the composition root: one place, usually at startup, that creates the real adapters and connects them to the core.

```ts
// main.ts: the composition root
const compiler = new TypstCliCompiler({ binary: config.typstBinary });
const slots = new RenderSlots({ maxConcurrent: 4, maxQueued: 100 });
const renderer = createRenderService({ compiler, clock: systemClock, slots });
const app = await buildApp({ renderer });
```

Rules for a good composition root:

- **Only one.** It is the only file that knows every concrete class.
- **At the edge.** It is the entry point of the application, outside the core.
- **No business logic.** It creates and connects. It does not decide anything.

## Depend on an interface, not a class

Dependency injection gives the full benefit only when the parameter type is an interface: a port. Then any implementation fits: the real adapter, a fake in a test, or a new adapter later.

When the parameter type is a concrete class, the code still works, but you lose part of the benefit. A test must use the real class, and nobody can replace it without a change to the service.

```ts
type RenderServiceDeps = {
  compiler: TypstCompiler; // an interface: a port. Good.
  clock: Clock; // an interface: a port. Good.
  slots: RenderSlots; // a concrete class. A test must use the real queue.
};
```

To fix it, define the interface that the service needs, for example `RenderQueue` with one method `run(task)`, and let the class implement it.

This is a favorite interview question: "You use dependency injection. What is missing?" The answer is often one dependency that is a class and not an interface.

## Inversion of control

Inversion of control is the larger idea that dependency injection belongs to. In normal code, your code calls the library. With inversion of control, a framework or a caller controls the flow and calls your code.

- A web framework calls your route handler when a request arrives. You do not write the request loop.
- A test runner calls your test functions.
- A composition root creates your objects and passes them in. Your code does not look for them.

Dependency injection is one form of inversion of control: the control over who creates a dependency moves out of the part.

## A container, or plain code

A dependency injection container is a library that creates and connects objects for you, from configuration or decorators. Examples are Spring in Java, ASP.NET Core in C#, and InversifyJS or NestJS in TypeScript.

| Approach                      | For                                         | Against                                                      |
| ----------------------------- | ------------------------------------------- | ------------------------------------------------------------ |
| Plain code (manual injection) | Simple, explicit, no library, easy to debug | More lines when there are many objects                       |
| A container                   | Less wiring code in a large system          | Hidden magic, errors at runtime, one more framework to learn |

For a small or medium service, plain code in one composition root is enough. Dependency injection is the pattern. The container is only a tool for it.

## Test doubles

A test double replaces a real dependency in a test. Injection makes this possible. The words have exact meanings, and interviewers notice when they are mixed:

| Double | What it does                                      | Example                                              |
| ------ | ------------------------------------------------- | ---------------------------------------------------- |
| Stub   | Returns fixed answers. It has no logic.           | A clock that always returns 09:00                    |
| Fake   | A working but simplified implementation           | A compiler in memory that returns a small PDF        |
| Mock   | Records the calls, and the test checks them       | Check that the service called `compile` exactly once |
| Spy    | A real or fake object that also records the calls | A fake repository that keeps a list of saved orders  |

Prefer stubs and fakes that check the result. A test full of mocks checks how the code works inside, so it breaks when you refactor, even when the behavior is correct.

A **unit test** checks one part with its dependencies replaced by doubles. An **integration test** checks real parts together, for example the real adapter with the real tool.

## How to keep the direction of dependencies

The dependency rule says that imports point inward: adapters import the core, and the core never imports an adapter. A rule that nobody checks is broken in months, especially when AI agents write code. There are three ways to check it:

| Way               | How                                                                                                     | Feedback                      |
| ----------------- | ------------------------------------------------------------------------------------------------------- | ----------------------------- |
| Architecture test | A test reads every import and fails on a wrong direction. It is a [fitness function](/learn/evolution). | When the tests run            |
| Lint rule         | An import-boundary rule, for example `eslint-plugin-boundaries` or `dependency-cruiser`                 | In the editor, while you type |
| Separate packages | Each layer is its own package in a monorepo. A package can import only what it lists.                   | At build time                 |

The lint rule gives the fastest feedback. The architecture test needs no extra tool. Separate packages give the strongest guarantee but add the most structure. Many teams use a test or a lint rule, and add packages only for a large code base.

## What interviewers ask

| Question                                                      | A short answer                                                                                                       |
| ------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| "What is this `deps` object?"                                 | Dependency injection. The service receives its compiler, clock, and queue. `main.ts` is the composition root.        |
| "What is missing in your dependency injection?"               | One dependency is a concrete class. It should be an interface, so a test or a new implementation can replace it.     |
| "What are other names for hexagonal architecture?"            | Ports and adapters. Its close relatives are clean and onion architecture. See [Clean and onion](/learn/clean-onion). |
| "What is the difference between a port and an adapter?"       | The port is the interface the core owns. The adapter is the implementation for one technology.                       |
| "How do you stop an AI agent from breaking the architecture?" | An architecture test or a lint rule fails the build, and the rules are written down for the agent.                   |
| "Is there a faster way than a test?"                          | A lint rule for import boundaries, which shows the error in the editor.                                              |

## Further reading

- [Inversion of Control Containers and the Dependency Injection pattern](https://martinfowler.com/articles/injection.html), by Martin Fowler
- [Hexagonal architecture](https://alistair.cockburn.us/hexagonal-architecture/), by Alistair Cockburn
- [Test double](https://martinfowler.com/bliki/TestDouble.html), by Martin Fowler
- [Dependency injection](https://en.wikipedia.org/wiki/Dependency_injection) on Wikipedia
