'use client';

import Link from 'next/link';
import { useState } from 'react';
import { BadgeCheck, MapPin, Plus, ShoppingBasket } from 'lucide-react';
import type { Product } from '@/lib/types';
import { useStore } from '@/lib/store';
import { hasDeliveryOption, minimumOrderAmount } from '@/lib/commerce';

const money = (amount: number) => new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR', maximumFractionDigits: 2 }).format(amount);

export default function StoreProductCard({ product, listView = false, distanceKm }: { product: Product; listView?: boolean; distanceKm?: number }) {
  const { addToCart, hydrated } = useStore();
  const [message, setMessage] = useState('');
  const canBuy = product.price !== null;

  const addItem = () => {
    const minimum = minimumOrderAmount(product);
    const added = addToCart(product, minimum);
    setMessage(added ? `Added minimum order (${minimum})` : 'Unable to add the minimum quantity');
    window.setTimeout(() => setMessage(''), 2200);
  };

  return (
    <article className={`group overflow-hidden rounded-3xl border border-stone-200 bg-white transition hover:-translate-y-1 hover:shadow-xl hover:shadow-green-950/5 ${listView ? 'sm:flex' : ''}`}>
      <Link href={`/product/${product.id}`} className={`relative block aspect-[4/3] overflow-hidden bg-stone-100 ${listView ? 'sm:aspect-auto sm:w-52 sm:shrink-0' : ''}`}>
        <img src={product.image || '/file.svg'} alt={product.name} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" loading="lazy" />
        <span className="absolute left-3 top-3 rounded-full bg-white/95 px-3 py-1 text-[11px] font-bold text-[#28583b] shadow-sm">{product.subcategory}</span>
        <span className="absolute bottom-3 left-3 rounded-full bg-[#1d4d32]/90 px-3 py-1 text-[11px] font-semibold text-white">{product.stockStatus}</span>
      </Link>
      <div className="flex flex-1 flex-col justify-between p-4 sm:p-5">
        <div className="mb-2 flex items-center justify-between gap-2">
          <span className="truncate text-xs font-semibold text-stone-500">{product.seller.businessName}</span>
          {product.seller.isVerified && <span className="inline-flex shrink-0 items-center gap-1 text-[10px] font-bold text-[#477547]"><BadgeCheck size={14} /> AgriMarket Verified</span>}
        </div>
        <Link href={`/product/${product.id}`} className="line-clamp-2 min-h-12 text-[15px] font-bold leading-6 text-[#202820] hover:text-[#426e45]">{product.name}</Link>
        <p className="mt-2 flex items-center gap-1 text-xs text-stone-500"><MapPin size={13} className="text-[#759251]" />{product.province}, South Africa{distanceKm !== undefined && <span className="font-bold text-[#426e45]"> · {distanceKm < 10 ? distanceKm.toFixed(1) : Math.round(distanceKm)} km away</span>}</p>
        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-stone-500">
          <span><strong className="text-stone-700">Availability:</strong> {product.availableQuantity ?? product.stockStatus}</span>
          <span><strong className="text-stone-700">Options:</strong> {hasDeliveryOption(product) ? 'Delivery or collection' : 'Collection / seller-arranged transport'}</span>
        </div>
        <div className="mt-4 flex items-end justify-between border-t border-stone-100 pt-4">
          <div>
            <p className="text-lg font-extrabold text-[#1d4d32]">{canBuy ? money(product.price!) : 'Request a quote'}</p>
            <p className="text-[11px] text-stone-500">{product.price ? product.priceUnit : product.minOrderQuantity}</p>
          </div>
          {canBuy ? (
            <button type="button" onClick={addItem} disabled={!hydrated} className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-[#1d4d32] text-white transition hover:bg-[#103b25] disabled:cursor-not-allowed disabled:opacity-50" aria-label={`Add ${product.name} to cart`}>
              {message ? <ShoppingBasket size={17} /> : <Plus size={19} />}
            </button>
          ) : (
            <Link href={`/product/${product.id}`} className="rounded-full border border-stone-200 px-3 py-2 text-xs font-bold text-[#1d4d32] hover:bg-green-50">Enquire</Link>
          )}
        </div>
        {canBuy && <p className="mt-2 text-[10px] text-stone-400">Minimum order: {product.minOrderQuantity}</p>}
        {message && <p role="status" className="mt-2 text-xs font-semibold text-[#477547]">{message}</p>}
      </div>
    </article>
  );
}
