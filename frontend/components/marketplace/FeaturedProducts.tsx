'use client';

import { useEffect, useState } from 'react';
import StoreProductCard from '@/components/marketplace/StoreProductCard';
import type { Product } from '@/lib/types';
import { MOCK_PRODUCTS } from '@/data/mockData';

export default function FeaturedProducts() {
  const [products, setProducts] = useState<Product[]>(MOCK_PRODUCTS.slice(0, 4));

  useEffect(() => {
    fetch('/api/products', { cache: 'no-store' })
      .then(async (response) => {
        if (!response.ok) return;
        const result = (await response.json()) as Product[];
        if (Array.isArray(result) && result.length > 0) {
          setProducts(result.slice(0, 4));
        }
      })
      .catch((error: unknown) => {
        console.warn('Backend unavailable, using demonstration listings:', error);
      });
  }, []);

  if (!products.length) {
    return (
      <p className="rounded-2xl border border-dashed border-stone-300 bg-white p-8 text-center text-sm text-stone-500">
        No verified listings are available yet. Check back as sellers are approved.
      </p>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {products.map((product) => (
        <StoreProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}
