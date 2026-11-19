Charrette has two loops. In the **practice loop**, you design a system for a short problem and a model reviews your reasoning. In the **study loop**, you read the lessons, keep notes, and drill what you read. Each loop makes the other one better: the review tells you what to study, and the lessons give you the words and the options for the next kata.

## Your first session

Use about 30 minutes for the first session.

1. Read [How to do a kata](/learn/method). It explains the five steps that each kata uses.
2. Study the worked example of [Lunch Rush](/learn/examples/lunch-rush). Look at how each decision comes from one sentence in the problem.
3. Do a different starter or medium kata from the [kata list](/) yourself. Do not open its worked example first.
4. Get the review, and read the section with the lowest score first.

If the terms are new to you, read [What a software architect does](/learn/architect-role) and [Architecture characteristics](/learn/characteristics) before the kata.

## The practice loop

### Do a kata

Each kata page has the problem text, a notepad, a canvas, and the five steps.

First, **read the problem two times.** Select a sentence to highlight it. Highlight each number, constraint, and word such as "must" or "never". The highlights go to your notebook. Then do the five steps:

1. **Set the scope.** Name the few functions that shape the design. Say what you leave out.
2. **Select the characteristics.** Pick about three qualities, for example availability or cost. Tie each one to a sentence in the problem.
3. **Select a style.** Choose the simplest style that supports those characteristics.
4. **Draw the diagram.** Drag pieces from the palette of [building blocks](/learn/building-blocks) to the canvas, and connect them.
5. **State the trade-offs.** Say what your design gives up, and where it fails first.

The app saves your answers, notes, and diagram in the browser as you work. You can stop and come back later. The home page lists the katas in progress.

Use the help chat (the round button at the bottom right) when you are stuck. It explains concepts and gives hints. It does not give you the design.

### Practice under time

An interview gives you about 45 minutes. To practice that, click **Practice under time** above **Submit for review**, and select a time box: 20, 30, 45, or 60 minutes. The clock shows the phase that an interviewer expects now:

| Phase                    | In 45 minutes    | What to do                                                                  |
| ------------------------ | ---------------- | --------------------------------------------------------------------------- |
| Clarify and scope        | Minutes 0 to 5   | Ask your questions. Do steps 1 and 2.                                       |
| First design, end to end | Minutes 5 to 15  | Select a style and draw the happy path (steps 3 and 4). Do not go deep yet. |
| Deep dives               | Minutes 15 to 40 | Go deep on data, failure, scale, and how you know it works.                 |
| Wrap up                  | Minutes 40 to 45 | Write the rationale: trade-offs, risks, and next steps (step 5).            |

A soft tone plays when a phase ends. The bell button turns it off. After the time is up, the clock counts the minutes over. The clock keeps running when you reload the page, and it stops when you submit or start again.

### Read the review

The review scores seven dimensions from 1 to 5, and the total is a score out of 100. For each dimension, it quotes the evidence from your work, explains the idea, gives an example, and links to a lesson.

Read the review in this order:

1. **The top risk.** This is the first thing that a review board would ask about.
2. **The dimension with the lowest score.** Read its concept and example, then open the linked lesson.
3. **The defense questions.** Answer each one aloud, or write the answers in your notes. In an interview, you must answer these questions without help.

### Try again

A kata becomes useful the second time that you do it.

1. Wait one or two days after the review.
2. Do the same kata again from the start, without the old review open.
3. Compare the two attempts in **Your history** on the home page.

Compare scores only between attempts that use the same model. Different models give different scores for the same work.

There is no single correct answer to a kata. The reviewer grades your reasoning against the problem, not a match with a reference design. A worked example shows one good answer, and it names a different valid answer too.

### More problems

- **Interview questions.** The kata list has classic system design questions, such as a link shortener or a chat system.
- **[Solve a problem](/solve).** Paste a problem, for example a question from a real interview. The app writes a worked answer and adds the problem to your katas.
- **[Architectural Katas](/community).** About 40 more problems from the public collection of Ted Neward.
- **[Scratchpad](/scratchpad).** Free boards with the full canvas. Use them to draw a design from a book or from your work.

## The study loop

### Read a lesson

The [lessons](/learn) are in reading order. Start with the "Start here" section, then follow the sidebar.

- **Highlight and note.** Select text to highlight it and add a note. The notes for the page show in the sidebar. The [notebook](/notebook) collects all of them.
- **Read aloud.** Press Alt+R to listen to a lesson. The player highlights each sentence as it reads, so you can follow the text with your eyes.
- **Mark it as done.** At the end of a lesson, mark it as done. The sidebar shows your progress in each section. The question drill can use only the lessons that you finished.

Do not read many lessons in one session. Read one or two, then drill them or use them in a kata. You remember an idea better when you use it.

### Review what you read

- **[Cheatsheets](/learn/cheatsheets).** One page for each section, with the key facts. Read the cheatsheet of a section before a kata or an interview.
- **[Glossary](/glossary).** Each term in plain words, with an example.
- **Search.** Press Cmd+K or Ctrl+K on any page. Search finds lessons, terms, katas, questions, and your notes.

### Drill it

The drills use **spaced repetition**. A term that you know comes back after a longer time: one day, then 3, 7, and 14 days. A term that you miss comes back in the same session.

- **[Vocabulary drill](/drill).** Explain a glossary term in your own words, then say if you knew it. An optional AI check says what your explanation covers and what it misses.
- **[Question drill](/drill/questions).** Write an answer to an interview question. The model grades it against the lesson. Use the "Finished lessons" filter to drill only what you read.
- **[Product drill](/drill/product).** Answer a product case: estimate what a feature costs, prove that it works, say who pays, or rank the work. Start with a number or a position. The model does your arithmetic again and grades the answer.

A short drill each day is better than a long drill each week. Ten minutes is enough.

## Study plans

### A normal week

| Day       | What to do                                                      | Time   |
| --------- | --------------------------------------------------------------- | ------ |
| Monday    | Read one lesson. Highlight it and mark it as done.              | 20 min |
| Tuesday   | Vocabulary drill. Read one more lesson.                         | 30 min |
| Wednesday | Do one kata and read the review.                                | 45 min |
| Thursday  | Read the lessons that the review linked to. Question drill.     | 30 min |
| Friday    | Do Wednesday's kata again. Compare the two attempts.            | 45 min |
| Weekend   | Read the cheatsheet of the section. Look through your notebook. | 15 min |

### Interview preparation in four weeks

1. **Week 1: the method.** Read the "Start here" section, including [The system design interview](/learn/interview-format). Study three worked examples. Start the vocabulary drill.
2. **Week 2: the parts.** Read the lessons on data, communication, and reliability. Do one interview question from the kata list every two days.
3. **Week 3: under time.** Do one interview question each day with the 45-minute clock. Use the question drill and the product drill each day.
4. **Week 4: your stories and your weak points.** Read [Behavioral interviews](/learn/behavioral-interviews). Write your stories in the story bank in the notebook, until each competency has a story. Do the katas with your lowest scores again.

The story bank shows which competencies have no story yet. In the question drill, a behavioral answer can start from a saved story.

## Reference

### Keyboard shortcuts

| Keys                  | What they do                            |
| --------------------- | --------------------------------------- |
| Cmd+K or Ctrl+K       | Open the search on any page             |
| Alt+R                 | Start or pause read aloud in a lesson   |
| Left and right arrows | Move through the steps of a walkthrough |
| Enter                 | Send a message in the help chat         |
| Shift+Enter           | Add a line in the help chat             |
| Esc                   | Close the search or a dialog            |

### Where your work is saved

Charrette is a local tool for one person. There is no account.

| What                                                                                 | Where                                  |
| ------------------------------------------------------------------------------------ | -------------------------------------- |
| Answers, notes, and diagrams of a kata in progress                                   | This browser                           |
| Drill progress                                                                       | This browser                           |
| Attempts and reviews, boards, the notebook, lesson progress, your problems, settings | Files in the `data/` folder of the app |

If you clear the data of the browser, the katas in progress and the drill progress are lost. The files in `data/` stay.

### The model

The reviewer, the help chat, the drill checks, and the worked answers all use the model that you select in [Settings](/settings). A review needs a model that can read images and return structured JSON.

The lessons and the worked examples are written with AI and are not reviewed by an expert. Treat each one as a reasoned answer, not as an authority.
