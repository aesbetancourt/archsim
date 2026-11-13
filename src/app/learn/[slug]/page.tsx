import { ArrowLeft, ArrowRight, CircleCheck, CircleHelp, Scale } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import BlockIcon from "@/components/BlockIcon";
import Prose from "@/components/Prose";
import StyleLessonBody from "@/components/StyleLessonBody";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { blockGroups, blocksIn } from "@/lib/blocks";
import { characteristics, kataSteps, styleLessons } from "@/lib/learn";
import { getWikiPage, headingId, headings, neighbors, readArticle } from "@/lib/wiki";

const ratingColumns = [
  { key: "simplicity", label: "Simplicity" },
  { key: "scalability", label: "Scalability" },
  { key: "faultTolerance", label: "Fault tolerance" },
  { key: "cost", label: "Cost" },
] as const;

function Method() {
  return (
    <ol className="grid gap-3">
      {kataSteps.map((step, index) => (
        <li key={step.title}>
          <Card>
            <CardContent className="flex gap-4">
              <span className="flex size-7 shrink-0 items-center justify-center rounded-full border-2 border-border bg-main text-xs font-heading text-main-foreground">
                {index + 1}
              </span>
              <div>
                <h2 className="font-medium">{step.title}</h2>
                <p className="text-muted-foreground">{step.body}</p>
              </div>
            </CardContent>
          </Card>
        </li>
      ))}
    </ol>
  );
}

function Characteristics() {
  return (
    <div className="space-y-4">
      <p className="max-w-2xl">
        A characteristic is a quality of the system, not a feature. &quot;Customers pay online&quot;
        is a feature. &quot;Payment works during the lunch peak&quot; is a characteristic
        (elasticity). The characteristics you select decide the style. Other names for the same thing are non-functional requirements and quality attributes.
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
    </div>
  );
}

function Styles() {
  return (
    <div className="space-y-4">
      <p className="max-w-2xl">
        A style is the overall shape of the system. The first four styles are one deployment or a
        few. The last four accept more complexity to get scale or resilience. No style is the best
        one. Each is a different set of trade-offs.
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
                  <Link href={`/learn/${lesson.id}`} className="font-medium text-primary hover:underline">
                    {lesson.name}
                  </Link>
                  <p className="whitespace-normal text-muted-foreground">{lesson.idea}</p>
                </TableCell>
                {ratingColumns.map((column) => {
                  const level = lesson.ratings[column.key];
                  return (
                    <TableCell key={column.key}>
                      <Badge variant={level === "high" ? "default" : level === "medium" ? "neutral" : "neutral"}>
                        {level}
                      </Badge>
                    </TableCell>
                  );
                })}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}

function Blocks() {
  return (
    <div className="space-y-8">
      <div className="max-w-2xl space-y-2">
        <p>
          Most designs use the same set of pieces. An architect knows what each piece does
          and, more important, what it costs. No piece is free: each one adds a part that can fail
          and a decision that you must defend.
        </p>
        <p>
          The same pieces are above the canvas in each kata and in the Scratchpad. Drag a piece to
          the canvas, or click it. Add a piece only when you can say which sentence of the problem
          needs it. The last three groups are not components: they are the arrows between pieces,
          the frames around them, and small patterns. A pattern is a start that you change, not an
          answer.
        </p>
      </div>
      <nav aria-label="Groups" className="inline-block rounded-base border-2 bg-card px-4 py-3">
        <h2 className="font-medium">Groups</h2>
        <ul>
          {blockGroups.map((group) => (
            <li key={group.id} className="flex items-center gap-2">
              <span style={{ backgroundColor: group.color }} className="size-2.5 rounded-full border border-border" />
              <a href={`#${group.id}`} className="text-primary hover:underline">
                {group.title}
              </a>
              <span className="text-muted-foreground">{blocksIn(group.id).length} pieces</span>
            </li>
          ))}
        </ul>
      </nav>
      {blockGroups.map((group) => (
        <section key={group.id} className="space-y-3">
          <div className="border-b pb-1">
            <h2 id={group.id} className="scroll-mt-20 text-xl font-semibold tracking-tight">
              {group.title}
            </h2>
            <p className="text-muted-foreground">{group.summary}</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {blocksIn(group.id).map((block) => (
              <Card key={block.id} id={block.id} className="gap-3 py-4">
                <CardContent className="space-y-2 px-4">
                  <span
                    style={{ backgroundColor: group.color }}
                    className={`inline-flex items-center gap-1 border-2 border-border px-2 py-0.5 font-medium text-black ${
                      block.shape === "actor" || block.shape === "person" ? "rounded-full" : block.shape === "module" ? "rounded-none" : "rounded-base"
                    } ${block.shape === "external" || block.shape === "boundary" ? "border-dashed" : ""}`}
                  >
                    <BlockIcon shape={block.shape} />
                    {block.name}
                  </span>
                  <p>{block.does}</p>
                  <dl className="space-y-1.5">
                    <div>
                      <dt className="flex items-center gap-1.5 font-medium">
                        <Scale className="size-3.5 text-primary" aria-hidden /> It costs you
                      </dt>
                      <dd className="text-muted-foreground">{block.cost}</dd>
                    </div>
                    <div>
                      <dt className="flex items-center gap-1.5 font-medium">
                        <CircleCheck className="size-3.5 text-primary" aria-hidden /> Use it when
                      </dt>
                      <dd className="text-muted-foreground">{block.useWhen}</dd>
                    </div>
                    <div>
                      <dt className="flex items-center gap-1.5 font-medium">
                        <CircleHelp className="size-3.5 text-primary" aria-hidden /> Answer this in your trade-offs
                      </dt>
                      <dd className="text-muted-foreground">{block.question}</dd>
                    </div>
                  </dl>
                  <Link href={`/learn/${block.learn}`} className="text-primary hover:underline">
                    Read the lesson <ArrowRight className="inline size-3.5" aria-hidden />
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

export default async function WikiArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const page = getWikiPage(slug);
  if (!page) notFound();

  const markdown = page.kind === "article" ? await readArticle(slug) : undefined;
  if (page.kind === "article" && !markdown) notFound();
  const lesson = page.kind === "style" ? styleLessons.find((item) => item.id === slug) : undefined;
  const contents = markdown ? headings(markdown) : [];
  const related = (page.related ?? []).map(getWikiPage).filter((item) => item !== undefined);
  const { previous, next } = neighbors(slug);

  return (
    <main className="mx-auto w-full max-w-3xl space-y-8 px-6 py-10 text-sm leading-relaxed">
      <header className="space-y-2 border-b pb-4">
        <h1 className="text-3xl font-semibold tracking-tight">{page.title}</h1>
        <p className="text-base text-muted-foreground">{page.summary}</p>
      </header>

      {contents.length > 2 && (
        <nav aria-label="Contents" className="inline-block rounded-base border-2 bg-card px-4 py-3">
          <h2 className="font-medium">Contents</h2>
          <ol className="list-decimal pl-5 text-primary">
            {contents.map((heading) => (
              <li key={heading}>
                <a href={`#${headingId(heading)}`} className="hover:underline">
                  {heading}
                </a>
              </li>
            ))}
          </ol>
        </nav>
      )}

      {markdown && <Prose markdown={markdown} />}
      {page.kind === "method" && <Method />}
      {page.kind === "characteristics" && <Characteristics />}
      {page.kind === "styles" && <Styles />}
      {page.kind === "blocks" && <Blocks />}
      {lesson && <StyleLessonBody lesson={lesson} />}

      {related.length > 0 && (
        <section className="space-y-2">
          <h2 className="border-b pb-1 text-xl font-semibold tracking-tight">See also</h2>
          <ul className="list-disc pl-6">
            {related.map((item) => (
              <li key={item.slug}>
                <Link href={`/learn/${item.slug}`} className="text-primary hover:underline">
                  {item.title}
                </Link>
                <span className="text-muted-foreground"> — {item.summary}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <nav aria-label="Reading order" className="flex justify-between gap-4 border-t pt-4">
        {previous ? (
          <Link href={`/learn/${previous.slug}`} className="flex items-center gap-1 text-primary hover:underline">
            <ArrowLeft className="size-4" /> {previous.title}
          </Link>
        ) : (
          <span />
        )}
        {next && (
          <Link href={`/learn/${next.slug}`} className="flex items-center gap-1 text-right text-primary hover:underline">
            {next.title} <ArrowRight className="size-4" />
          </Link>
        )}
      </nav>
    </main>
  );
}
