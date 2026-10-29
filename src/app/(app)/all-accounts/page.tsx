'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAppData } from '@/hooks/use-app-data';
import { ArrowRight, Landmark, PiggyBank } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

export default function AllAccountsPage() {
  const { appData } = useAppData();
  const savingsAccounts = appData.accounts.filter(acc => acc.type === 'Savings' || acc.type === 'Sampann current');
  const totalSavingsBalance = savingsAccounts.reduce((sum, acc) => sum + acc.balance, 0);

  const investmentAccount = appData.accounts.find(acc => acc.type === 'Investment');
  const loanAccount = appData.accounts.find(acc => acc.type === 'Loan');

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">All Accounts</h1>
      <Tabs defaultValue="save" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="save">Save</TabsTrigger>
          <TabsTrigger value="invest">Invest</TabsTrigger>
          <TabsTrigger value="borrow">Borrow</TabsTrigger>
        </TabsList>
        
        <TabsContent value="save" className="mt-6 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Total Operative Balance</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">₹{totalSavingsBalance.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
            </CardContent>
          </Card>
          {savingsAccounts.map((account) => (
             <Card key={account.id}>
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="font-semibold">{account.accountNumber}</p>
                  <p className="text-sm text-muted-foreground">{account.type} Account · {account.variant || 'Standard'} Variant</p>
                </div>
                <Link href="/current-account-details">
                  <Button variant="ghost" size="icon">
                    <ArrowRight className="h-5 w-5" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ))}
          <Card className="relative overflow-hidden">
             <Image src="https://placehold.co/600x200.png" data-ai-hint="finance abstract" alt="Fixed Deposit" width={600} height={200} className="w-full h-auto" />
             <div className="absolute inset-0 bg-black/40 p-4 flex flex-col justify-end">
                <h3 className="text-white font-bold text-lg">Secure your future</h3>
                <p className="text-white/80 text-sm">Earn higher interest with Fixed Deposits.</p>
                <Button size="sm" className="mt-2 w-fit">Create FD</Button>
             </div>
          </Card>
        </TabsContent>

        <TabsContent value="invest" className="mt-6">
           <Card className="text-center p-8">
              <Landmark className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="font-semibold">Coming Soon</h3>
              <p className="text-muted-foreground text-sm">Our investment platform is under construction.</p>
           </Card>
        </TabsContent>

        <TabsContent value="borrow" className="mt-6">
          <Card className="text-center p-8">
            <PiggyBank className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="font-semibold">Coming Soon</h3>
            <p className="text-muted-foreground text-sm">Our borrowing options will be available shortly.</p>
          </Card>
        </TabsContent>

      </Tabs>
    </div>
  );
}
