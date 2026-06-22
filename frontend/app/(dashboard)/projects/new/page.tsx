import { ServiceWizard } from "@/components/wizard/ServiceWizard";

export default function NewProjectPage() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-[26px] font-bold text-[#191f28]">새 서비스 배포</h1>
        <p className="text-[14px] text-[#8b95a1] mt-1">
          단계별 설정으로 K8s + GitHub + Harbor + ArgoCD를 한 번에 프로비저닝합니다
        </p>
      </div>
      <ServiceWizard />
    </div>
  );
}
