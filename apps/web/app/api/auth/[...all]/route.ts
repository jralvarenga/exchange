import { auth } from '@workspace/auth/server'
import { toNextJsHandler } from 'better-auth/next-js'

import { env } from '@/lib/env'

void env

export const { DELETE, GET, PATCH, POST, PUT } = toNextJsHandler(auth)
