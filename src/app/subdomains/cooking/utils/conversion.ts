// Basic unit conversion
// This is a simplified implementation and can be expanded with more units and density-based conversions.

const conversionFactors: Record<string, number> = {
	g: 1,
	kg: 1000,
	mg: 0.001,
	oz: 28.35,
	lb: 453.592,
	cup: 240, // Note: This is a volume to weight conversion, assuming water density. This is a simplification.
	ml: 1,
	l: 1000,
	tbsp: 15,
	tsp: 5,
};

export const convertUnit = (amount: number, fromUnit: string, toUnit: string): number => {
	const from = fromUnit.toLowerCase();
	const to = toUnit.toLowerCase();

	if (!(from in conversionFactors) || !(to in conversionFactors)) {
		console.warn(`Unsupported unit conversion from ${from} to ${to}`);
		return amount; // Return original amount if units are not supported
	}

	const amountInGrams = amount * conversionFactors[from];
	return amountInGrams / conversionFactors[to];
};
