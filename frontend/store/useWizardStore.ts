"use client";
import { create } from "zustand";
import type { WizardFormData, ManifestPreview } from "@/types/project";
import { apiClient } from "@/lib/api-client";

const defaultFormData: WizardFormData = {
  serviceName: "",
  startMethod: "blank",
  techStack: "java",
  environment: "dev",
  assignee: "",
  resourceSize: "M",
  port: 8080,
  healthCheckPath: "/health",
  healthCheckTimeout: 5,
  serviceDescription: "",
  dbConnections: [],
  externalApis: [],
};

interface WizardStore {
  currentStep: 1 | 2 | 3 | 4;
  formData: WizardFormData;
  manifestPreview: ManifestPreview | null;
  llmSuggestion: string;
  isLoadingPreview: boolean;
  isLoadingLlm: boolean;

  setStep: (step: 1 | 2 | 3 | 4) => void;
  updateFormData: (data: Partial<WizardFormData>) => void;
  fetchManifestPreview: () => Promise<void>;
  fetchLlmSuggestion: () => Promise<void>;
  reset: () => void;
}

export const useWizardStore = create<WizardStore>((set, get) => ({
  currentStep: 1,
  formData: defaultFormData,
  manifestPreview: null,
  llmSuggestion: "",
  isLoadingPreview: false,
  isLoadingLlm: false,

  setStep: (step) => set({ currentStep: step }),

  updateFormData: (data) =>
    set((state) => ({ formData: { ...state.formData, ...data } })),

  fetchManifestPreview: async () => {
    set({ isLoadingPreview: true });
    const res = await apiClient.projects.manifestPreview(get().formData);
    if (res.success && res.data) {
      set({ manifestPreview: res.data as ManifestPreview });
    }
    set({ isLoadingPreview: false });
  },

  fetchLlmSuggestion: async () => {
    const { serviceDescription } = get().formData;
    if (!serviceDescription) return;
    set({ isLoadingLlm: true });
    const res = await apiClient.llm.suggestSize(serviceDescription);
    if (res.success && res.data) {
      set({ llmSuggestion: res.data as string });
    }
    set({ isLoadingLlm: false });
  },

  reset: () =>
    set({ currentStep: 1, formData: defaultFormData, manifestPreview: null, llmSuggestion: "" }),
}));
