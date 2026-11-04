'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { ArrowLeft, Minus, Plus, ShoppingBasket, Trash2, Truck } from 'lucide-react';
import { MOCK_PRODUCTS } from '@/data/mockData';
import { useStore } from '@/lib/store';
import { minimumOrderAmount } from '@/lib/commerce';

const money = (amount: number) => new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR', maximumFractionDigits: 2 }).format(amount);

export default function CartPage() {
  const { cart, subtotal, updateQuantity, removeFromCart, hydrated } = useStore();
  const [quantityError, setQuantityError] = useState('');
  const groups = useMemo(() => {
    const sellers = new Map<string, { name: string; lines: { product: (typeof MOCK_PRODUCTS)[number]; quantity: number }[] }>();
    cart.forEach((line) => {
      const product = line.product ?? MOCK_PRODUCTS.find((item) => item.id === line.productId);
      if (!product) return;
      const group = sellers.get(product.sellerId) ?? { name: product.seller.businessName, lines: [] };
      group.lines.push({ product, quantity: line.quantity });
      sellers.set(product.sellerId, group);
    });
    return [...sellers.entries()];
  }, [cart]);

  if (!hydrated) return <div className="mx-auto max-w-3xl px-5 py-24 text-center text-sm text-stone-500">Loading your saved cart…</div>;
  if (!cart.length) return (
    <div className="mx-auto max-w-3xl px-5 py-20 text-center sm:py-28">
      <span className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-[#e8eedc] text-[#426e45]"><ShoppingBasket size={27} /></span>
      <h1 className="mt-5 text-3xl font-extrabold text-[#20372a]">Your basket is ready to grow</h1>
      <p className="mt-3 text-sm text-stone-500">Explore locally grown products and add something to your cart.</p>
      <Link href="/shop" className="mt-7 inline-flex items-center gap-2 rounded-full bg-[#1d4d32] px-6 py-3 text-sm font-bold text-white hover:bg-[#103b25]">Browse products</Link>
    </div>
  );

  return (
    <div className="mx-auto max-w-7xl px-5 py-10 sm:py-14">
      <Link href="/shop" className="inline-flex items-center gap-2 text-sm font-semibold text-stone-500 hover:text-[#1d4d32]"><ArrowLeft size={16} /> Continue shopping</Link>
      <div className="mt-5 grid gap-8 lg:grid-cols-[1fr_350px]">
        <div>
          <div className="mb-6 flex items-end justify-between"><div><p className="text-xs font-bold uppercase tracking-[.15em] text-[#789456]">Your selection</p><h1 className="mt-1 text-3xl font-extrabold text-[#20372a]">Shopping cart</h1></div><span className="text-sm text-stone-500">{cart.reduce((sum, item) => sum + item.quantity, 0)} items</span></div>
          {quantityError && <p role="alert" className="mb-4 rounded-xl bg-amber-50 px-4 py-3 text-xs font-semibold text-amber-900">{quantityError}</p>}
          <div className="space-y-5">
            {groups.map(([sellerId, group]) => <section key={sellerId} className="overflow-hidden rounded-3xl border border-stone-200 bg-white">
              <div className="border-b border-stone-100 bg-[#f7f8f3] px-5 py-3"><p className="text-xs font-bold text-stone-700">Sold by <span className="text-[#426e45]">{group.name}</span></p><p className="mt-1 text-[10px] text-stone-500">Items from this seller are grouped for delivery estimates.</p></div>
              <div className="divide-y divide-stone-100">
                {group.lines.map(({ product, quantity }) => <div key={product.id} className="grid gap-4 p-4 sm:grid-cols-[100px_1fr_auto] sm:items-center sm:p-5">
                  <Link href={`/product/${product.id}`} className="block overflow-hidden rounded-xl bg-stone-100"><img src={product.image} alt={product.name} className="aspect-square w-full object-cover" /></Link>
                  <div><Link href={`/product/${product.id}`} className="font-bold text-[#20372a] hover:text-[#426e45]">{product.name}</Link><p className="mt-1 text-xs text-stone-500">{product.seller.province} · {product.priceUnit}</p><p className="mt-2 text-sm font-extrabold text-[#1d4d32]">{money(product.price ?? 0)} <span className="text-xs font-normal text-stone-500">{product.priceUnit}</span></p><p className="mt-1 text-[10px] text-stone-400">Demo stock: {product.availableQuantity ?? product.stockStatus}</p></div>
                  <div className="flex items-center justify-between gap-5 sm:flex-col sm:items-end"><div className="flex h-9 items-center rounded-lg border border-stone-200"><button type="button" aria-label="Decrease quantity" disabled={quantity <= minimumOrderAmount(product)} onClick={() => { if (updateQuantity(product.id, quantity - 1)) setQuantityError(''); }} className="px-2.5 text-stone-600 disabled:opacity-30"><Minus size={14} /></button><span className="min-w-7 text-center text-xs font-bold">{quantity}</span><button type="button" aria-label="Increase quantity" onClick={() => { if (updateQuantity(product.id, quantity + 1)) setQuantityError(''); else setQuantityError(`${product.name} has reached the available demo stock limit.`); }} className="px-2.5 text-stone-600"><Plus size={14} /></button></div><div className="flex items-center gap-3"><span className="text-sm font-extrabold text-[#20372a]">{money((product.price ?? 0) * quantity)}</span><button type="button" onClick={() => removeFromCart(product.id)} aria-label={`Remove ${product.name}`} className="rounded-lg p-2 text-stone-400 hover:bg-red-50 hover:text-red-600"><Trash2 size={16} /></button></div></div>
                </div>)}
              </div>
            </section>)}
          </div>
        </div>

        <aside className="h-fit rounded-3xl border border-stone-200 bg-white p-5 sm:p-6 lg:sticky lg:top-28">
          <h2 className="text-lg font-extrabold text-[#20372a]">Order summary</h2>
          <div className="mt-5 flex justify-between text-sm text-stone-600"><span>Items subtotal</span><strong className="text-stone-800">{money(subtotal)}</strong></div>
          <div className="mt-3 flex justify-between text-sm text-stone-600"><span>Delivery</span><span className="font-semibold text-stone-500">Calculated next</span></div>
          <div className="mt-4 border-t border-stone-100 pt-4"><div className="flex justify-between text-base font-extrabold text-[#20372a]"><span>Estimated total</span><span>{money(subtotal)}</span></div><p className="mt-2 text-[11px] leading-5 text-stone-500">Delivery options and demo fees will be calculated using your address and seller locations at checkout.</p></div>
          <Link href="/checkout" className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-[#1d4d32] py-3.5 text-sm font-bold text-white hover:bg-[#103b25]">Continue to checkout <Truck size={16} /></Link>
          <p className="mt-3 text-center text-[10px] leading-4 text-stone-400">Demo checkout only. No real payment will be collected.</p>
        </aside>
      </div>
    </div>
  );
}
