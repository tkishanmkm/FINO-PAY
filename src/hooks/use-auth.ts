'use client';

import { useState, useEffect, useCallback } from 'react';
import { clearSuperLogoutPending, isSuperLogoutPending } from '@/lib/super-logout-state';

const AUTH_KEY = 'finoPayAuth';

export function useAuth() {
  const [authStatus, setAuthStatus] = useState<'loading' | 'authenticated' | 'unauthenticated'>('loading');

  useEffect(() => {
    let active = true;

    const restoreAuth = async () => {
      const pendingSuperLogout = await isSuperLogoutPending();
      if (!active) return;

      if (pendingSuperLogout) {
        window.sessionStorage.removeItem(AUTH_KEY);
        setAuthStatus('unauthenticated');
        return;
      }

      setAuthStatus(window.sessionStorage.getItem(AUTH_KEY) === 'true' ? 'authenticated' : 'unauthenticated');
    };

    void restoreAuth();

    return () => {
      active = false;
    };
  }, []);

  const login = useCallback(async () => {
    if (typeof window === 'undefined') return;

    // A Super Logout remains pending until this function is called after MPIN validation.
    await clearSuperLogoutPending();
    window.sessionStorage.setItem(AUTH_KEY, 'true');
    setAuthStatus('authenticated');
  }, []);

  const logout = useCallback(() => {
    if (typeof window !== 'undefined') {
      window.sessionStorage.removeItem(AUTH_KEY);
      setAuthStatus('unauthenticated');
    }
  }, []);

  return {
    isLoggedIn: authStatus === 'authenticated',
    isLoading: authStatus === 'loading',
    login,
    logout,
  };
}
