import { ArrowRight, Lightbulb } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import Diagram from "@/components/Diagram";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { termsIn } from "@/lib/glossary";
import { findExample, findKata } from "@/lib/library";
import { getStyleLesson } from "@/lib/learn";

function Step({ number, title, children }: { number: number; title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-4">
      <h2 className="flex items-center gap-3 text-xl font-semibold tracking-tight">
        <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
          {number}
        </span>
        {title}
      </h2>
      {children}
    </section>
  );
}

function BulletCard({ title, items }: { title: string; items: string[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="list-disc space-y-2 pl-5">
          {items.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}

export default async function ExamplePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const example = await findExample(id);
  const kata = await findKata(id);
  if (!example || !kata) notFound();
  const lesson = getStyleLesson(example.style.name);
  const terms = termsIn(JSON.stringify([kata, example]));

  return (
    <main className="mx-auto w-full max-w-4xl space-y-12 px-6 py-10 text-sm leading-relaxed">
      <header className="space-y-4">
        <div className="flex items-center gap-2">
          <Badge>Worked example</Badge>
          <Badge variant="secondary">{kata.difficulty}</Badge>
          {kata.interview && <Badge variant="outline">interview question</Badge>}
          {kata.custom && <Badge variant="outline">your problem · answer written by {example.author ?? "Claude"}</Badge>}
        </div>
        <h1 className="text-3xl font-semibold tracking-tight">{kata.title}</h1>
        <Alert>
          <Lightbulb />
          <AlertTitle>This is one good answer, not the answer.</AlertTitle>
          <AlertDescription>
            Read it to see how each decision follows from a sentence in the kata. Then do the kata
            with your own design.
          </AlertDescription>
        </Alert>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>The kata</CardTitle>
          <CardDescription>{kata.context}</CardDescription>
        </CardHeader>
        {(kata.users || kata.requirements.length > 0) && (
          <CardContent className="space-y-4">
            {kata.users && (
              <p>
                <span className="font-medium">Users:</span> {kata.users}
              </p>
            )}
            {kata.requirements.length > 0 && (
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <h3 className="font-medium">Requirements</h3>
                  <ul className="list-disc pl-5 text-muted-foreground">
                    {kata.requirements.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h3 className="font-medium">Constraints</h3>
                  <ul className="list-disc pl-5 text-muted-foreground">
                    {kata.constraints.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </CardContent>
        )}
      </Card>

      {terms.length > 0 && (
        <section className="space-y-2">
          <h2 className="font-medium">Terms used in this answer</h2>
          <div className="flex flex-wrap gap-1.5">
            {terms.map((entry) => (
              <Badge key={entry.id} variant="outline" asChild>
                <Link href={`/glossary#${entry.id}`} title={entry.definition}>
                  {entry.term}
                </Link>
              </Badge>
            ))}
          </div>
        </section>
      )}

      <Step number={1} title="Read for what is hard">
        <ul className="grid gap-4">
          {example.hardParts.map((part) => (
            <li key={part.quote} className="border-l-2 border-primary pl-4">
              <blockquote className="font-medium">&ldquo;{part.quote}&rdquo;</blockquote>
              <p className="text-muted-foreground">{part.meaning}</p>
            </li>
          ))}
        </ul>
        {example.assumptions && (
          <BulletCard title="Assumptions, because the prompt gives none" items={example.assumptions} />
        )}
      </Step>

      <Step number={2} title="Select the driving characteristics">
        <div className="grid gap-4 sm:grid-cols-3">
          {example.characteristics.map((item) => (
            <Card key={item.name}>
              <CardHeader>
                <CardTitle>{item.name}</CardTitle>
              </CardHeader>
              <CardContent className="text-muted-foreground">{item.why}</CardContent>
            </Card>
          ))}
        </div>
      </Step>

      <Step number={3} title="Select a style">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{example.style.name}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p>{example.style.why}</p>
            {lesson && (
              <Button variant="outline" size="sm" asChild>
                <Link href={`/learn/${lesson.id}`}>Read the {lesson.name} lesson</Link>
              </Button>
            )}
          </CardContent>
        </Card>
        <div>
          <h3 className="font-medium">Styles considered and rejected</h3>
          <ul className="list-disc space-y-1 pl-5 text-muted-foreground">
            {example.style.rejected.map((item) => (
              <li key={item.name}>
                <span className="font-medium text-foreground">{item.name}:</span> {item.why}
              </li>
            ))}
          </ul>
        </div>
      </Step>

      <Step number={4} title="Draw the components">
        <Diagram spec={example.diagram} />
        <p className="text-muted-foreground">
          Solid arrow: a call that waits for an answer. Dashed arrow: a message that does not wait.
          Dashed box: an external system.
        </p>
        <BulletCard title="How to read this diagram" items={example.walkthrough} />
      </Step>

      <Step number={5} title="State the trade-offs">
        <div className="grid gap-4 sm:grid-cols-2">
          <BulletCard title="What this design gives up" items={example.tradeoffs} />
          <BulletCard title="Where it can fail" items={example.risks} />
        </div>
        {example.operations && <BulletCard title="How to operate it" items={example.operations} />}
      </Step>

      <Card>
        <CardHeader>
          <CardTitle>Questions a review board would still ask</CardTitle>
          <CardDescription>Answer these from the diagram before you continue.</CardDescription>
        </CardHeader>
        <CardContent>
          <ol className="list-decimal space-y-2 pl-5">
            {example.reviewQuestions.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ol>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{example.alternative.title}</CardTitle>
        </CardHeader>
        <CardContent>{example.alternative.body}</CardContent>
      </Card>

      <Button asChild>
        <Link href={`/kata/${kata.id}`}>
          Do this kata with your own design <ArrowRight />
        </Link>
      </Button>
    </main>
  );
}
