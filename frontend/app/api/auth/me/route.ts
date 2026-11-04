import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getCurrentUser } from '@backend/auth';

export async function GET(request: Request) {
  try {
    void request.headers.get('cookie');
    const cookieStore = await cookies();
    const demoRole = cookieStore.get('agrimarket_demo_role')?.value;

    try {
      const user = await getCurrentUser();
      if (user) {
        return NextResponse.json({ user });
      }
    } catch {
      // Backend DB not running, check demo role cookie below
    }

    if (demoRole === 'admin') {
      return NextResponse.json({
        user: {
          id: 'admin-1',
          name: 'AgriMarket Administrator',
          email: 'admin@agrimarket.co.za',
          role: 'admin',
        },
      });
    }

    if (demoRole === 'seller') {
      return NextResponse.json({
        user: {
          id: 'seller-1',
          name: 'Valley Green Agri Cooperative',
          email: 'seller@agrimarket.co.za',
          role: 'seller',
        },
      });
    }

    if (demoRole === 'buyer') {
      return NextResponse.json({
        user: {
          id: 'buyer-1',
          name: 'Commercial Wholesale Buyer',
          email: 'buyer@agrimarket.co.za',
          role: 'buyer',
        },
      });
    }

    return NextResponse.json({ user: null });
  } catch {
    return NextResponse.json({ user: null });
  }
}
