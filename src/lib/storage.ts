import { initialData } from './constants';
import type { AppData } from './types';

const STORAGE_KEY = 'finoPayAppData';

export function getAppData(): AppData {
  if (typeof window === 'undefined') {
    return initialData;
  }
  try {
    const storedData = window.localStorage.getItem(STORAGE_KEY);
    // Check for null or the literal string "undefined"
    if (storedData && storedData !== "undefined") {
      // A simple migration strategy: merge initialData with storedData
      // to ensure new fields from updates are not missing.
      const parsedData = JSON.parse(storedData);
      // Apply the supplied FINO visual backup once to existing browser data without replacing user/account/transaction records.
      const visualsVersionKey = 'finoPayVisualsSeedV1';
      let appSettings = { ...initialData.appSettings, ...(parsedData.appSettings || {}) };
      // Migrate the previous reference asset paths to the cleaned iPhone-ready assets.
      if (appSettings.superLogoutSplash === '/fino-assets/super-logout/splash-background.webp') {
        appSettings.superLogoutSplash = '/fino-assets/super-logout/splash-background-iphone.webp';
      }
      if (appSettings.superLogoutScreen5_1 === '/fino-assets/super-logout/screen-05-1.webp') {
        appSettings.superLogoutScreen5_1 = '/fino-assets/super-logout/screen-05-1-clean.webp';
      }
      for (let screenNumber = 1; screenNumber <= 10; screenNumber++) {
        const suffix = String(screenNumber).padStart(2, '0');
        const screenKey = 'superLogoutScreen' + screenNumber;
        const oldImage = '/fino-assets/super-logout/screen-' + suffix + '.webp';
        const settingsRecord = appSettings as unknown as Record<string, unknown>;
        if (settingsRecord[screenKey] === oldImage) {
          settingsRecord[screenKey] = '/fino-assets/super-logout/screen-' + suffix + '-iphone.webp';
        }
      }
      if (!Array.isArray(appSettings.superLogoutTokenMessages)) appSettings.superLogoutTokenMessages = [];
      if (!window.localStorage.getItem(visualsVersionKey)) {
        appSettings = { ...(parsedData.appSettings || {}), ...initialData.appSettings };
        window.localStorage.setItem(visualsVersionKey, '1');
      }
      const migrated = { ...initialData, ...parsedData, user: { ...initialData.user, ...parsedData.user }, appSettings };
      return migrated;
    } else {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(initialData));
      return initialData;
    }
  } catch (error) {
    console.error('Failed to parse data from localStorage, resetting to initial data.', error);
    // If parsing fails, reset to initial data to recover.
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(initialData));
    return initialData;
  }
}

export function saveAppData(data: AppData): void {
  if (typeof window === 'undefined') {
    return;
  }
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (error) {
    console.error('Failed to save data to localStorage', error);
  }
}
