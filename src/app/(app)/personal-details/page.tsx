'use client';

import { useRouter } from 'next/navigation';
import { useAppData } from '@/hooks/use-app-data';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ArrowLeft, Camera } from 'lucide-react';
import { Separator } from '@/components/ui/separator';

const getInitials = (name: string = '') => {
  const parts = name.trim().split(' ').filter(Boolean);
  if (parts.length === 0) return '??';
  const firstInitial = parts[0][0];
  const lastInitial = parts.length > 1 ? parts[parts.length - 1][0] : parts[0][1] || '';
  return `${firstInitial}${lastInitial}`.toUpperCase();
};

function DetailRow({ label, value, isLast = false }: { label: string; value?: string | null, isLast?: boolean }) {
  if (!value) return null;
  return (
    <>
      <div className="py-3">
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="font-semibold text-foreground mt-1">{value}</p>
      </div>
      {!isLast && <Separator />}
    </>
  );
}

export default function PersonalDetailsPage() {
  const router = useRouter();
  const { appData } = useAppData();
  const { user, accounts } = appData;
  const mainAccount = accounts.find(acc => acc.type === 'Savings' || acc.type === 'Sampann current');

  const maskEmail = (email: string = '') => {
    const [localPart, domain] = email.split('@');
    if (!localPart || !domain) return '';
    return `${localPart[0]}***********${localPart.slice(-1)}@${domain}`;
  };

  const maskPhone = (phone: string = '') => {
    if (phone.length < 10) return phone;
    return `+91 ******${phone.slice(-4)}`;
  };
  
  const maskPan = (pan: string = '') => {
     if (pan.length < 2) return pan;
     return `********${pan.slice(-2)}`;
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
          <h1 className="text-xl font-semibold">Personal Details</h1>
        </div>
      </header>

      <main className="flex-1 bg-secondary p-4 text-center">
        <div className="relative inline-block mb-4">
          <Avatar className="h-24 w-24 text-4xl border-2 border-background bg-accent/20">
            <AvatarImage src={user.profilePicture} alt={user.name} />
            <AvatarFallback className="bg-primary/10 text-primary font-bold">
              {getInitials(user.name)}
            </AvatarFallback>
          </Avatar>
          <div className="absolute bottom-1 right-1 bg-primary rounded-full p-1.5 border-2 border-secondary">
            <Camera className="h-4 w-4 text-primary-foreground" />
          </div>
        </div>

        <div className="space-y-4 text-left">
          <Card>
            <CardContent className="p-4">
              <h2 className="text-lg font-bold mb-2">Basic Details</h2>
              <DetailRow label="Name" value={user.name} />
              <DetailRow label="Customer ID" value={user.customerId} />
              <DetailRow label="DOB" value={user.dob} />
              <DetailRow label="PAN number" value={maskPan(user.pan)} />
              <DetailRow label="IFSC code" value={mainAccount?.ifsc} />
              <DetailRow label="Branch name" value={mainAccount?.branchName} isLast={true} />
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <h2 className="text-lg font-bold mb-2">Contact Details</h2>
               <DetailRow label="Email ID" value={maskEmail(user.contact.email)} />
               <DetailRow label="Phone number" value={maskPhone(user.contact.phone)} isLast={true} />
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
