import type { Platform } from '@ai-commerce-ops/shared';

export type AuthType = 'oauth' | 'api_key' | 'cookie' | 'mcp_stdio' | 'openapi';
export type ConnectorHealthStatus = 'healthy' | 'degraded' | 'unavailable';
export type ConnectorRiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface Capability {
  actionType: string;
  description: string;
  riskLevel: ConnectorRiskLevel;
  requiresApproval: boolean;
}

export interface HealthStatus {
  status: ConnectorHealthStatus;
  checkedAt: string;
  message?: string;
}

export interface PlatformAction {
  actionType: string;
  accountId: string;
  payload: Record<string, unknown>;
  riskLevel: ConnectorRiskLevel;
  requiresApproval: boolean;
  idempotencyKey: string;
}

export interface PlatformResult {
  ok: boolean;
  externalId?: string;
  payload: Record<string, unknown>;
  error?: {
    code: string;
    message: string;
  };
}

export interface PlatformConnector {
  platform: Platform;
  authType: AuthType;
  checkHealth(accountId: string): Promise<HealthStatus>;
  listCapabilities(): Promise<Capability[]>;
  execute(action: PlatformAction): Promise<PlatformResult>;
}

