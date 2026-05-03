export const QueueNames = {
  SYNC_ORDERS: 'sync.orders',
  SYNC_MEDIA_METRICS: 'sync.mediaMetrics',
  AI_GENERATE_CREATIVE: 'ai.generateCreative',
  MEDIA_PUBLISH: 'media.publish',
  APPROVAL_TIMEOUT: 'approval.timeout',
  AUTOMATION_RUN: 'automation.run'
} as const;

export type QueueName = (typeof QueueNames)[keyof typeof QueueNames];

