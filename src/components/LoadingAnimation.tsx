'use client';

import Image from 'next/image';
import { useAppData } from '@/hooks/use-app-data';

export default function LoadingAnimation() {
  const { appData } = useAppData();

  return (
    <div className="flex h-screen w-full items-center justify-center bg-background">
      <div className="flex flex-col items-center justify-center" style={{ perspective: '1000px' }}>
        <div className="relative h-20 w-20 animate-rotate-3d" style={{ transformStyle: 'preserve-3d' }}>
            {appData.appSettings.appLogo2 ? (
                <Image 
                    src={appData.appSettings.appLogo2} 
                    alt="Loading..."
                    width={80}
                    height={80}
                    className="h-20 w-auto"
                />
            ) : (
                 <div className="h-20 w-20 rounded-full bg-primary" />
            )}
        </div>
        <p className="mt-4 text-sm text-muted-foreground animate-pulse">Loading...</p>
      </div>
    </div>
  );
}
