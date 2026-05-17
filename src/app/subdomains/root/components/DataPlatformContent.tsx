import React from 'react';

import { ChartPanel } from './ChartPanel';
import { FilterPanel } from './FilterPanel';

interface FilterValueCount {
	value: string;
	count: number;
	originalCount?: number;
}
interface SortedFilterEntry {
	key: string;
	valueCounts: FilterValueCount[];
	maxCount: number;
	isUnavailable?: boolean;
}

interface CombinedTooltipData {
	day: number;
	points: { x: number; y: number; year: number }[];
	range?: { x: number; yMin: number; yMax: number } | null;
}
type FormattedChartData = {
	datasets: { label: string; data: { x: number; y: number }[]; color: string; isCurrentYear: boolean }[];
	minMaxData: { x: number; yMin: number; yMax: number }[];
	rangeLabel: string;
	rangeFillColor: string;
	hasPreviousYears: boolean;
} | null;

interface ContentLayoutProps {
	isMobile: boolean;
	mobileViewMode: 'chart' | 'filters';
	// Filter props
	activeFilters: Record<string, string[]>;
	availableFilters: Record<string, FilterValueCount[]> | null;
	commonFields: Record<string, any> | null;
	error: string | null;
	handleClearFilters: () => void;
	handleFilterToggle: (key: string, value: string) => void;
	hasFilterData: boolean;
	hasLoadedFiltersOnce: boolean;
	isFilterActive: (key: string, value: string) => boolean;
	loadingFilters: boolean;
	sortedFilterEntries: SortedFilterEntry[];
	totalDocuments: number;
	animationsEnabled: boolean;
	// Chart props
	TooltipInPortal: React.FC<any>;
	activeChartTab: string | null;
	canShowChartBasedOnFilters: boolean;
	changingChartTabVisual: boolean;
	chartDocumentCount: number;
	chartLimitExceeded: boolean;
	chartMessage: string | null;
	chartableFields: string[];
	containerRef: (element: SVGSVGElement | null) => void;
	getFormattedChartData: FormattedChartData;
	handleChartTabChange: (tabKey: string) => void;
	handleToggleMobileView: () => void;
	handleTooltip: (event: React.MouseEvent<SVGRectElement> | React.TouchEvent<SVGRectElement>, chartWidth: number, chartHeight: number, xScale: any, yScale: any) => void;
	hiddenDatasets: Set<string>;
	hideTooltip: () => void;
	loadingChartData: boolean;
	showCharts: boolean;
	tooltipLeft: number | undefined;
	tooltipOpen: boolean;
	tooltipTop: number | undefined;
	handleLegendClick: (label: string) => void;
	tooltipData: CombinedTooltipData | undefined;
}

function FilterPanelWrapper(props: ContentLayoutProps): React.JSX.Element {
	return <FilterPanel activeFilters={props.activeFilters} availableFilters={props.availableFilters} commonFields={props.commonFields} error={props.error} handleClearFilters={props.handleClearFilters} handleFilterToggle={props.handleFilterToggle} hasFilterData={props.hasFilterData} hasLoadedFiltersOnce={props.hasLoadedFiltersOnce} isFilterActive={props.isFilterActive} isLoading={props.loadingFilters} isMobile={props.isMobile} sortedFilterEntries={props.sortedFilterEntries} totalDocuments={props.totalDocuments} searchTerm='' showAllStates={{}} animationsEnabled={props.animationsEnabled} />;
}

function ChartPanelWrapper(props: ContentLayoutProps): React.JSX.Element {
	return <ChartPanel TooltipInPortal={props.TooltipInPortal} activeChartTab={props.activeChartTab} canShowChartBasedOnFilters={props.canShowChartBasedOnFilters} changingChartTabVisual={props.changingChartTabVisual} chartDocumentCount={props.chartDocumentCount} chartLimitExceeded={props.chartLimitExceeded} chartMessage={props.chartMessage} chartableFields={props.chartableFields} containerRef={props.containerRef} error={props.error} getFormattedChartData={props.getFormattedChartData} handleChartTabChange={props.handleChartTabChange} handleToggleMobileView={props.handleToggleMobileView} handleTooltip={props.handleTooltip} hiddenDatasets={props.hiddenDatasets} hideTooltip={props.hideTooltip} isLoading={props.loadingChartData} isMobile={props.isMobile} mobileViewMode={props.mobileViewMode} showCharts={props.showCharts} tooltipLeft={props.tooltipLeft} tooltipOpen={props.tooltipOpen} tooltipTop={props.tooltipTop} totalDocuments={props.totalDocuments} handleLegendClick={props.handleLegendClick} tooltipData={props.tooltipData} animationsEnabled={props.animationsEnabled} />;
}

export function DataPlatformContentLayout(props: ContentLayoutProps): React.JSX.Element {
	const { isMobile, mobileViewMode } = props;

	return (
		<div className={`flex-1 min-h-0 overflow-hidden p-2 sm:p-3`}>
			{isMobile ? (
				<div className='h-full w-full'>{mobileViewMode === 'filters' ? <FilterPanelWrapper {...props} /> : <ChartPanelWrapper {...props} />}</div>
			) : (
				<div className='grid grid-cols-1 gap-2 lg:gap-3 lg:grid-cols-4 h-full min-h-0'>
					<div className='lg:col-span-1 h-full min-h-0 overflow-hidden'>
						<FilterPanelWrapper {...props} />
					</div>
					<div className='lg:col-span-3 h-full min-h-0 overflow-hidden'>
						<ChartPanelWrapper {...props} />
					</div>
				</div>
			)}
		</div>
	);
}
