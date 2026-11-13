import { Activity, ArrowLeftRight, BookOpen, Boxes, Code, Compass, Database, GraduationCap, ListChecks, type LucideIcon, Users } from "lucide-react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { wikiPages } from "@/lib/wiki";
import { wikiSections } from "@/lib/wiki-pages";

const sectionIcons: Record<string, LucideIcon> = {
  "Start here": Compass,
  Characteristics: ListChecks,
  Structure: Boxes,
  "Inside one application": Code,
  Data: Database,
  Communication: ArrowLeftRight,
  "Reliability and operations": Activity,
  "The architect at work": Users,
};

export default function LearnPage() {
  return (
    <main className="mx-auto w-full max-w-4xl space-y-10 px-6 py-10 text-sm leading-relaxed">
      <header className="space-y-3">
        <h1 className="flex items-center gap-3 text-3xl font-semibold tracking-tight">
          <GraduationCap className="size-7 shrink-0 text-primary" aria-hidden />
          Learn
        </h1>
        <p className="max-w-2xl text-base text-muted-foreground">
          A reference for the knowledge areas of a senior software architect, in {wikiPages.length}{" "}
          pages. Read a section in order, or go directly to the page you need during a kata.
        </p>
        <p className="max-w-2xl text-muted-foreground">
          The pages give you the concepts and the vocabulary. Judgment comes from practice: do a
          kata after each section, and read the review.
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2">
        {wikiSections.map((section) => {
          const Icon = sectionIcons[section.title] ?? BookOpen;
          return (
          <Card key={section.title}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Icon className="size-4 text-primary" aria-hidden /> {section.title}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {section.pages
                  .filter((page) => page.kind !== "style")
                  .map((page) => (
                    <li key={page.slug}>
                      <Link href={`/learn/${page.slug}`} className="font-medium text-primary hover:underline">
                        {page.title}
                      </Link>
                      <p className="text-muted-foreground">{page.summary}</p>
                    </li>
                  ))}
              </ul>
            </CardContent>
          </Card>
          );
        })}
      </div>
    </main>
  );
}
