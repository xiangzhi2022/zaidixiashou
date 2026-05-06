import { z } from 'zod';

const EnvSchema = z.object({
  NODE_ENV: z.enum(['local', 'dev', 'staging', 'production']).default('local'),
  PORT: z.coerce.number().default(3001),
  DATABASE_URL: z.string().url(),
  REDIS_URL: z.string().url(),
  JWT_SECRET: z.string().min(32),
  CREDENTIAL_ENCRYPTION_KEY: z.string().length(64),
  S3_BUCKET: z.string().min(1),
  S3_ENDPOINT: z.string().url(),
  S3_ACCESS_KEY_ID: z.string().optional(),
  S3_SECRET_ACCESS_KEY: z.string().optional(),
  ANTHROPIC_API_KEY: z.string().optional(),
  OPENAI_API_KEY: z.string().optional()
});

export function envValidation(config: Record<string, unknown>): Record<string, unknown> {
  return EnvSchema.parse(config);
}

