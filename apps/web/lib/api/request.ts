import type { z } from 'zod'

import { parseApiJson } from '@/lib/api/error'
import { getApiUrl } from '@/lib/utils'

interface RequestJsonOptions<Schema extends z.ZodType> {
  body?: unknown
  fallback: string
  method?: 'DELETE' | 'GET' | 'PATCH' | 'POST' | 'PUT'
  path: string
  schema: Schema
  signal?: AbortSignal
}

/** Calls an application API route without caching and validates the JSON response. */
export async function requestJson<Schema extends z.ZodType>(
  options: RequestJsonOptions<Schema>
): Promise<z.infer<Schema>> {
  const response = await fetch(getApiUrl(options.path), {
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
    cache: 'no-store',
    headers: {
      Accept: 'application/json',
      ...(options.body === undefined
        ? {}
        : { 'Content-Type': 'application/json' }),
    },
    method: options.method ?? 'GET',
    signal: options.signal,
  })

  return parseApiJson(response, options.schema, options.fallback)
}

/** Builds a path with only the defined query values. */
export function withQuery(
  path: string,
  values: Record<string, boolean | number | string | undefined>
): string {
  const query = new URLSearchParams()

  for (const [key, value] of Object.entries(values)) {
    if (value !== undefined && value !== '') {
      query.set(key, String(value))
    }
  }

  const search = query.toString()

  return search ? `${path}?${search}` : path
}
