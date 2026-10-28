
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAppData } from '@/hooks/use-app-data';
import { ArrowLeft, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { parseISO } from 'date-fns';
import { formatInTimeZone } from 'date-fns-tz';
import { cn } from '@/lib/utils';
import type { Transaction, Payee } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import TransactionReceiptClientPage from '../transaction-receipt/client-page';

const getInitials = (name: string = '') => {
  const parts = name.trim().split(' ').filter(Boolean);
  if (parts.length === 0) return '??';
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
};

const formatInIST = (dateString: string, formatString: string) => {
  try {
    const date = parseISO(dateString);
    return formatInTimeZone(date, 'Asia/Kolkata', formatString);
  } catch (e) {
    return dateString;
  }
};

export default function UpiPaymentPage() {
  const { appData, setAppData } = useAppData();
  const router = useRouter();
  const [upiId, setUpiId] = useState('');
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const { toast } = useToast();

  const recentUpiTransactions = appData.transactions
    .filter(t => t.category === 'UPI')
    .sort((a, b) => parseISO(b.date).getTime() - parseISO(a.date).getTime());
  
  const getPayeeForTxn = (txn: Transaction): Payee | undefined => {
      // Find by UPI ID first for accuracy
      let payee = appData.payees.find(p => p.upiId && p.upiId === txn.to);
      // Fallback to finding by name if no UPI ID match (for older data structures)
      if (!payee) {
          payee = appData.payees.find(p => p.name === txn.to);
      }
      return payee;
  }

  const getNameForUpiTxn = (txn: Transaction): string => {
    // Example description: "WTHDRL,UPI/CR/448833947478/SENDER NAME/ICIC" or "WTHDRL,UPI/DR/729987537012/<Name>fam"
    const parts = txn.description.split('/');
    if (parts.length > 3 && /^\d{12}$/.test(parts[2])) {
      return parts[3] || 'Unknown';
    }

    // Fallback logic
    if (txn.type === 'credit') {
      return txn.from || 'Unknown';
    } else { // debit
      const payee = getPayeeForTxn(txn);
      return payee?.name || (txn.to && txn.to.includes('@') ? txn.to.split('@')[0] : txn.to) || 'Unknown';
    }
  }

  const handleVerifyAndPay = () => {
    if (!upiId.trim() || !upiId.includes('@')) {
      toast({
        variant: 'destructive',
        title: 'Invalid UPI ID',
        description: 'Please enter a valid UPI ID in the format "name@bank".'
      })
      return;
    }

    // In a real app, you'd verify the UPI ID and get the payee name.
    // For this prototype, we'll create a temporary payee object.
    const tempPayee: Payee = {
      id: `temp_upi_${Date.now()}`,
      name: upiId.split('@')[0], // Use the part before '@' as a temporary name
      upiId: upiId,
      avatar: '',
      bankName: 'UPI Transaction',
    };

    // Temporarily add this payee to the app data so the payment page can find it.
    const existingPayee = appData.payees.find(p => p.id === tempPayee.id);
    if (!existingPayee) {
        setAppData({
            ...appData,
            payees: [...appData.payees, tempPayee]
        });
    }

    router.push(`/payment/${tempPayee.id}`);
  };

  if (selectedTransaction) {
    return <TransactionReceiptClientPage 
      transaction={selectedTransaction} 
      onDone={() => setSelectedTransaction(null)}
    />;
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
          <h1 className="text-xl font-semibold">Pay to UPI ID</h1>
        </div>
      </header>

      <main className="flex-1 p-4 space-y-6">
        <div className="bg-background p-4 rounded-lg shadow-sm">
          <label htmlFor="upi-id" className="text-sm font-medium text-muted-foreground">Enter receiver's UPI ID</label>
          <div className="flex items-center gap-2 mt-2">
            <Input
              id="upi-id"
              type="text"
              placeholder="name@bank"
              value={upiId}
              onChange={(e) => setUpiId(e.target.value)}
              className="h-12 text-base flex-1"
              onKeyPress={(e) => e.key === 'Enter' && handleVerifyAndPay()}
            />
            <Button size="icon" className="h-12 w-12 shrink-0 rounded-full" onClick={handleVerifyAndPay} disabled={!upiId}>
              <Send />
            </Button>
          </div>
        </div>

        <div>
          <h2 className="text-lg font-bold mb-2">Recent Payments</h2>
          <div className="bg-background rounded-lg">
            {recentUpiTransactions.map((txn, index) => {
              const name = getNameForUpiTxn(txn);
              const initials = getInitials(name);
              return (
                <div key={txn.id} onClick={() => setSelectedTransaction(txn)}>
                  <div className="p-4 flex items-center gap-4 cursor-pointer hover:bg-accent">
                    <Avatar className="h-11 w-11 text-base">
                      <AvatarFallback className="bg-primary/20 text-primary font-semibold">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="font-semibold">{name}</p>
                      {txn.to ? (
                        <p className="text-xs text-muted-foreground">{txn.to}</p>
                      ) : (
                        <p className="text-xs text-muted-foreground">{formatInIST(txn.date, 'dd MMM yyyy, hh:mm a')}</p>
                      )}
                    </div>
                    <p className={cn("font-bold text-base", txn.type === 'credit' ? 'text-green-600' : 'text-red-600')}>
                      {txn.type === 'credit' ? '+' : '-'}₹{txn.amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                  </div>
                  {index < recentUpiTransactions.length - 1 && <Separator />}
                </div>
              );
            })}
            {recentUpiTransactions.length === 0 && (
              <div className="text-center py-10 text-muted-foreground">
                <p>No recent UPI payments found.</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
