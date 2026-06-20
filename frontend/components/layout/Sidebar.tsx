"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Layers,
  FolderGit2,
  ShieldCheck,
  BookOpen,
  Settings,
  ChevronDown,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/store/useAppStore";

const NAV_ITEMS = [
  { href: "/dashboard",  label: "대시보드",     icon: LayoutDashboard },
  { href: "/templates",  label: "템플릿 갤러리", icon: Layers },
  { href: "/projects",   label: "서비스 목록",   icon: FolderGit2 },
  { href: "/admin",      label: "관리자",        icon: ShieldCheck, adminOnly: true },
  { href: "/learn",      label: "K8s 학습",      icon: BookOpen },
];

export function Sidebar() {
  const pathname = usePathname();
  const { currentTenant, tenants, setCurrentTenant } = useAppStore();

  return (
    <aside
      className="fixed left-0 top-0 h-screen w-[240px] bg-white border-r border-[#e5e8eb] flex flex-col z-40"
      style={{ boxShadow: "1px 0 0 #e5e8eb" }}
    >
      {/* 로고 */}
      <div className="px-5 py-5 border-b border-[#e5e8eb]">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-[10px] bg-[#3182f6] flex items-center justify-center">
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <rect x="2" y="2" width="6" height="6" rx="1.5" fill="white" />
              <rect x="10" y="2" width="6" height="6" rx="1.5" fill="white" fillOpacity="0.6" />
              <rect x="2" y="10" width="6" height="6" rx="1.5" fill="white" fillOpacity="0.6" />
              <rect x="10" y="10" width="6" height="6" rx="1.5" fill="white" />
            </svg>
          </div>
          <div>
            <p className="text-[15px] font-semibold text-[#191f28] leading-none">GitOps</p>
            <p className="text-[12px] text-[#8b95a1] mt-0.5">Platform</p>
          </div>
        </div>
      </div>

      {/* 테넌트 선택 */}
      <div className="px-3 py-3 border-b border-[#e5e8eb]">
        <button className="w-full flex items-center justify-between px-3 py-2 rounded-[10px] hover:bg-[#f2f4f6] transition-colors text-left group">
          <div>
            <p className="text-[11px] text-[#8b95a1] font-medium mb-0.5">현재 부서</p>
            <p className="text-[14px] font-semibold text-[#191f28]">
              {currentTenant?.displayName ?? "부서 선택"}
            </p>
          </div>
          <ChevronDown
            size={16}
            className="text-[#b0b8c1] group-hover:text-[#6b7684] transition-colors flex-shrink-0"
          />
        </button>
      </div>

      {/* 네비게이션 */}
      <nav className="flex-1 px-3 py-3 overflow-y-auto">
        <ul className="flex flex-col gap-0.5">
          {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
            const isActive =
              href === "/dashboard"
                ? pathname === href
                : pathname.startsWith(href);
            return (
              <li key={href}>
                <Link
                  href={href}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-[10px] text-[14px] font-medium transition-all duration-150",
                    isActive
                      ? "bg-[#e8f3ff] text-[#3182f6]"
                      : "text-[#4e5968] hover:bg-[#f2f4f6] hover:text-[#191f28]"
                  )}
                >
                  <Icon
                    size={18}
                    className={cn(isActive ? "text-[#3182f6]" : "text-[#8b95a1]")}
                  />
                  {label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* 설정 */}
      <div className="px-3 py-3 border-t border-[#e5e8eb]">
        <Link
          href="/admin"
          className="flex items-center gap-3 px-3 py-2.5 rounded-[10px] text-[14px] font-medium text-[#4e5968] hover:bg-[#f2f4f6] hover:text-[#191f28] transition-colors"
        >
          <Settings size={18} className="text-[#8b95a1]" />
          설정
        </Link>
      </div>
    </aside>
  );
}
