import { UserRole, USER_ROLES } from '@/db/schema';

export const ROLE_LABELS: Record<UserRole, string> = {
  [USER_ROLES.ADMIN_SEKOLAH]: 'Admin Sekolah',
  [USER_ROLES.GURU_MAPEL]: 'Guru Mata Pelajaran',
  [USER_ROLES.WALI_KELAS]: 'Wali Kelas',
  [USER_ROLES.KEPALA_SEKOLAH]: 'Kepala Sekolah',
};

export const ROLE_HOME_PATHS: Record<UserRole, string> = {
  [USER_ROLES.ADMIN_SEKOLAH]: '/admin',
  [USER_ROLES.GURU_MAPEL]: '/teacher',
  [USER_ROLES.WALI_KELAS]: '/homeroom',
  [USER_ROLES.KEPALA_SEKOLAH]: '/principal',
};

/**
 * Get standard home redirect path for a user role.
 */
export function getRedirectPathForRole(role: UserRole): string {
  return ROLE_HOME_PATHS[role] || '/login';
}

/**
 * Route RBAC rules mapping prefix paths to allowed roles.
 */
export const ROUTE_PERMISSIONS: { prefix: string; allowedRoles: UserRole[] }[] = [
  {
    prefix: '/admin',
    allowedRoles: [USER_ROLES.ADMIN_SEKOLAH],
  },
  {
    prefix: '/teacher',
    allowedRoles: [
      USER_ROLES.GURU_MAPEL,
      USER_ROLES.WALI_KELAS,
      USER_ROLES.ADMIN_SEKOLAH,
    ],
  },
  {
    prefix: '/homeroom',
    allowedRoles: [USER_ROLES.WALI_KELAS, USER_ROLES.ADMIN_SEKOLAH],
  },
  {
    prefix: '/principal',
    allowedRoles: [USER_ROLES.KEPALA_SEKOLAH, USER_ROLES.ADMIN_SEKOLAH],
  },
];

/**
 * Check whether a user with a given role can access a path.
 */
export function isRouteAllowed(pathname: string, role: UserRole): boolean {
  for (const rule of ROUTE_PERMISSIONS) {
    if (pathname === rule.prefix || pathname.startsWith(`${rule.prefix}/`)) {
      return rule.allowedRoles.includes(role);
    }
  }
  return true;
}
