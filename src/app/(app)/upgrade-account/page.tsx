
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft } from 'lucide-react';
import { Slider } from '@/components/ui/slider';
import { Separator } from '@/components/ui/separator';
import { useAppData } from '@/hooks/use-app-data';
import { useToast } from '@/hooks/use-toast';

const limitItems = [
    { id: 'fino', label: 'Mobile Banking (Fino)', defaultLimit: 1000000 },
    { id: 'imps', label: 'Mobile Banking (IMPS)', defaultLimit: 500000 },
    { id: 'neft', label: 'Mobile Banking (NEFT)', defaultLimit: 1000000 },
    { id: 'rtgs', label: 'Mobile Banking (RTGS)', defaultLimit: 1000000 },
    { id: 'upg', label: 'Mobile Banking (UPG)', defaultLimit: 1000000 },
];

function CustomHeader() {
    const router = useRouter();
    return (
        <header className="bg-primary text-primary-foreground p-4">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 -ml-2 text-primary-foreground hover:bg-white/20 hover:text-primary-foreground"
                        onClick={() => router.back()}
                    >
                        <ArrowLeft />
                    </Button>
                    <h1 className="text-xl font-semibold">MANAGE LIMIT</h1>
                </div>
            </div>
        </header>
    );
}

function LimitControl({ label, value, onValueChange }: { label: string; value: number; onValueChange: (value: number) => void; }) {
    const maxLimit = 1000000;
    const formattedValue = new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(value).replace('₹', '');

    return (
        <div className="py-4">
            <div className="flex justify-between items-center mb-1">
                <p className="font-semibold text-foreground">{label}</p>
            </div>
            <p className="font-bold text-xl text-foreground mb-4">{formattedValue}</p>
            <Slider
                value={[value]}
                onValueChange={(vals) => onValueChange(vals[0])}
                max={maxLimit}
                step={10000}
            />
        </div>
    );
}

export default function ManageLimitPage() {
    const { appData, setAppData } = useAppData();
    const { toast } = useToast();
    const [limits, setLimits] = useState<Record<string, number>>({});

    useEffect(() => {
        const initialLimits = limitItems.reduce((acc, item) => {
            const savedLimit = appData.appSettings.transactionLimits?.[item.id];
            return { ...acc, [item.id]: savedLimit ?? item.defaultLimit };
        }, {} as Record<string, number>);
        setLimits(initialLimits);
    }, [appData.appSettings.transactionLimits]);

    const handleLimitChange = (id: string, value: number) => {
        setLimits(prev => ({ ...prev, [id]: value }));
    };

    const handleSetLimit = () => {
        setAppData({
            ...appData,
            appSettings: {
                ...appData.appSettings,
                transactionLimits: limits
            }
        });
        toast({
            title: "Limits Updated",
            description: "Your new transaction limits have been saved.",
        });
    };

    return (
        <div className="flex flex-col min-h-screen bg-background">
            <CustomHeader />

            <main className="flex-1 flex flex-col p-4 space-y-6">
                <Card className="flex-1 flex flex-col">
                    <CardContent className="p-4 flex-1">
                        {limitItems.map((item, index) => (
                             <div key={item.id}>
                                <LimitControl
                                    label={item.label}
                                    value={limits[item.id] || 0}
                                    onValueChange={(value) => handleLimitChange(item.id, value)}
                                />
                                {index < limitItems.length - 1 && <Separator />}
                             </div>
                        ))}
                    </CardContent>
                    <div className="bg-secondary/50 p-4 mt-auto">
                        <h4 className="font-bold text-sm mb-1">NOTE:</h4>
                        <p className="text-xs text-muted-foreground">The above limits indicate "limit per transaction".</p>
                    </div>
                </Card>

                <div className="mt-auto">
                    <Button size="lg" className="w-full h-12 rounded-full" onClick={handleSetLimit}>
                        SET LIMIT
                    </Button>
                </div>
            </main>
        </div>
    );
}
