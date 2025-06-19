import { useCallback, useMemo, useState } from 'react';

import type { ChartDataApiResponse, Filters, FiltersApiResponse, RawDataPoint } from './DataPlatform.types';

export function useDataPlatform(): {
	// State
	availableFilters: Record<string, { value: string; count: number }[]> | null;
	rawDataPoints: RawDataPoint[] | null | undefined;
	totalDocuments: number;
	chartDocumentCount: number;
	chartLimitExceeded: boolean;
	activeFilters: Filters;
	loadingFilters: boolean;
	loadingChartData: boolean;
	commonFields: Record<string, any> | null;
	error: string | null;
	chartableFields: string[];
	canShowChartBasedOnFilters: boolean;

	// Actions
	fetchChartData: () => Promise<void>;
	fetchFiltersAndCount: () => Promise<void>;
	handleFilterToggle: (key: string, value: string) => void;
	isFilterActive: (key: string, value: string) => boolean;
	handleClearFilters: () => void;

	// Utilities
	isLoading: boolean;
	hasFilterData: boolean;
	showCharts: boolean;
} {
	// State
	const [availableFilters, setAvailableFilters] = useState<Record<string, { value: string; count: number }[]> | null>(null);
	const [rawDataPoints, setRawDataPoints] = useState<RawDataPoint[] | null | undefined>(undefined);
	const [totalDocuments, setTotalDocuments] = useState<number>(0);
	const [chartDocumentCount, setChartDocumentCount] = useState<number>(0);
	const [chartLimitExceeded, setChartLimitExceeded] = useState<boolean>(false);
	const [activeFilters, setActiveFilters] = useState<Filters>({});
	const [loadingFilters, setLoadingFilters] = useState<boolean>(true);
	const [loadingChartData, setLoadingChartData] = useState<boolean>(false);
	const [commonFields, setCommonFields] = useState<Record<string, any> | null>(null);
	const [error, setError] = useState<string | null>(null);
	const [lastFetchTime, setLastFetchTime] = useState<Record<string, number>>({});

	// Cache key generation
	const getCacheKey = useCallback((type: 'chartData' | 'filters') => JSON.stringify({ type, filters: activeFilters }), [activeFilters]);

	// Function to check if data needs refresh
	const _isDataStale = useCallback(
		(cacheKey: string) => {
			const lastFetch = lastFetchTime[cacheKey];
			return lastFetch === undefined || Date.now() - lastFetch > 86400000; // 24 hour cache
		},
		[lastFetchTime]
	);

	// Fetch chart data
	const fetchChartData = useCallback(async () => {
		if (loadingFilters) {
			console.debug('[fetchChartData] Skipped - Filters are loading');
			return;
		}
		console.debug('[fetchChartData] Triggering fetch for raw data');
		setLoadingChartData(true);
		setError(null);
		setChartLimitExceeded(false);

		try {
			const params = new URLSearchParams();
			if (Object.keys(activeFilters).length > 0) {
				params.append('filters', JSON.stringify(activeFilters));
			}

			const response = await fetch(`/api/data-platform/getChartData?${params.toString()}`);
			if (!response.ok) {
				const errorData = await response.json().catch(() => ({}));
				throw new Error(errorData.error ?? `HTTP error! status: ${response.status}`);
			}
			const result: ChartDataApiResponse = await response.json();

			if (result.error !== undefined) {
				throw new Error(result.error);
			}

			setRawDataPoints(result.rawData);
			setChartDocumentCount(result.documentCount ?? 0);

			if (result.limitExceeded) {
				setChartLimitExceeded(true);
				setRawDataPoints(null);
			} else {
				setChartLimitExceeded(false);
			}

			setLastFetchTime((prev) => ({ ...prev, [getCacheKey('chartData')]: Date.now() }));
		} catch (e) {
			console.error('[useDataPlatform] Error fetching chart data:', e);
			setError(e instanceof Error ? e.message : 'An unknown error occurred fetching chart data');
			setRawDataPoints(undefined);
			setChartLimitExceeded(false);
		} finally {
			setLoadingChartData(false);
		}
	}, [activeFilters, loadingFilters, getCacheKey]);

	// Fetch filters and count
	const fetchFiltersAndCount = useCallback(async () => {
		console.debug('[fetchFiltersAndCount] Triggered');
		setLoadingFilters(true);
		setError(null);
		setRawDataPoints(undefined);
		setChartLimitExceeded(false);

		try {
			const params = new URLSearchParams();
			if (Object.keys(activeFilters).length > 0) {
				params.append('filters', JSON.stringify(activeFilters));
			}

			const response = await fetch(`/api/data-platform/filters?${params.toString()}`);
			if (!response.ok) {
				const errorData = await response.json().catch(() => ({}));
				throw new Error(errorData.error ?? `HTTP error! status: ${response.status}`);
			}
			const result: FiltersApiResponse = await response.json();

			setAvailableFilters(result.filters);
			setTotalDocuments(result.totalDocuments);
			setCommonFields(result.commonFields ?? null);

			setLastFetchTime((prev) => ({ ...prev, [getCacheKey('filters')]: Date.now() }));
		} catch (e) {
			console.error('Failed to fetch filters and count:', e);
			setError(e instanceof Error ? e.message : 'An unknown error occurred fetching filters');
			setAvailableFilters(null);
			setTotalDocuments(0);
			setCommonFields(null);
			setRawDataPoints(undefined);
			setChartLimitExceeded(false);
		} finally {
			setLoadingFilters(false);
		}
	}, [activeFilters, getCacheKey]);

	// Calculate chartable fields
	const chartableFields = useMemo(() => {
		if (!rawDataPoints || rawDataPoints.length === 0) return [];
		const fields = new Set<string>();
		for (const point of rawDataPoints) {
			Object.keys(point.values).forEach((key) => fields.add(key));
		}
		return Array.from(fields).sort((a, b) => a.localeCompare(b));
	}, [rawDataPoints]);

	// Determine if chart can be shown based on filters
	const canShowChartBasedOnFilters = useMemo(() => {
		if (loadingFilters || availableFilters === null) {
			return false;
		}

		const availableFilterEntries = Object.entries(availableFilters);

		if (availableFilterEntries.length === 0) {
			return true;
		}

		return availableFilterEntries.every(([key, valueCounts]) => {
			const isKeyActive = activeFilters[key] !== undefined && activeFilters[key].length > 0;
			const hasOnlyOneOption = valueCounts.length === 1;
			return isKeyActive || hasOnlyOneOption;
		});
	}, [availableFilters, activeFilters, loadingFilters]);

	// Filter handlers
	const handleFilterToggle = useCallback((key: string, value: string): void => {
		setActiveFilters((prevFilters) => {
			const currentKeyFilters = prevFilters[key] ?? [];
			const valueIndex = currentKeyFilters.indexOf(value);

			if (valueIndex > -1) {
				const updatedKeyFilters = currentKeyFilters.filter((v) => v !== value);
				if (updatedKeyFilters.length === 0) {
					const { [key]: _, ...rest } = prevFilters;
					return rest;
				} else {
					return { ...prevFilters, [key]: updatedKeyFilters };
				}
			} else {
				return { ...prevFilters, [key]: [...currentKeyFilters, value] };
			}
		});
	}, []);

	const isFilterActive = useCallback((key: string, value: string): boolean => activeFilters[key]?.includes(value) ?? false, [activeFilters]);

	const handleClearFilters = useCallback((): void => {
		setActiveFilters({});
	}, []);

	return {
		// State
		availableFilters,
		rawDataPoints,
		totalDocuments,
		chartDocumentCount,
		chartLimitExceeded,
		activeFilters,
		loadingFilters,
		loadingChartData,
		commonFields,
		error,
		chartableFields,
		canShowChartBasedOnFilters,

		// Actions
		fetchChartData,
		fetchFiltersAndCount,
		handleFilterToggle,
		isFilterActive,
		handleClearFilters,

		// Utilities
		isLoading: loadingFilters || loadingChartData,
		hasFilterData: !!(availableFilters && Object.keys(availableFilters).length > 0),
		showCharts: !!(!chartLimitExceeded && totalDocuments > 0 && rawDataPoints && rawDataPoints.length > 0),
	};
}
