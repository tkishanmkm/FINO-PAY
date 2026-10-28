'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, HelpCircle, QrCode, Settings, Menu } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from './ui/button';

const navItems = [
  { href: '/dashboard', icon: Home, label: 'Home' },
  { href: '/support', icon: HelpCircle, label: 'Support' },
  { href: '#scan', icon: QrCode, label: 'Scan', isCentral: true },
  { href: '/settings', icon: Settings, label: 'Settings' },
  { href: '/more', icon: Menu, label: 'More' },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <footer className="fixed bottom-0 left-0 right-0 z-40 h-20 bg-background/95 shadow-[0_-2px_10px_rgba(0,0,0,0.05)] backdrop-blur-sm">
      <nav className="container relative mx-auto flex h-full max-w-lg items-center justify-around">
        {navItems.map((item) => {
          if (item.isCentral) {
            return (
              <div key={item.href} className="relative -top-6 flex flex-col items-center">
                <Button
                  size="icon"
                  className="h-16 w-16 rounded-full bg-destructive shadow-lg hover:bg-destructive/90"
                  onClick={() => alert('Scan QR clicked!')}
                >
                  <QrCode className="h-8 w-8 text-destructive-foreground" />
                </Button>
              </div>
            );
          }

          const isActive = pathname === item.href;
          return (
            <Link href={item.href} key={item.href} className="flex flex-col items-center justify-center text-center space-y-1 p-1 w-16">
              <item.icon className={cn('h-6 w-6', isActive ? 'text-primary' : 'text-muted-foreground')} />
              <span className={cn('text-[10px]', isActive ? 'font-semibold text-primary' : 'text-muted-foreground')}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </nav>
    </footer>
  );
}
