import type { Prisma } from '@prisma/client';
import { PrismaClient } from '@prisma/client';

const RESET_DATABASE = true; // Set to true to delete all existing documents before generating
const BATCH_SIZE = 500; // Reduced batch size for createMany with potentially larger documents
const GENERATE_YEARS_BACK = 5; // Number of years back to generate data for all frequencies
const STEP_VARIATION_PERCENTAGE = 0.01; // Max percentage change (+/-) step-to-step base variation (Reduced to 1%)
const YEARLY_TREND_FACTOR = 0.08; // Max percentage change (+/-) year-over-year based on trend
const STEP_VS_YOY_WEIGHT = 0.6; // Weight for step value (0.6) vs YoY target (0.4) in final calc
const MAX_STEP_CHANGE_PERCENTAGE = 0.02; // Absolute max percentage change allowed from one step to the next (Reduced to 2%)

const prisma = new PrismaClient();

// --- Helper Functions ---

type Trend = -1 | 0 | 1; // 1: upward, -1: downward, 0: neutral

const getRandomNumber = (min: number, max: number, decimals = 2): number => {
	const str = (Math.random() * (max - min) + min).toFixed(decimals);
	return parseFloat(str);
};

// Moved definition up to fix linter error
const getMsPerFrequency = (_frequency: 'daily'): number => {
	const msInDay = 24 * 60 * 60 * 1000;
	// Only daily frequency is needed now
	return msInDay;
};

// Generates the next value considering step variation, YoY trend, and previous year's value
const getValueWithTrend = (lastStepValue: number | undefined, lastYearValue: number | undefined, annualTrend: Trend, config: NumericalRange, stepVariation: number, yearlyTrendFactor: number, stepVsYoYWeight: number): number => {
	const { min, max, decimals = 2 } = config;

	// 1. Calculate initial value if starting (closer to min now)
	const getInitialValue = (): number => getRandomNumber(min + (max - min) * 0.1, min + (max - min) * 0.3, decimals);

	// Handle the very first step explicitly
	if (lastStepValue === undefined) {
		return getInitialValue();
	}

	// 2. Determine Target Value based on Last Year and Annual Trend
	let targetYoYValue: number;
	if (lastYearValue !== undefined) {
		// Apply trend factor with some randomness (+/- 20% of the factor itself)
		// Ensure base factor is slightly above or below 1 based on trend
		const baseTrendMultiplier = 1 + annualTrend * yearlyTrendFactor;
		// Add some randomness around the trend
		const randomFactor = (Math.random() - 0.5) * yearlyTrendFactor * 0.5; // Smaller random variation
		targetYoYValue = lastYearValue * (baseTrendMultiplier + randomFactor);
	} else {
		// First year, no historical data. Set target equal to the last step to avoid interference.
		// This target will be effectively ignored due to dynamic weighting below.
		targetYoYValue = lastStepValue; // Or getInitialValue(), but lastStepValue makes more sense here
	}
	// Ensure YoY target is within bounds before weighting
	targetYoYValue = Math.max(min, Math.min(max, targetYoYValue));

	// 3. Determine Next Value based on Last Step (lastStepValue is guaranteed to exist here)
	const variation = lastStepValue * stepVariation * (Math.random() - 0.5) * 2; // +/- variation
	let nextValueFromStep = lastStepValue + variation;
	// Ensure step value is within bounds before weighting
	nextValueFromStep = Math.max(min, Math.min(max, nextValueFromStep));

	// 4. Dynamic Weighting: Ignore YoY component in the first year
	const effectiveStepVsYoYWeight = lastYearValue !== undefined ? stepVsYoYWeight : 1.0;

	// 5. Combine Step Value and YoY Target using dynamically adjusted weight
	let combinedValue = nextValueFromStep * effectiveStepVsYoYWeight + targetYoYValue * (1 - effectiveStepVsYoYWeight);

	// 6. Clamp based on MAX_STEP_CHANGE_PERCENTAGE from the last step (lastStepValue exists)
	const maxAllowed = lastStepValue * (1 + MAX_STEP_CHANGE_PERCENTAGE);
	const minAllowed = lastStepValue * (1 - MAX_STEP_CHANGE_PERCENTAGE);
	combinedValue = Math.max(minAllowed, Math.min(maxAllowed, combinedValue));

	// 7. Final Clamping to absolute Min/Max and Formatting
	combinedValue = Math.max(min, Math.min(max, combinedValue));
	const str = combinedValue.toFixed(decimals);
	return parseFloat(str);
};

// Keep getRandomVariation if needed for future similar data generation logic, but it's unused now.
// const getRandomVariation = (value: number, percentage = 0.1): number => {
// 	const variation = value * percentage * (Math.random() - 0.5) * 2; // +/- up to percentage
// 	return Math.max(0, value + variation); // Ensure non-negative
// };

const COUNTRIES = ['USA', 'Canada', 'Mexico', 'Brazil', 'Argentina', 'Australia', 'China', 'India', 'Russia', 'Germany'];
const US_STATES = ['Texas', 'California', 'Iowa', 'Nebraska', 'Kansas', 'Oklahoma', 'Minnesota', 'Illinois', 'Wisconsin', 'North Dakota'];
// Keep constants for potential values, used in dataTypeConfigs now
const CATTLE_TYPES = ['Heifers', 'Mixed', 'Steers'];
const CATTLE_CHOICE_GRADES = ['0-35%', '35-65%', '65-80%', '80-100%'];

// Generates timestamps FORWARD in time (oldest first) for daily frequency
const createDailyTimestampSequence = (count: number): number[] => {
	const timestamps: number[] = [];
	const msInDay = getMsPerFrequency('daily');
	let startingDate = Date.now() - (count - 1) * msInDay; // Start in the past

	for (let i = 0; i < count; i++) {
		timestamps.push(startingDate);
		startingDate += msInDay;
	}
	return timestamps; // Oldest first
};

// getMsPerFrequency moved above createTimestampSequence

// Helper to get a consistent day-of-year key (e.g., 'M-D')
const getDayOfYearKey = (timestamp: number): string => {
	const date = new Date(timestamp);
	// Using UTC to avoid timezone shifts affecting the 'day'
	return `${date.getUTCMonth()}-${date.getUTCDate()}`;
};

// --- Type Definitions and Configuration ---

interface NumericalRange {
	min: number;
	max: number;
	decimals?: number;
	schemaFieldName: keyof Prisma.CommodityDataCreateInput; // Map config key to schema field
}

interface CategoricalValues {
	values: string[];
	schemaFieldName: keyof Prisma.CommodityDataCreateInput; // Map config key to schema field
}

interface DataTypeConfig {
	category: 'Crop' | 'Livestock' | 'Produce';
	frequency: 'daily'; // All frequencies are now daily
	numericalFields: Record<string, NumericalRange>;
	categoricalFields?: Record<string, CategoricalValues>;
	includeState?: boolean;
}

// Updated Config to map directly to schema fields
const dataTypeConfigs: Record<string, DataTypeConfig> = {
	Cattle: {
		category: 'Livestock',
		frequency: 'daily',
		numericalFields: {
			Exports: { min: 50000, max: 200000, decimals: 0, schemaFieldName: 'exports' },
			Price: { min: 1.5, max: 2.5, decimals: 4, schemaFieldName: 'price' }, // Use Price consistently
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
		includeState: true, // Hogs can have state data if in USA
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
		includeState: true, // Barley can have state data if in USA
	},
	// Add other types here
};

// --- Data Generation Logic ---

// Generates all data points based on configurations and timestamps
function generateAllData(): Prisma.CommodityDataCreateInput[] {
	const allDataInput: Prisma.CommodityDataCreateInput[] = [];

	// Cache for the immediately preceding value in a series
	const lastValuesCache = new Map<string, Record<string, number>>();
	// Cache for the value from the same day in the previous year
	const previousYearValuesCache = new Map<string, number>(); // Key: seriesKey-dayOfYear-fieldName
	// Cache for the randomly assigned annual trend for a series
	const annualTrendsCache = new Map<string, Trend>(); // Key: seriesKey-year

	// Calculate number of points based on GENERATE_YEARS_BACK
	const numDailyPoints = GENERATE_YEARS_BACK * 365; // All data is daily now

	const dailyTimestamps = createDailyTimestampSequence(numDailyPoints);

	// Iterate through each data type configuration
	for (const [type, config] of Object.entries(dataTypeConfigs)) {
		const timestamps = dailyTimestamps;

		// Iterate through countries
		for (const country of COUNTRIES) {
			const isUSA = country === 'USA';
			const statesToIterate = isUSA && config.includeState ? US_STATES : [undefined];

			// Iterate through states (or the single undefined value)
			for (const state of statesToIterate) {
				// Function to process a specific series combination (handles categorical variations)
				const processSeriesCombination = (categoricalCombination: Record<string, string> = {}): void => {
					// Construct a unique base key for this series (type, country, state, categories)
					const baseSeriesKey = `${type}-${country}-${state ?? 'N/A'}`;
					const combinationKeyPart = Object.entries(categoricalCombination)
						.map(([k, v]) => `${k}=${v}`)
						.sort()
						.join('&');
					const seriesKey = combinationKeyPart ? `${baseSeriesKey}-${combinationKeyPart}` : baseSeriesKey;

					// Ensure entry exists in lastValuesCache for this series
					if (!lastValuesCache.has(seriesKey)) {
						lastValuesCache.set(seriesKey, {});
					}

					// Iterate through timestamps FORWARD (oldest first)
					for (const unixDate of timestamps) {
						const currentDate = new Date(unixDate);
						const currentYear = currentDate.getUTCFullYear();
						const dayOfYearKey = getDayOfYearKey(unixDate);
						const currentSeriesLastValues = lastValuesCache.get(seriesKey)!;

						// Determine Annual Trend (fetch or assign randomly once per year/series)
						const trendCacheKey = `${seriesKey}-${currentYear}`;
						let annualTrend: Trend;
						if (annualTrendsCache.has(trendCacheKey)) {
							annualTrend = annualTrendsCache.get(trendCacheKey)!;
						} else {
							const rand = Math.random();
							annualTrend = rand < 0.4 ? 1 : rand < 0.8 ? -1 : 0; // 40% up, 40% down, 20% neutral
							annualTrendsCache.set(trendCacheKey, annualTrend);
						}

						const dataInput: Prisma.CommodityDataCreateInput = {
							unixDate,
							type,
							category: config.category,
							country,
							...(state !== undefined && { state }),
							...categoricalCombination,
						};

						// Generate numerical fields
						for (const key in config.numericalFields) {
							const fieldConfig = config.numericalFields[key];
							const fieldName = fieldConfig.schemaFieldName as string;
							const lastStepValue = currentSeriesLastValues[fieldName];

							// Fetch value from the same day last year
							const prevYearCacheKey = `${seriesKey}-${dayOfYearKey}-${fieldName}`;
							const lastYearValue = previousYearValuesCache.get(prevYearCacheKey);

							let newValue: number;

							// Apply combined step/YoY logic only to 'price' and 'exports'
							if (fieldName === 'price' || fieldName === 'exports') {
								newValue = getValueWithTrend(lastStepValue, lastYearValue, annualTrend, fieldConfig, STEP_VARIATION_PERCENTAGE, YEARLY_TREND_FACTOR, STEP_VS_YOY_WEIGHT);
							} else {
								// Use original random generation for others
								newValue = getRandomNumber(fieldConfig.min, fieldConfig.max, fieldConfig.decimals);
							}

							(dataInput as any)[fieldName] = newValue;
							// Update cache for the next step
							currentSeriesLastValues[fieldName] = newValue;
							// Update cache for the next year's calculation
							const currentYearCacheKey = `${seriesKey}-${dayOfYearKey}-${fieldName}`;
							previousYearValuesCache.set(currentYearCacheKey, newValue);
						}
						// Update the last values cache for the series
						lastValuesCache.set(seriesKey, currentSeriesLastValues);
						allDataInput.push(dataInput);
					}
				};

				// Check if there are categorical dimensions to iterate through
				if (config.categoricalFields && Object.keys(config.categoricalFields).length > 0) {
					const categoricalKeys = Object.keys(config.categoricalFields);

					// Recursive function to generate all combinations and then process the series for each
					const generateCombinationsAndProcess = (keyIndex: number, currentCombination: Record<string, string>): void => {
						if (keyIndex === categoricalKeys.length) {
							// Base case: Combination complete, process this series
							processSeriesCombination(currentCombination);
							return;
						}

						// Recursive step: Iterate through values for the current categorical key
						const configKey = categoricalKeys[keyIndex];
						const catConfig = config.categoricalFields![configKey];
						const fieldName = catConfig.schemaFieldName;

						for (const value of catConfig.values) {
							const nextCombination = { ...currentCombination, [fieldName]: value };
							generateCombinationsAndProcess(keyIndex + 1, nextCombination);
						}
					};

					generateCombinationsAndProcess(0, {}); // Start the recursive generation
				} else {
					// No categorical fields, process the base series (without combinations)
					processSeriesCombination();
				}
			}
		}
	}

	console.info(`Generated ${allDataInput.length} data creation inputs.`);
	return allDataInput;
}

// --- Database Operations ---

async function resetDatabase(): Promise<void> {
	console.info('Resetting database: deleting existing CommodityData...');
	// Target the new model name
	await prisma.commodityData.deleteMany({});
	console.info('Existing data deleted.');
}

async function batchCreateData(dataItems: Prisma.CommodityDataCreateInput[]): Promise<number> {
	let createdCount = 0;
	// console.log(`Starting batch creation for ${dataItems.length} data items...`);

	for (let i = 0; i < dataItems.length; i += BATCH_SIZE) {
		const batch = dataItems.slice(i, i + BATCH_SIZE);
		const batchNumber = Math.floor(i / BATCH_SIZE) + 1;
		// const totalBatches = Math.ceil(dataItems.length / BATCH_SIZE);
		// console.log(`Creating batch ${batchNumber}/${totalBatches} (size: ${batch.length})...`);
		try {
			const result = await prisma.commodityData.createMany({
				data: batch,
			});
			createdCount += result.count;
			// console.log(`Batch ${batchNumber}: Created ${result.count} items.`);
		} catch (error) {
			console.error(`Error creating batch ${batchNumber} (starting index ${i}):`, error);
			// Consider adding more robust error handling or retry logic
			// For now, we log and continue
		}
	}
	console.info(`Attempted to create ${dataItems.length}, successfully created ${createdCount} items.`);
	return createdCount;
}

// --- Main Execution ---

async function main(): Promise<void> {
	console.info('Starting database population script...');

	if (RESET_DATABASE) {
		await resetDatabase();
	}

	const dataToCreate = generateAllData();

	if (dataToCreate.length === 0) {
		console.info('No data generated. Check configurations and timestamp logic.');
		return;
	}

	const createdCount = await batchCreateData(dataToCreate);

	console.info(`Attempted to create ${dataToCreate.length}, successfully created ${createdCount} items.`);
	const finalCount = await prisma.commodityData.count();
	console.info(`Database now contains ${finalCount} items in CommodityData collection.`);
}

main()
	.catch((e: unknown) => {
		console.error('Script failed unexpectedly:');
		if (e instanceof Error) {
			console.error(e.message);
			console.error(e.stack); // Log stack trace for better debugging
		} else {
			console.error(e);
		}
		void prisma.$disconnect();
		process.exit(1);
	})
	.finally(() => {
		console.info('Disconnecting Prisma client...');
		void prisma.$disconnect().catch((err) => {
			console.error('Error disconnecting Prisma in finally:', err);
		});
		console.info('Script finished execution.');
	});
