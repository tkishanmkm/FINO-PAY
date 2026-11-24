'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import SplashScreen from '@/components/SplashScreen';
import { AppDataContext } from '@/hooks/use-app-data';
import type { AppData } from '@/lib/types';
import { loadAppData, saveAppData } from '@/lib/storage';
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
  const [saveState, setSaveState] = useState<'saved' | 'saving' | 'error'>('saved');
  const saveSequence = useRef(0);
  const pathname = usePathname();
  const router = useRouter();
  const { isLoading: isAuthLoading, logout } = useAuth();

  // Load once per page lifetime. Do not reload on route changes: doing so could
  // replace newer in-memory edits while an IndexedDB write is still completing.
  useEffect(() => {
    let active = true;
    void loadAppData().then((appData) => {
      if (active) setData(appData);
    }).catch((error) => {
      console.error('FinoPay failed to load saved data.', error);
      if (active) setSaveState('error');
    });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    const handleLogoutLegacy = () => {
      logout();
      window.location.href = '/login-1';
    };
    (window as any).handleLogoutLegacy = handleLogoutLegacy;
    return () => { delete (window as any).handleLogoutLegacy; };
  }, [logout]);

  useEffect(() => {
    if (!hasShownStartupSplash || pathname === '/super-logout') {
      setAppState('splashing');
    } else {
      setAppState('ready');
    }
  }, [pathname, hasShownStartupSplash]);

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
    const sequence = ++saveSequence.current;
    setSaveState('saving');
    void saveAppData(newData).then((storage) => {
      if (sequence === saveSequence.current) {
        setSaveState('saved');
        if (storage === 'localStorage') {
          console.warn('FinoPay changes were saved using the browser fallback store.');
        }
      }
    }).catch((error) => {
      console.error('FinoPay changes were not saved.', error);
      if (sequence === saveSequence.current) setSaveState('error');
    });
  }, []);

  const handleSplashFinished = useCallback(() => {
    setHasShownStartupSplash(true);
    setAppState('ready');
  }, []);

  if (appState === 'loading' || !data || isAuthLoading) {
    return null;
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
      <div
        role="status"
        aria-live="polite"
        className={`fixed bottom-3 right-3 z-[100] rounded-full px-3 py-1.5 text-xs shadow-md pointer-events-none ${
          saveState === 'error'
            ? 'bg-destructive text-destructive-foreground'
            : 'bg-background/90 text-muted-foreground border'
        }`}
      >
        {saveState === 'saving' ? 'Saving changes…' : saveState === 'error' ? 'Save failed — changes are not safely stored' : 'All changes saved'}
      </div>
    </AppDataContext.Provider>
  );
}
