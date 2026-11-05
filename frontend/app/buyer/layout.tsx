import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/session';

export const dynamic = 'force-dynamic';

export default async function BuyerLayout({ children }: { children: React.ReactNode }) {
  try {
    const user = await getCurrentUser();
    if (user && (user.role === 'buyer' || user.role === 'admin' || user.role === 'seller')) {
      return <>{children}</>;
    }
  } catch {
    // Backend DB not running, redirect to login
  }

  redirect('/login?role=buyer&redirect=/buyer/dashboard');
}
