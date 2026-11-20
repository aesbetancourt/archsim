// The onboarding tour of the home page. It runs one time, the first time the person opens the
// app. The link "take the tour" on the home page starts it again. The data folder keeps which tours
// the person saw, so a later tour can use the same store.

export const tourIds = ["welcome"] as const;
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
  | "menu";

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
};
