import { z } from 'zod'

import { parseEncryptionKeys } from '@/lib/crypto/secret-box'

const envSchema = z
  .object({
    ALPACA_CRYPTO_LOCATION: z
      .enum(['bs-1', 'eu-1', 'us', 'us-1', 'us-2'])
      .optional(),
    ALPACA_DATA_BASE_URL: z.string().url().optional(),
    BETTER_AUTH_SECRET: z.string().min(32),
    BETTER_AUTH_URL: z.string().url(),
    CREDENTIALS_ENCRYPTION_KEYS: z.string().min(1),
    DATABASE_URL: z.string().url(),
    EMAIL_FROM: z.string().trim().min(3),
    GOOGLE_CLIENT_ID: z.string().trim().min(1),
    GOOGLE_CLIENT_SECRET: z.string().trim().min(1),
    // `RESEND_API_KEY=` in an env file loads as '', which means not set.
    RESEND_API_KEY: z
      .string()
      .trim()
      .transform((value) => value || undefined)
      .optional(),
  })
  .superRefine((value, context) => {
    try {
      parseEncryptionKeys(value.CREDENTIALS_ENCRYPTION_KEYS)
    } catch {
      context.addIssue({
        code: 'custom',
        message: 'CREDENTIALS_ENCRYPTION_KEYS is invalid.',
        path: ['CREDENTIALS_ENCRYPTION_KEYS'],
      })
    }

    if (process.env.NODE_ENV === 'production' && !value.RESEND_API_KEY) {
      context.addIssue({
        code: 'custom',
        message: 'RESEND_API_KEY is required in production.',
        path: ['RESEND_API_KEY'],
      })
    }
  })

/** Validated server environment. Importing this module fails fast when it is wrong. */
export const env = envSchema.parse(process.env)

export type Env = z.infer<typeof envSchema>
