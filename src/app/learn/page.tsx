import { ArrowRight } from "lucide-react";
import Link from "next/link";
import StyleLessonBody from "@/components/StyleLessonBody";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { allExamples } from "@/lib/library";
import { characteristics, kataSteps, styleLessons } from "@/lib/learn";

const sections = [
  { id: "method", label: "Method" },
  { id: "characteristics", label: "Characteristics" },
  { id: "styles", label: "Styles" },
  { id: "examples", label: "Worked examples" },
];


const ratingColumns = [
  { key: "simplicity", label: "Simplicity" },
  { key: "scalability", label: "Scalability" },
  { key: "faultTolerance", label: "Fault tolerance" },
  { key: "cost", label: "Cost" },
] as const;

// Read the user's problems on each request.
export const dynamic = "force-dynamic";

export default async function LearnPage() {
  const examples = await allExamples();
  return (
    <main className="mx-auto w-full max-w-4xl space-y-14 px-6 py-10 text-sm leading-relaxed">
      <header className="space-y-4">
        <h1 className="text-3xl font-semibold tracking-tight">Learn</h1>
        <p className="max-w-2xl text-base text-muted-foreground">
          The concepts you need to do a kata. Read the method first. Use the other sections as a
          reference while you work.
        </p>
        <nav className="flex flex-wrap gap-2">
          {sections.map((section) => (
            <Button key={section.id} variant="outline" size="sm" asChild>
              <a href={`#${section.id}`}>{section.label}</a>
            </Button>
          ))}
          <Button variant="outline" size="sm" asChild>
            <Link href="/glossary">Glossary</Link>
          </Button>
        </nav>
      </header>

      <section id="method" className="scroll-mt-6 space-y-4">
        <h2 className="text-xl font-semibold tracking-tight">How to do a kata</h2>
        <ol className="grid gap-3">
          {kataSteps.map((step, index) => (
            <li key={step.title}>
              <Card>
                <CardContent className="flex gap-4">
                  <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
                    {index + 1}
                  </span>
                  <div>
                    <h3 className="font-medium">{step.title}</h3>
                    <p className="text-muted-foreground">{step.body}</p>
                  </div>
                </CardContent>
              </Card>
            </li>
          ))}
        </ol>
      </section>

      <section id="characteristics" className="scroll-mt-6 space-y-4">
        <h2 className="text-xl font-semibold tracking-tight">Architecture characteristics</h2>
        <p className="max-w-2xl">
          A characteristic is a quality of the system, not a feature. &quot;Customers pay
          online&quot; is a feature. &quot;Payment works during the lunch peak&quot; is a
          characteristic (elasticity). The characteristics you select decide the style.
        </p>
        <Card className="py-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-4">Characteristic</TableHead>
                <TableHead>Meaning</TableHead>
                <TableHead className="pr-4">Signal in a kata</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {characteristics.map((item) => (
                <TableRow key={item.name} className="align-top">
                  <TableCell className="pl-4 font-medium">{item.name}</TableCell>
                  <TableCell className="whitespace-normal">{item.meaning}</TableCell>
                  <TableCell className="whitespace-normal pr-4 text-muted-foreground">{item.signal}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      </section>

      <section id="styles" className="scroll-mt-6 space-y-4">
        <h2 className="text-xl font-semibold tracking-tight">Architecture styles</h2>
        <p className="max-w-2xl">
          A style is the overall shape of the system. The first four styles are one deployment or a
          few. The last four accept more complexity to get scale or resilience. No style is the
          best one. Each is a different set of trade-offs.
        </p>

        <Card className="py-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-4">Style</TableHead>
                {ratingColumns.map((column) => (
                  <TableHead key={column.key}>{column.label}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {styleLessons.map((lesson) => (
                <TableRow key={lesson.id}>
                  <TableCell className="pl-4">
                    <a href={`#${lesson.id}`} className="font-medium text-primary hover:underline">
                      {lesson.name}
                    </a>
                  </TableCell>
                  {ratingColumns.map((column) => (
                    <TableCell key={column.key}>
                      <Badge variant={lesson.ratings[column.key] === "high" ? "default" : lesson.ratings[column.key] === "medium" ? "secondary" : "outline"}>
                        {lesson.ratings[column.key]}
                      </Badge>
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>

        <div className="grid gap-4">
          {styleLessons.map((lesson) => (
            <Card key={lesson.id} id={lesson.id} className="scroll-mt-6">
              <CardHeader>
                <CardTitle className="text-base">{lesson.name}</CardTitle>
                <CardDescription className="text-base text-foreground">{lesson.idea}</CardDescription>
              </CardHeader>
              <CardContent>
                <StyleLessonBody lesson={lesson} />
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section id="examples" className="scroll-mt-6 space-y-4">
        <h2 className="text-xl font-semibold tracking-tight">Worked examples</h2>
        <p className="max-w-2xl">
          Each example is a finished kata. It shows the five steps of the method, a diagram, and
          the reason for each decision.
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          {examples.map(({ kata, example }) => {
            return (
              <Card key={example.kataId}>
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
                    <Link href={`/learn/examples/${example.kataId}`}>
                      Study this answer <ArrowRight />
                    </Link>
                  </Button>
                </CardFooter>
              </Card>
            );
          })}
        </div>
      </section>
    </main>
  );
}
