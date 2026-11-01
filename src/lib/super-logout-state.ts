const DB_NAME = 'finoPaySessionDB';
const DB_VERSION = 1;
const STORE_NAME = 'sessionState';
const SUPER_LOGOUT_KEY = 'superLogoutPending';
const FALLBACK_KEY = 'finoPaySuperLogoutPending';

type SessionRecord = { key: string; pending: boolean };

function openSessionDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !('indexedDB' in window)) {
      reject(new Error('IndexedDB is not available in this browser.'));
      return;
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const database = request.result;
      if (!database.objectStoreNames.contains(STORE_NAME)) {
        database.createObjectStore(STORE_NAME, { keyPath: 'key' });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error('Could not open the FinoPay session database.'));
    request.onblocked = () => reject(new Error('The FinoPay session database is blocked by another tab.'));
  });
}

async function readPendingFromIndexedDB(): Promise<boolean> {
  const database = await openSessionDatabase();
  try {
    return await new Promise((resolve, reject) => {
      const transaction = database.transaction(STORE_NAME, 'readonly');
      const request = transaction.objectStore(STORE_NAME).get(SUPER_LOGOUT_KEY);
      request.onsuccess = () => resolve(Boolean((request.result as SessionRecord | undefined)?.pending));
      request.onerror = () => reject(request.error || new Error('Could not read the Super Logout state.'));
      transaction.onabort = () => reject(transaction.error || new Error('Could not read the Super Logout state.'));
    });
  } finally {
    database.close();
  }
}

async function writePendingToIndexedDB(pending: boolean): Promise<void> {
  const database = await openSessionDatabase();
  try {
    await new Promise<void>((resolve, reject) => {
      const transaction = database.transaction(STORE_NAME, 'readwrite');
      transaction.objectStore(STORE_NAME).put({ key: SUPER_LOGOUT_KEY, pending } satisfies SessionRecord);
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error || new Error('Could not save the Super Logout state.'));
      transaction.onabort = () => reject(transaction.error || new Error('Could not save the Super Logout state.'));
    });
  } finally {
    database.close();
  }
}

function readFallbackMarker(): string | null {
  try {
    return window.localStorage.getItem(FALLBACK_KEY);
  } catch {
    return null;
  }
}

function writeFallbackMarker(value: 'true' | 'false'): void {
  try {
    window.localStorage.setItem(FALLBACK_KEY, value);
  } catch (error) {
    console.warn('FinoPay local compatibility marker could not be saved.', error);
  }
}

export async function isSuperLogoutPending(): Promise<boolean> {
  if (typeof window === 'undefined') return false;

  // Successful MPIN verification writes a false tombstone so a stale database
  // value cannot force another Super Logout if database cleanup was interrupted.
  if (readFallbackMarker() === 'false') return false;

  try {
    const pending = await readPendingFromIndexedDB();
    writeFallbackMarker(pending ? 'true' : 'false');
    return pending;
  } catch (error) {
    console.error('FinoPay IndexedDB read failed; using the compatibility fallback.', error);
    return readFallbackMarker() === 'true';
  }
}

export async function setSuperLogoutPending(): Promise<void> {
  if (typeof window === 'undefined') return;

  // IndexedDB is the persistent source of truth for the Super Logout gate.
  await writePendingToIndexedDB(true);
  writeFallbackMarker('true');
}

export async function clearSuperLogoutPending(): Promise<void> {
  if (typeof window === 'undefined') return;

  try {
    // Keep an explicit false record so a deleted localStorage entry cannot
    // accidentally reactivate an earlier Super Logout state.
    await writePendingToIndexedDB(false);
  } catch (error) {
    console.error('FinoPay IndexedDB cleanup failed; using the cleared compatibility marker.', error);
  }
  writeFallbackMarker('false');
}
