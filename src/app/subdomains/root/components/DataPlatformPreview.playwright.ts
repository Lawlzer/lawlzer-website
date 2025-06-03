import { expect, type Page, test } from '@playwright/test';

import type { ChartDataApiResponse, FiltersApiResponse } from './DataPlatformPreview';

// --- Test Data --- //
// Use separate mocks for filters and chart data APIs

// Mock Filter API Responses
const mockSuccessFilters: FiltersApiResponse = {
	filters: {
		continent: [
			{ value: 'Asia', count: 15 },
			{ value: 'Europe', count: 25 },
			{ value: 'Africa', count: 5 },
		],
		status: [
			{ value: 'Active', count: 50 },
			{ value: 'Inactive', count: 10 },
		],
		operating_system: [
			// Use snake_case like actual API might
			{ value: 'Windows', count: 30 },
			{ value: 'macOS', count: 20 },
			{ value: 'Linux', count: 15 },
		],
	},
	totalDocuments: 100,
};

const _mockFilteredFilters: FiltersApiResponse = {
	filters: {
		continent: [{ value: 'Europe', count: 10 }],
		status: [{ value: 'Active', count: 15 }],
		operating_system: [
			{ value: 'Windows', count: 5 },
			{ value: 'macOS', count: 10 },
		],
	},
	totalDocuments: 25,
};

const mockEmptyFilters: FiltersApiResponse = {
	filters: {},
	totalDocuments: 0,
};

const mockLimitExceededFilters: FiltersApiResponse = {
	filters: { ...mockSuccessFilters.filters }, // Filters might still show even if limit is exceeded for charts
	totalDocuments: 500,
};

// Mock Chart API Responses
const mockSuccessChartData: ChartDataApiResponse = {
	rawData: [
		{ timestamp: 1678886400000, values: { field1: 100, field2: 200 } },
		{ timestamp: 1700054400000, values: { field1: 150 } },
	],
	documentCount: 100,
	limitExceeded: false,
};

const _mockFilteredChartData: ChartDataApiResponse = {
	rawData: [{ timestamp: 1678886400000, values: { field1: 50 } }],
	documentCount: 25,
	limitExceeded: false,
};

const mockEmptyChartData: ChartDataApiResponse = {
	rawData: [],
	documentCount: 0,
	limitExceeded: false,
};

const mockLimitExceededChartData: ChartDataApiResponse = {
	rawData: null,
	documentCount: 500,
	limitExceeded: true,
};

// --- Helper Functions --- //

// Updated helper to mock both API endpoints based on URL path
async function setupMockRoutes(
	page: Page,
	options: {
		filtersResponse?: FiltersApiResponse | null;
		chartDataResponse?: ChartDataApiResponse | null;
		filtersStatus?: number;
		chartDataStatus?: number;
	}
): Promise<void> {
	const { filtersResponse = mockSuccessFilters, chartDataResponse = mockSuccessChartData, filtersStatus = 200, chartDataStatus = 200 } = options;

	await page.route('**/api/data-platform/**', async (route) => {
		const url = route.request().url();

		if (url.includes('/filters')) {
			if (filtersResponse === null) {
				await route.abort(); // Simulate network error for filters
			} else {
				await route.fulfill({
					status: filtersStatus,
					contentType: 'application/json',
					body: JSON.stringify(filtersResponse),
				});
			}
		} else if (url.includes('/getChartData')) {
			if (chartDataResponse === null) {
				await route.abort(); // Simulate network error for chart data
			} else {
				await route.fulfill({
					status: chartDataStatus,
					contentType: 'application/json',
					body: JSON.stringify(chartDataResponse),
				});
			}
		} else {
			// Allow other API calls (or handle specifically if needed)
			await route.continue();
		}
	});
}

// --- Test Suite --- //

// Replace with the actual path/route where DataPlatformPreview is rendered for testing
// This might require creating a dedicated test page in your Next.js app.
const testPageUrl = '/test-route/data-platform-preview';

test.describe('DataPlatformPreview E2E Tests', () => {
	test('should hide charts when document count exceeds limit', async ({ page }): Promise<void> => {
		await setupMockRoutes(page, {
			filtersResponse: mockLimitExceededFilters,
			chartDataResponse: mockLimitExceededChartData,
		});
		await page.goto(testPageUrl);

		// Wait for data to load
		await expect(page.getByRole('button', { name: 'Europe (25)' })).toBeVisible();

		// Check for the warning message
		await expect(page.getByText(/Charts disabled.*exceeds limit/i)).toBeVisible();

		// Check that charts are not visible
		await expect(page.getByRole('tab')).toHaveCount(0);
	});

	test('should display "No data" message when API returns empty', async ({ page }): Promise<void> => {
		await setupMockRoutes(page, { filtersResponse: mockEmptyFilters, chartDataResponse: mockEmptyChartData });

		await page.goto(testPageUrl);

		// Target the specific "No data" message within the filters panel
		await expect(page.locator('.lg\\:col-span-1').getByText(/No documents match the current filters./i)).toBeVisible();
		await expect(page.getByRole('button', { name: /Europe/i })).not.toBeVisible(); // Data shouldn't render
	});
});
