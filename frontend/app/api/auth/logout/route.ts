import { NextResponse } from 'next/server';
import { clearSession } from '@backend/auth';

export async function POST() {
  try {
    try {
      await clearSession();
    } catch {
      // Backend clear session if available
    }

    const response = NextResponse.json({ message: 'Signed out successfully.' });
    response.cookies.delete('agrimarket_demo_role');
    response.cookies.delete('session_token');
    return response;
  } catch {
    const response = NextResponse.json({ message: 'Signed out.' });
    response.cookies.delete('agrimarket_demo_role');
    return response;
  }
}
