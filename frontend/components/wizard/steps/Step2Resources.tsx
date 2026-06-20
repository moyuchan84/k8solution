"use client";
import { Sparkles, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import { useWizardStore } from "@/store/useWizardStore";
import type { ResourceSize } from "@/types/project";

const SIZES: {
  value: ResourceSize;
  cpu: string;
  mem: string;
  pods: number;
  desc: string;
}[] = [
  { value: "S", cpu: "0.1 CPU", mem: "128 MiB", pods: 1, desc: "소규모 서비스" },
  { value: "M", cpu: "0.5 CPU", mem: "512 MiB", pods: 2, desc: "일반 API 서버" },
  { value: "L", cpu: "1 CPU",   mem: "1 GiB",   pods: 3, desc: "고부하 서비스" },
];

export function Step2Resources() {
  const { formData, updateFormData, fetchLlmSuggestion, llmSuggestion, isLoadingLlm } =
    useWizardStore();

  return (
    <div className="flex flex-col gap-6">
      {/* 리소스 사이즈 선택 */}
      <div className="flex flex-col gap-3">
        <label className="text-[14px] font-semibold text-[#333d4b]">리소스 사이즈</label>
        <div className="grid grid-cols-3 gap-3">
          {SIZES.map(({ value, cpu, mem, pods, desc }) => (
            <button
              key={value}
              type="button"
              onClick={() => updateFormData({ resourceSize: value })}
              className={cn(
                "flex flex-col items-center py-5 px-4 rounded-[12px] border-2 transition-all duration-150",
                formData.resourceSize === value
                  ? "border-[#3182f6] bg-[#e8f3ff]"
                  : "border-[#e5e8eb] bg-white hover:border-[#d1d6db]"
              )}
            >
              <span
                className={cn(
                  "text-[22px] font-bold mb-1 tabular-nums",
                  formData.resourceSize === value ? "text-[#3182f6]" : "text-[#191f28]"
                )}
              >
                {value}
              </span>
              <span className="text-[13px] font-semibold text-[#333d4b]">{cpu}</span>
              <span className="text-[13px] text-[#6b7684]">{mem}</span>
              <span className="text-[12px] text-[#8b95a1] mt-1">Pod × {pods}</span>
              <span className="text-[11px] text-[#b0b8c1] mt-1.5">{desc}</span>
            </button>
          ))}
        </div>
      </div>

      {/* AI 추천 */}
      <div className="rounded-[12px] border border-[#e5e8eb] p-4 bg-[#f9fafb]">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles size={15} className="text-[#3182f6]" />
          <span className="text-[13px] font-semibold text-[#4e5968]">AI 리소스 추천</span>
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="서비스 설명 입력 (예: 하루 10만 건 API 요청 처리하는 REST 서버)"
            value={formData.serviceDescription}
            onChange={(e) => updateFormData({ serviceDescription: e.target.value })}
            className={cn(
              "flex-1 px-3 py-2 rounded-[10px] border border-[#e5e8eb] bg-white",
              "text-[14px] text-[#333d4b] placeholder:text-[#b0b8c1] outline-none",
              "focus:border-[#3182f6]"
            )}
          />
          <Button
            variant="secondary"
            size="md"
            onClick={fetchLlmSuggestion}
            loading={isLoadingLlm}
            disabled={!formData.serviceDescription}
          >
            추천 받기
          </Button>
        </div>
        {llmSuggestion && (
          <div className="mt-3 p-3 rounded-[8px] bg-[#e8f3ff] text-[13px] text-[#3182f6]">
            💡 {llmSuggestion}
          </div>
        )}
      </div>

      {/* 포트 & 헬스체크 */}
      <div className="grid grid-cols-3 gap-4">
        <Input
          label="컨테이너 포트"
          type="number"
          value={formData.port}
          onChange={(e) => updateFormData({ port: Number(e.target.value) })}
        />
        <Input
          label="Health Check 경로"
          placeholder="/health"
          value={formData.healthCheckPath}
          onChange={(e) => updateFormData({ healthCheckPath: e.target.value })}
        />
        <Input
          label="타임아웃 (초)"
          type="number"
          value={formData.healthCheckTimeout}
          onChange={(e) => updateFormData({ healthCheckTimeout: Number(e.target.value) })}
        />
      </div>
    </div>
  );
}
