import DisputesWorkspace from '@/components/disputes/DisputesWorkspace';

export default async function BuyerDisputesPage({ searchParams }: { searchParams: Promise<{ orderId?: string }> }) {
  const { orderId } = await searchParams;
  return <DisputesWorkspace role="buyer" initialOrderId={orderId} />;
}
