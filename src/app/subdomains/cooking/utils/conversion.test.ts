import { describe, expect, it } from 'vitest';

import { convertUnit } from './conversion';

describe('convertUnit', () => {
	it('should correctly convert grams to kilograms', () => {
		expect(convertUnit(1000, 'g', 'kg')).toBe(1);
	});

	it('should correctly convert kilograms to grams', () => {
		expect(convertUnit(1, 'kg', 'g')).toBe(1000);
	});

	it('should correctly convert ounces to grams', () => {
		expect(convertUnit(1, 'oz', 'g')).toBeCloseTo(28.35);
	});

	it('should return the original amount for unsupported units', () => {
		expect(convertUnit(100, 'unsupported', 'g')).toBe(100);
	});

	it('should handle same unit conversion', () => {
		expect(convertUnit(50, 'g', 'g')).toBe(50);
	});
});
