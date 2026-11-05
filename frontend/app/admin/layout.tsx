import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/session';

export const dynamic = 'force-dynamic';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
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
