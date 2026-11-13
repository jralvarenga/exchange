/** Largest data URL accepted for a profile photo, about 90 KB of image data. */
export const MAX_PROFILE_IMAGE_LENGTH = 120_000

const DATA_IMAGE_PATTERN =
  /^data:image\/(?:jpeg|png|webp);base64,[A-Za-z0-9+/]+={0,2}$/u

/**
 * Accepts a missing photo, an https URL (Google profile pictures) or a small
 * base64 PNG, JPEG or WebP data URL from the sign-up form.
 */
export function isAllowedProfileImage(
  image: string | null | undefined
): boolean {
  if (image === null || image === undefined || image === '') {
    return true
  }

  if (image.startsWith('data:')) {
    return (
      image.length <= MAX_PROFILE_IMAGE_LENGTH && DATA_IMAGE_PATTERN.test(image)
    )
  }

  try {
    return new URL(image).protocol === 'https:'
  } catch {
    return false
  }
}

/** Names the workspace every new user starts in: "Ana's workspace". */
export function personalWorkspaceName(name: string): string {
  const firstName = name.trim().split(/\s+/u)[0]

  return firstName ? `${firstName.slice(0, 30)}'s workspace` : 'My workspace'
}
