'use client';

import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';

function VerifyEmailForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [message, setMessage] = useState('Verifying your email address…');
  const [error, setError] = useState('');
  const [email, setEmail] = useState('');
  const [resending, setResending] = useState(false);

  useEffect(() => {
    const token = searchParams.get('token');
    if (!token) {
      setMessage('This verification link is missing a token.');
      return;
    }

    fetch('/api/auth/verify-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    }).then(async (response) => {
      const result = await response.json() as { user?: { role: string }; error?: string };
      if (!response.ok || !result.user) throw new Error(result.error ?? 'Unable to verify this email.');
      window.dispatchEvent(new Event('agrimarket:auth'));
      setMessage('Your email is verified. Your account is ready.');
      window.setTimeout(() => {
        const path = result.user?.role === 'admin'
          ? '/admin/dashboard'
          : result.user?.role === 'seller'
            ? '/seller/dashboard'
            : '/buyer/dashboard';
        router.replace(path);
      }, 1200);
    }).catch((issue: unknown) => {
      setMessage('');
      setError(issue instanceof Error ? issue.message : 'Unable to verify this email.');
    });
  }, [router, searchParams]);

  const resend = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setResending(true);
    setError('');
    try {
      const response = await fetch('/api/auth/resend-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const result = await response.json() as { message?: string; error?: string };
      if (!response.ok) throw new Error(result.error ?? 'Unable to send another verification email.');
      setMessage(result.message ?? 'If this account needs verification, a new link has been sent.');
      setError('');
    } catch (issue) {
      setError(issue instanceof Error ? issue.message : 'Unable to send another verification email.');
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="mx-auto max-w-lg px-5 py-20">
      <div className="rounded-3xl border border-stone-200 bg-white p-8 text-center shadow-sm">
        <h1 className="text-2xl font-extrabold text-[#20372a]">Verify your email</h1>
        {message && <p role="status" className="mt-4 text-sm text-stone-600">{message}</p>}
        {error && <p role="alert" className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-800">{error}</p>}
        {error && (
          <form onSubmit={resend} className="mt-6 space-y-3 text-left">
            <label className="block text-xs font-semibold text-stone-700">
              Account email
              <input
                type="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="mt-1.5 w-full rounded-xl border border-stone-300 px-3.5 py-2.5 text-sm"
              />
            </label>
            <button disabled={resending} className="w-full rounded-xl bg-[#114227] px-4 py-3 text-sm font-bold text-white disabled:opacity-60">
              {resending ? 'Sending…' : 'Send a new verification link'}
            </button>
          </form>
        )}
        <Link href="/login" className="mt-6 inline-block text-sm font-bold text-emerald-800 underline">Go to sign in</Link>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return <Suspense fallback={<div className="py-20 text-center text-sm text-stone-500">Loading…</div>}><VerifyEmailForm /></Suspense>;
}
