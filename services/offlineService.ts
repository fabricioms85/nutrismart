/**
 * Offline Service
 * Handles data caching, offline storage, and sync when back online
 */

// Keys for IndexedDB stores
const DB_NAME = 'nutrismart-offline';
const DB_VERSION = 1;
const STORES = {
    meals: 'pending-meals',
    water: 'pending-water',
    exercises: 'pending-exercises',
    weights: 'pending-weights',
    cache: 'data-cache',
};

// Pending action types
interface PendingAction<T = unknown> {
    id: string;
    type: 'create' | 'update' | 'delete';
    entity: 'meal' | 'water' | 'exercise' | 'weight';
    data: T;
    timestamp: number;
    synced: boolean;
}

// Initialize IndexedDB
function openDatabase(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result);

        request.onupgradeneeded = (event) => {
            const db = (event.target as IDBOpenDBRequest).result;

            // Create stores for each pending action type
            Object.values(STORES).forEach((storeName) => {
                if (!db.objectStoreNames.contains(storeName)) {
                    db.createObjectStore(storeName, { keyPath: 'id' });
                }
            });
        };
    });
}

// Check if online
export function isOnline(): boolean {
    return navigator.onLine;
}

// Register online/offline listeners
export function registerConnectivityListeners(
    onOnline: () => void,
    onOffline: () => void
): () => void {
    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);

    return () => {
        window.removeEventListener('online', onOnline);
        window.removeEventListener('offline', onOffline);
    };
}

// Save pending action to IndexedDB
export async function savePendingAction<T>(action: PendingAction<T>): Promise<void> {
    const db = await openDatabase();
    const storeName = getStoreForEntity(action.entity);

    return new Promise((resolve, reject) => {
        const transaction = db.transaction(storeName, 'readwrite');
        const store = transaction.objectStore(storeName);
        const request = store.put(action);

        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve();
    });
}

// Get all pending actions for sync
export async function getPendingActions(): Promise<PendingAction[]> {
    const db = await openDatabase();
    const allActions: PendingAction[] = [];

    for (const storeName of [STORES.meals, STORES.water, STORES.exercises, STORES.weights]) {
        const actions = await new Promise<PendingAction[]>((resolve, reject) => {
            const transaction = db.transaction(storeName, 'readonly');
            const store = transaction.objectStore(storeName);
            const request = store.getAll();

            request.onerror = () => reject(request.error);
            request.onsuccess = () => resolve(request.result || []);
        });

        allActions.push(...actions.filter((a) => !a.synced));
    }

    // Sort by timestamp to maintain order
    return allActions.sort((a, b) => a.timestamp - b.timestamp);
}

// Mark action as synced
export async function markActionSynced(action: PendingAction): Promise<void> {
    const db = await openDatabase();
    const storeName = getStoreForEntity(action.entity);

    return new Promise((resolve, reject) => {
        const transaction = db.transaction(storeName, 'readwrite');
        const store = transaction.objectStore(storeName);
        const request = store.put({ ...action, synced: true });

        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve();
    });
}

// Delete synced action
export async function deleteSyncedAction(action: PendingAction): Promise<void> {
    const db = await openDatabase();
    const storeName = getStoreForEntity(action.entity);

    return new Promise((resolve, reject) => {
        const transaction = db.transaction(storeName, 'readwrite');
        const store = transaction.objectStore(storeName);
        const request = store.delete(action.id);

        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve();
    });
}

// Get store name for entity type
function getStoreForEntity(entity: PendingAction['entity']): string {
    switch (entity) {
        case 'meal':
            return STORES.meals;
        case 'water':
            return STORES.water;
        case 'exercise':
            return STORES.exercises;
        case 'weight':
            return STORES.weights;
    }
}

// Cache data locally
export async function cacheData(key: string, data: unknown): Promise<void> {
    const db = await openDatabase();

    return new Promise((resolve, reject) => {
        const transaction = db.transaction(STORES.cache, 'readwrite');
        const store = transaction.objectStore(STORES.cache);
        const request = store.put({
            id: key,
            data,
            timestamp: Date.now(),
        });

        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve();
    });
}

// Get cached data
export async function getCachedData<T>(key: string): Promise<T | null> {
    const db = await openDatabase();

    return new Promise((resolve, reject) => {
        const transaction = db.transaction(STORES.cache, 'readonly');
        const store = transaction.objectStore(STORES.cache);
        const request = store.get(key);

        request.onerror = () => reject(request.error);
        request.onsuccess = () => {
            const result = request.result;
            resolve(result ? result.data : null);
        };
    });
}

// Clear old cached data (older than 7 days)
export async function clearOldCache(): Promise<void> {
    const db = await openDatabase();
    const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;

    return new Promise((resolve, reject) => {
        const transaction = db.transaction(STORES.cache, 'readwrite');
        const store = transaction.objectStore(STORES.cache);
        const request = store.openCursor();

        request.onerror = () => reject(request.error);
        request.onsuccess = () => {
            const cursor = request.result;
            if (cursor) {
                if (cursor.value.timestamp < sevenDaysAgo) {
                    cursor.delete();
                }
                cursor.continue();
            } else {
                resolve();
            }
        };
    });
}

// Get count of pending actions
export async function getPendingCount(): Promise<number> {
    const actions = await getPendingActions();
    return actions.length;
}

// Helper to create pending action
export function createPendingAction<T>(
    type: PendingAction['type'],
    entity: PendingAction['entity'],
    data: T
): PendingAction<T> {
    return {
        id: `${entity}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        type,
        entity,
        data,
        timestamp: Date.now(),
        synced: false,
    };
}

// Check if browser supports required APIs
export function isOfflineSupported(): boolean {
    return 'indexedDB' in window && 'serviceWorker' in navigator;
}
