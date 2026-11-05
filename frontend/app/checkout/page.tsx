'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ArrowRight, Check, CreditCard, MapPin, PackageCheck, Store, Truck } from 'lucide-react';
import { MOCK_PRODUCTS, PROVINCES_LIST } from '@/data/mockData';
import { useStore } from '@/lib/store';
import { apiFetch } from '@/lib/apiFetch';

const money = (amount: number) => new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR', maximumFractionDigits: 2 }).format(amount);
const steps = ['Your details', 'Delivery address', 'Delivery method', 'Payment', 'Review'];
type Delivery = 'standard' | 'express' | 'collection' | 'scheduled';

export default function CheckoutPage() {
  const { cart, subtotal, placeDemoOrder, hydrated } = useStore();
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [delivery, setDelivery] = useState<Delivery>('standard');
  const [payment, setPayment] = useState('Demo online payment');
  const [saveAddress, setSaveAddress] = useState(false);
  const [error, setError] = useState('');
  const [customer, setCustomer] = useState({ name: '', email: '', phone: '' });
  const [address, setAddress] = useState({ province: 'Gauteng', city: '', suburb: '', street: '', postalCode: '', instructions: '' });
  const [deliveryDate, setDeliveryDate] = useState('');
  const items = useMemo(() => cart.map((line) => ({ ...line, product: line.product ?? MOCK_PRODUCTS.find((product) => product.id === line.productId) })).filter((line) => line.product), [cart]);

  useEffect(() => {
    apiFetch('/api/auth/me', { cache: 'no-store' }).then(async (response) => {
      if (!response.ok) throw new Error('Unable to load your account.');
      const result = await response.json() as { user?: { name: string; email: string; phone: string } | null };
      if (result.user) setCustomer(result.user);
    }).catch((issue: unknown) => console.error('Unable to load checkout account details', issue));
    apiFetch('/api/addresses', { cache: 'no-store' }).then(async (response) => {
      if (!response.ok) return;
      const result = await response.json() as { recipientName: string; phone: string; province: string; city: string; suburb: string; street: string; postalCode: string; instructions: string; isDefault: boolean }[];
      const preferred = result.find((item) => item.isDefault) ?? result[0];
      if (!preferred) return;
      setCustomer((current) => ({ ...current, name: preferred.recipientName, phone: preferred.phone }));
      setAddress({
        province: preferred.province,
        city: preferred.city,
        suburb: preferred.suburb,
        street: preferred.street,
        postalCode: preferred.postalCode,
        instructions: preferred.instructions,
      });
    }).catch((issue: unknown) => console.error('Unable to load saved addresses', issue));
  }, []);

  if (!hydrated) return <div className="mx-auto max-w-xl px-5 py-24 text-center text-sm text-stone-500">Loading your saved cart…</div>;
  if (!items.length) return <div className="mx-auto max-w-xl px-5 py-24 text-center"><h1 className="text-2xl font-extrabold text-[#20372a]">Your cart is empty</h1><p className="mt-2 text-sm text-stone-500">Add products before starting checkout.</p><Link href="/shop" className="mt-5 inline-block rounded-full bg-[#1d4d32] px-5 py-3 text-sm font-bold text-white">Browse products</Link></div>;

  const sellerCount = new Set(items.map((item) => item.product!.sellerId)).size;
  const shipmentGroups = Array.from(new Map(items.map((item) => [item.product!.sellerId, item.product!.seller] as const)).values());
  const sameProvince = items.every((item) => item.product!.province === address.province);
  const specialHandling = items.some((item) => ['Livestock', 'Livestock and Animal Products', 'Agricultural Services'].includes(item.product!.category));
  const options: { id: Delivery; title: string; estimate: string; fee: number; description: string }[] = [
    ...(!specialHandling ? [{ id: 'standard' as const, title: 'Standard delivery', estimate: sameProvince ? 'Estimated 3–7 business days' : 'Estimated 5–10 business days', fee: (sameProvince ? 120 : 180) * sellerCount, description: 'Availability and timing must be confirmed by each seller.' }] : []),
    ...(!specialHandling && sameProvince ? [{ id: 'express' as const, title: 'Express delivery', estimate: 'Estimated 1–2 business days', fee: 260 * sellerCount, description: 'Demo option for same-province deliveries only.' }] : []),
    { id: 'collection', title: 'Farm or seller collection', estimate: 'Arrange a collection time with the seller', fee: 0, description: 'Collection locations are shown from the demo seller profiles.' },
    ...(!specialHandling && sameProvince ? [{ id: 'scheduled' as const, title: 'Scheduled delivery', estimate: 'Choose a requested delivery date', fee: 150 * sellerCount, description: 'Date selection is a request, not a confirmed booking.' }] : []),
  ];
  const chosenOption = options.find((option) => option.id === delivery) ?? options[0];
  const deliveryFee = chosenOption.fee;

  const setAddressField = (field: keyof typeof address, value: string) => setAddress((current) => ({ ...current, [field]: value }));
  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    if (step < 4) {
      if (step === 2 && delivery === 'scheduled' && !deliveryDate) {
        setError('Choose a requested delivery date to continue.');
        return;
      }
      if (step === 2 && !options.some((option) => option.id === delivery)) setDelivery(options[0].id);
      setStep((current) => current + 1);
      return;
    }

    try {
      if (saveAddress) {
        const addressResponse = await apiFetch('/api/addresses', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            label: 'Checkout address',
            recipientName: customer.name,
            phone: customer.phone,
            ...address,
            isDefault: false,
          }),
        });
        const addressResult = await addressResponse.json() as { error?: string };
        if (!addressResponse.ok) throw new Error(addressResult.error ?? 'Unable to save this address.');
      }
      const order = await placeDemoOrder({ customer, address, delivery, payment, deliveryFee, ...(delivery === 'scheduled' ? { deliveryDate } : {}) });
      router.push(`/order-confirmation/${encodeURIComponent(order.id)}`);
    } catch (issue) {
      setError(issue instanceof Error ? issue.message : 'Unable to create the demo order. Please review your cart.');
    }
  };

  const updateCustomer = (field: keyof typeof customer, value: string) => setCustomer((current) => ({ ...current, [field]: value }));
  const demoPayTypes = ['Demo online payment', 'Demo instant EFT', 'Payment on collection (demo)'];

  return (
    <div className="mx-auto max-w-6xl px-5 py-9 sm:py-12">
      <Link href="/cart" className="inline-flex items-center gap-2 text-sm font-semibold text-stone-500 hover:text-[#1d4d32]"><ArrowLeft size={16} /> Back to cart</Link>
      <div className="mt-5 grid gap-8 lg:grid-cols-[1fr_330px]">
        <div>
          <div className="mb-7"><p className="text-xs font-bold uppercase tracking-[.15em] text-[#789456]">Secure your selection</p><h1 className="mt-1 text-3xl font-extrabold text-[#20372a]">Checkout</h1></div>
          <ol className="mb-7 grid grid-cols-5 gap-1" aria-label="Checkout progress">{steps.map((label, index) => <li key={label} className="text-center"><div className={`mx-auto grid h-8 w-8 place-items-center rounded-full text-xs font-extrabold ${step >= index ? 'bg-[#1d4d32] text-white' : 'bg-stone-200 text-stone-500'}`}>{step > index ? <Check size={15} /> : index + 1}</div><span className={`mt-2 hidden text-[10px] font-semibold sm:block ${step === index ? 'text-[#1d4d32]' : 'text-stone-400'}`}>{label}</span></li>)}</ol>

          <form onSubmit={handleSubmit} className="rounded-3xl border border-stone-200 bg-white p-5 sm:p-7">
            {step === 0 && <section><h2 className="flex items-center gap-2 text-xl font-extrabold text-[#20372a]"><span className="grid h-8 w-8 place-items-center rounded-full bg-[#e8eedc] text-sm text-[#426e45]">1</span>Your details</h2><p className="mt-2 text-sm text-stone-500">Who should receive updates about this demo order?</p><div className="mt-5 grid gap-4 sm:grid-cols-2"><label className="sm:col-span-2"><span className="mb-1.5 block text-xs font-bold text-stone-600">Full name</span><input autoComplete="name" required value={customer.name} onChange={(event) => updateCustomer('name', event.target.value)} className="w-full rounded-xl border border-stone-200 px-3.5 py-3 text-sm outline-none focus:border-[#789456]" /></label><label><span className="mb-1.5 block text-xs font-bold text-stone-600">Email address</span><input type="email" autoComplete="email" required value={customer.email} onChange={(event) => updateCustomer('email', event.target.value)} className="w-full rounded-xl border border-stone-200 px-3.5 py-3 text-sm outline-none focus:border-[#789456]" /></label><label><span className="mb-1.5 block text-xs font-bold text-stone-600">South African phone number</span><input type="tel" autoComplete="tel" required pattern="(\+27|0)[0-9 ]{9,12}" title="Enter a South African phone number" value={customer.phone} onChange={(event) => updateCustomer('phone', event.target.value)} placeholder="+27 82 123 4567" className="w-full rounded-xl border border-stone-200 px-3.5 py-3 text-sm outline-none focus:border-[#789456]" /></label></div></section>}

            {step === 1 && <section><h2 className="flex items-center gap-2 text-xl font-extrabold text-[#20372a]"><span className="grid h-8 w-8 place-items-center rounded-full bg-[#e8eedc] text-sm text-[#426e45]">2</span>Delivery address</h2><p className="mt-2 text-sm text-stone-500">We use this to check which demo delivery options may be available.</p><div className="mt-5 grid gap-4 sm:grid-cols-2"><label><span className="mb-1.5 block text-xs font-bold text-stone-600">Province</span><select required value={address.province} onChange={(event) => setAddressField('province', event.target.value)} className="w-full rounded-xl border border-stone-200 bg-white px-3.5 py-3 text-sm outline-none focus:border-[#789456]">{PROVINCES_LIST.map((item) => <option key={item.id} value={item.name}>{item.name}</option>)}</select></label><label><span className="mb-1.5 block text-xs font-bold text-stone-600">City or town</span><input required value={address.city} onChange={(event) => setAddressField('city', event.target.value)} className="w-full rounded-xl border border-stone-200 px-3.5 py-3 text-sm outline-none focus:border-[#789456]" /></label><label><span className="mb-1.5 block text-xs font-bold text-stone-600">Suburb</span><input required value={address.suburb} onChange={(event) => setAddressField('suburb', event.target.value)} className="w-full rounded-xl border border-stone-200 px-3.5 py-3 text-sm outline-none focus:border-[#789456]" /></label><label><span className="mb-1.5 block text-xs font-bold text-stone-600">Postal code</span><input required inputMode="numeric" pattern="[0-9]{4}" value={address.postalCode} onChange={(event) => setAddressField('postalCode', event.target.value)} className="w-full rounded-xl border border-stone-200 px-3.5 py-3 text-sm outline-none focus:border-[#789456]" /></label><label className="sm:col-span-2"><span className="mb-1.5 block text-xs font-bold text-stone-600">Street address / farm name</span><input required value={address.street} onChange={(event) => setAddressField('street', event.target.value)} className="w-full rounded-xl border border-stone-200 px-3.5 py-3 text-sm outline-none focus:border-[#789456]" /></label><label className="sm:col-span-2"><span className="mb-1.5 block text-xs font-bold text-stone-600">Delivery instructions (optional)</span><textarea rows={2} value={address.instructions} onChange={(event) => setAddressField('instructions', event.target.value)} className="w-full rounded-xl border border-stone-200 px-3.5 py-3 text-sm outline-none focus:border-[#789456]" /></label></div><label className="mt-4 flex items-center gap-2 text-xs font-semibold text-stone-600"><input type="checkbox" checked={saveAddress} onChange={(event) => setSaveAddress(event.target.checked)} className="accent-[#1d4d32]" /> Save this address on this device for future demo orders</label></section>}

            {step === 2 && <section><h2 className="flex items-center gap-2 text-xl font-extrabold text-[#20372a]"><span className="grid h-8 w-8 place-items-center rounded-full bg-[#e8eedc] text-sm text-[#426e45]">3</span>Choose delivery method</h2><p className="mt-2 text-sm text-stone-500">Options are calculated for {sellerCount} seller {sellerCount === 1 ? 'group' : 'groups'} and your selected province.</p><div className="mt-5 space-y-3">{options.map((option) => <label key={option.id} className={`flex cursor-pointer gap-3 rounded-2xl border p-4 transition ${delivery === option.id ? 'border-[#6f8b50] bg-[#f3f6eb]' : 'border-stone-200 hover:bg-stone-50'}`}><input type="radio" name="delivery" checked={delivery === option.id} onChange={() => setDelivery(option.id)} className="mt-1 accent-[#1d4d32]" /><span className="flex-1"><span className="flex flex-wrap items-center justify-between gap-2 text-sm font-extrabold text-[#20372a]">{option.title}<span className="text-[#1d4d32]">{option.fee ? money(option.fee) : 'No delivery fee'}</span></span><span className="mt-1 block text-xs font-semibold text-stone-600">{option.estimate}</span><span className="mt-1 block text-[11px] leading-5 text-stone-500">{option.description}</span>{option.id === 'collection' ? <span className="mt-2 block space-y-1 text-[11px] text-stone-500">{shipmentGroups.map((seller) => <span key={seller.id} className="block">{seller.businessName}: {seller.address}</span>)}</span> : <span className="mt-3 block space-y-1 border-t border-stone-200/70 pt-2 text-[10px] leading-4 text-stone-500">{shipmentGroups.map((seller) => <span key={seller.id} className="block">{seller.businessName} · {seller.province} · {option.estimate} · {money(option.fee / sellerCount)} demo fee</span>)}</span>}</span></label>)}</div>{delivery === 'scheduled' && <label className="mt-4 block"><span className="mb-1.5 block text-xs font-bold text-stone-600">Requested date</span><input type="date" min={new Date(Date.now() + 86400000).toISOString().slice(0, 10)} required value={deliveryDate} onChange={(event) => setDeliveryDate(event.target.value)} className="rounded-xl border border-stone-200 px-3.5 py-3 text-sm outline-none focus:border-[#789456]" /></label>}<p className="mt-4 rounded-xl bg-amber-50 p-3 text-xs leading-5 text-amber-900">Delivery options are mock rules only. Actual availability, fees and estimates require seller and courier confirmation.</p></section>}

            {step === 3 && <section><h2 className="flex items-center gap-2 text-xl font-extrabold text-[#20372a]"><span className="grid h-8 w-8 place-items-center rounded-full bg-[#e8eedc] text-sm text-[#426e45]">4</span>Payment</h2><p className="mt-2 text-sm text-stone-500">Choose a demonstration payment option. No payment is taken.</p><div className="mt-5 space-y-3">{demoPayTypes.map((option) => <label key={option} className={`flex cursor-pointer items-center gap-3 rounded-2xl border p-4 ${payment === option ? 'border-[#6f8b50] bg-[#f3f6eb]' : 'border-stone-200'}`}><input type="radio" name="payment" checked={payment === option} onChange={() => setPayment(option)} className="accent-[#1d4d32]" /><CreditCard size={18} className="text-[#789456]" /><span><strong className="block text-sm text-[#20372a]">{option}</strong><small className="text-xs text-stone-500">Demo selection only — not a real payment provider</small></span></label>)}</div><p className="mt-4 text-xs leading-5 text-stone-500">Do not enter or share card or banking details. This prototype does not collect payment credentials or mark real payments as paid.</p></section>}

            {step === 4 && <section><h2 className="flex items-center gap-2 text-xl font-extrabold text-[#20372a]"><span className="grid h-8 w-8 place-items-center rounded-full bg-[#e8eedc] text-sm text-[#426e45]">5</span>Review your order</h2><div className="mt-5 space-y-4 rounded-2xl bg-[#f8f8f4] p-4 text-sm"><div><p className="font-bold text-[#20372a]">Customer</p><p className="mt-1 text-xs leading-5 text-stone-600">{customer.name} · {customer.email} · {customer.phone}</p></div><div><p className="flex items-center gap-1 font-bold text-[#20372a]"><MapPin size={14} /> {delivery === 'collection' ? 'Collection points' : 'Delivery address'}</p><p className="mt-1 text-xs leading-5 text-stone-600">{delivery === 'collection' ? Array.from(new Map(items.map((item) => [item.product!.sellerId, item.product!.seller.address])).values()).join(' · ') : `${address.street}, ${address.suburb}, ${address.city}, ${address.province} ${address.postalCode}`}{address.instructions && delivery !== 'collection' ? ` · Instructions: ${address.instructions}` : ''}</p></div><div><p className="flex items-center gap-1 font-bold text-[#20372a]">{delivery === 'collection' ? <Store size={14} /> : <Truck size={14} />} {chosenOption.title}</p><p className="mt-1 text-xs text-stone-600">{chosenOption.estimate}{delivery === 'scheduled' ? ` · Requested ${deliveryDate}` : ''} · {money(deliveryFee)}</p></div><div><p className="flex items-center gap-1 font-bold text-[#20372a]"><CreditCard size={14} /> Payment</p><p className="mt-1 text-xs text-stone-600">{payment} (not processed)</p></div><div className="border-t border-stone-200 pt-3">{items.map((item) => <div key={item.product!.id} className="flex justify-between gap-3 py-1 text-xs text-stone-600"><span>{item.quantity} × {item.product!.name}</span><span className="shrink-0 font-semibold text-stone-800">{money((item.product!.price ?? 0) * item.quantity)}</span></div>)}</div></div><p className="mt-4 rounded-xl bg-green-50 p-3 text-xs font-semibold leading-5 text-[#426e45]"><PackageCheck size={15} className="mr-1 inline" />Placing the order creates a local demo order. No seller, courier or payment provider will be contacted.</p></section>}

            {error && <p role="alert" className="mt-5 rounded-xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{error}</p>}
            <div className="mt-7 flex flex-wrap justify-between gap-3 border-t border-stone-100 pt-5">
              {step > 0 ? <button type="button" onClick={() => { setError(''); setStep((current) => current - 1); }} className="rounded-xl border border-stone-200 px-5 py-3 text-sm font-bold text-stone-600 hover:bg-stone-50">Previous step</button> : <span />}
              <button type="submit" className="ml-auto inline-flex items-center gap-2 rounded-xl bg-[#1d4d32] px-5 py-3 text-sm font-bold text-white hover:bg-[#103b25]">{step === 4 ? 'Place demo order' : 'Continue'}{step < 4 && <ArrowRight size={16} />}</button>
            </div>
          </form>
        </div>

        <aside className="h-fit rounded-3xl border border-stone-200 bg-white p-5 lg:sticky lg:top-28">
          <h2 className="font-extrabold text-[#20372a]">Order summary</h2><div className="mt-4 max-h-64 space-y-3 overflow-y-auto">{items.map((item) => <div key={item.product!.id} className="flex gap-3"><img src={item.product!.image} alt="" className="h-14 w-14 rounded-xl object-cover" /><div className="min-w-0 flex-1"><p className="line-clamp-2 text-xs font-bold text-stone-700">{item.product!.name}</p><p className="mt-1 text-[11px] text-stone-500">Qty {item.quantity} · {item.product!.seller.businessName}</p></div><span className="shrink-0 text-xs font-bold text-stone-700">{money((item.product!.price ?? 0) * item.quantity)}</span></div>)}</div>
          <div className="mt-4 space-y-2 border-t border-stone-100 pt-4 text-sm"><div className="flex justify-between text-stone-600"><span>Subtotal</span><span>{money(subtotal)}</span></div><div className="flex justify-between text-stone-600"><span>Delivery</span><span>{step < 2 ? 'At next step' : money(deliveryFee)}</span></div><div className="flex justify-between border-t border-stone-100 pt-3 text-base font-extrabold text-[#20372a]"><span>Total</span><span>{money(subtotal + (step < 2 ? 0 : deliveryFee))}</span></div></div>
          <p className="mt-3 text-[10px] leading-4 text-stone-400">Final amounts must be recalculated and confirmed by a backend in a production service.</p>
        </aside>
      </div>
    </div>
  );
}
