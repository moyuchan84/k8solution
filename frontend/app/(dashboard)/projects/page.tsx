import Link from "next/link";
import { Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";

const MOCK = [
  { name: "user-api",            status: "healthy",  env: "prod",    stack: "java",   pods: "2/2",  url: "user-api.swsol.samsungds.net" },
  { name: "order-service",       status: "healthy",  env: "prod",    stack: "nodejs", pods: "3/3",  url: "order-service.swsol.samsungds.net" },
  { name: "notification-worker", status: "degraded", env: "prod",    stack: "python", pods: "1/2",  url: "" },
  { name: "auth-gateway",        status: "healthy",  env: "staging", stack: "go",     pods: "2/2",  url: "auth-gateway.swsol.samsungds.net" },
];

const STATUS_MAP = {
  healthy:  { label: "정상",   variant: "green-weak"  as const },
  degraded: { label: "주의",   variant: "yellow"      as const },
  error:    { label: "오류",   variant: "red-weak"    as const },
};

const STACK_EMOJI: Record<string, string> = {
  java: "☕", nodejs: "🟢", python: "🐍", go: "🐹", other: "🐳",
};

export default function ProjectsPage() {
  return (
    <div className="max-w-[1200px]">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-[26px] font-bold text-[#191f28]">서비스 목록</h1>
        <Link href="/projects/new">
          <Button variant="primary" size="lg" className="gap-2">
            <Plus size={18} />
            새 서비스 배포
          </Button>
        </Link>
      </div>

      {/* 검색 */}
      <div className="flex items-center gap-2 w-full max-w-sm mb-5 h-10 px-3 rounded-[10px] bg-white border border-[#e5e8eb]">
        <Search size={15} className="text-[#b0b8c1]" />
        <input
          type="text"
          placeholder="서비스 검색..."
          className="flex-1 text-[14px] text-[#333d4b] placeholder:text-[#b0b8c1] outline-none"
        />
      </div>

      {/* 카드 그리드 */}
      <div className="grid grid-cols-3 gap-4">
        {MOCK.map((p) => {
          const s = STATUS_MAP[p.status as keyof typeof STATUS_MAP];
          return (
            <Link key={p.name} href={`/projects/${p.name}`}>
              <Card className="hover:shadow-elevated transition-shadow duration-150 cursor-pointer h-full">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{STACK_EMOJI[p.stack]}</span>
                    <div>
                      <p className="text-[15px] font-bold text-[#191f28] leading-none">{p.name}</p>
                      <p className="text-[12px] text-[#8b95a1] mt-0.5">{p.env}</p>
                    </div>
                  </div>
                  <Badge variant={s.variant}>{s.label}</Badge>
                </div>

                <div className="flex items-center gap-4 text-[13px] text-[#6b7684]">
                  <span>파드 {p.pods}</span>
                </div>

                {p.url && (
                  <p className="text-[12px] text-[#3182f6] mt-2 truncate">{p.url}</p>
                )}
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
