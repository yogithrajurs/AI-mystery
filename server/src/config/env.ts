import { z } from 'zod';

const schema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(5000),
  CLIENT_URL: z.string().url().default('http://localhost:5173'),
  MONGODB_URI: z.string().min(1, 'MONGODB_URI is required'),
  GEMINI_API_KEY: z.string().min(1, 'GEMINI_API_KEY is required'),
  GEMINI_MODEL: z.string().min(1).default('gemini-2.5-flash'),
  SESSION_SECRET: z.string().min(32, 'SESSION_SECRET must be at least 32 characters'),
  SESSION_TTL_HOURS: z.coerce.number().positive().default(72),
  MAX_SCENARIO_LENGTH: z.coerce.number().int().positive().default(1000),
  MAX_GENERATION_ATTEMPTS: z.coerce.number().int().min(1).max(5).default(3),
  MAX_CASES_PER_HOUR: z.coerce.number().int().positive().default(5)
});

const parsed = schema.safeParse(process.env);
if (!parsed.success) {
  const missing = parsed.error.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`).join('; ');
  throw new Error(`Invalid server configuration. Copy .env.example to .env and configure required values. ${missing}`);
}
if (parsed.data.NODE_ENV === 'production' && parsed.data.SESSION_SECRET === 'replace-with-a-long-random-secret') {
  throw new Error('SESSION_SECRET must be replaced with a secure random value in production.');
}
export const env = parsed.data;

