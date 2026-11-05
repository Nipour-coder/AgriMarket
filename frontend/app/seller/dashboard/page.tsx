'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/apiFetch';

type Summary = {
  businessName: string;
  verificationStatus: 'Pending Verification' | 'Under Review' | 'Verified' | 'Rejected' | 'Suspended';
  verificationReason: string | null;
};
type Notification = { id: string; message: string; createdAt: string };

export default function SellerDashboardPage() {
  const [profile, setProfile] = useState<Summary | null>(null);
  const [productCount, setProductCount] = useState(0);
  const [orderCount, setOrderCount] = useState(0);
  const [enquiryCount, setEnquiryCount] = useState(0);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const [verificationResponse, productsResponse, ordersResponse, enquiriesResponse, notificationsResponse] = await Promise.all([
          apiFetch('/api/seller/verification', { cache: 'no-store' }),
          apiFetch('/api/seller/products', { cache: 'no-store' }),
          apiFetch('/api/orders', { cache: 'no-store' }),
          apiFetch('/api/enquiries', { cache: 'no-store' }),
          apiFetch('/api/notifications', { cache: 'no-store' }),
        ]);
        const [verification, products, orders, enquiries, userNotifications] = await Promise.all([
          verificationResponse.json(), productsResponse.json(), ordersResponse.json(), enquiriesResponse.json(), notificationsResponse.json(),
        ]) as [
          { profile?: Summary; error?: string },
          unknown[] | { error?: string },
          unknown[] | { error?: string },
          unknown[] | { error?: string },
          Notification[] | { error?: string },
        ];
        if (!verificationResponse.ok || !verification.profile) throw new Error(verification.error ?? 'Unable to load your seller account.');
        if (!productsResponse.ok || !Array.isArray(products)) throw new Error('error' in products ? products.error : 'Unable to load seller products.');
        if (!ordersResponse.ok || !Array.isArray(orders)) throw new Error('error' in orders ? orders.error : 'Unable to load seller orders.');
        if (!enquiriesResponse.ok || !Array.isArray(enquiries)) throw new Error('error' in enquiries ? enquiries.error : 'Unable to load seller enquiries.');
        if (!notificationsResponse.ok || !Array.isArray(userNotifications)) throw new Error('error' in userNotifications ? userNotifications.error : 'Unable to load account notifications.');
        setProfile(verification.profile);
        setProductCount(products.length);
        setOrderCount(orders.length);
        setEnquiryCount(enquiries.length);
        setNotifications(userNotifications);
      } catch (issue) {
        setError(issue instanceof Error ? issue.message : 'Unable to load seller dashboard.');
      }
    };
    void load();
  }, []);

  const status = profile?.verificationStatus ?? 'Pending Verification';
  return (
    <div className="mx-auto max-w-6xl px-5 py-12">
      <p className="text-xs font-bold uppercase tracking-[.15em] text-[#789456]">Seller portal</p>
      <h1 className="mt-2 text-3xl font-extrabold text-[#20372a]">Seller dashboard</h1>
      <p className="mt-2 text-sm text-stone-500">{profile?.businessName ?? 'Your farm or business'}</p>
      {error && <p role="alert" className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-800">{error}</p>}

      <div className={`mt-6 rounded-2xl border p-4 ${status === 'Verified' ? 'border-green-200 bg-green-50' : status === 'Rejected' || status === 'Suspended' ? 'border-red-200 bg-red-50' : 'border-amber-200 bg-amber-50'}`}>
        <p className="text-sm font-extrabold text-stone-900">Verification status: {status}</p>
        <p className="mt-1 text-xs leading-5 text-stone-700">{status === 'Verified' ? 'Your account is approved and eligible to publish listings.' : 'Seller listings remain private until verification is complete. Secure document uploads are not yet enabled.'}</p>
        {profile?.verificationReason && <p className="mt-2 text-xs font-semibold text-red-900">Administrator reason: {profile.verificationReason}</p>}
        {status === 'Verified' && <p className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-green-700 px-3 py-1.5 text-xs font-extrabold text-white">✓ Official AgriMarket Verified badge</p>}
        <Link href="/seller/verification" className="mt-3 inline-flex rounded-full bg-[#1d4d32] px-4 py-2 text-xs font-bold text-white hover:bg-[#103b25]">Manage business verification →</Link>
      </div>

      {notifications.length > 0 && <section className="mt-5 rounded-2xl border border-blue-200 bg-blue-50 p-4"><h2 className="text-sm font-extrabold text-blue-950">Account notifications</h2><ul className="mt-2 space-y-3">{notifications.map((notification) => <li key={notification.id} className="border-t border-blue-100 pt-2 text-xs leading-5 text-blue-900"><p>{notification.message}</p><time className="mt-1 block text-[10px] text-blue-700">{new Date(notification.createdAt).toLocaleString('en-ZA')}</time></li>)}</ul></section>}

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <div className="rounded-3xl border border-stone-200 bg-white p-5"><p className="text-2xl font-extrabold text-[#20372a]">{productCount}</p><p className="mt-1 text-xs text-stone-500">Your products</p></div>
        <div className="rounded-3xl border border-stone-200 bg-white p-5"><p className="text-2xl font-extrabold text-[#20372a]">{orderCount}</p><p className="mt-1 text-xs text-stone-500">Incoming orders</p></div>
        <div className="rounded-3xl border border-stone-200 bg-white p-5"><p className="text-2xl font-extrabold text-[#20372a]">{enquiryCount}</p><p className="mt-1 text-xs text-stone-500">Buyer enquiries</p></div>
      </div>
      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        <Link href="/seller/products" className="rounded-2xl bg-[#1d4d32] p-5 text-sm font-extrabold text-white">Manage products →</Link>
        <Link href="/seller/orders" className="rounded-2xl border border-stone-200 bg-white p-5 text-sm font-extrabold text-[#20372a]">View orders →</Link>
        <Link href="/seller/enquiries" className="rounded-2xl border border-stone-200 bg-white p-5 text-sm font-extrabold text-[#20372a]">Respond to enquiries →</Link>
        <Link href="/seller/disputes" className="rounded-2xl border border-stone-200 bg-white p-5 text-sm font-extrabold text-[#20372a]">Complaints and resolutions →</Link>
      </div>
    </div>
  );
}
