import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** Resolves an app API path for the current runtime. */
export function getApiUrl(path: string): string {
  if (typeof window !== 'undefined') {
    return path
  }

  return new URL(path, getServerOrigin()).toString()
}

/** Returns the origin used to turn relative API paths into absolute URLs. */
function getServerOrigin(): string {
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL
  }

  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`
  }

  return `http://localhost:${process.env.PORT ?? '3000'}`
}
