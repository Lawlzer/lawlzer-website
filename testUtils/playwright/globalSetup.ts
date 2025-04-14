import type { FullConfig } from '@playwright/test';

async function globalSetup(config: FullConfig): Promise<void> {
	console.log('Running global setup...');
}

export default globalSetup;
