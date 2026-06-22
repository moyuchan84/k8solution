export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  tracking_id?: string;
}

export type ProjectStatus =
  | "pending"
  | "in_progress"
  | "completed"
  | "failed"
  | "rolled_back";

export interface TaskState {
  tracking_id: string;
  project_name: string;
  tenant_id: string;
  status: ProjectStatus;
  completed_steps: string[];
  current_step?: string;
  error?: string;
  error_diagnosis?: string;
  created_at: string;
  updated_at: string;
}

export interface PolicyRule {
  id: string;
  direction: "ingress" | "egress";
  targetType: "service" | "namespace" | "ipblock" | "domain";
  target: string;
  port: number;
  protocol: "TCP" | "UDP";
  description?: string;
}

export interface RbacEntry {
  subject: string;
  subjectType: "user" | "group" | "serviceaccount";
  resource: string;
  verbs: string[];
}

export interface ExternalSecret {
  name: string;
  status: "Synced" | "NotReady" | "Error";
  backend: string;
  path: string;
  refreshInterval: string;
  lastSyncTime?: string;
}

export interface Tenant {
  id: string;
  displayName: string;
  namespace: string;
  admins: string[];
  resourceQuota: {
    cpu: string;
    memory: string;
    pods: string;
  };
}
