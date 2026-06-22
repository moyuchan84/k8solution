"use client";
import { useState } from "react";
import Link from "next/link";
import { Plus, Save } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { cn } from "@/lib/utils";

const RESOURCES = ["pods", "deploy", "secrets", "configmap", "jobs", "logs"] as const;
type Resource = typeof RESOURCES[number];
type Verb = "R" | "W" | "RW" | "-";

interface Subject {
  name: string;
  type: "group" | "sa" | "user";
  perms: Record<Resource, Verb>;
}

const INITIAL: Subject[] = [
  { name: "sw-team (LDAP 그룹)",  type: "group", perms: { pods: "R", deploy: "R", secrets: "-", configmap: "R", jobs: "-", logs: "R" } },
  { name: "ci-bot (SA)",          type: "sa",    perms: { pods: "R", deploy: "RW", secrets: "-", configmap: "R", jobs: "-", logs: "-" } },
  { name: "홍길동 (개인)",        type: "user",  perms: { pods: "RW", deploy: "RW", secrets: "R", configmap: "RW", jobs: "R", logs: "R" } },
  { name: "이팀장 (tenant-admin)",type: "user",  perms: { pods: "RW", deploy: "RW", secrets: "RW", configmap: "RW", jobs: "RW", logs: "R" } },
];

const VERB_CYCLE: Verb[] = ["-", "R", "W", "RW"];
const VERB_STYLE: Record<Verb, string> = {
  "RW": "bg-[#e8f3ff] text-[#3182f6] font-bold",
  "R":  "bg-[#f2f4f6] text-[#4e5968] font-semibold",
  "W":  "bg-[rgba(254,152,0,0.1)] text-[#fe9800] font-semibold",
  "-":  "text-[#b0b8c1]",
};

export default function RbacPage({ params }: { params: { name: string } }) {
  const [subjects, setSubjects] = useState<Subject[]>(INITIAL);
  const [isDirty, setIsDirty] = useState(false);

  const cycleVerb = (subIdx: number, res: Resource) => {
    setSubjects((prev) =>
      prev.map((s, i) => {
        if (i !== subIdx) return s;
        const cur = VERB_CYCLE.indexOf(s.perms[res]);
        const next = VERB_CYCLE[(cur + 1) % VERB_CYCLE.length];
        return { ...s, perms: { ...s.perms, [res]: next } };
      })
    );
    setIsDirty(true);
  };

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
            <span className="text-[#333d4b]">권한 관리</span>
          </div>
          <h1 className="text-[22px] font-bold text-[#191f28]">RBAC 매트릭스</h1>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="md" className="gap-1.5">
            <Plus size={15} />
            사용자/그룹 추가
          </Button>
          {isDirty && (
            <Button variant="primary" size="md" className="gap-1.5">
              <Save size={15} />
              변경 저장
            </Button>
          )}
        </div>
      </div>

      {/* 역할 템플릿 */}
      <div className="flex items-center gap-2 mb-5">
        <span className="text-[13px] text-[#6b7684] font-medium">역할 템플릿:</span>
        {["developer", "reviewer", "deployer", "read-only"].map((r) => (
          <button
            key={r}
            className="text-[13px] font-medium text-[#3182f6] hover:text-[#2272eb] px-2 py-1 rounded-[6px] hover:bg-[#e8f3ff] transition-colors"
          >
            {r}
          </button>
        ))}
      </div>

      {/* 매트릭스 테이블 */}
      <Card className="p-0 overflow-hidden mb-6">
        <div className="px-4 py-3 bg-[#f9fafb] border-b border-[#e5e8eb]">
          <p className="text-[12px] text-[#8b95a1] font-medium">
            Namespace: <span className="text-[#333d4b] font-semibold">{params.name}</span>
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#f2f4f6]">
                <th className="px-4 py-3 text-left text-[12px] font-semibold text-[#8b95a1] min-w-[180px]">
                  주체
                </th>
                {RESOURCES.map((r) => (
                  <th key={r} className="px-3 py-3 text-center text-[12px] font-semibold text-[#8b95a1]">
                    {r}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f2f4f6]">
              {subjects.map((sub, si) => (
                <tr key={sub.name} className="hover:bg-[#f9fafb] transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div
                        className={cn(
                          "w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white",
                          sub.type === "group" && "bg-[#3182f6]",
                          sub.type === "sa" && "bg-[#fe9800]",
                          sub.type === "user" && "bg-[#03b26c]"
                        )}
                      >
                        {sub.name[0]}
                      </div>
                      <span className="text-[13px] font-medium text-[#333d4b]">{sub.name}</span>
                    </div>
                  </td>
                  {RESOURCES.map((res) => (
                    <td key={res} className="px-3 py-3 text-center">
                      <button
                        onClick={() => cycleVerb(si, res)}
                        className={cn(
                          "min-w-[36px] h-7 px-2 rounded-[6px] text-[12px] transition-all duration-150 hover:scale-105",
                          VERB_STYLE[sub.perms[res]]
                        )}
                      >
                        {sub.perms[res]}
                      </button>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {/* 범례 */}
        <div className="px-4 py-2.5 border-t border-[#f2f4f6] bg-[#f9fafb] flex items-center gap-4">
          <span className="text-[12px] text-[#8b95a1]">범례:</span>
          {([["R", "읽기"], ["W", "쓰기"], ["RW", "읽기+쓰기"], ["-", "없음"]] as [Verb, string][]).map(
            ([v, label]) => (
              <div key={v} className="flex items-center gap-1">
                <span className={cn("text-[12px] px-1.5 py-0.5 rounded-[4px]", VERB_STYLE[v])}>
                  {v}
                </span>
                <span className="text-[12px] text-[#8b95a1]">{label}</span>
              </div>
            )
          )}
          <span className="text-[12px] text-[#b0b8c1] ml-2">셀 클릭으로 권한 변경</span>
        </div>
      </Card>

      {/* ServiceAccount */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-[15px] font-bold text-[#191f28]">ServiceAccount 관리</h3>
          <Button variant="outline" size="sm" className="gap-1.5">
            <Plus size={14} />
            SA 생성
          </Button>
        </div>
        <div className="flex items-center justify-between px-4 py-3 rounded-[10px] border border-[#e5e8eb]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-[rgba(254,152,0,0.1)] flex items-center justify-center text-[13px] font-bold text-[#fe9800]">
              B
            </div>
            <div>
              <p className="text-[14px] font-semibold text-[#191f28]">ci-bot</p>
              <p className="text-[12px] text-[#8b95a1]">생성일: 2026-01-15</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" size="sm">토큰 재발급</Button>
            <Button variant="ghost" size="sm" className="text-[#f04452]">삭제</Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
