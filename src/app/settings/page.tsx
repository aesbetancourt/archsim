import { Settings } from "lucide-react";
import SettingsForm from "@/components/SettingsForm";
import { readSettings, toPublic } from "@/lib/settings";

// Read the settings file on each request.
export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  return (
    <main className="mx-auto w-full max-w-3xl space-y-8 px-6 py-10 text-sm leading-relaxed">
      <header className="space-y-3">
        <h1 className="flex items-center gap-3 text-3xl font-semibold tracking-tight">
          <Settings className="size-7 shrink-0 text-primary" aria-hidden />
          Settings
        </h1>
        <p className="max-w-2xl text-base text-muted-foreground">
          Select the model that reviews your attempts and writes worked answers.
        </p>
      </header>
      <SettingsForm initial={toPublic(await readSettings())} />
    </main>
  );
}
