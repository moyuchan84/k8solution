import Link from "next/link";
import { Plus, TrendingUp, Box, Shield, Activity } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";

const MOCK_PROJECTS = [
  { name: "user-api", status: "healthy", pods: "2/2", cpu: "340m", mem: "280Mi", env: "prod" },
  { name: "order-service", status: "healthy", pods: "3/3", cpu: "820m", mem: "750Mi", env: "prod" },
  { name: "notification-worker", status: "degraded", pods: "1/2", cpu: "180m", mem: "195Mi", env: "prod" },
  { name: "auth-gateway", status: "healthy", pods: "2/2", cpu: "210m", mem: "320Mi", env: "staging" },
];

const STATUS_MAP: Record<string, { label: string; variant: "green" | "yellow" | "red" }> = {
  healthy:  { label: "정상",   variant: "green" },
  degraded: { label: "주의",   variant: "yellow" },
  error:    { label: "오류",   variant: "red" },
};

export default function DashboardPage() {
  return (
    <div className="max-w-[1200px]">
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-[26px] font-bold text-[#191f28]">대시보드</h1>
          <p className="text-[14px] text-[#8b95a1] mt-1">SW Platform 팀 리소스 현황</p>
        </div>
        <Link href="/projects/new">
          <Button variant="primary" size="lg" className="gap-2">
            <Plus size={18} />
            새 서비스 배포
          </Button>
        </Link>
      </div>

      {/* 리소스 요약 카드 */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        {[
          { label: "전체 서비스", value: "12", sub: "4개 네임스페이스", icon: Box, color: "#3182f6" },
          { label: "CPU 사용량", value: "8.2 / 20 코어", sub: "41%", icon: TrendingUp, color: "#03b26c" },
          { label: "메모리 사용량", value: "18.4 / 40 GiB", sub: "46%", icon: Activity, color: "#fe9800" },
          { label: "정책 위반", value: "0", sub: "Kyverno 정상", icon: Shield, color: "#03b26c" },
        ].map(({ label, value, sub, icon: Icon, color }) => (
          <Card key={label}>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[13px] text-[#8b95a1] font-medium">{label}</p>
                <p
                  className="text-[22px] font-bold tabular-nums mt-1"
                  style={{ color: "#191f28" }}
                >
                  {value}
                </p>
                <p className="text-[12px] text-[#b0b8c1] mt-0.5">{sub}</p>
              </div>
              <div
                className="w-10 h-10 rounded-[10px] flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: `${color}15` }}
              >
                <Icon size={20} style={{ color }} />
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* 서비스 목록 */}
      <Card>
        <CardHeader>
          <CardTitle>서비스 목록</CardTitle>
          <Link href="/projects">
            <span className="text-[13px] text-[#3182f6] font-medium hover:text-[#2272eb]">
              전체 보기
            </span>
          </Link>
        </CardHeader>
        <CardContent>
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#e5e8eb]">
                {["서비스", "상태", "파드", "CPU", "메모리", "환경", ""].map((h) => (
                  <th
                    key={h}
                    className="pb-3 text-left text-[12px] font-semibold text-[#8b95a1] first:pl-0"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f2f4f6]">
              {MOCK_PROJECTS.map((p) => {
                const s = STATUS_MAP[p.status];
                return (
                  <tr key={p.name} className="hover:bg-[#f9fafb] transition-colors">
                    <td className="py-3.5">
                      <Link
                        href={`/projects/${p.name}`}
                        className="text-[14px] font-semibold text-[#191f28] hover:text-[#3182f6] transition-colors"
                      >
                        {p.name}
                      </Link>
                    </td>
                    <td className="py-3.5">
                      <Badge variant={`${s.variant}-weak` as "green-weak"}>{s.label}</Badge>
                    </td>
                    <td className="py-3.5 text-[14px] text-[#333d4b] tabular-nums">{p.pods}</td>
                    <td className="py-3.5 text-[14px] text-[#333d4b] tabular-nums">{p.cpu}</td>
                    <td className="py-3.5 text-[14px] text-[#333d4b] tabular-nums">{p.mem}</td>
                    <td className="py-3.5">
                      <Badge variant="neutral" size="sm">{p.env}</Badge>
                    </td>
                    <td className="py-3.5 text-right">
                      <Link
                        href={`/projects/${p.name}`}
                        className="text-[13px] text-[#3182f6] font-medium hover:text-[#2272eb]"
                      >
                        상세 보기
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
