import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { db } from '~/server/db';

// --- Type Definitions ---

// Structure for filters passed in the query string
type InputFilters = Record<string, string[] | boolean | number | string>;

// Structure for individual data points returned by the API
export interface RawDataPoint {
	timestamp: number; // unixDate in milliseconds
	values: Record<string, number>; // { fieldName: value }
}

// Max documents to process to avoid performance issues
const MAX_DOCUMENTS_FOR_PROCESSING = 5000;

// --- Helper Functions ---

// Function to build Prisma where clause based on inputFilters
function buildWhereClause(inputFilters: InputFilters): Record<string, any> {
	const where: Record<string, any> = {};

	// Add filters directly from inputFilters
	for (const [key, value] of Object.entries(inputFilters)) {
		// Handle array values for $in, otherwise direct match
		if (Array.isArray(value) && value.length > 0) {
			where[key] = { in: value };
		} else if (!Array.isArray(value)) {
			// Handle boolean, number, string directly
			where[key] = value;
		}
		// Ignore empty arrays
	}

	console.info('Constructed Prisma Where Clause:', JSON.stringify(where));
	return where;
}

// --- API Route Handler ---

export async function GET(req: NextRequest): Promise<NextResponse> {
	const url = new URL(req.url);
	const filtersParam = url.searchParams.get('filters');
	let inputFilters: InputFilters = {};

	if (filtersParam !== null) {
		try {
			inputFilters = JSON.parse(filtersParam);
			console.info('[ChartData API] Parsed inputFilters:', JSON.stringify(inputFilters));
		} catch (error) {
			console.error('Failed to parse filters:', error);
			return NextResponse.json({ error: 'Invalid filters format' }, { status: 400 });
		}
	} else {
		console.info('[ChartData API] No filters param received.');
	}

	try {
		// 1. Build the where clause from input filters
		const whereClause = buildWhereClause(inputFilters);

		// 2. Count documents matching the query
		console.info(`[ChartData API] Counting documents with where clause:`, JSON.stringify(whereClause));
		const documentCount = await db.commodityData.count({ where: whereClause });
		console.info(`[ChartData API] Found ${documentCount} documents matching query.`);

		if (documentCount === 0) {
			console.info('[ChartData API] No documents match filters.');
			return NextResponse.json({ rawData: [], documentCount: 0 });
		}

		// 3. Check count against the limit
		if (documentCount > MAX_DOCUMENTS_FOR_PROCESSING) {
			console.info(`[ChartData API] Document count (${documentCount}) exceeds limit (${MAX_DOCUMENTS_FOR_PROCESSING}).`);
			return NextResponse.json({ rawData: null, limitExceeded: true, documentCount: documentCount });
		}

		// 4. Fetch required fields from CommodityData
		console.info('[ChartData API] Fetching documents...');
		const documents = await db.commodityData.findMany({
			where: whereClause,
			select: {
				unixDate: true,
				price: true,
				exports: true,
				head: true,
				totalVolume: true,
			},
		});
		console.info(`[ChartData API] Fetched ${documents.length} documents.`);

		// 5. Process documents into RawDataPoint array
		const rawData: RawDataPoint[] = [];
		const numericFieldsPresent = new Set<string>();

		for (const doc of documents) {
			if (typeof doc.unixDate !== 'number' || isNaN(doc.unixDate) || !isFinite(doc.unixDate)) {
				console.warn('[ChartData API] Skipping document with invalid unixDate');
				continue;
			}

			const values: Record<string, number> = {};
			let hasNumericValue = false;

			// Check each numeric field
			const numericFields = ['price', 'exports', 'head', 'totalVolume'] as const;

			for (const field of numericFields) {
				const value = doc[field];
				if (value !== null && value !== undefined && typeof value === 'number' && !isNaN(value) && isFinite(value)) {
					values[field] = value;
					numericFieldsPresent.add(field);
					hasNumericValue = true;
				}
			}

			// Only add point if it has at least one valid numeric value
			if (hasNumericValue) {
				rawData.push({ timestamp: doc.unixDate, values: values });
			}
		}

		console.info(`[ChartData API] Processed ${rawData.length} data points. Numeric fields found: ${Array.from(numericFieldsPresent).join(', ')}`);

		// 6. Return the raw data points
		return NextResponse.json({ rawData: rawData, documentCount: documentCount, limitExceeded: false });
	} catch (error) {
		console.error('Failed to fetch chart data:', error);
		const errorMessage = error instanceof Error ? error.message : 'Internal server error';
		return NextResponse.json({ error: errorMessage, rawData: [], documentCount: 0 }, { status: 500 });
	}
}
