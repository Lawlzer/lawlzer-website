import type { Document as MongoDocument } from 'mongodb';
import { MongoClient } from 'mongodb';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

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
type InputFilters = Record<string, string[]>; // Assuming values are always arrays from FE

// Type for the aggregation result from MongoDB for filter counts using $facet
type FacetResult = Record<string, { _id: string | null; count: number }[]>;

// List of fields in CommodityData to be used as filters
// TODO: Adjust this list based on actual desired filterable fields
const FILTERABLE_FIELDS: string[] = ['type', 'category', 'country', 'state', 'Cattle Type', 'Choice Grade'];

// Ensure DATABASE_URL is set in your environment variables
const uri = process.env.DATABASE_URL;
if (uri === undefined || uri === '') {
	throw new Error('Missing environment variable: DATABASE_URL');
}

let client: MongoClient | null = null;
let clientPromise: Promise<MongoClient> | null = null;

async function getMongoClient(): Promise<MongoClient> {
	// Add explicit checks for uri inside the function
	if (uri === undefined || uri === '') {
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

// Helper to build the $match stage from input filters
function buildMatchStage(inputFilters: InputFilters): MongoDocument {
	const matchQuery: MongoDocument = {};
	for (const [key, values] of Object.entries(inputFilters)) {
		// Ensure field is considered filterable
		if (FILTERABLE_FIELDS.includes(key) && values.length > 0) {
			matchQuery[key] = { $in: values };
		}
	}
	return { $match: matchQuery };
}

// Helper to build the $facet stage for filterable fields
function buildFacetStage(): MongoDocument {
	const facet: MongoDocument = {};
	for (const field of FILTERABLE_FIELDS) {
		facet[field] = [
			{ $match: { [field]: { $ne: null, $exists: true } } }, // Exclude null/missing values for this field
			{ $group: { _id: `$${field}`, count: { $sum: 1 } } },
			{ $sort: { count: -1 } }, // Sort by count descending within the facet
		];
	}
	return { $facet: facet };
}

export async function GET(req: NextRequest): Promise<NextResponse> {
	const url = new URL(req.url);
	const filtersParam = url.searchParams.get('filters');
	let inputFilters: InputFilters = {};

	if (filtersParam !== null && filtersParam !== '') {
		try {
			inputFilters = JSON.parse(filtersParam);
			console.debug('[Filters API] Parsed inputFilters:', JSON.stringify(inputFilters));
		} catch (error) {
			console.error('Failed to parse filters:', error);
			return NextResponse.json({ error: 'Invalid filters format' }, { status: 400 });
		}
	}

	try {
		const mongoClient = await getMongoClient();
		const db = mongoClient.db();
		// --- Use CommodityData Collection Directly ---
		const commodityCollection = db.collection('CommodityData');
		console.debug(`[Filters API] Using DB: ${db.databaseName}, Collection: ${commodityCollection.collectionName}`);

		let totalDocuments: number;
		const aggregationPipeline: MongoDocument[] = [];
		const hasInputFilters = Object.keys(inputFilters).length > 0;

		// 1. Build $match stage if filters are present
		if (hasInputFilters) {
			const matchStage = buildMatchStage(inputFilters);
			console.debug('[Filters API] Filters applied. Match stage:', JSON.stringify(matchStage));
			aggregationPipeline.push(matchStage);
			// Recalculate totalDocuments based on the filter match
			totalDocuments = await commodityCollection.countDocuments(matchStage.$match);
			console.debug(`[Filters API] Filtered document count: ${totalDocuments}`);
		} else {
			console.debug('[Filters API] No input filters. Counting all documents.');
			// Count all documents if no filters are applied
			totalDocuments = await commodityCollection.countDocuments({});
			console.debug(`[Filters API] Total document count: ${totalDocuments}`);
		}

		// 2. Build $facet stage
		const facetStage = buildFacetStage();
		aggregationPipeline.push(facetStage);

		// 3. Execute aggregation
		console.debug('[Filters API] Executing aggregation pipeline...');
		const aggregationResult = await commodityCollection.aggregate(aggregationPipeline).toArray();

		const formattedFilters: Record<string, FilterValueCount[]> = {};
		const commonFields: Record<string, any> = {};

		// Check if aggregation returned any result (it should return one document with facets)
		if (aggregationResult.length > 0) {
			const facetResult = aggregationResult[0] as FacetResult;
			console.debug(`[Filters API] Aggregation returned ${Object.keys(facetResult).length} facets.`);

			// 4. Process facet results
			for (const [field, values] of Object.entries(facetResult)) {
				if (values.length === 0) continue; // Skip empty facets

				// Map to desired format { value: string, count: number }
				const mappedValues: FilterValueCount[] = values
					.filter((v) => v._id !== null) // Filter out potential null grouping
					.map((v) => ({ value: String(v._id), count: v.count }));

				if (mappedValues.length === 0) continue; // Skip if only null values existed

				// Check for common field (only one value for this field in the *current* result set)
				if (mappedValues.length === 1) {
					// Check if the single value's count matches the relevant total
					const totalCountForSingleValue = mappedValues[0].count;
					if (totalCountForSingleValue === totalDocuments && totalDocuments > 0) {
						commonFields[field] = mappedValues[0].value;
					}
				}

				// Apply the filter inclusion logic (maxCount > 15 or only one value)
				const maxCount = mappedValues.reduce((max, curr) => Math.max(max, curr.count), 0);
				const hasOnlyOneValue = mappedValues.length === 1;

				if (maxCount > 15 || hasOnlyOneValue) {
					// Already sorted by count descending from facet stage
					// Add secondary sort by value ascending
					formattedFilters[field] = mappedValues.sort((a, b) => {
						if (a.count !== b.count) return 0; // Primary sort already done
						return a.value.localeCompare(b.value);
					});
				} else {
					// console.debug(`[Filters API] Excluding filter key "${field}" because max count (${maxCount}) <= 15 and it has multiple values.`);
				}
			}
		} else {
			console.debug('[Filters API] Aggregation returned no results.');
		}

		// Return results
		console.debug(`[Filters API] Successfully processed. Returning totalDocuments: ${totalDocuments}, Filter keys: ${Object.keys(formattedFilters).join(', ')}`);
		return NextResponse.json({ filters: formattedFilters, totalDocuments, commonFields });
	} catch (error) {
		console.error('Failed to fetch filters:', error);
		const errorMessage = error instanceof Error ? error.message : 'Internal server error';
		return NextResponse.json({ error: errorMessage, filters: {}, totalDocuments: 0 }, { status: 500 });
	} finally {
		// No explicit disconnect needed if using the connection pattern above for serverless
		// If running in a non-serverless environment, you might manage connections differently.
	}
}
