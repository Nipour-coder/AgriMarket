'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

type Order = {
  id: string;
  createdAt: string;
  delivery: string;
  payment: string;
  lines: { productId: string; name: string; quantity: number }[];
  subtotal: number;
  deliveryFee: number;
  status: string;
};

const money = (amount: number) => new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR', maximumFractionDigits: 2 }).format(amount);

export default function BuyerOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => {
    fetch('/api/orders', { cache: 'no-store' }).then(async (response) => {
      const result = await response.json() as Order[] | { error?: string };
      if (!response.ok || !Array.isArray(result)) throw new Error('error' in result ? result.error : 'Unable to load your orders.');
      setOrders(result);
    }).catch((issue: unknown) => setError(issue instanceof Error ? issue.message : 'Unable to load your orders.'))
      .finally(() => setLoaded(true));
  }, []);

  if (!loaded) return <div className="mx-auto max-w-5xl px-5 py-20 text-sm text-stone-500">Loading your orders…</div>;
  return <div className="mx-auto max-w-5xl px-5 py-12"><p className="text-xs font-bold uppercase tracking-[.15em] text-[#789456]">Buyer account</p><h1 className="mt-2 text-3xl font-extrabold text-[#20372a]">My orders</h1><p className="mt-2 text-sm text-stone-500">Your orders are securely stored in your AgriMarket account.</p>{error && <p role="alert" className="mt-4 rounded-xl bg-red-50 p-3 text-xs text-red-800">{error}</p>}{orders.length ? <div className="mt-7 space-y-4">{orders.map((order) => <article key={order.id} className="rounded-3xl border border-stone-200 bg-white p-5"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="font-mono text-sm font-extrabold text-[#1d4d32]">{order.id}</p><p className="mt-1 text-xs text-stone-500">{new Date(order.createdAt).toLocaleDateString('en-ZA')} · {order.delivery} · {order.payment}</p></div><span className="rounded-full bg-[#eaf0df] px-3 py-1 text-xs font-bold text-[#426e45]">{order.status}</span></div><div className="mt-4 flex flex-wrap gap-3">{order.lines.map((line) => <span key={line.productId} className="rounded-full bg-stone-100 px-3 py-1.5 text-xs text-stone-600">{line.quantity} × {line.name}</span>)}</div><div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-stone-100 pt-4"><span className="text-sm font-extrabold text-[#20372a]">Total {money(order.subtotal + order.deliveryFee)}</span><div className="flex flex-wrap gap-2"><Link href={`/buyer/disputes?orderId=${encodeURIComponent(order.id)}`} className="rounded-full border border-stone-200 px-4 py-2 text-xs font-bold text-[#426e45]">Report an issue</Link><Link href={`/track-order/${encodeURIComponent(order.id)}`} className="rounded-full bg-[#1d4d32] px-4 py-2 text-xs font-bold text-white hover:bg-[#103b25]">Track order</Link></div></div></article>)}</div> : !error ? <div className="mt-8 rounded-3xl border border-dashed border-stone-300 bg-white px-6 py-16 text-center"><h2 className="text-lg font-extrabold text-[#20372a]">No orders just yet</h2><p className="mt-2 text-sm text-stone-500">Your marketplace orders will appear here after checkout.</p><Link href="/shop" className="mt-5 inline-block rounded-full bg-[#1d4d32] px-5 py-3 text-sm font-bold text-white">Explore products</Link></div> : null}</div>;
}
