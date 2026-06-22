"use client";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Tenant } from "@/types/api";

interface AppStore {
  currentTenant: Tenant | null;
  tenants: Tenant[];
  user: { name: string; email: string; role: string } | null;
  setCurrentTenant: (tenant: Tenant) => void;
  setTenants: (tenants: Tenant[]) => void;
  setUser: (user: AppStore["user"]) => void;
}

export const useAppStore = create<AppStore>()(
  persist(
    (set) => ({
      currentTenant: null,
      tenants: [],
      user: null,
      setCurrentTenant: (tenant) => set({ currentTenant: tenant }),
      setTenants: (tenants) => set({ tenants }),
      setUser: (user) => set({ user }),
    }),
    { name: "k8solution-app" }
  )
);
