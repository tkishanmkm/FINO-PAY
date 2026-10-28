'use client';

import { Card, CardContent } from '@/components/ui/card';
import { ArrowRight, CreditCard, User, Download, FileText, Landmark } from 'lucide-react';
import { useRouter } from 'next/navigation';

const actions = [
  { label: 'Debit Card Details', icon: CreditCard, href: '#' },
  { label: 'Personal Details', icon: User, href: '/personal-details' },
  { label: 'Download Statement', icon: Download, href: '/statement-analysis' },
  { label: 'Request Cheque Book', icon: FileText, href: '#' },
  { label: 'Manage Nominee', icon: Landmark, href: '#' },
];

export default function AccountActionsPage() {
  const router = useRouter();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">More Actions</h1>

      <div className="space-y-2">
        {actions.slice(0, 2).map(action => (
          <ActionItem key={action.label} label={action.label} onClick={() => router.push(action.href)} />
        ))}
      </div>
      
      <div className="grid grid-cols-3 gap-4 text-center">
        {actions.slice(2).map(action => (
          <div key={action.label} onClick={() => router.push(action.href)} className="flex flex-col items-center space-y-2 p-2 rounded-lg hover:bg-accent cursor-pointer">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
              <action.icon className="h-7 w-7" />
            </div>
            <span className="text-xs font-medium">{action.label}</span>
          </div>
        ))}
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
