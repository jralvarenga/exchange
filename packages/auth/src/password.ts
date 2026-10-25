import { compare } from 'bcryptjs'
import { verifyPassword } from 'better-auth/crypto'

interface VerifyStoredPasswordInput {
  hash: string
  password: string
}

/**
 * Checks a password against a stored hash.
 * Bcrypt hashes from the previous dashboard login stay valid.
 * Every other hash uses Better Auth's scrypt verifier.
 */
export async function verifyStoredPassword(
  input: VerifyStoredPasswordInput
): Promise<boolean> {
  try {
    if (input.hash.startsWith('$2')) {
      return await compare(input.password, input.hash)
    }

    return await verifyPassword({
      hash: input.hash,
      password: input.password,
    })
  } catch {
    return false
  }
}
