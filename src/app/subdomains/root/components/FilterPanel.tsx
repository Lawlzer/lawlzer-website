import React from 'react';

// Define the structure for filters state (assuming Filters type is available or defined elsewhere)
// If not, you might need to import or define it here.
// import type { Filters } from './DataPlatformPreview';

interface FilterValueCount {
	value: string;
	count: number;
}
interface SortedFilterEntry {
	key: string;
	valueCounts: FilterValueCount[];
	maxCount: number;
}

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
	searchTerm: string;
	showAllStates: Record<string, boolean>;
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
	searchTerm,
	showAllStates: _showAllStates,
}) => (
	<div className={`bg-background border-border relative flex flex-col overflow-y-auto rounded border p-4 lg:col-span-1 ${isMobile ? 'h-full' : ''}`}>
		<h3 className='text-primary mb-3 flex-shrink-0 text-lg font-semibold'>Filters</h3>

		{/* Loading Overlay */}
		{isLoading ? <div className='bg-background/70 text-muted-foreground absolute inset-0 z-10 flex items-center justify-center rounded'>Loading filters...</div> : null}

		{/* Error Message */}
		{error !== null && !isLoading ? <p className='text-destructive bg-destructive/10 mb-4 rounded p-4'>Error: {error}</p> : null}

		{/* Filters Content */}
		{!isLoading && error === null && hasFilterData ? (
			<div className='flex-grow space-y-4 overflow-y-auto'>
				{sortedFilterEntries.map(({ key, valueCounts }) => (
					<div key={key} className='bg-muted/30 border-border/50 rounded border p-3'>
						<h4 className='text-primary mb-2 truncate text-base font-medium capitalize' title={key.replace(/_/g, ' ')}>
							{key.replace(/_/g, ' ')}
						</h4>
						<div className='flex flex-wrap gap-1.5'>
							{valueCounts.map(({ value, count }) => (
								<button
									key={value}
									className={`flex items-center gap-1 rounded border px-2.5 py-0.5 text-xs transition-colors duration-150 ${isFilterActive(key, value) || valueCounts.length === 1 ? 'bg-primary text-primary-foreground border-primary hover:bg-primary/90' : 'bg-muted text-muted-foreground border-border hover:bg-accent hover:text-accent-foreground'} `}
									title={`${value} (${count})`}
									type='button'
									onClick={() => {
										handleFilterToggle(key, value);
									}}
								>
									<span className='inline-block max-w-[180px] truncate align-bottom'>{value}</span>
									<span className='text-[10px] opacity-70'>({count})</span>
								</button>
							))}
						</div>
					</div>
				))}
			</div>
		) : null}

		{/* No Filters Available Message */}
		{!isLoading && error === null && !hasFilterData ? <div className='bg-muted/20 border-border text-muted-foreground flex flex-grow items-center justify-center rounded border p-4 text-center'>{totalDocuments === 0 ? 'No documents match the current filters.' : 'No filter options available for the current data.'}</div> : null}

		{/* Common Fields Display - Conditionally render based on availableFilters as well */}
		{commonFields !== null && Object.keys(commonFields).length > 0 && availableFilters !== null && Object.keys(availableFilters).length > 0 && Object.keys(availableFilters).length === Object.keys(activeFilters).length ? (
			<div className='border-border mt-4 flex-shrink-0 border-t pt-3'>
				<h4 className='text-muted-foreground mb-2 text-sm font-semibold'>Common Fields ({totalDocuments} Documents):</h4>
				<div className='bg-background border-border/50 space-y-1 rounded border p-2 text-sm'>
					{Object.entries(commonFields).map(([key, value]) => (
						<div key={key} className='flex items-center justify-between'>
							<span className='text-primary mr-2 font-medium'>{key}:</span>
							<span className='text-foreground truncate' title={String(value)}>
								{String(value)}
							</span>
						</div>
					))}
				</div>
			</div>
		) : null}

		{/* Clear Filters Button */}
		{Object.keys(activeFilters).length > 0 ? (
			<button type='button' className='bg-destructive text-destructive-foreground hover:bg-destructive/90 mt-4 w-full flex-shrink-0 rounded px-3 py-1.5 text-sm' disabled={isLoading} onClick={handleClearFilters}>
				Clear All Filters
			</button>
		) : null}

		{!isLoading && sortedFilterEntries.length === 0 && error === null && searchTerm === '' && <p className='text-muted-foreground text-center'>No filters available.</p>}
		{/* Filtered Message */}
		{!isLoading && sortedFilterEntries.length === 0 && searchTerm !== '' && searchTerm.trim() !== '' && error === null ? <p className='text-muted-foreground text-center'>No filters match &quot;{searchTerm}&quot;</p> : null}
	</div>
);
