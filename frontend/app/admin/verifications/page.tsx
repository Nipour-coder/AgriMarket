'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { 
  ArrowLeft, 
  Building2, 
  ShieldCheck, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  AlertOctagon, 
  FileText, 
  ExternalLink, 
  Send, 
  UserCheck, 
  MapPin, 
  Phone, 
  Mail, 
  BadgeCheck, 
  Eye, 
  FileCheck2,
  BellRing,
  HelpCircle,
  Filter,
  KeyRound
} from 'lucide-react';
import type { SellerApplication, VerificationDocument } from '@/data/mockVerifications';

type FilterTab = 'All' | 'Pending Verification' | 'Under Review' | 'Verified' | 'Rejected' | 'Suspended';

const PRESET_REJECTION_REASONS = [
  'CIPC registered company name does not match trading business name.',
  'Farm lease contract or proof of land tenure has expired.',
  'Missing accredited food safety certification (GlobalG.A.P / SABS) for export crop category.',
  'SARS Tax Compliance PIN expired or returned non-compliant status.',
  'Certified director ID copy was blurry or illegible. Please re-upload a clear scan.',
];

export default function AdminVerificationsPage() {
  const [applications, setApplications] = useState<SellerApplication[]>([]);
  const [selectedTab, setSelectedTab] = useState<FilterTab>('All');
  const [activeApp, setActiveApp] = useState<SellerApplication | null>(null);
  const [reasons, setReasons] = useState<Record<string, string>>({});
  const [selectedDoc, setSelectedDoc] = useState<VerificationDocument | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState<string | null>(null);

  // Load verification queue
  const loadQueue = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/verifications', { cache: 'no-store' });
      const result = await response.json() as SellerApplication[] | { error?: string };
      if (!response.ok || !Array.isArray(result)) {
        throw new Error('error' in result ? result.error : 'Unable to load seller applications.');
      }
      setApplications(result);
      setError('');
    } catch (issue) {
      setError(issue instanceof Error ? issue.message : 'Unable to load seller applications.');
    } finally {
      setLoaded(true);
    }
  }, []);

  useEffect(() => {
    void loadQueue();
  }, [loadQueue]);

  // Handle status decisions: Under Review, Verified, Rejected, Suspended
  const decide = async (
    application: SellerApplication,
    status: 'Under Review' | 'Verified' | 'Rejected' | 'Suspended' | 'Pending Verification'
  ) => {
    const reason = reasons[application.userId]?.trim();
    if ((status === 'Rejected' || status === 'Suspended') && !reason) {
      setError(`Please provide a reason before marking this seller as ${status}.`);
      return;
    }

    setBusy(application.userId);
    setError('');
    setNotice('');

    try {
      const response = await fetch(`/api/admin/verifications/${application.userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, reason: reason || null }),
      });

      const result = await response.json() as { error?: string; message?: string };
      if (!response.ok) {
        throw new Error(result.error ?? 'Unable to update the application.');
      }

      setNotice(result.message || `Seller application status updated to: ${status}. Notification dispatched.`);
      setReasons((current) => ({ ...current, [application.userId]: '' }));
      await loadQueue();
    } catch (issue) {
      setError(issue instanceof Error ? issue.message : 'Unable to update the application.');
    } finally {
      setBusy(null);
    }
  };

  // Filter applications by tab
  const filteredApps = applications.filter((app) => {
    if (selectedTab === 'All') return true;
    return app.status === selectedTab;
  });

  // Calculate status counts
  const counts = {
    all: applications.length,
    pending: applications.filter((a) => a.status === 'Pending Verification').length,
    review: applications.filter((a) => a.status === 'Under Review').length,
    verified: applications.filter((a) => a.status === 'Verified').length,
    rejected: applications.filter((a) => a.status === 'Rejected').length,
    suspended: applications.filter((a) => a.status === 'Suspended').length,
  };

  if (!loaded) {
    return (
      <div className="mx-auto max-w-6xl px-5 py-24 text-center text-sm text-stone-500">
        <Clock className="w-8 h-8 mx-auto text-emerald-600 animate-spin mb-3" />
        Loading AgriMarket seller verification portal...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8faf6] pb-24">
      {/* Top Admin Header */}
      <div className="bg-[#113521] text-white border-b border-emerald-900/40">
        <div className="mx-auto max-w-7xl px-5 py-8">
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
                ADMINISTRATOR ACCREDITATION PORTAL
              </div>
              <h1 className="mt-2 text-3xl font-extrabold tracking-tight">
                Seller Verification Queue
              </h1>
              <p className="mt-1 text-sm text-emerald-100/80">
                Review uploaded KYC documents, inspect CIPC registration legitimacy, approve or reject applications, and manage verification badges.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <Link
                href="/admin/security"
                className="flex items-center gap-1.5 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/20 px-3.5 py-2 text-xs font-semibold backdrop-blur-sm transition text-white"
              >
                <KeyRound size={14} className="text-[#a8e063]" />
                <span>Change Password</span>
              </Link>
              <span className="flex items-center gap-1.5 rounded-2xl bg-white/10 px-4 py-2.5 text-xs font-semibold backdrop-blur-sm">
                <Clock size={16} className="text-amber-400" />
                <strong>{counts.pending}</strong> Pending Review
              </span>
              <span className="flex items-center gap-1.5 rounded-2xl bg-white/10 px-4 py-2.5 text-xs font-semibold backdrop-blur-sm">
                <BadgeCheck size={16} className="text-[#a8e063]" />
                <strong>{counts.verified}</strong> Verified Sellers
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-5 py-8">
        {/* Verification Process Workflow Guide */}
        <div className="mb-8 rounded-3xl bg-white border border-emerald-950/10 p-6 shadow-sm">
          <h2 className="text-xs font-bold uppercase tracking-[.18em] text-[#4d7c2a] flex items-center gap-2">
            <HelpCircle size={15} /> Standard Administrator Verification Process
          </h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-5 text-xs">
            <div className="p-3.5 rounded-2xl bg-stone-50 border border-stone-200/80">
              <span className="font-bold text-[#143d26] block mb-1">1. Receive Application</span>
              <p className="text-stone-500 leading-relaxed">Seller submits registered business name, CIPC number, farm address, and sector.</p>
            </div>
            <div className="p-3.5 rounded-2xl bg-stone-50 border border-stone-200/80">
              <span className="font-bold text-[#143d26] block mb-1">2. Review Documents</span>
              <p className="text-stone-500 leading-relaxed">Inspect CIPC certificate, proof of address, tax clearance PIN, and representative ID.</p>
            </div>
            <div className="p-3.5 rounded-2xl bg-stone-50 border border-stone-200/80">
              <span className="font-bold text-[#143d26] block mb-1">3. Check Legitimacy</span>
              <p className="text-stone-500 leading-relaxed">Cross-check company registration number against BizPortal/CIPC registers.</p>
            </div>
            <div className="p-3.5 rounded-2xl bg-stone-50 border border-stone-200/80">
              <span className="font-bold text-[#143d26] block mb-1">4. Approve or Reject</span>
              <p className="text-stone-500 leading-relaxed">Approve to grant official badge, or reject with a clear reason explaining missing items.</p>
            </div>
            <div className="p-3.5 rounded-2xl bg-stone-50 border border-stone-200/80">
              <span className="font-bold text-[#143d26] block mb-1">5. Seller Notification</span>
              <p className="text-stone-500 leading-relaxed">System dispatches automated notification to seller&apos;s dashboard and email.</p>
            </div>
          </div>
        </div>

        {/* Status Notice Alerts */}
        {notice && (
          <div className="mb-6 rounded-2xl border border-emerald-300 bg-emerald-50 p-4 text-sm text-emerald-900 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <CheckCircle2 size={18} className="text-emerald-700 shrink-0" />
              <span>{notice}</span>
            </div>
            <button onClick={() => setNotice('')} className="text-xs font-bold text-emerald-700 hover:underline">
              Dismiss
            </button>
          </div>
        )}

        {error && (
          <div className="mb-6 rounded-2xl border border-red-300 bg-red-50 p-4 text-sm text-red-900 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <AlertOctagon size={18} className="text-red-700 shrink-0" />
              <span>{error}</span>
            </div>
            <button onClick={() => setError('')} className="text-xs font-bold text-red-700 hover:underline">
              Dismiss
            </button>
          </div>
        )}

        {/* Filter Tabs by Seller Status */}
        <div className="flex flex-wrap items-center gap-2 mb-6 border-b border-stone-200 pb-4">
          <span className="text-xs font-bold text-stone-500 flex items-center gap-1.5 mr-2">
            <Filter size={14} /> Filter by Status:
          </span>
          {(['All', 'Pending Verification', 'Under Review', 'Verified', 'Rejected', 'Suspended'] as FilterTab[]).map((tab) => {
            const count = 
              tab === 'All' ? counts.all :
              tab === 'Pending Verification' ? counts.pending :
              tab === 'Under Review' ? counts.review :
              tab === 'Verified' ? counts.verified :
              tab === 'Rejected' ? counts.rejected : counts.suspended;

            return (
              <button
                key={tab}
                type="button"
                onClick={() => setSelectedTab(tab)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
                  selectedTab === tab
                    ? 'bg-[#143d26] text-white shadow-sm'
                    : 'bg-white border border-stone-200 text-stone-700 hover:bg-stone-50'
                }`}
              >
                <span>{tab}</span>
                <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${
                  selectedTab === tab ? 'bg-white/20 text-white' : 'bg-stone-100 text-stone-600'
                }`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Applications List */}
        {!filteredApps.length ? (
          <div className="rounded-3xl border border-dashed border-stone-300 bg-white p-12 text-center">
            <Building2 className="mx-auto text-stone-300 mb-3" size={40} />
            <h3 className="text-base font-extrabold text-[#143d26]">No applications in this category</h3>
            <p className="mt-1 text-xs text-stone-500">
              Switch filter to &quot;All&quot; or review newly submitted producer applications.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {filteredApps.map((application) => {
              const isVerified = application.status === 'Verified';
              const isPending = application.status === 'Pending Verification';
              const isUnderReview = application.status === 'Under Review';
              const isRejected = application.status === 'Rejected';
              const isSuspended = application.status === 'Suspended';

              return (
                <article 
                  key={application.userId}
                  className={`rounded-3xl border bg-white p-6 sm:p-7 shadow-sm transition hover:shadow-md ${
                    isVerified 
                      ? 'border-emerald-300/80 bg-emerald-50/10' 
                      : isRejected
                        ? 'border-red-200/80'
                        : isSuspended
                          ? 'border-stone-300 bg-stone-50/50'
                          : 'border-stone-200'
                  }`}
                >
                  <div className="grid gap-6 lg:grid-cols-[1.1fr_360px]">
                    {/* Left: Producer & Document Details */}
                    <div>
                      {/* Top Header of Card */}
                      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-stone-100 pb-4">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-stone-400">
                              Submitted {new Date(application.submittedAt).toLocaleDateString('en-ZA', { dateStyle: 'medium' })}
                            </span>
                            {application.reviewedAt && (
                              <span className="text-xs text-stone-400">
                                · Reviewed {new Date(application.reviewedAt).toLocaleDateString('en-ZA', { dateStyle: 'medium' })}
                              </span>
                            )}
                          </div>
                          
                          <div className="mt-1 flex flex-wrap items-center gap-2.5">
                            <h2 className="text-xl font-extrabold text-[#112d1c]">
                              {application.businessName}
                            </h2>

                            {/* Verification Badge (Only for approved sellers) */}
                            {application.hasOfficialBadge ? (
                              <span className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-emerald-600 to-green-700 px-3 py-1 text-xs font-extrabold text-white shadow-sm">
                                <BadgeCheck size={14} className="text-yellow-300" />
                                Official AgriMarket Verified
                              </span>
                            ) : (
                              <span className="text-xs text-stone-400 italic">
                                (No verification badge awarded)
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Status Pill */}
                        <div>
                          <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold ${
                            isVerified 
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                              : isPending
                                ? 'bg-amber-100 text-amber-900 border border-amber-300'
                                : isUnderReview
                                  ? 'bg-blue-100 text-blue-900 border border-blue-300'
                                  : isRejected
                                    ? 'bg-red-100 text-red-900 border border-red-300'
                                    : 'bg-stone-200 text-stone-800 border border-stone-300'
                          }`}>
                            {isVerified && <CheckCircle2 size={14} className="text-emerald-700" />}
                            {isPending && <Clock size={14} className="text-amber-700" />}
                            {isUnderReview && <Eye size={14} className="text-blue-700" />}
                            {isRejected && <XCircle size={14} className="text-red-700" />}
                            {isSuspended && <AlertOctagon size={14} className="text-stone-700" />}
                            {application.status}
                          </span>
                        </div>
                      </div>

                      {/* Business Information Fields */}
                      <div className="mt-4 grid gap-3 sm:grid-cols-2 text-xs">
                        <div className="p-3 rounded-xl bg-stone-50 border border-stone-100">
                          <span className="text-[11px] font-bold text-stone-400 block mb-0.5">Authorised Representative</span>
                          <span className="font-semibold text-stone-800">{application.contactName} ({application.representativeRole})</span>
                        </div>

                        <div className="p-3 rounded-xl bg-stone-50 border border-stone-100">
                          <span className="text-[11px] font-bold text-stone-400 block mb-0.5">Company Registration & Tax</span>
                          <span className="font-semibold text-stone-800 font-mono">
                            {application.registrationNumber || 'Not provided'} · Tax: {application.taxNumber || 'N/A'}
                          </span>
                        </div>

                        <div className="p-3 rounded-xl bg-stone-50 border border-stone-100">
                          <span className="text-[11px] font-bold text-stone-400 block mb-0.5">Contact Details</span>
                          <span className="text-stone-800 flex items-center gap-2">
                            <Mail size={12} className="text-stone-400" /> {application.email} · <Phone size={12} className="text-stone-400" /> {application.phone}
                          </span>
                        </div>

                        <div className="p-3 rounded-xl bg-stone-50 border border-stone-100">
                          <span className="text-[11px] font-bold text-stone-400 block mb-0.5">Farm Location & Scale</span>
                          <span className="text-stone-800">
                            {application.province} ({application.farmSize || 'Smallholder'}) · {application.primarySector}
                          </span>
                        </div>
                      </div>

                      {/* Physical Farm Address */}
                      <div className="mt-3 flex items-center gap-1.5 text-xs text-stone-600 bg-stone-50/80 px-3 py-2 rounded-xl">
                        <MapPin size={14} className="text-emerald-700 shrink-0" />
                        <span><strong>Physical Farm Address:</strong> {application.farmAddress}</span>
                      </div>

                      {/* Uploaded Documents Review Section */}
                      <div className="mt-5">
                        <h3 className="text-xs font-bold uppercase tracking-wider text-stone-700 mb-2.5 flex items-center justify-between">
                          <span className="flex items-center gap-1.5">
                            <FileCheck2 size={15} className="text-emerald-700" />
                            Uploaded KYC & Compliance Documents ({application.documents?.length || 0})
                          </span>
                          <span className="text-[11px] text-stone-400 lowercase font-normal">Click document to review</span>
                        </h3>

                        {(!application.documents || application.documents.length === 0) ? (
                          <p className="text-xs text-stone-400 italic bg-stone-50 p-3 rounded-xl">
                            No documents attached to this application yet.
                          </p>
                        ) : (
                          <div className="grid gap-2 sm:grid-cols-2">
                            {application.documents.map((doc) => (
                              <div
                                key={doc.id}
                                onClick={() => setSelectedDoc(doc)}
                                className="group cursor-pointer rounded-2xl border border-stone-200 bg-white p-3 hover:border-emerald-500 hover:bg-emerald-50/30 transition flex items-center justify-between"
                              >
                                <div className="flex items-center gap-2.5 min-w-0">
                                  <div className="w-8 h-8 rounded-xl bg-emerald-100/70 text-emerald-800 flex items-center justify-center shrink-0">
                                    <FileText size={16} />
                                  </div>
                                  <div className="truncate">
                                    <p className="text-xs font-bold text-stone-800 truncate group-hover:text-emerald-800">
                                      {doc.name}
                                    </p>
                                    <p className="text-[10px] text-stone-400">
                                      {doc.fileName} · {doc.fileSize}
                                    </p>
                                  </div>
                                </div>
                                <span className="text-[10px] font-bold text-emerald-700 underline shrink-0 flex items-center gap-1">
                                  Inspect <ExternalLink size={11} />
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Legitimacy Checklist */}
                      <div className="mt-5 rounded-2xl bg-[#f0f5ec] border border-emerald-900/10 p-4">
                        <h4 className="text-xs font-bold text-[#143d26] uppercase tracking-wider mb-2">
                          Business Legitimacy Verification Checklist
                        </h4>
                        <div className="grid gap-2 sm:grid-cols-2 text-xs">
                          <label className="flex items-center gap-2 text-stone-700">
                            <input 
                              type="checkbox" 
                              defaultChecked={application.checklist?.cipcVerified} 
                              className="rounded text-emerald-700 focus:ring-emerald-500" 
                            />
                            <span>CIPC Company Registration matches BizPortal</span>
                          </label>
                          <label className="flex items-center gap-2 text-stone-700">
                            <input 
                              type="checkbox" 
                              defaultChecked={application.checklist?.taxCompliant} 
                              className="rounded text-emerald-700 focus:ring-emerald-500" 
                            />
                            <span>Active SARS Tax Clearance PIN</span>
                          </label>
                          <label className="flex items-center gap-2 text-stone-700">
                            <input 
                              type="checkbox" 
                              defaultChecked={application.checklist?.farmLocationInspected} 
                              className="rounded text-emerald-700 focus:ring-emerald-500" 
                            />
                            <span>Farm Coordinates Verified in Province</span>
                          </label>
                          <label className="flex items-center gap-2 text-stone-700">
                            <input 
                              type="checkbox" 
                              defaultChecked={application.checklist?.directorIdMatched} 
                              className="rounded text-emerald-700 focus:ring-emerald-500" 
                            />
                            <span>Authorised Director ID matched</span>
                          </label>
                        </div>
                      </div>

                      {/* Rejection / Suspension Notice Banner */}
                      {application.reason && (
                        <div className="mt-4 rounded-2xl border border-red-200 bg-red-50/70 p-3.5 text-xs text-red-950">
                          <span className="font-bold block mb-1 flex items-center gap-1.5 text-red-900">
                            <AlertOctagon size={14} /> Decision Reason Provided to Seller:
                          </span>
                          <p className="text-red-800 leading-relaxed">{application.reason}</p>
                        </div>
                      )}

                      {/* Recent Notifications Dispatched to Seller */}
                      {application.notificationsSent && application.notificationsSent.length > 0 && (
                        <div className="mt-4">
                          <span className="text-[11px] font-bold text-stone-400 uppercase tracking-wider block mb-1 flex items-center gap-1">
                            <BellRing size={12} className="text-emerald-700" /> Dispatched Seller Notifications ({application.notificationsSent.length})
                          </span>
                          <div className="space-y-1.5 max-h-24 overflow-y-auto">
                            {application.notificationsSent.map((n) => (
                              <div key={n.id} className="text-[11px] bg-stone-50 p-2 rounded-lg border border-stone-200/60 text-stone-600 flex items-start justify-between gap-2">
                                <span>{n.message}</span>
                                <span className="text-[9px] text-stone-400 shrink-0">
                                  {new Date(n.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Right: Action Decision Panel */}
                    <div className="h-fit rounded-3xl border border-stone-200 bg-stone-50/80 p-5">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-stone-700 mb-3 flex items-center gap-1.5">
                        <UserCheck size={16} className="text-emerald-700" />
                        Administrator Decision
                      </h3>

                      {/* Rejection Reason Textarea & Presets */}
                      <div className="mb-4">
                        <label className="block text-xs font-bold text-stone-700 mb-1">
                          Rejection or Suspension Reason:
                        </label>
                        <p className="text-[11px] text-stone-500 mb-2">
                          Required when rejecting or suspending. This reason is delivered directly to the seller&apos;s notification inbox.
                        </p>
                        
                        <textarea
                          rows={3}
                          value={reasons[application.userId] ?? ''}
                          onChange={(e) => setReasons((cur) => ({ ...cur, [application.userId]: e.target.value }))}
                          placeholder="Provide specific feedback on missing or invalid verification criteria..."
                          className="w-full rounded-2xl border border-stone-300 bg-white p-3 text-xs outline-none focus:border-[#4d7c2a] focus:ring-2 focus:ring-emerald-600/10"
                        />

                        {/* Preset Suggestions */}
                        <div className="mt-2">
                          <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block mb-1">
                            Quick Presets:
                          </span>
                          <div className="flex flex-wrap gap-1">
                            {PRESET_REJECTION_REASONS.map((preset, idx) => (
                              <button
                                key={idx}
                                type="button"
                                onClick={() => setReasons((cur) => ({ ...cur, [application.userId]: preset }))}
                                className="text-[10px] bg-white border border-stone-200 rounded-lg px-2 py-1 text-stone-600 hover:bg-emerald-50 hover:text-emerald-800 transition text-left"
                              >
                                Preset {idx + 1}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Decision Action Buttons */}
                      <div className="space-y-2 pt-2 border-t border-stone-200">
                        {/* 1. APPROVE APPLICATION (Awards Official Badge) */}
                        <button
                          type="button"
                          disabled={busy === application.userId}
                          onClick={() => void decide(application, 'Verified')}
                          className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-green-700 hover:from-emerald-700 hover:to-green-800 text-white font-extrabold text-xs shadow-md transition flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                          <BadgeCheck size={16} className="text-yellow-300" />
                          <span>Approve & Award Official Badge</span>
                        </button>

                        {/* 2. START / MOVE TO UNDER REVIEW */}
                        {application.status !== 'Under Review' && (
                          <button
                            type="button"
                            disabled={busy === application.userId}
                            onClick={() => void decide(application, 'Under Review')}
                            className="w-full py-2.5 px-4 rounded-xl bg-[#143d26] hover:bg-[#0c2919] text-white font-bold text-xs transition flex items-center justify-center gap-2 disabled:opacity-50"
                          >
                            <Eye size={15} />
                            <span>Mark as Under Review</span>
                          </button>
                        )}

                        {/* 3. REJECT APPLICATION */}
                        {application.status !== 'Rejected' && (
                          <button
                            type="button"
                            disabled={busy === application.userId}
                            onClick={() => void decide(application, 'Rejected')}
                            className="w-full py-2.5 px-4 rounded-xl border border-red-300 bg-white text-red-700 hover:bg-red-50 font-bold text-xs transition flex items-center justify-center gap-2 disabled:opacity-50"
                          >
                            <XCircle size={15} />
                            <span>Reject Application (Provide Reason)</span>
                          </button>
                        )}

                        {/* 4. SUSPEND SELLER */}
                        {application.status !== 'Suspended' && (
                          <button
                            type="button"
                            disabled={busy === application.userId}
                            onClick={() => void decide(application, 'Suspended')}
                            className="w-full py-2.5 px-4 rounded-xl border border-stone-300 bg-white text-stone-700 hover:bg-stone-100 font-bold text-xs transition flex items-center justify-center gap-2 disabled:opacity-50"
                          >
                            <AlertOctagon size={15} />
                            <span>Suspend Seller Account</span>
                          </button>
                        )}

                        {/* 5. RESET TO PENDING (FOR TESTING) */}
                        {application.status !== 'Pending Verification' && (
                          <button
                            type="button"
                            disabled={busy === application.userId}
                            onClick={() => void decide(application, 'Pending Verification')}
                            className="w-full py-2 px-3 text-[11px] text-stone-400 hover:text-stone-700 transition"
                          >
                            Reset to Pending Verification
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>

      {/* Document Inspection Modal */}
      {selectedDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-2xl rounded-3xl bg-white p-6 shadow-2xl border border-stone-200">
            <div className="flex items-center justify-between border-b border-stone-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
                  <FileText size={20} />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-[#112d1c]">{selectedDoc.name}</h3>
                  <p className="text-xs text-stone-400">{selectedDoc.type} · {selectedDoc.fileName} ({selectedDoc.fileSize})</p>
                </div>
              </div>
              <button 
                onClick={() => setSelectedDoc(null)}
                className="rounded-full bg-stone-100 p-2 text-stone-500 hover:bg-stone-200"
              >
                ✕
              </button>
            </div>

            {/* Simulated Document Viewer Canvas */}
            <div className="my-6 rounded-2xl border border-dashed border-stone-300 bg-stone-50 p-8 text-center">
              <FileCheck2 size={48} className="mx-auto text-emerald-700 mb-3" />
              <p className="text-sm font-bold text-stone-800">CIPC & Statutory Accreditation Document Preview</p>
              <p className="mt-1 text-xs text-stone-500 max-w-md mx-auto">
                File: <strong>{selectedDoc.fileName}</strong> uploaded on {selectedDoc.uploadedAt}. Cryptographic checksum valid; company registration number matches statutory records.
              </p>
              <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-800">
                <CheckCircle2 size={14} /> Document Verified Legible
              </div>
            </div>

            <div className="flex justify-end gap-3 border-t border-stone-100 pt-4">
              <button
                type="button"
                onClick={() => setSelectedDoc(null)}
                className="px-5 py-2.5 rounded-xl bg-[#143d26] text-white text-xs font-bold hover:bg-[#0c2919]"
              >
                Done Inspecting
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
