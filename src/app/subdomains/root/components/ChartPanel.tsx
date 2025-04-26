import React from 'react';
import ParentSize from '@visx/responsive/lib/components/ParentSize';
import { TimeSeriesChart } from './TimeSeriesChart'; // Import the actual chart component

// Define types needed from parent (consider moving to a types.ts file)
type ChartPoint = { x: number; y: number };
type RangePoint = { x: number; yMin: number; yMax: number };
type TooltipPointData = ChartPoint & { year: number };
type CombinedTooltipData = {
	day: number;
	points: TooltipPointData[];
	range?: RangePoint | null;
};
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
}) => {
	const shouldShowPanelContent = showCharts || isLoading || chartLimitExceeded || (isMobile && !canShowChartBasedOnFilters);

	return (
		<div className={`lg:col-span-3 bg-background p-4 rounded border border-border overflow-y-auto flex flex-col ${isMobile ? 'h-full' : ''}`}>
			<h3 className='text-lg font-semibold mb-3 text-primary flex-shrink-0'>Raw Data Over Time</h3>

			{shouldShowPanelContent ? (
				<div className='flex-grow flex flex-col min-h-[400px]'>
					{/* Chart Tabs */}
					{!isLoading && !chartLimitExceeded && canShowChartBasedOnFilters && chartableFields.length > 0 ? (
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
					{chartMessage && !(isMobile && mobileViewMode === 'chart') ? (
						<div className={`flex-grow flex items-center justify-center min-h-[400px] bg-muted/20 rounded border border-border text-center text-muted-foreground p-4 ${isMobile ? 'text-base' : ''}`}>
							{chartLimitExceeded ? (
								<div>
									<p className='mb-2 text-lg font-medium'>Chart generation disabled</p>
									<p>Dataset size ({chartDocumentCount} documents) exceeds the limit.</p>
									<p className='mt-1'>Apply more specific filters to reduce the count.</p>
									{isMobile && (
										<p className='mt-4'>
											<button onClick={handleToggleMobileView} className='text-primary underline'>
												View Filters
											</button>
										</p>
									)}
								</div>
							) : (
								<div>
									<p>{chartMessage}</p>
									{isMobile && !canShowChartBasedOnFilters && (
										<p className='mt-4'>
											<button onClick={handleToggleMobileView} className='text-primary underline'>
												View Filters
											</button>
										</p>
									)}
								</div>
							)}
						</div>
					) : activeChartTab && getFormattedChartData ? (
						// Render the actual chart component
						<div className='flex-grow h-[400px] relative'>
							<TimeSeriesChart
								formattedData={getFormattedChartData}
								activeChartTab={activeChartTab}
								hiddenDatasets={hiddenDatasets}
								handleLegendClick={handleLegendClick}
								isMobile={isMobile}
								// Pass tooltip props
								tooltipData={tooltipData}
								tooltipLeft={tooltipLeft}
								tooltipTop={tooltipTop}
								tooltipOpen={tooltipOpen}
								hideTooltip={hideTooltip}
								handleTooltip={handleTooltip}
								containerRef={containerRef}
								TooltipInPortal={TooltipInPortal}
							/>
							{/* Changing Chart Tab Visual Overlay */}
							{changingChartTabVisual ? (
								<div className='absolute inset-0 bg-background/40 flex items-center justify-center z-20'>
									<p className='text-muted-foreground text-lg'>Switching chart...</p>
								</div>
							) : null}
						</div>
					) : (
						// Fallback if chartMessage is null but chart can't render
						<div className='flex-grow flex items-center justify-center text-muted-foreground'>Chart data not available.</div>
					)}
				</div>
			) : (
				// Fallback message when panel content shouldn't show
				<div className='flex-grow flex items-center justify-center min-h-[400px] bg-muted/20 rounded border border-border text-center text-muted-foreground p-4'>
					{totalDocuments === 0 ? 'No documents match the current filters.' : 'Select filters to view data.'}
					{isMobile && (
						<p className='mt-4'>
							<button onClick={handleToggleMobileView} className='text-primary underline'>
								View Filters
							</button>
						</p>
					)}
				</div>
			)}

			{/* Data source disclaimer */}
			<div className='mt-4 text-xs text-muted-foreground flex-shrink-0 border-t border-border pt-2'>
				<p>
					Filters show distinct values from the {totalDocuments} matching documents.
					{chartLimitExceeded ? ' Charts disabled due to dataset size.' : canShowChartBasedOnFilters ? ` Charts display raw data points over time. ` /* Raw count removed as rawDataPoints isn't passed here */ : ' Apply all available filters to enable charts.'}
					{getFormattedChartData !== null && hiddenDatasets.size > 0 && (
						<span className='ml-1 text-muted-foreground/80'>
							({hiddenDatasets.size} dataset{hiddenDatasets.size > 1 ? 's' : ''} hidden via legend)
						</span>
					)}
				</p>
			</div>
		</div>
	);
};
