#!/usr/bin/env tsx
/**
 * Debug script to manually reset and repopulate the Data Platform database.
 *
 * THIS IS FOR DEBUGGING ONLY!
 *
 * In normal operation, the data platform is automatically seeded on server startup
 * if the database is empty. Use this script only when you need to:
 *
 * 1. Force reset the database and start fresh
 * 2. Test the data generation logic
 * 3. Debug data platform issues
 *
 * Usage:
 *   npm run debug:reset-data-platform
 *   or
 *   tsx scripts/debugResetDataPlatform.ts
 *
 * Options:
 *   --no-reset    Skip the database reset and just add more data
 */

import { PrismaClient } from '@prisma/client';

import { resetDataPlatform, seedDataPlatform } from '../src/server/dataPlatform/seed';

const prisma = new PrismaClient();

async function main(): Promise<void> {
	const args = process.argv.slice(2);
	const shouldReset = !args.includes('--no-reset');

	console.info('='.repeat(60));
	console.info('DATA PLATFORM DEBUG RESET UTILITY');
	console.info('='.repeat(60));
	console.info('');

	if (shouldReset) {
		console.info('⚠️  WARNING: This will DELETE all existing CommodityData!');

		console.info('Resetting database...');
		await resetDataPlatform();
		console.info('');
	}

	console.info('Populating database with sample data...');
	await seedDataPlatform({ force: true });

	console.info('');
	console.info('='.repeat(60));
	console.info('✅ Debug reset complete!');
	console.info('='.repeat(60));
}

main()
	.catch((e: unknown) => {
		console.error('Script failed unexpectedly:');
		if (e instanceof Error) {
			console.error(e.message);
			console.error(e.stack);
		} else {
			console.error(e);
		}
		process.exit(1);
	})
	.finally(() => {
		console.info('Disconnecting Prisma client...');
		void prisma.$disconnect().catch((err) => {
			console.error('Error disconnecting Prisma:', err);
		});
	});
