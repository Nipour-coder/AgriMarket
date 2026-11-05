'use client';

import { useState } from 'react';
import NextLink from 'next/link';
import { Mail, Sprout, ArrowLeft, CheckCircle2, KeyRound, Copy, Check } from 'lucide-react';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successData, setSuccessData] = useState<{ message: string; tempPassword?: string } | null>(null);
  const [copied, setCopied] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await response.json() as { success?: boolean; message?: string; error?: string; tempPassword?: string };

      if (!response.ok) {
        throw new Error(data.error || 'Unable to reset password. Please verify your email.');
      }

      setSuccessData({
        message: data.message || 'A new password has been sent to your email.',
        tempPassword: data.tempPassword,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to reset password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const copyPassword = () => {
    if (successData?.tempPassword) {
      navigator.clipboard.writeText(successData.tempPassword);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8faf6] py-12 sm:py-16 flex flex-col justify-center">
      <div className="max-w-md w-full mx-auto px-4 sm:px-6">
        {/* Brand header */}
        <div className="text-center mb-6">
          <NextLink href="/" className="inline-flex items-center gap-2 mb-4">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#1b432a] to-[#2d6a45] flex items-center justify-center text-white shadow-md">
              <Sprout className="w-6 h-6 text-[#a8e063]" />
            </div>
            <span className="text-2xl font-black tracking-tight text-[#163824]">
              Agri<span className="text-[#5b9632]">Market</span>
            </span>
          </NextLink>
          <h1 className="text-2xl font-extrabold text-[#193223]">Forgot Password?</h1>
          <p className="text-xs sm:text-sm text-stone-500 mt-1">
            Enter your email to receive a newly generated password.
          </p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-3xl border border-stone-200/90 p-6 sm:p-8 shadow-sm">
          {successData ? (
            <div className="text-center space-y-5">
              <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-7 h-7" />
              </div>

              <div>
                <h2 className="text-xl font-bold text-[#163824]">Check your inbox</h2>
                <p className="text-xs sm:text-sm text-stone-600 mt-1.5 leading-relaxed">
                  {successData.message}
                </p>
              </div>

              {successData.tempPassword && (
                <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 text-left">
                  <div className="flex items-center justify-between text-xs font-bold text-stone-500 mb-1.5">
                    <span className="flex items-center gap-1.5">
                      <KeyRound className="w-3.5 h-3.5 text-[#5b9632]" />
                      Generated Password:
                    </span>
                    <button
                      type="button"
                      onClick={copyPassword}
                      className="inline-flex items-center gap-1 text-[#5b9632] hover:underline"
                    >
                      {copied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                      {copied ? 'Copied' : 'Copy'}
                    </button>
                  </div>
                  <div className="p-2.5 rounded-xl bg-white border border-stone-200 font-mono text-sm font-bold text-stone-800 text-center tracking-wider">
                    {successData.tempPassword}
                  </div>
                  <p className="text-[11px] text-stone-400 mt-2 text-center">
                    (Visible in development mode because email delivery is mocked)
                  </p>
                </div>
              )}

              <NextLink
                href="/login"
                className="w-full inline-flex items-center justify-center py-3 px-4 rounded-xl text-sm font-bold bg-[#143d26] text-white hover:bg-[#0f2e1d] shadow transition"
              >
                Sign In with New Password →
              </NextLink>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Your Account Email
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-stone-400 absolute left-3.5 top-3" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-[#5b9632] focus:border-[#5b9632]"
                    placeholder="e.g. rntando332@gmail.com"
                  />
                </div>
              </div>

              {error && (
                <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-800">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center py-3 px-4 rounded-xl text-sm font-bold bg-[#143d26] text-white hover:bg-[#0f2e1d] shadow transition disabled:opacity-50"
              >
                {loading ? 'Sending new password...' : 'Send New Password'}
              </button>

              <div className="text-center pt-2">
                <NextLink
                  href="/login"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-stone-500 hover:text-stone-800 transition"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  Back to Sign In
                </NextLink>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

