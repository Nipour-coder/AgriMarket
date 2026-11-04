'use client';

import React, { useState, useEffect, Suspense } from 'react';
import NextLink from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { PROVINCES_LIST, MOCK_CATEGORIES } from '@/data/mockData';
import { 
  Sprout, 
  Store, 
  User, 
  ArrowRight, 
  CheckCircle2, 
} from 'lucide-react';

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [accountType, setAccountType] = useState<'buyer' | 'seller'>('seller');

  // Common fields
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [province, setProvince] = useState('Limpopo');
  const [agreeTerms, setAgreeTerms] = useState(false);

  // Buyer specific
  const [buyerCompany, setBuyerCompany] = useState('');
  const [buyerType, setBuyerType] = useState('Wholesale Market Trader');

  // Seller specific
  const [farmName, setFarmName] = useState('');
  const [registrationNumber, setRegistrationNumber] = useState('');
  const [farmAddress, setFarmAddress] = useState('');
  const [primarySector, setPrimarySector] = useState('Fresh Vegetables');
  const [farmSize, setFarmSize] = useState('Commercial (100 - 500 Ha)');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedSuccess, setSubmittedSuccess] = useState(false);
  const [submitError, setSubmitError] = useState('');

  useEffect(() => {
    const qType = searchParams.get('type');
    if (qType === 'buyer') setAccountType('buyer');
    if (qType === 'seller') setAccountType('seller');
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!agreeTerms) return;

    setIsSubmitting(true);
    setSubmitError('');
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accountType,
          name: fullName,
          email,
          phone,
          password,
          province,
          buyerCompany,
          businessName: farmName,
          registrationNumber,
          farmAddress,
          primarySector,
          farmSize,
        }),
      });
      const result = await response.json() as { error?: string };
      if (!response.ok) throw new Error(result.error ?? 'Unable to create your account.');
      setIsSubmitting(false);
      setSubmittedSuccess(true);
    } catch (issue) {
      setSubmitError(issue instanceof Error ? issue.message : 'Unable to create your account. Please try again.');
      setIsSubmitting(false);
    }
  };

  const handleEnterDashboard = () => {
    router.push('/login');
  };

  return (
    <div className="min-h-screen bg-stone-50 py-10 sm:py-16">
      <div className="max-w-2xl mx-auto px-4 sm:px-6">
        {/* Brand header */}
        <div className="text-center mb-8">
          <NextLink href="/" className="inline-flex items-center gap-2 mb-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-500 to-green-700 flex items-center justify-center text-white shadow-md">
              <Sprout className="w-6 h-6" />
            </div>
            <span className="text-2xl font-black tracking-tight text-[#114227]">
              Agri<span className="text-emerald-600">Market</span>
            </span>
          </NextLink>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-stone-900">
            Create an AgriMarket Account
          </h1>
          <p className="text-xs sm:text-sm text-stone-500 mt-1">
            Join the AgriMarket South African marketplace prototype.
          </p>
        </div>

        {submittedSuccess ? (
          <div className="bg-white rounded-3xl border border-stone-200/90 p-8 shadow-sm text-center space-y-6">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div>
              <h2 className="text-2xl font-bold text-[#114227]">
                Check your email
              </h2>
              <p className="text-sm text-stone-600 mt-2 max-w-md mx-auto">
                We sent an address verification link to <strong>{email}</strong>. Verify your email before signing in.
              </p>
            </div>

            {accountType === 'seller' && (
              <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-left text-xs text-amber-900 space-y-2">
                <p>
                  Your seller profile is stored securely and starts as Pending Verification. Product listings are not public until an administrator verifies the business.
                </p>
              </div>
            )}

            <button
              type="button"
              onClick={handleEnterDashboard}
              className="w-full sm:w-auto px-8 py-3 rounded-xl bg-[#114227] hover:bg-[#0c311c] text-white font-bold text-sm shadow transition-colors"
            >
              Continue to Sign In →
            </button>
          </div>
        ) : (
          <div className="bg-white rounded-3xl border border-stone-200/90 p-6 sm:p-8 shadow-sm">
            {/* Account Type Selector Tabs */}
            <div className="mb-6">
              <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-2">
                Select Account Type:
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setAccountType('buyer')}
                  className={`p-4 rounded-2xl border text-left transition-all ${
                    accountType === 'buyer'
                      ? 'border-emerald-600 bg-emerald-50/70 ring-2 ring-emerald-500/20'
                      : 'border-stone-200 hover:bg-stone-50'
                  }`}
                >
                  <div className="flex items-center gap-2 font-bold text-stone-900 text-sm">
                    <User className={`w-4 h-4 ${accountType === 'buyer' ? 'text-emerald-700' : 'text-stone-400'}`} />
                    <span>Buyer Account</span>
                  </div>
                  <p className="text-xs text-stone-500 mt-1">
                    For wholesalers, retailers, food processors, and institutional offtakers.
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setAccountType('seller')}
                  className={`p-4 rounded-2xl border text-left transition-all ${
                    accountType === 'seller'
                      ? 'border-emerald-600 bg-emerald-50/70 ring-2 ring-emerald-500/20'
                      : 'border-stone-200 hover:bg-stone-50'
                  }`}
                >
                  <div className="flex items-center gap-2 font-bold text-stone-900 text-sm">
                    <Store className={`w-4 h-4 ${accountType === 'seller' ? 'text-emerald-700' : 'text-stone-400'}`} />
                    <span>Seller Account</span>
                  </div>
                  <p className="text-xs text-stone-500 mt-1">
                    For commercial farms, cooperatives, livestock breeders, and agri SMMEs.
                  </p>
                </button>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Account details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Contact Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Sipho Ndlovu"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Business Email *
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="name@business.co.za"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Contact Phone / WhatsApp *
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="+27 (0)82 123 4567"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Province *
                  </label>
                  <select
                    value={province}
                    onChange={(e) => setProvince(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                  >
                    {PROVINCES_LIST.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Seller Specific Fields */}
              {accountType === 'seller' ? (
                <div className="pt-3 border-t border-stone-100 space-y-4">
                  <h3 className="text-xs font-bold text-stone-800 uppercase tracking-wider">
                    Agricultural Business Information (For Verification)
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-stone-700 mb-1">
                        Registered Business / Farm Name *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Lowveld Citrus Estates (Pty) Ltd"
                        value={farmName}
                        onChange={(e) => setFarmName(e.target.value)}
                        className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-stone-700 mb-1">
                        CIPC / Cooperative Reg. Number (if applicable)
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. 2021/184920/07"
                        value={registrationNumber}
                        onChange={(e) => setRegistrationNumber(e.target.value)}
                        className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1">
                      Farm or Facility Physical Address *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Portion 12, Farm Rooikraal, Tzaneen Agricultural Corridor"
                      value={farmAddress}
                      onChange={(e) => setFarmAddress(e.target.value)}
                      className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-stone-700 mb-1">
                        Primary Agricultural Sector *
                      </label>
                      <select
                        value={primarySector}
                        onChange={(e) => setPrimarySector(e.target.value)}
                        className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                      >
                        {MOCK_CATEGORIES.map((c) => (
                          <option key={c.id} value={c.name}>
                            {c.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-stone-700 mb-1">
                        Production Scale
                      </label>
                      <select
                        value={farmSize}
                        onChange={(e) => setFarmSize(e.target.value)}
                        className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                      >
                        <option>Emerging SMME (&lt; 50 Hectares)</option>
                        <option>Commercial (50 - 500 Hectares)</option>
                        <option>Large Commercial (&gt; 500 Hectares)</option>
                        <option>Agricultural Cooperative Collective</option>
                      </select>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-xs leading-5 text-amber-950">
                    Secure KYC document uploads are not enabled yet. You can submit your business profile now and provide documents when secure storage is configured.
                  </div>
                </div>
              ) : (
                /* Buyer specific fields */
                <div className="pt-3 border-t border-stone-100 space-y-4">
                  <h3 className="text-xs font-bold text-stone-800 uppercase tracking-wider">
                    Buyer Procurement Information
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-stone-700 mb-1">
                        Company or Trade Name *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Gauteng Produce Wholesalers"
                        value={buyerCompany}
                        onChange={(e) => setBuyerCompany(e.target.value)}
                        className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-stone-700 mb-1">
                        Business Operation Type
                      </label>
                      <select
                        value={buyerType}
                        onChange={(e) => setBuyerType(e.target.value)}
                        className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                      >
                        <option>Wholesale Market Trader</option>
                        <option>Supermarket Retailer</option>
                        <option>Food / Grain Processor</option>
                        <option>Livestock Feedlot / Abattoir</option>
                        <option>Agricultural Exporter</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* Password */}
              <div className="pt-2">
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Create Password *
                </label>
                <input
                  type="password"
                  required
                  placeholder="At least 12 characters"
                  minLength={12}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {submitError && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-800">{submitError}</p>}

              {/* Terms checkbox */}
              <div className="pt-2">
                <label className="flex items-start gap-2.5 text-xs text-stone-600 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    required
                    checked={agreeTerms}
                    onChange={(e) => setAgreeTerms(e.target.checked)}
                    className="mt-0.5 rounded text-emerald-600 focus:ring-emerald-500"
                  />
                  <span>
                    I confirm the accuracy of our agricultural business details and agree to the{' '}
                    <NextLink href="/terms" className="text-emerald-800 font-semibold underline">AgriMarket Terms of Trade</NextLink>{' '}
                    and Verification Protocol.
                  </span>
                </label>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting || !agreeTerms}
                className="w-full py-3.5 px-4 rounded-xl bg-[#114227] hover:bg-[#0c311c] text-white font-bold text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50 mt-4"
              >
                {isSubmitting ? (
                  <span>Processing Application...</span>
                ) : (
                  <>
                    <span>
                      {accountType === 'seller' ? 'Submit Seller Registration' : 'Complete Buyer Registration'}
                    </span>
                    <ArrowRight className="w-4 h-4 text-emerald-400" />
                  </>
                )}
              </button>
            </form>

            <div className="mt-6 pt-5 border-t border-stone-100 text-center text-xs text-stone-500">
              Already have an account?{' '}
              <NextLink
                href="/login"
                className="text-emerald-800 font-bold hover:underline"
              >
                Sign In
              </NextLink>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-stone-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-700" />
      </div>
    }>
      <RegisterForm />
    </Suspense>
  );
}
