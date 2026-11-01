
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { cn } from '@/lib/utils';
import LoadingAnimation from '@/components/LoadingAnimation';
import { Fingerprint, QrCode, ArrowUpRight, FileText, Banknote, ShieldCheck, MessageSquare, Phone, HelpCircle } from 'lucide-react';
import { useAppData } from '@/hooks/use-app-data';
import Image from 'next/image';

const quickActions = [
    { icon: QrCode, label: "Scan & Pay" },
    { icon: ArrowUpRight, label: "Send Money" },
    { icon: FileText, label: "Bill Payment" },
    { icon: Banknote, label: "Cash Bazaar" },
    { icon: FileText, label: "Policies" },
    { icon: ShieldCheck, label: "Safe Banking Tips" },
]

export default function LoginPage1() {
  const [pin, setPin] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const router = useRouter();
  const { toast } = useToast();
  const { login, isLoggedIn, isLoading: isAuthLoading } = useAuth();
  const { appData, isLoading: isAppDataLoading } = useAppData();
  
  const isLoading = isAuthLoading || isAppDataLoading;

  useEffect(() => {
    if (!isLoading && isLoggedIn) {
      router.replace('/dashboard');
    }
  }, [isLoggedIn, isLoading, router]);

  if (isLoading || isLoggingIn) {
    return <LoadingAnimation />;
  }
  
  if (isLoggedIn) {
    return null;
  }

  const handlePinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (/^\d{0,4}$/.test(val)) {
      setPin(val);
      if (val.length === 4) {
        handleLogin(val);
      }
    }
  };

  const handleLogin = (finalPin: string) => {
    const savedPin = String(appData.user.pin || '');
    if (!/^\d{4}$/.test(finalPin)) {
      setPin('');
      toast({ variant: 'destructive', title: 'Invalid MPIN', description: 'Enter your four-digit MPIN.' });
      return;
    }
    if (!/^\d{4}$/.test(savedPin) || finalPin !== savedPin) {
      setPin('');
      toast({ variant: 'destructive', title: 'Login Failed', description: 'Incorrect MPIN. Check your saved MPIN in Settings.' });
      return;
    }
    setIsLoggingIn(true);
    setTimeout(async () => {
      await login();
      router.push('/dashboard');
    }, 500);
  };

  return (
    <div className="flex h-screen flex-col bg-secondary">
        <header className="relative bg-primary text-primary-foreground p-4 pb-16">
            <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                    {appData.appSettings.appLogo ? (
                        <Image src={appData.appSettings.appLogo} alt="App Logo" width={48} height={48} className="h-12 w-auto" />
                    ) : (
                        <div className="h-12 w-12 bg-destructive rounded-full" />
                    )}
                    <div>
                        <div className="text-2xl font-light leading-none">Fino</div>
                        <div className="text-3xl font-bold leading-none relative -mt-1.5">pay</div>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <MessageSquare className="h-5 w-5"/>
                    <Phone className="h-5 w-5"/>
                    <HelpCircle className="h-5 w-5"/>
                </div>
            </div>
            <p className="font-semibold mt-2">Welcome, {appData.user.name}</p>

             <div className="absolute bottom-0 left-0 w-full">
                <svg viewBox="0 0 1440 80" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M0 80H1440V0C1180.5 44.5 823 80 720 80C617 80 259.5 44.5 0 0V80Z" fill="hsl(var(--secondary))"/>
                </svg>
            </div>
        </header>

        <main className="flex-1 flex flex-col items-center p-4 z-10 -mt-8">
            <div className="w-full max-w-sm bg-card p-6 rounded-2xl shadow-md">
                <div className="flex items-center gap-3 text-primary mb-6">
                    <Fingerprint className="h-6 w-6"/>
                    <span className="font-semibold text-base">Enable Biometric</span>
                </div>

                <p className="text-center font-medium text-muted-foreground">Enter 4 Digit Login MPIN</p>

                <div className="relative my-6">
                    <div className="flex justify-center gap-6">
                    {[0, 1, 2, 3].map((i) => (
                        <div
                        key={i}
                        className={cn(
                            'h-4 w-4 rounded-full border-2 border-muted bg-background transition-colors',
                            pin.length > i && 'bg-primary border-primary'
                        )}
                        />
                    ))}
                    </div>
                    <Input
                        id="pin"
                        type="password"
                        inputMode="numeric"
                        value={pin}
                        onChange={handlePinChange}
                        className="absolute inset-0 h-full w-full opacity-0"
                        maxLength={4}
                        autoFocus
                    />
                </div>
                
                <div className="text-center space-y-3">
                     <Button variant="link" className="text-primary p-0 h-auto">Forgot MPIN?</Button>
                     <p className="text-sm text-muted-foreground">or</p>
                     <Button variant="link" className="text-primary p-0 h-auto">Register Now</Button>
                </div>
            </div>
        </main>

        <footer className="bg-secondary p-4 pt-8">
            <div className="grid grid-cols-3 gap-y-6 text-center">
                {quickActions.map(action => (
                    <div key={action.label} className="flex flex-col items-center space-y-2">
                        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                            <action.icon className="h-7 w-7" />
                        </div>
                        <span className="text-xs font-medium">{action.label}</span>
                    </div>
                ))}
            </div>
        </footer>
    </div>
  );
}
