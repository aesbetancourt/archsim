"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { storyAsAnswer } from "@/components/StoryBank";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  // Each story with the competencies that it shows.
  const items = stories.map((story) => ({
    value: story.id,
    label: story.competencies.length
      ? `${story.title} (${story.competencies.join(", ")})`
      : story.title,
  }));

  return (
    <div className="flex flex-wrap items-center gap-2 text-sm">
      <span className="font-medium">Start from a story</span>
      {/* A menu of stories. It shows no value, so each choice fills the answer. */}
      <Select
        items={items}
        value={null}
        onValueChange={(value) => {
          const story = stories.find((item) => item.id === value);
          if (story) onPick(storyAsAnswer(story));
        }}
      >
        <SelectTrigger
          aria-label="Start from a story"
          className="h-8 w-auto max-w-full border-border bg-secondary-background px-2.5"
        >
          <SelectValue placeholder="Select a story" />
        </SelectTrigger>
        <SelectContent align="start">
          {items.map((item) => (
            <SelectItem key={item.value} value={item.value}>
              {item.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <span className="text-xs text-muted-foreground">Then tell it for this question.</span>
    </div>
  );
}
