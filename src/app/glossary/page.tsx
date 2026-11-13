import Link from "next/link";
import GlossaryList from "@/components/GlossaryList";
import { glossary } from "@/lib/glossary";

export default function GlossaryPage() {
  return (
    <main className="mx-auto w-full max-w-3xl space-y-8 px-6 py-10 text-sm leading-relaxed">
      <header className="space-y-3">
        <h1 className="text-3xl font-semibold tracking-tight">Glossary</h1>
        <p className="max-w-2xl text-base text-muted-foreground">
          {glossary.length} terms from the katas, the worked answers, and the Learn pages, in plain
          words. Each term has an example. Most have a link to a lesson and to Wikipedia.
        </p>
        <p className="text-muted-foreground">
          The architecture styles and characteristics have their own lessons on the{" "}
          <Link href="/learn" className="text-primary hover:underline">
            Learn page
          </Link>
          .
        </p>
      </header>
      <GlossaryList />
    </main>
  );
}
