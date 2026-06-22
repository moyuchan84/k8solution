"use client";
import { Bell, Search, ChevronDown } from "lucide-react";
import { useAppStore } from "@/store/useAppStore";

export function TopBar() {
  const { user } = useAppStore();

  return (
    <header className="fixed top-0 right-0 left-[240px] h-[60px] bg-white border-b border-[#e5e8eb] flex items-center justify-between px-6 z-30">
      {/* 검색 */}
      <div className="flex items-center gap-2 w-[320px] h-9 px-3 rounded-[10px] bg-[#f2f4f6] text-[#8b95a1]">
        <Search size={16} className="flex-shrink-0" />
        <input
          type="text"
          placeholder="서비스, 네임스페이스 검색..."
          className="flex-1 bg-transparent text-[14px] text-[#333d4b] placeholder:text-[#b0b8c1] outline-none"
        />
      </div>

      {/* 우측 액션 */}
      <div className="flex items-center gap-3">
        {/* 알림 */}
        <button className="relative w-9 h-9 flex items-center justify-center rounded-[10px] hover:bg-[#f2f4f6] transition-colors">
          <Bell size={18} className="text-[#6b7684]" />
          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-[#f04452]" />
        </button>

        {/* 사용자 프로필 */}
        <button className="flex items-center gap-2 px-3 py-1.5 rounded-[10px] hover:bg-[#f2f4f6] transition-colors">
          <div className="w-7 h-7 rounded-full bg-[#3182f6] flex items-center justify-center text-white text-[12px] font-bold flex-shrink-0">
            {user?.name?.[0] ?? "U"}
          </div>
          <div className="text-left">
            <p className="text-[13px] font-semibold text-[#191f28] leading-none">
              {user?.name ?? "사용자"}
            </p>
            <p className="text-[11px] text-[#8b95a1] mt-0.5">{user?.role ?? "developer"}</p>
          </div>
          <ChevronDown size={14} className="text-[#b0b8c1]" />
        </button>
      </div>
    </header>
  );
}
