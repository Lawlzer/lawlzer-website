// Utility for managing persistent client-side cache for Data Platform
// Uses localStorage to persist cache across page refreshes

const CACHE_PREFIX = 'dataPlatform_';
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

interface CacheEntry<T> {
	data: T;
	timestamp: number;
	expiresAt: number;
}

export class DataPlatformCache {
	/**
	 * Get cached data if it exists and is not expired
	 */
	public static get<T>(key: string): T | null {
		try {
			const cacheKey = CACHE_PREFIX + key;
			const item = localStorage.getItem(cacheKey);

			if (item === null || item === undefined) {
				return null;
			}

			const entry: CacheEntry<T> = JSON.parse(item);

			// Check if cache has expired
			if (Date.now() > entry.expiresAt) {
				// Remove expired cache
				localStorage.removeItem(cacheKey);
				return null;
			}

			return entry.data;
		} catch (error) {
			console.error('Error reading from cache:', error);
			return null;
		}
	}

	/**
	 * Set data in cache with expiration
	 */
	public static set<T>(key: string, data: T): void {
		try {
			const cacheKey = CACHE_PREFIX + key;
			const now = Date.now();

			const entry: CacheEntry<T> = {
				data,
				timestamp: now,
				expiresAt: now + CACHE_DURATION,
			};

			localStorage.setItem(cacheKey, JSON.stringify(entry));
		} catch (error) {
			console.error('Error writing to cache:', error);
			// If localStorage is full, clear old entries
			if (error instanceof DOMException && error.name === 'QuotaExceededError') {
				this.clearOldEntries();
				// Try once more
				try {
					const cacheKey = CACHE_PREFIX + key;
					localStorage.setItem(cacheKey, JSON.stringify({ data, timestamp: Date.now(), expiresAt: Date.now() + CACHE_DURATION }));
				} catch {
					// If it still fails, just continue without caching
				}
			}
		}
	}

	/**
	 * Clear a specific cache entry
	 */
	public static clear(key: string): void {
		try {
			const cacheKey = CACHE_PREFIX + key;
			localStorage.removeItem(cacheKey);
		} catch (error) {
			console.error('Error clearing cache:', error);
		}
	}

	/**
	 * Clear all Data Platform cache entries
	 */
	public static clearAll(): void {
		try {
			const keys = Object.keys(localStorage);
			keys.forEach((key) => {
				if (key.startsWith(CACHE_PREFIX)) {
					localStorage.removeItem(key);
				}
			});
		} catch (error) {
			console.error('Error clearing all cache:', error);
		}
	}

	/**
	 * Clear old/expired cache entries to free up space
	 */
	public static clearOldEntries(): void {
		try {
			const keys = Object.keys(localStorage);
			const now = Date.now();

			keys.forEach((key) => {
				if (key.startsWith(CACHE_PREFIX)) {
					try {
						const item = localStorage.getItem(key);
						if (item !== null && item !== undefined) {
							const entry: CacheEntry<any> = JSON.parse(item);
							if (now > entry.expiresAt) {
								localStorage.removeItem(key);
							}
						}
					} catch {
						// If we can't parse it, remove it
						localStorage.removeItem(key);
					}
				}
			});
		} catch (error) {
			console.error('Error clearing old cache entries:', error);
		}
	}

	/**
	 * Get cache statistics
	 */
	public static getStats(): { totalEntries: number; totalSize: number; expiredEntries: number } {
		let totalEntries = 0;
		let totalSize = 0;
		let expiredEntries = 0;
		const now = Date.now();

		try {
			const keys = Object.keys(localStorage);

			keys.forEach((key) => {
				if (key.startsWith(CACHE_PREFIX)) {
					totalEntries++;
					const item = localStorage.getItem(key);
					if (item !== null && item !== undefined) {
						totalSize += item.length;
						try {
							const entry: CacheEntry<any> = JSON.parse(item);
							if (now > entry.expiresAt) {
								expiredEntries++;
							}
						} catch {
							// Count as expired if we can't parse
							expiredEntries++;
						}
					}
				}
			});
		} catch (error) {
			console.error('Error getting cache stats:', error);
		}

		return { totalEntries, totalSize, expiredEntries };
	}
}
