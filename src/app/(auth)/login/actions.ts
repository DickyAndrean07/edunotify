'use server';

import { redirect } from 'next/navigation';
import { authenticateUser } from '@/lib/auth/service';
import { setSessionCookie, clearSessionCookie } from '@/lib/auth/session';
import { getRedirectPathForRole } from '@/lib/auth/rbac';

export interface ActionState {
  error?: string;
  success?: boolean;
}

export async function loginAction(
  prevState: ActionState | null,
  formData: FormData
): Promise<ActionState> {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  const result = await authenticateUser(email, password);

  if (!result.success) {
    return { error: result.error };
  }

  await setSessionCookie(result.user);
  const targetPath = getRedirectPathForRole(result.user.role);
  redirect(targetPath);
}

export async function logoutAction(): Promise<void> {
  await clearSessionCookie();
  redirect('/login');
}
