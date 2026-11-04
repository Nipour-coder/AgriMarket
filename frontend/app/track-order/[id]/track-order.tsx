'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { Check, Circle, MapPin, PackageCheck, Store, Truck } from 'lucide-react';

type Order = {
  id: string;
  createdAt: string;
  address: { street: string; suburb: string; city: string; province: string; postalCode: string; instructions: string };
  delivery: string;
  status: string;
  deliveryDate?: string;
  deliveryFee: number;
  lines: { productId: string; name: string; quantity: number }[];
  history: { status: string; timestamp: string }[];
};

const displayDate = (date: string) => new Intl.DateTimeFormat('en-ZA', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(date));

export default function TrackOrder({ orderId }: { orderId: string }) {
  const [order, setOrder] = useState<Order | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [cancelling, setCancelling] = useState(false);

  const loadOrder = useCallback(async () => {
    try {
      const response = await fetch(`/api/orders/${encodeURIComponent(orderId)}`, { cache: 'no-store' });
      const result = await response.json() as Order | { error?: string };
      if (!response.ok || !('id' in result)) throw new Error('error' in result ? result.error : 'Unable to load order tracking.');
      setOrder(result);
      setError('');
    } catch (issue) {
      setError(issue instanceof Error ? issue.message : 'Unable to load order tracking.');
    } finally {
      setLoaded(true);
    }
  }, [orderId]);

  useEffect(() => { void loadOrder(); }, [loadOrder]);

  const cancel = async () => {
    setCancelling(true);
    setError('');
    try {
      const response = await fetch(`/api/orders/${encodeURIComponent(orderId)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'Cancelled' }),
      });
      const result = await response.json() as { error?: string };
      if (!response.ok) throw new Error(result.error ?? 'Unable to cancel this order.');
      setNotice('Your cancellation was recorded.');
      await loadOrder();
    } catch (issue) {
      setError(issue instanceof Error ? issue.message : 'Unable to cancel this order.');
    } finally {
      setCancelling(false);
    }
  };

  if (!loaded) return <div className="mx-auto max-w-3xl px-5 py-24 text-center text-sm text-stone-500">Loading order tracking…</div>;
  if (!order) return <div className="mx-auto max-w-3xl px-5 py-24 text-center"><h1 className="text-2xl font-extrabold text-[#20372a]">Order not found</h1><p role="alert" className="mt-2 text-sm text-stone-500">{error}</p><Link href="/buyer/orders" className="mt-5 inline-block font-bold text-[#426e45]">View my orders</Link></div>;

  const collection = order.delivery === 'collection';
  const timeline = ['Order Placed', 'Seller Processing Order', 'Ready for Collection or Dispatched', ...(collection ? ['Collected'] : ['Out for Delivery', 'Delivered'])];
  if (order.status === 'Rejected') timeline.push('Rejected');
  if (order.status === 'Cancelled') timeline.push('Cancelled');
  const history = order.history ?? [];
  const canCancel = ['Order Placed', 'Seller Processing Order'].includes(order.status);

  return (
    <div className="mx-auto max-w-5xl px-5 py-10 sm:py-14">
      <Link href="/buyer/orders" className="text-sm font-semibold text-stone-500 hover:text-[#1d4d32]">← My orders</Link>
      <div className="mt-5 grid gap-7 lg:grid-cols-[1fr_330px]">
        <section className="rounded-3xl border border-stone-200 bg-white p-5 sm:p-7">
          <div className="flex flex-wrap items-start justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-[.15em] text-[#789456]">Order tracking</p><h1 className="mt-1 text-2xl font-extrabold text-[#20372a]">{order.id}</h1><p className="mt-1 text-xs text-stone-500">Placed {displayDate(order.createdAt)}</p></div><span className="rounded-full bg-[#eaf0df] px-3 py-1.5 text-xs font-bold text-[#426e45]">{order.status}</span></div>
          <div className="mt-7 rounded-2xl bg-[#f7f8f3] p-4"><p className="flex items-center gap-2 text-sm font-extrabold text-[#20372a]">{collection ? <Store size={17} /> : <Truck size={17} />}{collection ? 'Farm or seller collection' : `${order.delivery} delivery`}</p><p className="mt-1 text-xs leading-5 text-stone-600">{`${order.address.street}, ${order.address.suburb}, ${order.address.city}, ${order.address.province} ${order.address.postalCode}`}</p>{order.deliveryDate && <p className="mt-2 text-xs text-stone-600">Requested date: {order.deliveryDate}</p>}{order.address.instructions && <p className="mt-1 text-xs text-stone-500">Instructions: {order.address.instructions}</p>}</div>
          {!collection && <p className="mt-4 flex items-start gap-2 rounded-xl bg-amber-50 p-3 text-xs leading-5 text-amber-900"><MapPin size={15} className="mt-0.5 shrink-0" />Live courier tracking is not connected. Contact the seller to confirm delivery timing.</p>}
          <h2 className="mt-7 font-extrabold text-[#20372a]">Order timeline</h2>
          <ol className="mt-5 space-y-0">{timeline.map((status, index) => {
            const event = history.find((item) => item.status === status);
            const active = Boolean(event);
            return <li key={`${status}-${index}`} className="relative flex gap-4 pb-6 last:pb-0"><span className={`relative z-10 grid h-7 w-7 shrink-0 place-items-center rounded-full ${active ? 'bg-[#1d4d32] text-white' : 'border border-stone-300 bg-white text-stone-400'}`}>{active ? <Check size={14} /> : <Circle size={12} />}</span>{index < timeline.length - 1 && <span className={`absolute left-[13px] top-7 h-[calc(100%-1rem)] w-px ${active ? 'bg-[#91aa70]' : 'bg-stone-200'}`} />}<div className="pt-1"><p className={`text-sm font-bold ${active ? 'text-[#20372a]' : 'text-stone-400'}`}>{status}</p>{event && <p className="mt-1 text-xs text-stone-500">{displayDate(event.timestamp)}</p>}</div></li>;
          })}</ol>
          {notice && <p role="status" className="mt-5 rounded-xl bg-green-50 p-3 text-xs font-semibold text-[#426e45]">{notice}</p>}
          {error && <p role="alert" className="mt-5 rounded-xl bg-red-50 p-3 text-xs text-red-800">{error}</p>}
          {canCancel && <button type="button" disabled={cancelling} onClick={() => void cancel()} className="mt-6 rounded-xl border border-stone-200 px-4 py-2.5 text-xs font-bold text-stone-600 hover:bg-stone-50 disabled:opacity-50">{cancelling ? 'Requesting…' : 'Request cancellation'}</button>}
        </section>
        <aside className="h-fit rounded-3xl border border-stone-200 bg-white p-5"><h2 className="flex items-center gap-2 font-extrabold text-[#20372a]"><PackageCheck size={18} className="text-[#789456]" /> Items</h2><div className="mt-4 space-y-3">{order.lines.map((line) => <p key={line.productId} className="rounded-xl bg-[#f7f8f3] px-3 py-2 text-xs text-stone-700">{line.quantity} × {line.name}</p>)}</div><p className="mt-4 border-t border-stone-100 pt-4 text-xs text-stone-500">No payment or courier service is connected.</p></aside>
      </div>
    </div>
  );
}
