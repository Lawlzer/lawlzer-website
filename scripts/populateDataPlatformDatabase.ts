import { PrismaClient } from '@prisma/client';
import type { Prisma } from '@prisma/client';

// --- Constants ---
// const TOTAL_TO_GENERATE = 500; // Replaced by systematic generation
const RESET_DATABASE = true; // Set to true to delete all existing documents before generating
const BATCH_SIZE = 100; // Adjusted batch size for potentially more documents
const NUM_DAILY_TIMESTAMPS = 10; // Number of daily data points back in time
const NUM_QUARTERLY_TIMESTAMPS = 5; // Number of quarterly data points back in time
const NUM_YEARLY_TIMESTAMPS = 2; // Number of yearly data points back in time

const prisma = new PrismaClient();

const getRandomElement = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

const getRandomNumber = (min: number, max: number, decimals = 2): number => {
	const str = (Math.random() * (max - min) + min).toFixed(decimals);
	return parseFloat(str);
};

const getRandomVariation = (value: number, percentage = 0.1): number => {
	const variation = value * percentage * (Math.random() - 0.5) * 2; // +/- up to percentage
	return Math.max(0, value + variation); // Ensure non-negative
};

const COUNTRIES = ['USA', 'Canada', 'Mexico', 'Brazil', 'Argentina', 'Australia', 'China', 'India', 'Russia', 'Germany'];
const US_STATES = ['Texas', 'California', 'Iowa', 'Nebraska', 'Kansas', 'Oklahoma', 'Minnesota', 'Illinois', 'Wisconsin', 'North Dakota'];
const CATTLE_TYPES = ['Heifers', 'Mixed', 'Steers'];
const CATTLE_CHOICE_GRADES = ['0-35%', '35-65%', '65-80%', '80-100%'];

const createTimestampSequence = (count: number, frequency: 'daily' | 'quarterly' | 'yearly'): number[] => {
	const timestamps: number[] = [];
	let currentDate = Date.now();
	const msInDay = 24 * 60 * 60 * 1000;

	for (let i = 0; i < count; i++) {
		timestamps.push(currentDate);
		if (frequency === 'daily') {
			currentDate -= msInDay;
		} else if (frequency === 'quarterly') {
			currentDate -= (365.25 / 4) * msInDay;
		} else {
			currentDate -= 365.25 * msInDay;
		}
	}
	return timestamps.reverse(); // Oldest first
};

type DataEntryInput = Prisma.DataEntryCreateWithoutDocumentInput;

interface NumericalRange {
	min: number;
	max: number;
	decimals?: number;
}

interface DataTypeConfig {
	category: 'Crop' | 'Livestock' | 'Produce';
	frequency: 'daily' | 'quarterly' | 'yearly';
	numericalFields: {
		[key: string]: NumericalRange;
	};
	categoricalFields?: {
		[key: string]: string[];
	};
	includeState?: boolean;
}

const dataTypeConfigs: Record<string, DataTypeConfig> = {
	Cattle: {
		category: 'Livestock',
		frequency: 'daily',
		numericalFields: {
			Exports: { min: 50000, max: 200000, decimals: 0 },
			price: { min: 1.5, max: 2.5, decimals: 4 },
			Head: { min: 50, max: 500, decimals: 0 },
		},
		categoricalFields: {
			'Cattle Type': CATTLE_TYPES,
			'Choice Grade': CATTLE_CHOICE_GRADES,
		},
		includeState: true,
	},
	Hogs: {
		category: 'Livestock',
		frequency: 'daily',
		numericalFields: {
			Exports: { min: 100000, max: 300000, decimals: 0 },
			price: { min: 0.8, max: 1.5, decimals: 4 },
		},
		includeState: true,
	},
	Eggs: {
		category: 'Produce',
		frequency: 'daily',
		numericalFields: {
			Exports: { min: 500000, max: 2000000, decimals: 0 },
			price: { min: 1.0, max: 3.0, decimals: 4 },
		},
		includeState: true,
	},
	Sheep: {
		category: 'Livestock',
		frequency: 'quarterly',
		numericalFields: {
			Exports: { min: 10000, max: 50000, decimals: 0 },
			price: { min: 2.0, max: 4.0, decimals: 4 },
		},
		includeState: true,
	},
	Barley: {
		category: 'Crop',
		frequency: 'yearly',
		numericalFields: {
			Exports: { min: 1000000, max: 10000000, decimals: 0 },
			'total volume': { min: 5000000, max: 20000000, decimals: 0 },
			price: { min: 0.15, max: 0.35, decimals: 4 },
		},
		includeState: true,
	},
	// Add other types here following the same structure
};

// --- Helper Functions ---

interface GenerateEntriesParams {
	unixDate: number;
	type: string;
	country: string;
	state?: string;
	cattleType?: string;
	choiceGrade?: string;
}

const generateEntries = (params: GenerateEntriesParams): DataEntryInput[] => {
	const { unixDate, type, country, state, cattleType, choiceGrade } = params;
	const config = dataTypeConfigs[type];
	// The config check here is redundant if generateEntries is only called
	// from places that guarantee 'type' is a valid key, like the main loop.
	// If this function could be called with arbitrary 'type' strings elsewhere,
	// the check should be kept. For now, removing based on current usage.
	// if (!config) {
	// 	throw new Error(`Invalid data type specified: ${type}`);
	// }

	const entries: DataEntryInput[] = [
		{ key: 'type', value: type },
		{ key: 'category', value: config.category },
		{ key: 'unixDate', value: String(unixDate) },
		{ key: 'country', value: country },
	];

	for (const [key, range] of Object.entries(config.numericalFields)) {
		entries.push({ key: key, value: String(getRandomNumber(range.min, range.max, range.decimals)) });
	}

	if (config.includeState && country === 'USA' && state) {
		entries.push({ key: 'state', value: state });
	}

	// Add cattle-specific categorical fields
	if (type === 'Cattle') {
		if (cattleType) {
			entries.push({ key: 'Cattle Type', value: cattleType });
		}
		if (choiceGrade) {
			entries.push({ key: 'Choice Grade', value: choiceGrade });
		}
	}
	// Add other type-specific categorical fields here if needed

	return entries;
};

const generateDocumentInput = (entries: DataEntryInput[]): Prisma.DataDocumentCreateInput => {
	return { entries: { createMany: { data: entries } } };
};

// NOTE: This function is currently unused in the main script execution.
const generateSimilarEntries = (existingEntries: DataEntryInput[], newUnixDate: number): DataEntryInput[] => {
	const newEntries: DataEntryInput[] = [];
	const numericalKeys = new Set<string>();

	const typeEntry = existingEntries.find((e) => e.key === 'type');
	if (!typeEntry) throw new Error("Cannot generate similar entries without a 'type' key.");

	const type = typeEntry.value;
	const config = dataTypeConfigs[type];
	// Similar to generateEntries, assuming 'type' from existing data is valid.
	// if (!config) throw new Error(`Invalid data type found in existing entries: ${type}`);

	Object.keys(config.numericalFields).forEach((key) => numericalKeys.add(key));

	for (const entry of existingEntries) {
		if (entry.key === 'unixDate') {
			newEntries.push({ key: 'unixDate', value: String(newUnixDate) });
		} else if (numericalKeys.has(entry.key)) {
			const originalValue = parseFloat(entry.value);
			if (!isNaN(originalValue)) {
				const newValue = getRandomVariation(originalValue, 0.1); // +/- 10% variation
				// Clamp variation within original min/max if desired (optional)
				// const range = config.numericalFields[entry.key];
				// const clampedValue = Math.max(range.min, Math.min(range.max, newValue));
				const decimals = config.numericalFields[entry.key]?.decimals;
				newEntries.push({ key: entry.key, value: newValue.toFixed(decimals ?? 2) });
			} else {
				newEntries.push({ ...entry }); // Keep as is if parsing failed
			}
		} else {
			// Keep categorical/non-numerical data the same
			newEntries.push({ ...entry });
		}
	}
	return newEntries;
};

// --- Data Generation Logic ---

function generateAllDocumentInputs(): Prisma.DataDocumentCreateInput[] {
	const documentsToCreateInput: Prisma.DataDocumentCreateInput[] = [];

	const dailyTimestamps = createTimestampSequence(NUM_DAILY_TIMESTAMPS, 'daily');
	const quarterlyTimestamps = createTimestampSequence(NUM_QUARTERLY_TIMESTAMPS, 'quarterly');
	const yearlyTimestamps = createTimestampSequence(NUM_YEARLY_TIMESTAMPS, 'yearly');

	console.log(`Generating data for ${dailyTimestamps.length} daily, ${quarterlyTimestamps.length} quarterly, and ${yearlyTimestamps.length} yearly timestamps...`);

	const allTimestamps = [...dailyTimestamps.map((ts) => ({ ts: ts, freq: 'daily' as const })), ...quarterlyTimestamps.map((ts) => ({ ts: ts, freq: 'quarterly' as const })), ...yearlyTimestamps.map((ts) => ({ ts: ts, freq: 'yearly' as const }))];

	for (const { ts: unixDate, freq } of allTimestamps) {
		const relevantTypes = Object.entries(dataTypeConfigs)
			.filter(([_, config]) => config.frequency === freq)
			.map(([typeName]) => typeName);

		for (const type of relevantTypes) {
			const config = dataTypeConfigs[type];
			for (const country of COUNTRIES) {
				if (country === 'USA' && config.includeState) {
					for (const state of US_STATES) {
						const cattleTypes = config.categoricalFields?.['Cattle Type'];
						const choiceGrades = config.categoricalFields?.['Choice Grade'];

						if (type === 'Cattle' && cattleTypes?.length && choiceGrades?.length) {
							for (const cattleType of cattleTypes) {
								for (const choiceGrade of choiceGrades) {
									const entries = generateEntries({ unixDate, type, country, state, cattleType, choiceGrade });
									documentsToCreateInput.push(generateDocumentInput(entries));
								}
							}
						} else {
							// Other types in USA or Cattle without specific fields
							const entries = generateEntries({ unixDate, type, country, state });
							documentsToCreateInput.push(generateDocumentInput(entries));
						}
					}
				} else {
					// Non-USA countries or types without state breakdown
					const entries = generateEntries({ unixDate, type, country });
					documentsToCreateInput.push(generateDocumentInput(entries));
				}
			}
		}
	}
	console.log(`Generated ${documentsToCreateInput.length} document creation inputs.`);
	return documentsToCreateInput;
}

// --- Database Operations ---

async function resetDatabase(): Promise<void> {
	console.log('Resetting database: deleting existing DataDocuments and DataEntries...');
	// Delete entries first due to relation
	await prisma.dataEntry.deleteMany({});
	await prisma.dataDocument.deleteMany({});
	console.log('Existing data deleted.');
}

async function batchCreateDocuments(documentsInput: Prisma.DataDocumentCreateInput[]): Promise<number> {
	let createdCount = 0;
	console.log(`Starting batch creation for ${documentsInput.length} documents...`);

	for (let i = 0; i < documentsInput.length; i += BATCH_SIZE) {
		const batch = documentsInput.slice(i, i + BATCH_SIZE);
		const batchNumber = Math.floor(i / BATCH_SIZE) + 1;
		const totalBatches = Math.ceil(documentsInput.length / BATCH_SIZE);
		console.log(`Creating batch ${batchNumber}/${totalBatches} (size: ${batch.length})...`);
		try {
			// Prisma's createMany is for a single model, not complex relations like this easily.
			// Sticking to individual creates within a loop for simplicity and error handling per document.
			// Consider transactions for larger batches if performance is critical and atomicity is needed.
			for (const docData of batch) {
				await prisma.dataDocument.create({ data: docData });
				createdCount++;
			}
		} catch (error) {
			console.error(`Error creating batch ${batchNumber} (starting index ${i}):`, error);
			// Optional: Decide to stop or continue on batch error
			// break;
		}
	}
	return createdCount;
}

// --- Main Execution ---

async function main(): Promise<void> {
	console.log('Starting database population script...');

	if (RESET_DATABASE) {
		await resetDatabase();
	}

	const documentsToCreateInput = generateAllDocumentInputs();
	const createdCount = await batchCreateDocuments(documentsToCreateInput);

	console.log(`Successfully created ${createdCount} new documents.`);
	const finalCount = await prisma.dataDocument.count();
	console.log(`Database now contains ${finalCount} documents.`);
}

main()
	.catch((e: unknown) => {
		console.error('Script failed:');
		if (e instanceof Error) {
			console.error(e.message);
		} else {
			console.error(e);
		}
		void prisma.$disconnect();
		process.exit(1);
	})
	.finally(() => {
		console.log('Disconnecting Prisma client...');
		void prisma.$disconnect().catch((err) => {
			console.error('Error disconnecting Prisma in finally:', err);
		});
		console.log('Script finished.');
	});
