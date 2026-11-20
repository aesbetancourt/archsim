# Prompts

Every word that Charrette sends to a model is in this folder. To change how the model behaves, change a file here.

| Feature           | File          | System prompt                                                                           | Prompt for one request | Output schema                         | Route                   |
| ----------------- | ------------- | --------------------------------------------------------------------------------------- | ---------------------- | ------------------------------------- | ----------------------- |
| Kata critic       | `review.ts`   | `reviewerSystemPrompt`                                                                  | `buildReviewPrompt`    | `reviewSchema` in `lib/rubric.ts`     | `api/review`            |
| Solve a problem   | `solve.ts`    | `solverSystemPrompt`                                                                    | `buildSolvePrompt`     | `solutionSchema` in `lib/solver.ts`   | `api/solve`             |
| Help chat         | `helper.ts`   | `helperSystemPrompt(kind)`                                                              | `buildHelperPrompt`    | `helperSchema` in `lib/helper.ts`     | `api/chat`              |
| Vocabulary drill  | `drill.ts`    | `gradeSystemPrompt`                                                                     | `buildGradePrompt`     | `gradeSchema` in `lib/drill-grade.ts` | `api/drill/grade`       |
| Question drill    | `drill.ts`    | `questionGradeSystemPrompt`, or `behavioralGradeSystemPrompt` for a behavioral question | `buildQuestionPrompt`  | `gradeSchema`                         | `api/drill/question`    |
| Product drill     | `drill.ts`    | `productGradeSystemPrompt`                                                              | `buildQuestionPrompt`  | `gradeSchema`                         | `api/drill/product`     |
| Insights document | `insights.ts` | `insightsSystemPrompt`                                                                  | `buildInsightsPrompt`  | `insightsSchema` in `lib/insights.ts` | `api/notebook/insights` |

`provider.ts` has the words that a provider needs around a prompt, for example "Answer with one JSON object". `lib/model.ts` and `lib/opencode.ts` add them.

## Rules

- A file here has prompt text and the functions that build a prompt. It has no schema and no parsing.
- The output schema and its type stay in `lib`, next to the code that reads the answer.
- A file here can import from `lib`. The feature code in `lib` does not import from here. Only the API routes and the model layer do.
- A system prompt names its fields. When you change a schema, change the prompt that describes it, and the other way round.
- The person's text is material, not instructions. Each system prompt says this in its last paragraph. Keep that paragraph.
