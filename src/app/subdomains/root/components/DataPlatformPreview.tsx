'use client';

import { ChartBarIcon, DocumentTextIcon, FunnelIcon, SparklesIcon } from '@heroicons/react/24/outline';
import type { TickFormatter } from '@visx/axis';
import { localPoint } from '@visx/event';
import { defaultStyles as defaultTooltipStyles, useTooltip, useTooltipInPortal } from '@visx/tooltip';
import type { NumberValue } from '@visx/vendor/d3-scale';
import { addDays, format as formatDateFns, getDayOfYear as dfnsGetDayOfYear, getYear } from 'date-fns';
import { motion } from 'framer-motion';
import type { JSX } from 'react';
import React, { useCallback, useEffect, useMemo, useState } from 'react';

import { ChartPanel } from './ChartPanel'; // Import the chart panel
import { FilterPanel } from './FilterPanel'; // Import the new component

import { useMediaQuery } from '~/hooks/useMediaQuery'; // Import the hook

// REMOVED MAX_DOCUMENTS constant, limit now handled by backend
// export const MAX_DOCUMENTS = 300;

// --- Data Structures for API Responses and State ---

// Structure for the response from /api/data-platform/filters
export interface FiltersApiResponse {
	filters: Record<string, { value: string; count: number }[]>;
	totalDocuments: number;
	commonFields?: Record<string, any>;
}

// Structure for individual data points from the API
export interface RawDataPoint {
	timestamp: number; // unixDate in milliseconds
	values: Record<string, number>; // { fieldName: value }
}

// Structure for the response from /api/data-platform/getChartData
export interface ChartDataApiResponse {
	rawData: RawDataPoint[] | null; // Array of raw data points
	limitExceeded?: boolean;
	documentCount?: number;
	error?: string;
}

// REMOVED TimeSeriesData & TimeSeriesChartData types - data is now aggregatedFields

// Define the structure for filters state
type Filters = Record<string, string[]>;

// --- Type Definitions ---
// MOVE type definitions here
interface ChartPoint {
	x: number;
	y: number;
}
interface RangePoint {
	x: number;
	yMin: number;
	yMax: number;
}
type TooltipPointData = ChartPoint & { year: number };
interface CombinedTooltipData {
	day: number;
	points: TooltipPointData[];
	// Allow range to be RangePoint or null/undefined
	range?: RangePoint | null;
}

// --- Component Props ---
interface DataPlatformPreviewProps {
	onClose: () => void;
}

// --- Helper Functions ---

// FIX: Add explicit return types
// FIX: Simplify signature - index is not used
const _getMinY = (d: RangePoint): number => d.yMin;

// FIX: Add explicit return types
// FIX: Simplify signature - index is not used
const _getMaxY = (d: RangePoint): number => d.yMax;

// FIX: Add explicit return types
// FIX: Simplify signature - index is not used
const _formatDayOfYearForAxis: TickFormatter<NumberValue> = (dayValue: NumberValue /*, index?: number, ticks?: any[] */): string => {
	const day = typeof dayValue === 'number' ? dayValue : dayValue.valueOf();
	// Use a non-leap year like 2001 as a reference for formatting
	const referenceDate = new Date(2001, 0, 1);
	const dateToShow = addDays(referenceDate, day - 1);
	return formatDateFns(dateToShow, 'MMM d');
};

// Define accessor functions for visx - types added
const _getX = (d: ChartPoint | RangePoint): number => d.x;
const _getY = (d: ChartPoint): number => d.y;

// Tooltip styles - can be outside
const _tooltipStyles = {
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
	// NEW: State for mobile view
	const [mobileViewMode, setMobileViewMode] = useState<'chart' | 'filters'>('filters');

	// --- Hooks ---
	const isMobile = useMediaQuery('(max-width: 1023px)'); // Tailwind's lg breakpoint

	// Generate cache key based on active filters (time range no longer needed for data fetch)
	const getCacheKey = useCallback((type: 'chartData' | 'filters') => JSON.stringify({ type, filters: activeFilters }), [activeFilters]);

	// Check if data needs refresh (simplified)
	const _isDataStale = useCallback(
		(cacheKey: string) => {
			const lastFetch = lastFetchTime[cacheKey] ?? 0;
			return Date.now() - lastFetch > 3600000; // 1 hour cache
		},
		[lastFetchTime]
	);

	// Function to fetch raw data points
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

			if (result.error !== undefined && result.error !== '') {
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
					if (currentTab === null || !availableChartKeys.includes(currentTab)) {
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
		console.debug('[fetchFiltersAndCount] Triggered');
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

	// --- Memoized Values for Rendering (Moved up) ---
	// Calculate chartable fields from the first few data points (more robustly)
	const chartableFields = useMemo(() => {
		if (!rawDataPoints || rawDataPoints.length === 0) return [];
		const fields = new Set<string>();
		for (const point of rawDataPoints) {
			Object.keys(point.values).forEach((key) => fields.add(key));
		}
		return Array.from(fields).sort((a, b) => a.localeCompare(b));
	}, [rawDataPoints]);

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

	// --- Effects ---
	// Fetch filters when activeFilters change
	useEffect(() => {
		console.debug('Effect 1: Filters');
		// Reset mobile view to filters when filters change significantly
		if (isMobile) {
			setMobileViewMode('filters');
		}
		void fetchFiltersAndCount();
	}, [fetchFiltersAndCount, isMobile]); // Add isMobile dependency

	// Fetch chart data when activeFilters change or when filters finish loading
	useEffect(() => {
		console.debug('Effect 2: Chart Data - Triggered by filter change or loading state');
		if (!loadingFilters) {
			void fetchChartData();
		}
	}, [activeFilters, loadingFilters, fetchChartData]); // Triggered by activeFilters (via fetchChartData dep) or loadingFilters change

	// NEW Effect: Switch to chart view on mobile when ready
	useEffect(() => {
		if (isMobile && canShowChartBasedOnFilters && !loadingFilters && !loadingChartData && !chartLimitExceeded && chartableFields.length > 0) {
			// Only switch if we can actually show *something* in the chart panel
			console.debug('[Mobile View] Switching to Chart View');
			setMobileViewMode('chart');
		}
		// Intentionally don't switch back automatically if filters become incomplete
		// User must use the button or clear filters to go back
	}, [isMobile, canShowChartBasedOnFilters, loadingFilters, loadingChartData, chartLimitExceeded, chartableFields.length]); // Add dependencies

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

	const isFilterActive = (key: string, value: string): boolean => activeFilters[key]?.includes(value) ?? false;

	// Clear Filters Button Handler (Modified for mobile)
	const handleClearFilters = (): void => {
		setActiveFilters({});
		// No need to explicitly reset mobile view here,
		// the main filter fetch effect will handle it.
	};

	// NEW: Handler to toggle mobile view manually
	const handleToggleMobileView = (): void => {
		setMobileViewMode((prevMode) => (prevMode === 'filters' ? 'chart' : 'filters'));
	};

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

	// --- Memoized Values for Rendering (Restored) ---

	// Check if there's filter data to display
	const hasFilterData = useMemo(
		() =>
			// Explicitly return boolean
			!!(availableFilters && Object.keys(availableFilters).length > 0),
		[availableFilters]
	);

	// Determine if charts should be shown
	const showCharts = useMemo(
		() =>
			// Explicitly return boolean
			!!(!chartLimitExceeded && totalDocuments > 0 && rawDataPoints && rawDataPoints.length > 0),
		[chartLimitExceeded, totalDocuments, rawDataPoints]
	);

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

	// Format raw data points for Chart.js, grouping by year, adding min/max overlay
	const getFormattedChartData = useMemo(() => {
		if (!rawDataPoints || rawDataPoints.length === 0 || activeChartTab === null) {
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

	const _getYAxisLabel = (dataType: string): string => {
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

	// --- Handle Tooltip (Restored Original Logic) ---
	const handleTooltip = useCallback(
		(
			event: React.MouseEvent<SVGRectElement> | React.TouchEvent<SVGRectElement>,
			chartWidth: number,
			chartHeight: number,
			xScale: any, // Consider more specific scale types if possible
			yScale: any // Consider more specific scale types if possible
		) => {
			const { x } = localPoint(event) ?? { x: 0 };
			const x0 = xScale.invert(x - chartMargin.left);
			const dayOfYear = Math.round(x0);
			console.debug('[handleTooltip] Hover event - Day:', dayOfYear); // LOG 1

			const formattedData = getFormattedChartData;
			if (dayOfYear < 1 || dayOfYear > 366 || !formattedData?.datasets || !rawDataPoints) {
				console.debug('[handleTooltip] Aborting: Invalid day, no data, or no raw points.'); // LOG 2
				hideTooltip();
				return;
			}

			const closestPoints: TooltipPointData[] = [];
			formattedData.datasets
				.filter((ds) => !hiddenDatasets.has(ds.label))
				.forEach((dataset) => {
					const year = parseInt(dataset.label.split(' ')[0], 10);
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
					// LOG 3: Log details for each year's check
					console.debug(`[handleTooltip] Year ${year}: Closest Point=`, closestPointForYear, `Min Dist=`, minDist);

					// Only add the point if it exists, is close enough, and has a valid numeric y-value
					if (closestPointForYear !== null && minDist <= 1) {
						// Assert type after null check
						const validPoint = closestPointForYear as TooltipPointData;
						if (typeof validPoint.y === 'number' && Number.isFinite(validPoint.y)) {
							closestPoints.push(validPoint);
						}
					}
				});

			let rangeData: RangePoint | null = null;
			if (!hiddenDatasets.has(formattedData.rangeLabel) && formattedData.minMaxData.length > 0) {
				const closestRangePoint = formattedData.minMaxData.find((d) => Math.abs(d.x - dayOfYear) <= 0.5);
				console.debug('[handleTooltip] Range Check: Closest Range Point=', closestRangePoint); // LOG 4
				if (closestRangePoint) {
					const { y } = localPoint(event) ?? { y: 0 };
					const yValue = yScale.invert(y - chartMargin.top);
					console.debug('[handleTooltip] Range Check: Hover Y Value=', yValue, `Range Y Min/Max=`, closestRangePoint.yMin, '/', closestRangePoint.yMax); // LOG 5
					if (yValue >= closestRangePoint.yMin && yValue <= closestRangePoint.yMax) {
						rangeData = closestRangePoint;
					}
				}
			}
			console.debug('[handleTooltip] Final Closest Points for Tooltip:', closestPoints); // LOG 6
			console.debug('[handleTooltip] Final Range Data for Tooltip:', rangeData); // LOG 7

			if (closestPoints.length > 0 || rangeData) {
				const combinedTooltipData: CombinedTooltipData = {
					day: dayOfYear,
					points: closestPoints.sort((a, b) => b.year - a.year),
					range: rangeData,
				};
				console.debug('[handleTooltip] Showing Tooltip with data:', combinedTooltipData); // LOG 8

				let tooltipYValue: number;
				if (rangeData) {
					tooltipYValue = rangeData.yMax;
				} else if (closestPoints.length > 0) {
					tooltipYValue = Math.max(...closestPoints.map((p) => p.y));
				} else {
					tooltipYValue = 0;
				}

				showTooltip({
					tooltipData: combinedTooltipData,
					tooltipLeft: x,
					tooltipTop: yScale(tooltipYValue),
				});
			} else {
				hideTooltip();
			}
		},
		[getFormattedChartData, rawDataPoints, showTooltip, hideTooltip, hiddenDatasets] // Original dependencies
	);

	// Determine the message to show in the chart area based on current state
	const chartMessage = useMemo(() => {
		if (loadingChartData) return 'Loading chart data...';
		if (chartLimitExceeded) return `Chart generation disabled. Dataset size (${chartDocumentCount} documents) exceeds the limit. Apply more specific filters to reduce the count.`;
		if (!canShowChartBasedOnFilters) return 'Apply all available filters to view the chart.';
		if (chartableFields.length === 0) return 'No suitable numeric fields found for charting in the current data.';
		if (activeChartTab === null) return 'Select a field above to view chart.';
		if (getFormattedChartData === null) return 'Could not generate chart data.';
		return null;
	}, [loadingChartData, chartLimitExceeded, chartDocumentCount, canShowChartBasedOnFilters, chartableFields.length, activeChartTab, getFormattedChartData]);

	// --- Render Logic ---

	return (
		// Fixed modal wrapper with backdrop
		<motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} className='fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4' onClick={onClose}>
			<motion.div
				initial={{ scale: 0.9, opacity: 0 }}
				animate={{ scale: 1, opacity: 1 }}
				exit={{ scale: 0.9, opacity: 0 }}
				transition={{ type: 'spring', stiffness: 300, damping: 30 }}
				className='relative flex max-h-[90vh] w-full max-w-[1400px] flex-col overflow-hidden rounded-2xl bg-background shadow-2xl'
				onClick={(e) => {
					e.stopPropagation();
				}}
			>
				{/* Close button */}
				<button aria-label='Close' className='absolute top-4 right-4 z-10 rounded-lg bg-secondary/80 p-2 text-foreground backdrop-blur-sm transition-all hover:bg-secondary hover:scale-110' onClick={onClose}>
					<svg className='h-5 w-5' fill='none' stroke='currentColor' strokeWidth={2} viewBox='0 0 24 24'>
						<path strokeLinecap='round' strokeLinejoin='round' d='M6 18L18 6M6 6l12 12' />
					</svg>
				</button>

				{/* Original component content */}
				<div className='h-full w-full overflow-y-auto'>
					{/* Header */}
					<div className='sticky top-0 z-10 bg-gradient-to-b from-background via-background/95 to-transparent backdrop-blur-xl border-b border-border/50'>
						<div className='px-6 py-4 sm:px-8 sm:py-6'>
							<div className='flex items-center justify-between'>
								<motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className='flex items-center gap-4'>
									<div className='p-3 rounded-xl bg-gradient-to-br from-emerald-600 to-teal-600 text-white shadow-lg'>
										<ChartBarIcon className='h-6 w-6' />
									</div>
									<div>
										<h2 className='text-2xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent'>Data Platform</h2>
										<p className='text-sm text-secondary-text mt-0.5'>Explore agricultural data with dynamic filters</p>
									</div>
								</motion.div>
								<motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2 }} className='flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20'>
									<div className='h-2 w-2 rounded-full bg-emerald-500 animate-pulse' />
									<span className='text-xs font-medium text-emerald-600'>Live Data</span>
								</motion.div>
							</div>

							{/* Stats bar */}
							<motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className='mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3'>
								<div className='flex items-center gap-3 p-3 rounded-lg bg-card border border-border'>
									<div className='p-2 rounded-lg bg-primary/10'>
										<DocumentTextIcon className='h-4 w-4 text-primary' />
									</div>
									<div>
										<p className='text-xs text-secondary-text'>Total Documents</p>
										<p className='text-lg font-semibold text-foreground'>{totalDocuments.toLocaleString()}</p>
									</div>
								</div>
								<div className='flex items-center gap-3 p-3 rounded-lg bg-card border border-border'>
									<div className='p-2 rounded-lg bg-blue-500/10'>
										<FunnelIcon className='h-4 w-4 text-blue-500' />
									</div>
									<div>
										<p className='text-xs text-secondary-text'>Active Filters</p>
										<p className='text-lg font-semibold text-foreground'>{Object.keys(activeFilters).length}</p>
									</div>
								</div>
								<div className='flex items-center gap-3 p-3 rounded-lg bg-card border border-border'>
									<div className='p-2 rounded-lg bg-green-500/10'>
										<SparklesIcon className='h-4 w-4 text-green-500' />
									</div>
									<div>
										<p className='text-xs text-secondary-text'>Status</p>
										<p className='text-sm font-medium text-green-600'>{loadingFilters || loadingChartData ? 'Updating...' : 'Ready'}</p>
									</div>
								</div>
							</motion.div>
						</div>
					</div>

					{/* Content area */}
					<div className={`flex-1 p-6 ${isMobile ? '' : 'min-h-[500px]'}`}>
						{isMobile ? (
							// Mobile View: Show one panel at a time
							<div className='h-full w-full'>
								{mobileViewMode === 'filters' ? (
									<FilterPanel
										activeFilters={activeFilters}
										availableFilters={availableFilters} // Pass needed prop
										commonFields={commonFields}
										error={error}
										handleClearFilters={handleClearFilters}
										handleFilterToggle={handleFilterToggle}
										hasFilterData={hasFilterData}
										isFilterActive={isFilterActive}
										isLoading={loadingFilters} // Pass specific loading state
										isMobile={isMobile}
										sortedFilterEntries={sortedFilterEntries}
										totalDocuments={totalDocuments}
										searchTerm=''
										showAllStates={{}}
									/>
								) : (
									// Pass props needed by ChartPanel
									<ChartPanel
										TooltipInPortal={TooltipInPortal}
										activeChartTab={activeChartTab}
										canShowChartBasedOnFilters={canShowChartBasedOnFilters}
										changingChartTabVisual={changingChartTabVisual}
										chartDocumentCount={chartDocumentCount}
										chartLimitExceeded={chartLimitExceeded}
										chartMessage={chartMessage}
										chartableFields={chartableFields}
										containerRef={containerRef}
										error={error}
										getFormattedChartData={getFormattedChartData} // Pass the memoized data
										handleChartTabChange={handleChartTabChange}
										handleToggleMobileView={handleToggleMobileView}
										handleTooltip={handleTooltip}
										hiddenDatasets={hiddenDatasets}
										hideTooltip={hideTooltip}
										isLoading={loadingChartData} // Use chart loading state
										isMobile={isMobile}
										mobileViewMode={mobileViewMode}
										showCharts={showCharts}
										tooltipLeft={tooltipLeft}
										tooltipOpen={tooltipOpen}
										tooltipTop={tooltipTop}
										totalDocuments={totalDocuments} // Pass total documents
										handleLegendClick={handleLegendClick}
										// Pass tooltip props
										tooltipData={tooltipData}
									/>
								)}
							</div>
						) : (
							// Desktop View: Show both panels side-by-side
							<div className='grid grid-cols-1 gap-6 lg:grid-cols-4 h-full'>
								{/* Filter Panel */}
								<div className='lg:col-span-1'>
									<FilterPanel activeFilters={activeFilters} availableFilters={availableFilters} commonFields={commonFields} error={error} handleClearFilters={handleClearFilters} handleFilterToggle={handleFilterToggle} hasFilterData={hasFilterData} isFilterActive={isFilterActive} isLoading={loadingFilters} isMobile={isMobile} sortedFilterEntries={sortedFilterEntries} totalDocuments={totalDocuments} searchTerm='' showAllStates={{}} />
								</div>
								{/* Chart Panel */}
								<div className='lg:col-span-3'>
									<ChartPanel
										TooltipInPortal={TooltipInPortal}
										activeChartTab={activeChartTab}
										canShowChartBasedOnFilters={canShowChartBasedOnFilters}
										changingChartTabVisual={changingChartTabVisual}
										chartDocumentCount={chartDocumentCount}
										chartLimitExceeded={chartLimitExceeded}
										chartMessage={chartMessage}
										chartableFields={chartableFields}
										containerRef={containerRef}
										error={error}
										getFormattedChartData={getFormattedChartData}
										handleChartTabChange={handleChartTabChange}
										handleToggleMobileView={handleToggleMobileView}
										handleTooltip={handleTooltip}
										hiddenDatasets={hiddenDatasets}
										hideTooltip={hideTooltip}
										isLoading={loadingChartData}
										isMobile={isMobile}
										mobileViewMode={mobileViewMode}
										showCharts={showCharts}
										tooltipLeft={tooltipLeft}
										tooltipOpen={tooltipOpen}
										tooltipTop={tooltipTop}
										totalDocuments={totalDocuments}
										handleLegendClick={handleLegendClick}
										// Pass tooltip props
										tooltipData={tooltipData}
									/>
								</div>
							</div>
						)}
					</div>
				</div>
			</motion.div>
		</motion.div>
	);
}
