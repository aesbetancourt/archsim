"use client";

import { LoaderCircle, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";

// Create a board, then open it.
export default function NewBoardButton() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function create() {
    setBusy(true);
    const response = await fetch("/api/boards", { method: "POST" });
    const body = await response.json();
    router.push(`/scratchpad/${body.id}`);
  }

  return (
    <Button onClick={create} disabled={busy}>
      {busy ? <LoaderCircle className="animate-spin" /> : <Plus />}
      New board
    </Button>
  );
}
