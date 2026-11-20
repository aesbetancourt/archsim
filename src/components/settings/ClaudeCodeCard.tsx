import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/settings/Field";
import type { Settings } from "@/lib/store/settings";

/**
 * The settings of the Claude Code connection.
 * @returns The fields of the connection.
 */
export default function ClaudeCodeCard({
  value,
  onChange,
}: {
  value: Settings["claudeCode"];
  onChange: (value: Settings["claudeCode"]) => void;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Claude Code</CardTitle>
        <CardDescription>The app starts the claude command for each review.</CardDescription>
      </CardHeader>
      <CardContent>
        <Field
          id="claude-model"
          label="Model"
          hint="Leave empty to use your Claude Code default. Examples: opus, sonnet, fable."
        >
          <Input
            id="claude-model"
            value={value.model}
            onChange={(event) => onChange({ model: event.target.value })}
            placeholder="Default"
          />
        </Field>
      </CardContent>
    </Card>
  );
}
