import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyToken } from './lib/auth/jwt';
import { getRedirectPathForRole, isRouteAllowed } from './lib/auth/rbac';

const SESSION_COOKIE_NAME = 'edunotify_session';

const PUBLIC_FILE = /\.(.*)$/;

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip static files, Next internals, api auth endpoints if any
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api/public') ||
    pathname === '/favicon.ico' ||
    PUBLIC_FILE.test(pathname)
  ) {
    return NextResponse.next();
  }

  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const user = token ? await verifyToken(token) : null;

  // Root path routing - Landing Page EduNotify (Public)
  if (pathname === '/') {
    return NextResponse.next();
  }

  // Login page access
  if (pathname === '/login') {
    if (user) {
      const redirectUrl = new URL(getRedirectPathForRole(user.role), request.url);
      return NextResponse.redirect(redirectUrl);
    }
    return NextResponse.next();
  }

  // Check if route is protected by RBAC
  const isProtected =
    pathname.startsWith('/admin') ||
    pathname.startsWith('/teacher') ||
    pathname.startsWith('/homeroom') ||
    pathname.startsWith('/principal');

  if (isProtected) {
    if (!user) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('callbackUrl', pathname);
      return NextResponse.redirect(loginUrl);
    }

    if (!isRouteAllowed(pathname, user.role)) {
      // Forbidden: redirect to their permitted role dashboard
      const fallbackUrl = new URL(getRedirectPathForRole(user.role), request.url);
      fallbackUrl.searchParams.set('error', 'unauthorized');
      return NextResponse.redirect(fallbackUrl);
    }

    // Pass multitenant context to downstream server components via request headers
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('x-user-id', user.id);
    requestHeaders.set('x-school-id', user.schoolId);
    requestHeaders.set('x-user-role', user.role);

    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
