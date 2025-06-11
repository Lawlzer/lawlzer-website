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

import * as route from './route';

describe('/api/data-platform/getChartData', () => {
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
			find: vi.fn(),
		};

		mockDb = {
			databaseName: 'test',
			collection: vi.fn().mockReturnValue(mockCollection),
		};

		mockClient = {
			db: vi.fn().mockReturnValue(mockDb),
			connect: vi.fn().mockResolvedValue(undefined), // connect returns a promise that resolves to the client
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

	it('should return raw data points when no filters applied', async () => {
		// Mock document count
		mockCollection.countDocuments.mockResolvedValue(3);

		// Mock find result
		const mockDocuments = [
			{
				_id: '1',
				unixDate: 1700000000000,
				price: 100.5,
				exports: 1000,
				head: 50,
				totalVolume: 5000,
			},
			{
				_id: '2',
				unixDate: 1700100000000,
				price: 102.0,
				exports: 1100,
				head: 55,
				totalVolume: 5500,
			},
			{
				_id: '3',
				unixDate: 1700200000000,
				price: 101.5,
				exports: 1050,
				// Missing head and totalVolume - should still process
			},
		];

		mockCollection.find.mockReturnValue({
			toArray: vi.fn().mockResolvedValue(mockDocuments),
		});

		await testApiHandler({
			appHandler: route,
			test: async ({ fetch }) => {
				const response = await fetch({ method: 'GET' });
				const json = await response.json();

				expect(response.status).toBe(200);
				expect(json.documentCount).toBe(3);
				expect(json.limitExceeded).toBe(false);

				// Check raw data structure
				expect(json.rawData).toHaveLength(3);
				expect(json.rawData[0]).toEqual({
					timestamp: 1700000000000,
					values: {
						price: 100.5,
						exports: 1000,
						head: 50,
						totalVolume: 5000,
					},
				});

				// Third document should have only available fields
				expect(json.rawData[2]).toEqual({
					timestamp: 1700200000000,
					values: {
						price: 101.5,
						exports: 1050,
					},
				});

				// Verify MongoDB calls
				expect(mockCollection.countDocuments).toHaveBeenCalledWith({});
				expect(mockCollection.find).toHaveBeenCalledWith(
					{},
					{
						projection: {
							unixDate: 1,
							price: 1,
							exports: 1,
							head: 1,
							totalVolume: 1,
						},
					}
				);
			},
		});
	});

	it('should apply filters correctly', async () => {
		const inputFilters = {
			type: ['Beef', 'Pork'],
			category: ['Fresh'],
			state: 'Texas', // Non-array value
		};

		mockCollection.countDocuments.mockResolvedValue(2);

		const mockDocuments = [
			{
				_id: '1',
				unixDate: 1700000000000,
				type: 'Beef',
				category: 'Fresh',
				state: 'Texas',
				price: 105.0,
				exports: 1200,
			},
			{
				_id: '2',
				unixDate: 1700100000000,
				type: 'Pork',
				category: 'Fresh',
				state: 'Texas',
				price: 85.0,
				exports: 800,
			},
		];

		mockCollection.find.mockReturnValue({
			toArray: vi.fn().mockResolvedValue(mockDocuments),
		});

		await testApiHandler({
			appHandler: route,
			url: `/api/data-platform/getChartData?filters=${encodeURIComponent(JSON.stringify(inputFilters))}`,
			test: async ({ fetch }) => {
				const response = await fetch({ method: 'GET' });
				const json = await response.json();

				expect(response.status).toBe(200);
				expect(json.documentCount).toBe(2);

				// Verify filters were applied
				expect(mockCollection.countDocuments).toHaveBeenCalledWith({
					type: { $in: ['Beef', 'Pork'] },
					category: { $in: ['Fresh'] },
					state: 'Texas',
				});
			},
		});
	});

	it('should handle document count exceeding limit', async () => {
		// Mock count exceeding MAX_DOCUMENTS_FOR_PROCESSING (5000)
		mockCollection.countDocuments.mockResolvedValue(6000);

		await testApiHandler({
			appHandler: route,
			test: async ({ fetch }) => {
				const response = await fetch({ method: 'GET' });
				const json = await response.json();

				expect(response.status).toBe(200);
				expect(json.documentCount).toBe(6000);
				expect(json.limitExceeded).toBe(true);
				expect(json.rawData).toBeNull();

				// Should not fetch documents when limit exceeded
				expect(mockCollection.find).not.toHaveBeenCalled();
			},
		});
	});

	it('should skip documents with invalid unixDate', async () => {
		mockCollection.countDocuments.mockResolvedValue(4);

		const mockDocuments = [
			{
				_id: '1',
				unixDate: 1700000000000,
				price: 100,
			},
			{
				_id: '2',
				unixDate: null, // Invalid
				price: 102,
			},
			{
				_id: '3',
				unixDate: NaN, // Invalid
				price: 103,
			},
			{
				_id: '4',
				unixDate: Infinity, // Invalid
				price: 104,
			},
		];

		mockCollection.find.mockReturnValue({
			toArray: vi.fn().mockResolvedValue(mockDocuments),
		});

		await testApiHandler({
			appHandler: route,
			test: async ({ fetch }) => {
				const response = await fetch({ method: 'GET' });
				const json = await response.json();

				expect(response.status).toBe(200);
				// Only one valid document
				expect(json.rawData).toHaveLength(1);
				expect(json.rawData[0].timestamp).toBe(1700000000000);
			},
		});
	});

	it('should skip documents with no numeric values', async () => {
		mockCollection.countDocuments.mockResolvedValue(2);

		const mockDocuments = [
			{
				_id: '1',
				unixDate: 1700000000000,
				price: 100,
			},
			{
				_id: '2',
				unixDate: 1700100000000,
				// No numeric fields, only metadata
				type: 'Beef',
				category: 'Fresh',
			},
		];

		mockCollection.find.mockReturnValue({
			toArray: vi.fn().mockResolvedValue(mockDocuments),
		});

		await testApiHandler({
			appHandler: route,
			test: async ({ fetch }) => {
				const response = await fetch({ method: 'GET' });
				const json = await response.json();

				expect(response.status).toBe(200);
				// Only one document with numeric values
				expect(json.rawData).toHaveLength(1);
				expect(json.rawData[0].values).toHaveProperty('price');
			},
		});
	});

	it('should handle no matching documents', async () => {
		mockCollection.countDocuments.mockResolvedValue(0);

		await testApiHandler({
			appHandler: route,
			test: async ({ fetch }) => {
				const response = await fetch({ method: 'GET' });
				const json = await response.json();

				expect(response.status).toBe(200);
				expect(json.documentCount).toBe(0);
				expect(json.rawData).toEqual([]);

				// Should not try to fetch when count is 0
				expect(mockCollection.find).not.toHaveBeenCalled();
			},
		});
	});

	it('should handle invalid filter format', async () => {
		// Mock console.error to suppress expected error output
		const { mockConsoleError } = await import('testUtils/unit/console.helpers');
		const consoleMock = mockConsoleError();

		await testApiHandler({
			appHandler: route,
			url: `/api/data-platform/getChartData?filters=invalid-json`,
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
				expect(json.rawData).toEqual([]);
				expect(json.documentCount).toBe(0);
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
