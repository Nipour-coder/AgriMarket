'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { BadgeCheck, PackageCheck, Truck } from 'lucide-react';

type Order = {
  id: string;
  customer: { name: string };
  address: { street: string; suburb: string; city: string; province: string; postalCode: string };
  delivery: string;
  deliveryDate?: string;
  payment: string;
  lines: { productId: string; name: string; quantity: number; unitPrice: number }[];
  subtotal: number;
  deliveryFee: number;
  status: string;
};

const money = (amount: number) => new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR', maximumFractionDigits: 2 }).format(amount);

export default function OrderConfirmation({ orderId }: { orderId: string }) {
  const [order, setOrder] = useState<Order | null>(null);
  const [error, setError] = useState('');
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    fetch(`/api/orders/${encodeURIComponent(orderId)}`, { cache: 'no-store' }).then(async (response) => {
      const result = await response.json() as Order | { error?: string };
      if (!response.ok || !('id' in result)) throw new Error('error' in result ? result.error : 'Unable to load this order.');
      setOrder(result);
    }).catch((issue: unknown) => setError(issue instanceof Error ? issue.message : 'Unable to load this order.'))
      .finally(() => setLoaded(true));
  }, [orderId]);

  if (!loaded) return <div className="mx-auto max-w-2xl px-5 py-24 text-center text-sm text-stone-500">Loading your order…</div>;
  if (!order) return <div className="mx-auto max-w-2xl px-5 py-24 text-center"><h1 className="text-2xl font-extrabold text-[#20372a]">Order not found</h1><p role="alert" className="mt-2 text-sm text-stone-500">{error}</p><Link href="/buyer/orders" className="mt-5 inline-block font-bold text-[#426e45]">View your orders</Link></div>;

  return (
    <div className="mx-auto max-w-3xl px-5 py-12 sm:py-16">
      <div className="rounded-[2rem] border border-stone-200 bg-white p-6 text-center shadow-sm sm:p-10">
        <span className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-[#e8eedc] text-[#426e45]"><PackageCheck size={29} /></span>
        <p className="mt-5 text-xs font-bold uppercase tracking-[.15em] text-[#789456]">Order received</p>
        <h1 className="mt-2 text-3xl font-extrabold text-[#20372a]">Thanks, {order.customer.name.split(' ')[0]}.</h1>
        <p className="mx-auto mt-3 max-w-lg text-sm leading-6 text-stone-600">Your order is saved to your account. Payment is not processed; confirm fulfilment details directly with sellers.</p>
        <div className="mt-6 rounded-2xl bg-[#f7f8f3] p-4"><p className="text-xs font-semibold text-stone-500">Order number</p><p className="mt-1 font-mono text-lg font-extrabold text-[#1d4d32]">{order.id}</p></div>
        <div className="mt-7 text-left">
          <div className="flex items-center justify-between"><h2 className="font-extrabold text-[#20372a]">Order summary</h2><span className="rounded-full bg-green-50 px-3 py-1 text-[11px] font-bold text-[#426e45]">{order.status}</span></div>
          <div className="mt-4 divide-y divide-stone-100 rounded-2xl border border-stone-100">
            {order.lines.map((line) => <div key={line.productId} className="flex items-center gap-3 p-3"><div className="grid h-12 w-12 place-items-center rounded-lg bg-[#f2f4ec]"><PackageCheck size={18} className="text-[#789456]" /></div><div className="min-w-0 flex-1"><p className="text-xs font-bold text-stone-700">{line.name}</p><p className="mt-1 text-[10px] text-stone-500">{line.quantity} × {money(line.unitPrice)}</p></div><span className="text-xs font-bold text-stone-800">{money(line.unitPrice * line.quantity)}</span></div>)}
          </div>
          <div className="mt-4 space-y-2 text-sm"><div className="flex justify-between text-stone-600"><span>Subtotal</span><span>{money(order.subtotal)}</span></div><div className="flex justify-between text-stone-600"><span>Delivery ({order.delivery})</span><span>{money(order.deliveryFee)}</span></div><div className="flex justify-between border-t border-stone-100 pt-3 text-base font-extrabold text-[#20372a]"><span>Total</span><span>{money(order.subtotal + order.deliveryFee)}</span></div></div>
          <div className="mt-5 grid gap-3 rounded-2xl bg-[#f7f8f3] p-4 text-xs leading-5 text-stone-600 sm:grid-cols-2"><p><strong className="block text-stone-800">Delivery method</strong>{order.delivery}{order.deliveryDate ? ` · Requested ${order.deliveryDate}` : ''}</p><p><strong className="block text-stone-800">Payment</strong>{order.payment} · Not processed</p><p className="sm:col-span-2"><strong className="block text-stone-800">Delivery address</strong>{`${order.address.street}, ${order.address.suburb}, ${order.address.city}, ${order.address.province} ${order.address.postalCode}`}</p></div>
        </div>
        <div className="mt-7 flex flex-wrap justify-center gap-3"><Link href={`/track-order/${encodeURIComponent(order.id)}`} className="inline-flex items-center gap-2 rounded-full bg-[#1d4d32] px-5 py-3 text-sm font-bold text-white hover:bg-[#103b25]"><Truck size={16} /> Track order</Link><Link href="/shop" className="rounded-full border border-stone-200 px-5 py-3 text-sm font-bold text-stone-700 hover:bg-stone-50">Continue shopping</Link></div>
        <p className="mt-5 flex items-center justify-center gap-1 text-[10px] leading-4 text-stone-400"><BadgeCheck size={13} /> Payment, courier delivery and tracking are not connected.</p>
      </div>
    </div>
  );
}
