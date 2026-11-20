import { ScrollText } from "lucide-react";
import CheatsheetView from "@/components/CheatsheetView";
import { readCheatsheets } from "@/lib/content/cheatsheets";

/**
 * The cheatsheets, with the key facts of each section of the lessons.
 * @returns The cheatsheets page.
 */
export default async function CheatsheetsPage() {
  const sheets = await readCheatsheets();
  return (
    <main className="mx-auto w-full max-w-3xl space-y-4 px-6 py-10 text-sm leading-relaxed">
      <header className="space-y-3">
        <h1 className="flex items-center gap-3 text-3xl font-semibold tracking-tight">
          <ScrollText className="size-7 shrink-0 text-primary" aria-hidden />
          Cheatsheets
        </h1>
        <p className="max-w-2xl text-base text-muted-foreground">
          The key facts of each section on one page: what to select and when, rules of thumb,
          numbers to know, and short comparisons. Use it to review before a kata or an interview.
          Each entry has an arrow to the lesson that explains it.
        </p>
      </header>
      <CheatsheetView sheets={sheets} />
    </main>
  );
}
