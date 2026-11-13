import { DraftingCompass, Settings } from "lucide-react";
import Link from "next/link";
import ThemeToggle from "@/components/ThemeToggle";
import { Button } from "@/components/ui/button";

export default function SiteHeader() {
  return (
    <header className="flex h-14 shrink-0 items-center gap-6 border-b bg-card px-6">
      <Link href="/" className="flex items-center gap-2 font-semibold tracking-tight">
        <DraftingCompass className="size-5 text-primary" />
        ArchSim
      </Link>
      <nav className="flex items-center gap-1">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/">Katas</Link>
        </Button>
        <Button variant="ghost" size="sm" asChild>
          <Link href="/learn">Learn</Link>
        </Button>
        <Button variant="ghost" size="sm" asChild>
          <Link href="/learn/examples">Worked examples</Link>
        </Button>
        <Button variant="ghost" size="sm" asChild>
          <Link href="/solve">Solve a problem</Link>
        </Button>
        <Button variant="ghost" size="sm" asChild>
          <Link href="/glossary">Glossary</Link>
        </Button>
      </nav>
      <div className="ml-auto flex items-center gap-1">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/settings" aria-label="Settings">
            <Settings />
          </Link>
        </Button>
        <ThemeToggle />
      </div>
    </header>
  );
}
