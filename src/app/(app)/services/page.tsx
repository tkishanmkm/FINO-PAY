
'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { 
    Star, 
    Lock, 
    User, 
    AppWindow, 
    Fingerprint, 
    ChevronRight,
    ArrowLeft,
} from 'lucide-react';

const serviceItems = [
    { label: 'Manage Favourites', icon: Star, href: '#' },
    { label: 'Manage Limit', icon: Lock, href: '/upgrade-account' },
    { label: 'My Profile', icon: User, href: '/profile' },
    { label: 'Change MPIN', icon: AppWindow, href: '#' },
    { label: 'Modify Security Profile', icon: Lock, href: '#' },
    { label: 'Disable Fingerprint/Face ID', icon: Fingerprint, href: '#' },
];

function ServiceMenuItem({ icon: Icon, label, href, isLast = false }: { icon: React.ElementType, label: string, href: string, isLast?: boolean }) {
    const router = useRouter();

    return (
        <>
            <div className="flex items-center p-4 cursor-pointer hover:bg-accent/50" onClick={() => href !== '#' && router.push(href)}>
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <Icon className="h-6 w-6" />
                </div>
                <p className="flex-1 ml-4 font-semibold text-foreground">{label}</p>
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
            </div>
            {!isLast && <Separator />}
        </>
    );
}


export default function ServicesPage() {
    const router = useRouter();

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
                    <h1 className="text-xl font-semibold">Services</h1>
                </div>
            </header>
            <main className="flex-1 bg-secondary p-4 space-y-4">
                <Card>
                    <CardContent className="p-0">
                        {serviceItems.map((item, index) => (
                            <ServiceMenuItem 
                                key={item.label}
                                icon={item.icon}
                                label={item.label}
                                href={item.href}
                                isLast={index === serviceItems.length - 1}
                            />
                        ))}
                    </CardContent>
                </Card>
            </main>
        </div>
    );
}
