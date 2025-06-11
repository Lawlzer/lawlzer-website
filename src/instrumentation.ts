// This file runs when the Next.js server starts
export async function register() {
	if (process.env.NEXT_RUNTIME === 'nodejs') {
		// Only run on server-side
		const { db } = await import('~/server/db');

		// Check MongoDB connection
		try {
			await db.$connect();
			console.info('✅ MongoDB connection established successfully.');
		} catch (error) {
			console.warn('⚠️  MongoDB is not accessible. Please ensure MongoDB is running.');
			console.warn('    Some features may not work properly without database connection.');
			if (process.env.NODE_ENV === 'development') {
				console.warn('    To start MongoDB locally, run: docker-compose up -d mongodb');
			}
			// Don't throw error - just warn and continue
		}
	}
}
