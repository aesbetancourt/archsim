import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { allExamples } from "@/lib/library";

// Read the user's problems on each request.
export const dynamic = "force-dynamic";

export default async function ExamplesPage() {
  const examples = await allExamples();

  return (
    <main className="mx-auto w-full max-w-4xl space-y-8 px-6 py-10 text-sm leading-relaxed">
      <header className="space-y-3 border-b pb-4">
        <h1 className="text-3xl font-semibold tracking-tight">Worked examples</h1>
        <p className="max-w-2xl text-base text-muted-foreground">
          Each example is a finished kata. It shows the five steps of the method, a diagram, and
          the reason for each decision.
        </p>
      </header>
      <div className="grid gap-4 sm:grid-cols-2">
        {examples.map(({ kata, example }) => (
          <Card key={kata.id}>
            <CardHeader>
              <div className="flex items-center justify-between gap-2">
                <CardTitle>{kata.title}</CardTitle>
                <div className="flex shrink-0 gap-1">
                  {kata.custom && <Badge variant="outline">yours</Badge>}
                  <Badge variant="secondary">{kata.difficulty}</Badge>
                </div>
              </div>
              <CardDescription className="line-clamp-3">{kata.context}</CardDescription>
            </CardHeader>
            <CardContent className="text-muted-foreground">
              Solved with: <span className="font-medium text-foreground">{example.style.name}</span>
            </CardContent>
            <CardFooter className="mt-auto">
              <Button size="sm" asChild>
                <Link href={`/learn/examples/${kata.id}`}>
                  Study this answer <ArrowRight />
                </Link>
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </main>
  );
}
