
'use client';

import { useState, useEffect, useCallback } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import SplashScreen from '@/components/SplashScreen';
import { AppDataContext } from '@/hooks/use-app-data';
import type { AppData } from '@/lib/types';
import { getAppData, saveAppData } from '@/lib/storage';
import { useAuth } from '@/hooks/use-auth';
import { isSuperLogoutPending } from '@/lib/super-logout-state';

export default function AppBody({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [data, setData] = useState<AppData | null>(null);
  const [appState, setAppState] = useState<'loading' | 'splashing' | 'ready'>('loading');
  const [hasShownStartupSplash, setHasShownStartupSplash] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { isLoading: isAuthLoading, logout } = useAuth(); // Use a different name to avoid conflict

  useEffect(() => {
    const appData = getAppData();
    setData(appData);

    const handleLogoutLegacy = () => {
        logout();
        window.location.href = '/login-1';
    };
    
    // Attach to window for access from MorePage
    (window as any).handleLogoutLegacy = handleLogoutLegacy;

    // Conditionally show splash screen based on path
    if (!hasShownStartupSplash || pathname === '/super-logout') {
      setAppState('splashing');
    } else {
      setAppState('ready');
    }
    
    return () => {
        delete (window as any).handleLogoutLegacy;
    }
  }, [pathname, logout]);

  useEffect(() => {
    let active = true;
    const enforcePendingSuperLogout = async () => {
      const pending = await isSuperLogoutPending();
      if (!active || !pending || pathname === '/super-logout') return;
      const isOneTimeMpinTransition = pathname === '/login-1'
        && window.sessionStorage.getItem('finoPaySuperLogoutMpinReady') === 'true';
      if (isOneTimeMpinTransition) {
        window.sessionStorage.removeItem('finoPaySuperLogoutMpinReady');
        return;
      }
      router.replace('/super-logout');
    };
    void enforcePendingSuperLogout();
    return () => { active = false; };
  }, [pathname, router]);

  const handleSetAppData = useCallback((newData: AppData) => {
    setData(newData);
    saveAppData(newData);
  }, []);

  const handleSplashFinished = useCallback(() => {
    setHasShownStartupSplash(true);
    setAppState('ready');
  }, []);

  if (appState === 'loading' || !data || isAuthLoading) {
    return null; // Render nothing while loading initial data or auth state
  }
  
  if (appState === 'splashing') {
    return (
      <SplashScreen
        splashImage={data.appSettings.superLogoutSplash}
        onFinished={handleSplashFinished}
      />
    );
  }

  return (
    <AppDataContext.Provider value={{ appData: data, setAppData: handleSetAppData, isLoading: false }}>
      {children}
    </AppDataContext.Provider>
  );
}
