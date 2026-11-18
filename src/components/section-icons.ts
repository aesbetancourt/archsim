import {
  Activity,
  ArrowLeftRight,
  BookOpen,
  Boxes,
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
  "System design cases": MessagesSquare,
};

// The icon of a section of the Learn area. The Learn page and the sidebar use the same icons.
export const sectionIcon = (title: string): LucideIcon => icons[title] ?? BookOpen;
