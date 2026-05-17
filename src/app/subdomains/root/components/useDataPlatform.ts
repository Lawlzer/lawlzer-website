import { useCallback, useMemo, useState } from 'react';

import type { ChartDataApiResponse, Filters, FiltersApiResponse, RawDataPoint } from './DataPlatform.types';

async function fetchChartDataFromApi(activeFilters: Filters): Promise<ChartDataApiResponse> {
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
	return result;
}

async function fetchFiltersFromApi(activeFilters: Filters): Promise<FiltersApiResponse> {
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
	return result;
}

function computeChartableFields(rawDataPoints: RawDataPoint[] | null | undefined): string[] {
	if (!rawDataPoints || rawDataPoints.length === 0) return [];
	const fields = new Set<string>();
	for (const point of rawDataPoints) {
		Object.keys(point.values).forEach((key) => fields.add(key));
	}
	return Array.from(fields).sort((a, b) => a.localeCompare(b));
}

function computeCanShowChart(loadingFilters: boolean, availableFilters: Record<string, { value: string; count: number }[]> | null, activeFilters: Filters): boolean {
	if (loadingFilters || availableFilters === null) return false;
	const entries = Object.entries(availableFilters);
	if (entries.length === 0) return true;
	return entries.every(([key, valueCounts]) => {
		const isKeyActive = activeFilters[key] !== undefined && activeFilters[key].length > 0;
		return isKeyActive || valueCounts.length === 1;
	});
}

function toggleFilter(prevFilters: Filters, key: string, value: string): Filters {
	const currentKeyFilters = prevFilters[key] ?? [];
	const valueIndex = currentKeyFilters.indexOf(value);
	if (valueIndex > -1) {
		const updatedKeyFilters = currentKeyFilters.filter((v) => v !== value);
		if (updatedKeyFilters.length === 0) {
			const { [key]: _, ...rest } = prevFilters;
			return rest;
		}
		return { ...prevFilters, [key]: updatedKeyFilters };
	}
	return { ...prevFilters, [key]: [...currentKeyFilters, value] };
}

interface UseDataPlatformReturn {
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
	fetchChartData: () => Promise<void>;
	fetchFiltersAndCount: () => Promise<void>;
	handleFilterToggle: (key: string, value: string) => void;
	isFilterActive: (key: string, value: string) => boolean;
	handleClearFilters: () => void;
	isLoading: boolean;
	hasFilterData: boolean;
	showCharts: boolean;
}

export function useDataPlatform(): UseDataPlatformReturn {
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

	const fetchChartData = useCallback(async () => {
		if (loadingFilters) return;
		setLoadingChartData(true);
		setError(null);
		setChartLimitExceeded(false);
		try {
			const result = await fetchChartDataFromApi(activeFilters);
			setRawDataPoints(result.rawData);
			setChartDocumentCount(result.documentCount ?? 0);
			if (result.limitExceeded) {
				setChartLimitExceeded(true);
				setRawDataPoints(null);
			} else {
				setChartLimitExceeded(false);
			}
		} catch (e) {
			console.error('[useDataPlatform] Error fetching chart data:', e);
			setError(e instanceof Error ? e.message : 'An unknown error occurred fetching chart data');
			setRawDataPoints(undefined);
			setChartLimitExceeded(false);
		} finally {
			setLoadingChartData(false);
		}
	}, [activeFilters, loadingFilters]);

	const fetchFiltersAndCount = useCallback(async () => {
		setLoadingFilters(true);
		setError(null);
		setRawDataPoints(undefined);
		setChartLimitExceeded(false);
		try {
			const result = await fetchFiltersFromApi(activeFilters);
			setAvailableFilters(result.filters);
			setTotalDocuments(result.totalDocuments);
			setCommonFields(result.commonFields ?? null);
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
	}, [activeFilters]);

	const chartableFields = useMemo(() => computeChartableFields(rawDataPoints), [rawDataPoints]);
	const canShowChartBasedOnFilters = useMemo(() => computeCanShowChart(loadingFilters, availableFilters, activeFilters), [availableFilters, activeFilters, loadingFilters]);
	const handleFilterToggle = useCallback((key: string, value: string): void => {
		setActiveFilters((prev) => toggleFilter(prev, key, value));
	}, []);
	const isFilterActive = useCallback((key: string, value: string): boolean => activeFilters[key]?.includes(value) ?? false, [activeFilters]);
	const handleClearFilters = useCallback((): void => {
		setActiveFilters({});
	}, []);

	return {
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
		fetchChartData,
		fetchFiltersAndCount,
		handleFilterToggle,
		isFilterActive,
		handleClearFilters,
		isLoading: loadingFilters || loadingChartData,
		hasFilterData: !!(availableFilters && Object.keys(availableFilters).length > 0),
		showCharts: !!(!chartLimitExceeded && totalDocuments > 0 && rawDataPoints && rawDataPoints.length > 0),
	};
}
