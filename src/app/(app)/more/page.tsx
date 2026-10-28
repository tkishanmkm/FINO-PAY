
'use client';

import { useRouter } from 'next/navigation';
import { useAppData } from '@/hooks/use-app-data';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Search, ChevronRight, LogOut } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/hooks/use-auth';

const menuItems = [
    { label: 'Accounts & Money Transfer', href: '/all-accounts' },
    { label: 'UPI', href: '#' },
    { label: 'Bill Pay & Recharge', href: '#' },
    { label: 'Services', href: '/account-actions' },
    { label: 'Loans', href: '#' },
];

function CustomHeader() {
    const router = useRouter();
    const { appData } = useAppData();
    const user = appData.user;
    
    const nameParts = user.name.split(' ').filter(Boolean);
    let userInitials = 'U';
    if (nameParts.length > 0) {
        const firstInitial = nameParts[0][0];
        const lastInitial = nameParts.length > 1 ? nameParts[nameParts.length - 1][0] : '';
        userInitials = `${firstInitial}${lastInitial}`.toUpperCase();
    }

    return (
        <header className="fixed top-0 left-0 right-0 z-30 bg-primary text-primary-foreground p-4 border-b border-primary/50">
             <div className="container mx-auto max-w-lg flex items-center gap-4">
                <div className="relative flex-1">
                    <Input
                        type="search"
                        placeholder="Discover FinoPay services"
                        className="bg-primary-foreground/20 border-0 placeholder:text-primary-foreground/70 text-primary-foreground pl-10 h-11"
                    />
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-primary-foreground/70" />
                </div>
                <Avatar className="h-11 w-11 cursor-pointer" onClick={() => router.push('/profile')}>
                    <AvatarImage src={user.profilePicture} alt={user.name} />
                    <AvatarFallback className="bg-background text-primary font-bold">{userInitials}</AvatarFallback>
                </Avatar>
            </div>
        </header>
    );
}


function MenuItem({ label, href, onClick, isLast = false, icon: Icon }: { label: string; href?: string; onClick?: () => void; isLast?: boolean; icon?: React.ElementType }) {
    const router = useRouter();
    const clickAction = onClick ? onClick : () => href && href !== '#' && router.push(href);

    return (
        <>
            <div className="flex items-center justify-between py-4 cursor-pointer hover:bg-accent/50" onClick={clickAction}>
                <div className="flex items-center gap-3">
                    {Icon && <Icon className="h-5 w-5 text-destructive" />}
                    <p className="font-semibold">{label}</p>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
            </div>
            {!isLast && <Separator />}
        </>
    );
}

export default function MorePage() {
    const { logout } = useAuth();

    const handleLogout = () => {
        // This function is now defined on the window object in AppBody.tsx
        if (typeof (window as any).handleLogoutLegacy === 'function') {
            (window as any).handleLogoutLegacy();
        } else {
            // Fallback for direct call
            logout();
            window.location.href = '/login-1';
        }
    };

    return (
        <div className="pt-20 bg-background"> {/* Padding to offset the fixed header */}
            <CustomHeader />
            <div className="-mx-4">
                <Card className="rounded-none shadow-none border-x-0">
                    <CardContent className="p-4">
                        <h2 className="text-lg font-bold mb-2">Explore more with Fino</h2>
                        {menuItems.map((item, index) => (
                            <MenuItem 
                                key={item.label}
                                label={item.label}
                                href={item.href}
                                isLast={index === menuItems.length - 1}
                            />
                        ))}
                         <MenuItem 
                            label="Log Out"
                            onClick={handleLogout}
                            isLast={true}
                            icon={LogOut}
                        />
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
