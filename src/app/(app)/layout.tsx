
'use client';

import { Suspense } from 'react';
import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import AppHeader from '@/components/AppHeader';
import BottomNav from '@/components/BottomNav';
import { useAuth } from '@/hooks/use-auth';
import LoadingAnimation from '@/components/LoadingAnimation';

function AppLayoutContent({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isLoggedIn, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isLoading && !isLoggedIn) {
      router.replace('/');
    }
  }, [isLoggedIn, isLoading, router]);

  // Pages that have their own chrome (header/footer) and should not use the main layout.
  const fullScreenPages = ['/my-account', '/profile', '/manage-beneficiaries', '/live-chat', '/personal-details', '/fund-transfer', '/payment', '/beneficiary-details', '/upgrade-account', '/services', '/get-statement', '/upi-payment'];
  
  const isFullScreenPage = fullScreenPages.some(p => pathname.startsWith(p));
  const showAppHeader = pathname === '/dashboard' || pathname === '/passbook';

  if (isLoading) {
    return <LoadingAnimation />;
  }

  if (!isLoggedIn) {
    // The useEffect above will redirect. Return null to avoid rendering children.
    return null;
  }

  return (
    <div className="relative flex min-h-screen w-full flex-col bg-secondary">
      {showAppHeader && <AppHeader />}
      <main className={`flex-1 ${!isFullScreenPage ? 'pb-24' : ''} ${showAppHeader ? 'pt-24' : ''}`}>
        <div className={!isFullScreenPage ? "container mx-auto max-w-lg px-4" : ""}>
          {children}
        </div>
      </main>
      {!isFullScreenPage && <BottomNav />}
    </div>
  );
}


export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense fallback={<LoadingAnimation />}>
      <AppLayoutContent>{children}</AppLayoutContent>
    </Suspense>
  );
}
