
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

// This page is a fallback, the main entry is login-1
export default function LoginPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/login-1');
  }, [router]);

  return (
    <div className="flex h-screen w-full items-center justify-center bg-background">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-primary animate-pulse">FINO PAY</h1>
        <p className="text-muted-foreground mt-2">Redirecting...</p>
      </div>
    </div>
  );
}
