// The onboarding tours. A tour runs one time, the first time the person opens its page. The
// Guide page can start a tour again. The data folder keeps which tours the person saw.

export const tourIds = ["welcome", "kata"] as const;
export type TourId = (typeof tourIds)[number];

// The parts of the app that a tour points at. Put tourTarget(name) on the element.
export type TourTarget =
  | "katas"
  | "practice"
  | "learn"
  | "notebook"
  | "scratchpad"
  | "search"
  | "settings"
  | "guide"
  | "menu"
  | "notes-pane"
  | "diagram-pane"
  | "problem"
  | "steps"
  | "work-area"
  | "diagram-tab"
  | "clock"
  | "help-chat"
  | "submit";

// The attribute that marks a part for a tour.
export const TOUR_ATTRIBUTE = "data-tour";
export const tourTarget = (name: TourTarget) => ({ [TOUR_ATTRIBUTE]: name });

// One step of a tour. A step for the whole page shows in the middle of the screen.
export type TourStep = { target: TourTarget | "page"; title: string; content: string };

export const tours: Record<TourId, { label: string; steps: TourStep[] }> = {
  welcome: {
    label: "The welcome tour",
    steps: [
      {
        target: "page",
        title: "Welcome to Charrette",
        content:
          "Charrette is a place to practice software architecture. You design a system for a kata, and an AI critic reviews your design. This tour shows the main parts of the app.",
      },
      {
        target: "settings",
        title: "First: connect an AI provider",
        content:
          "The kata reviews, the help chat, and the AI checks in the drills need an AI provider. Open Settings, select a provider, and test the connection before your first review. You can use Claude Code, OpenCode, an API key, Vertex AI, or a local model.",
      },
      {
        target: "katas",
        title: "Start with a kata",
        content:
          "Each kata is a problem to design. Open one, and follow its five steps. Some katas have a worked example that shows one possible answer.",
      },
      {
        target: "practice",
        title: "Practice",
        content:
          "This menu has the katas, the interview questions, your own problems, and the drills.",
      },
      {
        target: "learn",
        title: "Learn",
        content:
          "This menu has the lessons, the building blocks, the cheatsheets, and the glossary.",
      },
      {
        target: "notebook",
        title: "Notebook",
        content:
          "Your bookmarks, highlights, and notes from the lessons are here. The AI can write a study document from them.",
      },
      {
        target: "scratchpad",
        title: "Scratchpad",
        content: "Draw a design on a free board, with no kata and no review.",
      },
      {
        target: "search",
        title: "Search",
        content: "Find a lesson, a term, a kata, or one of your notes. Press ⌘K or Ctrl+K.",
      },
      {
        target: "guide",
        title: "Guide",
        content:
          'The guide explains how to practice. To see this tour again, click "take the tour" on the home page.',
      },
    ],
  },
  kata: {
    label: "The kata tour",
    steps: [
      {
        target: "problem",
        title: "Read the problem",
        content:
          "The problem is here: the users, the requirements, and the constraints. Select text to highlight it or to add a note.",
      },
      {
        target: "steps",
        title: "Five steps",
        content:
          "Do the steps in order: the scope, the characteristics, the style, the diagram, and the rationale. Each step has a hint.",
      },
      {
        target: "work-area",
        title: "Notes first",
        content:
          "Think in the notes before you draw. Your notes are private. The review does not read them.",
      },
      {
        target: "diagram-tab",
        title: "Draw the design",
        content:
          "Open the diagram to draw. Drag a building block from the palette to the canvas, or click it. The review reads this diagram.",
      },
      {
        target: "clock",
        title: "Practice with a clock",
        content:
          "Start the clock to work in the time of an interview. It shows when to go to the next phase.",
      },
      {
        target: "help-chat",
        title: "Ask for help",
        content:
          "Open the help chat when you are stuck. It gives hints and questions, not the design.",
      },
      {
        target: "submit",
        title: "Get a review",
        content:
          "When you finish, submit your work. The AI critic gives a score for each part and tells you what to study next. The review needs an AI provider. Set one up in Settings.",
      },
    ],
  },
};
