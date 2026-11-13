import Diagram from "@/components/Diagram";
import type { StyleLesson } from "@/lib/learn";

// The full content of one style lesson. The Learn page and the kata page use it.
export default function StyleLessonBody({ lesson }: { lesson: StyleLesson }) {
  return (
    <div className="space-y-4">
      <Diagram spec={lesson.diagram} />
      <p>{lesson.how}</p>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <h4 className="font-medium">Strengths</h4>
          <ul className="list-disc pl-5 text-muted-foreground">
            {lesson.strengths.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
        <div>
          <h4 className="font-medium">Costs</h4>
          <ul className="list-disc pl-5 text-muted-foreground">
            {lesson.costs.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      </div>
      <dl className="grid gap-2 border-t pt-4">
        <div>
          <dt className="inline font-medium">Use when: </dt>
          <dd className="inline">{lesson.useWhen}</dd>
        </div>
        <div>
          <dt className="inline font-medium">Avoid when: </dt>
          <dd className="inline">{lesson.avoidWhen}</dd>
        </div>
        <div className="text-muted-foreground">
          <dt className="inline font-medium text-foreground">Example: </dt>
          <dd className="inline">{lesson.example}</dd>
        </div>
      </dl>
    </div>
  );
}
