export type ResourceSize = "S" | "M" | "L";
export type TechStack = "java" | "nodejs" | "python" | "go" | "other";
export type Environment = "dev" | "staging" | "prod";
export type StartMethod = "template" | "blank" | "existing";

export interface DbConnection {
  type: "postgresql" | "mysql" | "redis" | "mongodb";
  host: string;
  port: number;
  database: string;
  credentialType: "direct" | "secret";
  secretName?: string;
  secretKey?: string;
}

export interface WizardFormData {
  // Step 1
  serviceName: string;
  startMethod: StartMethod;
  techStack: TechStack;
  environment: Environment;
  assignee: string;
  templateId?: string;

  // Step 2
  resourceSize: ResourceSize;
  port: number;
  healthCheckPath: string;
  healthCheckTimeout: number;
  serviceDescription: string;

  // Step 3
  dbConnections: DbConnection[];
  externalApis: ExternalApiConnection[];

  // Step 4 (generated)
  manifestPreview?: ManifestPreview;
}

export interface ExternalApiConnection {
  name: string;
  domain: string;
  port: number;
  protocol: "TCP" | "UDP";
}

export interface ManifestPreview {
  resources: ManifestResource[];
  estimatedMinutes: number;
  yamlFull: string;
}

export interface ManifestResource {
  type: string;
  name: string;
  description: string;
}

export interface Project {
  name: string;
  tenantId: string;
  environment: Environment;
  techStack: TechStack;
  resourceSize: ResourceSize;
  status: "healthy" | "degraded" | "error" | "unknown";
  argoStatus?: "Synced" | "OutOfSync" | "Unknown";
  podCount: number;
  podReady: number;
  url: string;
  createdAt: string;
  assignees: string[];
}

export interface DeployHistory {
  tag: string;
  branch: string;
  status: "current" | "success" | "failed" | "preview";
  deployer: string;
  deployedAt: string;
  commitSha?: string;
}
