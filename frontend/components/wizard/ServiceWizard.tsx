"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, Rocket } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import { useWizardStore } from "@/store/useWizardStore";
import { apiClient } from "@/lib/api-client";
import { Step1BasicInfo } from "./steps/Step1BasicInfo";
import { Step2Resources } from "./steps/Step2Resources";
import { Step3Connections } from "./steps/Step3Connections";
import { Step4ManifestPreview } from "./steps/Step4ManifestPreview";
import { ProvisioningProgress } from "./ProvisioningProgress";

const STEPS = [
  { n: 1, label: "기본 정보" },
  { n: 2, label: "리소스 설정" },
  { n: 3, label: "외부 연결" },
  { n: 4, label: "Manifest Preview" },
] as const;

export function ServiceWizard() {
  const router = useRouter();
  const { currentStep, setStep, formData, fetchManifestPreview, reset } = useWizardStore();
  const [trackingId, setTrackingId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const goNext = async () => {
    if (currentStep === 3) await fetchManifestPreview();
    if (currentStep < 4) setStep((currentStep + 1) as 1 | 2 | 3 | 4);
  };

  const goPrev = () => {
    if (currentStep > 1) setStep((currentStep - 1) as 1 | 2 | 3 | 4);
  };

  const handleDeploy = async () => {
    setIsSubmitting(true);
    const res = await apiClient.projects.create(formData);
    if (res.success && res.tracking_id) {
      setTrackingId(res.tracking_id);
    }
    setIsSubmitting(false);
  };

  if (trackingId) {
    return <ProvisioningProgress trackingId={trackingId} />;
  }

  return (
    <div className="max-w-[680px]">
      {/* 진행 상태 바 */}
      <div className="flex items-center gap-0 mb-8">
        {STEPS.map(({ n, label }, idx) => (
          <div key={n} className="flex items-center flex-1">
            <div className="flex flex-col items-center">
              <div
                className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center text-[13px] font-bold transition-all duration-250",
                  n < currentStep
                    ? "bg-[#03b26c] text-white"
                    : n === currentStep
                    ? "bg-[#3182f6] text-white"
                    : "bg-[#e5e8eb] text-[#b0b8c1]"
                )}
              >
                {n < currentStep ? "✓" : n}
              </div>
              <span
                className={cn(
                  "mt-1.5 text-[12px] font-medium whitespace-nowrap",
                  n === currentStep ? "text-[#3182f6]" : "text-[#8b95a1]"
                )}
              >
                {label}
              </span>
            </div>
            {idx < STEPS.length - 1 && (
              <div
                className={cn(
                  "h-[2px] flex-1 mx-2 mt-[-16px] transition-all duration-250",
                  n < currentStep ? "bg-[#03b26c]" : "bg-[#e5e8eb]"
                )}
              />
            )}
          </div>
        ))}
      </div>

      {/* 폼 콘텐츠 */}
      <div className="bg-white rounded-[16px] p-6 shadow-card mb-5">
        {currentStep === 1 && <Step1BasicInfo />}
        {currentStep === 2 && <Step2Resources />}
        {currentStep === 3 && <Step3Connections />}
        {currentStep === 4 && <Step4ManifestPreview />}
      </div>

      {/* 네비게이션 버튼 */}
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          size="lg"
          onClick={goPrev}
          disabled={currentStep === 1}
          className="gap-1.5"
        >
          <ChevronLeft size={18} />
          이전
        </Button>

        {currentStep < 4 ? (
          <Button variant="primary" size="lg" onClick={goNext} className="gap-1.5">
            다음
            <ChevronRight size={18} />
          </Button>
        ) : (
          <Button
            variant="primary"
            size="xl"
            onClick={handleDeploy}
            loading={isSubmitting}
            className="gap-2 px-8"
          >
            <Rocket size={18} />
            배포 요청
          </Button>
        )}
      </div>
    </div>
  );
}
