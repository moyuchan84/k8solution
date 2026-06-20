"use client";
import { Plus, Database, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { cn } from "@/lib/utils";
import { useWizardStore } from "@/store/useWizardStore";
import type { DbConnection } from "@/types/project";

const DB_TYPES: DbConnection["type"][] = ["postgresql", "mysql", "redis", "mongodb"];

export function Step3Connections() {
  const { formData, updateFormData } = useWizardStore();

  const addDb = () => {
    updateFormData({
      dbConnections: [
        ...formData.dbConnections,
        {
          type: "postgresql",
          host: "",
          port: 5432,
          database: "",
          credentialType: "secret",
          secretName: "",
          secretKey: "url",
        },
      ],
    });
  };

  const removeDb = (idx: number) => {
    updateFormData({
      dbConnections: formData.dbConnections.filter((_, i) => i !== idx),
    });
  };

  const updateDb = (idx: number, data: Partial<DbConnection>) => {
    updateFormData({
      dbConnections: formData.dbConnections.map((c, i) =>
        i === idx ? { ...c, ...data } : c
      ),
    });
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" onClick={addDb} className="gap-1.5">
          <Plus size={15} />
          DB 연결 추가
        </Button>
        <Button variant="outline" size="sm" className="gap-1.5">
          <Plus size={15} />
          외부 API 추가
        </Button>
      </div>

      {formData.dbConnections.length === 0 && (
        <div className="flex flex-col items-center py-10 rounded-[12px] border border-dashed border-[#e5e8eb]">
          <Database size={32} className="text-[#d1d6db] mb-2" />
          <p className="text-[14px] text-[#8b95a1]">외부 연결이 없습니다</p>
          <p className="text-[13px] text-[#b0b8c1]">필요한 DB나 외부 API를 추가하세요</p>
        </div>
      )}

      {formData.dbConnections.map((conn, idx) => (
        <div key={idx} className="rounded-[12px] border border-[#e5e8eb] p-4 bg-white">
          {/* 헤더 */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="text-lg">🗄️</span>
              <select
                value={conn.type}
                onChange={(e) =>
                  updateDb(idx, { type: e.target.value as DbConnection["type"] })
                }
                className="text-[15px] font-semibold text-[#191f28] bg-transparent border-none outline-none cursor-pointer"
              >
                {DB_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t.charAt(0).toUpperCase() + t.slice(1)}
                  </option>
                ))}
              </select>
            </div>
            <button
              type="button"
              onClick={() => removeDb(idx)}
              className="text-[#b0b8c1] hover:text-[#f04452] transition-colors"
            >
              <Trash2 size={16} />
            </button>
          </div>

          {/* 연결 정보 */}
          <div className="grid grid-cols-3 gap-3 mb-4">
            <div className="col-span-2">
              <Input
                label="Host"
                placeholder="db.internal.samsungds.net"
                value={conn.host}
                onChange={(e) => updateDb(idx, { host: e.target.value })}
              />
            </div>
            <Input
              label="Port"
              type="number"
              value={conn.port}
              onChange={(e) => updateDb(idx, { port: Number(e.target.value) })}
            />
          </div>
          <Input
            label="Database"
            placeholder="user_db"
            value={conn.database}
            onChange={(e) => updateDb(idx, { database: e.target.value })}
          />

          {/* 크리덴셜 방식 */}
          <div className="mt-4">
            <label className="text-[13px] font-semibold text-[#333d4b] block mb-2">크리덴셜</label>
            <div className="flex gap-3 mb-3">
              {(["secret", "direct"] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => updateDb(idx, { credentialType: t })}
                  className={cn(
                    "flex items-center gap-1.5 text-[13px] font-medium transition-colors",
                    conn.credentialType === t ? "text-[#3182f6]" : "text-[#8b95a1]"
                  )}
                >
                  <div
                    className={cn(
                      "w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center",
                      conn.credentialType === t ? "border-[#3182f6]" : "border-[#d1d6db]"
                    )}
                  >
                    {conn.credentialType === t && (
                      <div className="w-1.5 h-1.5 rounded-full bg-[#3182f6]" />
                    )}
                  </div>
                  {t === "secret" ? "K8s Secret 참조" : "직접 입력"}
                </button>
              ))}
            </div>

            {conn.credentialType === "secret" && (
              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="Secret 이름"
                  placeholder="db-credentials"
                  value={conn.secretName ?? ""}
                  onChange={(e) => updateDb(idx, { secretName: e.target.value })}
                />
                <Input
                  label="Key"
                  placeholder="url"
                  value={conn.secretKey ?? ""}
                  onChange={(e) => updateDb(idx, { secretKey: e.target.value })}
                />
              </div>
            )}
          </div>

          {/* NetworkPolicy 미리보기 */}
          {conn.host && (
            <div className="mt-4 p-3 rounded-[8px] bg-[#f9fafb] border border-[#e5e8eb]">
              <p className="text-[12px] font-semibold text-[#8b95a1] mb-1">
                생성될 NetworkPolicy
              </p>
              <code className="text-[12px] text-[#4e5968] font-mono">
                egress → {conn.host}:{conn.port} 허용
              </code>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
