import { z } from 'zod';

export const RequestIdSchema = z.string().min(1);

export const ApiErrorPayloadSchema = z.object({
  code: z.string().min(1),
  message: z.string().min(1),
  detail: z.record(z.unknown()).optional()
});

export const HealthResponseSchema = z.object({
  status: z.literal('ok')
});

