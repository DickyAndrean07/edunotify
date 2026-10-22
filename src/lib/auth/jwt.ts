import { SignJWT, jwtVerify } from 'jose';
import { UserRole } from '@/db/schema';

export interface SessionUser {
  id: string;
  schoolId: string;
  email: string;
  name: string;
  role: UserRole;
}

const DEFAULT_SECRET = 'super-secret-jwt-key-minimum-32-chars-long-for-hs256';

function getSecretKey(): Uint8Array {
  const secret = process.env.JWT_SECRET || DEFAULT_SECRET;
  return new TextEncoder().encode(secret);
}

function getTokenExpiry(): string {
  return process.env.JWT_EXPIRES_IN || '24h';
}

/**
 * Sign JWT session token for an authenticated user.
 */
export async function signToken(
  user: SessionUser,
  expiresIn?: string
): Promise<string> {
  const expiry = expiresIn || getTokenExpiry();
  return new SignJWT({
    id: user.id,
    schoolId: user.schoolId,
    email: user.email,
    name: user.name,
    role: user.role,
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(expiry)
    .sign(getSecretKey());
}

/**
 * Verify and decode JWT session token.
 */
export async function verifyToken(token: string): Promise<SessionUser | null> {
  try {
    const { payload } = await jwtVerify(token, getSecretKey());
    if (
      !payload.id ||
      !payload.schoolId ||
      !payload.email ||
      !payload.role
    ) {
      return null;
    }
    return {
      id: payload.id as string,
      schoolId: payload.schoolId as string,
      email: payload.email as string,
      name: (payload.name as string) || '',
      role: payload.role as UserRole,
    };
  } catch (error) {
    return null;
  }
}
