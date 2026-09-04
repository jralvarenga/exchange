declare namespace NodeJS {
  interface ProcessEnv {
    ALPACA_API_KEY_ID?: string
    ALPACA_API_SECRET_KEY?: string
    ALPACA_CRYPTO_LOCATION?: 'bs-1' | 'eu-1' | 'us' | 'us-1' | 'us-2'
    ALPACA_DATA_BASE_URL?: string
    ALPACA_ENVIRONMENT?: 'live' | 'paper'
    ALPACA_TRADING_BASE_URL?: string
    AUTH_SECRET?: string
    DASHBOARD_PASSWORD_HASH?: string
    ADDRESS_ETHEREUM_USDC?: string
    ADDRESS_ETHEREUM_USDT?: string
    ADDRESS_SOLANA_USDC?: string
    ADDRESS_SOLANA_USDT?: string
    NEXT_PUBLIC_APP_URL?: string
    PORT?: string
    VERCEL_URL?: string
  }
}
