import { describe, it, expect } from 'vitest';
import { hashPassword, verifyPassword } from '@/lib/auth/password';

describe('Password Hashing & Verification (Bcrypt Cost Factor >= 12)', () => {
  it('should hash password with cost factor 12 prefix ($2b$12$ or $2a$12$)', async () => {
    const rawPassword = 'SecurePassword2026!';
    const hash = await hashPassword(rawPassword);

    expect(hash).toBeDefined();
    expect(hash.length).toBeGreaterThan(20);
    expect(hash.startsWith('$2b$12$') || hash.startsWith('$2a$12$')).toBe(true);
  });

  it('should verify correct password successfully', async () => {
    const rawPassword = 'SecretGuru123!';
    const hash = await hashPassword(rawPassword);

    const isValid = await verifyPassword(rawPassword, hash);
    expect(isValid).toBe(true);
  });

  it('should reject wrong password', async () => {
    const rawPassword = 'SecretGuru123!';
    const hash = await hashPassword(rawPassword);

    const isValid = await verifyPassword('WrongPassword123!', hash);
    expect(isValid).toBe(false);
  });

  it('should reject empty or invalid password inputs gracefully', async () => {
    const hash = await hashPassword('ValidPass123!');
    expect(await verifyPassword('', hash)).toBe(false);
    expect(await verifyPassword('ValidPass123!', '')).toBe(false);
  });
});
