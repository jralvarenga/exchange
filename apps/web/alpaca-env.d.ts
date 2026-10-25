declare namespace NodeJS {
  interface ProcessEnv {
    ALPACA_CRYPTO_LOCATION?: 'bs-1' | 'eu-1' | 'us' | 'us-1' | 'us-2'
    ALPACA_DATA_BASE_URL?: string
    BETTER_AUTH_SECRET?: string
    BETTER_AUTH_TRUSTED_ORIGINS?: string
    BETTER_AUTH_URL?: string
    CREDENTIALS_ENCRYPTION_KEYS?: string
    DATABASE_URL?: string
    EMAIL_FROM?: string
    GOOGLE_CLIENT_ID?: string
    GOOGLE_CLIENT_SECRET?: string
    RESEND_API_KEY?: string
    NEXT_PUBLIC_APP_URL?: string
    PORT?: string
    VERCEL_ENV?: 'development' | 'preview' | 'production'
    VERCEL_URL?: string
  }
}
