
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAppData } from '@/hooks/use-app-data';
import { ArrowLeft, Search, PlusCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import type { Payee } from '@/lib/types';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
  DialogClose,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';

const payeeSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  nickname: z.string().optional(),
  upiId: z.string().optional(),
  accountNumber: z.string().optional(),
  ifsc: z.string().optional(),
  bankName: z.string().optional(),
});

type PayeeFormData = z.infer<typeof payeeSchema>;

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

function AddBeneficiaryForm({ onFormSubmit }: { onFormSubmit: () => void }) {
  const { appData, setAppData } = useAppData();
  const { toast } = useToast();
  
  const form = useForm<PayeeFormData>({
    resolver: zodResolver(payeeSchema),
    defaultValues: {
      name: '',
      nickname: '',
      upiId: '',
      accountNumber: '',
      ifsc: '',
      bankName: '',
    },
  });

  function onSubmit(data: PayeeFormData) {
    const newPayee: Payee = {
      id: `payee_${Date.now()}`,
      avatar: '',
      ...data,
    };
    
    setAppData({
      ...appData,
      payees: [newPayee, ...appData.payees],
    });

    toast({
      title: 'Beneficiary Added',
      description: `${data.name} has been successfully added to your payee list.`,
    });
    
    onFormSubmit(); // Close the dialog
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <DialogHeader>
          <DialogTitle>Add New Beneficiary</DialogTitle>
          <DialogDescription>
            Enter the details of the new payee.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 max-h-[60vh] overflow-y-auto p-1">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Full Name</FormLabel>
                <FormControl>
                  <Input placeholder="e.g. John Doe" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="nickname"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nickname (Optional)</FormLabel>
                <FormControl>
                  <Input placeholder="e.g. Johnny" {...field} />
                </FormControl>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="upiId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>UPI ID (Optional)</FormLabel>
                <FormControl>
                  <Input placeholder="e.g. john.doe@bank" {...field} />
                </FormControl>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="accountNumber"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Account Number (Optional)</FormLabel>
                <FormControl>
                  <Input placeholder="e.g. 1234567890" {...field} />
                </FormControl>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="ifsc"
            render={({ field }) => (
              <FormItem>
                <FormLabel>IFSC Code (Optional)</FormLabel>
                <FormControl>
                  <Input placeholder="e.g. BANK0001234" {...field} />
                </FormControl>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="bankName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Bank Name (Optional)</FormLabel>
                <FormControl>
                  <Input placeholder="e.g. National Bank" {...field} />
                </FormControl>
              </FormItem>
            )}
          />
        </div>

        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="outline">Cancel</Button>
          </DialogClose>
          <Button type="submit">Add Beneficiary</Button>
        </DialogFooter>
      </form>
    </Form>
  )
}

export default function ManageBeneficiariesPage() {
  const { appData } = useAppData();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const filteredPayees = appData.payees.filter(payee =>
    payee.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (payee.accountNumber && payee.accountNumber.includes(searchQuery))
  );

  const handlePayeeClick = (payee: Payee) => {
    router.push(`/beneficiary-details/${payee.id}`);
  };

  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <div className="flex flex-col min-h-screen">
        <div className="bg-primary text-primary-foreground p-4 pb-6">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" className="h-8 w-8 -ml-2 text-primary-foreground hover:bg-white/20 hover:text-primary-foreground" onClick={() => router.back()}>
              <ArrowLeft />
            </Button>
            <h1 className="text-xl font-semibold">Manage Beneficiaries</h1>
          </div>
          <div className="relative mt-4">
            <Input
              type="text"
              placeholder="Search by name or account number"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-background text-foreground pl-4 pr-10 h-12 rounded-lg"
            />
            <Search className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          </div>
        </div>

        <main className="flex-1 bg-background p-4 pt-6 overflow-y-auto">
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
              No beneficiaries found.
            </div>
          )}
        </main>

        <footer className="p-4 border-t bg-background">
          <DialogTrigger asChild>
            <Button size="lg" className="w-full h-12 rounded-full">
              <PlusCircle className="mr-2 h-5 w-5"/>
              Add new
            </Button>
          </DialogTrigger>
        </footer>
      </div>

      <DialogContent className="sm:max-w-[425px]">
        <AddBeneficiaryForm onFormSubmit={() => setIsDialogOpen(false)} />
      </DialogContent>
    </Dialog>
  );
}
