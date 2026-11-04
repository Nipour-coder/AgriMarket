import { Suspense } from 'react';
import TrackOrder from './track-order';

export default function TrackOrderPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <Suspense fallback={<div className="mx-auto max-w-2xl px-5 py-24 text-center text-sm text-stone-500">Loading demo tracking…</div>}>
      <TrackOrderContent params={params} />
    </Suspense>
  );
}

async function TrackOrderContent({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <TrackOrder orderId={decodeURIComponent(id)} />;
}
