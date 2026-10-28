
'use client';

import { useRouter } from 'next/navigation';
import { useAppData } from '@/hooks/use-app-data';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { CheckCircle, Clock, Share2 } from 'lucide-react';
import { format, parseISO } from 'date-fns';

const getInitials = (name: string = '') => {
    const parts = name.trim().split(' ').filter(Boolean);
    if (parts.length === 0) return '??';
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
};

const maskFromAccountNumber = (accountNumber: string = '') => {
  if (!accountNumber || accountNumber.length <= 4) return accountNumber;
  return `XXXXXXX${accountNumber.slice(-4)}`;
};

export default function TransactionReceiptClientPage({ transactionId, onDone }: { transactionId: string, onDone: () => void }) {
  const router = useRouter();
  const { appData } = useAppData();
  
  const transaction = appData.transactions.find(t => t.id === transactionId);
  const fromAccount = appData.accounts.find(a => a.type === 'Savings' || a.type === 'Sampaan current');
  const payee = appData.payees.find(p => p.name === transaction?.to);

  if (!transaction || !fromAccount) {
    return (
      <div className="flex h-screen items-center justify-center p-4 text-center">
        <div>
            <h1 className="text-xl font-bold">Transaction Not Found</h1>
            <p className="text-muted-foreground mt-2">The requested transaction details could not be found.</p>
            <Button onClick={onDone} className="mt-6">Go Back</Button>
        </div>
      </div>
    );
  }

  const txnDate = parseISO(transaction.date);

  return (
    <div className="flex flex-col h-screen bg-purple-700 text-primary-foreground">
        <main className="flex-1 flex flex-col items-center p-4 pt-6 text-center">
        <div className="h-14 w-14 bg-green-500 rounded-full flex items-center justify-center ring-8 ring-green-500/30 mb-3 shrink-0">
            <CheckCircle className="h-8 w-8 text-white" strokeWidth={1.5} />
        </div>
        <h1 className="text-lg font-semibold mb-1">Payment successful!</h1>
        <p className="text-3xl font-bold mb-1">₹{transaction.amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
        <div className="flex items-center gap-2 text-xs text-primary-foreground/80">
            <Clock className="h-3 w-3" />
            <span>Completed | {format(txnDate, "dd MMM yyyy, hh:mm a")}</span>
        </div>
        
        <Card className="w-full mt-4 text-left text-card-foreground">
            <CardContent className="p-3">
            <div className="flex justify-between items-center mb-3">
                <h2 className="font-bold text-base">Transaction Details</h2>
                <Share2 className="h-4 w-4 text-primary" />
            </div>
            <div className="space-y-3 text-xs">
                <div>
                    <p className="text-xs text-muted-foreground">From</p>
                    <div className="flex items-center gap-2 mt-1">
                    <Avatar className="h-8 w-8 border shrink-0">
                        <AvatarImage src={appData.appSettings.appLogo2} alt="FinoPay Logo 2"/>
                        <AvatarFallback className="text-white bg-primary">
                            <svg width="12" height="12" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M10.0002 0.333313L12.5668 7.63331H19.6668L14.0502 12.1666L16.1835 19.6666L10.0002 15L3.81683 19.6666L5.95016 12.1666L0.333496 7.63331H7.4335L10.0002 0.333313Z" fill="currentColor"/></svg>
                        </AvatarFallback>
                    </Avatar>
                    <div>
                        <p className="font-semibold text-sm">{maskFromAccountNumber(fromAccount?.accountNumber)}</p>
                        <p className="text-muted-foreground -mt-0.5 text-xs">FinoPay {fromAccount?.type} account</p>
                    </div>
                    </div>
                </div>

                {payee && (
                    <div>
                        <p className="text-xs text-muted-foreground">To</p>
                        <div className="flex items-center gap-2 mt-1">
                            <Avatar className="h-8 w-8 shrink-0">
                                <AvatarFallback className="bg-primary/20 text-primary font-semibold text-xs">{getInitials(payee?.nickname || payee?.name)}</AvatarFallback>
                            </Avatar>
                            <div>
                                <p className="font-semibold text-sm">{payee?.nickname || payee?.name}</p>
                                <p className="text-muted-foreground -mt-0.5 text-xs">A/c: {payee?.accountNumber}</p>
                            </div>
                        </div>
                    </div>
                )}
                
                {transaction.note && (
                <div className="flex items-start">
                    <p className="w-20 text-muted-foreground shrink-0">Note</p>
                    <p className="font-semibold flex-1 break-words">{transaction.note}</p>
                </div>
                )}
                <div className="flex items-start">
                <p className="w-20 text-muted-foreground shrink-0">Date & time</p>
                <p className="font-semibold flex-1 break-words">{format(txnDate, "dd MMM yyyy, hh:mm a")}</p>
                </div>
                <div className="flex items-start">
                <p className="w-20 text-muted-foreground shrink-0">Payment mode</p>
                <p className="font-semibold flex-1 break-words">{transaction.category}</p>
                </div>
                <div className="flex items-start">
                <p className="w-20 text-muted-foreground shrink-0">FinoPay Txn ID</p>
                <p className="font-semibold flex-1 break-all">{transaction.id}</p>
                </div>
            </div>
            </CardContent>
        </Card>
        </main>
        <footer className="p-4 flex gap-4 w-full bg-purple-700 mt-auto shrink-0">
            <Button variant="outline" className="flex-1 h-11 bg-primary-foreground/10 border-primary-foreground/20 text-primary-foreground hover:bg-primary-foreground/20" onClick={onDone}>
                Done
            </Button>
            {payee && (
                <Button className="flex-1 h-11 bg-primary-foreground text-primary hover:bg-primary-foreground/90" onClick={() => router.push(`/payment/${payee.id}`)}>
                    Pay again
                </Button>
            )}
        </footer>
    </div>
  )
}
