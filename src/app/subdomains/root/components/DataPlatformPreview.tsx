'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import type { JSX } from 'react';
import { getYear, getDayOfYear as dfnsGetDayOfYear, format as formatDateFns, addDays, startOfYear } from 'date-fns';
import { Group } from '@visx/group';
import { AreaClosed, LinePath, Bar } from '@visx/shape';
import { scaleLinear, scaleTime } from '@visx/scale';
import type { TickFormatter } from '@visx/axis';
import { AxisLeft, AxisBottom, SharedAxisProps } from '@visx/axis';
import { GridRows, GridColumns } from '@visx/grid';
import { curveLinear, curveMonotoneX } from '@visx/curve';
import { useTooltip, useTooltipInPortal, defaultStyles as defaultTooltipStyles, TooltipWithBounds } from '@visx/tooltip';
import { localPoint } from '@visx/event';
import { LegendOrdinal, LegendItem, LegendLabel } from '@visx/legend';
import ParentSize from '@visx/responsive/lib/components/ParentSize';
import type { NumberValue } from '@visx/vendor/d3-scale';

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

// --- Type Definitions ---
// MOVE type definitions here
type ChartPoint = { x: number; y: number };
type RangePoint = { x: number; yMin: number; yMax: number };
type TooltipPointData = ChartPoint & { year: number };
type CombinedTooltipData = {
	day: number;
	points: TooltipPointData[];
	// Allow range to be RangePoint or null/undefined
	range?: RangePoint | null;
};

// --- Component Props ---
interface DataPlatformPreviewProps {
	onClose: () => void;
}

// --- Helper Functions ---

// FIX: Add explicit return types
// FIX: Simplify signature - index is not used
const formatDayOfYearForAxis: TickFormatter<NumberValue> = (dayValue: NumberValue): string => {
	const day = typeof dayValue === 'number' ? dayValue : dayValue.valueOf();
	// Use a non-leap year like 2001 as a reference for formatting
	const referenceDate = new Date(2001, 0, 1);
	const dateToShow = addDays(referenceDate, day - 1);
	return formatDateFns(dateToShow, 'MMM d');
};

// Define accessor functions for visx - types added
const getX = (d: ChartPoint | RangePoint): number => d.x;
const getY = (d: ChartPoint): number => d.y;
const getMinY = (d: RangePoint): number => d.yMin;
const getMaxY = (d: RangePoint): number => d.yMax;

// Tooltip styles - can be outside
const tooltipStyles = {
	...defaultTooltipStyles,
	backgroundColor: 'rgba(50,50,50,0.8)',
	color: 'white',
	padding: '0.5rem',
	borderRadius: '4px',
	fontSize: '12px',
};

// Define margin for the chart - can be outside
const chartMargin = { top: 40, right: 30, bottom: 50, left: 60 };

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
	// NEW: State to track hidden datasets (using the label as the key)
	const [hiddenDatasets, setHiddenDatasets] = useState<Set<string>>(new Set());

	// REMOVED: Helper functions moved outside component scope
	// const formatDayOfYearForAxis = ...
	// const getX = ...
	// const getY = ...
	// const getMinY = ...
	// const getMaxY = ...
	// const tooltipStyles = ...
	// const chartMargin = ...

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
			setHiddenDatasets(new Set()); // Reset hidden datasets when tab changes
			setTimeout(() => {
				setChangingChartTabVisual(false);
			}, 300);
		}
	};

	// NEW: Handler for legend item click
	const handleLegendClick = (label: string): void => {
		setHiddenDatasets((prevHidden) => {
			const newHidden = new Set(prevHidden);
			if (newHidden.has(label)) {
				newHidden.delete(label);
			} else {
				newHidden.add(label);
			}
			return newHidden;
		});
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
		const rangeFillColor = 'rgba(173, 216, 230, 0.4)'; // Light Blue fill for range

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

		// Calculate Min/Max for previous years THAT ARE NOT HIDDEN
		const minMaxData: RangePoint[] = [];
		const previousYears = sortedYears.filter((y) => y < currentYear);
		const rangeLabel = `Range (${previousYears.join(', ')})`; // Calculate range label once

		// Only calculate range if there are previous years and the range itself isn't hidden
		if (previousYears.length > 0 && !hiddenDatasets.has(rangeLabel)) {
			// Consider only non-hidden previous years for min/max calculation
			const visiblePreviousYears = previousYears.filter((year) => !hiddenDatasets.has(String(year)));

			if (visiblePreviousYears.length > 0) {
				const dayValues: Record<number, number[]> = {};
				visiblePreviousYears.forEach((year) => {
					dataByYear[year]?.forEach((point) => {
						dayValues[point.x] ??= [];
						dayValues[point.x].push(point.y);
					});
				});

				// Calculate min/max for each day using only visible previous years
				for (let day = 1; day <= 366; day++) {
					const valuesForDay = dayValues[day];
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
		}

		// Create datasets for yearly lines
		const datasets = sortedYears.map((year) => {
			const yearLabel = String(year) + (year === currentYear ? ' (Current)' : '');
			return {
				label: yearLabel,
				// eslint-disable-next-line @typescript-eslint/strict-boolean-expressions
				data: dataByYear[year] || [], // Ensure data is an empty array if year has no data
				color: yearColors[year],
				isCurrentYear: year === currentYear,
			};
		});

		// Return datasets and the calculated min/max range data
		return { datasets, minMaxData, rangeLabel, rangeFillColor, hasPreviousYears: previousYears.length > 0 };
	}, [rawDataPoints, activeChartTab, hiddenDatasets]); // Add hiddenDatasets dependency

	const getYAxisLabel = (dataType: string): string => {
		const formattedName = dataType.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
		if (/price|cost|value|revenue|salary/i.test(dataType)) return `${formattedName} (USD)`;
		if (/count|number|quantity|total|frequency/i.test(dataType)) return formattedName;
		if (/percentage|ratio|rate|share/i.test(dataType)) return `${formattedName} (%)`;
		if (/size|weight|height|width|length|duration|age/i.test(dataType)) return formattedName;
		return formattedName; // Default fallback
	};

	// --- Tooltip Hook ---
	const { tooltipData, tooltipLeft, tooltipTop, tooltipOpen, showTooltip, hideTooltip } = useTooltip<CombinedTooltipData>();
	const { containerRef, TooltipInPortal } = useTooltipInPortal({
		// use TooltipInPortal for better positioning at edges
		scroll: true, // enable scroll tracking
	});

	// --- Handle Tooltip ---
	const handleTooltip = useCallback(
		(event: React.MouseEvent<SVGRectElement> | React.TouchEvent<SVGRectElement>, chartWidth: number, chartHeight: number, xScale: any, yScale: any) => {
			const { x } = localPoint(event) ?? { x: 0 }; // FIX: Use nullish coalescing
			const x0 = xScale.invert(x - chartMargin.left); // Get the day of year from the mouse position
			const dayOfYear = Math.round(x0); // Round to nearest day

			// Use optional chaining for safety
			const formattedData = getFormattedChartData;
			if (dayOfYear < 1 || dayOfYear > 366 || !formattedData?.datasets || !rawDataPoints) {
				hideTooltip();
				return;
			}

			// Find the closest data points across all VISIBLE years for this day
			const closestPoints: TooltipPointData[] = [];
			formattedData.datasets
				.filter((ds) => !hiddenDatasets.has(ds.label)) // Exclude hidden datasets
				.forEach((dataset) => {
					const year = parseInt(dataset.label.split(' ')[0], 10); // Extract year from label
					if (isNaN(year)) return;

					let minDist = Infinity;
					let closestPointForYear: TooltipPointData | null = null;

					dataset.data.forEach((point: ChartPoint) => {
						const dist = Math.abs(point.x - dayOfYear);
						if (dist < minDist) {
							minDist = dist;
							closestPointForYear = { ...point, year };
						}
					});

					// Only show tooltip if the closest point is reasonably close (e.g., within 1 day)
					// eslint-disable-next-line @typescript-eslint/strict-boolean-expressions
					if (closestPointForYear && minDist <= 1) {
						closestPoints.push(closestPointForYear);
					}
				});

			// Check if the mouse is over the VISIBLE min/max range area
			let rangeData: RangePoint | null = null;
			// Check if range should be displayed and data exists
			if (!hiddenDatasets.has(formattedData.rangeLabel) && formattedData.minMaxData.length > 0) {
				const closestRangePoint = formattedData.minMaxData.find((d) => Math.abs(d.x - dayOfYear) <= 0.5); // Find range data for the day
				if (closestRangePoint) {
					const { y } = localPoint(event) ?? { y: 0 }; // FIX: Use nullish coalescing
					const yValue = yScale.invert(y - chartMargin.top);
					// Check if pointer y is within the min/max range for that day
					if (yValue >= closestRangePoint.yMin && yValue <= closestRangePoint.yMax) {
						rangeData = closestRangePoint; // Store the range data if hovered
					}
				}
			}

			if (closestPoints.length > 0 || rangeData) {
				// Combine point data and range data for tooltip
				const combinedTooltipData: CombinedTooltipData = {
					day: dayOfYear,
					points: closestPoints.sort((a, b) => b.year - a.year), // Sort points by year desc
					range: rangeData, // Add range data if available
				};

				// Determine tooltip position based on available data
				let tooltipYValue: number;
				if (rangeData) {
					tooltipYValue = rangeData.yMax; // Position near the top of the range if hovering range
				} else if (closestPoints.length > 0) {
					// Find the highest Y value among the closest points for positioning
					tooltipYValue = Math.max(...closestPoints.map((p) => p.y));
				} else {
					// Fallback position (should ideally not be reached if hideTooltip logic is correct)
					tooltipYValue = 0;
				}

				showTooltip({
					tooltipData: combinedTooltipData,
					tooltipLeft: x,
					tooltipTop: yScale(tooltipYValue), // Use calculated Y value
				});
			} else {
				hideTooltip();
			}
		},
		[getFormattedChartData, rawDataPoints, showTooltip, hideTooltip, hiddenDatasets] // Add hiddenDatasets dependency
	);

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
									<ParentSize>
										{({ width, height }) => {
											// Use optional chaining and nullish coalescing
											const formattedData = getFormattedChartData;
											// eslint-disable-next-line @typescript-eslint/strict-boolean-expressions
											if (width === 0 || height === 0 || !formattedData || !activeChartTab) {
												return <div className='w-full h-full flex items-center justify-center text-muted-foreground'>Initializing chart...</div>;
											}

											// Adjust dimensions for margins
											const innerWidth = width - chartMargin.left - chartMargin.right;
											const innerHeight = height - chartMargin.top - chartMargin.bottom;

											if (innerWidth <= 0 || innerHeight <= 0) {
												return <div className='w-full h-full flex items-center justify-center text-muted-foreground'>Chart area too small.</div>;
											}

											// Define Scales
											const xScale = scaleLinear<number>({
												domain: [1, 366], // Day of Year 1 to 366
												range: [0, innerWidth],
											});

											// FIX: Find min/max Y ONLY from VISIBLE yearly data and VISIBLE range data
											let minY = Infinity;
											let maxY = -Infinity;

											// Include visible yearly datasets
											const visibleYearlyDatasets = formattedData.datasets.filter((ds) => !hiddenDatasets.has(ds.label));
											visibleYearlyDatasets.forEach((dataset) => {
												dataset.data.forEach((d: ChartPoint) => {
													const yVal = getY(d);
													if (yVal < minY) minY = yVal;
													if (yVal > maxY) maxY = yVal;
												});
											});

											// Include visible range data if it exists
											if (!hiddenDatasets.has(formattedData.rangeLabel) && formattedData.minMaxData.length > 0) {
												formattedData.minMaxData.forEach((d) => {
													if (d.yMin < minY) minY = d.yMin;
													if (d.yMax > maxY) maxY = d.yMax;
												});
											}

											// Refined check: if after all checks, minY is still Infinity, there's truly no data.
											if (minY === Infinity) {
												minY = 0;
												maxY = 1; // Default scale if absolutely no data points found
											}

											// Add padding to y-axis scale based on actual data range
											const yPadding = (maxY - minY) * 0.1 || 1; // Add 10% padding, or 1 if range is 0
											// Ensure minY doesn't go below 0 unless data is negative, but allow calculated min if it's already negative
											minY = minY < 0 ? minY - yPadding : Math.max(0, minY - yPadding);
											maxY = maxY + yPadding;

											const yScale = scaleLinear<number>({
												domain: [minY, maxY],
												range: [innerHeight, 0], // Flipped for SVG coordinates
												nice: true, // Adjust scale to nice round numbers
											});

											// Prepare legend items (include range if it exists)
											const legendItems = formattedData.datasets
												.map((ds) => ({
													label: ds.label,
													color: ds.color,
												}))
												.sort((a, b) => {
													// Sort legend: Current year first, then others descending
													const yearA = a.label.includes('Current') ? Infinity : parseInt(a.label.split(' ')[0], 10);
													const yearB = b.label.includes('Current') ? Infinity : parseInt(b.label.split(' ')[0], 10);
													return yearB - yearA;
												});

											// Add range item if it exists
											const showRange = formattedData.hasPreviousYears;

											return (
												<>
													{/* Legend */}
													<div className='absolute top-0 left-1/2 -translate-x-1/2 flex flex-wrap justify-center gap-x-4 gap-y-1 p-1 text-xs'>
														{legendItems.map((item) => {
															const isHidden = hiddenDatasets.has(item.label);
															return (
																<LegendItem
																	key={`legend-${item.label}`}
																	className={`flex items-center cursor-pointer ${isHidden ? 'opacity-50' : ''}`}
																	onClick={() => {
																		handleLegendClick(item.label);
																	}}
																>
																	<svg width={14} height={14} className='mr-1'>
																		<rect width={14} height={14} fill={item.color} />
																		{isHidden && <line x1='0' y1='7' x2='14' y2='7' stroke='black' strokeWidth='2' />}
																	</svg>
																	<LegendLabel style={{ textDecoration: isHidden ? 'line-through' : 'none' }}>{item.label}</LegendLabel>
																</LegendItem>
															);
														})}
														{/* Range Legend Item */}
														{
															showRange &&
																(() => {
																	// IIFE to handle isHidden logic cleanly
																	const isHidden = hiddenDatasets.has(formattedData.rangeLabel);
																	return (
																		<LegendItem
																			key={`legend-range`}
																			className={`flex items-center cursor-pointer ${isHidden ? 'opacity-50' : ''}`}
																			onClick={() => {
																				handleLegendClick(formattedData.rangeLabel);
																			}}
																		>
																			<svg width={14} height={14} className='mr-1'>
																				<rect width={14} height={14} fill={formattedData.rangeFillColor} stroke='rgba(0,0,0,0.2)' strokeWidth={1} />
																				{isHidden && <line x1='0' y1='7' x2='14' y2='7' stroke='black' strokeWidth='2' />}
																			</svg>
																			<LegendLabel style={{ textDecoration: isHidden ? 'line-through' : 'none' }}>{formattedData.rangeLabel}</LegendLabel>
																		</LegendItem>
																	);
																})() // Immediately invoke the function expression
														}
													</div>

													<svg ref={containerRef} width={width} height={height}>
														<Group left={chartMargin.left} top={chartMargin.top}>
															{/* Grid */}
															<GridRows scale={yScale} width={innerWidth} stroke='#e0e0e0' strokeOpacity={0.3} pointerEvents='none' />
															<GridColumns scale={xScale} height={innerHeight} stroke='#e0e0e0' strokeOpacity={0.3} pointerEvents='none' />

															{/* Axes */}
															<AxisBottom
																top={innerHeight}
																scale={xScale}
																numTicks={innerWidth > 520 ? 12 : 6} // Adjust ticks based on width
																tickFormat={formatDayOfYearForAxis}
																label='Day of Year'
																labelProps={{
																	fontSize: 14,
																	fill: '#333',
																	textAnchor: 'middle',
																	dy: '2.5em', // Adjust vertical position
																}}
																tickLabelProps={(value, index) => ({
																	fontSize: 11,
																	textAnchor: 'middle',
																	dy: '0.25em',
																	angle: innerWidth < 400 ? 45 : 0, // Angle ticks on small screens
																})}
																stroke='#333'
																tickStroke='#333'
															/>
															<AxisLeft
																scale={yScale}
																numTicks={5}
																label={getYAxisLabel(activeChartTab)}
																labelProps={{
																	fontSize: 14,
																	fill: '#333',
																	textAnchor: 'middle',
																	dy: '-3em', // Adjust vertical position
																	dx: '-3em', // Adjust horizontal position
																	angle: -90, // Rotate label
																}}
																tickLabelProps={() => ({
																	fontSize: 11,
																	textAnchor: 'end',
																	dx: '-0.25em',
																	dy: '0.25em',
																})}
																stroke='#333'
																tickStroke='#333'
															/>

															{/* Data Lines and Area */}
															{/* Render Area for Min/Max Range first if visible */}
															{showRange && !hiddenDatasets.has(formattedData.rangeLabel) && (
																<AreaClosed<RangePoint>
																	key={`area-range`}
																	data={formattedData.minMaxData}
																	yScale={yScale}
																	x={(d) => xScale(getX(d)) ?? 0}
																	y0={(d) => yScale(getMinY(d)) ?? 0}
																	y1={(d) => yScale(getMaxY(d)) ?? 0}
																	fill={formattedData.rangeFillColor}
																	curve={curveLinear} // Use linear curve for range
																	opacity={0.7}
																/>
															)}

															{/* Render Line Paths for visible yearly data */}
															{formattedData.datasets
																.filter((ds) => !hiddenDatasets.has(ds.label)) // Filter hidden datasets
																.map((dataset) => {
																	return <LinePath<ChartPoint> key={`line-${dataset.label}`} data={dataset.data} x={(d) => xScale(getX(d)) ?? 0} y={(d) => yScale(getY(d)) ?? 0} stroke={dataset.color} strokeWidth={dataset.isCurrentYear ? 2 : 1.5} strokeOpacity={0.9} curve={curveMonotoneX} shapeRendering='geometricPrecision' />;
																})}

															{/* Tooltip Trigger Area */}
															<Bar
																x={0}
																y={0}
																width={innerWidth}
																height={innerHeight}
																fill='transparent'
																rx={14}
																onTouchStart={(event) => {
																	handleTooltip(event, width, height, xScale, yScale);
																}}
																onTouchMove={(event) => {
																	handleTooltip(event, width, height, xScale, yScale);
																}}
																onMouseMove={(event) => {
																	handleTooltip(event, width, height, xScale, yScale);
																}}
																onMouseLeave={() => {
																	hideTooltip();
																}}
															/>

															{/* Optional: Circle marker for hovered points */}
															{tooltipOpen && tooltipData?.points && tooltipData.points.length > 0 && (
																<Group>
																	{/* Only render markers for visible points in the tooltip */}
																	{tooltipData.points.map((point: TooltipPointData) => (
																		<circle
																			key={`marker-${point.year}`}
																			cx={xScale(point.x)}
																			cy={yScale(point.y)}
																			r={4}
																			// FIX: Use nullish coalescing and lookup color from formattedData
																			fill={formattedData.datasets.find((ds) => ds.label.startsWith(String(point.year)))?.color ?? 'black'}
																			stroke='white'
																			strokeWidth={1}
																			pointerEvents='none'
																		/>
																	))}
																</Group>
															)}
														</Group>
													</svg>

													{/* Tooltip */}
													{tooltipOpen && tooltipData && (
														<TooltipInPortal top={tooltipTop} left={tooltipLeft} style={tooltipStyles}>
															{/* FIX: Simplify conditional checks for tooltip data */}
															{/* FIX: Add missing index argument to formatDayOfYearForAxis - Fixed by simplifying function */}
															{/* FIX: Pass dummy args to satisfy TickFormatter type signature */}
															<div style={{ marginBottom: '5px', fontWeight: 'bold' }}>{formatDayOfYearForAxis(tooltipData.day, 0, [])}</div>
															{tooltipData.range && ( // Show range first if it exists
																<div>
																	{/* Find range label dynamically */}
																	Range ({/\(([^)]+)\)/.exec(formattedData?.rangeLabel)?.[1] ?? ''}):{' '}
																	<strong>
																		{tooltipData.range.yMin.toFixed(2)} - {tooltipData.range.yMax.toFixed(2)}
																	</strong>
																</div>
															)}
															{tooltipData.points.map((point: TooltipPointData) => (
																<div key={point.year}>
																	{point.year}: <strong>{point.y.toFixed(2)}</strong>
																</div>
															))}
														</TooltipInPortal>
													)}
												</>
											);
										}}
									</ParentSize>
									{/* REMOVE: Chart.js options and overlay */}
									{/* <Line
										data={getFormattedChartData}
										options={{ ... }}
									/> */}
									{changingChartTabVisual ? (
										<div className='absolute inset-0 bg-background/40 flex items-center justify-center z-20'>
											{' '}
											{/* Ensure overlay is on top */}
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
							{/* Add note about hidden datasets */}
							{getFormattedChartData && hiddenDatasets.size > 0 && (
								<span className='ml-1 text-muted-foreground/80'>
									({hiddenDatasets.size} dataset{hiddenDatasets.size > 1 ? 's' : ''} hidden via legend)
								</span>
							)}
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
