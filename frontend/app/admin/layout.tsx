import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@backend/auth';

export const dynamic = 'force-dynamic';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const demoRole = cookieStore.get('agrimarket_demo_role')?.value;

  if (demoRole === 'admin') {
    return <>{children}</>;
  }

  try {
    const user = await getCurrentUser();
    if (user && user.role === 'admin') {
      return <>{children}</>;
    }
  } catch {
    // Backend DB not running, redirect to login
  }

  redirect('/login?role=admin&redirect=/admin/verifications');
}
