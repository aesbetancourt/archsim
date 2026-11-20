// The keys of the cached data. They are in one file, so a change on one screen can find the data
// that a different screen shows.
export const keys = {
  // The lessons marked as done.
  progress: ["progress"] as const,
  // The bookmarks of one page, and the start of the key of each list of bookmarks.
  bookmarks: (page: string) => ["bookmarks", page] as const,
  allBookmarks: ["bookmarks"] as const,
  // The state of the insights job.
  insights: ["insights"] as const,
};
