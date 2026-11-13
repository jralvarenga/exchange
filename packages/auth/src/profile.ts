/** Largest data URL accepted for a profile photo, about 90 KB of image data. */
export const MAX_PROFILE_IMAGE_LENGTH = 120_000

const DATA_IMAGE_PATTERN =
  /^data:image\/(?:jpeg|png|webp);base64,[A-Za-z0-9+/]+={0,2}$/u

/** Hosts Google serves profile pictures from. Other image hosts are refused. */
const GOOGLE_PHOTO_HOST = /(^|\.)googleusercontent\.com$/u

/**
 * Accepts a missing photo, a Google profile picture URL, or a small base64
 * PNG, JPEG or WebP data URL from the sign-up form. Both are capped in length,
 * and other hosts are refused so a photo cannot make members' browsers load
 * an arbitrary third-party URL.
 */
export function isAllowedProfileImage(
  image: string | null | undefined
): boolean {
  if (image === null || image === undefined || image === '') {
    return true
  }

  if (image.length > MAX_PROFILE_IMAGE_LENGTH) {
    return false
  }

  if (image.startsWith('data:')) {
    return DATA_IMAGE_PATTERN.test(image)
  }

  try {
    const url = new URL(image)

    return url.protocol === 'https:' && GOOGLE_PHOTO_HOST.test(url.hostname)
  } catch {
    return false
  }
}

/** Names the workspace every new user starts in: "Ana's workspace". */
export function personalWorkspaceName(name: string): string {
  const firstName = name.trim().split(/\s+/u)[0]

  return firstName ? `${firstName.slice(0, 30)}'s workspace` : 'My workspace'
}
