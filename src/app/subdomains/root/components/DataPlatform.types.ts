// Types for Data Platform components

// API Response Types
export interface FiltersApiResponse {
	filters: Record<string, { value: string; count: number }[]>;
	totalDocuments: number;
	commonFields?: Record<string, any>;
}

export interface RawDataPoint {
	timestamp: number; // unixDate in milliseconds
	values: Record<string, number>; // { fieldName: value }
}

export interface ChartDataApiResponse {
	rawData: RawDataPoint[] | null;
	limitExceeded?: boolean;
	documentCount?: number;
	error?: string;
}

// Component Types
export type Filters = Record<string, string[]>;

export interface ChartPoint {
	x: number;
	y: number;
}
export interface RangePoint {
	x: number;
	yMin: number;
	yMax: number;
}
export type TooltipPointData = ChartPoint & { year: number };

export interface CombinedTooltipData {
	day: number;
	points: TooltipPointData[];
	range?: RangePoint | null;
}

export type MobileViewMode = 'chart' | 'filters';

export interface DataPlatformPreviewProps {
	onClose: () => void;
}
