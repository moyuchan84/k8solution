"use client";
import { useState } from "react";
import Link from "next/link";
import { Plus, Globe, Database, Shield, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { cn } from "@/lib/utils";

type Tab = "ingress" | "egress";

const INGRESS_RULES = [
  { source: "Envoy Gateway",    icon: "🌐", port: 8080, allowed: true },
  { source: "Prometheus",       icon: "📊", port: 9090, allowed: true },
  { source: "같은 Namespace",   icon: "🔧", port: null, allowed: true },
];

const EGRESS_RULES = [
  { target: "kube-dns",                  icon: "🌐", port: 53,   allowed: true },
  { target: "db.internal (PostgreSQL)",  icon: "🗄️", port: 5432, allowed: true },
  { target: "그 외 모든 트래픽",         icon: "❌", port: null,  allowed: false, isDefault: true },
];

export default function NetworkPage({ params }: { params: { name: string } }) {
  const [tab, setTab] = useState<Tab>("ingress");
  const [showModal, setShowModal] = useState(false);

  return (
    <div className="max-w-[900px]">
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-2 text-[13px] text-[#8b95a1] mb-1">
            <Link href={`/projects/${params.name}`} className="hover:text-[#3182f6]">
              {params.name}
            </Link>
            <span>/</span>
            <span className="text-[#333d4b]">네트워크 정책</span>
          </div>
          <h1 className="text-[22px] font-bold text-[#191f28]">네트워크 정책</h1>
        </div>
        <Button variant="primary" size="md" onClick={() => setShowModal(true)} className="gap-2">
          <Plus size={15} />
          규칙 추가
        </Button>
      </div>

      {/* 탭 */}
      <div className="flex gap-1 mb-5 p-1 bg-[#f2f4f6] rounded-[12px] w-fit">
        {(["ingress", "egress"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              "px-5 py-2 rounded-[10px] text-[14px] font-semibold transition-all duration-150",
              tab === t
                ? "bg-white text-[#191f28] shadow-subtle"
                : "text-[#8b95a1] hover:text-[#4e5968]"
            )}
          >
            {t === "ingress" ? "Ingress 규칙" : "Egress 규칙"}
          </button>
        ))}
      </div>

      {/* 규칙 목록 */}
      <Card className="p-0 overflow-hidden">
        <div className="px-4 py-3 bg-[#f9fafb] border-b border-[#e5e8eb]">
          <span className="text-[13px] font-semibold text-[#6b7684]">
            {tab === "ingress" ? "INGRESS — 들어오는 트래픽" : "EGRESS — 나가는 트래픽"}
          </span>
        </div>
        <table className="w-full">
          <thead>
            <tr className="border-b border-[#f2f4f6]">
              {[tab === "ingress" ? "소스" : "대상", "포트", "상태", ""].map((h) => (
                <th key={h} className="px-4 py-3 text-left text-[12px] font-semibold text-[#8b95a1]">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#f2f4f6]">
            {tab === "ingress"
              ? INGRESS_RULES.map((r) => (
                  <tr key={r.source} className="hover:bg-[#f9fafb] transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2 text-[14px] text-[#333d4b]">
                        <span>{r.icon}</span>
                        {r.source}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-[14px] text-[#4e5968] tabular-nums font-mono">
                      {r.port ?? "ANY"}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant="green-weak" size="sm">● 허용</Badge>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-2">
                        <button className="text-[13px] text-[#3182f6] hover:text-[#2272eb] font-medium">
                          편집
                        </button>
                        <button className="text-[13px] text-[#f04452] hover:text-[#e42939] font-medium">
                          삭제
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              : EGRESS_RULES.map((r) => (
                  <tr
                    key={r.target}
                    className={cn(
                      "hover:bg-[#f9fafb] transition-colors",
                      r.isDefault && "bg-[rgba(240,68,82,0.03)]"
                    )}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2 text-[14px] text-[#333d4b]">
                        <span>{r.icon}</span>
                        {r.target}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-[14px] text-[#4e5968] tabular-nums font-mono">
                      {r.port ?? "-"}
                    </td>
                    <td className="px-4 py-3">
                      {r.allowed ? (
                        <Badge variant="green-weak" size="sm">● 허용</Badge>
                      ) : (
                        <Badge variant="red-weak" size="sm">✗ 차단</Badge>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {!r.isDefault && (
                        <div className="flex justify-end gap-2">
                          <button className="text-[13px] text-[#3182f6] hover:text-[#2272eb] font-medium">편집</button>
                          <button className="text-[13px] text-[#f04452] hover:text-[#e42939] font-medium">삭제</button>
                        </div>
                      )}
                      {r.isDefault && (
                        <span className="text-[12px] text-[#b0b8c1]">(기본값)</span>
                      )}
                    </td>
                  </tr>
                ))}
          </tbody>
        </table>
      </Card>

      {/* 규칙 추가 모달 */}
      {showModal && (
        <div className="fixed inset-0 bg-[rgba(2,9,19,0.5)] flex items-center justify-center z-50">
          <div className="bg-white rounded-[16px] w-[520px] shadow-modal">
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#e5e8eb]">
              <h3 className="text-[16px] font-bold text-[#191f28]">규칙 추가</h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-[#8b95a1] hover:text-[#333d4b] transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="px-6 py-5 flex flex-col gap-4">
              {/* 방향 */}
              <div>
                <label className="text-[13px] font-semibold text-[#333d4b] block mb-2">방향</label>
                <div className="flex gap-3">
                  {["Ingress", "Egress"].map((d) => (
                    <button
                      key={d}
                      className={cn(
                        "flex items-center gap-1.5 text-[14px] font-medium",
                        d === "Egress" ? "text-[#3182f6]" : "text-[#8b95a1]"
                      )}
                    >
                      <div
                        className={cn(
                          "w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center",
                          d === "Egress" ? "border-[#3182f6]" : "border-[#d1d6db]"
                        )}
                      >
                        {d === "Egress" && (
                          <div className="w-1.5 h-1.5 rounded-full bg-[#3182f6]" />
                        )}
                      </div>
                      {d}
                    </button>
                  ))}
                </div>
              </div>

              {/* 대상 타입 */}
              <div>
                <label className="text-[13px] font-semibold text-[#333d4b] block mb-2">대상 타입</label>
                <div className="grid grid-cols-2 gap-2">
                  {["클러스터 내 서비스", "네임스페이스", "IP/CIDR", "도메인(DNS 조회)"].map((t) => (
                    <button
                      key={t}
                      className={cn(
                        "px-3 py-2 rounded-[8px] border text-[13px] font-medium text-left transition-colors",
                        t === "도메인(DNS 조회)"
                          ? "border-[#3182f6] bg-[#e8f3ff] text-[#3182f6]"
                          : "border-[#e5e8eb] text-[#4e5968] hover:border-[#d1d6db]"
                      )}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              {/* 도메인 입력 */}
              <div>
                <label className="text-[13px] font-semibold text-[#333d4b] block mb-1.5">도메인</label>
                <input
                  type="text"
                  placeholder="api.external.samsungds.net"
                  className="w-full px-3 py-2.5 rounded-[10px] border border-[#e5e8eb] text-[14px] text-[#333d4b] placeholder:text-[#b0b8c1] outline-none focus:border-[#3182f6]"
                />
              </div>

              {/* 포트 */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[13px] font-semibold text-[#333d4b] block mb-1.5">포트</label>
                  <input
                    type="number"
                    defaultValue={443}
                    className="w-full px-3 py-2.5 rounded-[10px] border border-[#e5e8eb] text-[14px] text-[#333d4b] outline-none focus:border-[#3182f6]"
                  />
                </div>
                <div>
                  <label className="text-[13px] font-semibold text-[#333d4b] block mb-1.5">프로토콜</label>
                  <select className="w-full px-3 py-2.5 rounded-[10px] border border-[#e5e8eb] text-[14px] text-[#333d4b] outline-none focus:border-[#3182f6] bg-white cursor-pointer h-[46px]">
                    <option>TCP</option>
                    <option>UDP</option>
                  </select>
                </div>
              </div>

              {/* YAML 미리보기 */}
              <div className="rounded-[8px] bg-[#191f28] p-3 font-mono text-[12px] text-[#e5e8eb]">
                <div className="text-[#8b95a1] mb-1"># 생성될 YAML</div>
                <div>egress:</div>
                <div>{"  - to:"}</div>
                <div>{"    - ipBlock:"}</div>
                <div>{"        cidr: 10.2.3.4/32"}</div>
                <div>{"  ports:"}</div>
                <div>{"  - port: 443"}</div>
              </div>
            </div>

            <div className="flex justify-end gap-2 px-6 py-4 border-t border-[#e5e8eb]">
              <Button variant="ghost" size="md" onClick={() => setShowModal(false)}>취소</Button>
              <Button variant="primary" size="md">적용</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
