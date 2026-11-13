import { ArrowRight, BookOpen, GraduationCap, History, Library, Lightbulb, MessagesSquare, Sparkles, Target, Trash2, UserPen } from "lucide-react";
import DifficultyIcon from "@/components/DifficultyIcon";
import InProgress from "@/components/InProgress";
import LinkButton from "@/components/LinkButton";
import Link from "next/link";
import ConfirmButton from "@/components/ConfirmButton";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { listAttempts } from "@/lib/attempts";
import { allExamples, allKatas, kataTitles } from "@/lib/library";

// Read the attempt history on each request.
export const dynamic = "force-dynamic";

export default async function Home() {
  const [attempts, katas, examples, titles] = await Promise.all([
    listAttempts(),
    allKatas(),
    allExamples(),
    kataTitles(),
  ]);
  const solved = new Set(examples.map(({ kata }) => kata.id));
  const groups = [
    { title: "Your problems", icon: UserPen, katas: katas.filter((kata) => kata.custom) },
    { title: "Katas", icon: Target, katas: katas.filter((kata) => !kata.custom && !kata.interview) },
    { title: "Interview questions", icon: MessagesSquare, katas: katas.filter((kata) => !kata.custom && kata.interview) },
  ].filter((group) => group.katas.length > 0);

  return (
    <main className="mx-auto w-full max-w-4xl space-y-12 px-6 py-10">
      <section className="space-y-4">
        <h1 className="text-3xl font-semibold tracking-tight">Challenge your software architecture knowledge</h1>
        <p className="max-w-2xl text-muted-foreground">
          Each kata is a short business problem. Draw a design, explain your decisions, and get a
          review from Claude. If the concepts are new to you, start with a finished example.
        </p>
        <div className="flex flex-wrap gap-2">
          <LinkButton href="/learn/examples">
              <BookOpen /> Study a finished kata
            </LinkButton>
          <LinkButton variant="neutral" href="/learn">
            <GraduationCap /> Learn the method and the styles
          </LinkButton>
          <LinkButton variant="neutral" href="/solve">
              <Sparkles /> Solve your own problem
            </LinkButton>
        </div>
      </section>

      <InProgress titles={Object.fromEntries(titles)} />

      {groups.map((group) => (
      <section key={group.title} className="space-y-4">
        <h2 className="flex items-center gap-2 text-lg font-semibold tracking-tight">
          <group.icon className="size-5 text-primary" aria-hidden /> {group.title}
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {group.katas.map((kata) => (
            <Card key={kata.id}>
              <CardHeader>
                <div className="flex items-center justify-between gap-2">
                  <CardTitle>{kata.title}</CardTitle>
                  <div className="flex shrink-0 gap-1">
                    {kata.interview && (
                      <Badge variant="neutral">
                        <MessagesSquare /> interview
                      </Badge>
                    )}
                    {kata.custom && (
                      <Badge variant="neutral">
                        <UserPen /> yours
                      </Badge>
                    )}
                    <Badge variant={kata.difficulty === "hard" ? "default" : "neutral"}>
                      <DifficultyIcon level={kata.difficulty} /> {kata.difficulty}
                    </Badge>
                  </div>
                </div>
                <CardDescription className="line-clamp-3">{kata.context}</CardDescription>
              </CardHeader>
              {kata.users && <CardContent className="text-sm text-muted-foreground">{kata.users}</CardContent>}
              <CardFooter className="mt-auto gap-2">
                <LinkButton size="sm" href={`/kata/${kata.id}`}>
                    Start <ArrowRight />
                  </LinkButton>
                {solved.has(kata.id) && (
                  <LinkButton size="sm" variant="ghost" href={`/learn/examples/${kata.id}`}>
                    <Lightbulb /> See a finished answer
                  </LinkButton>
                )}
              </CardFooter>
            </Card>
          ))}
        </div>
      </section>
      ))}

      <section className="space-y-4">
        <h2 className="flex items-center gap-2 text-lg font-semibold tracking-tight">
          <Library className="size-5 text-primary" aria-hidden /> More katas
        </h2>
        <Card>
          <CardHeader>
            <CardTitle>Architectural Katas, by Ted Neward</CardTitle>
            <CardDescription>
              The collection that started the architecture kata. It has about 40 short problems,
              from pet finders to auction sites. The app reads them from the public repository.
            </CardDescription>
          </CardHeader>
          <CardFooter>
            <LinkButton size="sm" href="/community">
                Browse the collection <ArrowRight />
              </LinkButton>
          </CardFooter>
        </Card>
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between gap-4">
          <h2 className="flex items-center gap-2 text-lg font-semibold tracking-tight">
            <History className="size-5 text-primary" aria-hidden /> Your history
          </h2>
          {attempts.length > 0 && (
            <ConfirmButton
              label={
                <>
                  <Trash2 /> Clear history
                </>
              }
              title="Clear the full history?"
              description={`This removes all ${attempts.length} attempts, with their diagrams and reviews. You cannot get them back.`}
              confirmLabel="Clear history"
              endpoint="/api/attempts"
            />
          )}
        </div>
        {attempts.length === 0 ? (
          <p className="text-sm text-muted-foreground">No attempts yet.</p>
        ) : (
          <Card className="py-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-4">Kata</TableHead>
                  <TableHead>Style</TableHead>
                  <TableHead>Reviewer</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Score</TableHead>
                  <TableHead className="w-0 pr-4">
                    <span className="sr-only">Remove</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {attempts.map((attempt) => (
                  <TableRow key={attempt.id}>
                    <TableCell className="pl-4 font-medium">
                      <Link href={`/attempt/${attempt.id}`} className="hover:text-primary">
                        {titles.get(attempt.kataId) ?? attempt.kataId}
                      </Link>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{attempt.style || "none"}</TableCell>
                    <TableCell className="text-muted-foreground">{attempt.reviewer ?? "Claude Code"}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {new Date(attempt.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">{attempt.overall} / 100</TableCell>
                    <TableCell className="pr-4">
                      <ConfirmButton
                        label={<Trash2 />}
                        ariaLabel="Remove this attempt"
                        size="icon-xs"
                        title="Remove this attempt?"
                        description="This removes the attempt, with its diagram and review. You cannot get it back."
                        confirmLabel="Remove"
                        endpoint={`/api/attempts/${attempt.id}`}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        )}
      </section>
    </main>
  );
}
