import type { Prisma } from '@prisma/client';

import { COUNTRIES, DATA_PLATFORM_CONFIG, DATA_TYPE_CONFIGS, type NumericalRange, type Trend, US_STATES } from './config';

import { db } from '~/server/db';

// --- Helper Functions ---
const getRandomNumber = (min: number, max: number, decimals = 2): number => {
	const str = (Math.random() * (max - min) + min).toFixed(decimals);
	return parseFloat(str);
};

const delay = async (ms: number): Promise<void> =>
	new Promise((resolve) => {
		setTimeout(resolve, ms);
	});

const getMsPerFrequency = (_frequency: 'daily'): number => {
	const msInDay = 24 * 60 * 60 * 1000;
	return msInDay;
};

const getDayOfYearKey = (timestamp: number): string => {
	const date = new Date(timestamp);
	return `${date.getUTCMonth()}-${date.getUTCDate()}`;
};

const createDailyTimestampSequence = (count: number): number[] => {
	const timestamps: number[] = [];
	const msInDay = getMsPerFrequency('daily');
	let startingDate = Date.now() - (count - 1) * msInDay;

	for (let i = 0; i < count; i++) {
		timestamps.push(startingDate);
		startingDate += msInDay;
	}
	return timestamps;
};

const getValueWithTrend = (lastStepValue: number | undefined, lastYearValue: number | undefined, annualTrend: Trend, config: NumericalRange, stepVariation: number, yearlyTrendFactor: number, stepVsYoYWeight: number): number => {
	const { min, max, decimals = 2 } = config;
	const getInitialValue = (): number => getRandomNumber(min + (max - min) * 0.1, min + (max - min) * 0.3, decimals);

	if (lastStepValue === undefined) {
		return getInitialValue();
	}

	let targetYoYValue: number;
	if (lastYearValue !== undefined) {
		const baseTrendMultiplier = 1 + annualTrend * yearlyTrendFactor;
		const randomFactor = (Math.random() - 0.5) * yearlyTrendFactor * 0.5;
		targetYoYValue = lastYearValue * (baseTrendMultiplier + randomFactor);
	} else {
		targetYoYValue = lastStepValue;
	}
	targetYoYValue = Math.max(min, Math.min(max, targetYoYValue));

	const variation = lastStepValue * stepVariation * (Math.random() - 0.5) * 2;
	let nextValueFromStep = lastStepValue + variation;
	nextValueFromStep = Math.max(min, Math.min(max, nextValueFromStep));

	const effectiveStepVsYoYWeight = lastYearValue !== undefined ? stepVsYoYWeight : 1.0;
	let combinedValue = nextValueFromStep * effectiveStepVsYoYWeight + targetYoYValue * (1 - effectiveStepVsYoYWeight);

	const maxAllowed = lastStepValue * (1 + DATA_PLATFORM_CONFIG.MAX_STEP_CHANGE_PERCENTAGE);
	const minAllowed = lastStepValue * (1 - DATA_PLATFORM_CONFIG.MAX_STEP_CHANGE_PERCENTAGE);
	combinedValue = Math.max(minAllowed, Math.min(maxAllowed, combinedValue));

	combinedValue = Math.max(min, Math.min(max, combinedValue));
	const str = combinedValue.toFixed(decimals);
	return parseFloat(str);
};

// --- Data Generation Logic ---
function generateAllData(): Prisma.CommodityDataCreateInput[] {
	const allDataInput: Prisma.CommodityDataCreateInput[] = [];
	const lastValuesCache = new Map<string, Record<string, number>>();
	const previousYearValuesCache = new Map<string, number>();
	const annualTrendsCache = new Map<string, Trend>();

	const numDailyPoints = DATA_PLATFORM_CONFIG.GENERATE_YEARS_BACK * 365;
	const dailyTimestamps = createDailyTimestampSequence(numDailyPoints);

	for (const [type, config] of Object.entries(DATA_TYPE_CONFIGS)) {
		const timestamps = dailyTimestamps;

		for (const country of COUNTRIES) {
			const isUSA = country === 'USA';
			const statesToIterate = isUSA && config.includeState ? US_STATES : [undefined];

			for (const state of statesToIterate) {
				const processSeriesCombination = (categoricalCombination: Record<string, string> = {}): void => {
					const baseSeriesKey = `${type}-${country}-${state ?? 'N/A'}`;
					const combinationKeyPart = Object.entries(categoricalCombination)
						.map(([k, v]) => `${k}=${v}`)
						.sort()
						.join('&');
					const seriesKey = combinationKeyPart ? `${baseSeriesKey}-${combinationKeyPart}` : baseSeriesKey;

					if (!lastValuesCache.has(seriesKey)) {
						lastValuesCache.set(seriesKey, {});
					}

					for (const unixDate of timestamps) {
						const currentDate = new Date(unixDate);
						const currentYear = currentDate.getUTCFullYear();
						const dayOfYearKey = getDayOfYearKey(unixDate);
						const currentSeriesLastValues = lastValuesCache.get(seriesKey)!;

						const trendCacheKey = `${seriesKey}-${currentYear}`;
						let annualTrend: Trend;
						if (annualTrendsCache.has(trendCacheKey)) {
							annualTrend = annualTrendsCache.get(trendCacheKey)!;
						} else {
							const rand = Math.random();
							const { TREND_UP_PROBABILITY, TREND_DOWN_PROBABILITY } = DATA_PLATFORM_CONFIG;
							annualTrend = rand < TREND_UP_PROBABILITY ? 1 : rand < TREND_UP_PROBABILITY + TREND_DOWN_PROBABILITY ? -1 : 0;
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

						for (const key in config.numericalFields) {
							const fieldConfig = config.numericalFields[key];
							const fieldName = fieldConfig.schemaFieldName as string;
							const lastStepValue = currentSeriesLastValues[fieldName];
							const prevYearCacheKey = `${seriesKey}-${dayOfYearKey}-${fieldName}`;
							const lastYearValue = previousYearValuesCache.get(prevYearCacheKey);

							let newValue: number;
							if (fieldName === 'price' || fieldName === 'exports' || fieldName === 'head') {
								newValue = getValueWithTrend(lastStepValue, lastYearValue, annualTrend, fieldConfig, DATA_PLATFORM_CONFIG.STEP_VARIATION_PERCENTAGE, DATA_PLATFORM_CONFIG.YEARLY_TREND_FACTOR, DATA_PLATFORM_CONFIG.STEP_VS_YOY_WEIGHT);
							} else {
								newValue = getRandomNumber(fieldConfig.min, fieldConfig.max, fieldConfig.decimals);
							}

							(dataInput as any)[fieldName] = newValue;
							currentSeriesLastValues[fieldName] = newValue;
							const currentYearCacheKey = `${seriesKey}-${dayOfYearKey}-${fieldName}`;
							previousYearValuesCache.set(currentYearCacheKey, newValue);
						}
						lastValuesCache.set(seriesKey, currentSeriesLastValues);
						allDataInput.push(dataInput);
					}
				};

				if (config.categoricalFields && Object.keys(config.categoricalFields).length > 0) {
					const categoricalKeys = Object.keys(config.categoricalFields);
					const generateCombinationsAndProcess = (keyIndex: number, currentCombination: Record<string, string>): void => {
						if (keyIndex === categoricalKeys.length) {
							processSeriesCombination(currentCombination);
							return;
						}
						const configKey = categoricalKeys[keyIndex];
						const catConfig = config.categoricalFields![configKey];
						const fieldName = catConfig.schemaFieldName;
						for (const value of catConfig.values) {
							const nextCombination = { ...currentCombination, [fieldName]: value };
							generateCombinationsAndProcess(keyIndex + 1, nextCombination);
						}
					};
					generateCombinationsAndProcess(0, {});
				} else {
					processSeriesCombination();
				}
			}
		}
	}

	return allDataInput;
}

// --- Database Operations ---
async function batchCreateData(dataItems: Prisma.CommodityDataCreateInput[]): Promise<number> {
	let createdCount = 0;
	const { BATCH_SIZE } = DATA_PLATFORM_CONFIG;

	for (let i = 0; i < dataItems.length; i += BATCH_SIZE) {
		const batch = dataItems.slice(i, i + BATCH_SIZE);
		const batchNumber = Math.floor(i / BATCH_SIZE) + 1;
		try {
			const result = await db.commodityData.createMany({
				data: batch,
			});
			createdCount += result.count;
		} catch (error) {
			console.error(`[DataPlatform] Error creating batch ${batchNumber}:`, error);
		}
	}
	return createdCount;
}

// --- Main Seed Function ---
export async function seedDataPlatform(options?: { force?: boolean }): Promise<void> {
	try {
		// Check if data already exists (unless force is true)
		if (!options?.force) {
			const existingCount = await db.commodityData.count();
			if (existingCount > 0) {
				console.info(`[DataPlatform] Database already contains ${existingCount} items. Skipping seed.`);
				return;
			}
		}

		console.info('[DataPlatform] Starting data platform seed...');
		const dataToCreate = generateAllData();

		if (dataToCreate.length === 0) {
			console.info('[DataPlatform] No data generated. Check configurations.');
			return;
		}

		await batchCreateData(dataToCreate);
		const finalCount = await db.commodityData.count();
		console.info(`[DataPlatform] Seed complete. Database now contains ${finalCount} items.`);
	} catch (error) {
		console.error('[DataPlatform] Seed failed:', error);
		throw error;
	}
}

// --- Reset Function (for debugging) ---
export async function resetDataPlatform(): Promise<void> {
	console.info('[DataPlatform] Resetting database: deleting existing CommodityData...');

	// Add retry logic for transaction conflicts
	const maxRetries = 3;
	let lastError: unknown;

	for (let attempt = 1; attempt <= maxRetries; attempt++) {
		try {
			// First, get the count for logging
			const initialCount = await db.commodityData.count();
			console.info(`[DataPlatform] Found ${initialCount} records to delete...`);

			if (initialCount === 0) {
				console.info('[DataPlatform] No records to delete.');
				return;
			}

			// Delete in batches to avoid timeouts on large datasets
			const BATCH_SIZE = 10000;
			let deletedTotal = 0;

			while (true) {
				// Find a batch of IDs to delete
				const batch = await db.commodityData.findMany({
					take: BATCH_SIZE,
					select: { id: true },
				});

				if (batch.length === 0) {
					break; // No more records
				}

				// Delete this batch
				const batchIds = batch.map((item) => item.id);
				const deleteResult = await db.commodityData.deleteMany({
					where: {
						id: { in: batchIds },
					},
				});

				deletedTotal += deleteResult.count;
				console.info(`[DataPlatform] Deleted ${deletedTotal}/${initialCount} records...`);

				// Small delay to reduce database pressure
				if (batch.length === BATCH_SIZE) {
					await delay(100);
				}
			}

			console.info(`[DataPlatform] Successfully deleted ${deletedTotal} records.`);
			return; // Success, exit function
		} catch (error) {
			lastError = error;
			console.warn(`[DataPlatform] Attempt ${attempt}/${maxRetries} failed:`, error);

			if (attempt < maxRetries) {
				// Wait before retrying (exponential backoff)
				const waitTime = attempt * 2000; // 2s, 4s, 6s
				console.info(`[DataPlatform] Waiting ${waitTime}ms before retry...`);
				await delay(waitTime);
			}
		}
	}

	// All retries failed
	console.error('[DataPlatform] Failed to reset database after all retries');
	throw lastError;
}
