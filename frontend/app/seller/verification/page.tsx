'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { AlertTriangle, ArrowLeft, BadgeCheck, Building2, MapPin, Upload } from 'lucide-react';
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
};

type VerificationResponse = {
  profile: VerificationProfile;
  user: { name: string; email: string; phone: string };
};

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
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');

  const loadProfile = async () => {
    try {
      const response = await fetch('/api/seller/verification', { cache: 'no-store' });
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
      setError('');
    } catch (issue) {
      setError(issue instanceof Error ? issue.message : 'Unable to load seller verification.');
    } finally {
      setLoaded(true);
    }
  };

  useEffect(() => { void loadProfile(); }, []);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    setNotice('');
    try {
      const response = await fetch('/api/seller/verification', {
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
      setNotice('Your business profile has been submitted for administrator review.');
    } catch (issue) {
      setError(issue instanceof Error ? issue.message : 'Unable to submit your application.');
    } finally {
      setSaving(false);
    }
  };

  if (!loaded) return <div className="mx-auto max-w-4xl px-5 py-20 text-center text-sm text-stone-500">Loading verification application…</div>;
  if (error && !record) {
    return <div className="mx-auto max-w-3xl px-5 py-16"><div role="alert" className="rounded-3xl border border-red-200 bg-red-50 p-7 text-sm text-red-900">{error}<p className="mt-3"><Link href="/login" className="font-bold underline">Sign in with a seller account</Link></p></div></div>;
  }
  if (!record) return null;

  const profile = record.profile;
  const locked = profile.verificationStatus === 'Verified' || profile.verificationStatus === 'Suspended';
  return (
    <div className="mx-auto max-w-5xl px-5 py-10 sm:py-14">
      <Link href="/seller/dashboard" className="inline-flex items-center gap-2 text-sm font-semibold text-[#426e45]"><ArrowLeft size={16} /> Seller dashboard</Link>
      <div className="mt-5 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[.15em] text-[#789456]">Seller portal · verification</p>
          <h1 className="mt-2 text-3xl font-extrabold text-[#20372a]">Business verification</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-stone-600">Confirm your business, authorised representative, contact information and farm location.</p>
        </div>
        <div className="inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-4 py-2 text-xs font-extrabold text-amber-900"><BadgeCheck size={15} />{profile.verificationStatus}</div>
      </div>

      {profile.verificationReason && <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-900"><strong>Administrator note</strong><p className="mt-1">{profile.verificationReason}</p></div>}
      <div className="mt-5 flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-xs leading-5 text-amber-950">
        <AlertTriangle size={17} className="mt-0.5 shrink-0" />
        <p><strong>Document uploads are not enabled.</strong> Do not provide or select identity/business documents here. Secure storage and document review are not configured, so an administrator cannot approve seller accounts yet. This form stores business profile details only.</p>
      </div>
      {notice && <p role="status" className="mt-4 rounded-xl border border-green-200 bg-green-50 p-3 text-sm text-green-900">{notice}</p>}
      {error && <p role="alert" className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">{error}</p>}

      <form onSubmit={handleSubmit} className="mt-6 space-y-6 rounded-3xl border border-stone-200 bg-white p-5 sm:p-8">
        <section>
          <h2 className="flex items-center gap-2 text-lg font-extrabold text-[#20372a]"><Building2 size={19} className="text-[#789456]" /> Business and representative</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <Field label="Registered business or farm name" required value={businessName} setValue={setBusinessName} disabled={locked} />
            <Field label="Owner / authorised representative" required value={representativeName} setValue={setRepresentativeName} disabled={locked} />
            <Field label="Representative role / authority" required value={representativeRole} setValue={setRepresentativeRole} disabled={locked} placeholder="Owner, Director, authorised agent" />
            <Field label="Business registration number (where applicable)" value={registrationNumber} setValue={setRegistrationNumber} disabled={locked} />
            <Field label="Contact number" required value={phone} setValue={setPhone} disabled={locked} type="tel" />
            <div className="text-xs font-bold text-stone-600">Verified email address<input disabled value={record.user.email} className="mt-1.5 w-full rounded-xl border border-stone-200 bg-stone-50 px-3 py-2.5 text-sm font-normal text-stone-500" /></div>
          </div>
        </section>

        <section className="border-t border-stone-100 pt-6">
          <h2 className="flex items-center gap-2 text-lg font-extrabold text-[#20372a]"><MapPin size={19} className="text-[#789456]" /> Farm or business location</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <label className="text-xs font-bold text-stone-600">Province *
              <select required disabled={locked} value={province} onChange={(event) => setProvince(event.target.value)} className="mt-1.5 w-full rounded-xl border border-stone-200 bg-white px-3 py-2.5 text-sm font-normal text-stone-800 disabled:bg-stone-50">
                {PROVINCES_LIST.map((item) => <option key={item.id} value={item.name}>{item.name}</option>)}
              </select>
            </label>
            <Field label="Physical business / farm address" required value={businessAddress} setValue={setBusinessAddress} disabled={locked} />
            <Field label="Primary agricultural sector" required value={primarySector} setValue={setPrimarySector} disabled={locked} />
            <Field label="Production scale" value={farmSize} setValue={setFarmSize} disabled={locked} />
            <label className="text-xs font-bold text-stone-600">Farm latitude<input type="number" step="any" min="-90" max="90" value={latitude} onChange={(event) => setLatitude(event.target.value)} disabled={locked} className="mt-1.5 w-full rounded-xl border border-stone-200 px-3 py-2.5 text-sm font-normal text-stone-800 disabled:bg-stone-50" /></label>
            <label className="text-xs font-bold text-stone-600">Farm longitude<input type="number" step="any" min="-180" max="180" value={longitude} onChange={(event) => setLongitude(event.target.value)} disabled={locked} className="mt-1.5 w-full rounded-xl border border-stone-200 px-3 py-2.5 text-sm font-normal text-stone-800 disabled:bg-stone-50" /></label>
          </div>
        </section>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-stone-100 pt-5">
          <p className="max-w-xl text-xs leading-5 text-stone-500">Submitted details are saved to your AgriMarket account. No files are accepted or uploaded.</p>
          {!locked && <button type="submit" disabled={saving} className="inline-flex items-center gap-2 rounded-xl bg-[#1d4d32] px-5 py-3 text-sm font-bold text-white hover:bg-[#103b25] disabled:opacity-60"><Upload size={16} />{saving ? 'Submitting…' : 'Submit for review'}</button>}
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
  return <label className="text-xs font-bold text-stone-600">{label}{required ? ' *' : ''}
    <input required={required} type={type} disabled={disabled} value={value} placeholder={placeholder} onChange={(event) => setValue(event.target.value)} className="mt-1.5 w-full rounded-xl border border-stone-200 px-3 py-2.5 text-sm font-normal text-stone-800 disabled:bg-stone-50" />
  </label>;
}
