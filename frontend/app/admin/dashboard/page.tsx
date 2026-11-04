'use client';

import Link from 'next/link';
import { 
  ShieldCheck, 
  BadgeCheck, 
  AlertCircle, 
  ArrowRight, 
  Building2, 
  FileCheck2, 
  KeyRound,
  Lock
} from 'lucide-react';
import { getApplications } from '@/data/mockVerifications';

export default function AdminDashboardPage() {
  const applications = getApplications();
  const pendingCount = applications.filter((a) => a.status === 'Pending Verification').length;
  const underReviewCount = applications.filter((a) => a.status === 'Under Review').length;
  const verifiedCount = applications.filter((a) => a.status === 'Verified').length;
  const rejectedCount = applications.filter((a) => a.status === 'Rejected').length;
  const suspendedCount = applications.filter((a) => a.status === 'Suspended').length;

  return (
    <div className="min-h-screen bg-[#f8faf6] pb-24">
      {/* Admin Top Header */}
      <div className="bg-[#113521] text-white border-b border-emerald-900/40">
        <div className="mx-auto max-w-7xl px-5 py-10">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-emerald-950/80 border border-emerald-500/30 px-3 py-1 text-[11px] font-bold text-emerald-300">
                <ShieldCheck size={14} className="text-[#a8e063]" />
                PLATFORM ADMINISTRATION & MODERATION
              </div>
              <h1 className="mt-3 text-3xl font-extrabold sm:text-4xl">
                Administrator Command Center
              </h1>
              <p className="mt-2 max-w-2xl text-sm text-emerald-100/80">
                Oversee agricultural producer verifications, review statutory CIPC and land tenure documents, award verified badges, and manage account credentials.
              </p>
            </div>

            <Link
              href="/admin/security"
              className="inline-flex items-center gap-2 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 px-5 py-2.5 text-xs font-bold text-white transition backdrop-blur-sm"
            >
              <KeyRound size={14} className="text-[#a8e063]" />
              <span>Change Password</span>
            </Link>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-5 py-8">
        {/* Verification Queue Summary Card */}
        <div className="mb-8 rounded-[2rem] bg-gradient-to-br from-[#143d26] to-[#0c2a1a] p-6 sm:p-8 text-white shadow-xl flex flex-wrap items-center justify-between gap-6">
          <div className="max-w-xl">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#a8e063] mb-2">
              <FileCheck2 size={16} /> Action Required
            </div>
            <h2 className="text-2xl font-extrabold sm:text-3xl">
              {pendingCount + underReviewCount} Producer Applications Awaiting Verification
            </h2>
            <p className="mt-2 text-xs text-emerald-100/80 leading-relaxed">
              Review company registration numbers, physical farm locations, and uploaded proof of address to award the official AgriMarket verification badge.
            </p>
          </div>

          <Link
            href="/admin/verifications"
            className="inline-flex items-center gap-2 rounded-full bg-[#72b043] px-7 py-4 text-sm font-extrabold text-white shadow-lg shadow-black/20 hover:bg-[#5b9632] transition hover:scale-105 active:scale-95"
          >
            <span>Open Verification Queue</span>
            <ArrowRight size={17} />
          </Link>
        </div>

        {/* Status Metrics Cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5 mb-10">
          <div className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm">
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-600 block mb-1">
              Pending
            </span>
            <p className="text-3xl font-extrabold text-stone-900">{pendingCount}</p>
            <p className="mt-1 text-xs text-stone-500">Newly received</p>
          </div>

          <div className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm">
            <span className="text-[11px] font-bold uppercase tracking-wider text-blue-600 block mb-1">
              Under Review
            </span>
            <p className="text-3xl font-extrabold text-stone-900">{underReviewCount}</p>
            <p className="mt-1 text-xs text-stone-500">Documents being checked</p>
          </div>

          <div className="rounded-3xl border border-emerald-300 bg-emerald-50/50 p-5 shadow-sm">
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 block mb-1">
              Verified
            </span>
            <p className="text-3xl font-extrabold text-emerald-950">{verifiedCount}</p>
            <p className="mt-1 text-xs text-emerald-700/80">With official badge</p>
          </div>

          <div className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm">
            <span className="text-[11px] font-bold uppercase tracking-wider text-red-600 block mb-1">
              Rejected
            </span>
            <p className="text-3xl font-extrabold text-stone-900">{rejectedCount}</p>
            <p className="mt-1 text-xs text-stone-500">Reasons communicated</p>
          </div>

          <div className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm">
            <span className="text-[11px] font-bold uppercase tracking-wider text-stone-500 block mb-1">
              Suspended
            </span>
            <p className="text-3xl font-extrabold text-stone-900">{suspendedCount}</p>
            <p className="mt-1 text-xs text-stone-500">Under compliance audit</p>
          </div>
        </div>

        {/* Quick Links Section */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <Link
            href="/admin/verifications"
            className="group rounded-3xl border border-stone-200 bg-white p-6 shadow-sm hover:border-emerald-600 hover:shadow-md transition"
          >
            <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center mb-4 group-hover:scale-110 transition">
              <BadgeCheck size={24} />
            </div>
            <h3 className="text-lg font-extrabold text-[#112d1c] group-hover:text-emerald-800">
              Seller Verification Queue →
            </h3>
            <p className="mt-2 text-xs text-stone-500 leading-relaxed">
              Review CIPC certificates, title deeds, and food safety accreditations to approve or reject sellers.
            </p>
          </Link>

          <Link
            href="/admin/security"
            className="group rounded-3xl border border-stone-200 bg-white p-6 shadow-sm hover:border-emerald-600 hover:shadow-md transition"
          >
            <div className="w-12 h-12 rounded-2xl bg-emerald-100/70 text-emerald-800 flex items-center justify-center mb-4 group-hover:scale-110 transition">
              <Lock size={24} />
            </div>
            <h3 className="text-lg font-extrabold text-[#112d1c] group-hover:text-emerald-800">
              Admin Password & Security →
            </h3>
            <p className="mt-2 text-xs text-stone-500 leading-relaxed">
              Change administrator password and update security credentials on Neon PostgreSQL.
            </p>
          </Link>

          <Link
            href="/admin/disputes"
            className="group rounded-3xl border border-stone-200 bg-white p-6 shadow-sm hover:border-emerald-600 hover:shadow-md transition"
          >
            <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center mb-4 group-hover:scale-110 transition">
              <AlertCircle size={24} />
            </div>
            <h3 className="text-lg font-extrabold text-[#112d1c] group-hover:text-amber-800">
              Dispute Resolution Queue →
            </h3>
            <p className="mt-2 text-xs text-stone-500 leading-relaxed">
              Moderate complaints between commercial buyers and sellers regarding non-delivery or quality.
            </p>
          </Link>

          <Link
            href="/shop"
            className="group rounded-3xl border border-stone-200 bg-white p-6 shadow-sm hover:border-emerald-600 hover:shadow-md transition"
          >
            <div className="w-12 h-12 rounded-2xl bg-stone-100 text-stone-800 flex items-center justify-center mb-4 group-hover:scale-110 transition">
              <Building2 size={24} />
            </div>
            <h3 className="text-lg font-extrabold text-[#112d1c] group-hover:text-stone-900">
              Marketplace Public View →
            </h3>
            <p className="mt-2 text-xs text-stone-500 leading-relaxed">
              Inspect how verified badges and active listings are displayed to buyers across South Africa.
            </p>
          </Link>
        </div>
      </div>
    </div>
  );
}
