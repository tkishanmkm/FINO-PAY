
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAppData } from '@/hooks/use-app-data';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Eye, EyeOff, ChevronUp, ChevronDown, Copy, ChevronRight, User, TrendingUp, Repeat, CreditCard, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { format, parseISO } from 'date-fns';
import { formatInTimeZone } from 'date-fns-tz';
import { cn } from '@/lib/utils';
import type { Transaction } from '@/lib/types';

// Helper to format date in IST
const formatInIST = (dateString: string, formatString: string) => {
  try {
    const date = parseISO(dateString);
    return formatInTimeZone(date, 'Asia/Kolkata', formatString);
  } catch (e) {
    // Fallback for any invalid date strings
    return dateString;
  }
}

export default function MyAccountPage() {
  const { appData } = useAppData();
  const router = useRouter();
  const { toast } = useToast();
  const [showBalance, setShowBalance] = useState(false);
  const [showMoreDetails, setShowMoreDetails] = useState(false);

  const user = appData.user;
  const mainAccount = appData.accounts.find(acc => acc.type === 'Savings' || acc.type === 'Sampann current');

  if (!mainAccount) {
    return <div>Loading account details...</div>;
  }

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied to clipboard",
      description: `${label} copied successfully.`,
    });
  };

  const recentTransactions = [...appData.transactions]
    .sort((a, b) => parseISO(b.date).getTime() - parseISO(a.date).getTime())
    .slice(0, 5);
  
  return (
    <div className="min-h-screen bg-secondary flex flex-col">
      {/* Header and top card section */}
      <div className="bg-primary p-4 text-primary-foreground">
        <header className="flex items-center gap-4 mb-6">
          <Button variant="ghost" size="icon" className="h-8 w-8 -ml-2 text-primary-foreground hover:bg-white/20 hover:text-primary-foreground" onClick={() => router.back()}>
            <ArrowLeft />
          </Button>
          <h1 className="text-xl font-semibold">{mainAccount.type} Account</h1>
        </header>

        <Card className="shadow-lg">
          <CardContent className="p-4 space-y-3">
            <div className="flex justify-between items-start">
              <div>
                <p className="font-bold text-lg">{user.name}</p>
                <p className="text-muted-foreground">{mainAccount.accountNumber}</p>
              </div>
              <Button variant="link" className="p-0 h-auto text-primary flex items-center gap-1.5 shrink-0" onClick={() => setShowBalance(!showBalance)}>
                {showBalance ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                <span className="font-semibold">View Balance</span>
              </Button>
            </div>
            <p className="text-2xl font-bold">
              {showBalance ? `₹ ${mainAccount.balance.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '₹ *********'}
            </p>
            
            {showMoreDetails && (
              <div className="space-y-4 pt-4 border-t">
                <DetailRow label="A/c Type" value={mainAccount.type} />
                <DetailRow label="A/c Variant" value={mainAccount.variant || 'Standard'} />
                <DetailRow label="IFSC code" value={mainAccount.ifsc || 'N/A'} />
                <DetailRow label="Customer ID" value={user.customerId} />
                <DetailRow label="Branch name" value={mainAccount.branchName || 'N/A'} />
                <DetailRow label="Nominee" value={mainAccount.nominee || 'Nil'} />
              </div>
            )}

            <button
              onClick={() => setShowMoreDetails(!showMoreDetails)}
              className="w-full text-center text-sm font-semibold text-primary flex items-center justify-center pt-2"
            >
              View {showMoreDetails ? 'Less' : 'More'} Details
              {showMoreDetails ? <ChevronUp className="h-4 w-4 ml-1" /> : <ChevronDown className="h-4 w-4 ml-1" />}
            </button>
          </CardContent>
        </Card>
      </div>
      
      {/* UPI and Tabs section */}
      <div className="bg-primary flex-grow">
        <div className="bg-secondary flex-grow rounded-t-2xl p-4 space-y-4">
            <div className="bg-primary/10 p-3 rounded-lg flex items-center justify-between text-sm">
                <p className="text-primary truncate">
                    UPI ID: <span className="font-semibold">{user.upiId}</span>
                </p>
                <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={() => handleCopy(user.upiId, 'UPI ID')}>
                    <Copy className="h-4 w-4 text-primary" />
                    <span className="sr-only">Copy UPI ID</span>
                </Button>
            </div>

            <Tabs defaultValue="services" className="w-full">
              <TabsList className="grid w-full grid-cols-2 bg-primary/10">
                <TabsTrigger value="services">Account Services</TabsTrigger>
                <TabsTrigger value="transactions">Recent Transactions</TabsTrigger>
              </TabsList>
              
              <TabsContent value="services" className="mt-4">
                <Card>
                  <CardContent className="p-0">
                    <ServiceItem icon={User} label="View Personal Details" onClick={() => router.push('/personal-details')} />
                    <Separator/>
                    <ServiceItem icon={TrendingUp} label="Upgrade account" onClick={() => router.push('/upgrade-account')} />
                    <Separator/>
                    <ServiceItem icon={Repeat} label="Sweep-in" onClick={() => {}} />
                    <Separator/>
                    <ServiceItem icon={CreditCard} label="Card Details" onClick={() => {}} />
                    <Separator/>
                    <ServiceItem icon={Settings} label="Services" onClick={() => router.push('/services')} />
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="transactions" className="mt-4">
                <Card>
                  <CardContent className="p-0">
                    {recentTransactions.map((txn, index) => (
                        <div key={txn.id}>
                          <div className="p-4">
                              <div className="flex items-start justify-between">
                                  <p className="text-xs text-muted-foreground">{formatInIST(txn.date, 'dd MMM yyyy, hh:mm a')}</p>
                                  <p className={cn(
                                      "font-bold text-base",
                                      txn.type === 'credit' ? 'text-green-600' : 'text-red-600'
                                  )}>
                                      {txn.type === 'credit' ? '+' : '-'} ₹{txn.amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                  </p>
                              </div>
                              <p className="text-sm font-semibold mt-1 break-words pr-4">
                                  {txn.description}
                              </p>
                          </div>
                          {index < recentTransactions.length - 1 && <Separator />}
                        </div>
                      ))}
                      {recentTransactions.length === 0 && (
                        <div className="text-center py-10 text-muted-foreground">
                            No recent transactions found.
                        </div>
                      )}
                  </CardContent>
                </Card>
                { recentTransactions.length > 0 && 
                    <Button variant="link" className="w-full mt-2" onClick={() => router.push('/passbook')}>
                        View All Transactions
                    </Button>
                }
              </TabsContent>
            </Tabs>
        </div>
      </div>
    </div>
  );
}


function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="font-semibold text-foreground">{value}</p>
    </div>
  );
}

function ServiceItem({ icon: Icon, label, onClick, isPrimary = false }: { icon: React.ElementType, label: string, onClick: () => void, isPrimary?: boolean }) {
  return (
    <div className={cn("flex items-center p-4 rounded-md hover:bg-accent cursor-pointer", isPrimary && 'bg-destructive/10')} onClick={onClick}>
      <Icon className={cn("h-6 w-6", isPrimary ? "text-destructive" : "text-primary")} />
      <p className="flex-1 ml-4 font-semibold text-foreground">{label}</p>
      <ChevronRight className={cn("h-5 w-5", isPrimary ? "text-destructive" : "text-muted-foreground")} />
    </div>
  )
}
