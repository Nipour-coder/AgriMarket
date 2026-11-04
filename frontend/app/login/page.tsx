'use client';

import React, { useState, useEffect, Suspense } from 'react';
import NextLink from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { 
  Sprout, 
  Lock, 
  Mail, 
  ArrowRight,
  ShieldCheck,
  Tractor,
  ShoppingBag,
  Info
} from 'lucide-react';

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-stone-50 flex items-center justify-center text-sm text-stone-500">Loading sign in...</div>}>
      <LoginFormContent />
    </Suspense>
  );
}

function LoginFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectParam = searchParams.get('redirect');
  const roleParam = searchParams.get('role');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [selectedRole, setSelectedRole] = useState<'admin' | 'seller' | 'buyer'>('admin');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  useEffect(() => {
    if (roleParam === 'admin') {
      setSelectedRole('admin');
      setEmail('admin@agrimarket.co.za');
      setPassword('admin123');
    } else if (roleParam === 'seller') {
      setSelectedRole('seller');
      setEmail('seller@valleygreen.co.za');
      setPassword('seller123');
    } else if (roleParam === 'buyer') {
      setSelectedRole('buyer');
      setEmail('buyer@freshmark.co.za');
      setPassword('buyer123');
    } else {
      // Default to admin for fast testing of verification queue
      setEmail('admin@agrimarket.co.za');
      setPassword('admin123');
    }
  }, [roleParam]);

  const selectRoleDemo = (role: 'admin' | 'seller' | 'buyer') => {
    setSelectedRole(role);
    setError('');
    if (role === 'admin') {
      setEmail('admin@agrimarket.co.za');
      setPassword('admin123');
    } else if (role === 'seller') {
      setEmail('seller@valleygreen.co.za');
      setPassword('seller123');
    } else {
      setEmail('buyer@freshmark.co.za');
      setPassword('buyer123');
    }
  };

  const handleLoginSubmit = async (e?: React.FormEvent, directRole?: 'admin' | 'seller' | 'buyer') => {
    if (e) e.preventDefault();
    setLoading(true);
    setError('');
    setNotice('');

    const loginRole = directRole || selectedRole;
    const loginEmail = directRole === 'admin' 
      ? 'admin@agrimarket.co.za' 
      : directRole === 'seller' 
        ? 'seller@valleygreen.co.za' 
        : email;

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email: loginEmail, 
          password: password || 'demo123',
          role: loginRole 
        }),
      });

      const result = await response.json() as { user?: { role: string }; error?: string };
      if (!response.ok || !result.user) {
        throw new Error(result.error ?? 'Unable to sign in. Please try again.');
      }

      window.dispatchEvent(new Event('agrimarket:auth'));
      setNotice(`Signed in as ${result.user.role.toUpperCase()}. Redirecting...`);

      // Determine destination
      let destination = redirectParam;
      if (!destination) {
        if (result.user.role === 'admin') {
          destination = '/admin/verifications';
        } else if (result.user.role === 'seller') {
          destination = '/seller/dashboard';
        } else {
          destination = '/buyer/dashboard';
        }
      }

      setTimeout(() => {
        setLoading(false);
        router.push(destination as string);
        router.refresh();
      }, 300);
    } catch (issue) {
      setError(issue instanceof Error ? issue.message : 'Unable to sign in. Please try again.');
      setLoading(false);
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
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#112d1c]">
            Sign In to AgriMarket
          </h1>
          <p className="text-xs text-stone-500 mt-1.5">
            Log in to manage producer verifications, products, and commercial trades.
          </p>
        </div>

        {/* 1-Click Role Switcher */}
        <div className="mb-4 bg-white rounded-2xl border border-emerald-950/10 p-2 shadow-sm">
          <p className="text-[11px] font-bold text-stone-400 uppercase tracking-wider text-center mb-2">
            Select Role to Test
          </p>
          <div className="grid grid-cols-3 gap-1.5">
            <button
              type="button"
              onClick={() => selectRoleDemo('admin')}
              className={`flex flex-col items-center justify-center py-2.5 px-2 rounded-xl text-xs font-bold transition ${
                selectedRole === 'admin'
                  ? 'bg-[#143d26] text-white shadow-sm'
                  : 'bg-stone-50 text-stone-600 hover:bg-stone-100'
              }`}
            >
              <ShieldCheck size={16} className={selectedRole === 'admin' ? 'text-[#a8e063] mb-1' : 'text-stone-400 mb-1'} />
              <span>Admin</span>
            </button>

            <button
              type="button"
              onClick={() => selectRoleDemo('seller')}
              className={`flex flex-col items-center justify-center py-2.5 px-2 rounded-xl text-xs font-bold transition ${
                selectedRole === 'seller'
                  ? 'bg-[#143d26] text-white shadow-sm'
                  : 'bg-stone-50 text-stone-600 hover:bg-stone-100'
              }`}
            >
              <Tractor size={16} className={selectedRole === 'seller' ? 'text-[#a8e063] mb-1' : 'text-stone-400 mb-1'} />
              <span>Seller</span>
            </button>

            <button
              type="button"
              onClick={() => selectRoleDemo('buyer')}
              className={`flex flex-col items-center justify-center py-2.5 px-2 rounded-xl text-xs font-bold transition ${
                selectedRole === 'buyer'
                  ? 'bg-[#143d26] text-white shadow-sm'
                  : 'bg-stone-50 text-stone-600 hover:bg-stone-100'
              }`}
            >
              <ShoppingBag size={16} className={selectedRole === 'buyer' ? 'text-[#a8e063] mb-1' : 'text-stone-400 mb-1'} />
              <span>Buyer</span>
            </button>
          </div>
        </div>

        {/* Login Form Card */}
        <div className="bg-white rounded-3xl border border-stone-200/90 p-6 sm:p-8 shadow-sm">
          {selectedRole === 'admin' && (
            <div className="mb-5 flex items-start gap-2.5 rounded-2xl bg-emerald-50 border border-emerald-200/60 p-3.5 text-xs text-emerald-950">
              <ShieldCheck size={18} className="text-emerald-700 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-emerald-900">Administrator Access</p>
                <p className="mt-0.5 text-emerald-800/80 leading-relaxed">
                  Signing in as Administrator gives you access to the <strong>Seller Verification Queue</strong>, document reviews, and platform moderation.
                </p>
              </div>
            </div>
          )}

          <form onSubmit={(e) => handleLoginSubmit(e)} className="space-y-4">
            {/* Email Field */}
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Account Email
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-stone-400 absolute left-3.5 top-3" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-[#5b9632] focus:border-[#5b9632]"
                  placeholder="admin@agrimarket.co.za"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-stone-700">
                  Password
                </label>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-stone-400 absolute left-3.5 top-3" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-[#5b9632] focus:border-[#5b9632]"
                  placeholder="••••••••"
                />
              </div>
            </div>

            {error && (
              <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-800">
                {error}
              </p>
            )}

            {notice && (
              <p role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-900 font-semibold">
                {notice}
              </p>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 px-4 rounded-xl bg-[#143d26] hover:bg-[#0d2a1a] text-white font-bold text-sm shadow-md hover:shadow-lg transition flex items-center justify-center gap-2 disabled:opacity-70 active:scale-[0.99]"
            >
              {loading ? (
                <span>Signing in...</span>
              ) : (
                <>
                  <span>Sign In as {selectedRole.toUpperCase()}</span>
                  <ArrowRight className="w-4 h-4 text-[#a8e063]" />
                </>
              )}
            </button>
          </form>

          {/* Demonstration Notice */}
          <div className="mt-5 p-3 rounded-xl bg-stone-50 border border-stone-200/80 text-[11px] text-stone-500 leading-normal flex items-start gap-2">
            <Info size={14} className="shrink-0 mt-0.5 text-stone-400" />
            <span>
              Demonstration session mode is enabled. Authentication connects to the central API service and allows seamless testing across all roles.
            </span>
          </div>

          {/* Registration link */}
          <div className="mt-5 pt-4 border-t border-stone-100 text-center text-xs text-stone-500">
            Need a new seller account?{' '}
            <NextLink
              href="/register"
              className="text-[#457c2a] font-bold hover:underline"
            >
              Register here
            </NextLink>
          </div>
        </div>
      </div>
    </div>
  );
}
