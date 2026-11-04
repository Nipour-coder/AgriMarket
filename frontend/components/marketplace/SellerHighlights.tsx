'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { MapPin } from 'lucide-react';
import { MOCK_SELLERS } from '@/data/mockData';

type Seller = {
  id: string;
  businessName: string;
  province: string;
  district: string;
  address: string;
  sector: string;
  productCount: number;
};

const DEFAULT_SELLERS: Seller[] = MOCK_SELLERS.map((seller) => ({
  id: seller.id,
  businessName: seller.businessName,
  province: seller.province,
  district: seller.district || seller.address,
  address: seller.address,
  sector: seller.primaryCommodities?.join(', ') || seller.description || 'Agriculture',
  productCount: seller.reviewsCount || 6,
}));

export default function SellerHighlights() {
  const [sellers, setSellers] = useState<Seller[]>(DEFAULT_SELLERS.slice(0, 3));

  useEffect(() => {
    fetch('/api/sellers', { cache: 'no-store' })
      .then(async (response) => {
        if (!response.ok) return;
        const data = (await response.json()) as Seller[];
        if (Array.isArray(data) && data.length > 0) {
          setSellers(data.slice(0, 3));
        }
      })
      .catch((error: unknown) => {
        console.warn('Backend unavailable, using demonstration seller highlights:', error);
      });
  }, []);

  if (!sellers.length) {
    return (
      <p className="rounded-2xl border border-dashed border-stone-300 bg-white p-8 text-center text-sm text-stone-500">
        Verified producers will appear here once seller applications are approved.
      </p>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-3">
      {sellers.slice(0, 3).map((seller) => (
        <article key={seller.id} className="rounded-3xl border border-stone-200 bg-white p-5">
          <div>
            <h3 className="font-extrabold text-[#20372a]">{seller.businessName}</h3>
            <p className="mt-1 flex items-center gap-1 text-xs text-stone-500">
              <MapPin size={13} />
              {seller.district || seller.address}, {seller.province}
            </p>
          </div>
          <p className="mt-4 line-clamp-2 text-sm leading-6 text-stone-500">{seller.sector}</p>
          <div className="mt-4 flex justify-between border-t border-stone-100 pt-4">
            <span className="text-xs text-stone-500">{seller.productCount} listings</span>
            <Link href="/shop" className="text-xs font-bold text-[#426e45]">
              View products →
            </Link>
          </div>
        </article>
      ))}
    </div>
  );
}
