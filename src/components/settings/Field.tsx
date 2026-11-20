import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

// One field of the Settings form: a label, the control, and a hint under it.
export function Field({
  id,
  label,
  hint,
  children,
}: {
  id: string;
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      {children}
      {hint && <p className="text-muted-foreground">{hint}</p>}
    </div>
  );
}

// The field for an API key. The app does not show a saved key, so the field starts empty.
// An empty field keeps the saved key.
export function ApiKeyField({
  id,
  value,
  onChange,
  keyHint,
  noKey = "No key is saved.",
  placeholder,
}: {
  id: string;
  value: string;
  onChange: (value: string) => void;
  // The last characters of the saved key, or an empty text when no key is saved.
  keyHint: string;
  noKey?: string;
  placeholder?: string;
}) {
  return (
    <Field
      id={id}
      label="API key"
      hint={keyHint ? `A key is saved (${keyHint}). Leave empty to keep it.` : noKey}
    >
      <Input
        id={id}
        type="password"
        autoComplete="off"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
      />
    </Field>
  );
}
