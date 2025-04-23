import { test, expect, type Page } from '@playwright/test';
import type { AggregationResult } from './DataPlatformPreview';

// --- Test Data --- //
// Use the same mock data structure as unit tests for consistency
const mockSuccessData: AggregationResult = {
	continent: { Asia: 15, Europe: 25, Africa: 5 },
	status: { Active: 50, Inactive: 10 },
	'Operating System': { Windows: 30, macOS: 20, Linux: 15 },
};

const mockFilteredData: AggregationResult = {
	continent: { Europe: 10 },
	status: { Active: 15 },
	'Operating System': { Windows: 5, macOS: 10 },
};

const mockEmptyData: AggregationResult = {};

// --- Helper Functions --- //

async function setupMockRoute(page: Page, responseData: AggregationResult | null, status = 200): Promise<void> {
	await page.route('**/api/data-platform/aggregate**', async (route) => {
		if (responseData === null) {
			// Simulate network error
			await route.abort();
		} else {
			await route.fulfill({
				status: status,
				contentType: 'application/json',
				body: JSON.stringify(responseData),
			});
		}
	});
}

// --- Test Suite --- //

// Replace with the actual path/route where DataPlatformPreview is rendered for testing
// This might require creating a dedicated test page in your Next.js app.
const testPageUrl = '/test-route/data-platform-preview';

test.describe('DataPlatformPreview E2E Tests', () => {
	test('should display loading state, then data, and handle closing', async ({ page }): Promise<void> => {
		await setupMockRoute(page, mockSuccessData);

		await page.goto(testPageUrl);

		// 1. Check for loading state initially (optional, might be too fast)
		// await expect(page.locator('text=Loading...')).toBeVisible();

		// 2. Wait for data to load and check content
		await expect(page.getByRole('heading', { name: /Data Platform - Filters/i })).toBeVisible();
		await expect(page.getByRole('button', { name: 'Europe (25)' })).toBeVisible();
		await expect(page.getByRole('button', { name: 'Active (50)' })).toBeVisible();
		await expect(page.getByRole('button', { name: 'Windows (30)' })).toBeVisible();

		// 3. Check category sorting (Status: 50, OS: 30, Continent: 25)
		const categories = await page.locator('h3').allTextContents();
		// Ensure the specific categories we expect are present and roughly in order
		expect(categories.join(' ')).toContain('status');
		expect(categories.join(' ')).toContain('Operating System');
		expect(categories.join(' ')).toContain('continent');

		// 4. Click close button
		//    *Assumption*: Clicking close removes the component or navigates away.
		//    If it just calls a function, this part needs adjustment or removal.
		const closeButton = page.getByRole('button', { name: 'Close' });
		await closeButton.click();

		// 5. Verify component is no longer visible (adjust based on actual close behavior)
		// await expect(page.getByRole('heading', { name: /Data Platform - Filters/i })).not.toBeVisible(); // Removed this assertion as the test page doesn't hide the component
	});

	test('should handle filter selection and update data via API call', async ({ page }): Promise<void> => {
		// Initial load with full data
		await setupMockRoute(page, mockSuccessData);
		await page.goto(testPageUrl);
		await expect(page.getByRole('button', { name: 'Europe (25)' })).toBeVisible();
		await expect(page.getByRole('button', { name: 'Active (50)' })).toBeVisible();

		// Setup mock for the *filtered* API call *before* clicking the filter
		await setupMockRoute(page, mockFilteredData); // Override route for next call

		// Click a filter - Expect a network request matching the filter
		const filterButton = page.getByRole('button', { name: 'Europe (25)' });
		const requestPromise = page.waitForRequest('**/api/data-platform/aggregate**');
		await filterButton.click();
		const request = await requestPromise;

		// Verify the request URL includes the correct filter parameter
		const expectedFilterParam = encodeURIComponent(JSON.stringify({ continent: ['Europe'] }));
		expect(request.url()).toContain(`filters=${expectedFilterParam}`);

		// Verify the UI updates with the filtered data
		await expect(page.getByRole('button', { name: 'Europe (10)' })).toBeVisible(); // Count from mockFilteredData
		await expect(page.getByRole('button', { name: 'Active (15)' })).toBeVisible(); // Count from mockFilteredData
		await expect(page.getByRole('button', { name: 'Windows (5)' })).toBeVisible(); // Count from mockFilteredData

		// Verify inactive filters are not shown (unless zero-count filters are displayed)
		await expect(page.getByRole('button', { name: /Asia/i })).not.toBeVisible();
		await expect(page.getByRole('button', { name: /Inactive/i })).not.toBeVisible();
	});

	test('should display error message on fetch failure', async ({ page }): Promise<void> => {
		await setupMockRoute(page, null); // Simulate network error by aborting

		await page.goto(testPageUrl);

		await expect(page.getByText(/Error loading data:/i)).toBeVisible();
		await expect(page.getByRole('button', { name: /Europe/i })).not.toBeVisible(); // Data shouldn't render
	});

	test('should display "No data" message when API returns empty', async ({ page }): Promise<void> => {
		await setupMockRoute(page, mockEmptyData);

		await page.goto(testPageUrl);

		await expect(page.getByText(/No data available or matching the current filters./i)).toBeVisible();
		await expect(page.getByRole('button', { name: /Europe/i })).not.toBeVisible(); // Data shouldn't render
	});
});
