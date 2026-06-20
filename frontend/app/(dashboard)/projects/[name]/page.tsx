import Link from "next/link";
import { ExternalLink, RefreshCw, Network, Shield, Database, Key } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";

const SUB_NAV = [
  { href: "",            label: "개요" },
  { href: "/deployments",label: "배포 이력" },
  { href: "/network",    label: "네트워크 정책" },
  { href: "/rbac",       label: "권한 관리" },
  { href: "/secrets",    label: "시크릿/환경변수" },
  { href: "/settings",   label: "설정" },
];

export default function ProjectDetailPage({ params }: { params: { name: string } }) {
  const { name } = params;

  return (
    <div className="max-w-[1100px]">
      {/* 헤더 */}
      <div className="flex items-start justify-between mb-5">
        <div>
          <div className="flex items-center gap-2 text-[13px] text-[#8b95a1] mb-1">
            <Link href="/projects" className="hover:text-[#3182f6]">서비스</Link>
            <span>/</span>
            <span className="text-[#333d4b]">{name}</span>
          </div>
          <div className="flex items-center gap-3">
            <h1 className="text-[26px] font-bold text-[#191f28]">{name}</h1>
            <Badge variant="green-weak">정상</Badge>
            <Badge variant="neutral" size="sm">prod</Badge>
          </div>
          <p className="text-[13px] text-[#8b95a1] mt-1">{name}.swsol.samsungds.net</p>
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" size="md" className="gap-1.5">
            <RefreshCw size={15} />
            Sync
          </Button>
          <a href={`https://${name}.swsol.samsungds.net`} target="_blank" rel="noopener noreferrer">
            <Button variant="outline" size="md" className="gap-1.5">
              <ExternalLink size={15} />
              접속
            </Button>
          </a>
        </div>
      </div>

      {/* 서브 네비게이션 */}
      <div className="flex gap-1 mb-6 border-b border-[#e5e8eb] -mx-8 px-8">
        {SUB_NAV.map(({ href, label }) => (
          <Link
            key={label}
            href={`/projects/${name}${href}`}
            className="px-4 py-2.5 text-[14px] font-medium text-[#6b7684] hover:text-[#191f28] border-b-2 border-transparent hover:border-[#d1d6db] transition-all -mb-px"
          >
            {label}
          </Link>
        ))}
      </div>

      {/* 상태 카드 그리드 */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {/* ArgoCD 상태 */}
        <Card>
          <CardHeader>
            <CardTitle>ArgoCD 상태</CardTitle>
            <Badge variant="green-weak" size="sm">Synced</Badge>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-2 text-[13px]">
              <div className="flex justify-between">
                <span className="text-[#8b95a1]">마지막 Sync</span>
                <span className="text-[#333d4b]">3분 전</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#8b95a1]">커밋</span>
                <span className="text-[#3182f6] font-mono">a1b2c3d</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#8b95a1]">브랜치</span>
                <span className="text-[#333d4b]">main</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 파드 상태 */}
        <Card>
          <CardHeader>
            <CardTitle>파드 현황</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end gap-2 mb-3">
              <span className="text-[30px] font-bold text-[#191f28] tabular-nums leading-none">2</span>
              <span className="text-[16px] text-[#8b95a1] pb-0.5">/ 2 Running</span>
            </div>
            <div className="flex gap-1.5">
              {[0, 1].map((i) => (
                <div key={i} className="flex-1 h-1.5 rounded-full bg-[#03b26c]" />
              ))}
            </div>
          </CardContent>
        </Card>

        {/* 리소스 사용량 */}
        <Card>
          <CardHeader>
            <CardTitle>리소스 사용량</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-3">
              {[
                { label: "CPU", used: "340m", total: "1000m", pct: 34 },
                { label: "메모리", used: "280Mi", total: "1Gi", pct: 27 },
              ].map(({ label, used, total, pct }) => (
                <div key={label}>
                  <div className="flex justify-between text-[12px] mb-1">
                    <span className="text-[#6b7684]">{label}</span>
                    <span className="text-[#333d4b] tabular-nums">{used} / {total}</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-[#f2f4f6] overflow-hidden">
                    <div
                      className="h-full rounded-full bg-[#3182f6] transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 빠른 링크 */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { href: `/projects/${name}/network`,  label: "네트워크 정책", icon: Network,  desc: "Ingress/Egress 규칙 관리" },
          { href: `/projects/${name}/rbac`,     label: "권한 관리",     icon: Shield,   desc: "RBAC 매트릭스 편집" },
          { href: `/projects/${name}/secrets`,  label: "시크릿",        icon: Key,      desc: "환경변수 & Secret 관리" },
          { href: `/projects/${name}/deployments`, label: "배포 이력",  icon: Database, desc: "롤백 및 배포 로그" },
        ].map(({ href, label, icon: Icon, desc }) => (
          <Link key={href} href={href}>
            <Card className="hover:shadow-elevated transition-shadow cursor-pointer h-full">
              <div className="w-9 h-9 rounded-[10px] bg-[#e8f3ff] flex items-center justify-center mb-3">
                <Icon size={18} className="text-[#3182f6]" />
              </div>
              <p className="text-[14px] font-semibold text-[#191f28] mb-1">{label}</p>
              <p className="text-[12px] text-[#8b95a1]">{desc}</p>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
