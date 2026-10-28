
import PaymentClientPage from './client-page';

export default function PaymentPage({ params }: { params: { id: string } }) {
  return <PaymentClientPage payeeId={params.id} />;
}
