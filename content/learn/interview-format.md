## What the interviewer looks for

A system design interview is not a test of one correct design. The interviewer wants to see how you handle an open problem: if you find the hard part, if you make decisions with reasons, and if you see the weak points of your own design.

A candidate who draws a correct diagram in silence usually does worse than a candidate who thinks aloud, makes one mistake, and corrects it.

## A plan for 45 minutes

| Minutes | Step | Result |
|---|---|---|
| 0 to 8 | Ask questions and set the scope | A short list of functions, numbers, and what is out of scope |
| 8 to 12 | Estimate | Requests each second, data size, the one number that is hard |
| 12 to 25 | Draw the main design | Boxes for the core flow, with data stores and arrow labels |
| 25 to 40 | Go deep on one or two hard parts | The details of the part that makes this problem difficult |
| 40 to 45 | Weak points and operation | What fails first, how you would know, what you would do next |

## Step 1: questions

Do not start to draw immediately. Ask what you need for the design, and state an assumption when the interviewer has no answer.

- Who uses it, and what are the two or three main actions?
- How many users, and how many actions each day?
- What must never go wrong? (lost money, double booking, lost message)
- What can be slow or a little old?
- What exists already, and what can we buy?

This is step 1 and step 2 of the [kata method](/learn/method): find what is hard, and select the [characteristics](/learn/characteristics).

## Step 2: numbers

Convert the user numbers to requests each second and to data size. The purpose is to find which part needs a special design. See [Capacity estimation](/learn/estimation).

## Step 3: the main design

Follow one request from the user to the data and back. Put a name on each box and a label on each arrow: does the caller wait or not? Say which data each store holds. See [Diagrams and the C4 model](/learn/diagrams).

## Step 4: go deep

Select the hardest part yourself and say why it is the hardest: "The seat must never be sold twice, and this is the busiest path. I want to go deeper here." This is the moment that separates a senior answer from a junior one.

## Step 5: weak points

Finish with honesty: "This design fails first at X. I accepted that because of Y. With more time I would look at Z." Include how you would [operate it](/learn/observability).

## Common mistakes

- You design for a scale that the problem did not ask for.
- You name products ("we use Kafka") and do not say what job the part does.
- You draw only boxes, with no data and no labels on the arrows.
- You defend the design when the interviewer shows a problem. A hint is a gift. Use it.
