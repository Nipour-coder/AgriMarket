import DisputesWorkspace from '@/components/disputes/DisputesWorkspace';

export default async function SellerDisputesPage({ searchParams }: { searchParams: Promise<{ orderId?: string }> }) {
  const { orderId } = await searchParams;
  return <DisputesWorkspace role="seller" initialOrderId={orderId} />;
}
