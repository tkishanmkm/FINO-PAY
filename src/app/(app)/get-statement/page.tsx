
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ArrowLeft } from 'lucide-react';
import Image from 'next/image';
import { useAppData } from '@/hooks/use-app-data';

export default function GetStatementPage() {
  const router = useRouter();
  const { appData } = useAppData();
  const [duration, setDuration] = useState('last_3_months');

  const handleViewStatement = () => {
    router.push(`/passbook?duration=${duration}`);
  };

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
          <h1 className="text-xl font-semibold">Get Statement</h1>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-between p-4 text-center">
        <div className="w-full">
            <div className="relative w-48 h-48 mx-auto mt-12 mb-16">
                 <Image src={appData.appSettings.getStatementBanner || "https://storage.googleapis.com/project-ix-prod-upload/634a5d89-2131-47de-824a-a7a2b16b3b8d.png"} data-ai-hint="statement illustration" alt="Statement Illustration" layout="fill" objectFit="contain" />
            </div>

            <Alert className="w-full max-w-sm mx-auto mb-4 text-left">
              <AlertTitle>Statement password ? Option 1</AlertTitle>
              <AlertDescription className="space-y-2 text-sm">
                <p>Your password consists of the first four letters of your name followed by your date of birth in DDMMYYYY format.</p>
                <p>Example: Ramesh Sharma, born 05 July 1986 ? <span className="font-semibold">rame05071986</span>.</p>
                <p className="text-xs">This is the password format guidance. The locally generated demo PDF is not encrypted with a password.</p>
              </AlertDescription>
            </Alert>
            <Card className="w-full max-w-sm mx-auto text-left">
                <CardContent className="p-4">
                <label className="text-lg font-semibold text-foreground mb-2 block">
                    Select duration
                </label>
                <Select onValueChange={setDuration} defaultValue={duration}>
                    <SelectTrigger className="w-full h-12 text-base">
                    <SelectValue placeholder="Select a duration" />
                    </SelectTrigger>
                    <SelectContent>
                    <SelectItem value="last_7_days">Last 7 days</SelectItem>
                    <SelectItem value="last_3_months">Last 3 months</SelectItem>
                    <SelectItem value="current_month">This Month</SelectItem>
                    <SelectItem value="last_month">Last Month</SelectItem>
                    <SelectItem value="all">All Time</SelectItem>
                    <SelectItem value="custom">Custom Date</SelectItem>
                    </SelectContent>
                </Select>
                </CardContent>
            </Card>
        </div>

        <div className="w-full max-w-sm mx-auto mt-8">
          <Button size="lg" className="w-full h-12 rounded-full" onClick={handleViewStatement}>
            View
          </Button>
        </div>
      </main>
    </div>
  );
}
