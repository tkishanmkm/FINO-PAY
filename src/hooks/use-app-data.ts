
'use client';

import { createContext, useContext } from 'react';
import type { AppData } from '@/lib/types';
import { getAppData } from '@/lib/storage';

export interface AppDataContextType {
  appData: AppData;
  setAppData: (data: AppData) => void;
  isLoading: boolean;
}

export const AppDataContext = createContext<AppDataContextType | undefined>(undefined);

export function useAppData() {
  const context = useContext(AppDataContext);
  if (context === undefined) {
    // This can happen on the very first render of a page that uses it,
    // before the main AppBody has had a chance to render its provider.
    // We can return a loading state or a default structure.
    return {
      appData: getAppData(), // Return initial/stored data synchronously
      setAppData: () => {}, // No-op setter
      isLoading: true, // Indicate that the "real" context is not yet available
    };
  }
  return context;
}
