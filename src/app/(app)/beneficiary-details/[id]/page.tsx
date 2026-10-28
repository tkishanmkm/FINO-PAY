
import BeneficiaryDetailsClient from './client-page';

export default function BeneficiaryDetailsPage({ params }: { params: { id: string } }) {
  return <BeneficiaryDetailsClient payeeId={params.id} />;
}
