type CacheEntry = {
    data: any;
    timestamp: number;
};

class AnimeCache {
    private static cache: Map<string, CacheEntry> = new Map();
    private static readonly TTL = 1000 * 60 * 60;

    static get(key: string): any | null {
        const entry = this.cache.get(key);
        if (!entry) return null;

        if (Date.now() - entry.timestamp > this.TTL) {
            this.cache.delete(key);
            return null;
        }

        return entry.data;
    }

    static set(key: string, data: any): void {
        this.cache.set(key, { data, timestamp: Date.now() });
    }
}

export default AnimeCache;
