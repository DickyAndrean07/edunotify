import { describe, it, expect } from 'vitest';
import {
  sanitizeString,
  sanitizeGender,
  sanitizePhone,
  sanitizeEmail,
  isValidEmail,
} from '@/lib/importers/sanitizer';

describe('Sanitizer Unit Tests', () => {
  describe('sanitizeString', () => {
    it('strips HTML script tags to prevent XSS', () => {
      const malicious = '<script>alert("XSS")</script>Budi Santoso';
      expect(sanitizeString(malicious)).toBe('Budi Santoso');
    });

    it('strips HTML image onerror tags', () => {
      const malicious = '<img src=x onerror=alert(1)>Ahmad';
      expect(sanitizeString(malicious)).toBe('Ahmad');
    });

    it('trims whitespace and strips control characters', () => {
      const input = '  \x00\x08Halo Dunia\x1F  ';
      expect(sanitizeString(input)).toBe('Halo Dunia');
    });

    it('handles null and undefined safely', () => {
      expect(sanitizeString(null)).toBe('');
      expect(sanitizeString(undefined)).toBe('');
    });
  });

  describe('sanitizeGender', () => {
    it('normalizes male formats to L', () => {
      expect(sanitizeGender('L')).toBe('L');
      expect(sanitizeGender('l')).toBe('L');
      expect(sanitizeGender('Laki-laki')).toBe('L');
      expect(sanitizeGender('Pria')).toBe('L');
      expect(sanitizeGender('Male')).toBe('L');
    });

    it('normalizes female formats to P', () => {
      expect(sanitizeGender('P')).toBe('P');
      expect(sanitizeGender('p')).toBe('P');
      expect(sanitizeGender('Perempuan')).toBe('P');
      expect(sanitizeGender('Wanita')).toBe('P');
      expect(sanitizeGender('Female')).toBe('P');
    });

    it('returns null for invalid gender', () => {
      expect(sanitizeGender('Unknown')).toBeNull();
      expect(sanitizeGender('')).toBeNull();
      expect(sanitizeGender(123)).toBeNull();
    });
  });

  describe('sanitizePhone', () => {
    it('normalizes formatted phone numbers', () => {
      expect(sanitizePhone('0812-3456-7890')).toBe('081234567890');
      expect(sanitizePhone('0812 3456 7890')).toBe('081234567890');
      expect(sanitizePhone('(0812) 34567890')).toBe('081234567890');
    });

    it('normalizes +62 and 62 country code to 0', () => {
      expect(sanitizePhone('+6281234567890')).toBe('081234567890');
      expect(sanitizePhone('6281234567890')).toBe('081234567890');
    });
  });

  describe('sanitizeEmail & isValidEmail', () => {
    it('lowercases and trims email', () => {
      expect(sanitizeEmail('  Guru@Sekolah.SCH.ID  ')).toBe('guru@sekolah.sch.id');
    });

    it('validates email formats correctly', () => {
      expect(isValidEmail('admin@sekolah.sch.id')).toBe(true);
      expect(isValidEmail('test.user@gmail.com')).toBe(true);
      expect(isValidEmail('invalid-email')).toBe(false);
      expect(isValidEmail('user@')).toBe(false);
      expect(isValidEmail('@domain.com')).toBe(false);
    });
  });
});
