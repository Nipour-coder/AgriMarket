'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useStore } from '@/lib/store';
import { ShoppingBasket, Truck } from 'lucide-react';

type OrderSummary = { id: string; status: string };

export default function BuyerDashboardPage() {
  const { itemCount } = useStore();
  const [orders, setOrders] = useState<OrderSummary[]>([]);
  const [error, setError] = useState('');
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    fetch('/api/orders', { cache: 'no-store' }).then(async (response) => {
      const result = await response.json() as OrderSummary[] | { error?: string };
      if (!response.ok || !Array.isArray(result)) throw new Error('error' in result ? result.error : 'Unable to load your orders.');
      setOrders(result);
    }).catch((issue: unknown) => setError(issue instanceof Error ? issue.message : 'Unable to load your orders.'))
      .finally(() => setLoaded(true));
  }, []);

  const activeOrders = orders.filter((order) => !['Delivered', 'Collected', 'Cancelled', 'Rejected'].includes(order.status));
  return (
    <div className="mx-auto max-w-6xl px-5 py-12">
      <p className="text-xs font-bold uppercase tracking-[.15em] text-[#789456]">Your AgriMarket</p>
      <h1 className="mt-2 text-3xl font-extrabold text-[#20372a]">Buyer dashboard</h1>
      <p className="mt-2 text-sm text-stone-500">Manage your marketplace activity and order history.</p>
      {error && <p role="alert" className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-800">{error}</p>}
      <div className="mt-7 grid gap-4 sm:grid-cols-3">
        <div className="rounded-3xl border border-stone-200 bg-white p-5"><ShoppingBasket className="text-[#789456]" /><p className="mt-4 text-2xl font-extrabold text-[#20372a]">{itemCount}</p><p className="text-xs text-stone-500">Items in your basket</p></div>
        <div className="rounded-3xl border border-stone-200 bg-white p-5"><Truck className="text-[#789456]" /><p className="mt-4 text-2xl font-extrabold text-[#20372a]">{loaded ? activeOrders.length : '—'}</p><p className="text-xs text-stone-500">Active orders</p></div>
        <div className="rounded-3xl border border-stone-200 bg-white p-5"><p className="text-2xl font-extrabold text-[#20372a]">{loaded ? orders.length : '—'}</p><p className="mt-4 text-xs text-stone-500">Total orders</p></div>
      </div>
      <div className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Link href="/buyer/orders" className="rounded-3xl bg-[#1d4d32] p-6 text-white"><h2 className="font-extrabold">My orders</h2><p className="mt-2 text-sm text-white/70">Review your orders and seller updates.</p><span className="mt-4 inline-block text-xs font-bold text-[#d4e5a5]">View order history →</span></Link>
        <Link href="/buyer/disputes" className="rounded-3xl border border-stone-200 bg-white p-6"><h2 className="font-extrabold text-[#20372a]">Complaints and refunds</h2><p className="mt-2 text-sm text-stone-500">Submit an order complaint, share evidence and track resolutions.</p><span className="mt-4 inline-block text-xs font-bold text-[#426e45]">Open dispute centre →</span></Link>
        <Link href="/buyer/addresses" className="rounded-3xl border border-stone-200 bg-white p-6"><h2 className="font-extrabold text-[#20372a]">Saved addresses</h2><p className="mt-2 text-sm text-stone-500">Manage addresses stored in your account.</p><span className="mt-4 inline-block text-xs font-bold text-[#426e45]">View addresses →</span></Link>
        <Link href="/buyer/enquiries" className="rounded-3xl border border-stone-200 bg-white p-6"><h2 className="font-extrabold text-[#20372a]">My enquiries</h2><p className="mt-2 text-sm text-stone-500">Review messages with sellers.</p><span className="mt-4 inline-block text-xs font-bold text-[#426e45]">View enquiries →</span></Link>
      </div>
    </div>
  );
}
