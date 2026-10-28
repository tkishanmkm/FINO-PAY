
'use client';

import { Card, CardContent } from '@/components/ui/card';
import {
  X,
  Camera,
  Copy,
  QrCode,
  Share2,
  IndianRupee,
  Settings,
  HelpCircle,
  LogOut,
  ChevronRight,
  Search
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { useAppData } from '@/hooks/use-app-data';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Separator } from '@/components/ui/separator';

export default function ProfilePage() {
  const router = useRouter();
  const { logout } = useAuth();
  const { appData } = useAppData();
  const { toast } = useToast();
  const user = appData.user;
  const mainAccount = appData.accounts.find(acc => acc.type === 'Savings' || acc.type === 'Sampann current');

  const nameParts = user.name.split(' ').filter(Boolean);
  let userInitials = 'U';
  if (nameParts.length > 0) {
    const firstInitial = nameParts[0][0];
    const lastInitial = nameParts.length > 1 ? nameParts[nameParts.length - 1][0] : '';
    userInitials = `${firstInitial}${lastInitial}`;
  }

  const handleLogout = () => {
    logout();
    router.replace('/');
  };
  
  const handleCopy = () => {
    navigator.clipboard.writeText(user.upiId);
    toast({
      title: "Copied to clipboard",
      description: "UPI ID copied successfully.",
    });
  };

  const maskedAccountNumber = mainAccount 
    ? `(XXXXXX${mainAccount.accountNumber.slice(-4)})`
    : '';

  return (
    <div className="flex flex-col h-screen bg-secondary">
       <header className="flex items-center justify-between p-2 bg-background border-b">
         <Button variant="ghost" size="icon" onClick={() => router.back()}>
           <X className="h-6 w-6" />
         </Button>
         <Button variant="ghost" size="icon">
            <Search className="h-6 w-6" />
         </Button>
       </header>

       <main className="flex-1 overflow-y-auto bg-background text-center px-4 pb-2">
          <div className="relative inline-block">
            <Avatar className="h-16 w-16 text-2xl border-2 border-primary">
              <AvatarImage src={user.profilePicture} alt={user.name} />
              <AvatarFallback className="bg-primary text-primary-foreground font-bold">
                {userInitials}
              </AvatarFallback>
            </Avatar>
            <div className="absolute bottom-0 right-0 bg-primary rounded-full p-1 border border-background">
              <Camera className="h-3 w-3 text-primary-foreground" />
            </div>
          </div>
          
          <h1 className="text-lg font-bold mt-1">{user.name}</h1>
          <p className="text-xs text-muted-foreground">Customer ID: {user.customerId}</p>
          
          <div className="mt-0.5 flex items-center justify-center gap-1">
            <p className="text-xs text-muted-foreground">UPI ID: <span className="font-semibold text-foreground">{user.upiId}</span></p>
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={handleCopy}>
                <Copy className="h-3.5 w-3.5" />
            </Button>
          </div>

          <div className="mt-1">
            <Image 
              src={appData.appSettings.qrCodeImage || 'https://placehold.co/120x120.png'} 
              alt="UPI QR Code" 
              width={120} 
              height={120}
              data-ai-hint="qr code"
              className="mx-auto rounded-md border-4 border-black p-0.5"
            />
            <p className="mt-1 text-[10px] text-muted-foreground">Scan this code to pay me</p>
          </div>

          <div className="mt-2 flex gap-3">
            <Button size="sm" className="flex-1 h-9">
                <QrCode className="mr-2 h-4 w-4"/>
                Open Scanner
            </Button>
            <Button size="sm" variant="outline" className="flex-1 h-9">
                <Share2 className="mr-2 h-4 w-4"/>
                Share QR
            </Button>
          </div>
       </main>

       <footer className="bg-background p-2 space-y-1 border-t rounded-t-2xl mt-auto">
          <MenuItem 
            icon={IndianRupee} 
            label={mainAccount ? `FinoPay ${mainAccount.type} Account` : 'FinoPay Account'}
            value={maskedAccountNumber} 
            onClick={() => router.push('/all-accounts')} 
          />
          <Separator/>
          <MenuItem icon={Settings} label="Settings" onClick={() => router.push('/settings')} hasChevron />
          <Separator/>
          <MenuItem icon={HelpCircle} label="Get Help" onClick={() => {}} hasChevron />
          <Separator/>
          <MenuItem icon={LogOut} label="Log Out" onClick={handleLogout} />
          
          <div className="pt-2 text-center text-xs text-muted-foreground">
             <p>v4.2.21.1 (2025) | Policies | Safe Banking Tips</p>
          </div>
       </footer>
    </div>
  );
}

function MenuItem({ icon: Icon, label, value, onClick, hasChevron = false }: { 
  icon: React.ElementType; 
  label: string; 
  value?: string;
  onClick: () => void;
  hasChevron?: boolean;
}) {
  return (
    <div className="flex items-center p-1.5 rounded-md hover:bg-accent cursor-pointer" onClick={onClick}>
      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary">
          <Icon className="h-4 w-4" />
      </div>
      <div className="flex-1 ml-3">
        <p className="font-semibold text-sm">{label}</p>
        {value && <p className="text-xs text-muted-foreground">{value}</p>}
      </div>
      {hasChevron && <ChevronRight className="h-5 w-5 text-muted-foreground" />}
    </div>
  );
}
