import React from 'react';
import { Group } from '@visx/group';
import { AreaClosed, LinePath, Bar } from '@visx/shape';
import { scaleLinear } from '@visx/scale';
import type { TickFormatter } from '@visx/axis';
import { AxisLeft, AxisBottom } from '@visx/axis';
import { GridRows, GridColumns } from '@visx/grid';
import { curveLinear, curveMonotoneX } from '@visx/curve';
import { LegendItem, LegendLabel } from '@visx/legend';
import ParentSize from '@visx/responsive/lib/components/ParentSize';
import type { NumberValue } from '@visx/vendor/d3-scale';
import { format as formatDateFns, addDays } from 'date-fns';

// Define types needed (consider moving to a shared types file)
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

// Define constants outside component
const chartMargin = { top: 40, right: 30, bottom: 50, left: 60 };
const tooltipStyles = {
	backgroundColor: 'rgba(50,50,50,0.8)',
	color: 'white',
	padding: '0.5rem',
	borderRadius: '4px',
	fontSize: '12px',
	maxWidth: '300px',
	wordWrap: 'break-word',
};

// Helper functions (could be in utils)
const formatDayOfYearForAxis: TickFormatter<NumberValue> = (dayValue: NumberValue): string => {
	const day = typeof dayValue === 'number' ? dayValue : dayValue.valueOf();
	const referenceDate = new Date(2001, 0, 1);
	const dateToShow = addDays(referenceDate, day - 1);
	return formatDateFns(dateToShow, 'MMM d');
};
const getX = (d: ChartPoint | RangePoint): number => d.x;
const getY = (d: ChartPoint): number => d.y;
const getMinY = (d: RangePoint): number => d.yMin;
const getMaxY = (d: RangePoint): number => d.yMax;
const getYAxisLabel = (dataType: string): string => {
	const formattedName = dataType.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
	if (/price|cost|value|revenue|salary/i.test(dataType)) return `${formattedName} (USD)`;
	if (/count|number|quantity|total|frequency/i.test(dataType)) return formattedName;
	if (/percentage|ratio|rate|share/i.test(dataType)) return `${formattedName} (%)`;
	if (/size|weight|height|width|length|duration|age/i.test(dataType)) return formattedName;
	return formattedName;
};

interface TimeSeriesChartProps {
	formattedData: FormattedChartData;
	activeChartTab: string;
	hiddenDatasets: Set<string>;
	handleLegendClick: (label: string) => void;
	isMobile: boolean;
	// Tooltip Props
	tooltipData: CombinedTooltipData | undefined;
	tooltipLeft: number | undefined;
	tooltipTop: number | undefined;
	tooltipOpen: boolean;
	hideTooltip: () => void;
	handleTooltip: (event: React.MouseEvent<SVGRectElement> | React.TouchEvent<SVGRectElement>, chartWidth: number, chartHeight: number, xScale: any, yScale: any) => void;
	containerRef: (element: SVGSVGElement | null) => void;
	TooltipInPortal: React.FC<any>;
}

export const TimeSeriesChart: React.FC<TimeSeriesChartProps> = ({ formattedData, activeChartTab, hiddenDatasets, handleLegendClick, isMobile, tooltipData, tooltipLeft, tooltipTop, tooltipOpen, hideTooltip, handleTooltip, containerRef, TooltipInPortal }) => {
	if (!formattedData) {
		return <div className='w-full h-full flex items-center justify-center text-muted-foreground'>No data to display.</div>;
	}

	return (
		<ParentSize>
			{({ width, height }) => {
				if (width === 0 || height === 0) {
					return <div className='w-full h-full flex items-center justify-center text-muted-foreground'>Initializing chart...</div>;
				}

				const innerWidth = width - chartMargin.left - chartMargin.right;
				const innerHeight = height - chartMargin.top - chartMargin.bottom;

				if (innerWidth <= 0 || innerHeight <= 0) {
					return <div className='w-full h-full flex items-center justify-center text-muted-foreground'>Chart area too small.</div>;
				}

				// Define Scales (X)
				const xScale = scaleLinear<number>({ domain: [1, 366], range: [0, innerWidth] });

				// Define Scales (Y - dynamic based on visible data)
				let minY = Infinity,
					maxY = -Infinity;
				const visibleYearlyDatasets = formattedData.datasets.filter((ds) => !hiddenDatasets.has(ds.label));
				visibleYearlyDatasets.forEach((dataset) => {
					dataset.data.forEach((d) => {
						const yVal = getY(d);
						if (yVal < minY) minY = yVal;
						if (yVal > maxY) maxY = yVal;
					});
				});
				if (!hiddenDatasets.has(formattedData.rangeLabel) && formattedData.minMaxData.length > 0) {
					formattedData.minMaxData.forEach((d) => {
						if (getMinY(d) < minY) minY = getMinY(d);
						if (getMaxY(d) > maxY) maxY = getMaxY(d);
					});
				}
				if (minY === Infinity) {
					minY = 0;
					maxY = 1;
				}
				const yPadding = (maxY - minY) * 0.1 || 1;
				minY = minY < 0 ? minY - yPadding : Math.max(0, minY - yPadding);
				maxY = maxY + yPadding;
				const yScale = scaleLinear<number>({ domain: [minY, maxY], range: [innerHeight, 0], nice: true });

				// Prepare legend items
				const legendItems = formattedData.datasets.map((ds) => ({ label: ds.label, color: ds.color })).sort((a, b) => (a.label.includes('Current') ? -1 : b.label.includes('Current') ? 1 : parseInt(b.label) - parseInt(a.label)));
				const showRange = formattedData.hasPreviousYears;

				return (
					<>
						{/* Legend */}
						<div className={`absolute top-0 left-1/2 -translate-x-1/2 flex flex-wrap justify-center gap-x-4 gap-y-1 p-1 text-xs ${isMobile ? 'max-w-[calc(100%-40px)]' : ''}`}>
							{legendItems.map((item) => {
								const isHidden = hiddenDatasets.has(item.label);
								return (
									<LegendItem
										key={`legend-${item.label}`}
										className={`flex items-center cursor-pointer ${isHidden ? 'opacity-50' : ''}`}
										onClick={() => {
											handleLegendClick(item.label);
										}}
									>
										<svg width={14} height={14} className='mr-1'>
											<rect width={14} height={14} fill={item.color} />
											{isHidden && <line x1='0' y1='7' x2='14' y2='7' stroke='black' strokeWidth='2' />}
										</svg>
										<LegendLabel style={{ textDecoration: isHidden ? 'line-through' : 'none' }}>{item.label}</LegendLabel>
									</LegendItem>
								);
							})}
							{/* Range Legend Item */}
							{showRange &&
								(() => {
									const isHidden = hiddenDatasets.has(formattedData.rangeLabel);
									return (
										<LegendItem
											key={`legend-range`}
											className={`flex items-center cursor-pointer ${isHidden ? 'opacity-50' : ''}`}
											onClick={() => {
												handleLegendClick(formattedData.rangeLabel);
											}}
										>
											<svg width={14} height={14} className='mr-1'>
												<rect width={14} height={14} fill={formattedData.rangeFillColor} stroke='rgba(0,0,0,0.2)' strokeWidth={1} />
												{isHidden && <line x1='0' y1='7' x2='14' y2='7' stroke='black' strokeWidth='2' />}
											</svg>
											<LegendLabel style={{ textDecoration: isHidden ? 'line-through' : 'none' }}>{formattedData.rangeLabel}</LegendLabel>
										</LegendItem>
									);
								})()}
						</div>

						<svg ref={containerRef} width={width} height={height}>
							<Group left={chartMargin.left} top={chartMargin.top}>
								{/* Grid */}
								<GridRows scale={yScale} width={innerWidth} stroke='#e0e0e0' strokeOpacity={0.3} pointerEvents='none' />
								<GridColumns scale={xScale} height={innerHeight} stroke='#e0e0e0' strokeOpacity={0.3} pointerEvents='none' />

								{/* Axes */}
								<AxisBottom
									top={innerHeight}
									scale={xScale}
									numTicks={innerWidth > 520 ? 12 : 6}
									tickFormat={formatDayOfYearForAxis}
									label='Day of Year'
									labelProps={{
										fontSize: 14,
										fill: '#333',
										textAnchor: 'middle',
										dy: '2.5em',
									}}
									tickLabelProps={{
										// Use object directly, angle logic needs width
										fontSize: 11,
										textAnchor: 'middle',
										dy: '0.25em',
										angle: innerWidth < 400 ? 45 : 0,
									}}
									stroke='#333'
									tickStroke='#333'
								/>
								<AxisLeft
									scale={yScale}
									numTicks={5}
									label={getYAxisLabel(activeChartTab)}
									labelProps={{
										fontSize: 14,
										fill: '#333',
										textAnchor: 'middle',
										dy: '-3em',
										dx: '-3em',
										angle: -90,
									}}
									tickLabelProps={{
										fontSize: 11,
										textAnchor: 'end',
										dx: '-0.25em',
										dy: '0.25em',
									}}
									stroke='#333'
									tickStroke='#333'
								/>

								{/* Data Lines and Area */}
								{showRange && !hiddenDatasets.has(formattedData.rangeLabel) && <AreaClosed<RangePoint> key={`area-range`} data={formattedData.minMaxData} yScale={yScale} x={(d) => xScale(getX(d)) ?? 0} y0={(d) => yScale(getMinY(d)) ?? 0} y1={(d) => yScale(getMaxY(d)) ?? 0} fill={formattedData.rangeFillColor} curve={curveLinear} opacity={0.7} />}

								{visibleYearlyDatasets.map((dataset) => (
									<LinePath<ChartPoint> key={`line-${dataset.label}`} data={dataset.data} x={(d) => xScale(getX(d)) ?? 0} y={(d) => yScale(getY(d)) ?? 0} stroke={dataset.color} strokeWidth={dataset.isCurrentYear ? 2 : 1.5} strokeOpacity={0.9} curve={curveMonotoneX} shapeRendering='geometricPrecision' />
								))}

								{/* Tooltip Trigger Area */}
								<Bar
									x={0}
									y={0}
									width={innerWidth}
									height={innerHeight}
									fill='transparent'
									rx={14}
									onTouchStart={(e) => {
										handleTooltip(e, width, height, xScale, yScale);
									}}
									onTouchMove={(e) => {
										handleTooltip(e, width, height, xScale, yScale);
									}}
									onMouseMove={(e) => {
										handleTooltip(e, width, height, xScale, yScale);
									}}
									onMouseLeave={hideTooltip}
								/>

								{/* Optional: Circle marker for hovered points */}
								{tooltipOpen && tooltipData?.points && tooltipData.points.length > 0 && (
									<Group>
										{tooltipData.points.map((point: TooltipPointData) => (
											<circle key={`marker-${point.year}`} cx={xScale(point.x)} cy={yScale(point.y)} r={4} fill={formattedData.datasets.find((ds) => ds.label.startsWith(String(point.year)))?.color ?? 'black'} stroke='white' strokeWidth={1} pointerEvents='none' />
										))}
									</Group>
								)}
							</Group>
						</svg>

						{/* Tooltip */}
						{tooltipOpen && tooltipData && (
							<TooltipInPortal top={tooltipTop} left={tooltipLeft} style={tooltipStyles}>
								<div style={{ marginBottom: '5px', fontWeight: 'bold' }}>{formatDayOfYearForAxis(tooltipData.day, 0, [])}</div>
								{tooltipData.range && (
									<div>
										Range ({/\(([^)]+)\)/.exec(formattedData?.rangeLabel)?.[1] ?? ''}):{' '}
										<strong>
											{tooltipData.range.yMin.toFixed(2)} - {tooltipData.range.yMax.toFixed(2)}
										</strong>
									</div>
								)}
								{tooltipData.points.map((point: TooltipPointData) => (
									<div key={point.year}>
										{point.year}: {String(point.y)}
									</div>
								))}
							</TooltipInPortal>
						)}
					</>
				);
			}}
		</ParentSize>
	);
};
