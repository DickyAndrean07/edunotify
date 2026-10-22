import { describe, it, expect } from 'vitest';
import { authenticateUser } from '@/lib/auth/service';
import { USER_ROLES } from '@/db/schema';
import { db } from '@/db';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';

describe('Authentication & 4 Roles Login Verification', () => {
  const validPassword = process.env.SEED_DEFAULT_PASSWORD || 'EduNotify2026!Secure';

  const roleCredentials = [
    {
      role: USER_ROLES.ADMIN_SEKOLAH,
      email: 'admin@smanusantara1.sch.id',
    },
    {
      role: USER_ROLES.GURU_MAPEL,
      email: 'guru@smanusantara1.sch.id',
    },
    {
      role: USER_ROLES.WALI_KELAS,
      email: 'walikelas@smanusantara1.sch.id',
    },
    {
      role: USER_ROLES.KEPALA_SEKOLAH,
      email: 'kepsek@smanusantara1.sch.id',
    },
  ];

  it.each(roleCredentials)(
    'should authenticate $role successfully with valid credentials',
    async ({ role, email }) => {
      const result = await authenticateUser(email, validPassword);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.user.email).toBe(email);
        expect(result.user.role).toBe(role);
        expect(result.user.id).toBeDefined();
        expect(result.user.schoolId).toBeDefined();
      }
    }
  );

  it('should verify passwords are stored ONLY as secure hashes and never plaintext in DB', async () => {
    const allUsers = await db.select().from(users);
    expect(allUsers.length).toBeGreaterThanOrEqual(4);

    for (const u of allUsers) {
      // Must not match any plaintext password
      expect(u.passwordHash).not.toBe(validPassword);
      // Must be a valid Bcrypt hash format ($2b$12$...)
      expect(u.passwordHash.startsWith('$2b$12$') || u.passwordHash.startsWith('$2a$12$')).toBe(
        true
      );
    }
  });

  it('should reject invalid password with friendly error', async () => {
    const result = await authenticateUser(
      'admin@smanusantara1.sch.id',
      'CompletelyWrongPassword!'
    );

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe('Email atau password tidak valid.');
    }
  });

  it('should reject unknown email', async () => {
    const result = await authenticateUser(
      'unknown@sekolah.sch.id',
      validPassword
    );

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe('Email atau password tidak valid.');
    }
  });

  it('should handle case-insensitive email and whitespace trimming', async () => {
    const result = await authenticateUser(
      '  ADMIN@smanusantara1.SCH.ID  ',
      validPassword
    );

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.user.email).toBe('admin@smanusantara1.sch.id');
    }
  });
});
