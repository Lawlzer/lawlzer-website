'use client';

import { localPoint } from '@visx/event';
import { useTooltip, useTooltipInPortal } from '@visx/tooltip';
import { AnimatePresence, motion } from 'framer-motion';
import type { JSX } from 'react';
import React, { useCallback } from 'react';

import { DataPlatformContentLayout } from './DataPlatformContent';
import { DataPlatformHeaderBar, ProjectInfoContent } from './DataPlatformHeader';
import { SettingsModal } from './SettingsModal';
import { useDataPlatformPreviewState } from './useDataPlatformPreview';

// Re-export types for backward compatibility
export type { ChartDataApiResponse, FiltersApiResponse, RawDataPoint } from './DataPlatform.types';

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

const chartMargin = { top: 40, right: 30, bottom: 50, left: 60 };

function CloseButton({ onClose }: { onClose: () => void }): React.JSX.Element {
	return (
		<button aria-label='Close' className='absolute top-4 right-4 z-10 rounded-lg bg-secondary/80 p-2 text-foreground backdrop-blur-sm transition-all hover:bg-secondary hover:scale-110' onClick={onClose}>
			<svg className='h-5 w-5' fill='none' stroke='currentColor' strokeWidth={2} viewBox='0 0 24 24'>
				<path strokeLinecap='round' strokeLinejoin='round' d='M6 18L18 6M6 6l12 12' />
			</svg>
		</button>
	);
}

function ProjectInfoModal({ showProjectInfo, setShowProjectInfo, animationsEnabled }: { showProjectInfo: boolean; setShowProjectInfo: (v: boolean) => void; animationsEnabled: boolean }): React.JSX.Element | null {
	if (animationsEnabled) {
		return (
			<AnimatePresence>
				{showProjectInfo && (
					<motion.div
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						exit={{ opacity: 0 }}
						transition={{ duration: 0.2 }}
						className='fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4'
						onClick={() => {
							setShowProjectInfo(false);
						}}
					>
						<motion.div
							initial={{ scale: 0.9, opacity: 0 }}
							animate={{ scale: 1, opacity: 1 }}
							exit={{ scale: 0.9, opacity: 0 }}
							transition={{ type: 'spring', stiffness: 300, damping: 30 }}
							className='relative w-full max-w-2xl rounded-xl bg-background shadow-2xl border border-border'
							onClick={(e) => {
								e.stopPropagation();
							}}
						>
							<ProjectInfoContent setShowProjectInfo={setShowProjectInfo} />
						</motion.div>
					</motion.div>
				)}
			</AnimatePresence>
		);
	}
	if (!showProjectInfo) return null;
	return (
		<div
			className='fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4'
			onClick={() => {
				setShowProjectInfo(false);
			}}
		>
			<div
				className='relative w-full max-w-2xl rounded-xl bg-background shadow-2xl border border-border'
				onClick={(e) => {
					e.stopPropagation();
				}}
			>
				<ProjectInfoContent setShowProjectInfo={setShowProjectInfo} />
			</div>
		</div>
	);
}

interface ModalContentProps {
	onClose: () => void;
	state: ReturnType<typeof useDataPlatformPreviewState>;
	tooltipData: CombinedTooltipData | undefined;
	tooltipLeft: number | undefined;
	tooltipTop: number | undefined;
	tooltipOpen: boolean;
	hideTooltip: () => void;
	handleTooltip: (event: React.MouseEvent<SVGRectElement> | React.TouchEvent<SVGRectElement>, cw: number, ch: number, xs: any, ys: any) => void;
	containerRef: (element: SVGSVGElement | null) => void;
	TooltipInPortal: React.FC<any>;
}

function ModalInnerContent({ onClose, state, tooltipData, tooltipLeft, tooltipTop, tooltipOpen, hideTooltip, handleTooltip, containerRef, TooltipInPortal }: ModalContentProps): React.JSX.Element {
	return (
		<>
			<CloseButton onClose={onClose} />
			<div className='flex flex-col h-full w-full'>
				<DataPlatformHeaderBar animationsEnabled={state.animationsEnabled} setShowSettingsModal={state.setShowSettingsModal} showProjectInfo={state.showProjectInfo} setShowProjectInfo={state.setShowProjectInfo} />
				<DataPlatformContentLayout isMobile={state.isMobile} mobileViewMode={state.mobileViewMode} activeFilters={state.activeFilters} availableFilters={state.availableFilters} commonFields={state.commonFields} error={state.error} handleClearFilters={state.handleClearFilters} handleFilterToggle={state.handleFilterToggle} hasFilterData={state.hasFilterData} hasLoadedFiltersOnce={state.hasLoadedFiltersOnce} isFilterActive={state.isFilterActive} loadingFilters={state.loadingFilters} sortedFilterEntries={state.sortedFilterEntries} totalDocuments={state.totalDocuments} animationsEnabled={state.animationsEnabled} TooltipInPortal={TooltipInPortal} activeChartTab={state.activeChartTab} canShowChartBasedOnFilters={state.canShowChartBasedOnFilters} changingChartTabVisual={state.changingChartTabVisual} chartDocumentCount={state.chartDocumentCount} chartLimitExceeded={state.chartLimitExceeded} chartMessage={state.chartMessage} chartableFields={state.chartableFields} containerRef={containerRef} getFormattedChartData={state.getFormattedChartData} handleChartTabChange={state.handleChartTabChange} handleToggleMobileView={state.handleToggleMobileView} handleTooltip={handleTooltip} hiddenDatasets={state.hiddenDatasets} hideTooltip={hideTooltip} loadingChartData={state.loadingChartData} showCharts={state.showCharts} tooltipLeft={tooltipLeft} tooltipOpen={tooltipOpen} tooltipTop={tooltipTop} handleLegendClick={state.handleLegendClick} tooltipData={tooltipData} />
			</div>
		</>
	);
}

export default function DataPlatformPreview({ onClose }: { onClose: () => void }): JSX.Element {
	const state = useDataPlatformPreviewState();
	const { tooltipData, tooltipLeft, tooltipTop, tooltipOpen, showTooltip, hideTooltip } = useTooltip<CombinedTooltipData>();
	const { containerRef, TooltipInPortal } = useTooltipInPortal({ scroll: true });

	const handleTooltip = useCallback(
		(event: React.MouseEvent<SVGRectElement> | React.TouchEvent<SVGRectElement>, _chartWidth: number, _chartHeight: number, xScale: any, yScale: any) => {
			const { x } = localPoint(event) ?? { x: 0 };
			const x0 = xScale.invert(x - chartMargin.left);
			const dayOfYear = Math.round(x0);
			const formattedData = state.getFormattedChartData;
			if (dayOfYear < 1 || dayOfYear > 366 || !formattedData?.datasets || !state.rawDataPoints) {
				hideTooltip();
				return;
			}
			const closestPoints: TooltipPointData[] = [];
			formattedData.datasets
				.filter((ds) => !state.hiddenDatasets.has(ds.label))
				.forEach((dataset) => {
					const year = parseInt(dataset.label.split(' ')[0], 10);
					if (isNaN(year)) return;
					let minDist = Infinity;
					let closest: TooltipPointData | null = null;
					dataset.data.forEach((point: ChartPoint) => {
						const dist = Math.abs(point.x - dayOfYear);
						if (dist < minDist) {
							minDist = dist;
							closest = { ...point, year };
						}
					});
					if (closest !== null && minDist <= 1) {
						const vp = closest as TooltipPointData;
						if (typeof vp.y === 'number' && Number.isFinite(vp.y)) closestPoints.push(vp);
					}
				});
			let rangeData: RangePoint | null = null;
			if (!state.hiddenDatasets.has(formattedData.rangeLabel) && formattedData.minMaxData.length > 0) {
				const crp = formattedData.minMaxData.find((d) => Math.abs(d.x - dayOfYear) <= 0.5);
				if (crp) {
					const { y } = localPoint(event) ?? { y: 0 };
					const yVal = yScale.invert(y - chartMargin.top);
					if (yVal >= crp.yMin && yVal <= crp.yMax) rangeData = crp;
				}
			}
			if (closestPoints.length > 0 || rangeData) {
				const combined: CombinedTooltipData = { day: dayOfYear, points: closestPoints.sort((a, b) => b.year - a.year), range: rangeData };
				const tooltipYValue = rangeData ? rangeData.yMax : closestPoints.length > 0 ? Math.max(...closestPoints.map((p) => p.y)) : 0;
				showTooltip({ tooltipData: combined, tooltipLeft: x, tooltipTop: yScale(tooltipYValue) });
			} else {
				hideTooltip();
			}
		},
		[state.getFormattedChartData, state.rawDataPoints, showTooltip, hideTooltip, state.hiddenDatasets]
	);

	const modalProps: ModalContentProps = { onClose, state, tooltipData, tooltipLeft, tooltipTop, tooltipOpen, hideTooltip, handleTooltip, containerRef, TooltipInPortal };

	return (
		<>
			{state.animationsEnabled ? (
				<motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} className='fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4' onClick={onClose}>
					<motion.div
						initial={{ scale: 0.9, opacity: 0 }}
						animate={{ scale: 1, opacity: 1 }}
						exit={{ scale: 0.9, opacity: 0 }}
						transition={{ type: 'spring', stiffness: 300, damping: 30 }}
						className='relative flex h-[calc(100vh-2rem)] w-full max-w-[1400px] flex-col overflow-hidden rounded-2xl bg-background shadow-2xl'
						onClick={(e) => {
							e.stopPropagation();
						}}
					>
						<ModalInnerContent {...modalProps} />
					</motion.div>
				</motion.div>
			) : (
				<div className='fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4' onClick={onClose}>
					<div
						className='relative flex h-[calc(100vh-2rem)] w-full max-w-[1400px] flex-col overflow-hidden rounded-2xl bg-background shadow-2xl'
						onClick={(e) => {
							e.stopPropagation();
						}}
					>
						<ModalInnerContent {...modalProps} />
					</div>
				</div>
			)}
			<ProjectInfoModal showProjectInfo={state.showProjectInfo} setShowProjectInfo={state.setShowProjectInfo} animationsEnabled={state.animationsEnabled} />
			<SettingsModal
				isOpen={state.showSettingsModal}
				onClose={() => {
					state.setShowSettingsModal(false);
				}}
				animationsEnabled={state.animationsEnabled}
				onAnimationToggle={(enabled) => {
					state.setAnimationsEnabled(enabled);
				}}
			/>
		</>
	);
}
