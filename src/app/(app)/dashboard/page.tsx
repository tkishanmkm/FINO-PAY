'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Eye, EyeOff,
  ArrowUpRight, ArrowDownLeft, Users, Settings,
  Smartphone, SatelliteDish, Lightbulb, Droplets, Flame, Receipt, Car,
  User, TrendingUp, Repeat, CreditCard, MapPin,
  QrCode, Send, Gauge, Copy
} from 'lucide-react';
import { useAppData } from '@/hooks/use-app-data';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import { useToast } from '@/hooks/use-toast';
import { Separator } from '@/components/ui/separator';

const moneyTransferFeatures = [
    { icon: QrCode, label: "Scan QR Code", href: "#" },
    { icon: Smartphone, label: "To Mobile or Contact", href: "#" },
    { icon: Send, label: "To UPI ID", href: "/upi-payment" },
    { icon: Gauge, label: "UPI Dashboard", href: "#" },
    { icon: ArrowUpRight, label: "Funds Transfer", href: "/fund-transfer" },
    { icon: ArrowDownLeft, label: "Request Money", href: "#" },
    { icon: Users, label: "Manage Beneficiaries", href: "/manage-beneficiaries" },
    { icon: Settings, label: "Manage UPI", href: "#" },
];

const billPayFeatures = [
    { icon: Smartphone, label: "Mobile Recharge", href: "#" },
    { icon: SatelliteDish, label: "DTH Recharge", href: "#" },
    { icon: Lightbulb, label: "Electricity Bill", href: "#" },
    { icon: Droplets, label: "Water Bill", href: "#" },
    { icon: Flame, label: "Piped Gas", href: "#" },
    { icon: Receipt, label: "Mobile Postpaid", href: "#" },
    { icon: Car, label: "FASTag Recharge", href: "#" },
];

const bankServicesFeatures = [
    { icon: User, label: "My Account", href: "/my-account" },
    { icon: TrendingUp, label: "Upgrade account", href: "#" },
    { icon: Repeat, label: "Account Sweep in", href: "#" },
    { icon: CreditCard, label: "Manage Card", href: "#" },
    { icon: MapPin, label: "Locate us", href: "#" },
];

export default function DashboardPage() {
  const [showBalance, setShowBalance] = useState(false);
  const { appData } = useAppData();
  const router = useRouter();
  const { toast } = useToast();
  
  const mainAccount = appData.accounts.find(acc => acc.type === 'Savings' || acc.type === 'Sampann current');
  
  const handleCopy = () => {
    const upiId = appData.user.upiId;
    navigator.clipboard.writeText(upiId);
    toast({
      title: "Copied to clipboard",
      description: "UPI ID copied successfully.",
    });
  };

  const FeatureGrid = ({ features }: { features: {icon: React.ElementType, label: string, href: string}[] }) => (
    <div className="grid grid-cols-4 gap-2 text-center">
      {features.map((feature) => (
          <div key={feature.label} onClick={() => feature.href !== '#' && router.push(feature.href)} className="flex flex-col items-center justify-start space-y-1 py-2 rounded-lg hover:bg-secondary cursor-pointer aspect-square">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <feature.icon className="h-6 w-6" />
              </div>
              <span className="text-[10px] font-medium leading-tight px-1 mt-auto">{feature.label}</span>
          </div>
      ))}
    </div>
  );


  return (
    <div className="space-y-4">
      <Card className="bg-card relative overflow-hidden rounded-xl">
         <CardContent className="p-4 z-10 relative space-y-1">
            <p className="text-sm font-semibold">{mainAccount?.type} Account</p>
            <p className="text-sm text-muted-foreground">{mainAccount?.accountNumber}</p>
            
            <div className="mt-2 flex items-center justify-between">
              <p className="text-lg font-bold">
                {showBalance ? `₹ ${mainAccount?.balance.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '₹ ********'}
              </p>
              <Button variant="ghost" className="text-primary text-sm font-medium p-2 h-auto" onClick={() => setShowBalance(!showBalance)}>
                  {showBalance ? <EyeOff className="mr-2 h-4 w-4" /> : <Eye className="mr-2 h-4 w-4" />}
                  View Balance
              </Button>
            </div>
        </CardContent>

        <div className="absolute bottom-0 right-0 left-0 opacity-10 z-0">
          <svg viewBox="0 0 1440 48" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M1440 48H0V0C240 26.6667 480 40 720 40C960 40 1200 26.6667 1440 0V48Z" fill="hsl(var(--primary))"></path></svg>
        </div>
        
        <Separator />

        <div className="px-4 py-3 flex items-center gap-4 z-10 relative bg-card rounded-b-xl">
            <Button variant="link" className="p-0 h-auto text-sm text-primary font-semibold" onClick={() => router.push('#')}>Manage Card</Button>
            <Separator orientation="vertical" className="h-4" />
            <Button variant="link" className="p-0 h-auto text-sm text-primary font-semibold" onClick={() => router.push('/get-statement')}>Get Statement</Button>
        </div>
      </Card>

      {appData.appSettings.dashboardBanner && (
        <Card className="relative overflow-hidden aspect-[4/1]">
          <Image
            src={appData.appSettings.dashboardBanner}
            data-ai-hint="payment app banner"
            alt="Dashboard Banner"
            fill
            className="object-cover"
          />
        </Card>
      )}
      
      <Tabs defaultValue="money_transfer" className="w-full">
        <TabsList className="grid w-full grid-cols-3 bg-background rounded-lg p-1">
          <TabsTrigger value="money_transfer" className="text-xs px-1">Money Transfer</TabsTrigger>
          <TabsTrigger value="bill_pay" className="text-xs px-1">Bill Pay & Recharge</TabsTrigger>
          <TabsTrigger value="bank_services" className="text-xs px-1">Bank Services</TabsTrigger>
        </TabsList>
        
        <TabsContent value="money_transfer" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Money Transfer</CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0 space-y-4">
                  {appData.user.upiId?.trim() && (
                    <div className="bg-secondary p-3 rounded-lg flex items-center justify-between text-sm">
                        <p className="text-muted-foreground truncate">
                            UPI ID: <span className="font-semibold text-foreground">{appData.user.upiId}</span>
                        </p>
                        <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0" onClick={handleCopy}>
                            <Copy className="h-4 w-4 text-muted-foreground" />
                            <span className="sr-only">Copy UPI ID</span>
                        </Button>
                    </div>
                  )}
                  <FeatureGrid features={moneyTransferFeatures} />
              </CardContent>
            </Card>
        </TabsContent>
        <TabsContent value="bill_pay" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Bill Pay & Recharge</CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <FeatureGrid features={billPayFeatures} />
              </CardContent>
            </Card>
        </TabsContent>
        <TabsContent value="bank_services" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Bank Services</CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <FeatureGrid features={bankServicesFeatures} />
              </CardContent>
            </Card>
        </TabsContent>
      </Tabs>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Partner Services</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="font-semibold text-primary mb-2">Loans</p>
          <Carousel opts={{ align: "start" }} className="w-full">
            <CarouselContent>
              <CarouselItem className="basis-2/3">
                  <div className="relative aspect-video rounded-lg overflow-hidden">
                    <Image src={appData.appSettings.personalLoanBanner || "https://placehold.co/400x200.png"} data-ai-hint="personal loan" alt="Personal Loan" fill className="object-cover" />
                     <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent p-4 flex flex-col justify-end">
                        <h3 className="text-white font-semibold text-lg tracking-widest">Personal Loan</h3>
                     </div>
                  </div>
              </CarouselItem>
              <CarouselItem className="basis-2/3">
                  <div className="relative aspect-video rounded-lg overflow-hidden">
                    <Image src={appData.appSettings.twoWheelerLoanBanner || "https://placehold.co/400x200.png"} data-ai-hint="motorcycle loan" alt="Two Wheeler Loan" fill className="object-cover" />
                     <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent p-4 flex flex-col justify-end">
                        <h3 className="text-white font-semibold text-lg tracking-widest">Two Wheeler Loan</h3>
                     </div>
                  </div>
              </CarouselItem>
            </CarouselContent>
            <CarouselPrevious className="absolute left-2" />
            <CarouselNext className="absolute right-2"/>
          </Carousel>
        </CardContent>
      </Card>
    </div>
  );
}
