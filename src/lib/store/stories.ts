// The story bank of the notebook. This file has no server code, so the browser can use it.

// A true story from the user's work, for the behavioral interview. The parts follow STAR, plus
// what the user learned. The competencies say which questions the story answers.
export type Story = {
  id: string;
  title: string;
  situation: string;
  task: string;
  action: string;
  result: string;
  reflection: string;
  competencies: string[];
  createdAt: string;
  updatedAt: string;
};

export type StoryFields = Pick<
  Story,
  "title" | "situation" | "task" | "action" | "result" | "reflection" | "competencies"
>;

// The competencies that an architect is asked about, from the behavioral interviews lesson.
export const competencies = [
  "Influence without authority",
  "Decision under uncertainty",
  "Disagreement and conflict",
  "Failure or wrong decision",
  "Saying no",
  "Simplifying a system",
  "Mentoring and growing others",
  "Product and executives",
  "Incident",
  "Migration",
  "Raising quality",
] as const;
