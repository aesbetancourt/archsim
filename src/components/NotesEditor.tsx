"use client";

import Highlight from "@tiptap/extension-highlight";
import { EditorContent, useEditor, useEditorState } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import {
  Bold,
  Heading2,
  Highlighter,
  Italic,
  List,
  ListOrdered,
  Redo2,
  Strikethrough,
  TextQuote,
  Undo2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { loadNotesHtml, saveNotesHtml } from "@/lib/browser/kata-notes";
import { notesText, toNotesHtml } from "@/lib/notes-html";

type Props = {
  // With a kata ID, the editor reads and saves the notes of that kata in the browser.
  kataId?: string;
  // Without a kata ID, the page gives the first content and saves each change itself.
  initialHtml?: string;
  onHtmlChange?: (html: string) => void;
  // Called with the plain text of the notes after each change.
  onTextChange?: (text: string) => void;
  label?: string;
  placeholder?: string;
  // Less space around the text, for a narrow column.
  compact?: boolean;
};

function Tool({
  label,
  active,
  disabled,
  onClick,
  children,
}: {
  label: string;
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
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
        "flex size-8 items-center justify-center rounded-base border border-transparent hover:border-border disabled:opacity-40 [&_svg]:size-4",
        active && "border-border bg-main text-main-foreground",
      )}
    >
      {children}
    </button>
  );
}

// The notepad of a kata or a board: a text editor with basic formats and a highlighter.
export default function NotesEditor({
  kataId,
  initialHtml,
  onHtmlChange,
  onTextChange,
  label = "Notes for this kata",
  compact = false,
  placeholder = "Think here before you draw. What does the system do? What is hard? What are your questions and assumptions?",
}: Props) {
  const space = compact ? "px-4 py-3" : "px-8 py-6";
  const editor = useEditor({
    extensions: [StarterKit, Highlight],
    content:
      typeof window === "undefined"
        ? ""
        : kataId
          ? loadNotesHtml(kataId)
          : toNotesHtml(initialHtml ?? ""),
    // The editor starts in the browser only. This prevents a mismatch with the server page.
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class: `notes-editor mx-auto min-h-full max-w-3xl outline-none ${space}`,
        "aria-label": label,
      },
    },
    onUpdate: ({ editor }) => {
      const html = editor.isEmpty ? "" : editor.getHTML();
      if (kataId) saveNotesHtml(kataId, html);
      onHtmlChange?.(html);
      onTextChange?.(notesText(html));
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
    bold: false,
    italic: false,
    strike: false,
    highlight: false,
    heading: false,
    bullets: false,
    numbers: false,
    quote: false,
    canUndo: false,
    canRedo: false,
    empty: editor.isEmpty,
  };
  const run = () => editor.chain().focus();

  return (
    <div className="flex h-full flex-col">
      <div
        role="toolbar"
        aria-label="Text format"
        className="flex flex-wrap items-center gap-1 border-b px-3 py-1.5"
      >
        <Tool
          label="Mark text"
          active={state.highlight}
          onClick={() => run().toggleHighlight().run()}
        >
          <Highlighter />
        </Tool>
        <span className="mx-1 h-5 w-0.5 bg-border" />
        <Tool label="Bold" active={state.bold} onClick={() => run().toggleBold().run()}>
          <Bold />
        </Tool>
        <Tool label="Italic" active={state.italic} onClick={() => run().toggleItalic().run()}>
          <Italic />
        </Tool>
        <Tool
          label="Strike through"
          active={state.strike}
          onClick={() => run().toggleStrike().run()}
        >
          <Strikethrough />
        </Tool>
        <span className="mx-1 h-5 w-0.5 bg-border" />
        <Tool
          label="Heading"
          active={state.heading}
          onClick={() => run().toggleHeading({ level: 2 }).run()}
        >
          <Heading2 />
        </Tool>
        <Tool
          label="Bullet list"
          active={state.bullets}
          onClick={() => run().toggleBulletList().run()}
        >
          <List />
        </Tool>
        <Tool
          label="Numbered list"
          active={state.numbers}
          onClick={() => run().toggleOrderedList().run()}
        >
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
      {/* A click in the margin also starts the editor. The keyboard reaches the editor with Tab. */}
      {/* oxlint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions */}
      <div
        className="relative min-h-0 flex-1 overflow-y-auto"
        onClick={() => editor.commands.focus()}
      >
        {state.empty && (
          <p
            className={`pointer-events-none absolute inset-x-0 mx-auto max-w-3xl text-[0.95rem] leading-7 text-muted-foreground ${space}`}
          >
            {placeholder}
          </p>
        )}
        <EditorContent editor={editor} className="h-full" />
      </div>
    </div>
  );
}
