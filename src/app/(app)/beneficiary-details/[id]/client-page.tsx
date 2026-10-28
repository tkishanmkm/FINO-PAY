
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAppData } from '@/hooks/use-app-data';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ArrowLeft, Trash2 } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { parseISO } from 'date-fns';
import { formatInTimeZone } from 'date-fns-tz';
import { cn } from '@/lib/utils';
import TransactionReceiptClientPage from '../../transaction-receipt/client-page';
import type { Transaction } from '@/lib/types';

const getInitials = (name: string) => {
    const parts = name.trim().split(' ').filter(Boolean);
    if (parts.length === 0) return '??';
    if (parts.length === 1) {
      return parts[0].substring(0, 2).toUpperCase();
    }
    const firstInitial = parts[0][0];
    const lastInitial = parts[parts.length - 1][0];
    return `${firstInitial}${lastInitial}`.toUpperCase();
};

const formatInIST = (dateString: string, formatString: string) => {
  try {
    const date = parseISO(dateString);
    return formatInTimeZone(date, 'Asia/Kolkata', formatString);
  } catch (e) {
    return dateString;
  }
}

function DetailRow({ label, value }: { label: string, value: string | undefined }) {
  if (!value) return null;
  return (
    <div className="py-4">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="font-semibold text-foreground mt-1">{value}</p>
    </div>
  );
}

export default function BeneficiaryDetailsClient({ payeeId }: { payeeId: string }) {
  const router = useRouter();
  const { appData } = useAppData();
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);

  const payee = appData.payees.find(p => p.id === payeeId);

  // Find all transactions to this payee.
  const transactions = appData.transactions
    .filter(txn => txn.to === payee?.name && txn.type === 'debit')
    .sort((a, b) => parseISO(b.date).getTime() - parseISO(a.date).getTime());

  const handleViewReceipt = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
  };

  if (selectedTransaction) {
    return <TransactionReceiptClientPage 
      transaction={selectedTransaction} 
      onDone={() => setSelectedTransaction(null)}
    />;
  }
  
  if (!payee) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p>Beneficiary not found.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-secondary">
      <header className="bg-primary text-primary-foreground p-4">
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-8 w-8 -ml-2 text-primary-foreground hover:bg-white/20 hover:text-primary-foreground" 
            onClick={() => router.back()}
          >
            <ArrowLeft />
          </Button>
          <h1 className="text-xl font-semibold">Beneficiary Details</h1>
        </div>
      </header>
      
      <main className="flex-1 bg-secondary p-4 space-y-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                <Avatar className="h-14 w-14 text-xl">
                  <AvatarFallback className="bg-primary/20 text-primary font-semibold">
                    {getInitials(payee.name)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-lg font-bold text-foreground">{payee.name}</p>
                </div>
              </div>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
                <Trash2 className="h-5 w-5" />
              </Button>
            </div>
            
            <div className="mt-4 px-1">
              <DetailRow label="Account number" value={payee.accountNumber} />
              <Separator />
              <DetailRow label="Bank name" value={payee.bankName} />
              <Separator />
              <DetailRow label="IFSC code" value={payee.ifsc} />
              <Separator />
              <DetailRow label="Nickname" value={payee.nickname} />
            </div>
          </CardContent>
        </Card>

        {transactions.length > 0 && (
           <Card>
              <CardHeader>
                <CardTitle className="text-base">Recent Transactions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {transactions.map((transaction, index) => (
                    <div key={transaction.id}>
                        <div className="flex items-center justify-between">
                            <div>
                                <p className={cn("font-bold text-lg", transaction.type === 'credit' ? 'text-green-600' : 'text-red-600')}>
                                    ₹{transaction.amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </p>
                                <p className="text-xs text-muted-foreground mt-1">
                                    {formatInIST(transaction.date, 'dd MMM yyyy, hh:mm a')}
                                </p>
                            </div>
                            <Button variant="link" onClick={() => handleViewReceipt(transaction)}>
                                View Receipt
                            </Button>
                        </div>
                        {index < transactions.length - 1 && <Separator className="my-2" />}
                    </div>
                ))}
              </CardContent>
            </Card>
        )}
      </main>
      
      <footer className="p-4 border-t bg-background">
        <Button size="lg" className="w-full h-12 rounded-full" onClick={() => router.push(`/payment/${payee.id}`)}>
          Pay
        </Button>
      </footer>
    </div>
  );
}
