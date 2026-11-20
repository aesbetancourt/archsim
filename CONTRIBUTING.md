# Contributing to Charrette

Charrette is a personal tool to practice software architecture. I build it to learn, and I share it in case it helps you too. Small, focused help is the most welcome.

## Ways to help

- **Report a mistake in a lesson or a kata.** The lessons and worked examples are written with AI and are not reviewed by an expert. A wrong fact, an unclear explanation, or a broken diagram is the most useful report. Use the **Problem in a lesson or kata** form.
- **Report a bug.** Use the **Bug report** form.
- **Suggest an idea.** Use the **Idea or feature** form. The scope of the project is narrow, so an idea can stay on the list for a long time.
- **Send a fix.** For a small fix, open a pull request. For a large change, open an issue first, so we agree on the change before you do the work.

## Before you open an issue

- Search the open and closed issues. Your problem can have an answer already.
- Remove API keys, project IDs, and personal data from text, logs, and screenshots.
- Do not attach files from your `data/` folder. They hold your work and your settings.

## Set up

You need Node.js 20.9 or later, and pnpm. This project uses pnpm only.

```bash
git clone https://github.com/aesbetancourt/charrette.git
cd charrette
pnpm install
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000). Most of the app works without a model. A review, the help chat, and the AI checks need a connection in Settings. See [Run it](README.md#run-it) in the README.

## Before you open a pull request

Run the same checks as the CI. Each one must pass.

```bash
pnpm lint
pnpm fmt:check   # pnpm fmt corrects the format
pnpm knip
pnpm typecheck
pnpm test
```

- Keep one topic in each pull request.
- Add or change a test in `tests/` when you change logic.
- For a change to the screen, add a screenshot.
- Do not commit `data/`, `.env` files, or keys. Git ignores `data/`.

## Code rules

The README shows [where the code is](README.md#where-the-code-is). The lint and the type check enforce most of these rules.

- **Requests from the browser** go through `src/lib/browser/api.ts`. A component must not call `fetch`.
- **Words for a model** go in `src/prompts/`. See `src/prompts/README.md`.
- **Tests** go in `tests/`, in the same folders as `src/`.
- **No nested ternaries.** Use `if`, a small function, or a lookup table. A short ternary in JSX is fine.
- **No magic numbers.** Give a number a name, except 0, 1, −1, and 2.
- **Page links are checked.** Write an address in a `Link` as a literal. Use `route()` for an address in a list, and `pageAddress()` for an address from content or saved data.

## Writing style

Text in the app, code comments, and commit messages use [ASD-STE100 Simplified Technical English](https://www.asd-ste100.org/):

- Use short sentences, the active voice, and one instruction in each sentence.
- Use simple words: "use", not "utilize". Use "must" and "can", not "should" and "may".

A commit message starts with a short summary in the imperative, for example "Add a timer to the drill". A list of the changes can follow.

## Lessons and katas

The lessons are Markdown files in `content/learn/`. The content tests check their diagrams and links, so run `pnpm test` after a change.

- **Explain ideas in your own words.** Do not copy text, figures, or tables from a book, a course, or a website.
- **Keep quotes short**, and name the source.
- **Name your sources** in the "Further reading" section of the lesson.
- **Draw your own diagrams.** Do not redraw the figure of a book.

## License of a contribution

The repository is under the [PolyForm Noncommercial License 1.0.0](LICENSE). When you send a contribution, you agree that it is under the same license.

## Be kind

Be respectful and patient in issues and reviews. This is a learning project, so questions are welcome.
