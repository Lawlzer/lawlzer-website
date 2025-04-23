'use client';

import React, { useState, useEffect, useCallback } from 'react';
import type { JSX } from 'react';

// Define the structure for the API response
export type AggregationResult = Record<string, Record<string, number>>;
// Define the structure for filters state
type Filters = Record<string, string[]>;

interface DataPlatformPreviewProps {
	onClose: () => void; // Function to close the overlay
}

export default function DataPlatformPreview({ onClose }: DataPlatformPreviewProps): JSX.Element {
	const [data, setData] = useState<AggregationResult | null>(null);
	const [filters, setFilters] = useState<Filters>({});
	const [loading, setLoading] = useState<boolean>(true);
	const [error, setError] = useState<string | null>(null);

	// Function to fetch data based on current filters
	const fetchData = useCallback(async () => {
		setLoading(true);
		setError(null);
		try {
			const params = new URLSearchParams();
			// Only add filters param if filters object is not empty
			if (Object.keys(filters).length > 0) {
				params.append('filters', JSON.stringify(filters));
			}
			const response = await fetch(`/api/data-platform/aggregate?${params.toString()}`);
			if (!response.ok) {
				throw new Error(`HTTP error! status: ${response.status}`);
			}
			const result: AggregationResult = await response.json();
			setData(result);
		} catch (e) {
			console.error('Failed to fetch data platform aggregations:', e);
			setError(e instanceof Error ? e.message : 'An unknown error occurred');
			setData(null); // Clear data on error
		} finally {
			setLoading(false);
		}
	}, [filters]); // Dependency: re-fetch when filters change

	// Fetch data on component mount and when filters change
	useEffect(() => {
		void fetchData();
	}, [fetchData]);

	// Handler for toggling filters
	const handleFilterToggle = (key: string, value: string): void => {
		setFilters((prevFilters) => {
			const newFilters = { ...prevFilters };
			const currentKeyFilters = newFilters[key] ?? [];
			const valueIndex = currentKeyFilters.indexOf(value);

			if (valueIndex > -1) {
				// Value exists, remove it
				const updatedKeyFilters = currentKeyFilters.filter((v) => v !== value);
				if (updatedKeyFilters.length === 0) {
					// If no values left for this key, remove the key by creating a new object without it
					const { [key]: _, ...rest } = newFilters; // Destructure to omit the key
					return rest; // Return the object without the key
				} else {
					newFilters[key] = updatedKeyFilters;
				}
			} else {
				// Value doesn't exist, add it
				newFilters[key] = [...currentKeyFilters, value];
			}
			return newFilters;
		});
	};

	// Helper to check if a specific filter is active
	const isFilterActive = (key: string, value: string): boolean => {
		return filters[key]?.includes(value) ?? false;
	};

	// Calculate max counts and sort keys for rendering
	const sortedDataEntries = data
		? Object.entries(data)
				.map(([key, valueCounts]) => {
					// Find the maximum count for the current key
					const maxCount = Object.values(valueCounts).reduce((max, count) => Math.max(max, count), 0);
					return { key, valueCounts, maxCount }; // Return an object containing key, values, and max count
				})
				.sort((a, b) => b.maxCount - a.maxCount) // Sort by maxCount descending
		: [];

	return (
		<div
			className='bg-secondary p-8 rounded-lg shadow-2xl max-w-4xl w-full border border-border overflow-hidden flex flex-col' // Increased max-width, added flex
			style={{ maxHeight: '80vh' }} // Limit height
			onClick={(e) => {
				e.stopPropagation();
			}}
		>
			<h2 className='text-2xl font-bold mb-4 text-primary flex-shrink-0'>
				Data Platform - Filters
				{loading && <span className='text-lg font-normal text-muted-foreground ml-2'>(Loading...)</span>}
			</h2>

			{/* Make this div scrollable and position relative for overlay */}
			<div className='text-primary-text flex-grow overflow-y-auto pr-2 relative'>
				{/* Loading Overlay */}
				{loading && <div className='absolute inset-0 bg-background/80 flex items-center justify-center z-10 rounded'>{/* Text removed from overlay */}</div>}

				{/* Error Message */}
				{error && <p className='text-destructive'>Error loading data: {error}</p>}

				{/* Grid Content - Show grid if not error and data exists */}
				{!error && sortedDataEntries.length > 0 && (
					<div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
						{sortedDataEntries.map(({ key, valueCounts }) => {
							// Sort values first to calculate max length based on the sorted list
							const sortedValues = Object.entries(valueCounts).sort(([valueA, countA], [valueB, countB]) => {
								if (countB !== countA) {
									return countB - countA;
								}
								return valueA.localeCompare(valueB);
							});

							// Calculate the maximum length of the button text "value (count)" for this key
							const maxLength = sortedValues.reduce((maxLen, [value, count]) => {
								const textLength = `${value} (${count})`.length;
								return Math.max(maxLen, textLength);
							}, 0);

							// Determine the min-width class using arbitrary values + ch units (character width) + padding
							// Add extra characters for padding and variance. Adjust the '+ 3' if needed.
							const minWidthClass = `min-w-[${maxLength + 3}ch]`;

							return (
								<div key={key} className='bg-background p-4 rounded border border-border'>
									<h3 className='text-lg font-semibold mb-3 capitalize text-primary'>{key.replace(/_/g, ' ')}</h3>
									<div className='flex flex-wrap gap-2'>
										{/* Map over the pre-sorted values */}
										{sortedValues.map(([value, count]) => (
											<button
												type='button'
												key={value}
												onClick={() => {
													handleFilterToggle(key, value);
												}}
												className={`
												px-3 py-1 rounded text-sm transition-colors duration-150
												border text-center ${minWidthClass} {/* Apply calculated min-width and center text */}
												${isFilterActive(key, value) ? 'bg-primary text-primary-foreground border-primary' : 'bg-muted text-muted-foreground border-border hover:bg-accent hover:text-accent-foreground'}
											`}
											>
												{value} ({count})
											</button>
										))}
									</div>
								</div>
							);
						})}
					</div>
				)}

				{/* No Data Message - Show only when not loading, no error, and no data */}
				{!loading && !error && sortedDataEntries.length === 0 && <p>No data available or matching the current filters.</p>}
			</div>

			<div className='mt-6 flex-shrink-0'>
				{' '}
				{/* Keep button at bottom */}
				<button
					type='button'
					className='px-4 py-2 rounded bg-primary text-primary-foreground hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2'
					onClick={onClose} // Use the passed onClose function
				>
					Close
				</button>
			</div>
		</div>
	);
}
