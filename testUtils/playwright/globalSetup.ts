// import type { FullConfig } from '@playwright/test'; // No longer needed for project dependency approach
import type { FullConfig } from '@playwright/test';
import { test as setup, expect } from '@playwright/test'; // Import test as setup
import dotenv from 'dotenv';
import path from 'path';

async function globalSetup(config: FullConfig): Promise<void> {
	const envPath = path.resolve(process.cwd(), '.test.env');
	dotenv.config({ path: envPath });
	expect(process.env.NEXT_PUBLIC_FRONTEND_PORT).toBeDefined();
	expect(process.env.NEXT_PUBLIC_SCHEME).toBeDefined();
}

export default globalSetup;
