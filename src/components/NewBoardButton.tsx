"use client";

import { LoaderCircle, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { createBoard } from "@/lib/browser/api";

// Create a board, then open it.
export default function NewBoardButton() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function create() {
    setBusy(true);
    const body = await createBoard();
    router.push(`/scratchpad/${body.id}`);
  }

  return (
    <Button onClick={create} disabled={busy}>
      {busy ? <LoaderCircle className="animate-spin" /> : <Plus />}
      New board
    </Button>
  );
}
