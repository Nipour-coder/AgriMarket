'use client';

import Link from 'next/link';
import { useEffect, useState, useRef } from 'react';
import { apiFetch } from '@/lib/apiFetch';
import {
  ArrowLeft,
  BadgeCheck,
  Building2,
  MapPin,
  Upload,
  FileText,
  FileCheck2,
  Trash2,
  ExternalLink,
  ShieldCheck,
  Loader2,
  CheckCircle2,
  Clock,
} from 'lucide-react';
import { PROVINCES_LIST } from '@/data/mockData';

type VerificationProfile = {
  businessName: string;
  representativeRole: string;
  registrationNumber: string | null;
  farmAddress: string;
  province: string;
  latitude: number | null;
  longitude: number | null;
  primarySector: string;
  farmSize: string | null;
  verificationStatus: 'Pending Verification' | 'Under Review' | 'Verified' | 'Rejected' | 'Suspended';
  verificationReason: string | null;
  documentChecklist?: {
    documents?: UploadedDoc[];
  };
};

type VerificationResponse = {
  profile: VerificationProfile;
  user: { name: string; email: string; phone: string };
};

export type UploadedDoc = {
  id: string;
  name: string;
  type: string;
  fileName: string;
  fileSize: string;
  uploadedAt: string;
  verified: boolean;
  fileUrl: string;
};

const DOCUMENT_TYPES = [
  { value: 'CIPC Registration', label: 'CIPC Registration (Company Certificate / COR14.3)' },
  { value: 'Proof of Farm Address', label: 'Proof of Farm Address (Lease, Utility Bill or Title Deed)' },
  { value: 'Representative ID', label: 'Representative ID (Certified ID or Passport)' },
  { value: 'SARS Tax Compliance', label: 'SARS Tax Compliance (Tax PIN or Clearance)' },
  { value: 'GAP / GlobalG.A.P Audit', label: 'GAP / Food Safety Audit Certificate' },
];

export default function SellerVerificationPage() {
  const [record, setRecord] = useState<VerificationResponse | null>(null);
  const [representativeName, setRepresentativeName] = useState('');
  const [representativeRole, setRepresentativeRole] = useState('');
  const [phone, setPhone] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [registrationNumber, setRegistrationNumber] = useState('');
  const [province, setProvince] = useState('Limpopo');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [businessAddress, setBusinessAddress] = useState('');
  const [primarySector, setPrimarySector] = useState('Fresh Vegetables');
  const [farmSize, setFarmSize] = useState('');
  const [documents, setDocuments] = useState<UploadedDoc[]>([]);

  // Document upload form state
  const [selectedDocType, setSelectedDocType] = useState(DOCUMENT_TYPES[0].value);
  const [docCustomName, setDocCustomName] = useState('');
  const [uploadingDoc, setUploadingDoc] = useState(false);
  const [docError, setDocError] = useState('');
  const docInputRef = useRef<HTMLInputElement>(null);

  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');

  const loadProfile = async () => {
    try {
      const response = await apiFetch('/api/seller/verification', { cache: 'no-store' });
      const result = await response.json() as VerificationResponse & { error?: string };
      if (!response.ok) throw new Error(result.error ?? 'Unable to load seller verification.');
      setRecord(result);
      setRepresentativeName(result.user.name);
      setPhone(result.user.phone);
      setBusinessName(result.profile.businessName);
      setRepresentativeRole(result.profile.representativeRole);
      setRegistrationNumber(result.profile.registrationNumber ?? '');
      setProvince(result.profile.province);
      setLatitude(result.profile.latitude === null ? '' : String(result.profile.latitude));
      setLongitude(result.profile.longitude === null ? '' : String(result.profile.longitude));
      setBusinessAddress(result.profile.farmAddress);
      setPrimarySector(result.profile.primarySector);
      setFarmSize(result.profile.farmSize ?? '');

      // Load uploaded documents
      const docs = result.profile.documentChecklist?.documents;
      if (Array.isArray(docs)) {
        setDocuments(docs);
      } else {
        // Also query dedicated documents endpoint
        const docsRes = await apiFetch('/api/seller/verification/documents', { cache: 'no-store' });
        if (docsRes.ok) {
          const docsData = await docsRes.json() as UploadedDoc[];
          if (Array.isArray(docsData)) setDocuments(docsData);
        }
      }

      setError('');
    } catch (issue) {
      setError(issue instanceof Error ? issue.message : 'Unable to load seller verification.');
    } finally {
      setLoaded(true);
    }
  };

  useEffect(() => { void loadProfile(); }, []);

  const handleDocumentFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingDoc(true);
    setDocError('');
    setNotice('');
    try {
      const formData = new FormData();
      formData.append('document', file);
      formData.append('type', selectedDocType);
      formData.append('name', docCustomName.trim() || `${selectedDocType} Document`);

      const res = await apiFetch('/api/upload/verification-document', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json() as { success?: boolean; documents?: UploadedDoc[]; error?: string };
      if (!res.ok || !data.documents) {
        throw new Error(data.error || 'Failed to upload verification document.');
      }

      setDocuments(data.documents);
      setDocCustomName('');
      setNotice('Verification document uploaded successfully.');
      if (docInputRef.current) docInputRef.current.value = '';
    } catch (err) {
      setDocError(err instanceof Error ? err.message : 'Unable to upload document.');
    } finally {
      setUploadingDoc(false);
    }
  };

  const handleRemoveDoc = async (docId: string) => {
    setError('');
    setNotice('');
    try {
      const res = await apiFetch(`/api/seller/verification/documents/${docId}`, {
        method: 'DELETE',
      });
      const data = await res.json() as { success?: boolean; documents?: UploadedDoc[]; error?: string };
      if (!res.ok || !data.documents) {
        throw new Error(data.error || 'Failed to remove document.');
      }
      setDocuments(data.documents);
      setNotice('Document removed.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to remove document.');
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    setNotice('');
    try {
      const response = await apiFetch('/api/seller/verification', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessName,
          representativeName,
          representativeRole,
          phone,
          registrationNumber,
          province,
          latitude: latitude ? Number(latitude) : null,
          longitude: longitude ? Number(longitude) : null,
          farmAddress: businessAddress,
          primarySector,
          farmSize,
        }),
      });
      const result = await response.json() as { profile?: VerificationProfile; error?: string };
      if (!response.ok || !result.profile) throw new Error(result.error ?? 'Unable to submit your application.');
      setRecord((current) => current ? { ...current, profile: result.profile! } : current);
      setNotice('Your business profile and documents have been submitted for administrator review.');
    } catch (issue) {
      setError(issue instanceof Error ? issue.message : 'Unable to submit your application.');
    } finally {
      setSaving(false);
    }
  };

  if (!loaded) return <div className="mx-auto max-w-4xl px-5 py-20 text-center text-sm text-stone-500">Loading verification application…</div>;
  if (error && !record) {
    return (
      <div className="mx-auto max-w-3xl px-5 py-16">
        <div role="alert" className="rounded-3xl border border-red-200 bg-red-50 p-7 text-sm text-red-900">
          {error}
          <p className="mt-3"><Link href="/login" className="font-bold underline">Sign in with a seller account</Link></p>
        </div>
      </div>
    );
  }
  if (!record) return null;

  const profile = record.profile;
  const locked = profile.verificationStatus === 'Verified' || profile.verificationStatus === 'Suspended';

  return (
    <div className="mx-auto max-w-5xl px-5 py-10 sm:py-14">
      <Link href="/seller/dashboard" className="inline-flex items-center gap-2 text-sm font-semibold text-[#426e45]">
        <ArrowLeft size={16} /> Seller dashboard
      </Link>

      <div className="mt-5 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[.15em] text-[#789456]">Seller portal · verification</p>
          <h1 className="mt-2 text-3xl font-extrabold text-[#20372a]">Business & KYC Verification</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-stone-600">
            Submit your statutory registration details and upload verification documents to receive the Verified Producer badge.
          </p>
        </div>
        <div className="inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-4 py-2 text-xs font-extrabold text-amber-900">
          <BadgeCheck size={15} />
          {profile.verificationStatus}
        </div>
      </div>

      {profile.verificationReason && (
        <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-900">
          <strong>Administrator note</strong>
          <p className="mt-1">{profile.verificationReason}</p>
        </div>
      )}

      {notice && <p role="status" className="mt-4 rounded-xl border border-green-200 bg-green-50 p-3 text-sm text-green-900">{notice}</p>}
      {error && <p role="alert" className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">{error}</p>}

      {/* DOCUMENT UPLOAD SECTION */}
      <section className="mt-7 rounded-3xl border border-stone-200 bg-white p-5 sm:p-8 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-stone-100 pb-4">
          <div>
            <h2 className="flex items-center gap-2 text-lg font-extrabold text-[#20372a]">
              <FileCheck2 size={20} className="text-[#789456]" />
              Verification Documents ({documents.length})
            </h2>
            <p className="text-xs text-stone-500 mt-1">
              Upload certified company registration, farm address proof, and agricultural accreditation files.
            </p>
          </div>
          <span className="text-xs font-semibold px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
            Secure Uploads Active
          </span>
        </div>

        {/* Upload Form Box */}
        {!locked && (
          <div className="mt-5 rounded-2xl bg-[#fbfdf9] border border-[#d6e5d1] p-5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#1e442c] mb-3">
              Upload New Document
            </h3>

            {docError && (
              <p className="mb-3 text-xs text-red-700 bg-red-50 border border-red-200 p-2.5 rounded-xl font-medium">
                {docError}
              </p>
            )}

            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Document Type *
                </label>
                <select
                  value={selectedDocType}
                  onChange={(e) => setSelectedDocType(e.target.value)}
                  disabled={uploadingDoc}
                  className="w-full rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm text-stone-800 focus:outline-none focus:ring-2 focus:ring-[#789456]"
                >
                  {DOCUMENT_TYPES.map((d) => (
                    <option key={d.value} value={d.value}>
                      {d.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Document Label / Title (Optional)
                </label>
                <input
                  type="text"
                  value={docCustomName}
                  onChange={(e) => setDocCustomName(e.target.value)}
                  disabled={uploadingDoc}
                  placeholder="e.g. 2024 CIPC Shareholder Certificate"
                  className="w-full rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm text-stone-800 focus:outline-none focus:ring-2 focus:ring-[#789456]"
                />
              </div>
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-3">
              <input
                type="file"
                ref={docInputRef}
                onChange={handleDocumentFileSelect}
                accept=".pdf,.png,.jpg,.jpeg,.webp,.doc,.docx"
                className="hidden"
              />
              <button
                type="button"
                disabled={uploadingDoc}
                onClick={() => docInputRef.current?.click()}
                className="inline-flex items-center gap-2 rounded-xl bg-[#1d4d32] px-4 py-2.5 text-xs font-bold text-white hover:bg-[#133723] transition disabled:opacity-50"
              >
                {uploadingDoc ? (
                  <>
                    <Loader2 size={15} className="animate-spin" />
                    Uploading Document…
                  </>
                ) : (
                  <>
                    <Upload size={15} />
                    Choose File & Upload
                  </>
                )}
              </button>
              <span className="text-[11px] text-stone-500">
                PDF, JPEG, PNG or DOCX up to 25MB
              </span>
            </div>
          </div>
        )}

        {/* Uploaded Documents List */}
        <div className="mt-6">
          <h3 className="text-xs font-bold text-stone-600 mb-3">
            Uploaded Files
          </h3>

          {documents.length === 0 ? (
            <div className="text-center py-8 rounded-2xl border border-dashed border-stone-200 bg-stone-50/50">
              <FileText className="w-9 h-9 text-stone-300 mx-auto mb-2" />
              <p className="text-xs font-bold text-stone-600">No verification documents uploaded yet.</p>
              <p className="text-[11px] text-stone-400 mt-0.5">Use the box above to attach your official documents.</p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {documents.map((doc) => (
                <div
                  key={doc.id}
                  className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-2xl border border-stone-200 bg-white hover:border-stone-300 transition"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-800 flex items-center justify-center shrink-0 font-bold text-xs border border-emerald-100">
                      {doc.fileName.toLowerCase().endsWith('.pdf') ? 'PDF' : <FileText size={18} />}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-xs font-bold text-stone-800">{doc.name}</p>
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-stone-100 text-stone-600">
                          {doc.type}
                        </span>
                      </div>
                      <p className="text-[11px] text-stone-400 mt-0.5">
                        {doc.fileName} · {doc.fileSize} · Uploaded {new Date(doc.uploadedAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <a
                      href={doc.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-stone-200 text-xs font-bold text-stone-700 hover:bg-stone-50 transition"
                    >
                      <ExternalLink size={12} />
                      View
                    </a>
                    {!locked && (
                      <button
                        type="button"
                        onClick={() => handleRemoveDoc(doc.id)}
                        className="p-1.5 rounded-lg text-stone-400 hover:text-red-600 hover:bg-red-50 transition"
                        title="Remove document"
                      >
                        <Trash2 size={15} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* BUSINESS DETAILS FORM */}
      <form onSubmit={handleSubmit} className="mt-6 space-y-6 rounded-3xl border border-stone-200 bg-white p-5 sm:p-8 shadow-sm">
        <section>
          <h2 className="flex items-center gap-2 text-lg font-extrabold text-[#20372a]">
            <Building2 size={19} className="text-[#789456]" />
            Business and representative
          </h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <Field label="Registered business or farm name" required value={businessName} setValue={setBusinessName} disabled={locked} />
            <Field label="Owner / authorised representative" required value={representativeName} setValue={setRepresentativeName} disabled={locked} />
            <Field label="Representative role / authority" required value={representativeRole} setValue={setRepresentativeRole} disabled={locked} placeholder="Owner, Director, authorised agent" />
            <Field label="Business registration number (where applicable)" value={registrationNumber} setValue={setRegistrationNumber} disabled={locked} />
            <Field label="Contact number" required value={phone} setValue={setPhone} disabled={locked} type="tel" />
            <div className="text-xs font-bold text-stone-600">
              Verified email address
              <input disabled value={record.user.email} className="mt-1.5 w-full rounded-xl border border-stone-200 bg-stone-50 px-3 py-2.5 text-sm font-normal text-stone-500" />
            </div>
          </div>
        </section>

        <section className="border-t border-stone-100 pt-6">
          <h2 className="flex items-center gap-2 text-lg font-extrabold text-[#20372a]">
            <MapPin size={19} className="text-[#789456]" />
            Farm or business location
          </h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <label className="text-xs font-bold text-stone-600">Province *
              <select required disabled={locked} value={province} onChange={(event) => setProvince(event.target.value)} className="mt-1.5 w-full rounded-xl border border-stone-200 bg-white px-3 py-2.5 text-sm font-normal text-stone-800 disabled:bg-stone-50">
                {PROVINCES_LIST.map((item) => <option key={item.id} value={item.name}>{item.name}</option>)}
              </select>
            </label>
            <Field label="Physical business / farm address" required value={businessAddress} setValue={setBusinessAddress} disabled={locked} />
            <Field label="Primary agricultural sector" required value={primarySector} setValue={setPrimarySector} disabled={locked} />
            <Field label="Production scale" value={farmSize} setValue={setFarmSize} disabled={locked} />
            <label className="text-xs font-bold text-stone-600">Farm latitude
              <input type="number" step="any" min="-90" max="90" value={latitude} onChange={(event) => setLatitude(event.target.value)} disabled={locked} className="mt-1.5 w-full rounded-xl border border-stone-200 px-3 py-2.5 text-sm font-normal text-stone-800 disabled:bg-stone-50" />
            </label>
            <label className="text-xs font-bold text-stone-600">Farm longitude
              <input type="number" step="any" min="-180" max="180" value={longitude} onChange={(event) => setLongitude(event.target.value)} disabled={locked} className="mt-1.5 w-full rounded-xl border border-stone-200 px-3 py-2.5 text-sm font-normal text-stone-800 disabled:bg-stone-50" />
            </label>
          </div>
        </section>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-stone-100 pt-5">
          <p className="max-w-xl text-xs leading-5 text-stone-500">
            Submitted details and documents are stored on your AgriMarket account for administrator verification.
          </p>
          {!locked && (
            <button type="submit" disabled={saving} className="inline-flex items-center gap-2 rounded-xl bg-[#1d4d32] px-6 py-3 text-sm font-bold text-white hover:bg-[#103b25] transition disabled:opacity-60 shadow">
              <Upload size={16} />
              {saving ? 'Submitting…' : 'Submit Application for Review'}
            </button>
          )}
        </div>
      </form>

      <div className="mt-5 flex items-center justify-between gap-3 rounded-2xl border border-stone-200 bg-white p-4 text-xs text-stone-600">
        <span>Current status: <strong className="text-amber-900">{profile.verificationStatus}</strong></span>
        <Link href="/seller/dashboard" className="font-bold text-[#426e45]">Return to dashboard</Link>
      </div>
    </div>
  );
}

function Field({
  label, value, setValue, required = false, disabled = false, type = 'text', placeholder,
}: {
  label: string;
  value: string;
  setValue: (value: string) => void;
  required?: boolean;
  disabled?: boolean;
  type?: string;
  placeholder?: string;
}) {
  return (
    <label className="text-xs font-bold text-stone-600">
      {label}{required ? ' *' : ''}
      <input
        required={required}
        type={type}
        disabled={disabled}
        value={value}
        placeholder={placeholder}
        onChange={(event) => setValue(event.target.value)}
        className="mt-1.5 w-full rounded-xl border border-stone-200 px-3 py-2.5 text-sm font-normal text-stone-800 disabled:bg-stone-50"
      />
    </label>
  );
}
