import React from 'react';

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
		<div className={`bg-background border-border flex flex-col overflow-y-auto rounded border p-4 lg:col-span-3 ${isMobile ? 'h-full' : ''}`}>
			<h3 className='text-primary mb-3 flex-shrink-0 text-lg font-semibold'>Raw Data Over Time</h3>

			{shouldShowPanelContent ? (
				<div className='flex min-h-[400px] flex-grow flex-col'>
					{/* Chart Tabs */}
					{!isLoading && !chartLimitExceeded && canShowChartBasedOnFilters && chartableFields.length > 0 ? (
						<div className='border-border mb-4 flex flex-shrink-0 space-x-2 overflow-x-auto border-b pb-2'>
							{chartableFields.map((key) => (
								<button
									type='button'
									key={key}
									className={`rounded px-3 py-1 text-sm whitespace-nowrap transition-colors ${activeChartTab === key ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-accent hover:text-accent-foreground'}`}
									onClick={() => {
										handleChartTabChange(key);
									}}
								>
									{key.replace(/_/g, ' ')}
								</button>
							))}
						</div>
					) : null}

					{/* Message Area or Chart */}
					{chartMessage !== null && !(isMobile && mobileViewMode === 'chart') ? (
						<div className={`bg-muted/20 border-border text-muted-foreground flex min-h-[400px] flex-grow items-center justify-center rounded border p-4 text-center ${isMobile ? 'text-base' : ''}`}>
							{chartLimitExceeded ? (
								<div>
									<p className='mb-2 text-lg font-medium'>Chart generation disabled</p>
									<p>Dataset size ({chartDocumentCount} documents) exceeds the limit.</p>
									<p className='mt-1'>Apply more specific filters to reduce the count.</p>
									{isMobile ? (
										<p className='mt-4'>
											<button type='button' className='text-primary underline' onClick={handleToggleMobileView}>
												View Filters
											</button>
										</p>
									) : null}
								</div>
							) : (
								<div>
									<p>{chartMessage}</p>
									{isMobile && !canShowChartBasedOnFilters ? (
										<p className='mt-4'>
											<button type='button' className='text-primary underline' onClick={handleToggleMobileView}>
												View Filters
											</button>
										</p>
									) : null}
								</div>
							)}
						</div>
					) : activeChartTab !== null && getFormattedChartData !== null ? (
						// Render the actual chart component
						<div className='relative h-[400px] flex-grow'>
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
							{/* Changing Chart Tab Visual Overlay */}
							{changingChartTabVisual ? (
								<div className='bg-background/40 absolute inset-0 z-20 flex items-center justify-center'>
									<p className='text-muted-foreground text-lg'>Switching chart...</p>
								</div>
							) : null}
						</div>
					) : (
						// Fallback if chartMessage is null but chart can't render
						<div className='text-muted-foreground flex flex-grow items-center justify-center'>Chart data not available.</div>
					)}
				</div>
			) : (
				// Fallback message when panel content shouldn't show
				<div className='bg-muted/20 border-border text-muted-foreground flex min-h-[400px] flex-grow items-center justify-center rounded border p-4 text-center'>
					{totalDocuments === 0 ? 'No documents match the current filters.' : 'Select filters to view data.'}
					{isMobile ? (
						<p className='mt-4'>
							<button type='button' className='text-primary underline' onClick={handleToggleMobileView}>
								View Filters
							</button>
						</p>
					) : null}
				</div>
			)}

			{/* Data source disclaimer */}
			<div className='text-muted-foreground border-border mt-4 flex-shrink-0 border-t pt-2 text-xs'>
				<p>
					Filters show distinct values from the {totalDocuments} matching documents.
					{chartLimitExceeded ? ' Charts disabled due to dataset size.' : canShowChartBasedOnFilters ? ` Charts display raw data points over time. ` /* Raw count removed as rawDataPoints isn't passed here */ : ' Apply all available filters to enable charts.'}
					{getFormattedChartData !== null && hiddenDatasets.size > 0 && (
						<span className='text-muted-foreground/80 ml-1'>
							({hiddenDatasets.size} dataset{hiddenDatasets.size > 1 ? 's' : ''} hidden via legend)
						</span>
					)}
				</p>
			</div>
		</div>
	);
};
