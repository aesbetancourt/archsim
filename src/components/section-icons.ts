import {
  Activity,
  ArrowLeftRight,
  BookOpen,
  Bot,
  Boxes,
  ClipboardList,
  Code,
  Compass,
  Database,
  ListChecks,
  type LucideIcon,
  MessagesSquare,
  Users,
} from "lucide-react";

const icons: Record<string, LucideIcon> = {
  "Start here": Compass,
  Characteristics: ListChecks,
  Structure: Boxes,
  "Inside one application": Code,
  Data: Database,
  Communication: ArrowLeftRight,
  "Reliability and operations": Activity,
  "The architect at work": Users,
  "Product and decisions": ClipboardList,
  "AI systems": Bot,
  "System design cases": MessagesSquare,
};

/**
 * The icon of a section of the Learn area. The Learn page and the sidebar use the same icons.
 * @param title The title of the section.
 * @returns The icon of the section, or a book icon for a section with no icon of its own.
 */
export const sectionIcon = (title: string): LucideIcon => icons[title] ?? BookOpen;
