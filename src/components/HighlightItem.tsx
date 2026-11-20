"use client";

import { Trash2 } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import type { Highlight } from "@/lib/store/notebook";

/**
 * One highlighted passage with its note. The note is saved when the text box loses focus.
 * @returns The passage and its note field.
 */
export default function HighlightItem({
  item,
  onShow,
  onChange,
  onRemove,
}: {
  item: Highlight;
  // With this function, a click on the passage shows it on the page.
  onShow?: () => void;
  onChange: (note: string) => void;
  onRemove: () => void;
}) {
  const [note, setNote] = useState(item.note);
  const quote = "border-l-4 border-[#ffe45c] pl-3 text-left";
  return (
    <li className="space-y-2 border-b pb-3 last:border-b-0 last:pb-0">
      {onShow ? (
        <button
          type="button"
          title="Show this passage on the page"
          className={`${quote} block w-full cursor-pointer hover:underline`}
          onClick={onShow}
        >
          {item.text}
        </button>
      ) : (
        <blockquote className={quote}>{item.text}</blockquote>
      )}
      <Textarea
        aria-label="Note for this highlight"
        placeholder="Add a note."
        className="min-h-0"
        rows={note ? 2 : 1}
        value={note}
        onChange={(event) => setNote(event.target.value)}
        onBlur={() => note !== item.note && onChange(note)}
      />
      <div className="flex justify-end">
        <Button size="xs" variant="neutral" onClick={onRemove}>
          <Trash2 /> Remove
        </Button>
      </div>
    </li>
  );
}
