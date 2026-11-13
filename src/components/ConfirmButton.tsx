"use client";

import { LoaderCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

type Props = {
  label: React.ReactNode;
  title: string;
  description: string;
  confirmLabel: string;
  // The address that gets a DELETE request after the user confirms.
  endpoint: string;
  // The page to open after the request. Without it, the current page loads again.
  redirectTo?: string;
  size?: React.ComponentProps<typeof Button>["size"];
  variant?: React.ComponentProps<typeof Button>["variant"];
  ariaLabel?: string;
};

// A button that asks for confirmation, then sends a DELETE request.
export default function ConfirmButton({ label, title, description, confirmLabel, endpoint, redirectTo, size = "sm", variant = "neutral", ariaLabel }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function run() {
    setBusy(true);
    setError("");
    const response = await fetch(endpoint, { method: "DELETE" });
    if (!response.ok) {
      setError("The request failed. Try again.");
      setBusy(false);
      return;
    }
    setOpen(false);
    setBusy(false);
    if (redirectTo) router.push(redirectTo);
    router.refresh();
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant={variant} size={size} aria-label={ariaLabel} />}>{label}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        {error && <p className="text-sm text-destructive">{error}</p>}
        <DialogFooter>
          <Button variant="neutral" onClick={() => setOpen(false)} disabled={busy}>
            Cancel
          </Button>
          <Button onClick={run} disabled={busy}>
            {busy && <LoaderCircle className="animate-spin" />}
            {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
