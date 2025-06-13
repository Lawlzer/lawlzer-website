import { motion } from 'framer-motion';
import React from 'react';

import { ChartPanelSkeleton } from './SkeletonLoader';
import { TimeSeriesChart } from './TimeSeriesChart'; // Import the actual chart component

// Define types needed from parent (consider moving to a types.ts file)
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
	range?: RangePoint | null;
}
type FormattedChartData = {
	datasets: { label: string; data: ChartPoint[]; color: string; isCurrentYear: boolean }[];
	minMaxData: RangePoint[];
	rangeLabel: string;
	rangeFillColor: string;
	hasPreviousYears: boolean;
} | null;

interface ChartPanelProps {
	isLoading: boolean;
	error: string | null;
	showCharts: boolean;
	chartLimitExceeded: boolean;
	canShowChartBasedOnFilters: boolean;
	chartableFields: string[];
	activeChartTab: string | null;
	handleChartTabChange: (tabKey: string) => void;
	chartMessage: string | null;
	getFormattedChartData: FormattedChartData; // Use the defined type
	isMobile: boolean;
	mobileViewMode: 'chart' | 'filters';
	handleToggleMobileView: () => void;
	chartDocumentCount: number;
	totalDocuments: number;
	changingChartTabVisual: boolean;
	hiddenDatasets: Set<string>;
	handleLegendClick: (label: string) => void;
	// Tooltip Props
	tooltipData: CombinedTooltipData | undefined;
	tooltipLeft: number | undefined;
	tooltipTop: number | undefined;
	tooltipOpen: boolean;
	hideTooltip: () => void;
	handleTooltip: (event: React.MouseEvent<SVGRectElement> | React.TouchEvent<SVGRectElement>, chartWidth: number, chartHeight: number, xScale: any, yScale: any) => void;
	containerRef: (element: SVGSVGElement | null) => void;
	TooltipInPortal: React.FC<any>; // Consider defining more specific props if possible
	animationsEnabled: boolean;
}

export const ChartPanel: React.FC<ChartPanelProps> = ({
	isLoading,
	error,
	showCharts,
	chartLimitExceeded,
	canShowChartBasedOnFilters,
	chartableFields,
	activeChartTab,
	handleChartTabChange,
	chartMessage,
	getFormattedChartData,
	isMobile,
	mobileViewMode,
	handleToggleMobileView,
	chartDocumentCount,
	totalDocuments,
	changingChartTabVisual,
	hiddenDatasets,
	handleLegendClick,
	// Tooltip Props
	tooltipData,
	tooltipLeft,
	tooltipTop,
	tooltipOpen,
	hideTooltip,
	handleTooltip,
	containerRef,
	TooltipInPortal,
	animationsEnabled,
}) => {
	const shouldShowPanelContent = showCharts || isLoading || chartLimitExceeded || (isMobile && !canShowChartBasedOnFilters);

	// Conditionally use motion components based on animationsEnabled
	const ContainerDiv = animationsEnabled ? motion.div : 'div';
	const ItemDiv = animationsEnabled ? motion.div : 'div';
	const ButtonComponent = animationsEnabled ? motion.button : 'button';

	return (
		<ContainerDiv className={`relative flex flex-col h-full overflow-hidden rounded-2xl border border-border/50 bg-gradient-to-br from-card/95 to-card/98 shadow-lg`} {...(animationsEnabled ? { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.3, delay: 0.1 } } : {})}>
			{/* Enhanced Header */}
			<div className='border-b border-border/30 bg-gradient-to-r from-muted/20 via-muted/30 to-muted/20 px-3 py-2'>
				<div className='flex items-center justify-between'>
					<h3 className='flex items-center gap-2 text-sm font-semibold text-foreground'>
						<ItemDiv className='flex h-6 w-6 items-center justify-center rounded-md bg-primary/10' {...(animationsEnabled ? { whileHover: { scale: 1.1, rotate: -10 }, transition: { type: 'spring', stiffness: 200 } } : {})}>
							<svg className='h-4 w-4 text-primary' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
								<path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2.5} d='M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z' />
							</svg>
						</ItemDiv>
						Data Visualization
					</h3>
					{activeChartTab !== null && activeChartTab !== '' && (
						<ItemDiv className='flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary' {...(animationsEnabled ? { initial: { scale: 0, opacity: 0 }, animate: { scale: 1, opacity: 1 }, transition: { type: 'spring', stiffness: 300 } } : {})}>
							<svg className='h-3 w-3' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
								<path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' />
							</svg>
							{activeChartTab.replace(/_/g, ' ')}
						</ItemDiv>
					)}
				</div>
			</div>

			{shouldShowPanelContent ? (
				<div className='flex flex-grow flex-col overflow-hidden'>
					{/* Enhanced Chart Tabs */}
					{!isLoading && !chartLimitExceeded && canShowChartBasedOnFilters && chartableFields.length > 0 ? (
						<ItemDiv className='border-b border-border/30 bg-gradient-to-r from-muted/10 via-muted/20 to-muted/10' {...(animationsEnabled ? { initial: { opacity: 0, y: -10 }, animate: { opacity: 1, y: 0 }, transition: { delay: 0.2 } } : {})}>
							<div className='flex space-x-1.5 overflow-x-auto p-2'>
								{chartableFields.map((key, index) => (
									<ButtonComponent
										type='button'
										key={key}
										className={`group relative whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${activeChartTab === key ? 'bg-primary text-primary-foreground shadow-md shadow-primary/20' : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground hover:shadow-sm'}`}
										onClick={() => {
											handleChartTabChange(key);
										}}
										{...(animationsEnabled
											? {
													initial: { opacity: 0, x: -20 },
													animate: { opacity: 1, x: 0 },
													transition: { delay: index * 0.05, type: 'spring', stiffness: 200 },
													whileHover: { scale: 1.05 },
													whileTap: { scale: 0.95 },
												}
											: {})}
									>
										{key.replace(/_/g, ' ')}
										{activeChartTab === key && animationsEnabled && <motion.div className='absolute inset-0 -z-10 rounded-xl bg-primary' layoutId='active-chart-tab' transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }} />}
										{activeChartTab === key && !animationsEnabled && <div className='absolute inset-0 -z-10 rounded-xl bg-primary' />}
									</ButtonComponent>
								))}
							</div>
						</ItemDiv>
					) : null}

					{/* Enhanced Message Area or Chart */}
					{isLoading ? (
						<ItemDiv className='flex-grow p-4' {...(animationsEnabled ? { initial: { opacity: 0 }, animate: { opacity: 1 }, transition: { delay: 0.2 } } : {})}>
							<ChartPanelSkeleton />
						</ItemDiv>
					) : chartMessage !== null && !(isMobile && mobileViewMode === 'chart') ? (
						<ItemDiv className={`flex flex-grow items-center justify-center p-4 ${isMobile ? 'text-sm' : ''}`} {...(animationsEnabled ? { initial: { opacity: 0 }, animate: { opacity: 1 }, transition: { delay: 0.2 } } : {})}>
							<div className='text-center'>
								{chartLimitExceeded ? (
									<>
										<ItemDiv className='mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-destructive/20 to-destructive/10 shadow-lg' {...(animationsEnabled ? { animate: { scale: [1, 1.05, 1] }, transition: { duration: 3, repeat: Infinity } } : {})}>
											<svg className='h-10 w-10 text-destructive' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
												<path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z' />
											</svg>
										</ItemDiv>
										<h4 className='mb-2 text-xl font-semibold text-foreground'>Chart Generation Disabled</h4>
										<p className='mb-2 text-base text-muted-foreground'>
											Dataset size (<span className='font-mono font-semibold'>{chartDocumentCount.toLocaleString()}</span> documents) exceeds the limit.
										</p>
										<p className='text-sm text-muted-foreground'>Apply more specific filters to reduce the count.</p>
										{isMobile && (
											<ButtonComponent type='button' className='mt-6 inline-flex items-center gap-2 rounded-xl bg-primary/10 px-4 py-2 text-sm font-medium text-primary transition-all hover:bg-primary/20' onClick={handleToggleMobileView} {...(animationsEnabled ? { whileHover: { scale: 1.05 }, whileTap: { scale: 0.95 } } : {})}>
												<svg className='h-4 w-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
													<path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4' />
												</svg>
												View Filters
											</ButtonComponent>
										)}
									</>
								) : (
									<>
										<ItemDiv className='mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-muted/50 to-muted/30' {...(animationsEnabled ? { animate: { rotate: [0, 360] }, transition: { duration: 30, repeat: Infinity, ease: 'linear' } } : {})}>
											<svg className='h-10 w-10 text-muted-foreground' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
												<path strokeLinecap='round' strokeLinejoin='round' strokeWidth={1.5} d='M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' />
											</svg>
										</ItemDiv>
										<p className='text-base font-medium text-muted-foreground'>{chartMessage}</p>
										{isMobile && !canShowChartBasedOnFilters && (
											<ButtonComponent type='button' className='mt-6 inline-flex items-center gap-2 rounded-xl bg-primary/10 px-4 py-2 text-sm font-medium text-primary transition-all hover:bg-primary/20' onClick={handleToggleMobileView} {...(animationsEnabled ? { whileHover: { scale: 1.05 }, whileTap: { scale: 0.95 } } : {})}>
												<svg className='h-4 w-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
													<path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4' />
												</svg>
												View Filters
											</ButtonComponent>
										)}
									</>
								)}
							</div>
						</ItemDiv>
					) : activeChartTab !== null && getFormattedChartData !== null ? (
						// Render the actual chart component
						<ItemDiv className='relative flex-grow bg-gradient-to-br from-background/20 to-background/5' {...(animationsEnabled ? { initial: { opacity: 0 }, animate: { opacity: 1 }, transition: { delay: 0.3 } } : {})}>
							<TimeSeriesChart
								TooltipInPortal={TooltipInPortal}
								activeChartTab={activeChartTab}
								containerRef={containerRef}
								formattedData={getFormattedChartData}
								handleLegendClick={handleLegendClick}
								handleTooltip={handleTooltip}
								hiddenDatasets={hiddenDatasets}
								hideTooltip={hideTooltip}
								tooltipLeft={tooltipLeft}
								tooltipOpen={tooltipOpen}
								tooltipTop={tooltipTop}
								isMobile={isMobile}
								// Pass tooltip props
								tooltipData={tooltipData}
							/>
							{/* Enhanced Changing Chart Tab Visual Overlay */}
							{changingChartTabVisual ? (
								<ItemDiv className='absolute inset-0 z-20 flex items-center justify-center bg-background/70 backdrop-blur-md' {...(animationsEnabled ? { initial: { opacity: 0 }, animate: { opacity: 1 } } : {})}>
									<div className='flex flex-col items-center gap-4'>
										<ItemDiv className='h-12 w-12 rounded-full border-3 border-primary/30 border-t-primary' {...(animationsEnabled ? { animate: { rotate: 360 }, transition: { duration: 1, repeat: Infinity, ease: 'linear' } } : {})} />
										<p className='text-sm font-medium text-muted-foreground'>Switching chart...</p>
									</div>
								</ItemDiv>
							) : null}
						</ItemDiv>
					) : (
						// Fallback if chartMessage is null but chart can't render
						<div className='flex flex-grow items-center justify-center text-muted-foreground'>
							<div className='text-center'>
								<svg className='mx-auto mb-3 h-12 w-12 text-muted-foreground/50' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
									<path strokeLinecap='round' strokeLinejoin='round' strokeWidth={1.5} d='M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' />
								</svg>
								<p className='text-sm'>Chart data not available.</p>
							</div>
						</div>
					)}
				</div>
			) : (
				// Enhanced fallback message when panel content shouldn't show
				<ItemDiv className='flex flex-grow items-center justify-center p-4' {...(animationsEnabled ? { initial: { opacity: 0 }, animate: { opacity: 1 } } : {})}>
					<div className='text-center'>
						<ItemDiv className='mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-muted/50 to-muted/30' {...(animationsEnabled ? { animate: { rotate: [0, -10, 10, -10, 0] }, transition: { duration: 4, repeat: Infinity, repeatDelay: 2 } } : {})}>
							<svg className='h-10 w-10 text-muted-foreground' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
								<path strokeLinecap='round' strokeLinejoin='round' strokeWidth={1.5} d='M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4' />
							</svg>
						</ItemDiv>
						<p className='text-base font-medium text-muted-foreground'>{totalDocuments === 0 ? 'No documents match the current filters.' : 'Select filters to view data.'}</p>
						{isMobile && (
							<ButtonComponent type='button' className='mt-6 inline-flex items-center gap-2 rounded-xl bg-primary/10 px-4 py-2 text-sm font-medium text-primary transition-all hover:bg-primary/20' onClick={handleToggleMobileView} {...(animationsEnabled ? { whileHover: { scale: 1.05 }, whileTap: { scale: 0.95 } } : {})}>
								<svg className='h-4 w-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
									<path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4' />
								</svg>
								View Filters
							</ButtonComponent>
						)}
					</div>
				</ItemDiv>
			)}

			{/* Enhanced Footer */}
			<ItemDiv className='border-t border-border/30 bg-gradient-to-r from-muted/10 to-muted/20 px-3 py-1.5' {...(animationsEnabled ? { initial: { opacity: 0, y: 10 }, animate: { opacity: 1, y: 0 }, transition: { delay: 0.4 } } : {})}>
				<div className='flex items-center gap-3 text-[10px] text-muted-foreground'>
					<span className='flex items-center gap-1.5'>
						<svg className='h-3.5 w-3.5 text-primary' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
							<path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4' />
						</svg>
						<span className='font-mono font-semibold'>{totalDocuments.toLocaleString()}</span> documents
					</span>
					{chartLimitExceeded && (
						<span className='flex items-center gap-1.5 text-destructive'>
							<ItemDiv className='inline-block h-2 w-2 rounded-full bg-destructive' {...(animationsEnabled ? { animate: { opacity: [0.3, 1, 0.3] }, transition: { duration: 2, repeat: Infinity } } : {})} />
							Charts disabled (limit exceeded)
						</span>
					)}
					{!chartLimitExceeded && canShowChartBasedOnFilters && showCharts && (
						<span className='flex items-center gap-1.5'>
							<ItemDiv className='inline-block h-2 w-2 rounded-full bg-primary' {...(animationsEnabled ? { animate: { opacity: [0.3, 1, 0.3] }, transition: { duration: 2, repeat: Infinity } } : {})} />
							Real-time visualization
						</span>
					)}
					{getFormattedChartData !== null && hiddenDatasets.size > 0 && (
						<span className='ml-auto opacity-70'>
							{hiddenDatasets.size} dataset{hiddenDatasets.size > 1 ? 's' : ''} hidden
						</span>
					)}
				</div>
			</ItemDiv>
		</ContainerDiv>
	);
};
