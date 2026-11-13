import { MAX_PROFILE_IMAGE_LENGTH } from '@workspace/auth/profile'

/** Side of the square profile photo, in pixels. Shown at most at 96px, so 2x and a bit. */
const PHOTO_SIZE = 256

const QUALITIES = [0.86, 0.72, 0.58]

/** Raised when a picked file cannot be turned into a profile photo. */
export class ProfilePhotoError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ProfilePhotoError'
  }
}

/**
 * Center-crops an image file to a 256px square and encodes it as a WebP data
 * URL small enough for the server limit. Runs in the browser only.
 */
export async function toProfilePhoto(file: File): Promise<string> {
  if (!file.type.startsWith('image/')) {
    throw new ProfilePhotoError('Pick an image file.')
  }

  let bitmap: ImageBitmap

  try {
    bitmap = await createImageBitmap(file)
  } catch {
    throw new ProfilePhotoError('That image could not be read.')
  }

  const canvas = document.createElement('canvas')
  canvas.width = PHOTO_SIZE
  canvas.height = PHOTO_SIZE
  const context = canvas.getContext('2d')

  if (!context) {
    bitmap.close()
    throw new ProfilePhotoError('That image could not be read.')
  }

  const side = Math.min(bitmap.width, bitmap.height)
  // JPEG has no transparency; fill first so see-through areas turn white, not
  // black, and both encodings look the same.
  context.fillStyle = 'white'
  context.fillRect(0, 0, PHOTO_SIZE, PHOTO_SIZE)
  context.drawImage(
    bitmap,
    (bitmap.width - side) / 2,
    (bitmap.height - side) / 2,
    side,
    side,
    0,
    0,
    PHOTO_SIZE,
    PHOTO_SIZE
  )
  bitmap.close()

  for (const quality of QUALITIES) {
    // Browsers without WebP encoding fall back to PNG; JPEG is the last resort.
    const webp = canvas.toDataURL('image/webp', quality)
    const encoded = webp.startsWith('data:image/webp')
      ? webp
      : canvas.toDataURL('image/jpeg', quality)

    if (encoded.length <= MAX_PROFILE_IMAGE_LENGTH) {
      return encoded
    }
  }

  throw new ProfilePhotoError('That image is too detailed. Try another one.')
}
