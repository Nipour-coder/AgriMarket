import { cookies } from 'next/headers';

export interface SessionUser {
  id: string;
  name: string;
  email: string;
  role: 'buyer' | 'seller' | 'admin';
}

export async function getCurrentUser(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const demoRole = cookieStore.get('agrimarket_demo_role')?.value as 'buyer' | 'seller' | 'admin' | undefined;

  if (demoRole === 'admin') {
    return {
      id: 'admin-1',
      name: 'AgriMarket Administrator',
      email: 'admin@agrimarket.co.za',
      role: 'admin',
    };
  }

  if (demoRole === 'seller') {
    return {
      id: 'seller-1',
      name: 'Valley Green Agri Cooperative',
      email: 'seller@agrimarket.co.za',
      role: 'seller',
    };
  }

  if (demoRole === 'buyer') {
    return {
      id: 'buyer-1',
      name: 'Commercial Wholesale Buyer',
      email: 'buyer@agrimarket.co.za',
      role: 'buyer',
    };
  }

  const sessionToken = cookieStore.get('agrimarket_session')?.value || cookieStore.get('session_token')?.value;
  if (!sessionToken) return null;

  try {
    const backendUrl = process.env.BACKEND_URL || process.env.NEXT_PUBLIC_API_URL?.replace(/\/api\/?$/, '') || 'http://localhost:5000';
    const res = await fetch(`${backendUrl}/api/auth/me`, {
      headers: {
        cookie: `agrimarket_session=${sessionToken}`,
      },
      cache: 'no-store',
    });

    if (res.ok) {
      const data = await res.json() as { user: SessionUser | null };
      return data.user;
    }
  } catch {
    // Backend unreachable during build or SSR
  }

  return null;
}

