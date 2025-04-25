import { MongoClient, ObjectId } from 'mongodb';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import type { Document as MongoDocument, WithId } from 'mongodb';
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

// Helper to find intersecting document IDs based on filters applied to DataEntry collection
async function getMatchingDocumentIds(db: any, inputFilters: InputFilters): Promise<ObjectId[] | null> {
	const dataEntryCollection = db.collection('DataEntry');
	if (Object.keys(inputFilters).length === 0) {
		return null; // Return null if no filters are applied, signifying all documents initially
	}

	try {
		const documentIdsPerFilter: ObjectId[][] = [];

		// Find document IDs matching each filter criterion
		for (const [key, values] of Object.entries(inputFilters)) {
			const entryQuery = { key: key, value: { $in: Array.isArray(values) ? values : [values] } }; // Ensure values is an array for $in
			const idsForKey = (await dataEntryCollection.distinct('documentId', entryQuery)) as ObjectId[];
			documentIdsPerFilter.push(idsForKey);
		}

		// Calculate the intersection of document IDs from all filters
		if (documentIdsPerFilter.length > 0) {
			if (documentIdsPerFilter.some((ids) => ids.length === 0)) {
				return []; // Empty intersection if any filter yields no results
			}
			const idSets = documentIdsPerFilter.map((ids) => new Set(ids.map((id) => id.toHexString())));
			let intersection = new Set(idSets[0]);
			for (let i = 1; i < idSets.length; i++) {
				const currentIntersection = intersection;
				intersection = new Set([...idSets[i]].filter((idStr: string) => currentIntersection.has(idStr)));
			}
			return Array.from(intersection).map((idStr: string): ObjectId => new ObjectId(idStr));
		} else {
			return []; // Should not be reached if inputFilters has keys, but handle defensively
		}
	} catch (filterError) {
		console.error('[ChartData API - getMatchingDocumentIds] Error processing filters:', filterError);
		throw filterError; // Re-throw to be caught by the main handler
	}
}

// Function to build MongoDB query for CommodityData, incorporating document IDs and date range
function buildCommodityQuery(matchingIds: ObjectId[] | null, inputFilters: InputFilters): MongoDocument {
	const query: MongoDocument = {};

	// Calculate the start date for the filter (start of year, 3 years ago)
	const now = new Date();
	const threeYearsAgoStartOfYear = startOfYear(new Date(now.getFullYear() - 2, 0, 1));
	const startTimestamp = threeYearsAgoStartOfYear.getTime();

	// Add the date filter to the query
	query.unixDate = { $gte: startTimestamp };

	// If specific document IDs were found via filters, add them to the query
	if (matchingIds !== null) {
		// Assuming CommodityData has a field linking it back to DataDocument, e.g., 'documentId'
		// If the link field name is different, update it here.
		// If CommodityData DOES NOT have a direct link back to DataDocument _id,
		// we might need to fetch CommodityData based on the filter criteria directly,
		// but the COUNT should still come from the DataEntry intersection.
		// For now, assuming a 'documentId' field exists in CommodityData:
		// query.documentId = { $in: matchingIds }; // <--- UNCOMMENT AND ADJUST IF NEEDED

		// If CommodityData ONLY has fields like type, category, country etc.
		// we need to apply the ORIGINAL filters directly, but the count comes from matchingIds.length
		// Add original filters back for fetching data (if not using documentId)
		for (const [key, value] of Object.entries(inputFilters)) {
			if (key === 'unixDate') continue; // Already handled
			const mappedKey = key;
			if (Array.isArray(value)) {
				query[mappedKey] = { $in: value };
			} else {
				query[mappedKey] = value;
			}
		}
	}
	// If matchingIds is null (no filters applied), the query only contains the date range.

	console.log('Constructed Mongo Query:', JSON.stringify(query)); // Log the final query
	return query;
}

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
		// We might need DataEntry collection now
		const dataEntryCollection = db.collection('DataEntry'); // Add this line
		const commodityCollection = db.collection<CommodityData>('CommodityData'); // Keep this for fetching data

		// --- BEGIN REVISED LOGIC ---

		// 1. Find matching document IDs using the helper function (queries DataEntry)
		const matchingDocumentIds = await getMatchingDocumentIds(db, inputFilters);

		// 2. Determine the count based on the intersection result
		let documentCount: number;
		if (matchingDocumentIds === null) {
			// No filters applied, count all relevant CommodityData within date range
			// (or perhaps count all DataDocuments if that's more appropriate? TBC)
			// For now, let's estimate count on CommodityData matching date range
			const dateQuery = buildCommodityQuery(null, {}); // Only date filter
			documentCount = await commodityCollection.countDocuments(dateQuery);
			console.log(`[ChartData API] No filters applied. Estimated count based on date range: ${documentCount}`);
		} else {
			// Filters were applied, count is the length of the intersection
			documentCount = matchingDocumentIds.length;
			console.log(`[ChartData API] Filters applied. Count from document ID intersection: ${documentCount}`);
		}

		if (documentCount === 0) {
			console.log('[RawData API] No documents match filters.');
			return NextResponse.json({ rawData: [], documentCount: 0 });
		}

		// 3. Check count against the limit (using the CORRECT count now)
		if (documentCount > MAX_DOCUMENTS_FOR_PROCESSING) {
			console.log(`[RawData API] Document count (${documentCount}) exceeds limit (${MAX_DOCUMENTS_FOR_PROCESSING}).`);
			return NextResponse.json({ rawData: null, limitExceeded: true, documentCount: documentCount });
		}

		// 4. Build the final query to fetch CommodityData
		// This query might use matchingDocumentIds OR the original inputFilters depending on schema
		// The current buildCommodityQuery uses inputFilters if matchingDocumentIds is not null.
		const mongoQuery = buildCommodityQuery(matchingDocumentIds, inputFilters);

		// 5. Fetch required fields from CommodityData using the constructed query
		const projection: Record<string, number> = { unixDate: 1, price: 1, exports: 1, head: 1, totalVolume: 1 }; // Add others as needed
		const documentsCursor = commodityCollection.find(mongoQuery, { projection });
		const documents = await documentsCursor.toArray();

		// --- END REVISED LOGIC ---

		// 6. Process documents into RawDataPoint array
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

		// 7. Return the raw data points
		return NextResponse.json({ rawData: rawData, documentCount: documentCount, limitExceeded: false });
	} catch (error) {
		console.error('Failed to fetch raw data:', error);
		const errorMessage = error instanceof Error ? error.message : 'Internal server error';
		return NextResponse.json({ error: errorMessage, rawData: [], documentCount: 0 }, { status: 500 });
	} finally {
		// Connection management
	}
}
