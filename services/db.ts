import { GeneratedImage } from '../types';

const DB_NAME = 'LuxeAuraDB';
const STORE_NAME = 'images';
const DB_VERSION = 1;
const MAX_STORED_IMAGES = 25; // Limit to keep workflow smooth

const initDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        store.createIndex('timestamp', 'timestamp', { unique: false });
      }
    };
  });
};

export const saveImageToDB = async (image: GeneratedImage): Promise<void> => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.put(image);

    request.onsuccess = async () => {
      // Trigger cleanup after saving
      await cleanupOldImages();
      resolve();
    };
    request.onerror = () => reject(request.error);
  });
};

export const saveImagesToDB = async (images: GeneratedImage[]): Promise<void> => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    
    let completed = 0;
    
    transaction.oncomplete = async () => {
       await cleanupOldImages();
       resolve();
    };
    
    transaction.onerror = () => reject(transaction.error);

    images.forEach(img => {
      store.put(img);
    });
  });
};

export const getImagesFromDB = async (): Promise<GeneratedImage[]> => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const index = store.index('timestamp');
    // Get all, but we want to sort by timestamp desc ideally. 
    // IDB sorts asc by default. We will reverse in memory.
    const request = index.getAll();

    request.onsuccess = () => {
      const results = request.result as GeneratedImage[];
      resolve(results.reverse()); // Newest first
    };
    request.onerror = () => reject(request.error);
  });
};

export const deleteImageFromDB = async (id: string): Promise<void> => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.delete(id);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
};

export const clearDB = async (): Promise<void> => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.clear();

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
};

// Optimization: Keep only the N most recent images
const cleanupOldImages = async (): Promise<void> => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const index = store.index('timestamp');
    
    const countRequest = store.count();
    
    countRequest.onsuccess = () => {
      const count = countRequest.result;
      if (count > MAX_STORED_IMAGES) {
        // Delete oldest
        // Open cursor sorted by timestamp (ascending = oldest first)
        const cursorRequest = index.openCursor();
        let deletedCount = 0;
        const toDelete = count - MAX_STORED_IMAGES;

        cursorRequest.onsuccess = (e) => {
          const cursor = (e.target as IDBRequest).result as IDBCursorWithValue;
          if (cursor && deletedCount < toDelete) {
            cursor.delete();
            deletedCount++;
            cursor.continue();
          }
        };
      }
      resolve();
    };
    
    countRequest.onerror = () => reject(countRequest.error);
  });
};