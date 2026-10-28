
import TransactionReceiptClientPage from '../client-page';

export default function TransactionReceiptPage({ params }: { params: { id: string } }) {
  // This page is a fallback. The main receipt logic is in the state-driven
  // TransactionReceiptClientPage component which is rendered as an overlay.
  // We provide a fallback implementation here for direct linking if necessary.
  return (
    <div className="p-4">
      <TransactionReceiptClientPage transactionId={params.id} onDone={() => window.history.back()} />
    </div>
  );
}
