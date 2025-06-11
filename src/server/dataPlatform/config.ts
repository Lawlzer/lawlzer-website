import type { Prisma } from '@prisma/client';

// --- Configuration Constants ---
export const DATA_PLATFORM_CONFIG = {
	// Batch processing
	BATCH_SIZE: 5000, // Increased for faster insertion

	// Data generation parameters
	GENERATE_YEARS_BACK: 5,
	STEP_VARIATION_PERCENTAGE: 0.01, // Max percentage change (+/-) step-to-step
	YEARLY_TREND_FACTOR: 0.08, // Max percentage change (+/-) year-over-year
	STEP_VS_YOY_WEIGHT: 0.6, // Weight for step value vs YoY target
	MAX_STEP_CHANGE_PERCENTAGE: 0.02, // Absolute max percentage change allowed

	// Trend distribution
	TREND_UP_PROBABILITY: 0.4,
	TREND_DOWN_PROBABILITY: 0.4,
	TREND_NEUTRAL_PROBABILITY: 0.2,
} as const;

// --- Type Definitions ---
export type Trend = -1 | 0 | 1; // -1: downward, 0: neutral, 1: upward

export interface NumericalRange {
	min: number;
	max: number;
	decimals?: number;
	schemaFieldName: keyof Prisma.CommodityDataCreateInput;
}

export interface CategoricalValues {
	values: string[];
	schemaFieldName: keyof Prisma.CommodityDataCreateInput;
}

export interface DataTypeConfig {
	category: 'Crop' | 'Livestock' | 'Produce';
	frequency: 'daily';
	numericalFields: Record<string, NumericalRange>;
	categoricalFields?: Record<string, CategoricalValues>;
	includeState?: boolean;
}

// --- Master Data ---
export const COUNTRIES = ['USA', 'Canada', 'Mexico', 'Brazil', 'Argentina', 'Australia', 'China', 'India', 'Russia', 'Germany'];
export const US_STATES = ['Texas', 'California', 'Iowa', 'Nebraska', 'Kansas', 'Oklahoma', 'Minnesota', 'Illinois', 'Wisconsin', 'North Dakota'];
export const CATTLE_TYPES = ['Heifers', 'Mixed', 'Steers'];
export const CATTLE_CHOICE_GRADES = ['0-35%', '35-65%', '65-80%', '80-100%'];

// --- Data Type Configurations ---
export const DATA_TYPE_CONFIGS: Record<string, DataTypeConfig> = {
	Cattle: {
		category: 'Livestock',
		frequency: 'daily',
		numericalFields: {
			Exports: { min: 50000, max: 200000, decimals: 0, schemaFieldName: 'exports' },
			Price: { min: 1.5, max: 2.5, decimals: 4, schemaFieldName: 'price' },
			Head: { min: 50, max: 500, decimals: 0, schemaFieldName: 'head' },
		},
		categoricalFields: {
			'Cattle Type': { values: CATTLE_TYPES, schemaFieldName: 'cattleType' },
			'Choice Grade': { values: CATTLE_CHOICE_GRADES, schemaFieldName: 'choiceGrade' },
		},
		includeState: true,
	},
	Hogs: {
		category: 'Livestock',
		frequency: 'daily',
		numericalFields: {
			Exports: { min: 100000, max: 300000, decimals: 0, schemaFieldName: 'exports' },
			Price: { min: 0.8, max: 1.5, decimals: 4, schemaFieldName: 'price' },
		},
		includeState: true,
	},
	Eggs: {
		category: 'Produce',
		frequency: 'daily',
		numericalFields: {
			Exports: { min: 500000, max: 2000000, decimals: 0, schemaFieldName: 'exports' },
			Price: { min: 1.0, max: 3.0, decimals: 4, schemaFieldName: 'price' },
		},
		includeState: true,
	},
	Sheep: {
		category: 'Livestock',
		frequency: 'daily',
		numericalFields: {
			Exports: { min: 10000, max: 50000, decimals: 0, schemaFieldName: 'exports' },
			Price: { min: 2.0, max: 4.0, decimals: 4, schemaFieldName: 'price' },
		},
		includeState: true,
	},
	Barley: {
		category: 'Crop',
		frequency: 'daily',
		numericalFields: {
			Exports: { min: 1000000, max: 10000000, decimals: 0, schemaFieldName: 'exports' },
			'Total Volume': { min: 5000000, max: 20000000, decimals: 0, schemaFieldName: 'totalVolume' },
			Price: { min: 0.15, max: 0.35, decimals: 4, schemaFieldName: 'price' },
		},
		includeState: true,
	},
};
