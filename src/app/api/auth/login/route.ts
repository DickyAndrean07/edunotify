import { NextRequest, NextResponse } from 'next/server';
import { authenticateUser } from '@/lib/auth/service';
import { setSessionCookie } from '@/lib/auth/session';
import { getRedirectPathForRole } from '@/lib/auth/rbac';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    const result = await authenticateUser(email, password);

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 401 }
      );
    }

    await setSessionCookie(result.user);
    const redirectTo = getRedirectPathForRole(result.user.role);

    return NextResponse.json({
      success: true,
      user: result.user,
      redirectTo,
    });
  } catch (error) {
    console.error('API login error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
