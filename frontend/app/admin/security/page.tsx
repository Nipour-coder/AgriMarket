'use client';

import React, { useState } from 'react';
import { apiFetch } from '@/lib/apiFetch';
import Link from 'next/link';
import { 
  ArrowLeft, 
  ShieldCheck, 
  Lock, 
  KeyRound, 
  CheckCircle2, 
  AlertCircle, 
  Eye, 
  EyeOff, 
  ArrowRight,
  Server,
  UserCheck
} from 'lucide-react';

export default function AdminSecurityPage() {
  const [email] = useState('admin@agrimarket.co.za');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setNotice('');

    if (newPassword.length < 6) {
      setError('New password must be at least 6 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('The new password and confirmation password do not match.');
      return;
    }

    if (currentPassword === newPassword) {
      setError('New password must be different from your current password.');
      return;
    }

    setLoading(true);

    try {
      const response = await apiFetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          currentPassword,
          newPassword,
        }),
      });

      const result = await response.json() as { success?: boolean; message?: string; error?: string };

      if (!response.ok || !result.success) {
        throw new Error(result.error ?? 'Failed to update password.');
      }

      setNotice(result.message || 'Password successfully updated and saved in Neon PostgreSQL!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to update password. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8faf6] pb-24">
      {/* Top Admin Header */}
      <div className="bg-[#113521] text-white border-b border-emerald-900/40">
        <div className="mx-auto max-w-5xl px-5 py-8">
          <Link 
            href="/admin/dashboard" 
            className="inline-flex items-center gap-2 text-xs font-bold text-emerald-300 hover:text-white mb-3"
          >
            <ArrowLeft size={15} /> Back to Admin Overview
          </Link>

          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-emerald-950/80 border border-emerald-500/30 px-3 py-1 text-[11px] font-bold text-emerald-300">
                <ShieldCheck size={14} className="text-[#a8e063]" />
                ADMINISTRATOR SECURITY & CREDENTIALS
              </div>
              <h1 className="mt-2 text-3xl font-extrabold tracking-tight">
                Change Administrator Password
              </h1>
              <p className="mt-1 text-sm text-emerald-100/80">
                Update statutory credentials directly in your Neon PostgreSQL database.
              </p>
            </div>

            <div className="flex items-center gap-2 rounded-2xl bg-white/10 px-4 py-2 text-xs font-semibold backdrop-blur-sm">
              <Server size={15} className="text-[#a8e063]" />
              <span>Neon PostgreSQL Connected</span>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-5 py-10">
        <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
          {/* Main Password Change Form */}
          <div className="rounded-3xl border border-stone-200 bg-white p-7 sm:p-9 shadow-sm">
            <div className="mb-6 border-b border-stone-100 pb-4">
              <h2 className="text-lg font-extrabold text-[#112d1c] flex items-center gap-2">
                <KeyRound size={20} className="text-[#4d7c2a]" />
                Update Security Credentials
              </h2>
              <p className="text-xs text-stone-500 mt-1">
                Your new password will be hashed with bcrypt and stored in the <code className="bg-stone-100 px-1.5 py-0.5 rounded text-emerald-800 font-mono">users</code> table on Neon.
              </p>
            </div>

            {notice && (
              <div className="mb-6 rounded-2xl border border-emerald-300 bg-emerald-50 p-4 text-xs font-semibold text-emerald-900 flex items-start justify-between gap-3">
                <div className="flex items-start gap-2.5">
                  <CheckCircle2 size={18} className="text-emerald-700 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold">{notice}</p>
                    <p className="mt-1 text-emerald-800 font-normal">
                      You can now use this new password next time you sign in.
                    </p>
                  </div>
                </div>
                <Link
                  href="/login"
                  className="rounded-xl bg-emerald-700 px-3 py-1.5 text-[11px] font-bold text-white hover:bg-emerald-800 transition shrink-0"
                >
                  Test Login
                </Link>
              </div>
            )}

            {error && (
              <div className="mb-6 rounded-2xl border border-red-300 bg-red-50 p-4 text-xs font-semibold text-red-900 flex items-start gap-2.5">
                <AlertCircle size={18} className="text-red-700 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleChangePassword} className="space-y-5">
              {/* Target Account Display */}
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Administrator Account
                </label>
                <div className="flex items-center gap-2 rounded-xl border border-stone-200 bg-stone-50/70 px-4 py-3 text-xs text-stone-600 font-medium">
                  <UserCheck size={16} className="text-emerald-700 shrink-0" />
                  <span>{email}</span>
                  <span className="ml-auto rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-extrabold text-emerald-800">
                    SUPER ADMIN
                  </span>
                </div>
              </div>

              {/* Current Password Field */}
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Current Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-stone-400 absolute left-3.5 top-3.5" />
                  <input
                    type={showCurrent ? 'text' : 'password'}
                    required
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Enter your current password (e.g. admin123)"
                    className="w-full pl-10 pr-10 py-3 text-sm rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-[#5b9632] focus:border-[#5b9632]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrent(!showCurrent)}
                    className="absolute right-3.5 top-3.5 text-stone-400 hover:text-stone-600"
                  >
                    {showCurrent ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* New Password Field */}
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  New Password
                </label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-stone-400 absolute left-3.5 top-3.5" />
                  <input
                    type={showNew ? 'text' : 'password'}
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new strong password (min 6 chars)"
                    className="w-full pl-10 pr-10 py-3 text-sm rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-[#5b9632] focus:border-[#5b9632]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNew(!showNew)}
                    className="absolute right-3.5 top-3.5 text-stone-400 hover:text-stone-600"
                  >
                    {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* Confirm New Password Field */}
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Confirm New Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-stone-400 absolute left-3.5 top-3.5" />
                  <input
                    type={showConfirm ? 'text' : 'password'}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-type new password to confirm"
                    className="w-full pl-10 pr-10 py-3 text-sm rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-[#5b9632] focus:border-[#5b9632]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm(!showConfirm)}
                    className="absolute right-3.5 top-3.5 text-stone-400 hover:text-stone-600"
                  >
                    {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 px-5 rounded-xl bg-[#143d26] hover:bg-[#0c2919] text-white font-bold text-sm shadow-md hover:shadow-lg transition flex items-center justify-center gap-2 disabled:opacity-60 active:scale-[0.99]"
              >
                {loading ? (
                  <span>Updating Neon Database...</span>
                ) : (
                  <>
                    <span>Save & Update Password</span>
                    <ArrowRight size={17} className="text-[#a8e063]" />
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Right Information & Guidelines Card */}
          <div className="space-y-5">
            <div className="rounded-3xl border border-stone-200 bg-white p-6 shadow-sm">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#4d7c2a] mb-3 flex items-center gap-1.5">
                <ShieldCheck size={16} /> Password Requirements
              </h3>
              <ul className="space-y-2.5 text-xs text-stone-600">
                <li className="flex items-start gap-2">
                  <CheckCircle2 size={14} className="text-emerald-700 shrink-0 mt-0.5" />
                  <span>Minimum 6 characters in length.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 size={14} className="text-emerald-700 shrink-0 mt-0.5" />
                  <span>Recommend including letters, numbers, and symbols.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 size={14} className="text-emerald-700 shrink-0 mt-0.5" />
                  <span>Encrypted with one-way salted bcrypt hashing before writing to Neon.</span>
                </li>
              </ul>
            </div>

            <div className="rounded-3xl bg-[#edf3e8] border border-emerald-900/10 p-6">
              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-800 block mb-1">
                Database Transparency
              </span>
              <p className="text-xs text-stone-600 leading-relaxed">
                When updated, the password in your Neon table <code className="bg-white/80 px-1 py-0.5 rounded font-mono text-emerald-900">users.password_hash</code> is immediately replaced. The previous password will no longer be accepted.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
