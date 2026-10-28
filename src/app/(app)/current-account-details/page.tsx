'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useAppData } from '@/hooks/use-app-data';
import { ArrowRight } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function CurrentAccountDetailsPage() {
  const { appData } = useAppData();
  const router = useRouter();
  const mainAccount = appData.accounts.find(acc => acc.type === 'Savings' || acc.type === 'Sampann current');

  if (!mainAccount) {
    return <div>No savings or current account found.</div>;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">{mainAccount.type} Account</h1>
      
      <Card>
        <CardContent className="p-6">
          <p className="text-sm text-muted-foreground">Available Balance</p>
          <p className="text-4xl font-bold mt-1">₹{mainAccount.balance.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
          <p className="text-sm text-muted-foreground mt-4">A/C No: {mainAccount.accountNumber}</p>
        </CardContent>
      </Card>

      <div className="space-y-2">
        <ActionItem label="View Mini Statement" onClick={() => router.push('/passbook')} />
        <ActionItem label="Fund Transfer" onClick={() => router.push('/fund-transfer')} />
        <ActionItem label="More Actions" onClick={() => router.push('/account-actions')} />
      </div>
    </div>
  );
}

function ActionItem({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <Card className="hover:bg-accent cursor-pointer" onClick={onClick}>
      <CardContent className="p-4 flex items-center justify-between">
        <p className="font-semibold">{label}</p>
        <ArrowRight className="h-5 w-5 text-muted-foreground" />
      </CardContent>
    </Card>
  );
}
