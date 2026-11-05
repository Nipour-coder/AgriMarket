'use client';

import { useCallback, useEffect, useState } from 'react';
import { apiFetch } from '@/lib/apiFetch';

type Enquiry = {
  id: string;
  productName: string;
  buyerName: string;
  quantityRequested: string;
  message: string;
  status: string;
  createdAt: string;
  replies: { id: string; sender: string; message: string; quotePrice: string | null; timestamp: string }[];
};

export default function SellerEnquiriesPage() {
  const [enquiries, setEnquiries] = useState<Enquiry[]>([]);
  const [replies, setReplies] = useState<Record<string, string>>({});
  const [quotes, setQuotes] = useState<Record<string, string>>({});
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const loadEnquiries = useCallback(async () => {
    try {
      const response = await apiFetch('/api/enquiries', { cache: 'no-store' });
      const result = await response.json() as Enquiry[] | { error?: string };
      if (!response.ok || !Array.isArray(result)) throw new Error('error' in result ? result.error : 'Unable to load enquiries.');
      setEnquiries(result);
      setError('');
    } catch (issue) {
      setError(issue instanceof Error ? issue.message : 'Unable to load enquiries.');
    } finally {
      setLoaded(true);
    }
  }, []);

  useEffect(() => { void loadEnquiries(); }, [loadEnquiries]);

  const respond = async (enquiry: Enquiry) => {
    const message = replies[enquiry.id]?.trim();
    if (!message) {
      setError('Write a response before sending.');
      return;
    }
    setSaving(enquiry.id);
    setError('');
    setNotice('');
    try {
      const response = await apiFetch(`/api/enquiries/${enquiry.id}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, quotePrice: quotes[enquiry.id] || undefined }),
      });
      const result = await response.json() as { error?: string };
      if (!response.ok) throw new Error(result.error ?? 'Unable to send response.');
      setReplies((current) => ({ ...current, [enquiry.id]: '' }));
      setQuotes((current) => ({ ...current, [enquiry.id]: '' }));
      setNotice('Your response was sent to the buyer.');
      await loadEnquiries();
    } catch (issue) {
      setError(issue instanceof Error ? issue.message : 'Unable to send response.');
    } finally {
      setSaving(null);
    }
  };

  return <div className="mx-auto max-w-5xl px-5 py-12"><p className="text-xs font-bold uppercase tracking-[.15em] text-[#789456]">Seller portal</p><h1 className="mt-2 text-3xl font-extrabold text-[#20372a]">Buyer enquiries</h1><p className="mt-2 text-sm text-stone-500">Respond to buyer messages and provide quotes.</p>{error && <p role="alert" className="mt-4 text-sm text-red-700">{error}</p>}{notice && <p role="status" className="mt-4 text-sm text-green-800">{notice}</p>}{!loaded ? <p className="mt-5 text-sm text-stone-500">Loading enquiries…</p> : enquiries.length ? <div className="mt-7 space-y-4">{enquiries.map((enquiry) => <article key={enquiry.id} className="rounded-3xl border border-stone-200 bg-white p-5"><div className="flex flex-wrap justify-between gap-2"><h2 className="font-extrabold text-[#20372a]">{enquiry.productName}</h2><span className="rounded-full bg-amber-50 px-3 py-1 text-[10px] font-bold text-amber-800">{enquiry.status}</span></div><p className="mt-2 text-xs text-stone-500">From {enquiry.buyerName} · Requested: {enquiry.quantityRequested} · {new Date(enquiry.createdAt).toLocaleDateString('en-ZA')}</p><p className="mt-3 rounded-xl bg-[#f7f8f3] p-3 text-sm text-stone-700">{enquiry.message}</p>{enquiry.replies.map((reply) => <div key={reply.id} className="mt-3 rounded-xl border border-stone-100 p-3 text-sm"><p className="text-xs font-bold text-[#426e45]">{reply.sender}{reply.quotePrice ? ` · Quote: ${reply.quotePrice}` : ''}</p><p className="mt-1 text-stone-700">{reply.message}</p></div>)}<div className="mt-4 grid gap-3 sm:grid-cols-[1fr_180px]"><textarea value={replies[enquiry.id] ?? ''} onChange={(event) => setReplies((current) => ({ ...current, [enquiry.id]: event.target.value }))} rows={2} placeholder="Write a response…" className="rounded-xl border border-stone-200 px-3 py-2.5 text-sm outline-none focus:border-[#789456]" /><div className="space-y-2"><input value={quotes[enquiry.id] ?? ''} onChange={(event) => setQuotes((current) => ({ ...current, [enquiry.id]: event.target.value }))} placeholder="Quote (optional)" className="w-full rounded-xl border border-stone-200 px-3 py-2.5 text-sm outline-none focus:border-[#789456]" /><button type="button" disabled={saving === enquiry.id} onClick={() => void respond(enquiry)} className="w-full rounded-xl bg-[#1d4d32] px-4 py-2.5 text-xs font-bold text-white disabled:opacity-50">{saving === enquiry.id ? 'Sending…' : 'Send response'}</button></div></div></article>)}</div> : !error && <div className="mt-7 rounded-3xl border border-dashed border-stone-300 bg-white p-12 text-center"><h2 className="font-extrabold text-[#20372a]">No enquiries</h2><p className="mt-2 text-sm text-stone-500">Buyer enquiries will appear here.</p></div>}</div>;
}
