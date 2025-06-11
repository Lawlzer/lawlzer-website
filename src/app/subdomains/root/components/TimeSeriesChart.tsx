import type { TickFormatter } from '@visx/axis';
import { AxisBottom, AxisLeft } from '@visx/axis';
import { curveLinear, curveMonotoneX } from '@visx/curve';
import { GridColumns, GridRows } from '@visx/grid';
import { Group } from '@visx/group';
import { LegendItem, LegendLabel } from '@visx/legend';
import ParentSize from '@visx/responsive/lib/components/ParentSize';
import { scaleLinear } from '@visx/scale';
import { AreaClosed, Bar, LinePath } from '@visx/shape';
import type { NumberValue } from '@visx/vendor/d3-scale';
import { addDays, format as formatDateFns } from 'date-fns';
import React from 'react';

// Define types needed (consider moving to a shared types file)
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
	// Special case for "head" to indicate it's a count
	if (dataType.toLowerCase() === 'head') return `${formattedName} (Count)`;
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
		return <div className='text-muted-foreground flex h-full w-full items-center justify-center'>No data to display.</div>;
	}

	return (
		<ParentSize>
			{({ width, height }) => {
				if (width === 0 || height === 0) {
					return <div className='text-muted-foreground flex h-full w-full items-center justify-center'>Initializing chart...</div>;
				}

				const innerWidth = width - chartMargin.left - chartMargin.right;
				const innerHeight = height - chartMargin.top - chartMargin.bottom;

				if (innerWidth <= 0 || innerHeight <= 0) {
					return <div className='text-muted-foreground flex h-full w-full items-center justify-center'>Chart area too small.</div>;
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

				// Improve Y-axis scaling for small-range fields
				const range = maxY - minY;
				let yPadding: number;

				// For fields with small absolute ranges (like "head" with 50-500 range)
				if (activeChartTab.toLowerCase() === 'head' || range < 1000) {
					// Use percentage-based padding for better visualization
					yPadding = range * 0.15; // 15% padding for small ranges
					// Ensure minimum padding for very small ranges
					if (yPadding < 10) yPadding = 10;
				} else {
					// Standard 10% padding for large ranges
					yPadding = range * 0.1;
					if (yPadding === 0) yPadding = 1;
				}

				// Apply padding with special handling for negative values
				minY = minY < 0 ? minY - yPadding : Math.max(0, minY - yPadding);
				maxY += yPadding;

				// For small-range fields, ensure we have enough tick marks for readability
				const numYTicks = range < 1000 ? 8 : 5;

				const yScale = scaleLinear<number>({ domain: [minY, maxY], range: [innerHeight, 0], nice: true });

				// Prepare legend items
				const legendItems = formattedData.datasets.map((ds) => ({ label: ds.label, color: ds.color })).sort((a, b) => (a.label.includes('Current') ? -1 : b.label.includes('Current') ? 1 : parseInt(b.label) - parseInt(a.label)));
				const showRange = formattedData.hasPreviousYears;

				return (
					<>
						{/* Legend */}
						<div className={`absolute top-0 left-1/2 flex -translate-x-1/2 flex-wrap justify-center gap-x-4 gap-y-1 p-1 text-xs ${isMobile ? 'max-w-[calc(100%-40px)]' : ''}`}>
							{legendItems.map((item) => {
								const isHidden = hiddenDatasets.has(item.label);
								return (
									<LegendItem
										key={`legend-${item.label}`}
										className={`flex cursor-pointer items-center ${isHidden ? 'opacity-50' : ''}`}
										onClick={() => {
											handleLegendClick(item.label);
										}}
									>
										<svg className='mr-1' height={14} width={14}>
											<rect fill={item.color} height={14} width={14} />
											{isHidden ? <line stroke='black' strokeWidth='2' x1='0' x2='14' y1='7' y2='7' /> : null}
										</svg>
										<LegendLabel style={{ textDecoration: isHidden ? 'line-through' : 'none' }}>{item.label}</LegendLabel>
									</LegendItem>
								);
							})}
							{/* Range Legend Item */}
							{showRange
								? (() => {
										const isHidden = hiddenDatasets.has(formattedData.rangeLabel);
										return (
											<LegendItem
												key='legend-range'
												className={`flex cursor-pointer items-center ${isHidden ? 'opacity-50' : ''}`}
												onClick={() => {
													handleLegendClick(formattedData.rangeLabel);
												}}
											>
												<svg className='mr-1' height={14} width={14}>
													<rect fill={formattedData.rangeFillColor} height={14} stroke='rgba(0,0,0,0.2)' strokeWidth={1} width={14} />
													{isHidden ? <line stroke='black' strokeWidth='2' x1='0' x2='14' y1='7' y2='7' /> : null}
												</svg>
												<LegendLabel style={{ textDecoration: isHidden ? 'line-through' : 'none' }}>{formattedData.rangeLabel}</LegendLabel>
											</LegendItem>
										);
									})()
								: null}
						</div>

						<svg ref={containerRef} height={height} width={width}>
							<Group left={chartMargin.left} top={chartMargin.top}>
								{/* Grid */}
								<GridRows pointerEvents='none' scale={yScale} stroke='#e0e0e0' strokeOpacity={0.3} width={innerWidth} />
								<GridColumns height={innerHeight} pointerEvents='none' scale={xScale} stroke='#e0e0e0' strokeOpacity={0.3} />

								{/* Axes */}
								<AxisBottom
									label='Day of Year'
									numTicks={innerWidth > 520 ? 12 : 6}
									scale={xScale}
									stroke='#333'
									tickFormat={formatDayOfYearForAxis}
									tickStroke='#333'
									top={innerHeight}
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
								/>
								<AxisLeft
									label={getYAxisLabel(activeChartTab)}
									numTicks={numYTicks}
									scale={yScale}
									stroke='#333'
									tickStroke='#333'
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
									tickFormat={(value) => {
										// Format tick labels based on the data range
										const num = typeof value === 'number' ? value : value.valueOf();
										if (activeChartTab.toLowerCase() === 'head' || range < 1000) {
											// Show full numbers for small ranges
											return Math.round(num).toString();
										} else if (num >= 1000000) {
											return `${(num / 1000000).toFixed(1)}M`;
										} else if (num >= 1000) {
											return `${(num / 1000).toFixed(0)}K`;
										}
										return num.toFixed(0);
									}}
								/>

								{/* Data Lines and Area */}
								{showRange && !hiddenDatasets.has(formattedData.rangeLabel) ? <AreaClosed<RangePoint> key='area-range' curve={curveLinear} data={formattedData.minMaxData} fill={formattedData.rangeFillColor} opacity={0.7} x={(d) => xScale(getX(d)) ?? 0} y0={(d) => yScale(getMinY(d)) ?? 0} y1={(d) => yScale(getMaxY(d)) ?? 0} yScale={yScale} /> : null}

								{visibleYearlyDatasets.map((dataset) => (
									<LinePath<ChartPoint> key={`line-${dataset.label}`} curve={curveMonotoneX} data={dataset.data} shapeRendering='geometricPrecision' stroke={dataset.color} strokeOpacity={0.9} strokeWidth={dataset.isCurrentYear ? 2 : 1.5} x={(d) => xScale(getX(d)) ?? 0} y={(d) => yScale(getY(d)) ?? 0} />
								))}

								{/* Tooltip Trigger Area */}
								<Bar
									fill='transparent'
									height={innerHeight}
									rx={14}
									width={innerWidth}
									x={0}
									y={0}
									onMouseLeave={hideTooltip}
									onMouseMove={(e) => {
										handleTooltip(e, width, height, xScale, yScale);
									}}
									onTouchMove={(e) => {
										handleTooltip(e, width, height, xScale, yScale);
									}}
									onTouchStart={(e) => {
										handleTooltip(e, width, height, xScale, yScale);
									}}
								/>

								{/* Optional: Circle marker for hovered points */}
								{tooltipOpen && tooltipData?.points && tooltipData.points.length > 0 ? (
									<Group>
										{tooltipData.points.map((point: TooltipPointData) => (
											<circle key={`marker-${point.year}`} cx={xScale(point.x)} cy={yScale(point.y)} fill={formattedData.datasets.find((ds) => ds.label.startsWith(String(point.year)))?.color ?? 'black'} pointerEvents='none' r={4} stroke='white' strokeWidth={1} />
										))}
									</Group>
								) : null}
							</Group>
						</svg>

						{/* Tooltip */}
						{tooltipOpen && tooltipData ? (
							<TooltipInPortal left={tooltipLeft} style={tooltipStyles} top={tooltipTop}>
								<div style={{ marginBottom: '5px', fontWeight: 'bold' }}>{formatDayOfYearForAxis(tooltipData.day, 0, [])}</div>
								{tooltipData.range ? (
									<div>
										Range ({/\(([^)]+)\)/.exec(formattedData?.rangeLabel)?.[1] ?? ''}):{' '}
										<strong>
											{tooltipData.range.yMin.toFixed(2)} - {tooltipData.range.yMax.toFixed(2)}
										</strong>
									</div>
								) : null}
								{tooltipData.points.map((point: TooltipPointData) => (
									<div key={point.year}>
										{point.year}: {String(point.y)}
									</div>
								))}
							</TooltipInPortal>
						) : null}
					</>
				);
			}}
		</ParentSize>
	);
};
