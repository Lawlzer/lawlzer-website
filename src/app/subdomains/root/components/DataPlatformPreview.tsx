'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import type { JSX } from 'react';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, TimeScale } from 'chart.js';
import { Line } from 'react-chartjs-2';
import 'chartjs-adapter-date-fns'; // Import date adapter
import { getYear, getDayOfYear as dfnsGetDayOfYear, format as formatDateFns, addDays, startOfYear } from 'date-fns';

// Register Chart.js components including TimeScale
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, TimeScale);

// REMOVED MAX_DOCUMENTS constant, limit now handled by backend
// export const MAX_DOCUMENTS = 300;

// --- Data Structures for API Responses and State ---

// Structure for the response from /api/data-platform/filters
export type FiltersApiResponse = {
	filters: Record<string, { value: string; count: number }[]>;
	totalDocuments: number;
	commonFields?: Record<string, any>;
};

// Structure for individual data points from the API
export type RawDataPoint = {
	timestamp: number; // unixDate in milliseconds
	values: Record<string, number>; // { fieldName: value }
};

// Structure for the response from /api/data-platform/getChartData
export type ChartDataApiResponse = {
	rawData: RawDataPoint[] | null; // Array of raw data points
	limitExceeded?: boolean;
	documentCount?: number;
	error?: string;
};

// REMOVED TimeSeriesData & TimeSeriesChartData types - data is now aggregatedFields

// Define the structure for filters state
type Filters = Record<string, string[]>;

// --- Component Props ---
interface DataPlatformPreviewProps {
	onClose: () => void;
}

// --- Component Logic ---
export default function DataPlatformPreview({ onClose }: DataPlatformPreviewProps): JSX.Element {
	// State
	const [availableFilters, setAvailableFilters] = useState<Record<string, { value: string; count: number }[]> | null>(null);
	const [rawDataPoints, setRawDataPoints] = useState<RawDataPoint[] | null | undefined>(undefined); // Store raw data points
	const [totalDocuments, setTotalDocuments] = useState<number>(0);
	const [chartDocumentCount, setChartDocumentCount] = useState<number>(0);
	const [chartLimitExceeded, setChartLimitExceeded] = useState<boolean>(false);
	const [activeFilters, setActiveFilters] = useState<Filters>({});
	const [loadingFilters, setLoadingFilters] = useState<boolean>(true);
	const [loadingChartData, setLoadingChartData] = useState<boolean>(false);
	const [changingChartTabVisual, setChangingChartTabVisual] = useState<boolean>(false);
	const [commonFields, setCommonFields] = useState<Record<string, any> | null>(null);
	const [error, setError] = useState<string | null>(null);
	const [activeChartTab, setActiveChartTab] = useState<string | null>(null);
	const [lastFetchTime, setLastFetchTime] = useState<Record<string, number>>({});

	// Helper to format day of year for axis label
	const formatDayOfYearForAxis = (day: number): string => {
		// Use a non-leap year like 2001 as a reference for formatting
		const referenceDate = new Date(2001, 0, 1);
		const dateToShow = addDays(referenceDate, day - 1);
		return formatDateFns(dateToShow, 'MMM d');
	};

	// Generate cache key based on active filters (time range no longer needed for data fetch)
	const getCacheKey = useCallback(
		(type: 'chartData' | 'filters') => {
			return JSON.stringify({ type, filters: activeFilters });
		},
		[activeFilters]
	);

	// Check if data needs refresh (simplified)
	const isDataStale = useCallback(
		(cacheKey: string) => {
			const lastFetch = lastFetchTime[cacheKey] || 0;
			return Date.now() - lastFetch > 3600000; // 1 hour cache
		},
		[lastFetchTime]
	);

	// Function to fetch raw data points
	const fetchChartData = useCallback(async () => {
		if (loadingFilters) {
			console.log('[fetchChartData] Skipped - Filters are loading');
			return;
		}
		console.log('[fetchChartData] Triggering fetch for raw data');
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

			if (result.error) {
				throw new Error(result.error);
			}

			setRawDataPoints(result.rawData); // Store raw data
			setChartDocumentCount(result.documentCount ?? 0);

			if (result.limitExceeded) {
				setChartLimitExceeded(true);
				setRawDataPoints(null);
			} else {
				setChartLimitExceeded(false);
			}

			// Determine available numeric fields from the first few data points (if available)
			const availableChartKeys: string[] = [];
			if (result.rawData && result.rawData.length > 0) {
				const fields = new Set<string>();
				// Check first 10 points for available fields
				for (let i = 0; i < Math.min(result.rawData.length, 10); i++) {
					Object.keys(result.rawData[i].values).forEach((key) => fields.add(key));
				}
				availableChartKeys.push(...Array.from(fields).sort());
			}

			if (availableChartKeys.length === 1) {
				setActiveChartTab(availableChartKeys[0]);
			} else if (availableChartKeys.length > 0) {
				setActiveChartTab((currentTab) => {
					if (!currentTab || !availableChartKeys.includes(currentTab)) {
						return availableChartKeys[0];
					}
					return currentTab;
				});
			} else {
				setActiveChartTab(null);
			}

			setLastFetchTime((prev) => ({ ...prev, [getCacheKey('chartData')]: Date.now() }));
		} catch (e) {
			console.error('Failed to fetch chart data:', e);
			setError(e instanceof Error ? e.message : 'An unknown error occurred fetching chart data');
			setRawDataPoints(undefined);
			setChartLimitExceeded(false);
		} finally {
			setLoadingChartData(false);
		}
	}, [activeFilters, loadingFilters, getCacheKey]);

	// Function to fetch filters and total count
	const fetchFiltersAndCount = useCallback(async () => {
		console.log('[fetchFiltersAndCount] Triggered');
		setLoadingFilters(true);
		setError(null);
		setRawDataPoints(undefined); // Clear raw data when filters change
		setChartLimitExceeded(false);
		setActiveChartTab(null);

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

	// Fetch filters when activeFilters change
	useEffect(() => {
		console.log('Effect 1: Filters');
		void fetchFiltersAndCount();
	}, [fetchFiltersAndCount]);

	// Fetch chart data when activeFilters change or when filters finish loading
	useEffect(() => {
		console.log('Effect 2: Chart Data - Triggered by filter change or loading state');
		if (!loadingFilters) {
			void fetchChartData();
		}
	}, [activeFilters, loadingFilters, fetchChartData]); // Triggered by activeFilters (via fetchChartData dep) or loadingFilters change

	// --- Memoized Values for Rendering ---

	// Calculate chartable fields from the first few data points (more robustly)
	const chartableFields = useMemo(() => {
		if (!rawDataPoints || rawDataPoints.length === 0) return [];
		const fields = new Set<string>();
		for (const point of rawDataPoints) {
			Object.keys(point.values).forEach((key) => fields.add(key));
		}
		return Array.from(fields).sort((a, b) => a.localeCompare(b));
	}, [rawDataPoints]);

	// Check if there's filter data to display
	const hasFilterData = useMemo(() => {
		return availableFilters && Object.keys(availableFilters).length > 0;
	}, [availableFilters]);

	// Determine if charts should be shown
	const showCharts = useMemo(() => {
		return !chartLimitExceeded && totalDocuments > 0 && rawDataPoints && rawDataPoints.length > 0;
	}, [chartLimitExceeded, totalDocuments, rawDataPoints]);

	// --- Event Handlers ---

	const handleFilterToggle = (key: string, value: string): void => {
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
	};

	const isFilterActive = (key: string, value: string): boolean => {
		return activeFilters[key]?.includes(value) ?? false;
	};

	// Determine if the user has applied filters for all available filter options
	const canShowChartBasedOnFilters = useMemo(() => {
		// Block chart if filters are loading or not yet available
		if (loadingFilters || availableFilters === null) {
			return false;
		}

		const availableFilterEntries = Object.entries(availableFilters);

		// If the API returns no filter options, the user cannot filter further, so allow charting.
		if (availableFilterEntries.length === 0) {
			return true;
		}

		// If filter options ARE available, check if the user has handled ALL of them.
		// A filter category is considered 'handled' if EITHER:
		// 1. The user has actively selected a value within that category (key exists in activeFilters).
		// 2. The category only ever presented a single option (valueCounts.length === 1).
		return availableFilterEntries.every(([key, valueCounts]) => {
			const isKeyActive = activeFilters[key] !== undefined && activeFilters[key].length > 0;
			const hasOnlyOneOption = valueCounts.length === 1;
			return isKeyActive || hasOnlyOneOption;
		});
	}, [availableFilters, activeFilters, loadingFilters]);

	const sortedFilterEntries = useMemo(() => {
		if (!availableFilters) return [];
		return (
			Object.entries(availableFilters)
				.map(([key, valueCounts]) => ({
					key,
					valueCounts: valueCounts,
					// Calculate the max count for this filter category
					maxCount: Math.max(...valueCounts.map((vc) => vc.count), 0),
				}))
				// Sort by the calculated maxCount in descending order
				.sort((a, b) => {
					// Primary sort: descending by maxCount
					if (b.maxCount !== a.maxCount) {
						return b.maxCount - a.maxCount;
					}
					// Secondary sort: ascending by key name
					return a.key.localeCompare(b.key);
				})
		);
	}, [availableFilters]);

	const handleChartTabChange = (tabKey: string): void => {
		if (tabKey !== activeChartTab) {
			setChangingChartTabVisual(true);
			setActiveChartTab(tabKey);
			setTimeout(() => {
				setChangingChartTabVisual(false);
			}, 300);
		}
	};

	// Format raw data points for Chart.js, grouping by year, adding min/max overlay
	const getFormattedChartData = useMemo(() => {
		if (!rawDataPoints || rawDataPoints.length === 0 || !activeChartTab) {
			return null;
		}

		const dataByYear: Record<number, { x: number; y: number }[]> = {};
		const currentYear = getYear(new Date());
		const startYear = currentYear - 2; // We only care about the last 3 years (current + previous 2)

		// Filter points for the active field and within the last 3 years, then group by year
		rawDataPoints
			.filter((point) => point.values[activeChartTab] !== undefined)
			.forEach((point) => {
				const date = new Date(point.timestamp);
				const year = getYear(date);
				const dayOfYear = dfnsGetDayOfYear(date); // 1-366

				// Only include data from the last 3 years (current and previous two)
				// Backend should already filter, but belt-and-suspenders approach
				if (year >= startYear) {
					dataByYear[year] ??= []; // Use nullish coalescing assignment
					dataByYear[year].push({ x: dayOfYear, y: point.values[activeChartTab] });
				}
			});

		// Sort data within each year by dayOfYear
		Object.values(dataByYear).forEach((yearData) => {
			yearData.sort((a, b) => a.x - b.x);
		});

		const sortedYears = Object.keys(dataByYear)
			.map(Number)
			.sort((a, b) => a - b);

		if (sortedYears.length === 0) {
			return null; // No valid data found after filtering and grouping
		}

		// Define colors - Current Year Red, others cycle
		const baseColors = [
			'rgba(54, 162, 235, 0.8)', // Blue
			'rgba(75, 192, 192, 0.8)', // Teal
			'rgba(255, 206, 86, 0.8)', // Yellow
			'rgba(153, 102, 255, 0.8)', // Purple
			'rgba(255, 159, 64, 0.8)', // Orange
		];
		const currentYearColor = 'rgba(255, 99, 132, 0.8)'; // Red

		const yearColors: Record<number, string> = {};
		let colorIndex = 0;
		sortedYears.forEach((year) => {
			if (year === currentYear) {
				yearColors[year] = currentYearColor;
			} else {
				// Cycle through base colors for older years
				yearColors[year] = baseColors[colorIndex % baseColors.length];
				colorIndex++;
			}
		});

		// Calculate Min/Max for previous years
		const minMaxData: { x: number; yMin: number; yMax: number }[] = [];
		const previousYears = sortedYears.filter((y) => y < currentYear);

		if (previousYears.length > 0) {
			// Group data by day of year across previous years
			const dayValues: Record<number, number[]> = {};
			previousYears.forEach((year) => {
				dataByYear[year]?.forEach((point) => {
					dayValues[point.x] ??= [];
					dayValues[point.x].push(point.y);
				});
			});

			// Calculate min/max for each day
			for (let day = 1; day <= 366; day++) {
				const valuesForDay = dayValues[day]; // Explicitly get the array
				// Explicitly check if the array is defined and not empty
				if (typeof valuesForDay !== 'undefined' && valuesForDay.length > 0) {
					minMaxData.push({
						x: day,
						yMin: Math.min(...valuesForDay),
						yMax: Math.max(...valuesForDay),
					});
				}
			}
			minMaxData.sort((a, b) => a.x - b.x); // Ensure sorted by day
		}

		const datasets: any[] = sortedYears.map((year) => ({
			label: String(year) + (year === currentYear ? ' (Current)' : ''),
			data: dataByYear[year],
			borderColor: yearColors[year],
			backgroundColor: yearColors[year].replace('0.8', '0.2'),
			tension: 0.1,
			pointRadius: year === currentYear ? 1.5 : 0, // Smaller points for current year, none for past
			pointHoverRadius: 5,
			borderWidth: year === currentYear ? 2 : 1.5, // Thicker line for current year
			order: year === currentYear ? 0 : 1, // Ensure current year renders on top
		}));

		// Add Min/Max Range datasets if data exists
		if (minMaxData.length > 0) {
			// Create separate datasets for min and max points
			const minDataPoints = minMaxData.map((d) => ({ x: d.x, y: d.yMin }));
			const maxDataPoints = minMaxData.map((d) => ({ x: d.x, y: d.yMax }));

			// Add invisible dataset for the minimum boundary
			datasets.push({
				label: 'Min Boundary', // Internal label, won't show
				data: minDataPoints,
				borderColor: 'transparent',
				backgroundColor: 'transparent',
				pointRadius: 0,
				pointHoverRadius: 0,
				borderWidth: 0,
				tension: 0.1,
				fill: false, // Don't fill this line itself
				showInLegend: false, // Hide from legend
				order: 3, // Render behind everything else relevant
			});

			const minDatasetIndex = datasets.length - 1; // Get index of the min dataset just added

			// Add the visible dataset for the maximum boundary, filling down to the min dataset
			datasets.push({
				label: `Range (${previousYears.join(', ')})`, // Visible label
				data: maxDataPoints,
				borderColor: 'transparent', // No border for the fill area itself
				backgroundColor: 'rgba(173, 216, 230, 0.4)', // Light Blue fill
				pointRadius: 0,
				pointHoverRadius: 0,
				borderWidth: 0,
				tension: 0.1,
				fill: minDatasetIndex, // Fill to the index of the min dataset
				order: 2, // Render behind main lines but above min boundary if needed
			});
		}

		return { datasets, labels: Array.from({ length: 366 }, (_, i) => i + 1) }; // Add labels for the x-axis (days 1-366)
	}, [rawDataPoints, activeChartTab]);

	const getYAxisLabel = (dataType: string): string => {
		const formattedName = dataType.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
		if (/price|cost|value|revenue|salary/i.test(dataType)) return `${formattedName} (USD)`;
		if (/count|number|quantity|total|frequency/i.test(dataType)) return formattedName;
		if (/percentage|ratio|rate|share/i.test(dataType)) return `${formattedName} (%)`;
		if (/size|weight|height|width|length|duration|age/i.test(dataType)) return formattedName;
		return formattedName; // Default fallback
	};

	const isLoading = loadingFilters || loadingChartData;

	// Determine the message to show in the chart area based on current state
	const chartMessage = useMemo(() => {
		if (loadingChartData) return 'Loading chart data...';
		if (chartLimitExceeded)
			// Keep specific message for limit exceeded
			return `Chart generation disabled. Dataset size (${chartDocumentCount} documents) exceeds the limit. Apply more specific filters to reduce the count.`;
		if (!canShowChartBasedOnFilters)
			// New message if not all filters are applied
			return 'Apply all available filters to view the chart.';
		if (chartableFields.length === 0)
			// Existing message if no chartable fields
			return 'No suitable numeric fields found for charting in the current data.';
		if (!activeChartTab)
			// Existing message if no tab is selected (only possible if chartableFields > 0)
			return 'Select a field above to view chart.';
		if (!getFormattedChartData)
			// Fallback if data formatting fails
			return 'Could not generate chart data.';
		return null; // Null indicates the chart should render
	}, [loadingChartData, chartLimitExceeded, chartDocumentCount, canShowChartBasedOnFilters, chartableFields.length, activeChartTab, getFormattedChartData]);

	// --- Render Logic ---

	return (
		<div
			className='bg-secondary p-6 rounded-lg shadow-2xl w-[95vw] max-w-[1600px] h-[92vh] border border-border overflow-hidden flex flex-col'
			onClick={(e) => {
				e.stopPropagation();
			}}
		>
			{/* Header */}
			<h2 className='text-2xl font-bold mb-4 text-primary flex-shrink-0'>
				Data Platform - Analytics
				{isLoading && <span className='text-lg font-normal text-muted-foreground ml-2'>(Loading...)</span>}
			</h2>

			{/* Controls: Count - REMOVED Time Range */}
			<div className='mb-4 flex-shrink-0 flex flex-wrap items-center justify-between gap-4'>
				<div>
					<p className='text-sm text-muted-foreground'>
						Total documents matching filters: <span className='font-medium'>{totalDocuments}</span>
						{chartLimitExceeded && <span className='ml-2 text-destructive'>(Charts disabled - {chartDocumentCount} documents exceeds limit. Apply more filters.)</span>}
					</p>
				</div>
				{/* REMOVED Time Range Selector */}
			</div>

			{/* Main Layout: Filters | Charts */}
			<div className='grid grid-cols-1 lg:grid-cols-4 gap-6 flex-grow overflow-hidden'>
				{/* Filters Panel */}
				<div className='lg:col-span-1 overflow-y-auto relative bg-background p-4 rounded border border-border flex flex-col'>
					<h3 className='text-lg font-semibold mb-3 text-primary flex-shrink-0'>Filters</h3>

					{/* Loading Overlay for Filters */}
					{loadingFilters ? <div className='absolute inset-0 bg-background/70 flex items-center justify-center z-10 rounded text-muted-foreground'>Loading filters...</div> : null}

					{/* Error Message */}
					{error && !isLoading ? <p className='text-destructive p-4 bg-destructive/10 rounded mb-4'>Error: {error}</p> : null}

					{/* Filters Content */}
					{!loadingFilters && !error && hasFilterData ? (
						<div className='space-y-4 overflow-y-auto flex-grow'>
							{sortedFilterEntries.map(({ key, valueCounts }) => (
								<div key={key} className='bg-muted/30 p-3 rounded border border-border/50'>
									<h4 className='text-base font-medium mb-2 capitalize text-primary truncate' title={key.replace(/_/g, ' ')}>
										{key.replace(/_/g, ' ')}
									</h4>
									<div className='flex flex-wrap gap-1.5'>
										{valueCounts.map(({ value, count }) => (
											<button
												type='button'
												key={value}
												onClick={() => {
													handleFilterToggle(key, value);
												}}
												className={`
													px-2.5 py-0.5 rounded text-xs transition-colors duration-150 border flex items-center gap-1
													${isFilterActive(key, value) || valueCounts.length === 1 ? 'bg-primary text-primary-foreground border-primary hover:bg-primary/90' : 'bg-muted text-muted-foreground border-border hover:bg-accent hover:text-accent-foreground'}
												`}
												title={`${value} (${count})`}
											>
												<span className='truncate max-w-[180px] inline-block align-bottom'>{value}</span>
												<span className='text-[10px] opacity-70'>({count})</span>
											</button>
										))}
									</div>
								</div>
							))}
						</div>
					) : null}

					{/* No Filters Available Message */}
					{!loadingFilters && !error && !hasFilterData ? <div className='flex-grow flex items-center justify-center p-4 bg-muted/20 rounded border border-border text-center text-muted-foreground'>{totalDocuments === 0 ? 'No documents match the current filters.' : 'No filter options available for the current data.'}</div> : null}

					{/* Common Fields Display */}
					{commonFields && Object.keys(commonFields).length > 0 && availableFilters && Object.keys(availableFilters).length > 0 && Object.keys(availableFilters).length === Object.keys(activeFilters).length && (
						<div className='mt-4 pt-3 border-t border-border flex-shrink-0'>
							<h4 className='text-sm font-semibold mb-2 text-muted-foreground'>Common Fields ({totalDocuments} Documents):</h4>
							<div className='space-y-1 text-sm bg-background p-2 rounded border border-border/50'>
								{Object.entries(commonFields).map(([key, value]) => (
									<div key={key} className='flex justify-between items-center'>
										<span className='text-primary font-medium mr-2'>{key}:</span>
										<span className='text-foreground truncate' title={String(value)}>
											{String(value)}
										</span>
									</div>
								))}
							</div>
						</div>
					)}

					{/* Clear Filters Button */}
					{Object.keys(activeFilters).length > 0 ? (
						<button
							className='mt-4 w-full px-3 py-1.5 rounded bg-destructive text-destructive-foreground hover:bg-destructive/90 text-sm flex-shrink-0'
							onClick={() => {
								setActiveFilters({});
							}}
							disabled={isLoading}
						>
							Clear All Filters
						</button>
					) : null}
				</div>

				{/* Charts Panel */}
				<div className='lg:col-span-3 bg-background p-4 rounded border border-border overflow-y-auto flex flex-col'>
					<h3 className='text-lg font-semibold mb-3 text-primary flex-shrink-0'>Raw Data Over Time</h3>

					{/* Chart Area */}
					{showCharts || loadingChartData || chartLimitExceeded ? (
						<div className='flex-grow flex flex-col min-h-[400px]'>
							{/* Chart Tabs (Only show if chart *could* be shown and fields exist) */}
							{!loadingChartData && !chartLimitExceeded && canShowChartBasedOnFilters && chartableFields.length > 0 ? (
								<div className='flex space-x-2 mb-4 border-b border-border pb-2 overflow-x-auto flex-shrink-0'>
									{chartableFields.map((key) => (
										<button
											key={key}
											onClick={() => {
												handleChartTabChange(key);
											}}
											className={`px-3 py-1 text-sm rounded transition-colors whitespace-nowrap ${activeChartTab === key ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-accent hover:text-accent-foreground'}`}
										>
											{key.replace(/_/g, ' ')}
										</button>
									))}
								</div>
							) : null}

							{/* Message Area or Chart */}
							{chartMessage ? (
								// Display message if chart cannot be shown
								<div className='flex-grow flex items-center justify-center min-h-[400px] bg-muted/20 rounded border border-border text-center text-muted-foreground p-4'>
									{/* Special formatting for limit exceeded */}
									{chartLimitExceeded ? (
										<div>
											<p className='mb-2 text-lg font-medium'>Chart generation disabled</p>
											<p>Dataset size ({chartDocumentCount} documents) exceeds the limit.</p>
											<p className='mt-1'>Apply more specific filters to reduce the count.</p>
										</div>
									) : (
										<p>{chartMessage}</p>
									)}
								</div>
							) : activeChartTab && getFormattedChartData ? (
								// Active Chart Rendering
								<div className='flex-grow h-[400px] relative'>
									<Line
										data={getFormattedChartData}
										options={{
											responsive: true,
											maintainAspectRatio: false,
											plugins: {
												legend: { position: 'top' as const },
												title: {
													display: true,
													text: activeChartTab ? getYAxisLabel(activeChartTab) : 'Raw Data Over Time', // Use helper for dynamic title
													font: { size: 16, weight: 'bold' },
												},
												tooltip: {
													// Customize tooltips
													callbacks: {
														title: (tooltipItems) => {
															// Show Month Day in tooltip title
															if (tooltipItems.length > 0) {
																const day = tooltipItems[0].parsed.x;
																return formatDayOfYearForAxis(day);
															}
															return '';
														},
														label: (context) => {
															// Show Year, Value in tooltip body
															const label = context.dataset.label ?? '';
															const value = context.parsed.y;
															// Exclude min/max range datasets from regular label display
															if (label.startsWith('Range (') || label === 'Min Boundary') return; // Return undefined (void)
															return `${label}: ${value}`;
														},
													},
													mode: 'index', // Show tooltip for all datasets at that index
													intersect: false, // Trigger tooltip even when not hovering directly over point
												},
											},
											scales: {
												x: {
													type: 'linear', // Change to linear scale for Day of Year
													min: 1,
													max: 366,
													ticks: {
														font: { size: 12 },
														maxRotation: 45,
														minRotation: 0,
														// Show Month Day on ticks using the helper
														callback: (value) => formatDayOfYearForAxis(Number(value)),
														stepSize: 30, // Adjust step size for readability (approx monthly)
													},
													title: {
														display: true,
														text: 'Day of Year', // Updated X-Axis Title
														font: { size: 14, weight: 'bold' },
													},
												},
												y: {
													ticks: { font: { size: 12 } },
													title: {
														display: true,
														text: 'Value', // Simple Y-Axis Title
														font: { size: 14, weight: 'bold' },
													},
												},
											},
											// Disable animations for potentially large datasets
											animations: {} as any,
											// Add interaction modes
											interaction: {
												mode: 'index',
												intersect: false,
											},
											hover: {
												mode: 'index',
												intersect: false,
											},
										}}
									/>
									{/* Overlay for chart tab switching indicator */}
									{changingChartTabVisual ? (
										<div className='absolute inset-0 bg-background/40 flex items-center justify-center'>
											<p className='text-muted-foreground text-lg'>Switching chart...</p>
										</div>
									) : null}
								</div>
							) : (
								// Fallback if chartMessage is null but chart can't render (should not happen with current logic)
								<div className='flex-grow flex items-center justify-center text-muted-foreground'>Chart data not available.</div>
							)}
						</div>
					) : (
						// Fallback message
						<div className='flex-grow flex items-center justify-center min-h-[400px] bg-muted/20 rounded border border-border text-center text-muted-foreground p-4'>{totalDocuments === 0 ? 'No documents match the current filters.' : 'Chart data not available.'}</div>
					)}

					{/* Data source disclaimer */}
					<div className='mt-4 text-xs text-muted-foreground flex-shrink-0 border-t border-border pt-2'>
						<p>
							Filters show distinct values from the {totalDocuments} matching documents.
							{chartLimitExceeded ? ' Charts disabled due to dataset size.' : canShowChartBasedOnFilters ? ` Charts display raw data points over time (${rawDataPoints ? rawDataPoints.length : 0} points shown).` : ' Apply all available filters to enable charts.'}
						</p>
					</div>
				</div>
			</div>

			{/* Close Button */}
			<div className='mt-6 flex-shrink-0 border-t border-border pt-4'>
				<button type='button' className='px-4 py-2 rounded bg-primary text-primary-foreground hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:opacity-50' onClick={onClose} disabled={isLoading}>
					Close
				</button>
			</div>
		</div>
	);
}
