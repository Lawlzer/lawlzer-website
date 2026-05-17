'use client';

import { getDayOfYear as dfnsGetDayOfYear, getYear } from 'date-fns';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { useMediaQuery } from '~/hooks/useMediaQuery';
import { DataPlatformCache } from '~/utils/dataPlatformCache';

import type { ChartDataApiResponse, FiltersApiResponse, RawDataPoint } from './DataPlatform.types';

type Filters = Record<string, string[]>;
interface FilterValueCount {
	value: string;
	count: number;
	originalCount?: number;
}
interface SortedFilterEntry {
	key: string;
	valueCounts: FilterValueCount[];
	maxCount: number;
	isUnavailable?: boolean;
}
interface ChartPoint {
	x: number;
	y: number;
}
interface RangePoint {
	x: number;
	yMin: number;
	yMax: number;
}
type FormattedChartData = { datasets: { label: string; data: ChartPoint[]; color: string; isCurrentYear: boolean }[]; minMaxData: RangePoint[]; rangeLabel: string; rangeFillColor: string; hasPreviousYears: boolean } | null;

function computeChartColors(): { baseColors: string[]; currentYearColor: string; rangeFillColor: string } {
	const rootStyles = getComputedStyle(document.documentElement);
	const p = rootStyles.getPropertyValue('--primary-color').trim() || '#3c33e6';
	const s = rootStyles.getPropertyValue('--secondary-colour').trim() || '#f3f4f6';
	const hex = (h: string, a: number): string => {
		const r = parseInt(h.slice(1, 3), 16);
		const g = parseInt(h.slice(3, 5), 16);
		const b = parseInt(h.slice(5, 7), 16);
		return `rgba(${r}, ${g}, ${b}, ${a})`;
	};
	return { baseColors: [hex(p, 0.8), hex(p, 0.6), hex(s, 0.8), hex(p, 0.4), hex(p, 0.9)], currentYearColor: 'rgba(239, 68, 68, 0.8)', rangeFillColor: hex(p, 0.2) };
}

function buildFormattedChartData(rawDataPoints: RawDataPoint[], activeChartTab: string, hiddenDatasets: Set<string>): FormattedChartData {
	const dataByYear: Record<number, ChartPoint[]> = {};
	const currentYear = getYear(new Date());
	const startYear = currentYear - 2;
	rawDataPoints
		.filter((pt) => pt.values[activeChartTab] !== undefined)
		.forEach((point) => {
			const date = new Date(point.timestamp);
			const year = getYear(date);
			const day = dfnsGetDayOfYear(date);
			if (year >= startYear) {
				dataByYear[year] ??= [];
				dataByYear[year].push({ x: day, y: point.values[activeChartTab] });
			}
		});
	Object.values(dataByYear).forEach((d) => d.sort((a, b) => a.x - b.x));
	const sortedYears = Object.keys(dataByYear)
		.map(Number)
		.sort((a, b) => a - b);
	if (sortedYears.length === 0) return null;
	const { baseColors, currentYearColor, rangeFillColor } = computeChartColors();
	const yearColors: Record<number, string> = {};
	let ci = 0;
	sortedYears.forEach((y) => {
		if (y === currentYear) yearColors[y] = currentYearColor;
		else {
			yearColors[y] = baseColors[ci % baseColors.length];
			ci++;
		}
	});
	const previousYears = sortedYears.filter((y) => y < currentYear);
	const rangeLabel = `Range (${previousYears.join(', ')})`;
	const minMaxData: RangePoint[] = [];
	if (previousYears.length > 0 && !hiddenDatasets.has(rangeLabel)) {
		const visible = previousYears.filter((y) => !hiddenDatasets.has(String(y)));
		if (visible.length > 0) {
			const dayVals: Record<number, number[]> = {};
			visible.forEach((y) => {
				dataByYear[y]?.forEach((pt) => {
					dayVals[pt.x] ??= [];
					dayVals[pt.x].push(pt.y);
				});
			});
			for (let d = 1; d <= 366; d++) {
				const v = dayVals[d];
				if (typeof v !== 'undefined' && v.length > 0) minMaxData.push({ x: d, yMin: Math.min(...v), yMax: Math.max(...v) });
			}
			minMaxData.sort((a, b) => a.x - b.x);
		}
	}
	// eslint-disable-next-line @typescript-eslint/strict-boolean-expressions
	const datasets = sortedYears.map((y) => ({ label: String(y) + (y === currentYear ? ' (Current)' : ''), data: dataByYear[y] || [], color: yearColors[y], isCurrentYear: y === currentYear }));
	return { datasets, minMaxData, rangeLabel, rangeFillColor, hasPreviousYears: previousYears.length > 0 };
}

function extractChartKeys(rawData: RawDataPoint[] | null | undefined): string[] {
	if (!rawData || rawData.length === 0) return [];
	const fields = new Set<string>();
	for (let i = 0; i < Math.min(rawData.length, 10); i++) Object.keys(rawData[i].values).forEach((k) => fields.add(k));
	return Array.from(fields).sort();
}

function computeSortedFilterEntries(availableFilters: Record<string, { value: string; count: number }[]> | null, allFilterGroups: Set<string>, initialFilterOptions: Record<string, { value: string; count: number }[]> | null): SortedFilterEntry[] {
	if (availableFilters == null) return [];
	const base = initialFilterOptions ?? availableFilters;
	const entries = Array.from(allFilterGroups).map((key) => {
		const b = base[key] ?? [];
		const cur = availableFilters[key] ?? [];
		const curMap = new Map(cur.map((vc) => [vc.value, vc.count]));
		const merged = b.map((bv) => ({ value: bv.value, count: curMap.get(bv.value) ?? 0, originalCount: bv.count }));
		return { key, valueCounts: merged, maxCount: merged.length > 0 ? Math.max(...merged.map((vc) => vc.count), 0) : 0, isUnavailable: false };
	});
	return entries.sort((a, b) => (b.maxCount !== a.maxCount ? b.maxCount - a.maxCount : a.key.localeCompare(b.key)));
}

function useFiltersState(activeFilters: Filters, getCacheKey: (type: 'chartData' | 'filters') => string): { availableFilters: Record<string, { value: string; count: number }[]> | null; totalDocuments: number; commonFields: Record<string, any> | null; loadingFilters: boolean; hasLoadedFiltersOnce: boolean; allFilterGroups: Set<string>; initialFilterOptions: Record<string, { value: string; count: number }[]> | null } {
	const hasCached = useMemo(() => DataPlatformCache.get<FiltersApiResponse>(JSON.stringify({ type: 'filters', filters: {} })) !== null, []);
	const [availableFilters, setAvailableFilters] = useState<Record<string, { value: string; count: number }[]> | null>(null);
	const [totalDocuments, setTotalDocuments] = useState<number>(0);
	const [commonFields, setCommonFields] = useState<Record<string, any> | null>(null);
	const [loadingFilters, setLoadingFilters] = useState<boolean>(!hasCached);
	const [hasLoadedFiltersOnce, setHasLoadedFiltersOnce] = useState<boolean>(hasCached);
	const [allFilterGroups, setAllFilterGroups] = useState<Set<string>>(new Set());
	const [initialFilterOptions, setInitialFilterOptions] = useState<Record<string, { value: string; count: number }[]> | null>(null);
	const fetchFilters = useCallback(async () => {
		const cacheKey = getCacheKey('filters');
		const cached = DataPlatformCache.get<FiltersApiResponse>(cacheKey);
		if (cached !== null) {
			setAvailableFilters(cached.filters);
			setTotalDocuments(cached.totalDocuments);
			setCommonFields(cached.commonFields ?? null);
			if (cached.filters != null)
				setAllFilterGroups((prev) => {
					const n = new Set(prev);
					Object.keys(cached.filters).forEach((k) => n.add(k));
					return n;
				});
			if (Object.keys(activeFilters).length === 0 && cached.filters !== null) setInitialFilterOptions(cached.filters);
			setLoadingFilters(false);
			setHasLoadedFiltersOnce(true);
			return;
		}
		setLoadingFilters(true);
		try {
			const params = new URLSearchParams();
			if (Object.keys(activeFilters).length > 0) params.append('filters', JSON.stringify(activeFilters));
			const res = await fetch(`/api/data-platform/filters?${params.toString()}`);
			if (!res.ok) {
				const ed = await res.json().catch(() => ({}));
				throw new Error(ed.error ?? `HTTP error! status: ${res.status}`);
			}
			const result: FiltersApiResponse = await res.json();
			DataPlatformCache.set(cacheKey, result);
			setAvailableFilters(result.filters);
			setTotalDocuments(result.totalDocuments);
			setCommonFields(result.commonFields ?? null);
			if (result.filters != null)
				setAllFilterGroups((prev) => {
					const n = new Set(prev);
					Object.keys(result.filters).forEach((k) => n.add(k));
					return n;
				});
			if (Object.keys(activeFilters).length === 0 && result.filters !== null) setInitialFilterOptions(result.filters);
		} catch (e) {
			console.error('Failed to fetch filters:', e);
			setAvailableFilters(null);
			setTotalDocuments(0);
			setCommonFields(null);
		} finally {
			setLoadingFilters(false);
			setHasLoadedFiltersOnce(true);
		}
	}, [activeFilters, getCacheKey]);
	useEffect(() => {
		void fetchFilters();
	}, [activeFilters, fetchFilters]);
	return { availableFilters, totalDocuments, commonFields, loadingFilters, hasLoadedFiltersOnce, allFilterGroups, initialFilterOptions };
}

function useChartState(activeFilters: Filters, loadingFilters: boolean, availableFilters: Record<string, { value: string; count: number }[]> | null, getCacheKey: (type: 'chartData' | 'filters') => string): { rawDataPoints: RawDataPoint[] | null | undefined; chartDocumentCount: number; chartLimitExceeded: boolean; loadingChartData: boolean; activeChartTab: string | null; setActiveChartTab: (v: string | null) => void; error: string | null } {
	const [rawDataPoints, setRawDataPoints] = useState<RawDataPoint[] | null | undefined>(undefined);
	const [chartDocumentCount, setChartDocumentCount] = useState<number>(0);
	const [chartLimitExceeded, setChartLimitExceeded] = useState<boolean>(false);
	const [loadingChartData, setLoadingChartData] = useState<boolean>(false);
	const [activeChartTab, setActiveChartTab] = useState<string | null>(null);
	const [error, setError] = useState<string | null>(null);
	const fetchChart = useCallback(async () => {
		if (loadingFilters) return;
		const cacheKey = getCacheKey('chartData');
		const cached = DataPlatformCache.get<ChartDataApiResponse>(cacheKey);
		if (cached !== null) {
			setRawDataPoints(cached.rawData);
			setChartDocumentCount(cached.documentCount ?? 0);
			setChartLimitExceeded(cached.limitExceeded ?? false);
			const keys = extractChartKeys(cached.rawData);
			if (keys.length === 1) setActiveChartTab(keys[0]);
			else if (keys.length > 0) setActiveChartTab((c) => (c === null || !keys.includes(c) ? keys[0] : c));
			else setActiveChartTab(null);
			return;
		}
		setLoadingChartData(true);
		setError(null);
		setChartLimitExceeded(false);
		try {
			const params = new URLSearchParams();
			if (Object.keys(activeFilters).length > 0) params.append('filters', JSON.stringify(activeFilters));
			const res = await fetch(`/api/data-platform/getChartData?${params.toString()}`);
			if (!res.ok) {
				const ed = await res.json().catch(() => ({}));
				throw new Error(ed.error ?? `HTTP error! status: ${res.status}`);
			}
			const result: ChartDataApiResponse = await res.json();
			if (result.error !== undefined && result.error !== '') throw new Error(result.error);
			DataPlatformCache.set(cacheKey, result);
			setRawDataPoints(result.rawData);
			setChartDocumentCount(result.documentCount ?? 0);
			if (result.limitExceeded) {
				setChartLimitExceeded(true);
				setRawDataPoints(null);
			} else setChartLimitExceeded(false);
			const keys = extractChartKeys(result.rawData);
			if (keys.length === 1) setActiveChartTab(keys[0]);
			else if (keys.length > 0) setActiveChartTab((c) => (c === null || !keys.includes(c) ? keys[0] : c));
			else setActiveChartTab(null);
		} catch (e) {
			console.error('Failed to fetch chart data:', e);
			setError(e instanceof Error ? e.message : 'Unknown error');
			setRawDataPoints(undefined);
			setChartLimitExceeded(false);
		} finally {
			setLoadingChartData(false);
		}
	}, [activeFilters, loadingFilters, getCacheKey]);
	useEffect(() => {
		if (!loadingFilters && availableFilters !== null) void fetchChart();
	}, [activeFilters, loadingFilters, availableFilters, fetchChart]);
	return { rawDataPoints, chartDocumentCount, chartLimitExceeded, loadingChartData, activeChartTab, setActiveChartTab, error };
}

export function useDataPlatformPreviewState(): {
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
	activeChartTab: string | null;
	hiddenDatasets: Set<string>;
	mobileViewMode: 'chart' | 'filters';
	showProjectInfo: boolean;
	animationsEnabled: boolean;
	showSettingsModal: boolean;
	hasLoadedFiltersOnce: boolean;
	changingChartTabVisual: boolean;
	isMobile: boolean;
	chartableFields: string[];
	canShowChartBasedOnFilters: boolean;
	hasFilterData: boolean;
	showCharts: boolean;
	sortedFilterEntries: SortedFilterEntry[];
	getFormattedChartData: FormattedChartData;
	chartMessage: string | null;
	setShowProjectInfo: (v: boolean) => void;
	setAnimationsEnabled: (v: boolean) => void;
	setShowSettingsModal: (v: boolean) => void;
	handleFilterToggle: (key: string, value: string) => void;
	isFilterActive: (key: string, value: string) => boolean;
	handleClearFilters: () => void;
	handleToggleMobileView: () => void;
	handleChartTabChange: (tabKey: string) => void;
	handleLegendClick: (label: string) => void;
} {
	const [activeFilters, setActiveFilters] = useState<Filters>({});
	const [hiddenDatasets, setHiddenDatasets] = useState<Set<string>>(new Set());
	const [mobileViewMode, setMobileViewMode] = useState<'chart' | 'filters'>('filters');
	const [showProjectInfo, setShowProjectInfo] = useState<boolean>(false);
	const [animationsEnabled, setAnimationsEnabled] = useState<boolean>(() => {
		const s = localStorage.getItem('dataPlatformAnimations');
		return s !== null ? s === 'true' : true;
	});
	const [showSettingsModal, setShowSettingsModal] = useState<boolean>(false);
	const [changingChartTabVisual, setChangingChartTabVisual] = useState<boolean>(false);
	const isMobile = useMediaQuery('(max-width: 1023px)');
	const getCacheKey = useCallback((type: 'chartData' | 'filters') => JSON.stringify({ type, filters: activeFilters }), [activeFilters]);
	useEffect(() => {
		localStorage.setItem('dataPlatformAnimations', String(animationsEnabled));
	}, [animationsEnabled]);
	const filters = useFiltersState(activeFilters, getCacheKey);
	const chart = useChartState(activeFilters, filters.loadingFilters, filters.availableFilters, getCacheKey);
	const chartableFields = useMemo(() => {
		if (!chart.rawDataPoints || chart.rawDataPoints.length === 0) return [];
		const f = new Set<string>();
		for (const p of chart.rawDataPoints) Object.keys(p.values).forEach((k) => f.add(k));
		return Array.from(f).sort();
	}, [chart.rawDataPoints]);
	const canShowChartBasedOnFilters = useMemo(() => {
		if (filters.loadingFilters || filters.availableFilters === null) return false;
		const e = Object.entries(filters.availableFilters);
		if (e.length === 0) return true;
		return e.every(([k, vc]) => (activeFilters[k] !== undefined && activeFilters[k].length > 0) || vc.length === 1);
	}, [filters.availableFilters, activeFilters, filters.loadingFilters]);
	useEffect(() => {
		if (isMobile && canShowChartBasedOnFilters && !filters.loadingFilters && !chart.loadingChartData && !chart.chartLimitExceeded && chartableFields.length > 0) setMobileViewMode('chart');
	}, [isMobile, canShowChartBasedOnFilters, filters.loadingFilters, chart.loadingChartData, chart.chartLimitExceeded, chartableFields.length]);
	const handleFilterToggle = (key: string, value: string): void => {
		setActiveFilters((prev) => {
			const cur = prev[key] ?? [];
			const idx = cur.indexOf(value);
			if (idx > -1) {
				const upd = cur.filter((v) => v !== value);
				if (upd.length === 0) {
					const { [key]: _, ...rest } = prev;
					return rest;
				}
				return { ...prev, [key]: upd };
			}
			return { ...prev, [key]: [...cur, value] };
		});
	};
	const handleChartTabChange = (tabKey: string): void => {
		if (tabKey !== chart.activeChartTab) {
			setChangingChartTabVisual(true);
			chart.setActiveChartTab(tabKey);
			setHiddenDatasets(new Set());
			setTimeout(() => {
				setChangingChartTabVisual(false);
			}, 300);
		}
	};
	const handleLegendClick = (label: string): void => {
		setHiddenDatasets((prev) => {
			const n = new Set(prev);
			if (n.has(label)) n.delete(label);
			else n.add(label);
			return n;
		});
	};
	const hasFilterData = useMemo(() => !!(filters.availableFilters && Object.keys(filters.availableFilters).length > 0), [filters.availableFilters]);
	const showCharts = useMemo(() => !!(!chart.chartLimitExceeded && filters.totalDocuments > 0 && chart.rawDataPoints && chart.rawDataPoints.length > 0), [chart.chartLimitExceeded, filters.totalDocuments, chart.rawDataPoints]);
	const sortedFilterEntries = useMemo(() => computeSortedFilterEntries(filters.availableFilters, filters.allFilterGroups, filters.initialFilterOptions), [filters.availableFilters, filters.allFilterGroups, filters.initialFilterOptions]);
	const getFormattedChartData = useMemo(() => {
		if (!chart.rawDataPoints || chart.rawDataPoints.length === 0 || chart.activeChartTab === null) return null;
		return buildFormattedChartData(chart.rawDataPoints, chart.activeChartTab, hiddenDatasets);
	}, [chart.rawDataPoints, chart.activeChartTab, hiddenDatasets]);
	const chartMessage = useMemo(() => {
		if (chart.loadingChartData) return 'Loading chart data...';
		if (chart.chartLimitExceeded) return `Chart generation disabled. Dataset size (${chart.chartDocumentCount} documents) exceeds the limit. Apply more specific filters to reduce the count.`;
		if (!canShowChartBasedOnFilters) return 'Apply all available filters to view the chart.';
		if (chartableFields.length === 0) return 'No suitable numeric fields found for charting in the current data.';
		if (chart.activeChartTab === null) return 'Select a field above to view chart.';
		if (getFormattedChartData === null) return 'Could not generate chart data.';
		return null;
	}, [chart.loadingChartData, chart.chartLimitExceeded, chart.chartDocumentCount, canShowChartBasedOnFilters, chartableFields.length, chart.activeChartTab, getFormattedChartData]);
	return {
		availableFilters: filters.availableFilters,
		rawDataPoints: chart.rawDataPoints,
		totalDocuments: filters.totalDocuments,
		chartDocumentCount: chart.chartDocumentCount,
		chartLimitExceeded: chart.chartLimitExceeded,
		activeFilters,
		loadingFilters: filters.loadingFilters,
		loadingChartData: chart.loadingChartData,
		commonFields: filters.commonFields,
		error: chart.error,
		activeChartTab: chart.activeChartTab,
		hiddenDatasets,
		mobileViewMode,
		showProjectInfo,
		animationsEnabled,
		showSettingsModal,
		hasLoadedFiltersOnce: filters.hasLoadedFiltersOnce,
		changingChartTabVisual,
		isMobile,
		chartableFields,
		canShowChartBasedOnFilters,
		hasFilterData,
		showCharts,
		sortedFilterEntries,
		getFormattedChartData,
		chartMessage,
		setShowProjectInfo,
		setAnimationsEnabled,
		setShowSettingsModal,
		handleFilterToggle,
		isFilterActive: (key: string, value: string): boolean => activeFilters[key]?.includes(value) ?? false,
		handleClearFilters: (): void => {
			setActiveFilters({});
		},
		handleToggleMobileView: (): void => {
			setMobileViewMode((p) => (p === 'filters' ? 'chart' : 'filters'));
		},
		handleChartTabChange,
		handleLegendClick,
	};
}
