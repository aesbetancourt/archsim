import StudyLayout from "@/components/StudyLayout";
import LessonSidebar from "@/components/LessonSidebar";

/**
 * The layout of the Learn section: the lesson sidebar on the left, and the page with the
 * notebook on the right.
 * @returns The page between the lesson sidebar and the notebook.
 */
export default function LearnLayout({ children }: LayoutProps<"/learn">) {
  return (
    <div className="flex flex-1">
      <aside className="hidden w-64 shrink-0 border-r bg-card md:block">
        <div className="sticky top-0 h-[calc(100dvh-3.5rem)] overflow-y-auto p-4">
          <LessonSidebar />
        </div>
      </aside>
      {/* The page text, with highlights, and the notebook on the right. */}
      <StudyLayout>{children}</StudyLayout>
    </div>
  );
}
