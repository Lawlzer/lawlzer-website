import type { MongoClient } from 'mongodb';
import { testApiHandler } from 'next-test-api-route-handler';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// Mock the mongodb module before any imports that use it
vi.mock('mongodb', () => ({
	MongoClient: vi.fn().mockImplementation(
		() =>
			// @ts-expect-error - accessing test global
			global._currentMockClient as MongoClient
	),
}));

// Set DATABASE_URL before importing route
process.env.DATABASE_URL = 'mongodb://localhost:27017/test';

import type { FiltersResponse } from './route';
import * as route from './route';

describe('/api/data-platform/filters', () => {
	let mockCollection: any;
	let mockDb: any;
	let mockClient: any;

	beforeEach(() => {
		vi.clearAllMocks();

		// Use vi.stubEnv to set environment variables
		vi.stubEnv('DATABASE_URL', 'mongodb://localhost:27017/test');
		vi.stubEnv('NODE_ENV', 'development');

		// Create fresh mocks for each test
		mockCollection = {
			collectionName: 'CommodityData',
			countDocuments: vi.fn(),
			aggregate: vi.fn(),
		};

		mockDb = {
			databaseName: 'test',
			collection: vi.fn().mockReturnValue(mockCollection),
		};

		mockClient = {
			db: vi.fn().mockReturnValue(mockDb),
			connect: vi.fn().mockResolvedValue(undefined),
		};

		// Make the mock client available globally
		// @ts-expect-error - setting test global
		global._currentMockClient = mockClient;

		// Reset the global MongoDB promise
		// @ts-expect-error - resetting global
		delete global._mongoClientPromise;

		// Set up the global promise to return our mock client
		// @ts-expect-error - setting global
		global._mongoClientPromise = Promise.resolve(mockClient);
	});

	afterEach(() => {
		// Clean up globals
		// @ts-expect-error - cleaning globals
		delete global._mongoClientPromise;
		// Restore environment
		vi.unstubAllEnvs();
		vi.resetModules();
	});

	it('should return filters with counts when no input filters provided', async () => {
		// Mock total document count
		mockCollection.countDocuments.mockResolvedValue(100);

		// Mock aggregation result with facets
		const mockFacetResult = {
			type: [
				{ _id: 'Beef', count: 50 },
				{ _id: 'Pork', count: 30 },
				{ _id: 'Poultry', count: 20 },
			],
			category: [
				{ _id: 'Fresh', count: 60 },
				{ _id: 'Frozen', count: 40 },
			],
			country: [
				{ _id: 'USA', count: 100 }, // Common field - all documents
			],
		};

		mockCollection.aggregate.mockReturnValue({
			toArray: vi.fn().mockResolvedValue([mockFacetResult]),
		});

		await testApiHandler<FiltersResponse>({
			appHandler: route,
			test: async ({ fetch }) => {
				const response = await fetch({ method: 'GET' });
				const json = await response.json();

				expect(response.status).toBe(200);
				expect(json.totalDocuments).toBe(100);

				// Check filters structure
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

				// Verify MongoDB calls
				expect(mockCollection.countDocuments).toHaveBeenCalledWith({});
				expect(mockCollection.aggregate).toHaveBeenCalled();
			},
		});
	});

	it('should apply input filters and return filtered results', async () => {
		const inputFilters = {
			type: ['Beef', 'Pork'],
			category: ['Fresh'],
		};

		// Mock filtered document count
		mockCollection.countDocuments.mockResolvedValue(40);

		// Mock aggregation result with filtered facets
		const mockFacetResult = {
			type: [
				{ _id: 'Beef', count: 25 },
				{ _id: 'Pork', count: 15 },
			],
			category: [
				{ _id: 'Fresh', count: 40 }, // All 40 documents are Fresh
			],
			country: [
				{ _id: 'USA', count: 30 },
				{ _id: 'Canada', count: 10 },
			],
		};

		mockCollection.aggregate.mockReturnValue({
			toArray: vi.fn().mockResolvedValue([mockFacetResult]),
		});

		await testApiHandler<FiltersResponse>({
			appHandler: route,
			url: `/api/data-platform/filters?filters=${encodeURIComponent(JSON.stringify(inputFilters))}`,
			test: async ({ fetch }) => {
				const response = await fetch({ method: 'GET' });
				const json = await response.json();

				expect(response.status).toBe(200);
				expect(json.totalDocuments).toBe(40);

				// Check filtered results
				expect(json.filters.type).toEqual([
					{ value: 'Beef', count: 25 },
					{ value: 'Pork', count: 15 },
				]);

				// Category should be a common field since all 40 documents are Fresh
				expect(json.commonFields?.category).toBe('Fresh');

				// Verify MongoDB was called with correct filter
				expect(mockCollection.countDocuments).toHaveBeenCalledWith({
					type: { $in: ['Beef', 'Pork'] },
					category: { $in: ['Fresh'] },
				});
			},
		});
	});

	it('should exclude filters with max count <= 15 when multiple values exist', async () => {
		mockCollection.countDocuments.mockResolvedValue(50);

		const mockFacetResult = {
			type: [
				{ _id: 'Beef', count: 10 }, // Max count = 10, should be excluded
				{ _id: 'Pork', count: 5 },
			],
			state: [
				{ _id: 'Texas', count: 30 }, // Max count > 15, should be included
				{ _id: 'California', count: 20 },
			],
			'Cattle Type': [
				{ _id: 'Angus', count: 12 }, // Only one value, should be included
			],
		};

		mockCollection.aggregate.mockReturnValue({
			toArray: vi.fn().mockResolvedValue([mockFacetResult]),
		});

		await testApiHandler<FiltersResponse>({
			appHandler: route,
			test: async ({ fetch }) => {
				const response = await fetch({ method: 'GET' });
				const json = await response.json();

				expect(response.status).toBe(200);

				// Type should be excluded (max count 10 <= 15 and multiple values)
				expect(json.filters.type).toBeUndefined();

				// State should be included (max count 30 > 15)
				expect(json.filters.state).toEqual([
					{ value: 'Texas', count: 30 },
					{ value: 'California', count: 20 },
				]);

				// Cattle Type should be included (only one value)
				expect(json.filters['Cattle Type']).toEqual([{ value: 'Angus', count: 12 }]);
			},
		});
	});

	it('should handle invalid filter format', async () => {
		// Mock console.error to suppress expected error output
		const { mockConsoleError } = await import('testUtils/unit/console.helpers');
		const consoleMock = mockConsoleError();

		await testApiHandler({
			appHandler: route,
			url: `/api/data-platform/filters?filters=invalid-json`,
			test: async ({ fetch }) => {
				const response = await fetch({ method: 'GET' });
				const json = await response.json();

				expect(response.status).toBe(400);
				expect(json.error).toBe('Invalid filters format');
			},
		});

		// Restore console.error
		consoleMock.restore();
	});

	it('should handle MongoDB connection errors', async () => {
		// Mock console.error to suppress expected error output
		const { mockConsoleError } = await import('testUtils/unit/console.helpers');
		const consoleMock = mockConsoleError();

		mockClient.db.mockImplementationOnce(() => {
			throw new Error('Connection failed');
		});

		await testApiHandler({
			appHandler: route,
			test: async ({ fetch }) => {
				const response = await fetch({ method: 'GET' });
				const json = await response.json();

				expect(response.status).toBe(500);
				expect(json.error).toBe('Connection failed');
				expect(json.filters).toEqual({});
				expect(json.totalDocuments).toBe(0);
			},
		});

		// Restore console.error
		consoleMock.restore();
	});

	it('should handle missing DATABASE_URL', async () => {
		// Mock console.error to suppress expected error output
		const { mockConsoleError } = await import('testUtils/unit/console.helpers');
		const consoleMock = mockConsoleError();

		delete process.env.DATABASE_URL;

		await testApiHandler({
			appHandler: route,
			test: async ({ fetch }) => {
				const response = await fetch({ method: 'GET' });
				const json = await response.json();

				expect(response.status).toBe(500);
				expect(json.error).toContain('DATABASE_URL');
			},
		});

		// Restore console.error
		consoleMock.restore();
	});
});
