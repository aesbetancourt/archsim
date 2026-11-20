import { CircleHelp } from "lucide-react";
import { readFile } from "node:fs/promises";
import path from "node:path";
import Prose from "@/components/Prose";

// The guide is a Markdown file, so you can change it without a change to the code.

export default async function GuidePage() {
  const markdown = await readFile(path.join(process.cwd(), "content", "guide.md"), "utf8");
  return (
    <main className="mx-auto w-full max-w-3xl space-y-8 px-6 py-10 text-sm leading-relaxed">
      <header className="space-y-3">
        <h1 className="flex items-center gap-3 text-3xl font-semibold tracking-tight">
          <CircleHelp className="size-7 shrink-0 text-primary" aria-hidden />
          How to use Charrette
        </h1>
        <p className="max-w-2xl text-base text-muted-foreground">
          How to practice with the katas, how to study with the lessons and the drills, and a plan
          for each week.
        </p>
      </header>
      <Prose markdown={markdown} />
    </main>
  );
}
