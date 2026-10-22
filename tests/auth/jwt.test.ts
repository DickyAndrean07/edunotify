import { describe, it, expect } from 'vitest';
import { signToken, verifyToken, SessionUser } from '@/lib/auth/jwt';
import { USER_ROLES } from '@/db/schema';

describe('JWT Session Management', () => {
  const dummyUser: SessionUser = {
    id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
    schoolId: 'a12bc34d-58ee-4172-a567-0e02b2c3d999',
    email: 'admin@smanusantara1.sch.id',
    name: 'Ahmad Dahlan',
    role: USER_ROLES.ADMIN_SEKOLAH,
  };

  it('should sign and verify valid JWT token', async () => {
    const token = await signToken(dummyUser, '1h');
    expect(typeof token).toBe('string');
    expect(token.split('.')).toHaveLength(3);

    const verified = await verifyToken(token);
    expect(verified).not.toBeNull();
    expect(verified?.id).toBe(dummyUser.id);
    expect(verified?.schoolId).toBe(dummyUser.schoolId);
    expect(verified?.email).toBe(dummyUser.email);
    expect(verified?.role).toBe(USER_ROLES.ADMIN_SEKOLAH);
  });

  it('should return null for invalid or tampered token', async () => {
    const token = await signToken(dummyUser);
    const tampered = token.slice(0, -6) + 'abcdef';

    const result = await verifyToken(tampered);
    expect(result).toBeNull();
  });

  it('should return null for malformed token string', async () => {
    const result = await verifyToken('not.a.valid.jwt');
    expect(result).toBeNull();
  });
});
