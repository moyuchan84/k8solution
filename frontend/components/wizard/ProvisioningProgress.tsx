"use client";
import { useEffect, useState } from "react";
import { CheckCircle2, XCircle, Loader2, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";
import { apiClient } from "@/lib/api-client";
import type { TaskState } from "@/types/api";

const STEP_LABELS: Record<string, string> = {
  validate_request:       "입력 검증",
  create_github_repo:     "GitHub 레포 생성",
  create_harbor_project:  "Harbor 프로젝트 생성",
  provision_k8s_namespace:"K8s 네임스페이스 프로비저닝",
  apply_rbac:             "RBAC 적용",
  apply_network_policy:   "NetworkPolicy 적용",
  configure_envoy_routing:"Envoy 라우팅 설정",
  push_gitops_manifest:   "GitOps 매니페스트 Push",
  sync_argocd:            "ArgoCD Sync",
  notify_complete:        "완료",
};

const ALL_STEPS = Object.keys(STEP_LABELS);

interface Props {
  trackingId: string;
}

export function ProvisioningProgress({ trackingId }: Props) {
  const [state, setState] = useState<TaskState | null>(null);

  useEffect(() => {
    const es = apiClient.tasks.stream(trackingId);
    es.onmessage = (e) => {
      try {
        setState(JSON.parse(e.data));
      } catch {}
    };
    es.onerror = () => es.close();
    return () => es.close();
  }, [trackingId]);

  const completedSet = new Set(state?.completed_steps ?? []);

  return (
    <div className="max-w-lg mx-auto py-8">
      <h2 className="text-[22px] font-bold text-[#191f28] mb-2">배포 진행 중</h2>
      <p className="text-[14px] text-[#8b95a1] mb-8">
        잠시만 기다려주세요. 약 3분이 소요됩니다.
      </p>

      <div className="flex flex-col gap-3">
        {ALL_STEPS.map((step) => {
          const isCompleted = completedSet.has(step);
          const isCurrent = state?.current_step === step;
          const isFailed = state?.status === "failed" && state.current_step === step;

          return (
            <div
              key={step}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-[12px] transition-all duration-250",
                isCompleted && "bg-[rgba(3,178,108,0.06)]",
                isCurrent && !isFailed && "bg-[#e8f3ff]",
                isFailed && "bg-[rgba(240,68,82,0.06)]"
              )}
            >
              {isFailed ? (
                <XCircle size={20} className="text-[#f04452] flex-shrink-0" />
              ) : isCompleted ? (
                <CheckCircle2 size={20} className="text-[#03b26c] flex-shrink-0" />
              ) : isCurrent ? (
                <Loader2 size={20} className="text-[#3182f6] animate-spin flex-shrink-0" />
              ) : (
                <div className="w-5 h-5 rounded-full border-2 border-[#e5e8eb] flex-shrink-0" />
              )}
              <span
                className={cn(
                  "text-[14px] font-medium",
                  isCompleted && "text-[#03b26c]",
                  isCurrent && !isFailed && "text-[#3182f6]",
                  isFailed && "text-[#f04452]",
                  !isCompleted && !isCurrent && "text-[#b0b8c1]"
                )}
              >
                {STEP_LABELS[step]}
              </span>
            </div>
          );
        })}
      </div>

      {/* 완료 상태 */}
      {state?.status === "completed" && (
        <div className="mt-8 p-5 rounded-[12px] bg-[rgba(3,178,108,0.06)] border border-[rgba(3,178,108,0.2)]">
          <CheckCircle2 size={24} className="text-[#03b26c] mb-2" />
          <p className="text-[16px] font-semibold text-[#191f28] mb-1">배포 완료!</p>
          <p className="text-[13px] text-[#6b7684]">
            서비스가 성공적으로 배포되었습니다.
          </p>
          <a
            href={`https://${state.project_name}.swsol.samsungds.net`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 mt-3 text-[14px] font-semibold text-[#3182f6] hover:text-[#2272eb]"
          >
            <ExternalLink size={14} />
            서비스 접속
          </a>
        </div>
      )}

      {/* 실패 상태 */}
      {state?.status === "failed" && (
        <div className="mt-8 p-5 rounded-[12px] bg-[rgba(240,68,82,0.06)] border border-[rgba(240,68,82,0.2)]">
          <XCircle size={24} className="text-[#f04452] mb-2" />
          <p className="text-[16px] font-semibold text-[#191f28] mb-1">배포 실패</p>
          {state.error_diagnosis ? (
            <p className="text-[13px] text-[#4e5968]">{state.error_diagnosis}</p>
          ) : (
            <code className="text-[12px] text-[#f04452] font-mono">{state.error}</code>
          )}
        </div>
      )}
    </div>
  );
}
