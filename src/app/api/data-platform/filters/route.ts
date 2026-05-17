import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { buildWhereClause, FILTERABLE_FIELDS, type InputFilters } from '~/server/dataPlatform/query';
import { db } from '~/server/db';

interface FilterValueCount {
	value: string;
	count: number;
}

export interface FiltersResponse {
	filters: Record<string, FilterValueCount[]>;
	totalDocuments: number;
	commonFields?: Record<string, unknown>;
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

		const response = NextResponse.json({ filters: formattedFilters, totalDocuments, commonFields });

		// Set cache headers for 24 hours
		response.headers.set('Cache-Control', 'public, s-maxage=86400, stale-while-revalidate=3600');

		return response;
	} catch (error) {
		console.error('Failed to fetch filters:', error);
		const errorMessage = error instanceof Error ? error.message : 'Internal server error';
		return NextResponse.json({ error: errorMessage, filters: {}, totalDocuments: 0 }, { status: 500 });
	}
}
