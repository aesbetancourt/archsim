"use client";

import Highlight from "@tiptap/extension-highlight";
import { EditorContent, useEditor, useEditorState } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { Bold, Heading2, Highlighter, Italic, List, ListOrdered, Redo2, Strikethrough, TextQuote, Undo2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { loadNotesHtml, notesText, saveNotesHtml } from "@/lib/notes";

type Props = {
  kataId: string;
  // Called with the plain text of the notes after each change.
  onTextChange: (text: string) => void;
};

function Tool({ label, active, disabled, onClick, children }: { label: string; active?: boolean; disabled?: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      aria-pressed={active}
      disabled={disabled}
      // Keep the text selection when the user presses a tool.
      onMouseDown={(event) => event.preventDefault()}
      onClick={onClick}
      className={cn(
        "flex size-8 items-center justify-center rounded-base border-2 border-transparent hover:border-border disabled:opacity-40 [&_svg]:size-4",
        active && "border-border bg-main text-main-foreground",
      )}
    >
      {children}
    </button>
  );
}

// The notepad of a kata: a text editor with basic formats and a highlighter.
export default function NotesEditor({ kataId, onTextChange }: Props) {
  const editor = useEditor({
    extensions: [StarterKit, Highlight],
    content: typeof window === "undefined" ? "" : loadNotesHtml(kataId),
    // The editor starts in the browser only. This prevents a mismatch with the server page.
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class: "notes-editor mx-auto min-h-full max-w-3xl px-8 py-6 outline-none",
        "aria-label": "Notes for this kata",
      },
    },
    onUpdate: ({ editor }) => {
      const html = editor.isEmpty ? "" : editor.getHTML();
      saveNotesHtml(kataId, html);
      onTextChange(notesText(html));
    },
  });

  const current = useEditorState({
    editor,
    selector: ({ editor }) =>
      editor
        ? {
            bold: editor.isActive("bold"),
            italic: editor.isActive("italic"),
            strike: editor.isActive("strike"),
            highlight: editor.isActive("highlight"),
            heading: editor.isActive("heading", { level: 2 }),
            bullets: editor.isActive("bulletList"),
            numbers: editor.isActive("orderedList"),
            quote: editor.isActive("blockquote"),
            canUndo: editor.can().undo(),
            canRedo: editor.can().redo(),
            empty: editor.isEmpty,
          }
        : null,
  });

  if (!editor) return null;
  // The state is empty for a moment after the editor starts.
  const state = current ?? {
    bold: false, italic: false, strike: false, highlight: false, heading: false,
    bullets: false, numbers: false, quote: false, canUndo: false, canRedo: false, empty: editor.isEmpty,
  };
  const run = () => editor.chain().focus();

  return (
    <div className="flex h-full flex-col">
      <div role="toolbar" aria-label="Text format" className="flex flex-wrap items-center gap-1 border-b-2 px-3 py-1.5">
        <Tool label="Highlight" active={state.highlight} onClick={() => run().toggleHighlight().run()}>
          <Highlighter />
        </Tool>
        <span className="mx-1 h-5 w-0.5 bg-border" />
        <Tool label="Bold" active={state.bold} onClick={() => run().toggleBold().run()}>
          <Bold />
        </Tool>
        <Tool label="Italic" active={state.italic} onClick={() => run().toggleItalic().run()}>
          <Italic />
        </Tool>
        <Tool label="Strike through" active={state.strike} onClick={() => run().toggleStrike().run()}>
          <Strikethrough />
        </Tool>
        <span className="mx-1 h-5 w-0.5 bg-border" />
        <Tool label="Heading" active={state.heading} onClick={() => run().toggleHeading({ level: 2 }).run()}>
          <Heading2 />
        </Tool>
        <Tool label="Bullet list" active={state.bullets} onClick={() => run().toggleBulletList().run()}>
          <List />
        </Tool>
        <Tool label="Numbered list" active={state.numbers} onClick={() => run().toggleOrderedList().run()}>
          <ListOrdered />
        </Tool>
        <Tool label="Quote" active={state.quote} onClick={() => run().toggleBlockquote().run()}>
          <TextQuote />
        </Tool>
        <span className="mx-1 h-5 w-0.5 bg-border" />
        <Tool label="Undo" disabled={!state.canUndo} onClick={() => run().undo().run()}>
          <Undo2 />
        </Tool>
        <Tool label="Redo" disabled={!state.canRedo} onClick={() => run().redo().run()}>
          <Redo2 />
        </Tool>
      </div>
      <div className="relative min-h-0 flex-1 overflow-y-auto" onClick={() => editor.commands.focus()}>
        {state.empty && (
          <p className="pointer-events-none absolute inset-x-0 mx-auto max-w-3xl px-8 py-6 text-[0.95rem] leading-7 text-muted-foreground">
            Think here before you draw. What does the system do? What is hard? What are your questions and
            assumptions?
          </p>
        )}
        <EditorContent editor={editor} className="h-full" />
      </div>
    </div>
  );
}
