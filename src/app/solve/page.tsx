import { Sparkles } from "lucide-react";
import SolveForm from "@/components/SolveForm";
import type { Kata } from "@/lib/katas";
import { findKata } from "@/lib/library";

// Write a kata as plain text for the problem box.
function kataText(kata: Kata): string {
  const list = (title: string, items: string[]) =>
    items.length ? `${title}:\n${items.map((item) => `- ${item}`).join("\n")}` : "";
  return [
    kata.context,
    ...(kata.details ?? []),
    kata.users ? `Users: ${kata.users}` : "",
    list("Requirements", kata.requirements),
    list("Constraints", kata.constraints),
  ]
    .filter(Boolean)
    .join("\n\n");
}

export default async function SolvePage({ searchParams }: { searchParams: Promise<{ kata?: string }> }) {
  const { kata: kataId } = await searchParams;
  const kata = kataId ? await findKata(kataId) : undefined;

  return (
    <main className="mx-auto w-full max-w-3xl space-y-6 px-6 py-10 text-sm leading-relaxed">
      <header className="space-y-3">
        <h1 className="flex items-center gap-3 text-3xl font-semibold tracking-tight">
          <Sparkles className="size-7 shrink-0 text-primary" aria-hidden />
          Solve a problem
        </h1>
        <p className="max-w-2xl text-base text-muted-foreground">
          Paste the text of a design problem, for example an interview question. The model writes a
          worked answer with the five-step method. The problem is also added to your katas, so you
          can try it with your own design.
        </p>
      </header>
      <SolveForm initialText={kata ? kataText(kata) : ""} />
    </main>
  );
}
