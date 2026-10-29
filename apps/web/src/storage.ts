import type { Project } from '../../../packages/editor-core/src/model.ts';

const DB_NAME = 'postmaker-projects';
const STORE = 'projects';
const VERSION = 1;

export interface StorageStatus { usage?: number; quota?: number; persisted?: boolean }

function storageError(error: unknown): Error {
  if (error instanceof DOMException && (error.name === 'QuotaExceededError' || error.name === 'NS_ERROR_DOM_QUOTA_REACHED')) {
    return new Error('Browser storage is full. Export a JSON backup, then remove unused local projects or images.');
  }
  return error instanceof Error ? error : new Error('Local storage failed. Export a JSON backup.');
}

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE, { keyPath: 'id' });
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error('IndexedDB could not be opened.'));
    request.onblocked = () => reject(new Error('Close other PostMAKER tabs and retry.'));
  });
}

export async function listProjects(): Promise<Project[]> {
  const db = await openDatabase();
  try {
    return await new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE, 'readonly');
      const request = transaction.objectStore(STORE).getAll();
      request.onsuccess = () => resolve(request.result as Project[]);
      request.onerror = () => reject(request.error ?? new Error('Project list failed.'));
    });
  } finally { db.close(); }
}

export async function saveProject(project: Project): Promise<void> {
  const db = await openDatabase();
  try {
    await new Promise<void>((resolve, reject) => {
      const transaction = db.transaction(STORE, 'readwrite');
      transaction.objectStore(STORE).put(project);
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(storageError(transaction.error ?? new Error('Project save failed.')));
      transaction.onabort = () => reject(storageError(transaction.error ?? new Error('Project save was aborted.')));
    });
  } finally { db.close(); }
}

export async function clearProjects(): Promise<void> {
  const db = await openDatabase();
  try {
    await new Promise<void>((resolve, reject) => {
      const transaction = db.transaction(STORE, 'readwrite');
      transaction.objectStore(STORE).clear();
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(storageError(transaction.error));
      transaction.onabort = () => reject(storageError(transaction.error));
    });
  } finally { db.close(); }
}

export async function storageStatus(): Promise<StorageStatus> {
  if (!navigator.storage) return {};
  const [estimate, persisted] = await Promise.all([
    navigator.storage.estimate(),
    navigator.storage.persisted?.() ?? Promise.resolve(false)
  ]);
  return { usage: estimate.usage, quota: estimate.quota, persisted };
}

export async function requestPersistentStorage(): Promise<boolean> {
  return navigator.storage?.persist ? navigator.storage.persist() : false;
}

export async function deleteProject(id: string): Promise<void> {
  const db = await openDatabase();
  try {
    await new Promise<void>((resolve, reject) => {
      const transaction = db.transaction(STORE, 'readwrite');
      transaction.objectStore(STORE).delete(id);
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error ?? new Error('Project deletion failed.'));
      transaction.onabort = () => reject(transaction.error ?? new Error('Project deletion was aborted.'));
    });
  } finally { db.close(); }
}
