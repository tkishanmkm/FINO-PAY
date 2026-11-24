'use client';

import { createContext, useContext } from 'react';
import type { AppData } from '@/lib/types';
import { initialData } from '@/lib/constants';

export interface AppDataContextType {
  appData: AppData;
  setAppData: (data: AppData) => Promise<boolean>;
  isLoading: boolean;
}

export const AppDataContext = createContext<AppDataContextType | undefined>(undefined);

export function useAppData() {
  const context = useContext(AppDataContext);
  if (context === undefined) {
    return {
      appData: initialData,
      setAppData: async () => false,
      isLoading: true,
    };
  }
  return context;
}
