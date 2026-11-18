import StudyLayout from "@/components/StudyLayout";
import WikiSidebar from "@/components/WikiSidebar";

export default function LearnLayout({ children }: LayoutProps<"/learn">) {
  return (
    <div className="flex flex-1">
      <aside className="hidden w-64 shrink-0 border-r-2 bg-card md:block">
        <div className="sticky top-0 h-[calc(100dvh-3.5rem)] overflow-y-auto p-4">
          <WikiSidebar />
        </div>
      </aside>
      {/* The page text, with highlights, and the notebook on the right. */}
      <StudyLayout>{children}</StudyLayout>
    </div>
  );
}
