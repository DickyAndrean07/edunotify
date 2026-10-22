import { getSession } from '@/lib/auth/session';
import { getRedirectPathForRole } from '@/lib/auth/rbac';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const session = await getSession();

  if (session) {
    redirect(getRedirectPathForRole(session.role));
  }

  redirect('/login');
}
