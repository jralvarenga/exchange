import { randomBytes } from 'node:crypto'

const authSecret = randomBytes(32).toString('base64url')
const encryptionKey = randomBytes(32).toString('base64url')

console.log('Add these to apps/web/.env.local and the deployment environment.')
console.log(`BETTER_AUTH_SECRET=${authSecret}`)
console.log(`CREDENTIALS_ENCRYPTION_KEYS=k1:${encryptionKey}`)
