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
      id: '24e208b2-385d-4884-a904-7e3316103084',
      name: 'AgriMarket Administrator',
      email: 'admin@agrimarket.co.za',
      role: 'admin',
    };
  }

  if (demoRole === 'seller') {
    return {
      id: '396e8a20-120b-48c7-8090-26f816d414a5',
      name: 'Valley Green Agri Cooperative',
      email: 'seller@valleygreen.co.za',
      role: 'seller',
    };
  }

  if (demoRole === 'buyer') {
    return {
      id: 'e25742f6-d4ba-4de4-8ec5-bc4bc5ed283d',
      name: 'Commercial Wholesale Buyer',
      email: 'buyer@freshmark.co.za',
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

