
'use client';

import { useRouter } from 'next/navigation';
import { Star } from 'lucide-react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { useAppData } from '@/hooks/use-app-data';
import Image from 'next/image';

export default function AppHeader() {
  const { appData } = useAppData();
  const router = useRouter();
  
  const nameParts = appData.user.name.split(' ').filter(Boolean);
  let userInitials = 'U';
  if (nameParts.length > 0) {
    const firstInitial = nameParts[0][0];
    const lastInitial = nameParts.length > 1 ? nameParts[nameParts.length - 1][0] : '';
    userInitials = `${firstInitial}${lastInitial}`;
  }

  return (
    <header className="fixed top-0 left-0 right-0 z-20 h-24 bg-primary text-primary-foreground overflow-hidden">
      {/* Swoosh background element */}
      <div className="absolute -right-28 -top-12 h-48 w-64 bg-destructive/30 rounded-full" />
      <div className="absolute -right-24 -top-4 h-40 w-56 bg-destructive/40 rounded-full" />

      <div className="container mx-auto max-w-lg h-full relative z-20">
        <div className="flex h-full items-center justify-between px-4">
          {/* Logo */}
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => router.push('/dashboard')}>
            {appData.appSettings.appLogo ? (
              <Image src={appData.appSettings.appLogo} alt="App Logo" width={32} height={32} className="h-8 w-auto" />
            ) : (
              // Fallback in case logo is not available
              <div className="h-8 w-8 bg-destructive rounded-full" />
            )}
            <div className="border-l border-primary-foreground/50 h-8 pl-3">
              <h1 className="text-xl font-bold -mb-1">Fino</h1>
              <div className="text-[10px] leading-tight font-medium">
                <p>Payments Bank</p>
                <p>फिनो पेमेंट्स बैंक</p>
              </div>
            </div>
          </div>
          
          {/* Profile */}
          <div className="cursor-pointer" onClick={() => router.push('/profile')}>
              <Avatar className="h-10 w-10 border-2 border-white">
                <AvatarImage src={appData.user.profilePicture} alt={appData.user.name} />
                <AvatarFallback className="bg-primary-foreground text-primary font-bold">
                  {userInitials}
                </AvatarFallback>
              </Avatar>
          </div>
        </div>
      </div>
    </header>
  );
}
