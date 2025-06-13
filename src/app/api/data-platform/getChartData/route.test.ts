import { testApiHandler } from 'next-test-api-route-handler';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// Mock the db module before any imports that use it
vi.mock('~/server/db', () => ({
	db: {
		commodityData: {
			count: vi.fn(),
			findMany: vi.fn(),
		},
	},
}));

// Set DATABASE_URL before importing route
process.env.DATABASE_URL = 'mongodb://localhost:27017/test';

import * as route from './route';

import { db } from '~/server/db';

describe('/api/data-platform/getChartData', () => {
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

	it('should return raw data points when no filters applied', async () => {
		// Mock document count
		(db.commodityData.count as ReturnType<typeof vi.fn>).mockResolvedValue(3);

		// Mock findMany result
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

		(db.commodityData.findMany as ReturnType<typeof vi.fn>).mockResolvedValue(mockDocuments);

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

				// Verify Prisma calls
				// eslint-disable-next-line @typescript-eslint/unbound-method
				expect(db.commodityData.count).toHaveBeenCalledWith({ where: {} });
				// eslint-disable-next-line @typescript-eslint/unbound-method
				expect(db.commodityData.findMany).toHaveBeenCalledWith({
					where: {},
					select: {
						unixDate: true,
						price: true,
						exports: true,
						head: true,
						totalVolume: true,
					},
				});
			},
		});
	});

	it('should return aggregate data when groupBy parameter is set', async () => {
		const groupBy = 'type';

		// Mock count
		(db.commodityData.count as ReturnType<typeof vi.fn>).mockResolvedValue(50);

		// Mock findMany with grouped data
		const mockDocuments = [
			// Beef documents
			{ unixDate: 1700000000000, price: 100, type: 'Beef' },
			{ unixDate: 1700100000000, price: 110, type: 'Beef' },
			{ unixDate: 1700200000000, price: 105, type: 'Beef' },
			// Pork documents
			{ unixDate: 1700000000000, price: 80, type: 'Pork' },
			{ unixDate: 1700100000000, price: 85, type: 'Pork' },
			{ unixDate: 1700200000000, price: 82, type: 'Pork' },
		];

		(db.commodityData.findMany as ReturnType<typeof vi.fn>).mockResolvedValue(mockDocuments);

		await testApiHandler({
			appHandler: route,
			url: `/api/data-platform/getChartData?groupBy=${groupBy}`,
			test: async ({ fetch }) => {
				const response = await fetch({ method: 'GET' });
				const json = await response.json();

				expect(response.status).toBe(200);
				expect(json.documentCount).toBe(50); // Total count, not grouped
				expect(json.limitExceeded).toBe(false);

				// Check aggregated data structure
				expect(json.aggregatedData).toBeDefined();
				expect(json.aggregatedData).toHaveProperty('Beef');
				expect(json.aggregatedData).toHaveProperty('Pork');

				// Check Beef aggregation
				expect(json.aggregatedData.Beef).toHaveLength(3);
				expect(json.aggregatedData.Beef[0]).toEqual({
					timestamp: 1700000000000,
					values: {
						price: 100,
					},
				});

				// Check Pork aggregation
				expect(json.aggregatedData.Pork).toHaveLength(3);
				expect(json.aggregatedData.Pork[0]).toEqual({
					timestamp: 1700000000000,
					values: {
						price: 80,
					},
				});
			},
		});
	});

	it('should apply filters correctly', async () => {
		const inputFilters = {
			type: ['Beef'],
			category: ['Fresh'],
		};

		// Mock filtered count
		(db.commodityData.count as ReturnType<typeof vi.fn>).mockResolvedValue(2);

		// Mock filtered documents
		const mockDocuments = [
			{
				unixDate: 1700000000000,
				price: 100.5,
				type: 'Beef',
				category: 'Fresh',
			},
			{
				unixDate: 1700100000000,
				price: 102.0,
				type: 'Beef',
				category: 'Fresh',
			},
		];

		(db.commodityData.findMany as ReturnType<typeof vi.fn>).mockResolvedValue(mockDocuments);

		await testApiHandler({
			appHandler: route,
			url: `/api/data-platform/getChartData?filters=${encodeURIComponent(JSON.stringify(inputFilters))}`,
			test: async ({ fetch }) => {
				const response = await fetch({ method: 'GET' });
				const json = await response.json();

				expect(response.status).toBe(200);
				expect(json.documentCount).toBe(2);

				// Verify filters were applied
				// eslint-disable-next-line @typescript-eslint/unbound-method
				expect(db.commodityData.count).toHaveBeenCalledWith({
					where: {
						type: { in: ['Beef'] },
						category: { in: ['Fresh'] },
					},
				});
			},
		});
	});

	it('should handle document count exceeding limit', async () => {
		// Mock count exceeding limit
		(db.commodityData.count as ReturnType<typeof vi.fn>).mockResolvedValue(6000);

		await testApiHandler({
			appHandler: route,
			test: async ({ fetch }) => {
				const response = await fetch({ method: 'GET' });
				const json = await response.json();

				expect(response.status).toBe(200);
				expect(json.documentCount).toBe(6000);
				expect(json.limitExceeded).toBe(true);
				expect(json.rawData).toBeNull();

				// Should not call findMany when limit exceeded
				// eslint-disable-next-line @typescript-eslint/unbound-method
				expect(db.commodityData.findMany).not.toHaveBeenCalled();
			},
		});
	});

	it('should skip documents with invalid unixDate', async () => {
		(db.commodityData.count as ReturnType<typeof vi.fn>).mockResolvedValue(3);

		const mockDocuments = [
			{
				unixDate: 1700000000000,
				price: 100,
			},
			{
				unixDate: null, // Invalid
				price: 200,
			},
			{
				unixDate: 'invalid', // Invalid
				price: 300,
			},
		];

		(db.commodityData.findMany as ReturnType<typeof vi.fn>).mockResolvedValue(mockDocuments);

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
		(db.commodityData.count as ReturnType<typeof vi.fn>).mockResolvedValue(2);

		const mockDocuments = [
			{
				unixDate: 1700000000000,
				price: 100,
			},
			{
				unixDate: 1700100000000,
				// No numeric values
			},
		];

		(db.commodityData.findMany as ReturnType<typeof vi.fn>).mockResolvedValue(mockDocuments);

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
		(db.commodityData.count as ReturnType<typeof vi.fn>).mockResolvedValue(0);

		await testApiHandler({
			appHandler: route,
			test: async ({ fetch }) => {
				const response = await fetch({ method: 'GET' });
				const json = await response.json();

				expect(response.status).toBe(200);
				expect(json.documentCount).toBe(0);
				expect(json.rawData).toEqual([]);

				// Should not try to fetch when count is 0
				const findManyMock = vi.mocked(db.commodityData).findMany;

				expect(findManyMock).not.toHaveBeenCalled();
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

		// Mock Prisma to throw error
		(db.commodityData.count as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('Connection failed'));

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

		// Mock Prisma to throw error about missing DATABASE_URL
		(db.commodityData.count as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('DATABASE_URL is not defined'));

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
