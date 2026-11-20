@AGENTS.md

# Charrette: rules for agents

Charrette is a local, single-user Next.js app for practicing software architecture with katas and an AI critic. The code map is in README.md, under "Where the code is". CONTRIBUTING.md is the same set of rules for people.

## Done

A change is done when these all pass: `pnpm lint`, `pnpm fmt:check`, `pnpm knip`, `pnpm typecheck`, and `pnpm test`. CI also runs `pnpm build`.

- Add or change a test in `tests/` for each change in logic.
- Report what you did not check. For example, say when you checked a screen change only with the type check, and not in a browser.

## Workflow

- Commit and push only when the user asks.
- Leave `.next/` alone while the user runs the app (`mise run app` serves the production build on port 3000). `pnpm build` replaces the build under the running server and breaks it. To build, copy the project without `node_modules`, `.next`, `.git`, `docs`, and `data`, then run `pnpm install --frozen-lockfile --prefer-offline` and `next build` in the copy. A symlinked `node_modules` fails with Turbopack.
- Scale the verification to the risk:
  - **Small change:** the five checks above.
  - **Screen change:** the checks, then screenshots at 390, 768, and 1024 px from a `next dev` server in a copy.
  - **Refactor that must not change behavior:** build the old and the new code in two copies, record the same observations in headless Chrome on both, and compare them. Builds take minutes, so say so before you start.
- Read the guide in `node_modules/next/dist/docs/` before you write Next.js code. Read current library docs before you use an API that you are not sure of.

## Code

The lint and the type check enforce most of these rules. The reasons are here, so a new case follows the same intent.

- **Requests:** the browser calls the server only through `src/lib/browser/api.ts`. Shared data uses TanStack Query, with keys in `src/lib/browser/query-keys.ts`.
- **Fresh editors:** an editor (page notes, general notes, highlights) loads its data at each visit (`gcTime: 0`). It must never start from a cached copy, because its first autosave would replace newer text. Lists that only display can stay cached.
- **Autosave:** use `useAutosave` in `src/lib/browser/use-autosave.ts`. It saves after a delay, when the component closes, and before its save function changes.
- **Prompts:** every word sent to a model is in `src/prompts/`. The schema of each answer is in `src/lib/ai/`. When you refactor prompt code, prove that the prompt text is unchanged byte for byte.
- **Browser and server:** code that runs in the browser imports only modules with no server code (`node:fs`, the stores) and no large data. Put a shared constant in a small file of its own, as `src/lib/content/community-source.ts` and `src/lib/ai/score.ts` do.
- **Checked links:** write a page address in a `Link` as a literal. Use `route()` from `src/lib/routes.ts` for an address in a list, and `pageAddress()` for an address from content or saved data.
- **Helpers:** use es-toolkit when its function gives the same result and type as the code it replaces. Read its source when you are not sure.
- **Tests:** they live in `tests/`, in the same folders as `src/`, and import with `@/`.
- **Tour:** the welcome tour on the home page finds its parts by `tourTarget()`. A part that moves into the narrow-screen menu needs an entry in `narrowTarget` in `src/components/Tour.tsx`.
- **Dependencies:** pnpm only. Add the latest stable version, and check its peer support for React 19. The license must be permissive (MIT, ISC, Apache 2.0, BSD). The project is under PolyForm Noncommercial, and a copyleft package conflicts with it.

## TypeScript conventions

Write for the next reader. Clarity beats cleverness.

- **`if` over ternaries.** Use a ternary only for a short, one-line choice, such as a class name in JSX. Never nest a ternary: use `if`, a small function, or a lookup table. When a line needs two reads, rewrite it with `if`.
- **Early returns.** Check the preconditions first and return at once. The main path comes last, with no extra nesting.
- **No magic values.** Give a number or a string a name when its meaning is not clear from the code: a constant, a named object, or a union type. The lint allows only 0, 1, -1, and 2. Shared values have a home: `src/lib/time.ts`, `src/lib/http-status.ts`, `src/lib/random-id.ts`, `src/lib/limits.ts`, and `src/lib/ai/limits.ts`. A named list of choices, such as reading speeds, takes a one-line lint exception with its reason.
- **Names are documentation.** A name tells the intent, not the method. A boolean reads as a question: `isOpen`, `hasExample`, `canRetry`. A function name is an action: `saveDraft`, `findTarget`. Use no abbreviations except common ones such as `id`, `url`, and `html`.
- **One job for each function.** If you need "and" to describe a function, split it. Aim for under 20 lines. Move checks, side effects, and calculations into named helpers. A React component can be longer, but move its logic into helpers and hooks.
- **Chained array methods** (`map`, `filter`, `some`) over loops with a counter, when they read more clearly.
- **Type safety.** Use `unknown` and narrow it, never `any`. Give each exported function a return type. Handle `null` and `undefined` explicitly, and use a non-null assertion (`!`) only where the code proves the value exists.
- **`type` for object shapes.** The code uses `type`, not `interface`, so new code stays the same.
- **Comments say why.** The code shows what it does. A comment explains a rule of the domain, an outside constraint, a workaround, or a trade-off. Inside a function, use `//` comments.

### JSDoc

Each export in `src/` has a `/** */` block right above it: a function, a component, a hook, a route handler, a class, a type, or a constant. Two kinds of export need none: the base controls in `src/components/ui/`, which come from a component library, and Next.js route settings such as `export const dynamic`.

- **First line:** what it is or what it does, in Simplified Technical English. Add why, or when to use it, if the reader needs that.
- **`@param name Description.`** for each parameter that is not destructured. Describe destructured props on the props type.
- **`@returns Description.`** when it returns a value. For a component, say what it shows.
- **`@throws Description.`** when it can throw. State the condition.
- **`@example`** for each exported function in `src/lib/` and `src/prompts/`: one to three lines of real use.

The lint checks the tags of each block.

## Writing

App text, code comments, commit messages, and the Markdown content use ASD-STE100 Simplified Technical English:

- Use the active voice, short sentences, and one instruction in each sentence.
- Use simple words ("use", not "utilize"), and "must" and "can", not "should" and "may".
- A commit message starts with a short imperative summary, then a list of the changes.

## Data and secrets

- `data/` holds the user's work and `settings.json` with plain-text API keys. Git ignores it. Keep its contents out of commits, logs, and messages.
- An API key stays on the server. `toPublic` in `src/lib/store/settings.ts` sends the browser only a hint of each key.
- Calls to a real model or to Google Cloud cost the user money. Make them only when the user asks.

## Lesson content

The lessons in `content/learn/` are written with AI and teach ideas from books.

- Explain each idea in your own words. Draw original diagrams.
- Keep quotes short, and name the source in "Further reading".
- Run `pnpm test` after a change. The content tests check diagrams and links.
