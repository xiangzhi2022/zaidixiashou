import { Platforms } from '@ai-commerce-ops/shared';
import type {
  Capability,
  HealthStatus,
  PlatformAction,
  PlatformConnector,
  PlatformResult
} from '../base/platform-connector.js';

export class MockConnector implements PlatformConnector {
  platform = Platforms.SHOPIFY;
  authType = 'mcp_stdio' as const;

  async checkHealth(accountId: string): Promise<HealthStatus> {
    return {
      status: 'healthy',
      checkedAt: new Date().toISOString(),
      message: `Mock connector ready for ${accountId}`
    };
  }

  async listCapabilities(): Promise<Capability[]> {
    return [
      {
        actionType: 'mock.read',
        description: 'Read mock platform data',
        riskLevel: 'LOW',
        requiresApproval: false
      }
    ];
  }

  async execute(action: PlatformAction): Promise<PlatformResult> {
    return {
      ok: true,
      externalId: `mock_${action.idempotencyKey}`,
      payload: {
        actionType: action.actionType,
        echoedPayload: action.payload
      }
    };
  }
}

