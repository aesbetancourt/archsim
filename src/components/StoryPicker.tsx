"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { storyAsAnswer } from "@/components/StoryBank";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { listStories } from "@/lib/browser/api";
import { keys } from "@/lib/browser/query-keys";

/**
 * For a behavioral question: start the answer from a story of the story bank.
 * @returns The list of stories to select, a tip when there is no story, or nothing while they load.
 */
export default function StoryPicker({ onPick }: { onPick: (text: string) => void }) {
  // The stories load again for each question. The stories of the last load show until then.
  const { data, isPending } = useQuery({ queryKey: keys.stories, queryFn: listStories });

  if (isPending) return null;
  // Without an answer of the server, there are no stories to start from.
  const stories = data ?? [];
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
