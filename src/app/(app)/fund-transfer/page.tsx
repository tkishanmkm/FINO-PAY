
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAppData } from '@/hooks/use-app-data';
import { ArrowLeft, Search, PlusCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import type { Payee } from '@/lib/types';
import { cn } from '@/lib/utils';

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

export default function FundTransferPage() {
  const { appData } = useAppData();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');

  const filteredPayees = appData.payees.filter(payee =>
    payee.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (payee.accountNumber && payee.accountNumber.includes(searchQuery))
  );

  const handlePayeeClick = (payee: Payee) => {
    router.push(`/payment/${payee.id}`);
  };

  return (
    <div className="flex flex-col min-h-screen">
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
          <h1 className="text-xl font-semibold">Funds Transfer</h1>
        </div>
        
        <div className="mt-6">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-lg font-semibold text-primary-foreground/90">Beneficiaries</h2>
            <Button 
              variant="link" 
              className="p-0 h-auto text-primary-foreground font-semibold"
              onClick={() => router.push('/manage-beneficiaries')}
            >
              <PlusCircle className="h-4 w-4 mr-1.5" />
              +Add new
            </Button>
          </div>
          <div className="relative">
            <Input
              type="text"
              placeholder="Search by name or account number"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-background text-foreground pl-10 pr-4 h-12 rounded-lg"
            />
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          </div>
        </div>
      </header>

      <main className="flex-1 bg-secondary p-4 pt-6 overflow-y-auto">
        <h3 className="text-base font-semibold text-muted-foreground mb-6">Select a beneficiary to transfer funds</h3>
        
        <div className="grid grid-cols-4 gap-x-4 gap-y-6 text-center">
          {filteredPayees.map(payee => (
            <div 
              key={payee.id} 
              className="flex flex-col items-center space-y-2 cursor-pointer"
              onClick={() => handlePayeeClick(payee)}
            >
              <Avatar className="h-16 w-16 text-xl">
                <AvatarFallback className="bg-primary/20 text-primary font-semibold">
                  {getInitials(payee.name)}
                </AvatarFallback>
              </Avatar>
              <span className="text-sm font-medium text-foreground">{payee.name.split(' ')[0]}</span>
            </div>
          ))}
        </div>

        {filteredPayees.length === 0 && (
          <div className="text-center py-20 text-muted-foreground">
            <p>No beneficiaries found.</p>
          </div>
        )}
      </main>
    </div>
  );
}
