"use client";
import { CheckCircle2, Clock, FileCode2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useWizardStore } from "@/store/useWizardStore";

const RESOURCE_ICONS: Record<string, string> = {
  Namespace: "🏷️",
  ResourceQuota: "📊",
  ServiceAccount: "👤",
  "Role + RoleBinding": "🔐",
  NetworkPolicy: "🛡️",
  VirtualService: "🌐",
  "ArgoCD Application": "🔄",
  "GitHub Repo": "🐙",
  "Harbor Project": "🐳",
};

export function Step4ManifestPreview() {
  const { formData, manifestPreview, isLoadingPreview, fetchManifestPreview } =
    useWizardStore();

  const defaultResources = [
    { type: "Namespace",          name: formData.serviceName || "my-service", description: "" },
    { type: "ResourceQuota",      name: `${formData.resourceSize === "S" ? "0.1CPU / 128MiB" : formData.resourceSize === "M" ? "0.5CPU / 512MiB" : "1CPU / 1GiB"}`, description: "" },
    { type: "ServiceAccount",     name: `${formData.serviceName || "my-service"}-sa`, description: "" },
    { type: "Role + RoleBinding", name: "developer", description: "" },
    { type: "NetworkPolicy",      name: "default-deny + DNS" + (formData.dbConnections.length > 0 ? " + allow-db" : ""), description: "" },
    { type: "VirtualService",     name: `${formData.serviceName || "my-service"}.swsol.samsungds.net`, description: "" },
    { type: "ArgoCD Application", name: `${formData.serviceName || "my-service"} (auto-sync)`, description: "" },
    { type: "GitHub Repo",        name: `github.samsungds.net/.../${formData.serviceName || "my-service"}`, description: "" },
    { type: "Harbor Project",     name: `harbor.../.../${formData.serviceName || "my-service"}`, description: "" },
  ];

  const resources = manifestPreview?.resources ?? defaultResources;

  return (
    <div className="flex flex-col gap-5">
      {/* 리소스 목록 */}
      <div className="rounded-[12px] border border-[#e5e8eb] overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 bg-[#f9fafb] border-b border-[#e5e8eb]">
          <span className="text-[14px] font-semibold text-[#333d4b]">생성될 리소스 목록</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={fetchManifestPreview}
            loading={isLoadingPreview}
            className="gap-1.5 text-[13px]"
          >
            <FileCode2 size={14} />
            YAML 전체 보기
          </Button>
        </div>
        <div className="divide-y divide-[#f2f4f6]">
          {resources.map(({ type, name }) => (
            <div key={type} className="flex items-center gap-3 px-4 py-3">
              <CheckCircle2 size={16} className="text-[#03b26c] flex-shrink-0" />
              <span className="text-[14px] text-[#4e5968] font-medium w-40 flex-shrink-0">
                {RESOURCE_ICONS[type] ?? "📄"} {type}
              </span>
              <span className="text-[14px] text-[#191f28] font-mono text-[13px]">{name}</span>
            </div>
          ))}
        </div>
      </div>

      {/* 예상 소요 시간 */}
      <div className="flex items-center gap-2 text-[13px] text-[#8b95a1]">
        <Clock size={14} />
        예상 소요: 약 3분
      </div>
    </div>
  );
}
