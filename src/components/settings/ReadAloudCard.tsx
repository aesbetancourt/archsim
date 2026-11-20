import { CircleCheck, LoaderCircle, Volume2 } from "lucide-react";
import { Field } from "@/components/settings/Field";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { googleVoices } from "@/lib/ai/voices";
import type { ReadAloud, SpeechEngine } from "@/lib/store/settings";
import { cn } from "@/lib/utils";

const speechEngines: { id: SpeechEngine; title: string; description: string }[] = [
  {
    id: "google",
    title: "Google Cloud voice",
    description:
      "Natural Chirp 3: HD voices. Google bills the project. Each sentence is saved, so a replay is free.",
  },
  {
    id: "browser",
    title: "Browser voice",
    description:
      "The voices of this computer. Free and offline. The quality depends on the system.",
  },
];

// The voice that reads the lessons: the Google voice with its project, or the voice of the browser.
export default function ReadAloudCard({
  value,
  onChange,
  onSample,
  disabled,
  sampling,
}: {
  value: ReadAloud;
  onChange: (value: ReadAloud) => void;
  // Save the settings, then read a short sample with the saved voice.
  onSample: () => void;
  // The form does a save, a test, or a sample now.
  disabled: boolean;
  sampling: boolean;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Volume2 className="size-4" aria-hidden /> Read aloud
        </CardTitle>
        <CardDescription>
          The voice that reads the lessons. Press Alt+R on a lesson, or click the play button next
          to a paragraph.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <fieldset className="grid gap-2 sm:grid-cols-2">
          <legend className="sr-only">Voice engine</legend>
          {speechEngines.map((item) => (
            <label
              key={item.id}
              className={cn(
                "block cursor-pointer rounded-base border border-border p-3 has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-border",
                value.engine === item.id ? "choice-on" : "bg-secondary-background",
              )}
            >
              <input
                type="radio"
                name="speech-engine"
                value={item.id}
                checked={value.engine === item.id}
                onChange={() => onChange({ ...value, engine: item.id })}
                className="sr-only"
              />
              <span className="flex items-center gap-2 font-medium">
                {item.title}
                {value.engine === item.id && <CircleCheck className="size-4" />}
              </span>
              <span className={value.engine === item.id ? "" : "text-muted-foreground"}>
                {item.description}
              </span>
            </label>
          ))}
        </fieldset>
        {value.engine === "google" && (
          <>
            <Field
              id="gcp-project"
              label="Google Cloud project ID"
              hint="The project that pays for the voice. The Text-to-Speech API must be on in it. Leave empty to use the quota project of your login. Log in one time with: gcloud auth application-default login"
            >
              <Input
                id="gcp-project"
                value={value.googleProjectId}
                onChange={(event) => onChange({ ...value, googleProjectId: event.target.value })}
                placeholder="my-project-id"
                autoComplete="off"
                spellCheck={false}
              />
            </Field>
            <Field id="gcp-voice" label="Voice">
              <Select
                items={googleVoices.map((item) => ({ value: item.id, label: item.label }))}
                value={value.googleVoice}
                onValueChange={(picked) =>
                  picked !== null && onChange({ ...value, googleVoice: picked })
                }
              >
                <SelectTrigger id="gcp-voice">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent align="start">
                  {googleVoices.map((item) => (
                    <SelectItem key={item.id} value={item.id}>
                      {item.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          </>
        )}
        <Button variant="neutral" onClick={onSample} disabled={disabled}>
          {sampling ? <LoaderCircle className="animate-spin" /> : <Volume2 />}
          Save and play a sample
        </Button>
      </CardContent>
    </Card>
  );
}
