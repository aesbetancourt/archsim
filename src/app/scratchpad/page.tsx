import { ArrowRight, PencilRuler, Trash2 } from "lucide-react";
import Link from "next/link";
import ConfirmButton from "@/components/ConfirmButton";
import NewBoardButton from "@/components/NewBoardButton";
import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import LinkButton from "@/components/LinkButton";
import { listBoards } from "@/lib/boards";

// Read the boards on each request.
export const dynamic = "force-dynamic";

export default async function ScratchpadPage() {
  const boards = await listBoards();

  return (
    <main className="mx-auto w-full max-w-4xl space-y-8 px-6 py-10 text-sm leading-relaxed">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="space-y-3">
          <h1 className="flex items-center gap-3 text-3xl font-semibold tracking-tight">
          <PencilRuler className="size-7 shrink-0 text-primary" aria-hidden />
          Scratchpad
          </h1>
          <p className="max-w-2xl text-base text-muted-foreground">
            A free space to draw diagrams and write notes. A board is not a kata: nothing is
            reviewed, and each change is saved.
          </p>
        </div>
        <NewBoardButton />
      </header>

      {boards.length === 0 ? (
        <p className="text-muted-foreground">No boards yet. Create one to start.</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {boards.map((board) => (
            <Card key={board.id}>
              <CardHeader>
                <CardTitle>
                  <Link href={`/scratchpad/${board.id}`} className="hover:underline">
                    {board.title}
                  </Link>
                </CardTitle>
                <CardDescription className="line-clamp-3 whitespace-pre-line">
                  {board.notes || "No notes."}
                </CardDescription>
              </CardHeader>
              <CardFooter className="mt-auto items-center justify-between gap-2">
                <div className="flex items-center gap-3">
                  <LinkButton size="sm" href={`/scratchpad/${board.id}`}>
                    Open <ArrowRight />
                  </LinkButton>
                  <span className="text-xs text-muted-foreground">
                    {board.scene.elements.length} shapes · changed {new Date(board.updatedAt).toLocaleDateString()}
                  </span>
                </div>
                <ConfirmButton
                  label={<Trash2 />}
                  ariaLabel={`Remove the board ${board.title}`}
                  size="icon-xs"
                  title="Remove this board?"
                  description="This removes the board, with its diagram and notes. You cannot get it back."
                  confirmLabel="Remove"
                  endpoint={`/api/boards/${board.id}`}
                />
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </main>
  );
}
