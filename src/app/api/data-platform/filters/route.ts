import { MongoClient, ObjectId } from 'mongodb';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import type { Document as MongoDocument } from 'mongodb';

// Define the structure for a single filter value with its count
interface FilterValueCount {
	value: string;
	count: number;
}

// Adjusted response structure to include counts for each filter value and common fields
export interface FiltersResponse {
	filters: Record<string, FilterValueCount[]>; // Key: Field name, Value: Array of {value, count} objects
	totalDocuments: number;
	commonFields?: Record<string, any>; // Optional: Fields common to all matching documents
}

// Define the structure for filters passed in the query string
type InputFilters = Record<string, string[]>;

// Type for the raw aggregation result from MongoDB for filter counts
type AggregationResult = {
	_id: string; // Field key
	values: { k: string; v: number }[]; // k: value, v: count
}[];

// Document structure for projection
interface DocumentIdOnly extends MongoDocument {
	_id: ObjectId;
}

// Ensure DATABASE_URL is set in your environment variables
const uri = process.env.DATABASE_URL;
if (!uri) {
	throw new Error('Missing environment variable: DATABASE_URL');
}

let client: MongoClient | null = null;
let clientPromise: Promise<MongoClient> | null = null;

async function getMongoClient(): Promise<MongoClient> {
	// Add explicit checks for uri inside the function
	if (!uri) {
		throw new Error('Missing environment variable: DATABASE_URL');
	}
	if (process.env.NODE_ENV === 'development') {
		// @ts-expect-error - Use global variable in dev
		if (!global._mongoClientPromise) {
			// Explicit check before usage
			if (!uri) throw new Error('Missing DATABASE_URL for MongoClient');
			client = new MongoClient(uri);
			// @ts-expect-error - Use global variable in dev
			global._mongoClientPromise = client.connect();
		}
		// @ts-expect-error - Use global variable in dev
		clientPromise = global._mongoClientPromise;
	} else {
		// Explicit check before usage
		if (!uri) throw new Error('Missing DATABASE_URL for MongoClient');
		client = new MongoClient(uri);
		clientPromise = client.connect();
	}
	if (!clientPromise) {
		throw new Error('MongoDB client promise initialization failed.');
	}
	return clientPromise;
}

export async function GET(req: NextRequest): Promise<NextResponse> {
	const url = new URL(req.url);
	const filtersParam = url.searchParams.get('filters');
	let inputFilters: InputFilters = {};

	if (filtersParam) {
		try {
			inputFilters = JSON.parse(filtersParam);
			console.log('[Filters API] Received filters param:', filtersParam);
			console.log('[Filters API] Parsed inputFilters:', JSON.stringify(inputFilters));
			console.log('[Filters API] Parsed inputFilter Keys:', Object.keys(inputFilters));
		} catch (error) {
			console.error('Failed to parse filters:', error);
			return NextResponse.json({ error: 'Invalid filters format' }, { status: 400 });
		}
	} else {
		console.log('[Filters API] No filters param received.');
	}

	try {
		const mongoClient = await getMongoClient();
		const db = mongoClient.db(); // Use default DB from connection string
		const dataDocumentCollection = db.collection('DataDocument');
		const dataEntryCollection = db.collection('DataEntry');

		let matchingDocumentIds: ObjectId[] | null = null; // Null signifies 'all documents' initially
		// Initialize commonFields at the start of the try block
		const commonFields: Record<string, any> = {};

		// 1. Find matching document IDs based on input filters by querying DataEntry
		if (Object.keys(inputFilters).length > 0) {
			try {
				const documentIdsPerFilter: ObjectId[][] = [];

				// Find document IDs matching each filter criterion
				for (const [key, values] of Object.entries(inputFilters)) {
					// Find entries matching the key and any of the values
					const entryQuery = { key: key, value: { $in: values } };
					// Get distinct documentIds associated with these entries
					// Explicitly type the result of distinct using a cast
					const idsForKey = (await dataEntryCollection.distinct('documentId', entryQuery)) as ObjectId[];
					// Assuming 'documentId' field in DataEntry stores actual ObjectId instances
					documentIdsPerFilter.push(idsForKey);
				}

				// Calculate the intersection of document IDs from all filters
				if (documentIdsPerFilter.length > 0) {
					// Check if any filter returned zero results, meaning the intersection is empty
					if (documentIdsPerFilter.some((ids) => ids.length === 0)) {
						matchingDocumentIds = [];
					} else {
						// Use Set for efficient intersection calculation
						const idSets = documentIdsPerFilter.map((ids) => new Set(ids.map((id) => id.toHexString())));
						let intersection = new Set(idSets[0]);

						for (let i = 1; i < idSets.length; i++) {
							const currentIntersection = intersection; // Capture current value for filter closure
							intersection = new Set([...idSets[i]].filter((idStr: string) => currentIntersection.has(idStr))); // Add type to filter param
						}

						// Explicitly map string IDs back to ObjectIds
						matchingDocumentIds = Array.from(intersection).map((idStr: string): ObjectId => new ObjectId(idStr));
					}
				} else {
					// This case should technically not be reached if inputFilters has keys,
					// but handle defensively.
					matchingDocumentIds = [];
				}
			} catch (filterError) {
				console.error('[Filters API] Error processing filters:', filterError);
				const errorMessage = filterError instanceof Error ? filterError.message : 'Internal server error during filter processing';
				return NextResponse.json({ error: errorMessage }, { status: 500 });
			}
		}

		// 2. Determine total documents and final list of IDs for aggregation
		let totalDocuments: number;
		let idsForAggregation: ObjectId[];

		if (matchingDocumentIds === null) {
			// No filters were applied, count all documents and use all IDs
			totalDocuments = await dataDocumentCollection.estimatedDocumentCount();
			const allDocsCursor = dataDocumentCollection.find<DocumentIdOnly>({}, { projection: { _id: 1 } });
			const allDocsArray: DocumentIdOnly[] = await allDocsCursor.toArray();
			// Explicitly type the result of map
			idsForAggregation = allDocsArray.map((doc: DocumentIdOnly): ObjectId => doc._id);
		} else {
			// Filters were applied, use the calculated intersection
			totalDocuments = matchingDocumentIds.length;
			idsForAggregation = matchingDocumentIds;
		}

		// If filters were applied and the result is zero documents, return early
		if (totalDocuments === 0 && Object.keys(inputFilters).length > 0) {
			console.log('[Filters API] No matching documents found with active filters.');
			return NextResponse.json({ filters: {}, totalDocuments: 0 });
		}

		// 3. Aggregate distinct key-value pairs WITH counts from the final set of documents
		const formattedFilters: Record<string, FilterValueCount[]> = {};
		if (idsForAggregation.length > 0) {
			// MongoDB Aggregation Pipeline (using native driver syntax)
			const aggregationPipeline = [
				{
					$match: {
						// Ensure we are matching against ObjectId instances
						documentId: { $in: idsForAggregation },
						// Exclude the 'unixDate' key from the aggregation results
						key: { $ne: 'unixDate' },
					},
				},
				{
					$group: {
						_id: { key: '$key', value: '$value' },
						count: { $sum: 1 },
					},
				},
				{
					$group: {
						_id: '$_id.key',
						values: { $push: { k: '$_id.value', v: '$count' } },
					},
				},
			];

			const results = (await dataEntryCollection.aggregate(aggregationPipeline).toArray()) as AggregationResult;

			// 4. Format the results and identify common fields
			for (const item of results) {
				const key = item._id;
				const totalCountForKey = item.values.reduce((sum, curr) => sum + curr.v, 0);

				// Check for common field: only one value and count matches total documents
				// Ensure totalDocuments is greater than 0 to make this meaningful
				if (item.values.length === 1 && totalCountForKey === totalDocuments && totalDocuments > 0) {
					commonFields[key] = item.values[0].k; // Store the single value
				}

				// Find the maximum count for any value within this key
				const maxCount = item.values.reduce((max, curr) => Math.max(max, curr.v), 0);
				// Check if the key has only one distinct value
				const hasOnlyOneValue = item.values.length === 1;

				// Include the filter key if its most frequent value appears > 15 times
				// OR if it only has one distinct value (regardless of count)
				if (maxCount > 15 || hasOnlyOneValue) {
					formattedFilters[key] = item.values
						.map((v) => ({ value: v.k, count: v.v }))
						// Sort values primarily by count (desc), then by value (asc)
						.sort((a, b) => {
							if (b.count !== a.count) {
								return b.count - a.count;
							}
							return a.value.localeCompare(b.value);
						});
				} else {
					// console.log(`[Filters API] Excluding filter key "${key}" because max count (${maxCount}) is not > 15 and it has multiple values.`);
				}
			}
		} else if (totalDocuments > 0 && Object.keys(inputFilters).length === 0) {
			// Case: No filters applied, but aggregation still needs to run on all docs
			// This case might be redundant if idsForAggregation is populated correctly when matchingDocumentIds is null
			// console.log('[Filters API] No filters applied, but found documents. Aggregation should have run.');
			// The logic above should handle this, but adding a log just in case.
			// If this log appears, review the idsForAggregation logic when no filters are applied.
		} else {
			// console.log('[Filters API] Skipping aggregation as there are no document IDs to aggregate.');
		}

		// Return filters with counts, total document count, and common fields
		return NextResponse.json({ filters: formattedFilters, totalDocuments, commonFields });
	} catch (error) {
		console.error('Failed to fetch filters:', error);
		// Ensure error is an instance of Error for consistent handling
		const errorMessage = error instanceof Error ? error.message : 'Internal server error';
		// Ensure we return a consistent structure even on error, without commonFields
		return NextResponse.json({ error: errorMessage, filters: {}, totalDocuments: 0 }, { status: 500 });
	} finally {
		// No explicit disconnect needed if using the connection pattern above for serverless
		// If running in a non-serverless environment, you might manage connections differently.
	}
}
