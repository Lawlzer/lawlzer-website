import { MongoClient } from 'mongodb';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import type { Document as MongoDocument, WithId, ObjectId } from 'mongodb';
import { startOfYear } from 'date-fns'; // Import date-fns function

// --- Type Definitions ---

// Structure for filters passed in the query string
type InputFilters = Record<string, string[] | boolean | number | string>;

// Structure matching CommodityData model
interface CommodityData extends MongoDocument {
	_id: ObjectId;
	unixDate: number; // Milliseconds since epoch
	type: string;
	category: string;
	country: string;
	state?: string;
	exports?: number;
	price?: number;
	head?: number;
	totalVolume?: number;
	cattleType?: string;
	choiceGrade?: string;
	// Add other fields as needed
}

// Structure for individual data points returned by the API
export type RawDataPoint = {
	timestamp: number; // unixDate in milliseconds
	values: Record<string, number>; // { fieldName: value }
};

// Max documents to process to avoid performance issues
const MAX_DOCUMENTS_FOR_PROCESSING = 5000;

// --- MongoDB Connection (reuse logic - assumed correct) ---
const uri = process.env.DATABASE_URL;
if (!uri) {
	throw new Error('Missing environment variable: DATABASE_URL');
}
let client: MongoClient | null = null;
let clientPromise: Promise<MongoClient> | null = null;

async function getMongoClient(): Promise<MongoClient> {
	if (!uri) {
		throw new Error('Missing environment variable: DATABASE_URL');
	}
	if (process.env.NODE_ENV === 'development') {
		// @ts-expect-error - Use global variable in dev
		if (!global._mongoClientPromise) {
			if (!uri) throw new Error('Missing DATABASE_URL for MongoClient');
			client = new MongoClient(uri);
			// @ts-expect-error - Use global variable in dev
			global._mongoClientPromise = client.connect();
		}
		// @ts-expect-error - Use global variable in dev
		clientPromise = global._mongoClientPromise;
	} else {
		if (!uri) throw new Error('Missing DATABASE_URL for MongoClient');
		client = new MongoClient(uri);
		clientPromise = client.connect();
	}
	if (!clientPromise) {
		throw new Error('MongoDB client promise initialization failed.');
	}
	return clientPromise;
}

// --- Helper Functions ---

// Function to build MongoDB query from input filters
function buildMongoQuery(inputFilters: InputFilters): MongoDocument {
	const query: MongoDocument = {};

	// Calculate the start date for the filter (start of year, 3 years ago)
	const now = new Date();
	const threeYearsAgoStartOfYear = startOfYear(new Date(now.getFullYear() - 2, 0, 1)); // Get start of the year 3 years ago (e.g., 2024 -> 2022-01-01, 2025 -> 2023-01-01)
	const startTimestamp = threeYearsAgoStartOfYear.getTime();

	// Add the date filter to the query
	query.unixDate = { $gte: startTimestamp };

	for (const [key, value] of Object.entries(inputFilters)) {
		// Skip processing 'unixDate' if it somehow came from inputFilters
		if (key === 'unixDate') continue;

		const mappedKey = key; // Assuming direct mapping for now
		if (Array.isArray(value)) {
			query[mappedKey] = { $in: value };
		} else {
			query[mappedKey] = value;
		}
	}
	console.log('Constructed Mongo Query:', JSON.stringify(query)); // Log the final query
	return query;
}

// REMOVED getTimeKey function - no longer needed

// --- API Route Handler --- REWRITTEN for Raw Data ---

export async function GET(req: NextRequest): Promise<NextResponse> {
	const url = new URL(req.url);
	const filtersParam = url.searchParams.get('filters');
	// REMOVED timeRange parameter
	let inputFilters: InputFilters = {};

	if (filtersParam) {
		try {
			inputFilters = JSON.parse(filtersParam);
			// --- BEGIN ADDED LOGGING ---
			console.log('[ChartData API] Received filters param:', filtersParam);
			console.log('[ChartData API] Parsed inputFilters:', JSON.stringify(inputFilters));
			// Log keys specifically to check for encoding issues
			console.log('[ChartData API] Parsed inputFilter Keys:', Object.keys(inputFilters));
			// --- END ADDED LOGGING ---
		} catch (error) {
			console.error('Failed to parse filters:', error);
			return NextResponse.json({ error: 'Invalid filters format' }, { status: 400 });
		}
	} else {
		console.log('[ChartData API] No filters param received.');
	}

	try {
		const mongoClient = await getMongoClient();
		const db = mongoClient.db();
		const commodityCollection = db.collection<CommodityData>('CommodityData');

		// 1. Build the MongoDB query
		const mongoQuery = buildMongoQuery(inputFilters);

		// 2. Count matching documents
		const documentCount = await commodityCollection.countDocuments(mongoQuery);

		if (documentCount === 0) {
			console.log('[RawData API] No documents match filters.');
			return NextResponse.json({ rawData: [], documentCount: 0 });
		}

		if (documentCount > MAX_DOCUMENTS_FOR_PROCESSING) {
			console.log(`[RawData API] Document count (${documentCount}) exceeds limit (${MAX_DOCUMENTS_FOR_PROCESSING}).`);
			return NextResponse.json({ rawData: null, limitExceeded: true, documentCount: documentCount });
		}

		// 3. Fetch required fields
		const projection: Record<string, number> = { unixDate: 1, price: 1, exports: 1, head: 1, totalVolume: 1 }; // Add others as needed
		const documentsCursor = commodityCollection.find(mongoQuery, { projection });
		const documents = await documentsCursor.toArray();

		// 4. Process documents into RawDataPoint array
		const rawData: RawDataPoint[] = [];
		const numericFieldsPresent = new Set<string>(); // Keep track of fields actually seen

		for (const doc of documents) {
			if (typeof doc.unixDate !== 'number' || isNaN(doc.unixDate) || !isFinite(doc.unixDate)) {
				console.warn('[RawData API] Skipping document with invalid unixDate:', doc._id);
				continue;
			}

			const values: Record<string, number> = {};
			let hasNumericValue = false;

			for (const field in doc) {
				if (field !== 'unixDate' && field !== '_id' && typeof doc[field as keyof CommodityData] === 'number') {
					const value = doc[field as keyof CommodityData] as number;
					if (!isNaN(value) && isFinite(value)) {
						values[field] = value;
						numericFieldsPresent.add(field);
						hasNumericValue = true;
					}
				}
			}

			// Only add point if it has at least one valid numeric value
			if (hasNumericValue) {
				rawData.push({ timestamp: doc.unixDate, values: values });
			}
		}

		console.log(`[RawData API] Processed ${rawData.length} data points from ${documentCount} documents. Numeric fields found: ${Array.from(numericFieldsPresent).join(', ')}`);

		// 5. Return the raw data points
		return NextResponse.json({ rawData: rawData, documentCount: documentCount, limitExceeded: false });
	} catch (error) {
		console.error('Failed to fetch raw data:', error);
		const errorMessage = error instanceof Error ? error.message : 'Internal server error';
		return NextResponse.json({ error: errorMessage, rawData: [], documentCount: 0 }, { status: 500 });
	} finally {
		// Connection management
	}
}
