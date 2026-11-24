'use client';

import { createContext, useContext } from 'react';
import type { AppData } from '@/lib/types';
import { initialData } from '@/lib/constants';

export interface AppDataContextType {
  appData: AppData;
  setAppData: (data: AppData) => void;
  isLoading: boolean;
}

export const AppDataContext = createContext<AppDataContextType | undefined>(undefined);

export function useAppData() {
  const context = useContext(AppDataContext);
  if (context === undefined) {
    // The application provider loads IndexedDB asynchronously. Avoid reading or
    // writing browser storage during a render that is outside that provider.
    return {
      appData: initialData,
      setAppData: () => {},
      isLoading: true,
    };
  }
  return context;
}
