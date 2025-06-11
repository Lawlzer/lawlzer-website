import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { db } from '~/server/db';

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

// List of fields in CommodityData to be used as filters
const FILTERABLE_FIELDS: string[] = ['type', 'category', 'country', 'state', 'cattleType', 'choiceGrade'];

// Helper to build the where clause from input filters
function buildWhereClause(inputFilters: InputFilters): Record<string, any> {
	const where: Record<string, any> = {};

	for (const [key, values] of Object.entries(inputFilters)) {
		// Ensure field is considered filterable
		if (FILTERABLE_FIELDS.includes(key) && values.length > 0) {
			where[key] = { in: values };
		}
	}

	return where;
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
		let totalDocuments: number;
		const hasInputFilters = Object.keys(inputFilters).length > 0;
		const whereClause = buildWhereClause(inputFilters);

		// Count documents based on filters
		if (hasInputFilters) {
			console.debug('[Filters API] Filters applied. Where clause:', JSON.stringify(whereClause));
			totalDocuments = await db.commodityData.count({ where: whereClause });
			console.debug(`[Filters API] Filtered document count: ${totalDocuments}`);
		} else {
			console.debug('[Filters API] No input filters. Counting all documents.');
			totalDocuments = await db.commodityData.count();
			console.debug(`[Filters API] Total document count: ${totalDocuments}`);
		}

		const formattedFilters: Record<string, FilterValueCount[]> = {};
		const commonFields: Record<string, any> = {};

		// Process each filterable field
		for (const field of FILTERABLE_FIELDS) {
			// Get unique values and counts for this field
			const groupBy = await db.commodityData.groupBy({
				by: [field as any],
				where: whereClause,
				_count: true,
			});

			if (groupBy.length === 0) continue;

			// Map to desired format and sort by count
			const mappedValues: FilterValueCount[] = groupBy
				.filter((g: any) => g[field] !== null)
				.map((g: any) => ({
					value: String(g[field]),
					count: g._count,
				}))
				.sort((a, b) => b.count - a.count);

			if (mappedValues.length === 0) continue;

			// Check for common field
			if (mappedValues.length === 1) {
				const totalCountForSingleValue = mappedValues[0].count;
				if (totalCountForSingleValue === totalDocuments && totalDocuments > 0) {
					commonFields[field] = mappedValues[0].value;
				}
			}

			// Apply the filter inclusion logic
			const maxCount = mappedValues.reduce((max, curr) => Math.max(max, curr.count), 0);
			const hasOnlyOneValue = mappedValues.length === 1;

			if (maxCount > 15 || hasOnlyOneValue) {
				// Sort by count desc, then by value asc
				formattedFilters[field] = mappedValues.sort((a, b) => {
					if (a.count !== b.count) return b.count - a.count;
					return a.value.localeCompare(b.value);
				});
			}
		}

		// Return results
		console.debug(`[Filters API] Successfully processed. Returning totalDocuments: ${totalDocuments}, Filter keys: ${Object.keys(formattedFilters).join(', ')}`);
		return NextResponse.json({ filters: formattedFilters, totalDocuments, commonFields });
	} catch (error) {
		console.error('Failed to fetch filters:', error);
		const errorMessage = error instanceof Error ? error.message : 'Internal server error';
		return NextResponse.json({ error: errorMessage, filters: {}, totalDocuments: 0 }, { status: 500 });
	}
}
