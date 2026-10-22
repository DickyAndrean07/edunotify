import bcrypt from 'bcryptjs';

const BCRYPT_COST_FACTOR = 12;

/**
 * Hash password securely using Bcrypt with cost factor >= 12.
 */
export async function hashPassword(password: string): Promise<string> {
  if (!password || typeof password !== 'string') {
    throw new Error('Password must be a valid non-empty string');
  }
  const salt = await bcrypt.genSalt(BCRYPT_COST_FACTOR);
  return bcrypt.hash(password, salt);
}

/**
 * Verify password against stored hash.
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  if (!password || !hash) {
    return false;
  }
  return bcrypt.compare(password, hash);
}
