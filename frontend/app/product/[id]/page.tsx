import { Suspense } from 'react';
import ProductDetails from './product-details';

export default function ProductPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <Suspense fallback={<div className="mx-auto max-w-6xl px-5 py-24 text-center text-sm text-stone-500">Loading product…</div>}>
      <ProductContent params={params} />
    </Suspense>
  );
}

async function ProductContent({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ProductDetails productId={id} />;
}
