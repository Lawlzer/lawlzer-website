import { NextResponse } from 'next/server';

// Conversion factors to base units
const WEIGHT_TO_GRAMS: Record<string, number> = {
	g: 1,
	kg: 1000,
	oz: 28.3495,
	lb: 453.592,
	mg: 0.001,
};

const VOLUME_TO_ML: Record<string, number> = {
	ml: 1,
	l: 1000,
	cup: 236.588,
	tbsp: 14.7868,
	tsp: 4.92892,
	fl_oz: 29.5735,
	gal: 3785.41,
	qt: 946.353,
	pt: 473.176,
};

type ConversionType = 'weight' | 'volume' | 'temperature';

function getUnitType(unit: string): ConversionType | null {
	if (WEIGHT_TO_GRAMS[unit]) return 'weight';
	if (VOLUME_TO_ML[unit]) return 'volume';
	if (['c', 'f', 'k'].includes(unit.toLowerCase())) return 'temperature';
	return null;
}

function convertWeight(amount: number, from: string, to: string): number {
	const grams = amount * WEIGHT_TO_GRAMS[from];
	return grams / WEIGHT_TO_GRAMS[to];
}

function convertVolume(amount: number, from: string, to: string): number {
	const ml = amount * VOLUME_TO_ML[from];
	return ml / VOLUME_TO_ML[to];
}

function convertTemperature(amount: number, from: string, to: string): number {
	// Convert to Celsius first
	let celsius: number;
	switch (from.toLowerCase()) {
		case 'c':
			celsius = amount;
			break;
		case 'f':
			celsius = ((amount - 32) * 5) / 9;
			break;
		case 'k':
			celsius = amount - 273.15;
			break;
		default:
			throw new Error(`Unknown temperature unit: ${from}`);
	}

	// Convert from Celsius to target
	switch (to.toLowerCase()) {
		case 'c':
			return celsius;
		case 'f':
			return (celsius * 9) / 5 + 32;
		case 'k':
			return celsius + 273.15;
		default:
			throw new Error(`Unknown temperature unit: ${to}`);
	}
}

export async function GET(request: Request) {
	const { searchParams } = new URL(request.url);
	const amount = searchParams.get('amount');
	const from = searchParams.get('from');
	const to = searchParams.get('to');
	const type = searchParams.get('type') as ConversionType | null;

	// Validate required parameters
	if (!amount || !from || !to) {
		return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
	}

	// Parse amount
	const parsedAmount = parseFloat(amount);
	if (isNaN(parsedAmount)) {
		return NextResponse.json({ error: 'Invalid amount' }, { status: 400 });
	}

	// Determine actual unit types
	const actualFromType = getUnitType(from);
	const actualToType = getUnitType(to);

	// Validate units exist
	if (!actualFromType || !actualToType) {
		return NextResponse.json({ error: 'Unknown unit' }, { status: 400 });
	}

	// Validate units are of same type
	if (actualFromType !== actualToType) {
		return NextResponse.json({ error: 'Cannot convert between weight and volume units' }, { status: 400 });
	}

	// Validate non-negative amounts for non-temperature conversions
	if (actualFromType !== 'temperature' && parsedAmount < 0) {
		return NextResponse.json({ error: 'Amount must be positive for non-temperature conversions' }, { status: 400 });
	}

	try {
		let result: number;
		switch (actualFromType) {
			case 'weight':
				result = convertWeight(parsedAmount, from, to);
				break;
			case 'volume':
				result = convertVolume(parsedAmount, from, to);
				break;
			case 'temperature':
				result = convertTemperature(parsedAmount, from, to);
				break;
			default:
				return NextResponse.json({ error: 'Unknown conversion type' }, { status: 400 });
		}

		return NextResponse.json({ result });
	} catch (error: any) {
		return NextResponse.json({ error: error.message || 'Conversion failed' }, { status: 400 });
	}
}
