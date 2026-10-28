
'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAppData } from '@/hooks/use-app-data';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ArrowLeft, CheckCircle, ChevronRight, Clock, Share2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import type { Transaction } from '@/lib/types';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { parseISO } from 'date-fns';
import { formatInTimeZone } from 'date-fns-tz';

const getInitials = (name: string = '') => {
    const parts = name.trim().split(' ').filter(Boolean);
    if (parts.length === 0) return '??';
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
};

const maskAccountNumber = (accountNumber: string = '') => {
  if (!accountNumber || accountNumber.length <= 4) return accountNumber;
  return `XXXX XXXX XX${accountNumber.slice(-4)}`;
};

const maskFromAccountNumber = (accountNumber: string = '') => {
  if (!accountNumber || accountNumber.length <= 4) return accountNumber;
  return `XXXXXXX${accountNumber.slice(-4)}`;
};

const formatInIST = (dateString: string, formatString: string) => {
  try {
    const date = parseISO(dateString);
    return formatInTimeZone(date, 'Asia/Kolkata', formatString);
  } catch (e) {
    return dateString;
  }
};

const formatInISTFromDate = (date: Date, formatString: string) => {
    try {
        return formatInTimeZone(date, 'Asia/Kolkata', formatString);
    } catch(e) {
        return date.toISOString();
    }
}


export default function PaymentClientPage({ payeeId }: { payeeId: string }) {
  const router = useRouter();
  const { appData, setAppData } = useAppData();
  const { toast, dismiss } = useToast();
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [isNoteModalOpen, setIsNoteModalOpen] = useState(false);
  const [paymentSuccessData, setPaymentSuccessData] = useState<Transaction | null>(null);
  const [step, setStep] = useState<'enterAmount' | 'confirm' | 'otp'>('enterAmount');
  const [otp, setOtp] = useState('');
  const [generatedOtp, setGeneratedOtp] = useState('');
  const [timer, setTimer] = useState(180); // 3 minutes in seconds
  const timerRef = useRef<NodeJS.Timeout | null>(null);


  const payee = appData.payees.find(p => p.id === payeeId);
  const fromAccount = appData.accounts.find(a => a.type === 'Savings' || a.type === 'Sampann current');
  
  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Allow only numbers and a single decimal point
    if (/^\d*\.?\d{0,2}$/.test(value)) {
        setAmount(value);
    }
  };

  const getImpsCharge = (transferAmount: number) => {
    if (transferAmount <= 25000) return 5;
    if (transferAmount <= 100000) return 10;
    return 15;
  };

  const handleContinue = () => {
    const numericAmount = parseFloat(amount);
    if (!numericAmount || numericAmount <= 0) {
      toast({ variant: 'destructive', title: 'Invalid Amount', description: 'Please enter a valid amount.' });
      return;
    }
    
    const charge = getImpsCharge(numericAmount);
    const totalDebit = numericAmount + charge;

    if (!fromAccount || fromAccount.balance < totalDebit) {
        toast({ variant: 'destructive', title: 'Insufficient Funds', description: 'You do not have enough balance for this transaction.' });
        return;
    }
    setStep('confirm');
  }
  
  const startTimer = () => {
    setTimer(180);
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setTimer(prev => {
        if (prev <= 1) {
          if(timerRef.current) clearInterval(timerRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };
  
  const handleProceedToOtp = () => {
    const randomOtp = Math.floor(1000 + Math.random() * 9000).toString();
    setGeneratedOtp(randomOtp);
    setStep('otp');
    startTimer();

    setTimeout(() => {
        const { id } = toast({
            duration: 4000,
            description: (
              <div className="flex items-start gap-3">
                <Avatar className="h-10 w-10 border">
                    <AvatarImage src={appData.appSettings.messageAvatar} alt="Message Avatar" />
                    <AvatarFallback>
                        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M10.0002 0.333313L12.5668 7.63331H19.6668L14.0502 12.1666L16.1835 19.6666L10.0002 15L3.81683 19.6666L5.95016 12.1666L0.333496 7.63331H7.4335L10.0002 0.333313Z" fill="#D41E44"/></svg>
                    </AvatarFallback>
                </Avatar>
                <div className="flex-1 pt-1">
                    <p className="font-bold">VM-FINOBK</p>
                    <p>Dear Customer, Your OTP is {randomOtp} and is valid for only 180 sec. Do not share it wit...</p>
                </div>
              </div>
            ),
            className: 'bg-black/70 text-white border-0 backdrop-blur-sm toast-slide-up',
        });
    }, 500);
  };

  const handleVerifyOtp = () => {
    if (otp === generatedOtp) {
        handlePayment();
    } else {
        toast({
            variant: 'destructive',
            title: 'Invalid OTP',
            description: 'The OTP you entered is incorrect. Please try again.'
        });
    }
  }

  const handlePayment = () => {
    const numericAmount = parseFloat(amount);
    
    if (!numericAmount || numericAmount <= 0 || !fromAccount || !payee) {
        return; // Should not happen if logic is correct
    }

    const isUpiPayment = payee.id.startsWith('temp_upi_');
    const paymentCategory = isUpiPayment ? 'UPI' : 'IMPS';

    // Generate reference numbers
    const paymentRefNumber = `${Math.floor(100000000000 + Math.random() * 900000000000)}`;
    const nowInIST = new Date();
    
    let paymentDescription = '';
    let transactionsToAdd: Transaction[] = [];

    if (isUpiPayment) {
        const beneficiaryNameCaps = (payee.name || '').toUpperCase();
        const bankCode = (payee.upiId || '').split('@')[1] || '';
        paymentDescription = `WTHDRL,UPI/DR/${paymentRefNumber}/${beneficiaryNameCaps}/${bankCode}`;
        
        const paymentTransaction: Transaction = {
            id: paymentRefNumber,
            date: nowInIST.toISOString(),
            description: paymentDescription,
            amount: numericAmount,
            type: 'debit',
            category: 'UPI',
            to: payee.upiId,
            note: note,
            balanceAfter: fromAccount.balance - numericAmount,
        };
        transactionsToAdd.push(paymentTransaction);
        
        const updatedAccounts = appData.accounts.map(acc => 
            acc.id === fromAccount.id ? { ...acc, balance: fromAccount.balance - numericAmount } : acc
        );

        const updatedPayees = appData.payees.filter(p => p.id !== payee.id); // Clean up temp payee

        setAppData({
            ...appData,
            transactions: [paymentTransaction, ...appData.transactions],
            accounts: updatedAccounts,
            payees: updatedPayees,
        });
        setPaymentSuccessData(paymentTransaction);

    } else {
        // IMPS Payment with charges
        const charge = getImpsCharge(numericAmount);
        const beneficiaryNameCaps = payee.name.toUpperCase();
        const maskedBeneficiaryAccNum = (payee.accountNumber || '').length > 4 
            ? `XXXXXXXXXX${(payee.accountNumber || '').slice(-4)}` 
            : payee.accountNumber;

        paymentDescription = `WTHDRL,IMPS/DR/${paymentRefNumber}/${beneficiaryNameCaps}/${maskedBeneficiaryAccNum}`;

        const paymentTransaction: Transaction = {
            id: paymentRefNumber,
            date: nowInIST.toISOString(),
            description: paymentDescription,
            amount: numericAmount,
            type: 'debit',
            category: 'IMPS',
            to: payee.name,
            note: note,
            balanceAfter: fromAccount.balance - numericAmount,
        };
        
        const chargeTransaction: Transaction = {
            id: `CHG${paymentRefNumber}`,
            date: new Date(nowInIST.getTime() + 1000).toISOString(),
            description: `CHG,IMPS/DR/${paymentRefNumber}`,
            amount: charge,
            type: 'debit',
            category: 'Other',
            balanceAfter: fromAccount.balance - numericAmount - charge,
        };
        
        transactionsToAdd = [chargeTransaction, paymentTransaction];

        const updatedAccounts = appData.accounts.map(acc => 
            acc.id === fromAccount.id ? { ...acc, balance: fromAccount.balance - numericAmount - charge } : acc
        );
        
        setAppData({
            ...appData,
            transactions: [...transactionsToAdd, ...appData.transactions],
            accounts: updatedAccounts,
        });
        setPaymentSuccessData(paymentTransaction);
    }
  };

  useEffect(() => {
      return () => {
          if (timerRef.current) clearInterval(timerRef.current);
      }
  }, []);
  
  const handlePayAgain = () => {
    setPaymentSuccessData(null);
    setAmount('');
    setNote('');
    setOtp('');
    setStep('enterAmount');
  };

  if (paymentSuccessData) {
    const txnDate = parseISO(paymentSuccessData.date);
    const isUpiPayment = paymentSuccessData.category === 'UPI';
    return (
      <div className="flex flex-col h-screen bg-purple-700 text-primary-foreground">
        <main className="flex-1 flex flex-col items-center p-4 pt-6 text-center">
          <div className="h-14 w-14 bg-green-500 rounded-full flex items-center justify-center ring-8 ring-green-500/30 mb-3 shrink-0">
            <CheckCircle className="h-8 w-8 text-white" strokeWidth={1.5} />
          </div>
          <h1 className="text-lg font-semibold mb-1">Payment successful!</h1>
          <p className="text-3xl font-bold mb-1">₹{paymentSuccessData.amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
          <div className="flex items-center gap-2 text-xs text-primary-foreground/80">
            <Clock className="h-3 w-3" />
            <span>Completed | {formatInISTFromDate(txnDate, "dd MMM yyyy, hh:mm a")}</span>
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

                <div>
                   <p className="text-xs text-muted-foreground">To</p>
                    <div className="flex items-center gap-2 mt-1">
                        <Avatar className="h-8 w-8 shrink-0">
                           <AvatarFallback className="bg-primary/20 text-primary font-semibold text-xs">{getInitials(payee?.nickname || payee?.name)}</AvatarFallback>
                        </Avatar>
                        <div>
                            <p className="font-semibold text-sm">{payee?.nickname || payee?.name}</p>
                            <p className="text-muted-foreground -mt-0.5 text-xs">{isUpiPayment ? payee?.upiId : `A/c: ${payee?.accountNumber}`}</p>
                        </div>
                    </div>
                </div>
                
                {paymentSuccessData.note && (
                  <div className="flex items-start">
                    <p className="w-20 text-muted-foreground shrink-0">Note</p>
                    <p className="font-semibold flex-1 break-words">{paymentSuccessData.note}</p>
                  </div>
                )}
                <div className="flex items-start">
                  <p className="w-20 text-muted-foreground shrink-0">Date & time</p>
                  <p className="font-semibold flex-1 break-words">{formatInISTFromDate(txnDate, "dd MMM yyyy, hh:mm a")}</p>
                </div>
                <div className="flex items-start">
                  <p className="w-20 text-muted-foreground shrink-0">Payment mode</p>
                  <p className="font-semibold flex-1 break-words">{paymentSuccessData.category}</p>
                </div>
                <div className="flex items-start">
                  <p className="w-20 text-muted-foreground shrink-0">FinoPay Txn ID</p>
                  <p className="font-semibold flex-1 break-all">{paymentSuccessData.id}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </main>
        <footer className="p-4 flex gap-4 w-full bg-purple-700 mt-auto shrink-0">
          <Button variant="outline" className="flex-1 h-11 bg-primary-foreground/10 border-primary-foreground/20 text-primary-foreground hover:bg-primary-foreground/20" onClick={() => router.push('/dashboard')}>
            Okay
          </Button>
          <Button className="flex-1 h-11 bg-primary-foreground text-primary hover:bg-primary-foreground/90" onClick={handlePayAgain}>
            Pay again
          </Button>
        </footer>
      </div>
    )
  }

  if (!payee || !fromAccount) {
    return <div className="p-4">Payee or account not found.</div>;
  }
  
  const isUpiPayment = payee.id.startsWith('temp_upi_');
  
  if (step === 'otp') {
    return (
        <div className="flex flex-col h-screen bg-background p-6">
             <header className="flex items-center">
                <Button variant="ghost" size="icon" className="-ml-2" onClick={() => setStep('confirm')}>
                    <ArrowLeft />
                </Button>
            </header>
            <main className="flex-1 flex flex-col items-center justify-center text-center">
                <h1 className="text-2xl font-bold">Verify OTP</h1>
                <p className="text-muted-foreground mt-2">Enter the OTP sent to {appData.user.contact.phone}</p>
                
                <div className="relative my-12">
                    <div className="flex justify-center gap-3">
                        {[0, 1, 2, 3].map((i) => (
                            <div
                            key={i}
                            className={cn(
                                'h-14 w-14 rounded-lg border-2 flex items-center justify-center text-2xl font-bold',
                                otp.length > i ? 'border-primary' : 'border-input'
                            )}
                            >
                            {otp[i] || '-'}
                            </div>
                        ))}
                    </div>
                    <Input
                        type="tel"
                        inputMode="numeric"
                        value={otp}
                        onChange={(e) => /^\d{0,4}$/.test(e.target.value) && setOtp(e.target.value)}
                        className="absolute inset-0 h-full w-full opacity-0"
                        maxLength={4}
                        autoFocus
                    />
                </div>
                
                <div className="flex justify-between items-center w-full max-w-xs">
                    <div className="flex items-center gap-2 text-muted-foreground">
                        <Clock className="h-5 w-5" />
                        <span>
                            {Math.floor(timer / 60)}:{('0' + (timer % 60)).slice(-2)} Mins
                        </span>
                    </div>
                    <Button variant="link" className="text-primary" onClick={startTimer} disabled={timer > 0}>
                        Resend OTP &gt;
                    </Button>
                </div>
            </main>
            <footer className="mt-auto">
                <Button className="w-full h-12" onClick={handleVerifyOtp} disabled={otp.length !== 4}>
                    Verify
                </Button>
            </footer>
        </div>
    );
  }

  if (step === 'confirm') {
    const numericAmount = parseFloat(amount);
    const charge = isUpiPayment ? 0 : getImpsCharge(numericAmount);

    return (
      <div className="flex flex-col h-screen bg-background">
        <div className="flex flex-col bg-gradient-to-b from-purple-700 to-indigo-900 text-white pt-1 pb-2">
          <header className="px-2">
            <Button variant="ghost" size="icon" onClick={() => setStep('enterAmount')} className="h-8 w-8 text-white hover:bg-white/20 hover:text-white">
              <ArrowLeft />
            </Button>
          </header>
          <main className="flex-1 flex flex-col items-center text-center px-4">
            <Avatar className="h-12 w-12 text-xl mb-1 bg-white/20 ring-2 ring-white/30">
              <AvatarFallback className="bg-transparent font-semibold">{getInitials(payee.name)}</AvatarFallback>
            </Avatar>
            <h1 className="text-lg font-bold">{payee.name}</h1>
            <p className="text-white/80 text-xs">{isUpiPayment ? payee.upiId : payee.bankName}</p>
            {!isUpiPayment && <p className="text-white/80 text-xs">{maskAccountNumber(payee.accountNumber)}</p>}
            <p className="text-4xl font-bold mt-1">₹{numericAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
            <Button variant="link" onClick={() => setIsNoteModalOpen(true)} className="text-white/80 text-xs h-auto py-0 hover:text-white">
                {note ? `Note: ${note}` : 'Add a note'}
            </Button>
          </main>
        </div>
        <div className="p-4 bg-background space-y-4 flex-1 flex flex-col">
            <Card>
                <CardContent className="p-4 space-y-4">
                    <div>
                        <p className="text-sm text-muted-foreground mb-1">From (You)</p>
                        <div className="flex items-center gap-3">
                           <Avatar className="h-10 w-10 border">
                             <AvatarImage src={appData.appSettings.appLogo2} alt="FinoPay Logo 2"/>
                             <AvatarFallback>
                                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M10.0002 0.333313L12.5668 7.63331H19.6668L14.0502 12.1666L16.1835 19.6666L10.0002 15L3.81683 19.6666L5.95016 12.1666L0.333496 7.63331H7.4335L10.0002 0.333313Z" fill="#D41E44"/></svg>
                             </AvatarFallback>
                           </Avatar>
                           <div>
                                <p className="font-semibold">{maskFromAccountNumber(fromAccount.accountNumber)}</p>
                                <p className="text-sm text-muted-foreground">FinoPay {fromAccount.type} Account</p>
                           </div>
                        </div>
                    </div>

                    <Separator />

                    <div>
                        <p className="text-sm text-muted-foreground mb-1">To</p>
                        <div className="flex items-center gap-3">
                           <Avatar className="h-10 w-10">
                             <AvatarFallback className="bg-primary/20 text-primary font-semibold">{getInitials(payee.name)}</AvatarFallback>
                           </Avatar>
                           <div>
                                <p className="font-semibold">{payee.name}</p>
                                {isUpiPayment ? (
                                    <p className="text-sm text-muted-foreground">{payee.upiId}</p>
                                ) : (
                                    <>
                                        <p className="text-sm text-muted-foreground">Ac no: {payee.accountNumber}</p>
                                        <p className="text-sm text-muted-foreground">IFSC: {payee.ifsc}</p>
                                    </>
                                )}
                           </div>
                        </div>
                    </div>
                    
                    <Separator/>

                    <div className="flex justify-between items-center text-sm">
                        <p className="text-muted-foreground">Payment mode</p>
                        <p className="font-semibold">{isUpiPayment ? 'UPI' : 'IMPS'}</p>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                        <p className="text-muted-foreground">Payment charges</p>
                        <p className="font-semibold">₹ {charge.toFixed(2)}</p>
                    </div>
                </CardContent>
            </Card>

            <div className="mt-auto">
              <Button className="w-full h-14 text-lg font-semibold rounded-full" onClick={handleProceedToOtp}>
                  Pay
              </Button>
            </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[100dvh] bg-background">
      {/* Top purple gradient section */}
      <div className="flex-1 flex flex-col bg-gradient-to-b from-purple-700 to-indigo-900 text-white">
        <header className="p-2">
          <Button variant="ghost" size="icon" onClick={() => router.back()} className="h-8 w-8 text-white hover:bg-white/20 hover:text-white">
            <ArrowLeft />
          </Button>
        </header>

        <main className="flex-1 flex flex-col items-center justify-start text-center px-4 pt-0">
          <Avatar className="h-12 w-12 text-xl mb-1 bg-white/20 ring-2 ring-white/30">
            <AvatarFallback className="bg-transparent font-semibold">{getInitials(payee.name)}</AvatarFallback>
          </Avatar>
          <h1 className="text-lg font-bold">{payee.name}</h1>
           {isUpiPayment ? (
               <p className="text-xs text-white/80">{payee.upiId}</p>
           ) : (
                <>
                    <p className="text-xs text-white/80">{payee.bankName || 'Bank Details Not Available'}</p>
                    <p className="text-xs text-white/80">{maskAccountNumber(payee.accountNumber)}</p>
                </>
           )}
          
          <div className="my-auto w-full max-w-xs">
              <div className="relative flex items-center justify-center">
                  <span className="absolute left-3 text-4xl font-light text-white/80">₹</span>
                  <Input 
                      type="number"
                      inputMode="decimal"
                      value={amount}
                      onChange={handleAmountChange}
                      placeholder="0"
                      className="bg-transparent border-0 text-white text-6xl font-light h-auto text-center p-0 w-full focus-visible:ring-0 focus-visible:ring-offset-0"
                      autoFocus
                  />
              </div>
              
              <Button variant="link" onClick={() => setIsNoteModalOpen(true)} className="text-white/80 mt-1 hover:text-white bg-white/10 hover:bg-white/20 border-white/20 text-xs px-3 py-1 h-auto">
                  {note ? `Note: ${note}` : 'Add a note'}
              </Button>
          </div>
        </main>
      </div>
      
      {/* Bottom white section */}
      <footer className="p-4 bg-background border-t space-y-4">
        {fromAccount && (
          <div className="p-3 rounded-lg border flex justify-between items-center text-sm cursor-pointer hover:bg-accent">
            <div>
              <p className="text-muted-foreground">From Account</p>
              <p className="font-semibold text-foreground">{fromAccount.type} - {maskFromAccountNumber(fromAccount.accountNumber)}</p>
            </div>
            <ChevronRight className="h-5 w-5 text-muted-foreground" />
          </div>
        )}
        <Button 
            className="w-full h-14 text-lg font-semibold bg-primary text-primary-foreground hover:bg-primary/90 rounded-full disabled:opacity-50"
            onClick={handleContinue}
            disabled={!amount || parseFloat(amount) <= 0}
        >
            Continue
        </Button>
      </footer>

      <Dialog open={isNoteModalOpen} onOpenChange={setIsNoteModalOpen}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Add a note</DialogTitle>
            </DialogHeader>
            <Input 
                placeholder="What's this for?"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                maxLength={50}
            />
            <DialogFooter>
                <DialogClose asChild>
                    <Button type="button" onClick={() => setIsNoteModalOpen(false)}>Done</Button>
                </DialogClose>
            </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
