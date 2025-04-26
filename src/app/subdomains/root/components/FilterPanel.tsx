import React from 'react';

// Define the structure for filters state (assuming Filters type is available or defined elsewhere)
// If not, you might need to import or define it here.
// import type { Filters } from './DataPlatformPreview';

type FilterValueCount = { value: string; count: number };
type SortedFilterEntry = {
	key: string;
	valueCounts: FilterValueCount[];
	maxCount: number;
};

interface FilterPanelProps {
	isLoading: boolean;
	error: string | null;
	hasFilterData: boolean;
	sortedFilterEntries: SortedFilterEntry[];
	commonFields: Record<string, any> | null;
	totalDocuments: number;
	activeFilters: Record<string, string[]>; // Consider using the Filters type if defined
	availableFilters: Record<string, FilterValueCount[]> | null;
	isMobile: boolean;
	handleFilterToggle: (key: string, value: string) => void;
	handleClearFilters: () => void;
	isFilterActive: (key: string, value: string) => boolean;
}

export const FilterPanel: React.FC<FilterPanelProps> = ({
	isLoading,
	error,
	hasFilterData,
	sortedFilterEntries,
	commonFields,
	totalDocuments,
	activeFilters,
	availableFilters, // Included prop
	isMobile,
	handleFilterToggle,
	handleClearFilters,
	isFilterActive,
}) => {
	return (
		<div className={`lg:col-span-1 overflow-y-auto relative bg-background p-4 rounded border border-border flex flex-col ${isMobile ? 'h-full' : ''}`}>
			<h3 className='text-lg font-semibold mb-3 text-primary flex-shrink-0'>Filters</h3>

			{/* Loading Overlay */}
			{isLoading ? <div className='absolute inset-0 bg-background/70 flex items-center justify-center z-10 rounded text-muted-foreground'>Loading filters...</div> : null}

			{/* Error Message */}
			{error && !isLoading ? <p className='text-destructive p-4 bg-destructive/10 rounded mb-4'>Error: {error}</p> : null}

			{/* Filters Content */}
			{!isLoading && !error && hasFilterData ? (
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
			{!isLoading && !error && !hasFilterData ? <div className='flex-grow flex items-center justify-center p-4 bg-muted/20 rounded border border-border text-center text-muted-foreground'>{totalDocuments === 0 ? 'No documents match the current filters.' : 'No filter options available for the current data.'}</div> : null}

			{/* Common Fields Display - Conditionally render based on availableFilters as well */}
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
				<button className='mt-4 w-full px-3 py-1.5 rounded bg-destructive text-destructive-foreground hover:bg-destructive/90 text-sm flex-shrink-0' onClick={handleClearFilters} disabled={isLoading}>
					Clear All Filters
				</button>
			) : null}
		</div>
	);
};
