import { Suspense } from 'react';
import OrderConfirmation from './order-confirmation';

export default function OrderConfirmationPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <Suspense fallback={<div className="mx-auto max-w-2xl px-5 py-24 text-center text-sm text-stone-500">Loading demo order…</div>}>
      <OrderConfirmationContent params={params} />
    </Suspense>
  );
}

async function OrderConfirmationContent({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <OrderConfirmation orderId={decodeURIComponent(id)} />;
}
