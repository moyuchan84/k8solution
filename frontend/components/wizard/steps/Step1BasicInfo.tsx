"use client";
import { Input } from "@/components/ui/Input";
import { cn } from "@/lib/utils";
import { useWizardStore } from "@/store/useWizardStore";
import type { TechStack, StartMethod, Environment } from "@/types/project";

const STACKS: { value: TechStack; label: string; emoji: string }[] = [
  { value: "java", label: "Java (Spring Boot)", emoji: "☕" },
  { value: "nodejs", label: "Node.js", emoji: "🟢" },
  { value: "python", label: "Python", emoji: "🐍" },
  { value: "go", label: "Go", emoji: "🐹" },
  { value: "other", label: "기타 (Dockerfile)", emoji: "🐳" },
];

const ENVS: { value: Environment; label: string; desc: string }[] = [
  { value: "dev", label: "dev", desc: "개발" },
  { value: "staging", label: "staging", desc: "스테이징" },
  { value: "prod", label: "prod", desc: "운영" },
];

const START_METHODS: { value: StartMethod; label: string; desc: string; badge?: string }[] = [
  { value: "template", label: "Template에서 시작", desc: "검증된 스택 템플릿 사용", badge: "추천" },
  { value: "blank", label: "빈 프로젝트로 시작", desc: "처음부터 설정" },
  { value: "existing", label: "기존 GitHub 레포 연결", desc: "이미 있는 레포 사용" },
];

export function Step1BasicInfo() {
  const { formData, updateFormData } = useWizardStore();

  return (
    <div className="flex flex-col gap-6">
      <Input
        label="서비스 이름"
        placeholder="my-api-service"
        value={formData.serviceName}
        onChange={(e) => updateFormData({ serviceName: e.target.value })}
        hint={
          formData.serviceName
            ? `→ ${formData.serviceName}.swsol.samsungds.net`
            : undefined
        }
      />

      {/* 시작 방법 */}
      <div className="flex flex-col gap-2">
        <label className="text-[14px] font-semibold text-[#333d4b]">시작 방법</label>
        <div className="flex flex-col gap-2">
          {START_METHODS.map(({ value, label, desc, badge }) => (
            <button
              key={value}
              type="button"
              onClick={() => updateFormData({ startMethod: value })}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-[12px] border text-left transition-all duration-150",
                formData.startMethod === value
                  ? "border-[#3182f6] bg-[#e8f3ff]"
                  : "border-[#e5e8eb] bg-white hover:border-[#d1d6db] hover:bg-[#f9fafb]"
              )}
            >
              <div
                className={cn(
                  "w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0",
                  formData.startMethod === value
                    ? "border-[#3182f6]"
                    : "border-[#d1d6db]"
                )}
              >
                {formData.startMethod === value && (
                  <div className="w-2 h-2 rounded-full bg-[#3182f6]" />
                )}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-[14px] font-semibold text-[#191f28]">{label}</span>
                  {badge && (
                    <span className="text-[11px] font-bold text-[#3182f6] bg-[#e8f3ff] px-1.5 py-0.5 rounded-[6px]">
                      {badge}
                    </span>
                  )}
                </div>
                <span className="text-[13px] text-[#8b95a1]">{desc}</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* 기술 스택 */}
      <div className="flex flex-col gap-2">
        <label className="text-[14px] font-semibold text-[#333d4b]">기술 스택</label>
        <div className="grid grid-cols-3 gap-2">
          {STACKS.map(({ value, label, emoji }) => (
            <button
              key={value}
              type="button"
              onClick={() => updateFormData({ techStack: value })}
              className={cn(
                "flex items-center gap-2 px-3 py-2.5 rounded-[10px] border text-[13px] font-medium transition-all duration-150",
                formData.techStack === value
                  ? "border-[#3182f6] bg-[#e8f3ff] text-[#3182f6]"
                  : "border-[#e5e8eb] bg-white text-[#4e5968] hover:border-[#d1d6db]"
              )}
            >
              <span>{emoji}</span>
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* 환경 */}
      <div className="flex flex-col gap-2">
        <label className="text-[14px] font-semibold text-[#333d4b]">배포 환경</label>
        <div className="flex gap-2">
          {ENVS.map(({ value, label, desc }) => (
            <button
              key={value}
              type="button"
              onClick={() => updateFormData({ environment: value })}
              className={cn(
                "flex-1 py-2.5 rounded-[10px] border text-[14px] font-semibold transition-all duration-150",
                formData.environment === value
                  ? "border-[#3182f6] bg-[#e8f3ff] text-[#3182f6]"
                  : "border-[#e5e8eb] bg-white text-[#4e5968] hover:border-[#d1d6db]"
              )}
            >
              <div>{label}</div>
              <div className="text-[12px] font-normal text-[#8b95a1]">{desc}</div>
            </button>
          ))}
        </div>
      </div>

      {/* 담당자 */}
      <Input
        label="담당자"
        placeholder="LDAP 검색 (예: hong.gildong)"
        value={formData.assignee}
        onChange={(e) => updateFormData({ assignee: e.target.value })}
      />
    </div>
  );
}
