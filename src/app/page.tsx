
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function RootPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/login-1');
  }, [router]);

  return (
    <div className="flex h-screen w-full items-center justify-center bg-background">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-primary animate-pulse">FINO PAY</h1>
        <p className="text-muted-foreground mt-2">Redirecting to login...</p>
      </div>
    </div>
  );
}
