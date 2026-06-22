import Link from "next/link";
import { Users, Shield, FileText, Cpu } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

export default function AdminPage() {
  return (
    <div className="max-w-[1000px]">
      <div className="mb-8">
        <h1 className="text-[26px] font-bold text-[#191f28]">관리자</h1>
        <p className="text-[14px] text-[#8b95a1] mt-1">플랫폼 및 테넌트 관리</p>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-8">
        {[
          { href: "/admin/tenants", icon: Users,   label: "테넌트 관리",   desc: "부서별 네임스페이스 & 쿼터 관리", count: "8개 테넌트", color: "#3182f6" },
          { href: "/admin/policies", icon: Shield,  label: "Kyverno 정책", desc: "클러스터 보안 정책 관리",           count: "12개 정책", color: "#03b26c" },
          { href: "/admin/audit-logs", icon: FileText, label: "감사 로그",  desc: "플랫폼 변경 이력 조회",          count: "1,240건",  color: "#fe9800" },
          { href: "/admin/arc",   icon: Cpu,     label: "ARC 설정",      desc: "GitHub Actions Runner 관리",      count: "3개 RunnerSet", color: "#a234c7" },
        ].map(({ href, icon: Icon, label, desc, count, color }) => (
          <Link key={href} href={href}>
            <Card className="hover:shadow-elevated transition-shadow cursor-pointer flex items-start gap-4">
              <div
                className="w-11 h-11 rounded-[12px] flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: `${color}15` }}
              >
                <Icon size={22} style={{ color }} />
              </div>
              <div>
                <p className="text-[15px] font-bold text-[#191f28] mb-0.5">{label}</p>
                <p className="text-[13px] text-[#8b95a1] mb-2">{desc}</p>
                <Badge variant="neutral" size="sm">{count}</Badge>
              </div>
            </Card>
          </Link>
        ))}
      </div>

      {/* 플랫폼 상태 */}
      <Card>
        <h3 className="text-[15px] font-bold text-[#191f28] mb-4">플랫폼 컴포넌트 상태</h3>
        <div className="flex flex-col gap-3">
          {[
            { name: "ArgoCD",            status: "정상", url: "argocd.swsol.samsungds.net" },
            { name: "Harbor Registry",   status: "정상", url: "harbor.foundrymtc.samsungds.net" },
            { name: "GitHub Enterprise", status: "정상", url: "github.samsungds.net" },
            { name: "Kyverno",           status: "정상", url: "" },
          ].map(({ name, status, url }) => (
            <div key={name} className="flex items-center justify-between py-2 border-b border-[#f2f4f6] last:border-0">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-[#03b26c]" />
                <span className="text-[14px] font-medium text-[#191f28]">{name}</span>
                {url && (
                  <span className="text-[12px] text-[#8b95a1] font-mono">{url}</span>
                )}
              </div>
              <Badge variant="green-weak" size="sm">{status}</Badge>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
