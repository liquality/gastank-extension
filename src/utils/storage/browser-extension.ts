import { Storage, StorageData } from './storage'

export class BrowserExtensionStorage implements Storage {
    getData(): Promise<StorageData> {
        return new Promise((resolve, reject) => {
            chrome.storage.sync.get(null, (result) => {
                if (chrome.runtime.lastError) {
                    return reject(chrome.runtime.lastError);
                }

                return resolve(result as Storage);
            });
        });
    }

    setData(data: StorageData): Promise<void> {
        return new Promise((resolve, reject) => {
            chrome.storage.sync.set(data, () => {
                if (chrome.runtime.lastError) {
                    return reject(chrome.runtime.lastError);
                }

                return resolve();
            });
        });
    }

    getItem<Key extends keyof StorageData>(key: Key): Promise<StorageData[Key]> {
        return new Promise((resolve, reject) => {
            chrome.storage.sync.get([key], (result) => {
                if (chrome.runtime.lastError) {
                    return reject(chrome.runtime.lastError);
                }

                return resolve((result as StorageData)[key]);
            });
        });
    }

    setItem<Key extends keyof StorageData>(key: Key, value: StorageData[Key]): Promise<void> {
        return new Promise((resolve, reject) => {
            chrome.storage.sync.set({ [key]: value }, () => {
                if (chrome.runtime.lastError) {
                    return reject(chrome.runtime.lastError);
                }

                return resolve();
            });
        });
    }
}