
import TransactionReceiptClientPage from './client-page';

export default async function TransactionReceiptPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  // This page is a fallback. The main receipt logic is in the state-driven
  // TransactionReceiptClientPage component which is rendered as an overlay.
  // We provide a fallback implementation here for direct linking if necessary.
  return (
    <div className="p-4">
      <TransactionReceiptClientPage transactionId={id} onDone={() => window.history.back()} />
    </div>
  );
}
