import { Sidebar } from "@/components/layout/Sidebar";
import { TopBar } from "@/components/layout/TopBar";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#f9fafb]">
      <Sidebar />
      <TopBar />
      <main className="ml-[240px] pt-[60px] min-h-screen">
        <div className="px-8 py-6">{children}</div>
      </main>
    </div>
  );
}
