# Walkthrough format

A walkthrough is a lesson in steps on one diagram. Put it in a lesson file in `content/learn/`, in a code block with the language `walkthrough`. The block holds one JSON object. See `content/learn/caching.md` for a full example.

## The object

| Field     | Content                                                                                        |
| --------- | ---------------------------------------------------------------------------------------------- |
| `title`   | The name above the walkthrough.                                                                |
| `metrics` | The numbers above the diagram: `id`, `label`, `unit`, and `better` (`"lower"` or `"higher"`).  |
| `diagram` | All nodes, groups, and arrows of all steps. It uses the same format as a `diagram` code block. |
| `steps`   | One object for each step. At least one step is necessary.                                      |

Put all parts in `diagram`, also the parts that come in a later step. Then the parts do not move between steps.

## A step

| Field     | Content                                                                                      |
| --------- | -------------------------------------------------------------------------------------------- |
| `kind`    | `problem`, `idea`, `technique`, `failure`, or `recap`.                                       |
| `title`   | The name of the step. The Next button shows it.                                              |
| `text`    | Paragraphs, with an empty line (`\n\n`) between them.                                        |
| `key`     | Optional. The key idea in one or two sentences.                                              |
| `show`    | The IDs of the visible nodes and groups. An arrow is visible when its two ends are visible.  |
| `hide`    | Arrows to hide, as `"from>to"`, when their two ends are visible.                             |
| `flow`    | Arrows with moving packets, as `"a>b"`. The packets go from `a` to `b`, in each direction.   |
| `focus`   | Nodes with a ring.                                                                           |
| `down`    | Nodes that failed. They get a red badge, and their arrows are dim.                           |
| `notes`   | A short note above a node: `{ "db": "2,000 reads/s" }`. Keep a note below 30 characters.     |
| `metrics` | New metric values: `{ "time": 40 }`. A metric keeps its value until a later step changes it. |
| `changes` | More lines for "What changed". The app adds the nodes that come and go, and changed metrics. |

## Check your walkthrough

1. Run `pnpm test`.
2. Make sure that the test "accepts every walkthrough in the lessons" passes.

The test names the step and the wrong ID. A walkthrough that is not valid also shows the problem on the lesson page, in a red box.
