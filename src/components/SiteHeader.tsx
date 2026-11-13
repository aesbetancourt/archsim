import { Blocks, BookA, BookOpen, DraftingCompass, GraduationCap, Library, Lightbulb, PencilRuler, Settings, Sparkles, Target } from "lucide-react";
import Link from "next/link";
import LinkButton from "@/components/LinkButton";
import NavMenu from "@/components/NavMenu";
import ThemeToggle from "@/components/ThemeToggle";

const practice = [
  { href: "/", title: "Katas", description: "Katas and interview questions, with a review.", icon: <Target /> },
  { href: "/solve", title: "Solve a problem", description: "Paste a problem and get a worked answer.", icon: <Sparkles /> },
  { href: "/community", title: "Architectural Katas", description: "The collection of Ted Neward.", icon: <Library /> },
];

const learn = [
  { href: "/learn", title: "Lessons", description: "The knowledge areas of an architect.", icon: <BookOpen /> },
  { href: "/learn/building-blocks", title: "Building blocks", description: "The standard pieces and what each one costs.", icon: <Blocks /> },
  { href: "/learn/examples", title: "Worked examples", description: "Finished katas, step by step.", icon: <Lightbulb /> },
  { href: "/glossary", title: "Glossary", description: "Terms in plain words.", icon: <BookA /> },
];

export default function SiteHeader() {
  return (
    <header className="flex h-14 shrink-0 items-center gap-6 border-b-2 bg-card px-6">
      <Link href="/" className="flex items-center gap-2 font-semibold tracking-tight">
        <DraftingCompass className="size-5 text-primary" />
        ArchSim
      </Link>
      <nav className="flex items-center gap-1">
        <NavMenu label="Practice" icon={<Target />} items={practice} />
        <NavMenu label="Learn" icon={<GraduationCap />} items={learn} />
        <LinkButton variant="ghost" size="sm" href="/scratchpad">
          <PencilRuler /> Scratchpad
        </LinkButton>
      </nav>
      <div className="ml-auto flex items-center gap-1">
        <LinkButton variant="ghost" size="icon" href="/settings" aria-label="Settings">
          <Settings />
        </LinkButton>
        <ThemeToggle />
      </div>
    </header>
  );
}
