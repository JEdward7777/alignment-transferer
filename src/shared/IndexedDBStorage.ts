export default class IndexedDBStorage {
    private databaseName: string;
    private storeName: string;
    private db: IDBDatabase | null = null;
  
    constructor(databaseName: string, storeName: string) {
      this.databaseName = databaseName;
      this.storeName = storeName;
    }

    async initialize() {
        await this.openDatabase();
    }
  
    private openDatabase(): Promise<void> {
      return new Promise<void>((resolve, reject) => {
        const request = indexedDB.open(this.databaseName, 1);
  
        request.onupgradeneeded = event => {
            const db = (event.target as IDBOpenDBRequest).result as IDBDatabase;
            db.createObjectStore(this.storeName);
        };
  
        request.onsuccess = event => {
            this.db = (event.target as IDBOpenDBRequest).result as IDBDatabase;
            resolve();
        };
  
        request.onerror = event => {
            console.log( (event.target as IDBOpenDBRequest).error );
            reject((event.target as IDBOpenDBRequest).error);
        };
      });
    }

    isReady(): boolean {
      return !!this.db;
    }
  
    async getItem<T>(key: string): Promise<T | null> {
      return new Promise<T | null>((resolve, reject) => {
        if (!this.db) {
          resolve(null);
          return;
        }
  
        const transaction = this.db.transaction([this.storeName], 'readonly');
        const objectStore = transaction.objectStore(this.storeName);
        const request = objectStore.get(key);
  
        request.onsuccess = event => {
          const result = (event.target as IDBRequest<T>).result;
          if (result !== undefined) {
            resolve(result);
          } else {
            resolve(null); // Return null for missing key
          }
        };
  
        request.onerror = event => {
          reject((event.target as IDBRequest<T>).error);
        };
      });
    }
  
    async setItem<T>(key: string, value: T): Promise<void> {
      return new Promise<void>((resolve, reject) => {
        if (!this.db) {
          reject(new Error('Database not available'));
          return;
        }
  
        const transaction = this.db.transaction([this.storeName], 'readwrite');
        const objectStore = transaction.objectStore(this.storeName);
        const request = objectStore.put(value, key);
  
        request.onsuccess = () => {
          resolve();
        };
  
        request.onerror = event => {
          reject((event.target as IDBRequest).error);
        };
      });
    }
  }