// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface StorageData {
}

export interface Storage {
    getData(): Promise<StorageData>;
    setData(data: StorageData): Promise<void>;
    getItem<Key extends keyof StorageData>(
        key: Key
    ): Promise<StorageData[Key]>;

    setItem<Key extends keyof StorageData>(
        key: Key,
        value: StorageData[Key],
    ): Promise<void>;
}
