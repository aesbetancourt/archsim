"use client";

import { LoaderCircle, RefreshCw } from "lucide-react";
import { useEffect, useState } from "react";
import { Field } from "@/components/settings/Field";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Settings } from "@/lib/store/settings";

type VertexModels = ReturnType<typeof useVertexModels>;

// The models that Vertex AI offers for a project and a location. The list loads when the card
// opens. The form calls this hook, not the card, so the list stays when the person looks at a
// different connection and comes back.
export function useVertexModels(open: boolean, projectId: string, location: string) {
  const [list, setList] = useState<{ gemini: string[]; claude: string[] } | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  // "Other model" shows a text field, for a model ID that is not in the list.
  const [other, setOther] = useState(false);

  async function load() {
    setLoading(true);
    setError("");
    const query = new URLSearchParams({ project: projectId, location });
    try {
      const response = await fetch(`/api/vertex/models?${query}`);
      const body = await response.json();
      if (!response.ok) throw new Error(body.error ?? "Vertex AI did not list the models.");
      setList(body);
    } catch (error) {
      setError((error as Error).message);
      setList(null);
    }
    setLoading(false);
  }

  useEffect(() => {
    if (open && list === null && !loading && !error) void load();
    // Load again only when the card opens. A change of the project or location has its button.
    // oxlint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  return { list, error, loading, other, setOther, load };
}

// The settings of the Google Vertex AI connection.
export default function VertexCard({
  value,
  onChange,
  models,
  voiceProjectId,
}: {
  value: Settings["vertex"];
  onChange: (value: Settings["vertex"]) => void;
  models: VertexModels;
  // The project of the Google voices. Vertex AI uses it when its own project field is empty.
  voiceProjectId: string;
}) {
  const listed = models.list ? [...models.list.gemini, ...models.list.claude] : [];
  const showOther = models.other || (models.list !== null && !listed.includes(value.model));
  // The labels that the model menu shows for each value.
  const items = [
    ...(models.list === null && !showOther
      ? [{ value: value.model, label: models.loading ? "Loading the models…" : value.model }]
      : []),
    ...listed.map((id) => ({ value: id, label: id })),
    { value: "__other", label: "Other model…" },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Google Vertex AI</CardTitle>
        <CardDescription>
          The diagram and your text go to Vertex AI in your Google Cloud project. It uses the gcloud
          login on this computer, as the Google voices do. Google bills the project.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Field
          id="vertex-project"
          label="Google Cloud project ID"
          hint={`The Vertex AI API must be on in the project. Leave empty to use ${
            voiceProjectId
              ? `the project of the Google voices (${voiceProjectId})`
              : "the quota project of your login"
          }. Log in one time with: gcloud auth application-default login`}
        >
          <Input
            id="vertex-project"
            value={value.projectId}
            onChange={(event) => onChange({ ...value, projectId: event.target.value })}
            placeholder={voiceProjectId || "my-project-id"}
            autoComplete="off"
            spellCheck={false}
          />
        </Field>
        <Field
          id="vertex-location"
          label="Location"
          hint="global works for most Gemini models. A Claude model can need a region, for example us-east5."
        >
          <Input
            id="vertex-location"
            value={value.location}
            onChange={(event) => onChange({ ...value, location: event.target.value })}
            autoComplete="off"
            spellCheck={false}
          />
        </Field>
        <Field
          id="vertex-model"
          label="Model"
          hint={
            models.error ||
            "Gemini models work at once. A Claude model must be enabled in the Model Garden of the project first, and can need a region such as us-east5."
          }
        >
          <div className="flex gap-2">
            <Select
              items={items}
              value={showOther ? "__other" : value.model}
              onValueChange={(picked) => {
                if (picked === null) return;
                if (picked === "__other") {
                  models.setOther(true);
                } else {
                  models.setOther(false);
                  onChange({ ...value, model: picked });
                }
              }}
              disabled={models.loading}
            >
              <SelectTrigger id="vertex-model">
                <SelectValue />
              </SelectTrigger>
              <SelectContent align="start">
                {models.list === null && !showOther && (
                  <SelectItem value={value.model}>
                    {models.loading ? "Loading the models…" : value.model}
                  </SelectItem>
                )}
                {models.list && models.list.gemini.length > 0 && (
                  <SelectGroup>
                    <SelectLabel className="text-muted-foreground">Gemini</SelectLabel>
                    {models.list.gemini.map((id) => (
                      <SelectItem key={id} value={id}>
                        {id}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                )}
                {models.list && models.list.claude.length > 0 && (
                  <SelectGroup>
                    <SelectLabel className="text-muted-foreground">
                      Claude (enable in the Model Garden first)
                    </SelectLabel>
                    {models.list.claude.map((id) => (
                      <SelectItem key={id} value={id}>
                        {id}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                )}
                <SelectItem value="__other">Other model…</SelectItem>
              </SelectContent>
            </Select>
            <Button
              type="button"
              variant="neutral"
              onClick={() => void models.load()}
              disabled={models.loading}
              title="List the models again, for the project and the location above"
            >
              {models.loading ? <LoaderCircle className="animate-spin" /> : <RefreshCw />}
              List
            </Button>
          </div>
          {showOther && (
            <Input
              aria-label="Model ID"
              value={value.model}
              onChange={(event) => onChange({ ...value, model: event.target.value })}
              placeholder="gemini-4-neon"
              autoComplete="off"
              spellCheck={false}
            />
          )}
        </Field>
      </CardContent>
    </Card>
  );
}
