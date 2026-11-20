"use client";

import { useRouter } from "next/navigation";
import { OpenNote } from "@/components/GeneralNotes";
import { Card } from "@/components/ui/card";
import type { NoteDoc } from "@/lib/store/notebook";

/**
 * One general note on its own page, with a full-size editor.
 * The back arrow and a delete go to the notebook. The notebook page reads the notes again.
 * @returns The note page with its editor.
 */
export default function NotePage({ document }: { document: NoteDoc }) {
  const router = useRouter();
  const back = () => router.push("/notebook");
  return (
    <Card className="h-[calc(100dvh-9rem)] min-h-96 overflow-hidden py-0">
      <OpenNote
        document={document}
        compact={false}
        onBack={back}
        onChange={() => {}}
        onDeleted={back}
      />
    </Card>
  );
}
