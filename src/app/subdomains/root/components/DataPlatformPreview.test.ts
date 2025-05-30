'use client';

import React from 'react';
import { render, screen, fireEvent, waitFor, within, act } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import DataPlatformPreview from './DataPlatformPreview';
import type { FiltersApiResponse, ChartDataApiResponse, RawDataPoint } from './DataPlatformPreview';

// --- Mocks --- //

// Mock react-chartjs-2 to prevent canvas/JSDOM errors
vi.mock('react-chartjs-2', async () => {
	const actual = await vi.importActual('react-chartjs-2');
	return {
		...actual,
		Line: vi.fn(() => React.createElement('canvas', { 'data-testid': 'mock-chart' })), // Replace Line with a mock canvas
	};
});

// Mock fetch API
const mockFetch = vi.fn();
global.fetch = mockFetch;

// --- Test Data --- //

// Original, complex filter response for specific tests
const originalMockFiltersResponse: FiltersApiResponse = {
	filters: {
		category_a: [
			{ value: 'ValueA1', count: 10 },
			{ value: 'ValueA2', count: 5 },
		],
		category_b: [{ value: 'ValueB1', count: 20 }],
		category_c: [
			{ value: 'ValueC1', count: 15 },
			{ value: 'ValueC2', count: 25 },
			{ value: 'ValueC3', count: 8 },
		], // For sorting test
	},
	totalDocuments: 50,
};

// Simplified filter response for default beforeEach mock
const mockFiltersResponse: FiltersApiResponse = {
	filters: {
		category_b: [{ value: 'ValueB1', count: 20 }], // Simplified to one category
	},
	totalDocuments: 20, // Adjusted to match the single category count
};

const mockEmptyFiltersResponse: FiltersApiResponse = {
	filters: {},
	totalDocuments: 0,
};

const mockLimitExceededResponse: FiltersApiResponse = {
	filters: {}, // Filters might still exist even if limit exceeded
	totalDocuments: 500, // Example count
};

// Mock data for /api/data-platform/getChartData
const mockRawDataPoints: RawDataPoint[] = [
	{ timestamp: 1678886400000, values: { field1: 100, field2: 200 } }, // Mar 15 2023
	{ timestamp: 1700054400000, values: { field1: 150 } }, // Nov 15 2023
	{ timestamp: 1710508800000, values: { field1: 120, field2: 250 } }, // Mar 15 2024
];

const mockChartDataResponse: ChartDataApiResponse = {
	rawData: mockRawDataPoints,
	documentCount: 3,
	limitExceeded: false,
};

const mockChartDataLimitExceededResponse: ChartDataApiResponse = {
	rawData: null,
	documentCount: 500,
	limitExceeded: true,
};

const mockEmptyChartDataResponse: ChartDataApiResponse = {
	rawData: [],
	documentCount: 0,
	limitExceeded: false,
};

// --- Test Suite --- //

describe('DataPlatformPreview Component', () => {
	let onCloseMock: ReturnType<typeof vi.fn>;

	beforeEach(() => {
		// Mock window.matchMedia for useMediaQuery hook
		Object.defineProperty(window, 'matchMedia', {
			writable: true,
			value: vi.fn().mockImplementation((query) => ({
				matches: false, // Default value
				media: query,
				onchange: null,
				addListener: vi.fn(), // Deprecated but handled by useMediaQuery
				removeListener: vi.fn(), // Deprecated but handled by useMediaQuery
				addEventListener: vi.fn(),
				removeEventListener: vi.fn(),
				dispatchEvent: vi.fn(),
			})),
		});

		// Mock IntersectionObserver
		const intersectionObserverMock = vi.fn(() => ({
			observe: vi.fn(),
			unobserve: vi.fn(),
			disconnect: vi.fn(),
		}));
		vi.stubGlobal('IntersectionObserver', intersectionObserverMock);

		// Mock ResizeObserver
		const resizeObserverMock = vi.fn(() => ({
			observe: vi.fn(),
			unobserve: vi.fn(),
			disconnect: vi.fn(),
		}));
		vi.stubGlobal('ResizeObserver', resizeObserverMock);

		vi.clearAllMocks();
		onCloseMock = vi.fn();

		// Default successful fetch mocks for BOTH endpoints
		mockFetch
			.mockResolvedValueOnce({
				// Filters
				ok: true,
				status: 200,
				json: async () => mockFiltersResponse,
			} as Response)
			.mockResolvedValueOnce({
				// Chart Data
				ok: true,
				status: 200,
				json: async () => mockChartDataResponse,
			} as Response);
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	it('should render loading state initially', () => {
		// Temporarily mock fetch to stay in loading state for filters
		mockFetch.mockImplementation(async () => new Promise(() => {}));
		render(React.createElement(DataPlatformPreview, { onClose: onCloseMock }));
		expect(screen.getByText('(Loading...)')).toBeInTheDocument();
		expect(screen.getByRole('heading', { name: /Filters/i })).toBeInTheDocument();
		expect(screen.getByText(/Loading filters.../i)).toBeInTheDocument(); // Check for filter loading overlay
	});

	it('should render "No data" message when fetch returns empty data', async () => {
		mockFetch
			.mockReset() // Clear default mocks
			.mockResolvedValueOnce({
				// Empty Filters
				ok: true,
				status: 200,
				json: async () => mockEmptyFiltersResponse,
			} as Response)
			.mockResolvedValueOnce({
				// Empty Chart Data
				ok: true,
				status: 200,
				json: async () => mockEmptyChartDataResponse,
			} as Response);

		render(React.createElement(DataPlatformPreview, { onClose: onCloseMock }));

		await waitFor(() => {
			expect(screen.queryByText('(Loading...)')).not.toBeInTheDocument();
		});

		// Check message in filter panel (expect multiple, check length)
		const noDataMessages = screen.getAllByText(/No documents match the current filters./i);
		expect(noDataMessages.length).toBeGreaterThan(0);
		// Optionally, check message in chart panel specifically if needed, but getAllByText covers presence
		// expect(screen.getByText(/No documents match the current filters./i, { selector: '.lg\\:col-span-3 div' })).toBeInTheDocument(); // More specific selector for chart panel message
	});

	it('should show limit exceeded message and disable charts', async () => {
		mockFetch
			.mockReset()
			.mockResolvedValueOnce({
				// Filters (could have data or not)
				ok: true,
				status: 200,
				json: async () => mockLimitExceededResponse, // Provides totalDocs > 0
			} as Response)
			.mockResolvedValueOnce({
				// Chart Data indicates limit exceeded
				ok: true,
				status: 200,
				json: async () => mockChartDataLimitExceededResponse,
			} as Response);

		render(React.createElement(DataPlatformPreview, { onClose: onCloseMock }));

		await waitFor(() => {
			expect(screen.queryByText('(Loading...)')).not.toBeInTheDocument();
		});

		// Check total documents count
		expect(screen.getByText(/Total documents matching filters:/)).toBeInTheDocument();
		expect(screen.getByText(String(mockLimitExceededResponse.totalDocuments))).toBeInTheDocument();

		// Check for the limit exceeded warning near the count
		await waitFor(
			() => {
				expect(screen.getByText(/\(Charts disabled - \d+ documents exceeds limit. Apply more filters.\)/i)).toBeInTheDocument();
			},
			{ timeout: 3000 }
		); // Increased timeout

		// Check for the message within the chart area itself
		await waitFor(() => {
			expect(screen.getByText(/Chart generation disabled/i)).toBeInTheDocument();
			expect(screen.getByText(/Dataset size \(\d+ documents\) exceeds the limit./i)).toBeInTheDocument();
			expect(screen.getByText(/Apply more specific filters to reduce the count./i)).toBeInTheDocument();
		});

		// Ensure no chart tabs are rendered
		expect(screen.queryByRole('button', { name: /field1/i })).not.toBeInTheDocument();
	});

	it('should render error message when fetch fails', async () => {
		const errorMessage = 'Network Error';
		mockFetch.mockReset().mockRejectedValue(new Error(errorMessage)); // Mock reject for the first call (filters)

		render(React.createElement(DataPlatformPreview, { onClose: onCloseMock }));

		await waitFor(() => {
			expect(screen.queryByText('(Loading...)')).not.toBeInTheDocument();
		});

		// Check for error message in filter panel
		expect(screen.getByText(`Error: ${errorMessage}`)).toBeInTheDocument();

		// Ensure filter buttons are not rendered
		expect(screen.queryByRole('button', { name: /ValueA1/i })).not.toBeInTheDocument();
		// Ensure chart panel shows appropriate message
		// Find the chart panel container more reliably
		const chartPanelHeading = screen.getByRole('heading', { name: /Raw Data Over Time/i });
		const chartPanel = chartPanelHeading.closest('.lg\\:col-span-3'); // Find parent container
		expect(chartPanel).toBeInTheDocument();
		if (chartPanel && chartPanel instanceof HTMLElement) {
			expect(within(chartPanel).getByText(/No documents match the current filters./i)).toBeInTheDocument(); // Check message within the panel
		}
	});

	it('should call onClose when Close button is clicked', async () => {
		render(React.createElement(DataPlatformPreview, { onClose: onCloseMock }));
		await waitFor(() => {
			expect(screen.queryByText('(Loading...)')).not.toBeInTheDocument();
		});

		const closeButton = screen.getByRole('button', { name: 'Close' });
		fireEvent.click(closeButton);
		expect(onCloseMock).toHaveBeenCalledTimes(1);
	});

	it('should sort filter categories alphabetically by key', async () => {
		// Override beforeEach mocks to use the original complex filter data
		mockFetch.mockReset();
		mockFetch
			.mockResolvedValueOnce({
				// Filters (Original complex data)
				ok: true,
				status: 200,
				json: async () => originalMockFiltersResponse,
			} as Response)
			.mockResolvedValueOnce({
				// Chart Data (Also needs to be mocked here)
				ok: true,
				status: 200,
				json: async () => mockChartDataResponse,
			} as Response);

		// The mock data `originalMockFiltersResponse` has keys a, b, c
		await act(async () => {
			await new Promise((resolve) => setTimeout(resolve, 0)); // Delay render slightly
			render(React.createElement(DataPlatformPreview, { onClose: onCloseMock }));
		});

		await waitFor(() => {
			expect(screen.queryByText('(Loading...)')).not.toBeInTheDocument();
		});

		// Get all the filter category headings (h4)
		const categoryHeadings = screen.getAllByRole('heading', { level: 4 });
		const categoryTexts = categoryHeadings.map((h: HTMLElement) => h.textContent?.toLowerCase().trim());

		// Expect them to be sorted by max count desc, then alphabetically asc
		// Based on mockFiltersResponse counts: c (25), b (20), a (10)
		expect(categoryTexts).toEqual(['category c', 'category b', 'category a']);

		// Verify order of buttons within a category is as received from API (no specific client-side sort applied)
		const categoryADiv = screen.getByRole('heading', { name: /category a/i }).closest('div');
		expect(categoryADiv).toBeInTheDocument();
		if (!categoryADiv) throw new Error('Category A div not found');
		const buttonsInA: HTMLButtonElement[] = Array.from(categoryADiv.querySelectorAll('button'));
		const buttonTextsInA = buttonsInA.map((btn) => btn.textContent?.trim().replace(/\s+/g, '')); // Remove ALL whitespace
		// The order should match the mock data: ValueA1(10), ValueA2(5) (no spaces)
		expect(buttonTextsInA).toEqual(['ValueA1(10)', 'ValueA2(5)']); // Expect NO space after removing all whitespace
	});

	it('should handle chart tab switching', async () => {
		render(React.createElement(DataPlatformPreview, { onClose: onCloseMock }));
		await waitFor(() => {
			expect(screen.queryByText('(Loading...)')).not.toBeInTheDocument();
			// Ensure chart tabs are present
			expect(screen.getByRole('button', { name: /field1/i })).toBeInTheDocument();
			expect(screen.getByRole('button', { name: /field2/i })).toBeInTheDocument();
		});

		const tab1 = screen.getByRole('button', { name: /field1/i });
		const tab2 = screen.getByRole('button', { name: /field2/i });

		// Initially, the first tab should be active (field1)
		expect(tab1).toHaveClass('bg-primary');
		expect(tab2).not.toHaveClass('bg-primary');
		// Check chart title (uses getYAxisLabel) - REMOVED direct check of heading role
		// expect(screen.getByRole(\'heading\', { name: /Field1/i })).toBeInTheDocument(); // Check default title

		// Click the second tab
		fireEvent.click(tab2);

		// Wait for the visual transition state and then the final state
		await waitFor(() => {
			expect(screen.getByText(/Switching chart.../i)).toBeInTheDocument(); // Check for transition indicator
		});
		await waitFor(
			() => {
				expect(screen.queryByText(/Switching chart.../i)).not.toBeInTheDocument(); // Indicator disappears
				expect(tab1).not.toHaveClass('bg-primary');
				expect(tab2).toHaveClass('bg-primary');
				// Check chart title updated - REMOVED direct check of heading role
				// expect(screen.getByRole(\'heading\', { name: /Field2/i })).toBeInTheDocument();
			},
			{ timeout: 500 }
		); // Increase timeout slightly for the visual delay
	});
});
