import { describe, it, expect } from 'vitest';
import {
  isRouteAllowed,
  getRedirectPathForRole,
  ROLE_HOME_PATHS,
} from '@/lib/auth/rbac';
import { USER_ROLES } from '@/db/schema';

describe('RBAC Route Protection & Redirection', () => {
  it('should return correct home redirect path for each of the 4 roles', () => {
    expect(getRedirectPathForRole(USER_ROLES.ADMIN_SEKOLAH)).toBe('/admin');
    expect(getRedirectPathForRole(USER_ROLES.GURU_MAPEL)).toBe('/teacher');
    expect(getRedirectPathForRole(USER_ROLES.WALI_KELAS)).toBe('/homeroom');
    expect(getRedirectPathForRole(USER_ROLES.KEPALA_SEKOLAH)).toBe('/principal');
  });

  describe('Route Access Permission Rules', () => {
    it('ADMIN_SEKOLAH should have full access to all dashboards', () => {
      expect(isRouteAllowed('/admin', USER_ROLES.ADMIN_SEKOLAH)).toBe(true);
      expect(isRouteAllowed('/admin/users', USER_ROLES.ADMIN_SEKOLAH)).toBe(true);
      expect(isRouteAllowed('/teacher', USER_ROLES.ADMIN_SEKOLAH)).toBe(true);
      expect(isRouteAllowed('/homeroom', USER_ROLES.ADMIN_SEKOLAH)).toBe(true);
      expect(isRouteAllowed('/principal', USER_ROLES.ADMIN_SEKOLAH)).toBe(true);
    });

    it('GURU_MAPEL should only access teacher dashboard and be blocked elsewhere', () => {
      expect(isRouteAllowed('/teacher', USER_ROLES.GURU_MAPEL)).toBe(true);
      expect(isRouteAllowed('/teacher/attendance', USER_ROLES.GURU_MAPEL)).toBe(true);

      expect(isRouteAllowed('/admin', USER_ROLES.GURU_MAPEL)).toBe(false);
      expect(isRouteAllowed('/homeroom', USER_ROLES.GURU_MAPEL)).toBe(false);
      expect(isRouteAllowed('/principal', USER_ROLES.GURU_MAPEL)).toBe(false);
    });

    it('WALI_KELAS should access homeroom & teacher dashboards, blocked from admin & principal', () => {
      expect(isRouteAllowed('/homeroom', USER_ROLES.WALI_KELAS)).toBe(true);
      expect(isRouteAllowed('/homeroom/monitoring', USER_ROLES.WALI_KELAS)).toBe(true);
      expect(isRouteAllowed('/teacher', USER_ROLES.WALI_KELAS)).toBe(true);

      expect(isRouteAllowed('/admin', USER_ROLES.WALI_KELAS)).toBe(false);
      expect(isRouteAllowed('/principal', USER_ROLES.WALI_KELAS)).toBe(false);
    });

    it('KEPALA_SEKOLAH should access principal dashboard, blocked from admin/homeroom/teacher', () => {
      expect(isRouteAllowed('/principal', USER_ROLES.KEPALA_SEKOLAH)).toBe(true);
      expect(isRouteAllowed('/principal/reports', USER_ROLES.KEPALA_SEKOLAH)).toBe(true);

      expect(isRouteAllowed('/admin', USER_ROLES.KEPALA_SEKOLAH)).toBe(false);
      expect(isRouteAllowed('/homeroom', USER_ROLES.KEPALA_SEKOLAH)).toBe(false);
      expect(isRouteAllowed('/teacher', USER_ROLES.KEPALA_SEKOLAH)).toBe(false);
    });
  });
});
