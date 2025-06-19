import { seedDataPlatform } from './seed';

let initializationPromise: Promise<void> | null = null;

/**
 * Initialize the Data Platform by seeding data if the database is empty.
 * This function is idempotent and will only run once per server instance.
 */
export async function initializeDataPlatform(): Promise<void> {
	// If already initializing or initialized, return the existing promise
	if (initializationPromise) {
		return initializationPromise;
	}

	// Create and store the initialization promise
	initializationPromise = (async () => {
		try {
			console.info('[DataPlatform] Checking if initialization is needed...');

			// Seed the data platform if empty
			await seedDataPlatform();

			console.info('[DataPlatform] Initialization complete.');
		} catch (error) {
			console.error('[DataPlatform] Initialization failed:', error);
			// Reset the promise on error so it can be retried if needed
			initializationPromise = null;
			// Don't throw - we don't want to prevent the server from starting
			// The app can still function without sample data
		}
	})();

	return initializationPromise;
}
