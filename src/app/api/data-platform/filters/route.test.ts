import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { testRoute } from '../../../../../testUtils/unit/api-route-test-helper';

// Mock the db module before any imports that use it
vi.mock('~/server/db', () => ({
	db: {
		commodityData: {
			count: vi.fn(),
			groupBy: vi.fn(),
		},
	},
}));

// Set DATABASE_URL before importing route
process.env.DATABASE_URL = 'mongodb://localhost:27017/test';

import type { FiltersResponse } from './route';
import * as route from './route';

import { db } from '~/server/db';

describe('/api/data-platform/filters', () => {
	beforeEach(() => {
		vi.clearAllMocks();

		// Use vi.stubEnv to set environment variables
		vi.stubEnv('DATABASE_URL', 'mongodb://localhost:27017/test');
		vi.stubEnv('NODE_ENV', 'development');
	});

	afterEach(() => {
		// Restore environment
		vi.unstubAllEnvs();
		vi.resetModules();
	});

	it('should return filters with counts when no input filters provided', async () => {
		// Mock total document count
		(db.commodityData.count as ReturnType<typeof vi.fn>).mockResolvedValue(100);

		// Mock groupBy results for each filter type
		const mockGroupByImplementation = async ({ by, _count, where: _where }: any) => {
			const field = by[0];
			if (field === 'type') {
				return [
					{ type: 'Beef', _count: 50 },
					{ type: 'Pork', _count: 30 },
					{ type: 'Poultry', _count: 20 },
				];
			}
			if (field === 'category') {
				return [
					{ category: 'Fresh', _count: 60 },
					{ category: 'Frozen', _count: 40 },
				];
			}
			if (field === 'country') {
				return [{ country: 'USA', _count: 100 }];
			}
			return [];
		};

		(db.commodityData.groupBy as ReturnType<typeof vi.fn>).mockImplementation(mockGroupByImplementation);

		const response = await testRoute(route, '/api/data-platform/filters', {
			method: 'GET',
		});
		const json = (await response.json()) as FiltersResponse;

		expect(response.status).toBe(200);
		expect(json.totalDocuments).toBe(100);

		// Check filters structure
		expect(json.filters).toBeDefined();
		expect(json.filters.type).toEqual([
			{ value: 'Beef', count: 50 },
			{ value: 'Pork', count: 30 },
			{ value: 'Poultry', count: 20 },
		]);

		expect(json.filters.category).toEqual([
			{ value: 'Fresh', count: 60 },
			{ value: 'Frozen', count: 40 },
		]);

		// Check common fields
		expect(json.commonFields).toEqual({
			country: 'USA',
		});

		// Verify Prisma calls

		expect(db.commodityData.count).toHaveBeenCalled();
	});

	it('should apply input filters and return filtered results', async () => {
		const inputFilters = {
			type: ['Beef', 'Pork'],
			category: ['Fresh'],
		};

		// Mock filtered document count
		(db.commodityData.count as ReturnType<typeof vi.fn>).mockResolvedValue(40);

		// Mock groupBy results with filtered data
		const mockGroupByImplementation = async ({ by, _count, where: _where }: any) => {
			const field = by[0];
			if (field === 'type') {
				return [
					{ type: 'Beef', _count: 25 },
					{ type: 'Pork', _count: 15 },
				];
			}
			if (field === 'category') {
				return [{ category: 'Fresh', _count: 40 }];
			}
			if (field === 'country') {
				return [
					{ country: 'USA', _count: 30 },
					{ country: 'Canada', _count: 10 },
				];
			}
			return [];
		};

		(db.commodityData.groupBy as ReturnType<typeof vi.fn>).mockImplementation(mockGroupByImplementation);

		const response = await testRoute(route, '/api/data-platform/filters', {
			method: 'GET',
			searchParams: { filters: JSON.stringify(inputFilters) },
		});
		const json = (await response.json()) as FiltersResponse;

		expect(response.status).toBe(200);
		expect(json.totalDocuments).toBe(40);

		// Check filtered results
		expect(json.filters).toBeDefined();
		expect(json.filters.type).toEqual([
			{ value: 'Beef', count: 25 },
			{ value: 'Pork', count: 15 },
		]);

		// Category should be a common field since all 40 documents are Fresh
		expect(json.commonFields?.category).toBe('Fresh');

		// Verify Prisma was called with correct filter

		expect(db.commodityData.count).toHaveBeenCalledWith({
			where: {
				type: { in: ['Beef', 'Pork'] },
				category: { in: ['Fresh'] },
			},
		});
	});

	it('should exclude filters with max count <= 15 when multiple values exist', async () => {
		(db.commodityData.count as ReturnType<typeof vi.fn>).mockResolvedValue(50);

		const mockGroupByImplementation = async ({ by }: any) => {
			const field = by[0];
			if (field === 'type') {
				return [
					{ type: 'Beef', _count: 10 },
					{ type: 'Pork', _count: 5 },
				];
			}
			if (field === 'state') {
				return [
					{ state: 'Texas', _count: 30 },
					{ state: 'California', _count: 20 },
				];
			}
			if (field === 'cattleType') {
				return [{ cattleType: 'Angus', _count: 12 }];
			}
			return [];
		};

		(db.commodityData.groupBy as ReturnType<typeof vi.fn>).mockImplementation(mockGroupByImplementation);

		const response = await testRoute(route, '/api/data-platform/filters', {
			method: 'GET',
		});
		const json = (await response.json()) as FiltersResponse;

		expect(response.status).toBe(200);

		// Type should be excluded (max count 10 <= 15 and multiple values)
		expect(json.filters.type).toBeUndefined();

		// State should be included (max count 30 > 15)
		expect(json.filters.state).toEqual([
			{ value: 'Texas', count: 30 },
			{ value: 'California', count: 20 },
		]);

		// cattleType should be included (only one value)
		expect(json.filters.cattleType).toEqual([{ value: 'Angus', count: 12 }]);
	});

	it('should handle invalid filter format', async () => {
		// Mock console.error to suppress expected error output
		const { mockConsoleError } = await import('testUtils/unit/console.helpers');
		const consoleMock = mockConsoleError();

		const response = await testRoute(route, '/api/data-platform/filters', {
			method: 'GET',
			searchParams: { filters: 'invalid-json' },
		});
		const json = await response.json();

		expect(response.status).toBe(400);
		expect(json.error).toBe('Invalid filters format');

		// Restore console.error
		consoleMock.restore();
	});

	it('should handle MongoDB connection errors', async () => {
		// Mock console.error to suppress expected error output
		const { mockConsoleError } = await import('testUtils/unit/console.helpers');
		const consoleMock = mockConsoleError();

		// Mock Prisma to throw error
		(db.commodityData.count as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('Connection failed'));

		const response = await testRoute(route, '/api/data-platform/filters', {
			method: 'GET',
		});
		const json = await response.json();

		expect(response.status).toBe(500);
		expect(json.error).toBe('Connection failed');
		expect(json.filters).toEqual({});
		expect(json.totalDocuments).toBe(0);

		// Restore console.error
		consoleMock.restore();
	});

	it('should handle missing DATABASE_URL', async () => {
		// Mock console.error to suppress expected error output
		const { mockConsoleError } = await import('testUtils/unit/console.helpers');
		const consoleMock = mockConsoleError();

		delete process.env.DATABASE_URL;

		// Mock Prisma to throw error about missing DATABASE_URL
		(db.commodityData.count as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('DATABASE_URL is not defined'));

		const response = await testRoute(route, '/api/data-platform/filters', {
			method: 'GET',
		});
		const json = await response.json();

		expect(response.status).toBe(500);
		expect(json.error).toContain('DATABASE_URL');

		// Restore console.error
		consoleMock.restore();
	});
});
