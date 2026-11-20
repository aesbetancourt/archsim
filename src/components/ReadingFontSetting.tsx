"use client";

import { BookOpen, CircleCheck } from "lucide-react";
import { useSyncExternalStore } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { READING_FONT_KEY, type ReadingFont } from "@/lib/browser/reading-font";
import { cn } from "@/lib/utils";

const options: { id: ReadingFont; title: string; sample: string; className: string }[] = [
  {
    id: "serif",
    title: "Literata, like a book",
    sample: "Every architecture decision is a trade-off.",
    className: "font-[family-name:var(--font-literata)] text-base",
  },
  {
    id: "sans",
    title: "Geist, a sans font",
    sample: "Every architecture decision is a trade-off.",
    className: "font-[family-name:var(--font-geist-sans)]",
  },
];

// The choice is the data-reading attribute of the html element. A script sets it before the
// first paint, and this component changes it.
const listeners = new Set<() => void>();
const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};
const current = (): ReadingFont =>
  document.documentElement.dataset.reading === "sans" ? "sans" : "serif";

/**
 * The font of the lesson text. The choice applies at once and is kept in this browser.
 * @returns The choice between the serif and the sans-serif font.
 */
export default function ReadingFontSetting() {
  const font = useSyncExternalStore(subscribe, current, () => "serif" as ReadingFont);

  function choose(next: ReadingFont) {
    if (next === "sans") document.documentElement.dataset.reading = "sans";
    else delete document.documentElement.dataset.reading;
    for (const listener of listeners) listener();
    try {
      localStorage.setItem(READING_FONT_KEY, next);
    } catch {
      // The choice is not saved for the next visit. It still applies now.
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BookOpen className="size-4" aria-hidden /> Font
        </CardTitle>
        <CardDescription>
          The font of the whole app. The change applies at once, in this browser.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <fieldset className="grid gap-2 sm:grid-cols-2">
          <legend className="sr-only">Font</legend>
          {options.map((item) => (
            <label
              key={item.id}
              className={cn(
                "block cursor-pointer rounded-base border border-border p-3 has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-border",
                font === item.id ? "choice-on" : "bg-secondary-background",
              )}
            >
              <input
                type="radio"
                name="reading-font"
                value={item.id}
                checked={font === item.id}
                onChange={() => choose(item.id)}
                className="sr-only"
              />
              <span className="flex items-center gap-2 font-medium">
                {item.title}
                {font === item.id && <CircleCheck className="size-4" />}
              </span>
              <span className={cn("mt-1 block", item.className)}>{item.sample}</span>
            </label>
          ))}
        </fieldset>
      </CardContent>
    </Card>
  );
}
