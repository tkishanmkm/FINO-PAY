'use client';

import { useState, useEffect, useCallback } from 'react';

const AUTH_KEY = 'finoPayAuth';

export function useAuth() {
  const [authStatus, setAuthStatus] = useState<'loading' | 'authenticated' | 'unauthenticated'>('loading');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedAuth = window.sessionStorage.getItem(AUTH_KEY);
      if (storedAuth === 'true') {
        setAuthStatus('authenticated');
      } else {
        setAuthStatus('unauthenticated');
      }
    }
  }, []);

  const login = useCallback(() => {
    if (typeof window !== 'undefined') {
      window.sessionStorage.setItem(AUTH_KEY, 'true');
      setAuthStatus('authenticated');
    }
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
