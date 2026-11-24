import { initialData } from './constants';
import type { AppData } from './types';

const STORAGE_KEY = 'finoPayAppData';
const DB_NAME = 'finoPayPersistence';
const DB_VERSION = 1;
const STORE_NAME = 'appState';
const DATA_KEY = 'primary';
let databasePromise: Promise<IDBDatabase> | null = null;
let saveQueue: Promise<unknown> = Promise.resolve();

function openDatabase(): Promise<IDBDatabase> {
  if (typeof window === 'undefined' || !('indexedDB' in window)) {
    return Promise.reject(new Error('IndexedDB is not available in this browser.'));
  }
  if (databasePromise) return databasePromise;

  databasePromise = new Promise((resolve, reject) => {
    const request = window.indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error('Could not open local database.'));
    request.onblocked = () => reject(new Error('The FinoPay local database is blocked by another tab.'));
  }).catch((error) => {
    databasePromise = null;
    throw error;
  });

  return databasePromise;
}

function mergeAppData(value: Partial<AppData> | null | undefined): AppData {
  const parsed = value && typeof value === 'object' ? value : {};
  const settings = {
    ...initialData.appSettings,
    ...(parsed.appSettings && typeof parsed.appSettings === 'object' ? parsed.appSettings : {}),
  };

  // Keep the previously supplied FinoPay visual asset migrations, without allowing
  // the migration to overwrite user-edited settings or records.
  if (
    settings.superLogoutSplash === '/fino-assets/super-logout/splash-background.webp'
    || settings.superLogoutSplash === '/fino-assets/super-logout/splash-background-iphone.webp'
  ) {
    settings.superLogoutSplash = '/fino-assets/super-logout/splash-reference-9023.webp';
  }
  if (settings.superLogoutScreen5_1 === '/fino-assets/super-logout/screen-05-1.webp') {
    settings.superLogoutScreen5_1 = '/fino-assets/super-logout/screen-05-1-clean.webp';
  }
  for (let screenNumber = 1; screenNumber <= 10; screenNumber++) {
    const suffix = String(screenNumber).padStart(2, '0');
    const screenKey = 'superLogoutScreen' + screenNumber;
    const oldImage = '/fino-assets/super-logout/screen-' + suffix + '.webp';
    const settingsRecord = settings as unknown as Record<string, unknown>;
    if (settingsRecord[screenKey] === oldImage) {
      settingsRecord[screenKey] = '/fino-assets/super-logout/screen-' + suffix + '-iphone.webp';
    }
  }
  if (!Array.isArray(settings.superLogoutTokenMessages)) settings.superLogoutTokenMessages = [];

  return {
    ...initialData,
    ...parsed,
    user: { ...initialData.user, ...(parsed.user || {}), contact: { ...initialData.user.contact, ...(parsed.user?.contact || {}) } },
    accounts: Array.isArray(parsed.accounts) ? parsed.accounts : initialData.accounts,
    transactions: Array.isArray(parsed.transactions) ? parsed.transactions : initialData.transactions,
    payees: Array.isArray(parsed.payees) ? parsed.payees : initialData.payees,
    chatMessages: Array.isArray(parsed.chatMessages) ? parsed.chatMessages : initialData.chatMessages,
    appSettings: settings,
  };
}

function readLegacyData(): AppData | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw || raw === 'undefined') return null;
    return mergeAppData(JSON.parse(raw) as Partial<AppData>);
  } catch (error) {
    // Never reset or overwrite unreadable user data. Leave the original value in
    // localStorage so it can be recovered instead of silently replacing it.
    console.error('FinoPay could not read legacy browser data; original data was preserved.', error);
    return null;
  }
}

export function getAppData(): AppData {
  // Synchronous compatibility helper for components rendered outside the provider.
  // The provider itself uses loadAppData(), which reads IndexedDB first.
  return readLegacyData() ?? initialData;
}

export async function loadAppData(): Promise<AppData> {
  try {
    const db = await openDatabase();
    const transaction = db.transaction(STORE_NAME, 'readonly');
    const request = transaction.objectStore(STORE_NAME).get(DATA_KEY);
    const stored = await new Promise<unknown>((resolve, reject) => {
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error ?? new Error('Could not read saved FinoPay data.'));
      transaction.onabort = () => reject(transaction.error ?? new Error('Reading saved FinoPay data was aborted.'));
    });
    if (stored && typeof stored === 'object') return mergeAppData(stored as Partial<AppData>);

    const legacy = readLegacyData();
    if (legacy) {
      // Migrate only after a valid read. Keep the legacy copy as a recovery backup.
      await writeIndexedDb(legacy);
      return legacy;
    }
    return initialData;
  } catch (indexedDbError) {
    console.warn('FinoPay IndexedDB read failed; trying the legacy browser store.', indexedDbError);
    return readLegacyData() ?? initialData;
  }
}

async function writeIndexedDb(data: AppData): Promise<void> {
  const db = await openDatabase();
  await new Promise<void>((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    transaction.objectStore(STORE_NAME).put(data, DATA_KEY);
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error ?? new Error('Could not save FinoPay data.'));
    transaction.onabort = () => reject(transaction.error ?? new Error('Saving FinoPay data was aborted.'));
  });
}

export async function resetAppData(): Promise<void> {
  // Write defaults into the primary store before removing the legacy copy.
  await writeIndexedDb(initialData);
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.warn('FinoPay reset completed in IndexedDB, but the legacy fallback key could not be removed.', error);
  }
}

export function saveAppData(data: AppData): Promise<'indexeddb' | 'localStorage'> {
  // Serialize writes so a slower earlier save cannot overwrite a newer edit.
  const currentSave = saveQueue.catch(() => undefined).then(async () => {
    try {
      await writeIndexedDb(data);
      return 'indexeddb' as const;
    } catch (indexedDbError) {
      try {
        if (typeof window === 'undefined') throw new Error('Browser storage is unavailable.');
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
        console.warn('FinoPay saved using localStorage fallback; IndexedDB was unavailable.', indexedDbError);
        return 'localStorage' as const;
      } catch (fallbackError) {
        throw new Error(
          'FinoPay could not save your changes. Browser storage may be full or disabled. Your current screen still has the edits, but they may not survive a reload.',
          { cause: fallbackError }
        );
      }
    }
  });
  saveQueue = currentSave;
  return currentSave;
}
