import { eq } from 'drizzle-orm';
import { db } from '@/db';
import { users } from '@/db/schema';
import { verifyPassword } from './password';
import { SessionUser } from './jwt';

export type AuthResult =
  | { success: true; user: SessionUser }
  | { success: false; error: string };

/**
 * Core authentication service: validates credentials against database.
 */
export async function authenticateUser(
  email: string,
  plainPassword: string
): Promise<AuthResult> {
  const trimmedEmail = email?.trim().toLowerCase();

  if (!trimmedEmail || !plainPassword) {
    return { success: false, error: 'Email dan password wajib diisi.' };
  }

  try {
    const foundUsers = await db
      .select({
        id: users.id,
        schoolId: users.schoolId,
        name: users.name,
        email: users.email,
        passwordHash: users.passwordHash,
        role: users.role,
        isActive: users.isActive,
      })
      .from(users)
      .where(eq(users.email, trimmedEmail))
      .limit(1);

    if (foundUsers.length === 0) {
      return { success: false, error: 'Email atau password tidak valid.' };
    }

    const user = foundUsers[0];

    if (!user.isActive) {
      return {
        success: false,
        error: 'Akun ini dinonaktifkan. Silakan hubungi Administrator Sekolah.',
      };
    }

    const isMatch = await verifyPassword(plainPassword, user.passwordHash);
    if (!isMatch) {
      return { success: false, error: 'Email atau password tidak valid.' };
    }

    return {
      success: true,
      user: {
        id: user.id,
        schoolId: user.schoolId,
        email: user.email,
        name: user.name,
        role: user.role as SessionUser['role'],
      },
    };
  } catch (error) {
    console.error('Authentication error:', error);
    return { success: false, error: 'Terjadi kesalahan sistem saat autentikasi.' };
  }
}
