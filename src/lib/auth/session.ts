import { cookies } from 'next/headers';
import { verifyToken, signToken, SessionUser } from './jwt';

export const SESSION_COOKIE_NAME = 'edunotify_session';
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24; // 24 hours

/**
 * Get current session user from HttpOnly cookie.
 */
export async function getSession(): Promise<SessionUser | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
    if (!token) return null;
    return await verifyToken(token);
  } catch (error) {
    return null;
  }
}

/**
 * Set session HttpOnly cookie for authenticated user.
 */
export async function setSessionCookie(user: SessionUser): Promise<string> {
  const token = await signToken(user);
  const cookieStore = await cookies();
  const isSecure =
    process.env.COOKIE_SECURE === 'true' ||
    (process.env.NODE_ENV === 'production' && process.env.COOKIE_SECURE !== 'false' && process.env.HOST_PROTOCOL === 'https');

  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: isSecure,
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_MAX_AGE_SECONDS,
  });
  return token;
}

/**
 * Clear session cookie (logout).
 */
export async function clearSessionCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}
