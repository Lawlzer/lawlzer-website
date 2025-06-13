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
// Increased margins to ensure axis labels are always visible
const chartMargin = { top: 40, right: 30, bottom: 70, left: 80 };
const tooltipStyles = {
	backgroundColor: 'var(--popover)',
	color: 'var(--popover-foreground)',
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
				let forceStartAtZero = false;

				// Determine appropriate padding based on data type and range
				if (range === 0) {
					// If all values are the same, add small padding
					const minPadding = Math.abs(minY) * 0.1;
					yPadding = minPadding === 0 ? 1 : minPadding;
				} else if (range < 0.1) {
					// For very small decimal ranges (like prices 1.00-1.02)
					yPadding = range * 0.5; // 50% padding for tiny ranges
				} else if (range < 1) {
					// For small decimal ranges
					yPadding = range * 0.3; // 30% padding
				} else if (range < 10) {
					// For medium ranges
					yPadding = range * 0.2; // 20% padding
				} else if (range < 1000) {
					// For larger ranges
					yPadding = range * 0.15; // 15% padding
				} else {
					// For very large ranges
					yPadding = range * 0.1; // 10% padding
				}

				// Determine if we should start at zero based on data type and values
				// Only force zero for counts/quantities when values are reasonably close to zero
				if (/count|number|quantity|total|frequency|head/i.test(activeChartTab)) {
					// Only start at zero if the minimum is less than 20% of the maximum
					forceStartAtZero = minY >= 0 && minY < maxY * 0.2;
				}

				// Apply padding
				if (forceStartAtZero) {
					minY = 0;
					maxY += yPadding;
				} else {
					// Don't force to zero - let the chart focus on the data range
					minY -= yPadding;
					maxY += yPadding;
				}

				// For small-range fields, ensure we have enough tick marks for readability
				let numYTicks: number;
				if (range < 0.1) {
					numYTicks = 10; // More ticks for very small ranges
				} else if (range < 1) {
					numYTicks = 8;
				} else if (range < 10) {
					numYTicks = 6;
				} else {
					numYTicks = 5;
				}

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
													<rect fill={formattedData.rangeFillColor} height={14} stroke='var(--border)' strokeWidth={1} width={14} />
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
								<GridRows pointerEvents='none' scale={yScale} stroke='currentColor' strokeOpacity={0.1} width={innerWidth} className='text-border' />
								<GridColumns height={innerHeight} pointerEvents='none' scale={xScale} stroke='currentColor' strokeOpacity={0.1} className='text-border' />

								{/* Axes */}
								<AxisBottom
									label='Day of Year'
									numTicks={innerWidth > 520 ? 12 : 6}
									scale={xScale}
									stroke='currentColor'
									tickFormat={formatDayOfYearForAxis}
									tickStroke='currentColor'
									top={innerHeight}
									labelProps={{
										fontSize: 14,
										fill: 'currentColor',
										textAnchor: 'middle',
										dy: '2.5em',
										className: 'text-foreground',
									}}
									tickLabelProps={{
										// Use object directly, angle logic needs width
										fontSize: 11,
										textAnchor: 'middle',
										dy: '0.25em',
										angle: innerWidth < 400 ? 45 : 0,
										fill: 'currentColor',
										className: 'text-muted-foreground',
									}}
								/>
								<AxisLeft
									label={getYAxisLabel(activeChartTab)}
									numTicks={numYTicks}
									scale={yScale}
									stroke='currentColor'
									tickStroke='currentColor'
									labelProps={{
										fontSize: 14,
										fill: 'currentColor',
										textAnchor: 'middle',
										dy: '-3em',
										dx: '-3em',
										angle: -90,
										className: 'text-foreground',
									}}
									tickLabelProps={{
										fontSize: 11,
										textAnchor: 'end',
										dx: '-0.25em',
										dy: '0.25em',
										fill: 'currentColor',
										className: 'text-muted-foreground',
									}}
									tickFormat={(value) => {
										// Format tick labels based on the data range
										const num = typeof value === 'number' ? value : value.valueOf();

										// For very small ranges, show appropriate decimal places
										if (range < 0.01) {
											return num.toFixed(4); // 4 decimal places for very tiny ranges
										} else if (range < 0.1) {
											return num.toFixed(3); // 3 decimal places for small ranges
										} else if (range < 1) {
											return num.toFixed(2); // 2 decimal places for sub-1 ranges
										} else if (range < 10) {
											return num.toFixed(1); // 1 decimal place for small ranges
										} else if (num >= 1000000) {
											return `${(num / 1000000).toFixed(1)}M`;
										} else if (num >= 1000) {
											return `${(num / 1000).toFixed(0)}K`;
										} else {
											return Math.round(num).toString();
										}
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
								{(() => {
									// Helper function to format values based on range
									const formatValue = (value: number): string => {
										if (range < 0.01) return value.toFixed(4);
										if (range < 0.1) return value.toFixed(3);
										if (range < 1) return value.toFixed(2);
										if (range < 10) return value.toFixed(1);
										return Math.round(value).toString();
									};

									return (
										<>
											<div style={{ marginBottom: '5px', fontWeight: 'bold' }}>{formatDayOfYearForAxis(tooltipData.day, 0, [])}</div>
											{tooltipData.range ? (
												<div>
													Range ({/\(([^)]+)\)/.exec(formattedData?.rangeLabel)?.[1] ?? ''}):{' '}
													<strong>
														{formatValue(tooltipData.range.yMin)} - {formatValue(tooltipData.range.yMax)}
													</strong>
												</div>
											) : null}
											{tooltipData.points.map((point: TooltipPointData) => (
												<div key={point.year}>
													{point.year}: {formatValue(point.y)}
												</div>
											))}
										</>
									);
								})()}
							</TooltipInPortal>
						) : null}
					</>
				);
			}}
		</ParentSize>
	);
};
