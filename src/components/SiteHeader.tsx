import {
  Blocks,
  BookA,
  BookOpen,
  DraftingCompass,
  GraduationCap,
  Library,
  Lightbulb,
  MessageCircleQuestion,
  NotebookPen,
  PencilRuler,
  Repeat,
  ScrollText,
  Settings,
  Sparkles,
  Target,
} from "lucide-react";
import Link from "next/link";
import CommandPalette from "@/components/CommandPalette";
import LinkButton from "@/components/LinkButton";
import NavMenu from "@/components/NavMenu";
import ThemeToggle from "@/components/ThemeToggle";

const practice = [
  {
    href: "/",
    title: "Katas",
    description: "Katas and interview questions, with a review.",
    icon: <Target />,
  },
  {
    href: "/solve",
    title: "Solve a problem",
    description: "Paste a problem and get a worked answer.",
    icon: <Sparkles />,
  },
  {
    href: "/community",
    title: "Architectural Katas",
    description: "The collection of Ted Neward.",
    icon: <Library />,
  },
];

const learn = [
  {
    href: "/learn",
    title: "Lessons",
    description: "The knowledge areas of an architect.",
    icon: <BookOpen />,
  },
  {
    href: "/learn/building-blocks",
    title: "Building blocks",
    description: "The standard pieces and what each one costs.",
    icon: <Blocks />,
  },
  {
    href: "/learn/cheatsheets",
    title: "Cheatsheets",
    description: "The key facts of each section, on one page.",
    icon: <ScrollText />,
  },
  {
    href: "/learn/examples",
    title: "Worked examples",
    description: "Finished katas, step by step.",
    icon: <Lightbulb />,
  },
  { href: "/glossary", title: "Glossary", description: "Terms in plain words.", icon: <BookA /> },
  {
    href: "/drill",
    title: "Vocabulary drill",
    description: "Explain the terms, with spaced repetition.",
    icon: <Repeat />,
  },
  {
    href: "/drill/questions",
    title: "Question drill",
    description: "Answer the interview questions, with an AI check.",
    icon: <MessageCircleQuestion />,
  },
];

export default function SiteHeader() {
  return (
    // The spaces are smaller below 1024px, so the bar fits a narrow window without a side scroll.
    <header className="flex h-14 shrink-0 items-center gap-3 border-b bg-card px-4 lg:gap-6 lg:px-6">
      <Link href="/" className="flex items-center gap-2 font-semibold tracking-tight">
        <DraftingCompass className="size-5 text-primary" />
        Charrette
      </Link>
      <nav className="flex min-w-0 items-center gap-1">
        <NavMenu label="Practice" icon={<Target />} items={practice} />
        <NavMenu label="Learn" icon={<GraduationCap />} items={learn} />
        <LinkButton
          variant="ghost"
          size="sm"
          href="/scratchpad"
          aria-label="Scratchpad"
          title="Scratchpad"
        >
          <PencilRuler /> <span className="hidden md:inline">Scratchpad</span>
        </LinkButton>
        <LinkButton
          variant="ghost"
          size="sm"
          href="/notebook"
          aria-label="Notebook"
          title="Notebook"
        >
          <NotebookPen /> <span className="hidden md:inline">Notebook</span>
        </LinkButton>
      </nav>
      <div className="ml-auto flex items-center gap-1">
        <CommandPalette />
        <LinkButton variant="ghost" size="icon" href="/settings" aria-label="Settings">
          <Settings />
        </LinkButton>
        <ThemeToggle />
      </div>
    </header>
  );
}
