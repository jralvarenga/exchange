import { inferAdditionalFields } from 'better-auth/client/plugins'
import { createAuthClient } from 'better-auth/react'

/** Browser client for Better Auth sign-in, sign-up, and sign-out. */
export const authClient = createAuthClient({
  plugins: [
    inferAdditionalFields({
      user: {
        activeAlpacaEnvironment: {
          input: false,
          required: false,
          type: 'string',
        },
      },
    }),
  ],
})
