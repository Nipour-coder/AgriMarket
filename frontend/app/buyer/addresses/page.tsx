'use client';

import { useCallback, useEffect, useState } from 'react';

type SavedAddress = {
  id: string;
  label: string;
  recipientName: string;
  phone: string;
  province: string;
  city: string;
  suburb: string;
  street: string;
  postalCode: string;
  instructions: string;
  isDefault: boolean;
};

export default function BuyerAddressesPage() {
  const [addresses, setAddresses] = useState<SavedAddress[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState('');
  const loadAddresses = useCallback(async () => {
    try {
      const response = await fetch('/api/addresses', { cache: 'no-store' });
      const result = await response.json() as SavedAddress[] | { error?: string };
      if (!response.ok || !Array.isArray(result)) throw new Error('error' in result ? result.error : 'Unable to load saved addresses.');
      setAddresses(result);
      setError('');
    } catch (issue) {
      setError(issue instanceof Error ? issue.message : 'Unable to load saved addresses.');
    } finally {
      setLoaded(true);
    }
  }, []);

  useEffect(() => { void loadAddresses(); }, [loadAddresses]);

  const remove = async (id: string) => {
    try {
      const response = await fetch(`/api/addresses/${id}`, { method: 'DELETE' });
      const result = await response.json() as { error?: string };
      if (!response.ok) throw new Error(result.error ?? 'Unable to remove address.');
      await loadAddresses();
    } catch (issue) {
      setError(issue instanceof Error ? issue.message : 'Unable to remove address.');
    }
  };

  return <div className="mx-auto max-w-4xl px-5 py-12"><p className="text-xs font-bold uppercase tracking-[.15em] text-[#789456]">Buyer account</p><h1 className="mt-2 text-3xl font-extrabold text-[#20372a]">Saved addresses</h1>{error && <p role="alert" className="mt-4 text-sm text-red-700">{error}</p>}{!loaded ? <p className="mt-6 text-sm text-stone-500">Loading…</p> : addresses.length ? <div className="mt-7 space-y-4">{addresses.map((address) => <article key={address.id} className="rounded-3xl border border-stone-200 bg-white p-6"><div className="flex items-start justify-between gap-3"><div><p className="font-bold text-[#20372a]">{address.label}{address.isDefault && <span className="ml-2 rounded-full bg-green-50 px-2 py-1 text-[10px] font-bold text-green-800">Default</span>}</p><p className="mt-2 text-sm text-stone-600">{address.recipientName} · {address.phone}</p><p className="mt-1 text-sm text-stone-600">{address.street}, {address.suburb}, {address.city}, {address.province} {address.postalCode}</p>{address.instructions && <p className="mt-2 text-xs text-stone-500">Instructions: {address.instructions}</p>}</div><button type="button" onClick={() => void remove(address.id)} className="rounded-xl border border-red-200 px-4 py-2 text-xs font-bold text-red-700 hover:bg-red-50">Remove</button></div></article>)}</div> : !error && <div className="mt-7 rounded-3xl border border-dashed border-stone-300 bg-white p-10 text-center"><p className="font-bold text-[#20372a]">No saved addresses</p><p className="mt-2 text-sm text-stone-500">Choose “Save this address” during checkout to store an address in your account.</p></div>}</div>;
}
