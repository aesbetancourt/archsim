"use client";

import { ArrowLeft, BookUser, Plus, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRef, useState } from "react";
import ConfirmButton from "@/components/ConfirmButton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { competencies, type Story, type StoryFields } from "@/lib/stories";
import { cn } from "@/lib/utils";

const parts: { key: keyof StoryFields & string; label: string; hint: string }[] = [
  {
    key: "situation",
    label: "Situation",
    hint: "The context in two or three sentences. When, where, the scale.",
  },
  { key: "task", label: "Task", hint: "Your goal or problem. What was yours to do?" },
  {
    key: "action",
    label: "Action",
    hint: "What you did, with 'I'. The options, the decision, and why.",
  },
  { key: "result", label: "Result", hint: "What changed, with a number if you can." },
  {
    key: "reflection",
    label: "Reflection",
    hint: "What you learned, or what you would do differently.",
  },
];

const empty: StoryFields = {
  title: "",
  situation: "",
  task: "",
  action: "",
  result: "",
  reflection: "",
  competencies: [],
};

const fieldsOf = (story: Story): StoryFields => ({
  title: story.title,
  situation: story.situation,
  task: story.task,
  action: story.action,
  result: story.result,
  reflection: story.reflection,
  competencies: story.competencies,
});

// A story as one answer text, in STAR order. The question drill puts it in the answer box.
export function storyAsAnswer(story: Story): string {
  return parts
    .map((part) => story[part.key as keyof Story] as string)
    .filter((text) => text.trim())
    .join("\n\n");
}

async function send(url: string, method: string, body?: unknown): Promise<Story | null> {
  const response = await fetch(url, {
    method,
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!response.ok) throw new Error("The story was not saved. Try again.");
  return method === "DELETE" ? null : ((await response.json()) as Story);
}

// The story bank: true stories for the behavioral interview, in STAR form.
export default function StoryBank({ initial }: { initial: Story[] }) {
  const [stories, setStories] = useState(initial);
  const [openId, setOpenId] = useState<string | null>(null);
  const [error, setError] = useState("");

  async function create() {
    setError("");
    try {
      const story = (await send("/api/notebook/stories", "POST", empty))!;
      setStories((items) => [...items, story]);
      setOpenId(story.id);
    } catch (thrown) {
      setError((thrown as Error).message);
    }
  }

  const covered = (competency: string) =>
    stories.filter((story) => story.competencies.includes(competency)).length;
  const opened = stories.find((story) => story.id === openId);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <p className="max-w-2xl text-muted-foreground">
          Write 8 to 12 true stories from your work. One story can answer several questions. Mark
          what each one shows. The{" "}
          <Link href="/learn/behavioral-interviews" className="text-primary hover:underline">
            behavioral interviews lesson
          </Link>{" "}
          explains the form, and the{" "}
          <Link href="/drill/questions" className="text-primary hover:underline">
            question drill
          </Link>{" "}
          lets you practice each story against real questions.
        </p>
        <Button size="sm" onClick={create}>
          <Plus /> New story
        </Button>
      </div>

      <div>
        <h3 className="mb-1.5 text-xs font-medium text-muted-foreground uppercase">Coverage</h3>
        <ul className="flex flex-wrap gap-1.5">
          {competencies.map((competency) => {
            const count = covered(competency);
            return (
              <li
                key={competency}
                className={cn(
                  "rounded-base border px-2 py-0.5 text-xs",
                  count > 0
                    ? "border-border bg-main text-main-foreground"
                    : "border-dashed text-muted-foreground",
                )}
              >
                {competency} {count > 0 ? `· ${count}` : "· no story"}
              </li>
            );
          })}
        </ul>
      </div>

      {error && <p role="alert">{error}</p>}

      {opened ? (
        <StoryEditor
          key={opened.id}
          story={opened}
          onBack={() => setOpenId(null)}
          onSaved={(story) =>
            setStories((items) => items.map((item) => (item.id === story.id ? story : item)))
          }
          onDeleted={() => {
            setStories((items) => items.filter((item) => item.id !== opened.id));
            setOpenId(null);
          }}
        />
      ) : stories.length === 0 ? (
        <p className="flex items-center gap-2 rounded-base border border-dashed px-4 py-3 text-muted-foreground">
          <BookUser className="size-4 shrink-0" aria-hidden /> No stories yet. Start with the
          project you are most proud of, and a decision that went wrong.
        </p>
      ) : (
        <ul className="grid gap-2 sm:grid-cols-2">
          {stories.map((story) => (
            <li key={story.id}>
              <button
                type="button"
                onClick={() => setOpenId(story.id)}
                className="h-full w-full cursor-pointer rounded-base border border-border bg-secondary-background px-3 py-2 text-left hover:bg-main hover:text-main-foreground"
              >
                <span className="block font-medium">{story.title}</span>
                <span className="block truncate text-xs opacity-80">
                  {story.competencies.join(" · ") || "No competency marked"}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function StoryEditor({
  story,
  onBack,
  onSaved,
  onDeleted,
}: {
  story: Story;
  onBack: () => void;
  onSaved: (story: Story) => void;
  onDeleted: () => void;
}) {
  const [fields, setFields] = useState(fieldsOf(story));
  const [status, setStatus] = useState<"saved" | "changed" | "error">("saved");
  const latest = useRef(fields);
  const url = `/api/notebook/stories/${story.id}`;

  async function save() {
    try {
      const saved = await send(url, "PUT", latest.current);
      if (saved) onSaved(saved);
      setStatus("saved");
    } catch {
      setStatus("error");
    }
  }

  function change(next: StoryFields, now = false) {
    latest.current = next;
    setFields(next);
    setStatus("changed");
    if (now) void save();
  }

  return (
    <div className="space-y-3 rounded-base border bg-secondary-background p-4">
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          className="size-8 shrink-0"
          aria-label="All stories"
          title="All stories"
          onClick={onBack}
        >
          <ArrowLeft />
        </Button>
        <Input
          aria-label="Title of the story"
          placeholder="A short name, for example: The checkout freeze"
          className="h-9 flex-1 font-medium"
          value={fields.title}
          onChange={(event) => change({ ...fields, title: event.target.value })}
          onBlur={save}
        />
        <ConfirmButton
          label={<Trash2 />}
          ariaLabel="Delete this story"
          size="icon"
          variant="ghost"
          title="Delete this story?"
          description={`The story "${story.title}" is removed from the story bank. You cannot undo this.`}
          confirmLabel="Delete"
          endpoint={url}
          onDone={onDeleted}
        />
      </div>

      <fieldset>
        <legend className="mb-1.5 text-xs font-medium text-muted-foreground uppercase">
          This story shows
        </legend>
        <div className="flex flex-wrap gap-1.5">
          {competencies.map((competency) => {
            const on = fields.competencies.includes(competency);
            return (
              <Button
                key={competency}
                size="xs"
                variant={on ? "default" : "neutral"}
                aria-pressed={on}
                onClick={() =>
                  change(
                    {
                      ...fields,
                      competencies: on
                        ? fields.competencies.filter((item) => item !== competency)
                        : [...fields.competencies, competency],
                    },
                    true,
                  )
                }
              >
                {competency}
              </Button>
            );
          })}
        </div>
      </fieldset>

      {parts.map((part) => (
        <label key={part.key} className="block space-y-1">
          <span className="font-medium">{part.label}</span>
          <span className="block text-xs text-muted-foreground">{part.hint}</span>
          <Textarea
            rows={part.key === "action" ? 5 : 3}
            value={fields[part.key] as string}
            onChange={(event) => change({ ...fields, [part.key]: event.target.value })}
            onBlur={save}
          />
        </label>
      ))}

      <p className="text-xs text-muted-foreground" aria-live="polite">
        {status === "saved"
          ? "All changes saved"
          : status === "changed"
            ? "Saves when you leave the field"
            : "The save failed. Change something to try again."}
      </p>
    </div>
  );
}
