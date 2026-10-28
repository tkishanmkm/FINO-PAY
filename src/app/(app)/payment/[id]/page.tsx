
import PaymentClientPage from './client-page';

export default async function PaymentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <PaymentClientPage payeeId={id} />;
}
