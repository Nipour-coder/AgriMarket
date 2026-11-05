'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch } from '@/lib/apiFetch';
import { ArrowLeft, BadgeCheck, Check, MapPin, Minus, PackageCheck, Plus, ShoppingBasket, Truck } from 'lucide-react';
import { PROVINCES_LIST } from '@/data/mockData';
import { useStore } from '@/lib/store';
import { minimumOrderAmount } from '@/lib/commerce';
import type { Product } from '@/lib/types';

const money = (amount: number) => new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR', maximumFractionDigits: 2 }).format(amount);

export default function ProductDetails({ productId }: { productId: string }) {
  const [product, setProduct] = useState<Product | null>(null);
  const { addToCart, hydrated } = useStore();
  const router = useRouter();
  const [quantity, setQuantity] = useState(1);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [enquiryOpen, setEnquiryOpen] = useState(false);
  const [enquirySent, setEnquirySent] = useState(false);

  useEffect(() => {
    fetch(`/api/products/${encodeURIComponent(productId)}`, { cache: 'no-store' }).then(async (response) => {
      const result = await response.json() as Product | { error?: string };
      if (!response.ok || !('id' in result)) throw new Error('error' in result ? result.error : 'Unable to load this product.');
      setProduct(result);
      setQuantity(minimumOrderAmount(result));
    }).catch((issue: unknown) => setError(issue instanceof Error ? issue.message : 'Unable to load this product.'))
      .finally(() => setLoading(false));
  }, [productId]);

  if (loading) return <div className="mx-auto max-w-4xl px-5 py-24 text-center text-sm text-stone-500">Loading product…</div>;
  if (!product) return <div className="mx-auto max-w-4xl px-5 py-24 text-center"><h1 className="text-2xl font-extrabold">Product not found</h1><p role="alert" className="mt-2 text-sm text-red-700">{error}</p><Link href="/shop" className="mt-4 inline-block text-sm font-bold text-[#426e45]">Back to shop</Link></div>;
  const minimumQuantity = minimumOrderAmount(product);
  const fulfilmentOptions = [
    ...(product.availableForDelivery ? ['Delivery'] : []),
    ...(product.availableForCollection ? ['farm collection'] : []),
  ].join(' and ') || 'No fulfilment options';

  const addProduct = (buyNow: boolean) => {
    if (!product.price) return;
    if (!addToCart(product, quantity)) {
      setNotice('That quantity is unavailable in this demo listing.');
      return;
    }
    if (buyNow) router.push('/checkout');
    else {
      setNotice(`${quantity} added to your cart`);
      window.setTimeout(() => setNotice(''), 2500);
    }
  };

  const submitEnquiry = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setError('');
    try {
      const response = await apiFetch('/api/enquiries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: product.id,
          quantityRequested: form.get('quantity'),
          deliveryProvince: form.get('province'),
          message: form.get('message'),
        }),
      });
      const result = await response.json() as { error?: string };
      if (!response.ok) throw new Error(result.error ?? 'Unable to send enquiry.');
      setEnquirySent(true);
    } catch (issue) {
      setError(issue instanceof Error ? issue.message : 'Unable to send enquiry.');
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-5 py-8 sm:py-12">
      <Link href="/shop" className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-stone-500 hover:text-[#1d4d32]"><ArrowLeft size={16} /> Back to shop</Link>
      <div className="grid gap-8 lg:grid-cols-[1.05fr_.95fr]">
        <div>
          <div className="relative overflow-hidden rounded-[2rem] bg-stone-100"><img src={product.image || '/file.svg'} alt={product.name} className="aspect-[4/3] w-full object-cover" /><span className="absolute left-4 top-4 rounded-full bg-white px-3 py-1.5 text-xs font-bold text-[#1d4d32]">{product.category}</span><span className="absolute bottom-4 left-4 rounded-full bg-[#1d4d32]/90 px-3 py-1.5 text-xs font-semibold text-white">{product.stockStatus}</span></div>
          <div className="mt-4 grid grid-cols-3 gap-3">{(product.gallery?.slice(0, 3) ?? [product.image]).map((image, index) => <img key={`${image}-${index}`} src={image} alt={`${product.name} view ${index + 1}`} className="aspect-[4/3] w-full rounded-2xl object-cover" />)}</div>
          <div className="mt-8 rounded-3xl border border-stone-200 bg-white p-5 sm:p-6">
            <h2 className="text-lg font-extrabold text-[#20372a]">About this product</h2><p className="mt-3 text-sm leading-7 text-stone-600">{product.description}</p>
            <h3 className="mt-6 font-bold text-[#20372a]">Product specifications</h3>
            <dl className="mt-3 grid gap-2 sm:grid-cols-2">{Object.entries(product.specifications).filter(([, value]) => value && typeof value !== 'boolean').map(([key, value]) => <div key={key} className="flex justify-between gap-3 rounded-xl bg-[#f7f7f2] px-3 py-2.5 text-xs"><dt className="capitalize text-stone-500">{key.replace(/([A-Z])/g, ' $1')}</dt><dd className="text-right font-semibold text-stone-700">{Array.isArray(value) ? value.join(', ') : value}</dd></div>)}</dl>
          </div>
        </div>

        <div>
          <p className="text-xs font-bold uppercase tracking-[.15em] text-[#789456]">{product.subcategory}</p>
          <h1 className="mt-2 text-3xl font-extrabold leading-tight text-[#20372a] sm:text-4xl">{product.name}</h1>
          <p className="mt-3 flex items-center gap-1.5 text-sm text-stone-500"><MapPin size={16} className="text-[#789456]" />{product.seller.district}, {product.province}</p>
          <div className="mt-6 rounded-3xl bg-[#eff2e8] p-5">
            <p className="text-xs font-bold uppercase tracking-wide text-[#6b7f4e]">Listing price</p>
            {product.price !== null ? <p className="mt-1 text-3xl font-extrabold text-[#1d4d32]">{money(product.price)} <span className="text-sm font-medium text-stone-600">{product.priceUnit}</span></p> : <p className="mt-1 text-2xl font-extrabold text-[#1d4d32]">Price on request</p>}
            <p className="mt-2 text-xs text-stone-600">Minimum order: <strong>{product.minOrderQuantity}</strong></p>
          </div>
          <div className="mt-5 flex items-center gap-2 text-xs font-semibold text-stone-600"><PackageCheck size={17} className="text-[#789456]" /> Availability: {product.availableQuantity ?? product.stockStatus}</div>
          <div className="mt-4 flex items-center gap-2 text-xs font-semibold text-stone-600"><Truck size={17} className="text-[#789456]" />{fulfilmentOptions} available.</div>
          <div className="mt-7 flex flex-wrap items-end gap-3">
            {product.price !== null && <div><label htmlFor="product-quantity" className="mb-2 block text-xs font-bold text-stone-600">Quantity (min. {minimumQuantity})</label><div className="flex h-12 items-center rounded-xl border border-stone-200 bg-white"><button type="button" aria-label="Decrease quantity" disabled={quantity <= minimumQuantity} onClick={() => setQuantity((value) => Math.max(minimumQuantity, value - 1))} className="px-3 text-stone-600 disabled:opacity-30"><Minus size={16} /></button><input id="product-quantity" type="number" min={minimumQuantity} step={1} value={quantity} onChange={(event) => setQuantity(Math.max(minimumQuantity, Number.parseInt(event.target.value, 10) || minimumQuantity))} className="w-14 text-center text-sm font-bold outline-none" /><button type="button" aria-label="Increase quantity" onClick={() => setQuantity((value) => value + 1)} className="px-3 text-stone-600"><Plus size={16} /></button></div></div>}
            {product.price !== null ? <button type="button" disabled={!hydrated} onClick={() => addProduct(false)} className="inline-flex h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-[#1d4d32] px-5 text-sm font-bold text-white hover:bg-[#103b25] disabled:opacity-50 sm:flex-none"><ShoppingBasket size={17} /> Add to cart</button> : <button type="button" onClick={() => setEnquiryOpen(true)} className="inline-flex h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-[#1d4d32] px-5 text-sm font-bold text-white hover:bg-[#103b25]"><ShoppingBasket size={17} /> Request a quote</button>}
            {product.price !== null && <button type="button" disabled={!hydrated} onClick={() => addProduct(true)} className="h-12 w-full rounded-xl border border-[#1d4d32] px-5 text-sm font-bold text-[#1d4d32] hover:bg-green-50 disabled:opacity-50 sm:w-auto">Buy now</button>}
          </div>
          {notice && <p role="status" className="mt-3 text-sm font-semibold text-[#477547]">{notice}</p>}

          <div className="mt-8 rounded-3xl border border-stone-200 bg-white p-5">
            <div className="flex items-start gap-3"><span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-[#e9efdf] text-sm font-extrabold text-[#426e45]">{product.seller.businessName.slice(0, 1)}</span><div className="min-w-0 flex-1"><h2 className="font-extrabold text-[#20372a]">{product.seller.businessName}</h2><p className="mt-1 text-xs text-stone-500">{product.seller.district}, {product.seller.province}</p><p className="mt-3 text-sm leading-6 text-stone-600">{product.seller.description}</p></div></div>
            <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-stone-100 pt-4">{product.seller.isVerified && <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-3 py-1.5 text-[11px] font-bold text-[#426e45]"><BadgeCheck size={14} /> AgriMarket {product.seller.verificationBadge}</span>}</div>
            <p className="mt-3 text-xs text-stone-500">Send an enquiry to the seller through your AgriMarket account.</p>
          </div>

          <button type="button" onClick={() => { setEnquiryOpen((value) => !value); setEnquirySent(false); }} className="mt-5 w-full rounded-xl border border-stone-300 bg-white px-4 py-3 text-sm font-bold text-stone-700 hover:bg-stone-50">{enquiryOpen ? 'Close enquiry form' : 'Contact seller / Send enquiry'}</button>
          {error && <p role="alert" className="mt-3 rounded-xl bg-red-50 p-3 text-xs text-red-800">{error}{error.includes('sign in') && <> <Link href="/login" className="font-bold underline">Sign in</Link></>}</p>}
          {enquiryOpen && (enquirySent ? <div role="status" className="mt-3 rounded-xl bg-green-50 p-4 text-sm font-semibold text-[#426e45]">Your enquiry has been sent to the seller.</div> : <form onSubmit={submitEnquiry} className="mt-3 space-y-3 rounded-2xl border border-stone-200 bg-white p-4"><p className="text-xs text-stone-500">Submit an enquiry about <strong>{product.name}</strong>.</p><div className="grid gap-3 sm:grid-cols-2"><input name="quantity" required placeholder="Requested quantity" className="rounded-xl border border-stone-200 px-3 py-2.5 text-sm outline-none focus:border-[#789456]" /><select name="province" required defaultValue={product.province} className="rounded-xl border border-stone-200 bg-white px-3 py-2.5 text-sm">{PROVINCES_LIST.map((province) => <option key={province.id} value={province.name}>{province.name}</option>)}</select></div><textarea name="message" required minLength={5} placeholder="How can the seller help?" rows={3} className="w-full rounded-xl border border-stone-200 px-3 py-2.5 text-sm outline-none focus:border-[#789456]" /><button className="rounded-xl bg-[#1d4d32] px-4 py-2.5 text-sm font-bold text-white hover:bg-[#103b25]">Send enquiry</button></form>)}
          <p className="mt-4 flex items-start gap-2 text-[11px] leading-5 text-stone-400"><Check size={14} className="mt-0.5 shrink-0" /> Product stock and pricing are revalidated by the server before checkout. No payment is processed.</p>
        </div>
      </div>
    </div>
  );
}
