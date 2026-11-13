import WikiSidebar from "@/components/WikiSidebar";

export default function LearnLayout({ children }: LayoutProps<"/learn">) {
  return (
    <div className="flex flex-1">
      <aside className="hidden w-64 shrink-0 border-r bg-card md:block">
        <div className="sticky top-0 max-h-dvh overflow-y-auto p-4">
          <WikiSidebar />
        </div>
      </aside>
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
