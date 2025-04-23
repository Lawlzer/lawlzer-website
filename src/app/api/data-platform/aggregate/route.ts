import type { NextRequest } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Define the expected structure for filters
type Filters = Record<string, string[]>;

// Define the structure for the API response
type AggregationResult = Record<string, Record<string, number>>;

export async function GET(request: NextRequest): Promise<Response> {
	try {
		const searchParams = request.nextUrl.searchParams;
		const filtersParam = searchParams.get('filters');
		let filters: Filters = {};

		// Safely parse filters
		if (filtersParam) {
			try {
				const parsedFilters = JSON.parse(filtersParam);
				if (typeof parsedFilters === 'object' && parsedFilters !== null && Object.values(parsedFilters).every((value) => Array.isArray(value) && value.every((item) => typeof item === 'string'))) {
					filters = parsedFilters as Filters;
				} else {
					console.warn('Received invalid filters format:', filtersParam);
				}
			} catch (error) {
				console.error('Failed to parse filters:', error);
			}
		}

		let filteredDocumentIds: Set<string> | null = null;

		const filterKeys = Object.keys(filters);
		if (filterKeys.length > 0) {
			let documentIdsSet: Set<string> | null = null;

			for (const key of filterKeys) {
				const values = filters[key];
				if (values.length > 0) {
					const matchingDocs = await prisma.dataEntry.findMany({
						where: { key: key, value: { in: values } },
						select: { documentId: true },
						distinct: ['documentId'],
					});
					const currentDocIds = new Set(matchingDocs.map((doc) => doc.documentId));

					if (documentIdsSet === null) {
						documentIdsSet = currentDocIds;
					} else {
						// Apply explicit cast fix for intersection
						documentIdsSet = new Set(Array.from(documentIdsSet).filter((id): id is string => currentDocIds.has(id)));
					}

					if (documentIdsSet.size === 0) {
						break;
					}
				}
			}

			if (documentIdsSet !== null && documentIdsSet.size === 0) {
				filteredDocumentIds = new Set(['__NO_MATCHING_DOCS__']);
			} else if (documentIdsSet !== null) {
				filteredDocumentIds = documentIdsSet;
			}
		}

		const aggregation = await prisma.dataEntry.groupBy({
			where: filteredDocumentIds !== null ? { documentId: { in: [...filteredDocumentIds] } } : {},
			by: ['key', 'value'],
			_count: { value: true },
			orderBy: [{ key: 'asc' }, { _count: { value: 'desc' } }, { value: 'asc' }],
		});

		// Process aggregation using ??=
		const result: AggregationResult = aggregation.reduce<AggregationResult>((acc, curr) => {
			const { key, value } = curr;
			const count = curr._count.value;
			(acc[key] ??= {})[value] = count; // Use nullish coalescing assignment
			return acc;
		}, {});

		// Post-processing: Filter results by count and exclude ignored fields entirely
		const MIN_COUNT_THRESHOLD = 3;
		const FIELDS_TO_IGNORE: string[] = ['unixDate', 'Exports']; // Fields to exclude from the final result
		const filteredResult: AggregationResult = {};

		for (const key in result) {
			// Completely skip keys that are in the ignore list
			if (FIELDS_TO_IGNORE.includes(key)) {
				continue; // Skip this key, don't add it to filteredResult
			}

			// Apply count filtering for keys NOT in the ignore list
			const valueCounts = result[key];
			const filteredValueCounts: Record<string, number> = {};
			let hasEntriesAboveThreshold = false;

			for (const value in valueCounts) {
				if (valueCounts[value] > MIN_COUNT_THRESHOLD) {
					filteredValueCounts[value] = valueCounts[value];
					hasEntriesAboveThreshold = true;
				}
			}

			// Only add the key back if it wasn't ignored AND it has entries above the threshold
			if (hasEntriesAboveThreshold) {
				filteredResult[key] = filteredValueCounts;
			}
		}

		return new Response(JSON.stringify(filteredResult), {
			status: 200,
			headers: { 'Content-Type': 'application/json' },
		});
	} catch (error) {
		console.error('Error fetching aggregated data:', error);
		return new Response(JSON.stringify({ error: 'Internal Server Error' }), {
			status: 500,
			headers: { 'Content-Type': 'application/json' },
		});
	} finally {
		await prisma.$disconnect().catch(console.error);
	}
}
