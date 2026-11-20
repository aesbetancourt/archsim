import { CircleHelp } from "lucide-react";
import { readFile } from "node:fs/promises";
import path from "node:path";
import Prose from "@/components/Prose";
import { TourReplays } from "@/components/Tour";

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
      <section className="space-y-2 rounded-base border bg-card p-4" aria-labelledby="tours-title">
        <h2 id="tours-title" className="font-semibold">
          The tours
        </h2>
        <p className="text-muted-foreground">
          A tour shows the parts of a kata. Start it again here. To see the welcome tour again, use
          Take the tour on the home page.
        </p>
        <TourReplays />
      </section>
      <Prose markdown={markdown} />
    </main>
  );
}
