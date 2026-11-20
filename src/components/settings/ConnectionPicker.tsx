import { CircleCheck, Cloud, KeyRound, type LucideIcon, Plug, Terminal } from "lucide-react";
import type { Mode } from "@/lib/store/settings";
import { cn } from "@/lib/utils";

// The ways to reach a model. To add one: add it here, add its card in this folder, and show the
// card in SettingsForm.tsx.
const modes: { id: Mode; title: string; description: string; icon: LucideIcon }[] = [
  {
    id: "claude-code",
    title: "Claude Code",
    icon: Terminal,
    description: "Uses the Claude Code login on this computer. No API key. This is the default.",
  },
  {
    id: "opencode",
    title: "OpenCode",
    icon: Terminal,
    description:
      "Uses the OpenCode login on this computer, in the same way as Claude Code. No API key in this app.",
  },
  {
    id: "opencode-go",
    title: "OpenCode Go",
    icon: KeyRound,
    description: "Uses an OpenCode Go API key. Requests count against your Go plan limits.",
  },
  {
    id: "anthropic",
    title: "Anthropic API",
    icon: KeyRound,
    description: "Uses an Anthropic API key. Each review is billed to that key.",
  },
  {
    id: "openai-compatible",
    title: "OpenAI-compatible endpoint",
    icon: Plug,
    description:
      "Uses a provider with an endpoint in the OpenAI format: Google Gemini, OpenRouter, OpenAI, or a local model.",
  },
  {
    id: "vertex",
    title: "Google Vertex AI",
    icon: Cloud,
    description:
      "Uses Gemini or Claude models in your Google Cloud project, with your gcloud login. No API key.",
  },
];

// The list of connections. The person selects one.
export default function ConnectionPicker({
  value,
  onChange,
}: {
  value: Mode;
  onChange: (mode: Mode) => void;
}) {
  return (
    <fieldset className="grid gap-3">
      <legend className="sr-only">Connection</legend>
      {modes.map((item) => (
        <label
          key={item.id}
          className={cn(
            "block cursor-pointer rounded-base border border-border bg-secondary-background p-4 text-left shadow-shadow transition-all hover:translate-x-boxShadowX hover:translate-y-boxShadowY hover:shadow-none has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-border",
            value === item.id && "choice-on",
          )}
        >
          <input
            type="radio"
            name="connection"
            value={item.id}
            checked={value === item.id}
            onChange={() => onChange(item.id)}
            className="sr-only"
          />
          <span className="flex items-center gap-2 font-medium">
            <item.icon className="size-4" aria-hidden />
            {item.title}
            {value === item.id && <CircleCheck className="size-4" />}
          </span>
          <span className={value === item.id ? "" : "text-muted-foreground"}>
            {item.description}
          </span>
        </label>
      ))}
    </fieldset>
  );
}
