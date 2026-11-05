/**
 * apiFetch - Wrapper around fetch() that automatically injects the
 * Authorization: Bearer token stored in localStorage after login.
 *
 * This solves the cross-domain cookie problem on Vercel + Render:
 * The session cookie set by Render cannot be forwarded by the browser
 * through Next.js rewrites. Instead, we store the token in localStorage
 * and send it as a Bearer token header.
 */

export function getStoredToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('agrimarket_token');
}

export function clearStoredToken(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('agrimarket_token');
}

export async function apiFetch(
  input: RequestInfo | URL,
  init: RequestInit = {}
): Promise<Response> {
  const token = getStoredToken();
  const headers = new Headers(init.headers || {});

  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  return fetch(input, {
    ...init,
    headers,
    credentials: 'include', // still forward cookies for same-site scenarios
  });
}

