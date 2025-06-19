import { AnimatePresence, motion } from 'framer-motion';
import React, { useState } from 'react';

import { formatFieldName } from '~/lib/utils';

// Define the structure for filters state (assuming Filters type is available or defined elsewhere)
// If not, you might need to import or define it here.
// import type { Filters } from './DataPlatformPreview';

interface FilterValueCount {
	value: string;
	count: number;
	originalCount?: number; // Add support for original count
}
interface SortedFilterEntry {
	key: string;
	valueCounts: FilterValueCount[];
	maxCount: number;
	isUnavailable?: boolean;
}

interface FilterPanelProps {
	isLoading: boolean;
	hasLoadedFiltersOnce: boolean;
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
	animationsEnabled: boolean;
}

export const FilterPanel: React.FC<FilterPanelProps> = ({
	isLoading,
	hasLoadedFiltersOnce,
	error,
	hasFilterData,
	sortedFilterEntries,
	commonFields,
	totalDocuments,
	activeFilters,
	availableFilters, // Included prop
	isMobile: _isMobile,
	handleFilterToggle,
	handleClearFilters,
	isFilterActive,
	searchTerm,
	showAllStates: _showAllStates,
	animationsEnabled,
}) => {
	const [hoveredFilter, setHoveredFilter] = useState<string | null>(null);

	// Conditionally use motion components based on animationsEnabled
	const ContainerDiv = animationsEnabled ? motion.div : 'div';
	const ItemDiv = animationsEnabled ? motion.div : 'div';
	const ButtonComponent = animationsEnabled ? motion.button : 'button';

	return (
		<ContainerDiv className={`relative flex flex-col h-full overflow-hidden rounded-2xl border border-border/50 bg-gradient-to-br from-card/95 to-card/98 shadow-lg`} {...(animationsEnabled ? { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.3 } } : {})}>
			{/* Enhanced Header */}
			<div className='border-b border-border/30 bg-gradient-to-r from-muted/20 via-muted/30 to-muted/20 px-3 py-2'>
				<div className='flex items-center justify-between'>
					<h3 className='flex items-center gap-2 text-sm font-semibold text-foreground'>
						<ItemDiv className='flex h-6 w-6 items-center justify-center rounded-md bg-primary/10' {...(animationsEnabled ? { whileHover: { scale: 1.1, rotate: 180 }, transition: { type: 'spring', stiffness: 200 } } : {})}>
							<svg className='h-4 w-4 text-primary' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
								<path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2.5} d='M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4' />
							</svg>
						</ItemDiv>
						Filters
					</h3>
					{Object.keys(activeFilters).length > 0 && (
						<ItemDiv className='flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary' {...(animationsEnabled ? { initial: { scale: 0 }, animate: { scale: 1 }, transition: { type: 'spring', stiffness: 300 } } : {})}>
							<span>{Object.keys(activeFilters).length}</span>
							<span className='opacity-70'>active</span>
						</ItemDiv>
					)}
				</div>
			</div>

			{/* Enhanced Content */}
			<div className='flex-1 min-h-0 overflow-y-auto p-3 relative'>
				{/* Loading Overlay - Positioned Absolutely */}
				{animationsEnabled ? (
					<AnimatePresence mode='wait'>
						{isLoading && (
							<ItemDiv key='loading-indicator' className='absolute top-0 left-3 right-3 z-10 rounded-lg bg-primary/10 border border-primary/20 p-3 flex items-center gap-3 backdrop-blur-sm' initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
								<ItemDiv className='h-4 w-4 rounded-full border-2 border-primary/30 border-t-primary' animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }} />
								<span className='text-sm font-medium text-primary'>{hasLoadedFiltersOnce ? 'Updating filters...' : 'Loading filters...'}</span>
							</ItemDiv>
						)}
					</AnimatePresence>
				) : (
					isLoading && (
						<div className='absolute top-0 left-3 right-3 z-10 rounded-lg bg-primary/10 border border-primary/20 p-3 flex items-center gap-3 backdrop-blur-sm'>
							<div className='h-4 w-4 rounded-full border-2 border-primary/30 border-t-primary animate-spin' />
							<span className='text-sm font-medium text-primary'>{hasLoadedFiltersOnce ? 'Updating filters...' : 'Loading filters...'}</span>
						</div>
					)
				)}

				{/* Enhanced Error Message */}
				{error !== null && !isLoading ? (
					<ItemDiv className='rounded-xl border border-destructive/20 bg-destructive/5 p-4 backdrop-blur-sm' {...(animationsEnabled ? { initial: { opacity: 0, scale: 0.95 }, animate: { opacity: 1, scale: 1 }, transition: { type: 'spring' } } : {})}>
						<div className='flex items-start gap-3'>
							<div className='flex h-8 w-8 items-center justify-center rounded-lg bg-destructive/10'>
								<svg className='h-5 w-5 text-destructive' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
									<path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z' />
								</svg>
							</div>
							<p className='text-sm text-destructive'>Error: {error}</p>
						</div>
					</ItemDiv>
				) : null}

				{/* Enhanced Filters Content */}
				{error === null && hasFilterData ? (
					<div className='space-y-2'>
						{sortedFilterEntries.map(({ key, valueCounts }, index) => (
							<ItemDiv key={key} className='group overflow-hidden rounded-lg border backdrop-blur-sm transition-all border-border/50 bg-gradient-to-br from-muted/10 to-muted/20 hover:border-border hover:shadow-md' {...(animationsEnabled ? { initial: { opacity: 0, x: -20 }, animate: { opacity: 1, x: 0 }, transition: { delay: index * 0.05, type: 'spring', stiffness: 200 }, whileHover: { scale: 1.01 } } : {})}>
								<div className='px-3 py-2'>
									<h4 className='mb-2 flex items-center gap-1.5 text-xs font-semibold capitalize text-foreground' title={formatFieldName(key)}>
										<span className='text-primary'>⚡</span>
										{formatFieldName(key)}
									</h4>
									{animationsEnabled ? (
										<AnimatePresence mode='popLayout'>
											<div className='flex flex-wrap gap-1.5'>
												{valueCounts
													.slice() // Create a copy to avoid mutating original array
													.sort((a, b) => {
														// Sort by count descending (highest first)
														if (b.count !== a.count) return b.count - a.count;
														// If counts are equal, sort alphabetically
														return a.value.localeCompare(b.value);
													})
													.map(({ value, count }) => {
														const isActive = isFilterActive(key, value) || valueCounts.length === 1;
														const isDisabled = count === 0 && !isActive; // Disabled if count is 0 and not active

														// Check if this is the only viable option when filters are active
														const hasActiveFilters = Object.keys(activeFilters).length > 0;
														const nonZeroOptions = valueCounts.filter((vc) => vc.count > 0);
														const isOnlyViableOption = hasActiveFilters && nonZeroOptions.length === 1 && nonZeroOptions[0].value === value && !isActive;

														// Determine tooltip text
														let tooltipText = `${value} (${count})`;
														if (isOnlyViableOption) {
															tooltipText = `${value} (${count}) - This is the only available option for this filter`;
														}

														const filterKey = `${key}-${value}`;

														return (
															<ItemDiv
																key={value}
																className='relative inline-block'
																{...(animationsEnabled
																	? {
																			layout: true,
																			transition: {
																				layout: { duration: 0.3, type: 'spring', stiffness: 300, damping: 30 },
																			},
																		}
																	: {})}
															>
																<ButtonComponent
																	className={`group/btn relative flex items-center gap-1 rounded-md border px-2 py-1 text-[11px] font-medium transition-all ${isActive ? 'border-primary bg-primary text-primary-foreground shadow-md shadow-primary/20' : isOnlyViableOption ? 'border-primary/60 bg-primary/10 text-primary animate-pulse hover:animate-none hover:border-primary hover:bg-primary/20' : isDisabled ? 'border-border/20 bg-background/20 text-muted-foreground/30 cursor-not-allowed opacity-30' : 'border-border/50 bg-background/60 text-muted-foreground hover:border-primary/50 hover:bg-accent hover:text-accent-foreground hover:shadow-sm'}`}
																	title={tooltipText}
																	type='button'
																	onClick={() => {
																		if (!isDisabled) {
																			handleFilterToggle(key, value);
																		}
																	}}
																	onMouseEnter={() => {
																		if (isOnlyViableOption) {
																			setHoveredFilter(filterKey);
																		}
																	}}
																	onMouseLeave={() => {
																		setHoveredFilter(null);
																	}}
																	{...(animationsEnabled
																		? {
																				whileHover: !isDisabled ? { scale: 1.05 } : {},
																				whileTap: !isDisabled ? { scale: 0.95 } : {},
																				transition: { type: 'spring', stiffness: 400 },
																			}
																		: {})}
																>
																	<span className='inline-block max-w-[140px] truncate align-bottom'>{value}</span>
																	<span className={`text-[11px] font-normal ${isActive ? 'opacity-90' : count === 0 ? 'opacity-40' : 'opacity-60'}`}>({count})</span>
																	{isActive && animationsEnabled && <ItemDiv className='absolute inset-0 -z-10 rounded-lg bg-primary/20' layoutId={`active-filter-${key}-${value}`} transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }} />}
																	{isActive && !animationsEnabled && <div className='absolute inset-0 -z-10 rounded-lg bg-primary/20' />}
																	{isOnlyViableOption && <ItemDiv className='absolute -top-1 -right-1 h-2 w-2 rounded-full bg-primary' {...(animationsEnabled ? { animate: { scale: [1, 1.5, 1] }, transition: { duration: 2, repeat: Infinity } } : {})} />}
																</ButtonComponent>

																{/* Enhanced Tooltip */}
																{animationsEnabled ? (
																	<AnimatePresence>
																		{hoveredFilter === filterKey && isOnlyViableOption && (
																			<ItemDiv className='absolute bottom-full left-1/2 mb-2 z-50 w-56 -translate-x-1/2 pointer-events-none' initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 5 }} transition={{ duration: 0.15 }}>
																				<div className='rounded-lg bg-popover px-3 py-2 text-xs text-popover-foreground shadow-lg border border-border'>
																					<div className='font-semibold mb-1 text-accent'>Single Option Available</div>
																					<div className='text-muted-foreground'>This is the only option with results for this filter. Consider selecting it to continue narrowing your search.</div>
																					<div className='absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-full'>
																						<div className='h-0 w-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[6px] border-t-[var(--popover)]' />
																					</div>
																				</div>
																			</ItemDiv>
																		)}
																	</AnimatePresence>
																) : (
																	hoveredFilter === filterKey &&
																	isOnlyViableOption && (
																		<div className='absolute bottom-full left-1/2 mb-2 z-50 w-56 -translate-x-1/2 pointer-events-none'>
																			<div className='rounded-lg bg-popover px-3 py-2 text-xs text-popover-foreground shadow-lg border border-border'>
																				<div className='font-semibold mb-1 text-accent'>Single Option Available</div>
																				<div className='text-muted-foreground'>This is the only option with results for this filter. Consider selecting it to continue narrowing your search.</div>
																				<div className='absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-full'>
																					<div className='h-0 w-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[6px] border-t-[var(--popover)]' />
																				</div>
																			</div>
																		</div>
																	)
																)}
															</ItemDiv>
														);
													})}
											</div>
										</AnimatePresence>
									) : (
										<div className='flex flex-wrap gap-1.5'>
											{valueCounts
												.slice()
												.sort((a, b) => {
													if (b.count !== a.count) return b.count - a.count;
													return a.value.localeCompare(b.value);
												})
												.map(({ value, count }) => {
													const isActive = isFilterActive(key, value) || valueCounts.length === 1;
													const isDisabled = count === 0 && !isActive;
													const hasActiveFilters = Object.keys(activeFilters).length > 0;
													const nonZeroOptions = valueCounts.filter((vc) => vc.count > 0);
													const isOnlyViableOption = hasActiveFilters && nonZeroOptions.length === 1 && nonZeroOptions[0].value === value && !isActive;
													let tooltipText = `${value} (${count})`;
													if (isOnlyViableOption) {
														tooltipText = `${value} (${count}) - This is the only available option for this filter`;
													}
													const filterKey = `${key}-${value}`;

													return (
														<div key={value} className='relative inline-block'>
															<button
																className={`group/btn relative flex items-center gap-1 rounded-md border px-2 py-1 text-[11px] font-medium transition-all ${isActive ? 'border-primary bg-primary text-primary-foreground shadow-md shadow-primary/20' : isOnlyViableOption ? 'border-primary/60 bg-primary/10 text-primary animate-pulse hover:animate-none hover:border-primary hover:bg-primary/20' : isDisabled ? 'border-border/20 bg-background/20 text-muted-foreground/30 cursor-not-allowed opacity-30' : 'border-border/50 bg-background/60 text-muted-foreground hover:border-primary/50 hover:bg-accent hover:text-accent-foreground hover:shadow-sm'}`}
																title={tooltipText}
																type='button'
																onClick={() => {
																	if (!isDisabled) {
																		handleFilterToggle(key, value);
																	}
																}}
																onMouseEnter={() => {
																	if (isOnlyViableOption) {
																		setHoveredFilter(filterKey);
																	}
																}}
																onMouseLeave={() => {
																	setHoveredFilter(null);
																}}
															>
																<span className='inline-block max-w-[140px] truncate align-bottom'>{value}</span>
																<span className={`text-[11px] font-normal ${isActive ? 'opacity-90' : count === 0 ? 'opacity-40' : 'opacity-60'}`}>({count})</span>
																{isActive && <div className='absolute inset-0 -z-10 rounded-lg bg-primary/20' />}
																{isOnlyViableOption && <div className='absolute -top-1 -right-1 h-2 w-2 rounded-full bg-primary' />}
															</button>

															{hoveredFilter === filterKey && isOnlyViableOption && (
																<div className='absolute bottom-full left-1/2 mb-2 z-50 w-56 -translate-x-1/2 pointer-events-none'>
																	<div className='rounded-lg bg-popover px-3 py-2 text-xs text-popover-foreground shadow-lg border border-border'>
																		<div className='font-semibold mb-1 text-accent'>Single Option Available</div>
																		<div className='text-muted-foreground'>This is the only option with results for this filter. Consider selecting it to continue narrowing your search.</div>
																		<div className='absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-full'>
																			<div className='h-0 w-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[6px] border-t-[var(--popover)]' />
																		</div>
																	</div>
																</div>
															)}
														</div>
													);
												})}
										</div>
									)}
								</div>
							</ItemDiv>
						))}
					</div>
				) : null}

				{/* Enhanced No Filters Available Message */}
				{!isLoading && error === null && !hasFilterData ? (
					<ItemDiv className='flex h-full items-center justify-center' {...(animationsEnabled ? { initial: { opacity: 0 }, animate: { opacity: 1 }, transition: { delay: 0.2 } } : {})}>
						<div className='text-center'>
							<ItemDiv className='mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted/50' {...(animationsEnabled ? { animate: { rotate: [0, 360] }, transition: { duration: 20, repeat: Infinity, ease: 'linear' } } : {})}>
								<svg className='h-8 w-8 text-muted-foreground/50' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
									<path strokeLinecap='round' strokeLinejoin='round' strokeWidth={1.5} d='M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z' />
								</svg>
							</ItemDiv>
							<p className='text-sm font-medium text-muted-foreground'>{totalDocuments === 0 ? 'No documents match the current filters.' : 'No filter options available for the current data.'}</p>
						</div>
					</ItemDiv>
				) : null}

				{/* Enhanced Common Fields Display */}
				{commonFields !== null && Object.keys(commonFields).length > 0 && availableFilters !== null && Object.keys(availableFilters).length > 0 && Object.keys(availableFilters).length === Object.keys(activeFilters).length ? (
					<ItemDiv className='mt-4 overflow-hidden rounded-xl border border-border/50 bg-gradient-to-br from-muted/5 to-muted/10 p-4' {...(animationsEnabled ? { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 }, transition: { delay: 0.3, type: 'spring' } } : {})}>
						<h4 className='mb-3 flex items-center gap-2 text-sm font-semibold text-foreground'>
							<svg className='h-4 w-4 text-primary' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
								<path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z' />
							</svg>
							Common Fields
							<span className='text-xs font-normal text-muted-foreground'>({totalDocuments} Documents)</span>
						</h4>
						<div className='space-y-2'>
							{Object.entries(commonFields).map(([key, value], index) => (
								<ItemDiv key={key} className='flex items-center justify-between rounded-lg bg-background/40 px-3 py-2 backdrop-blur-sm' {...(animationsEnabled ? { initial: { opacity: 0, x: -10 }, animate: { opacity: 1, x: 0 }, transition: { delay: 0.3 + index * 0.05 } } : {})}>
									<span className='text-xs font-medium text-muted-foreground'>{formatFieldName(key)}:</span>
									<span className='max-w-[60%] truncate text-xs font-medium text-foreground' title={String(value)}>
										{String(value)}
									</span>
								</ItemDiv>
							))}
						</div>
					</ItemDiv>
				) : null}
			</div>

			{/* Enhanced Clear Filters Button */}
			{Object.keys(activeFilters).length > 0 && (
				<ItemDiv className='border-t border-border/30 bg-gradient-to-r from-muted/10 to-muted/20 p-3' {...(animationsEnabled ? { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 }, transition: { type: 'spring' } } : {})}>
					<ButtonComponent type='button' className='group relative flex w-full items-center justify-center gap-2 overflow-hidden rounded-xl bg-gradient-to-r from-destructive/90 to-destructive px-4 py-2.5 text-sm font-medium text-destructive-foreground shadow-md transition-all hover:shadow-lg hover:shadow-destructive/20 disabled:opacity-50' disabled={isLoading} onClick={handleClearFilters} {...(animationsEnabled ? { whileHover: { scale: 1.02 }, whileTap: { scale: 0.98 } } : {})}>
						<svg className='h-4 w-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
							<path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16' />
						</svg>
						<span>Clear All Filters</span>
						<ItemDiv className='absolute inset-0 -z-10 bg-gradient-to-r from-destructive-foreground/10 to-transparent' {...(animationsEnabled ? { initial: { x: '-100%' }, whileHover: { x: 0 }, transition: { duration: 0.3 } } : {})} />
					</ButtonComponent>
				</ItemDiv>
			)}

			{!isLoading && sortedFilterEntries.length === 0 && error === null && searchTerm === '' && <p className='text-center text-sm text-muted-foreground'>No filters available.</p>}

			{/* Filtered Message */}
			{!isLoading && sortedFilterEntries.length === 0 && searchTerm !== '' && searchTerm.trim() !== '' && error === null ? <p className='text-center text-sm text-muted-foreground'>No filters match &quot;{searchTerm}&quot;</p> : null}
		</ContainerDiv>
	);
};
