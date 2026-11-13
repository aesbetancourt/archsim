import { ArrowRight, BookOpen, Sparkles } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { listAttempts } from "@/lib/attempts";
import { allExamples, allKatas } from "@/lib/library";

// Read the attempt history on each request.
export const dynamic = "force-dynamic";

export default async function Home() {
  const [attempts, katas, examples] = await Promise.all([listAttempts(), allKatas(), allExamples()]);
  const solved = new Set(examples.map(({ kata }) => kata.id));
  const titles = new Map(katas.map((kata) => [kata.id, kata.title]));
  const groups = [
    { title: "Your problems", katas: katas.filter((kata) => kata.custom) },
    { title: "Katas", katas: katas.filter((kata) => !kata.custom && !kata.interview) },
    { title: "Interview questions", katas: katas.filter((kata) => !kata.custom && kata.interview) },
  ].filter((group) => group.katas.length > 0);

  return (
    <main className="mx-auto w-full max-w-4xl space-y-12 px-6 py-10">
      <section className="space-y-4">
        <h1 className="text-3xl font-semibold tracking-tight">Practice software architecture</h1>
        <p className="max-w-2xl text-muted-foreground">
          Each kata is a short business problem. Draw a design, explain your decisions, and get a
          review from Claude. If the concepts are new to you, start with a finished example.
        </p>
        <div className="flex flex-wrap gap-2">
          <Button asChild>
            <Link href="/learn#examples">
              <BookOpen /> Study a finished kata
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/learn">Learn the method and the styles</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/solve">
              <Sparkles /> Solve your own problem
            </Link>
          </Button>
        </div>
      </section>

      {groups.map((group) => (
      <section key={group.title} className="space-y-4">
        <h2 className="text-lg font-semibold tracking-tight">{group.title}</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {group.katas.map((kata) => (
            <Card key={kata.id}>
              <CardHeader>
                <div className="flex items-center justify-between gap-2">
                  <CardTitle>{kata.title}</CardTitle>
                  <div className="flex shrink-0 gap-1">
                    {kata.interview && <Badge variant="outline">interview</Badge>}
                    {kata.custom && <Badge variant="outline">yours</Badge>}
                    <Badge variant={kata.difficulty === "hard" ? "default" : "secondary"}>
                      {kata.difficulty}
                    </Badge>
                  </div>
                </div>
                <CardDescription className="line-clamp-3">{kata.context}</CardDescription>
              </CardHeader>
              {kata.users && <CardContent className="text-sm text-muted-foreground">{kata.users}</CardContent>}
              <CardFooter className="mt-auto gap-2">
                <Button size="sm" asChild>
                  <Link href={`/kata/${kata.id}`}>
                    Start <ArrowRight />
                  </Link>
                </Button>
                {solved.has(kata.id) && (
                  <Button size="sm" variant="ghost" asChild>
                    <Link href={`/learn/examples/${kata.id}`}>See a finished answer</Link>
                  </Button>
                )}
              </CardFooter>
            </Card>
          ))}
        </div>
      </section>
      ))}

      <section className="space-y-4">
        <h2 className="text-lg font-semibold tracking-tight">Your history</h2>
        {attempts.length === 0 ? (
          <p className="text-sm text-muted-foreground">No attempts yet.</p>
        ) : (
          <Card className="py-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-4">Kata</TableHead>
                  <TableHead>Style</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="pr-4 text-right">Score</TableHead>
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
                    <TableCell className="text-muted-foreground">
                      {new Date(attempt.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="pr-4 text-right tabular-nums">{attempt.overall} / 100</TableCell>
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
