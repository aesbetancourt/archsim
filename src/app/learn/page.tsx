import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { wikiPages } from "@/lib/wiki";
import { wikiSections } from "@/lib/wiki-pages";

export default function LearnPage() {
  return (
    <main className="mx-auto w-full max-w-4xl space-y-10 px-6 py-10 text-sm leading-relaxed">
      <header className="space-y-3">
        <h1 className="text-3xl font-semibold tracking-tight">Learn</h1>
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
        {wikiSections.map((section) => (
          <Card key={section.title}>
            <CardHeader>
              <CardTitle>{section.title}</CardTitle>
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
        ))}
      </div>
    </main>
  );
}
