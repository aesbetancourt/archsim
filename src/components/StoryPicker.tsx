"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { storyAsAnswer } from "@/components/StoryBank";
import type { Story } from "@/lib/stories";

// For a behavioral question: start the answer from a story of the story bank.
export default function StoryPicker({ onPick }: { onPick: (text: string) => void }) {
  const [stories, setStories] = useState<Story[] | null>(null);

  useEffect(() => {
    let current = true;
    fetch("/api/notebook/stories")
      .then((response) => (response.ok ? response.json() : []))
      .then((items: Story[]) => current && setStories(items))
      .catch(() => current && setStories([]));
    return () => {
      current = false;
    };
  }, []);

  if (stories === null) return null;
  if (stories.length === 0) {
    return (
      <p className="text-xs text-muted-foreground">
        Tip: write your stories in the{" "}
        <Link href="/notebook#stories-title" className="text-primary hover:underline">
          story bank
        </Link>{" "}
        once, then start each answer from one.
      </p>
    );
  }
  return (
    <label className="flex flex-wrap items-center gap-2 text-sm">
      <span className="font-medium">Start from a story</span>
      <select
        className="h-8 rounded-base border-2 border-border bg-secondary-background px-2"
        defaultValue=""
        onChange={(event) => {
          const story = stories.find((item) => item.id === event.target.value);
          if (story) onPick(storyAsAnswer(story));
        }}
      >
        <option value="" disabled>
          Select a story
        </option>
        {stories.map((story) => (
          <option key={story.id} value={story.id}>
            {story.title}
            {story.competencies.length ? ` (${story.competencies.join(", ")})` : ""}
          </option>
        ))}
      </select>
      <span className="text-xs text-muted-foreground">Then tell it for this question.</span>
    </label>
  );
}
