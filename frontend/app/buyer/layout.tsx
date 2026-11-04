import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@backend/auth';

export const dynamic = 'force-dynamic';

export default async function BuyerLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const demoRole = cookieStore.get('agrimarket_demo_role')?.value;

  if (demoRole === 'buyer' || demoRole === 'admin' || demoRole === 'seller') {
    return <>{children}</>;
  }

  try {
    const user = await getCurrentUser();
    if (user) {
      return <>{children}</>;
    }
  } catch {
    // Backend DB not running, redirect to login
  }

  redirect('/login?role=buyer&redirect=/buyer/dashboard');
}
