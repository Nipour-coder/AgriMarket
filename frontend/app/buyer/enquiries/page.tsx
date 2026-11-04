'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

type BuyerEnquiry = {
  id: string;
  productId: string;
  productName: string;
  sellerName: string;
  quantityRequested: string;
  message: string;
  status: string;
  createdAt: string;
  replies: { id: string; sender: string; message: string; quotePrice: string | null; timestamp: string }[];
};

export default function BuyerEnquiriesPage() {
  const [enquiries, setEnquiries] = useState<BuyerEnquiry[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => {
    fetch('/api/enquiries', { cache: 'no-store' }).then(async (response) => {
      const result = await response.json() as BuyerEnquiry[] | { error?: string };
      if (!response.ok || !Array.isArray(result)) throw new Error('error' in result ? result.error : 'Unable to load enquiries.');
      setEnquiries(result);
    }).catch((issue: unknown) => setError(issue instanceof Error ? issue.message : 'Unable to load enquiries.'))
      .finally(() => setLoaded(true));
  }, []);

  return <div className="mx-auto max-w-5xl px-5 py-12"><p className="text-xs font-bold uppercase tracking-[.15em] text-[#789456]">Buyer account</p><h1 className="mt-2 text-3xl font-extrabold text-[#20372a]">My enquiries</h1><p className="mt-2 text-sm text-stone-500">Review messages and quotes from sellers.</p>{error && <p role="alert" className="mt-4 text-sm text-red-700">{error}</p>}{!loaded ? <p className="mt-6 text-sm text-stone-500">Loading…</p> : enquiries.length ? <div className="mt-7 space-y-4">{enquiries.map((enquiry) => <article key={enquiry.id} className="rounded-3xl border border-stone-200 bg-white p-5"><div className="flex flex-wrap justify-between gap-2"><h2 className="font-extrabold text-[#20372a]">{enquiry.productName}</h2><span className="rounded-full bg-amber-50 px-3 py-1 text-[10px] font-bold text-amber-800">{enquiry.status}</span></div><p className="mt-1 text-xs text-stone-500">Seller: {enquiry.sellerName} · Requested: {enquiry.quantityRequested} · {new Date(enquiry.createdAt).toLocaleDateString('en-ZA')}</p><p className="mt-3 rounded-xl bg-[#f7f8f3] p-3 text-sm text-stone-700">{enquiry.message}</p>{enquiry.replies.map((reply) => <div key={reply.id} className="mt-3 rounded-xl border border-stone-100 p-3 text-sm"><p className="text-xs font-bold text-[#426e45]">{reply.sender}{reply.quotePrice ? ` · Quote: ${reply.quotePrice}` : ''}</p><p className="mt-1 text-stone-700">{reply.message}</p></div>)}<Link href={`/product/${enquiry.productId}`} className="mt-3 inline-block text-xs font-bold text-[#426e45]">View product</Link></article>)}</div> : !error && <div className="mt-7 rounded-3xl border border-dashed border-stone-300 bg-white p-12 text-center"><h2 className="font-extrabold text-[#20372a]">No enquiries yet</h2><p className="mt-2 text-sm text-stone-500">Send an enquiry to a seller from a product page.</p><Link href="/shop" className="mt-5 inline-block text-sm font-bold text-[#426e45]">Browse products →</Link></div>}</div>;
}
