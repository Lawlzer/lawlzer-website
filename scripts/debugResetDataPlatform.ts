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
 *   npx tsx scripts/debugResetDataPlatform.ts
 *
 * Options:
 *   --no-reset    Skip the database reset and just add more data
 *   --force       Use a more aggressive deletion method if standard fails
 */

import { PrismaClient } from '@prisma/client';

import { resetDataPlatform, seedDataPlatform } from '../src/server/dataPlatform/seed';

const prisma = new PrismaClient();

// Alternative simple reset that avoids conflicts
async function simpleReset(): Promise<void> {
	console.info('[DataPlatform] Using simple reset approach...');

	try {
		// Direct deleteMany without any complexity
		const result = await prisma.commodityData.deleteMany({});
		console.info(`[DataPlatform] Deleted ${result.count} records.`);
	} catch (error) {
		console.error('[DataPlatform] Simple reset also failed:', error);

		// Last resort: raw SQL (works differently for different databases)
		console.info('[DataPlatform] Attempting database-specific cleanup...');
		try {
			// For MongoDB (most common)
			const databaseUrl = process.env.DATABASE_URL;
			const dbName = databaseUrl !== undefined && databaseUrl !== '' ? (databaseUrl.split('/').pop()?.split('?')[0] ?? 'unknown') : 'unknown';
			console.info(`[DataPlatform] Database: ${dbName}`);

			// Try MongoDB-style drop
			await prisma.$runCommandRaw({
				drop: 'CommodityData',
			});
			console.info('[DataPlatform] Collection dropped successfully.');
		} catch (dropError) {
			console.error('[DataPlatform] Drop failed (this is normal for non-MongoDB databases):', dropError);

			// For SQL databases, try TRUNCATE
			// TODO: Fix this for Prisma v5+
			// try {
			// 	await prisma.$executeRawUnsafe('TRUNCATE TABLE "CommodityData" CASCADE');
			// 	console.info('[DataPlatform] TRUNCATE successful.');
			// } catch (truncateError) {
			// 	console.error('[DataPlatform] TRUNCATE also failed:', truncateError);
			// 	throw new Error('All reset methods failed. Please check your database connection and permissions.');
			// }
			throw new Error('Reset failed. Please use standard reset method or check database connection.');
		}
	}
}

async function main(): Promise<void> {
	const args = process.argv.slice(2);
	const shouldReset = !args.includes('--no-reset');
	const forceMode = args.includes('--force');

	console.info('='.repeat(60));
	console.info('DATA PLATFORM DEBUG RESET UTILITY');
	console.info('='.repeat(60));
	console.info('');

	if (shouldReset) {
		console.info('⚠️  WARNING: This will DELETE all existing CommodityData!');
		console.info('');
		console.info('💡 IMPORTANT: Before running this script:');
		console.info('   1. Stop your Next.js dev server (Ctrl+C)');
		console.info('   2. Close any database GUI tools (Prisma Studio, etc.)');
		console.info('   3. Wait a few seconds for connections to close');
		console.info('   4. Then run this script');
		console.info('');

		if (!forceMode) {
			console.info('📌 If you still get errors, use --force flag:');
			console.info('   npx tsx scripts/debugResetDataPlatform.ts --force');
			console.info('');
		}

		console.info('Waiting 5 seconds before proceeding...');
		await new Promise<void>((resolve) => {
			setTimeout(() => {
				resolve();
			}, 5000);
		});

		console.info('Resetting database...');

		try {
			// Try the standard reset first
			await resetDataPlatform();
		} catch (error) {
			console.error('Standard reset failed:', error);

			if (forceMode) {
				console.info('Force mode enabled, trying alternative reset methods...');
				await simpleReset();
			} else {
				console.error('');
				console.error('❌ Reset failed due to database conflicts.');
				console.error('');
				console.error('💡 To fix this:');
				console.error('   1. Make sure ALL Next.js servers are stopped');
				console.error('   2. Close Prisma Studio if open');
				console.error('   3. Try again with --force flag:');
				console.error('      npx tsx scripts/debugResetDataPlatform.ts --force');
				console.error('');
				process.exit(1);
			}
		}

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
		console.error('');
		console.error('❌ Script failed unexpectedly:');
		console.error('');

		if (e instanceof Error) {
			console.error(e.message);

			// Provide specific help for common errors
			if (e.message.includes('P2034') || e.message.includes('write conflict')) {
				console.error('');
				console.error('🔒 This is a database lock/conflict error.');
				console.error('   Solution: Stop all applications using the database and try again.');
			} else if (e.message.includes('P2028') || e.message.includes('Transaction already closed')) {
				console.error('');
				console.error('⏱️  This is a timeout error.');
				console.error('   Solution: Use --force flag for a faster reset method.');
			}
		} else {
			console.error(e);
		}

		console.error('');
		process.exit(1);
	})
	.finally(() => {
		console.info('');
		console.info('Disconnecting Prisma client...');
		void prisma.$disconnect().catch((err) => {
			console.error('Error disconnecting Prisma:', err);
		});
	});
