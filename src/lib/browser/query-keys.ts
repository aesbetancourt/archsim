/**
 * The keys of the cached data. They are in one file, so a change on one screen can find the
 * data that a different screen shows.
 */
export const keys = {
  // The lessons marked as done.
  progress: ["progress"] as const,
  // The bookmarks of one page, and the start of the key of each list of bookmarks.
  bookmarks: (page: string) => ["bookmarks", page] as const,
  allBookmarks: ["bookmarks"] as const,
  // The state of the insights job.
  insights: ["insights"] as const,
  // The onboarding tours that the person saw.
  onboarding: ["onboarding"] as const,
  // The highlights of one page.
  highlights: (page: string) => ["highlights", page] as const,
  // The notes of one page, for the editor of the sidebar.
  pageNote: (page: string) => ["page-note", page] as const,
  // The stories of the story bank.
  stories: ["stories"] as const,
  // The items for the search: the content of the app, and a copy of the general notes.
  // No editor reads this copy of the notes.
  searchIndex: ["search", "index"] as const,
  searchNotes: ["search", "notes"] as const,
};
