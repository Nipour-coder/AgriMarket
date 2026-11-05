'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { apiFetch } from '@/lib/apiFetch';

type Order = {
  id: string;
  createdAt: string;
  customer: { name: string };
  delivery: string;
  status: string;
  lines: { productId: string; name: string; quantity: number; sellerStatus: string }[];
};

export default function SellerOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState<string | null>(null);

  const loadOrders = useCallback(async () => {
    try {
      const response = await apiFetch('/api/orders', { cache: 'no-store' });
      const result = await response.json() as Order[] | { error?: string };
      if (!response.ok || !Array.isArray(result)) throw new Error('error' in result ? result.error : 'Unable to load seller orders.');
      setOrders(result);
      setError('');
    } catch (issue) {
      setError(issue instanceof Error ? issue.message : 'Unable to load seller orders.');
    } finally {
      setLoaded(true);
    }
  }, []);

  useEffect(() => { void loadOrders(); }, [loadOrders]);

  const updateStatus = async (order: Order, status: 'Accepted' | 'Rejected' | 'Processing' | 'Ready for dispatch') => {
    setSaving(order.id);
    setError('');
    try {
      const response = await apiFetch(`/api/orders/${encodeURIComponent(order.id)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      const result = await response.json() as { error?: string };
      if (!response.ok) throw new Error(result.error ?? 'Unable to update order.');
      await loadOrders();
    } catch (issue) {
      setError(issue instanceof Error ? issue.message : 'Unable to update order.');
    } finally {
      setSaving(null);
    }
  };

  if (!loaded) return <div className="mx-auto max-w-5xl px-5 py-20 text-sm text-stone-500">Loading orders…</div>;
  return <div className="mx-auto max-w-5xl px-5 py-12">
    <p className="text-xs font-bold uppercase tracking-[.15em] text-[#789456]">Seller portal</p>
    <h1 className="mt-2 text-3xl font-extrabold text-[#20372a]">Incoming orders</h1>
    <p className="mt-2 text-sm text-stone-500">Update fulfilment status for your products. Changes are saved to the server.</p>
    {error && <p role="alert" className="mt-4 rounded-xl bg-red-50 p-3 text-xs font-semibold text-red-700">{error}</p>}
    {orders.length ? <div className="mt-7 space-y-4">{orders.map((order) => <article key={order.id} className="rounded-3xl border border-stone-200 bg-white p-5">
      <div className="flex flex-wrap items-start justify-between gap-3"><div><p className="font-mono text-sm font-extrabold text-[#1d4d32]">{order.id}</p><p className="mt-1 text-xs text-stone-500">{new Date(order.createdAt).toLocaleString('en-ZA')} · {order.customer.name}</p></div><span className="rounded-full bg-[#eaf0df] px-3 py-1 text-xs font-bold text-[#426e45]">{order.status}</span></div>
      <div className="mt-4 space-y-2">{order.lines.map((line) => <div key={line.productId} className="flex justify-between gap-3 rounded-xl bg-[#f7f8f3] px-3 py-2 text-xs"><span className="font-semibold text-stone-700">{line.name} · {line.quantity}</span><span className="text-stone-500">{line.sellerStatus}</span></div>)}</div>
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-stone-100 pt-4"><span className="text-xs text-stone-500">Delivery method: {order.delivery} · Payment is not processed.</span><div className="flex flex-wrap items-center gap-2">
        {order.lines.some((line) => line.sellerStatus === 'Pending') && <><button type="button" disabled={saving === order.id} onClick={() => void updateStatus(order, 'Accepted')} className="rounded-lg bg-[#1d4d32] px-3 py-2 text-[11px] font-bold text-white disabled:opacity-50">Accept order</button><button type="button" disabled={saving === order.id} onClick={() => void updateStatus(order, 'Rejected')} className="rounded-lg border border-stone-200 px-3 py-2 text-[11px] font-bold text-stone-600 disabled:opacity-50">Reject</button></>}
        {order.lines.some((line) => line.sellerStatus === 'Accepted') && <button type="button" disabled={saving === order.id} onClick={() => void updateStatus(order, 'Processing')} className="rounded-lg bg-[#1d4d32] px-3 py-2 text-[11px] font-bold text-white disabled:opacity-50">Mark processing</button>}
        {order.lines.some((line) => line.sellerStatus === 'Processing') && <button type="button" disabled={saving === order.id} onClick={() => void updateStatus(order, 'Ready for dispatch')} className="rounded-lg bg-[#1d4d32] px-3 py-2 text-[11px] font-bold text-white disabled:opacity-50">Mark ready for dispatch</button>}
        <Link href={`/seller/disputes?orderId=${encodeURIComponent(order.id)}`} className="px-2 text-xs font-bold text-[#426e45]">Report an issue →</Link>
        <Link href={`/track-order/${encodeURIComponent(order.id)}`} className="px-2 text-xs font-bold text-[#426e45]">View tracking →</Link>
      </div></div>
    </article>)}</div> : !error ? <div className="mt-7 rounded-3xl border border-dashed border-stone-300 bg-white p-12 text-center"><h2 className="font-extrabold text-[#20372a]">No orders received</h2><p className="mt-2 text-sm text-stone-500">Orders containing your products will appear here.</p></div> : null}
  </div>;
}
