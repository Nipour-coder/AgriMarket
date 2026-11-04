import { Suspense } from 'react';
import { redirect } from 'next/navigation';

export default function MarketplacePage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  return (
    <Suspense fallback={<div className="px-5 py-24 text-center text-sm text-stone-500">Redirecting to the shop…</div>}>
      <MarketplaceRedirect searchParams={searchParams} />
    </Suspense>
  );
}

async function MarketplaceRedirect({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const search = await searchParams;
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(search)) {
    if (typeof value !== 'string') continue;
    params.set(key === 'search' ? 'q' : key, value);
  }
  return redirect(`/shop${params.size ? `?${params.toString()}` : ''}`);
}
