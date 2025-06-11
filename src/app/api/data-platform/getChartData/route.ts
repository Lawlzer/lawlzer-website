import type { Document as MongoDocument, ObjectId } from 'mongodb';
import { MongoClient } from 'mongodb';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

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
export interface RawDataPoint {
	timestamp: number; // unixDate in milliseconds
	values: Record<string, number>; // { fieldName: value }
}

// Max documents to process to avoid performance issues
const MAX_DOCUMENTS_FOR_PROCESSING = 5000;

// --- MongoDB Connection (reuse logic - assumed correct) ---
let client: MongoClient | null = null;
let clientPromise: Promise<MongoClient> | null = null;

async function getMongoClient(): Promise<MongoClient> {
	const uri = process.env.DATABASE_URL;
	if (uri === undefined || uri === '') {
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

// Function to build MongoDB query for CommodityData based on inputFilters
function buildCommodityQuery(inputFilters: InputFilters): MongoDocument {
	const query: MongoDocument = {};

	// Add filters directly from inputFilters
	for (const [key, value] of Object.entries(inputFilters)) {
		// Add logic here if keys in inputFilters need mapping to CommodityData fields
		const mappedKey = key; // Assuming direct mapping for now

		// Handle array values for $in, otherwise direct match
		if (Array.isArray(value) && value.length > 0) {
			query[mappedKey] = { $in: value };
		} else if (!Array.isArray(value)) {
			// Handle boolean, number, string directly
			query[mappedKey] = value;
		}
		// Ignore empty arrays
	}

	console.info('Constructed Mongo Query:', JSON.stringify(query)); // Log the final query
	return query;
}

// --- API Route Handler --- REWRITTEN for Raw Data & CommodityData only ---

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
		const mongoClient = await getMongoClient();
		const db = mongoClient.db();
		// --- Use CommodityData Collection Only ---
		const commodityCollection = db.collection<CommodityData>('CommodityData');
		console.info(`[ChartData API] Using DB: ${db.databaseName}, Collection: ${commodityCollection.collectionName}`);

		// 1. Build the query directly from input filters
		const mongoQuery = buildCommodityQuery(inputFilters);

		// 2. Count documents matching the query
		console.info(`[ChartData API] Counting documents in ${commodityCollection.collectionName} with query:`, JSON.stringify(mongoQuery));
		const documentCount = await commodityCollection.countDocuments(mongoQuery);
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

		// 4. Fetch required fields from CommodityData using the constructed query
		// Define projection for fields needed by the chart
		const projection: Record<string, number> = {
			unixDate: 1,
			price: 1,
			exports: 1,
			head: 1,
			totalVolume: 1,
			// Add other numeric fields used in charts here
		};
		console.info('[ChartData API] Fetching documents with projection...');
		const documentsCursor = commodityCollection.find(mongoQuery, { projection });
		const documents = await documentsCursor.toArray();
		console.info(`[ChartData API] Fetched ${documents.length} documents.`);

		// 5. Process documents into RawDataPoint array
		const rawData: RawDataPoint[] = [];
		const numericFieldsPresent = new Set<string>();

		for (const doc of documents) {
			if (typeof doc.unixDate !== 'number' || isNaN(doc.unixDate) || !isFinite(doc.unixDate)) {
				console.warn('[ChartData API] Skipping document with invalid unixDate:', doc._id);
				continue;
			}

			const values: Record<string, number> = {};
			let hasNumericValue = false;

			// Iterate over projected fields only for efficiency
			for (const field in projection) {
				if (field !== 'unixDate' && field !== '_id' && field in doc) {
					const value = doc[field as keyof CommodityData];
					if (typeof value === 'number' && !isNaN(value) && isFinite(value)) {
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

		console.info(`[ChartData API] Processed ${rawData.length} data points. Numeric fields found: ${Array.from(numericFieldsPresent).join(', ')}`);

		// 6. Return the raw data points
		return NextResponse.json({ rawData: rawData, documentCount: documentCount, limitExceeded: false });
	} catch (error) {
		console.error('Failed to fetch chart data:', error);
		const errorMessage = error instanceof Error ? error.message : 'Internal server error';
		return NextResponse.json({ error: errorMessage, rawData: [], documentCount: 0 }, { status: 500 });
	} finally {
		// Connection management
	}
}
