
import BeneficiaryDetailsClient from './client-page';

export default async function BeneficiaryDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <BeneficiaryDetailsClient payeeId={id} />;
}
