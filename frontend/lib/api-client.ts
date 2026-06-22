import type { ApiResponse, PolicyRule, RbacEntry, TaskState } from "@/types/api";
import type { WizardFormData } from "@/types/project";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

async function request<T>(
  path: string,
  options?: RequestInit
): Promise<ApiResponse<T>> {
  const res = await fetch(`${BASE_URL}/api/v1${path}`, {
    headers: { "Content-Type": "application/json", ...options?.headers },
    ...options,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    return { success: false, error: body.detail ?? `HTTP ${res.status}` };
  }
  return res.json();
}

export const apiClient = {
  projects: {
    list: () => request("/projects"),
    get: (name: string) => request(`/projects/${name}`),
    create: (data: WizardFormData) =>
      request("/projects", { method: "POST", body: JSON.stringify(data) }),
    manifestPreview: (data: WizardFormData) =>
      request("/projects/preview", { method: "POST", body: JSON.stringify(data) }),
  },

  tasks: {
    get: (trackingId: string) =>
      request<TaskState>(`/tasks/${trackingId}`),
    stream: (trackingId: string): EventSource =>
      new EventSource(`${BASE_URL}/api/v1/tasks/${trackingId}/stream`),
  },

  tenants: {
    list: () => request("/tenants"),
    get: (id: string) => request(`/tenants/${id}`),
    create: (data: unknown) =>
      request("/tenants", { method: "POST", body: JSON.stringify(data) }),
  },

  network: {
    getRules: (projectName: string) =>
      request(`/projects/${projectName}/network/rules`),
    previewRule: (projectName: string, rule: PolicyRule) =>
      request(`/projects/${projectName}/network/preview`, {
        method: "POST",
        body: JSON.stringify(rule),
      }),
    applyRule: (projectName: string, rule: PolicyRule) =>
      request(`/projects/${projectName}/network/rules`, {
        method: "POST",
        body: JSON.stringify(rule),
      }),
    deleteRule: (projectName: string, ruleId: string) =>
      request(`/projects/${projectName}/network/rules/${ruleId}`, {
        method: "DELETE",
      }),
    testConnection: (projectName: string, target: string, port: number) =>
      request(`/projects/${projectName}/network/test`, {
        method: "POST",
        body: JSON.stringify({ target, port }),
      }),
  },

  rbac: {
    getMatrix: (projectName: string) =>
      request(`/projects/${projectName}/rbac/matrix`),
    updateMatrix: (projectName: string, entries: RbacEntry[]) =>
      request(`/projects/${projectName}/rbac/matrix`, {
        method: "PUT",
        body: JSON.stringify({ entries }),
      }),
  },

  resources: {
    previewChanges: (projectName: string, changes: Record<string, unknown>) =>
      request(`/projects/${projectName}/resources/preview`, {
        method: "POST",
        body: JSON.stringify(changes),
      }),
    getExternalSecrets: (projectName: string) =>
      request(`/projects/${projectName}/resources/external-secrets`),
    applyYaml: (projectName: string, yaml: string) =>
      request(`/projects/${projectName}/resources/apply`, {
        method: "POST",
        body: JSON.stringify({ yaml }),
      }),
  },

  secrets: {
    list: (projectName: string) =>
      request(`/projects/${projectName}/secrets`),
    set: (projectName: string, key: string, value: string, isSecret: boolean) =>
      request(`/projects/${projectName}/secrets`, {
        method: "POST",
        body: JSON.stringify({ key, value, isSecret }),
      }),
    delete: (projectName: string, key: string) =>
      request(`/projects/${projectName}/secrets/${key}`, { method: "DELETE" }),
  },

  llm: {
    suggestSize: (description: string) =>
      request("/llm/suggest-size", {
        method: "POST",
        body: JSON.stringify({ description }),
      }),
  },
};
