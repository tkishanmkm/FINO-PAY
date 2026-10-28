
'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Phone, MessageCircle, MessageCircleQuestion, ChevronRight } from 'lucide-react';
import { useRouter } from 'next/navigation';

const supportActions = [
  { label: 'Call', icon: Phone, href: 'tel:' },
  { label: 'Live Chat', icon: MessageCircle, href: '/live-chat' },
  { label: 'Raise Query', icon: MessageCircleQuestion, href: '#' },
];

const faqItems = [
  'General Queries',
  'Account Services',
  'Sweep Account Services',
  'Fund Transfer',
  'Bill Payment and Recharge',
  'UPI Services',
  'Debit Card',
];

export default function SupportPage() {
  const router = useRouter();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Help & Support</h1>

      <Card>
        <CardContent className="p-4 grid grid-cols-3 gap-2 text-center">
          {supportActions.map(action => (
            <div 
              key={action.label} 
              onClick={() => router.push(action.href)}
              className="flex flex-col items-center space-y-2 p-2 rounded-lg hover:bg-accent cursor-pointer"
            >
              <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <action.icon className="h-7 w-7" />
              </div>
              <span className="text-xs font-medium">{action.label}</span>
            </div>
          ))}
        </CardContent>
      </Card>

      <div>
        <h2 className="text-xl font-bold mb-4">Frequently asked questions</h2>
        <Card>
          <CardContent className="p-0">
            {faqItems.map((item, index) => (
              <div key={item}>
                <div 
                  className="flex items-center justify-between p-4 cursor-pointer hover:bg-accent"
                  onClick={() => router.push('#')}
                >
                  <p className="font-semibold">{item}</p>
                  <ChevronRight className="h-5 w-5 text-muted-foreground" />
                </div>
                {index < faqItems.length - 1 && <Separator />}
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
