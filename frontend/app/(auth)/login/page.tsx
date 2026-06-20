"use client";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

export default function LoginPage() {
  const [loading, setLoading] = useState(false);

  const handleSso = () => {
    setLoading(true);
    window.location.href = "/api/auth/sso";
  };

  return (
    <div className="min-h-screen bg-[#f9fafb] flex items-center justify-center">
      <div className="w-full max-w-[400px] px-5">
        {/* 로고 */}
        <div className="flex flex-col items-center mb-10">
          <div className="w-14 h-14 rounded-[18px] bg-[#3182f6] flex items-center justify-center mb-4 shadow-card">
            <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
              <rect x="3" y="3" width="9" height="9" rx="2.5" fill="white" />
              <rect x="16" y="3" width="9" height="9" rx="2.5" fill="white" fillOpacity="0.6" />
              <rect x="3" y="16" width="9" height="9" rx="2.5" fill="white" fillOpacity="0.6" />
              <rect x="16" y="16" width="9" height="9" rx="2.5" fill="white" />
            </svg>
          </div>
          <h1 className="text-[26px] font-bold text-[#191f28]">GitOps Platform</h1>
          <p className="text-[14px] text-[#8b95a1] mt-1">삼성 사내 K8s 셀프 서비스 플랫폼</p>
        </div>

        {/* 로그인 카드 */}
        <div className="bg-white rounded-[16px] p-6 shadow-card">
          <Button
            variant="primary"
            size="xl"
            fullWidth
            onClick={handleSso}
            loading={loading}
          >
            사내 SSO로 로그인
          </Button>

          <div className="flex items-center gap-3 my-4">
            <div className="flex-1 h-px bg-[#e5e8eb]" />
            <span className="text-[13px] text-[#b0b8c1]">또는</span>
            <div className="flex-1 h-px bg-[#e5e8eb]" />
          </div>

          <div className="flex flex-col gap-3">
            <Input label="아이디" placeholder="LDAP 아이디" />
            <Input label="비밀번호" type="password" placeholder="••••••••" />
            <Button variant="dark" size="lg" fullWidth>
              로그인
            </Button>
          </div>
        </div>

        <p className="text-center text-[12px] text-[#b0b8c1] mt-6">
          접근 권한 문의: platform-team@samsungds.net
        </p>
      </div>
    </div>
  );
}
