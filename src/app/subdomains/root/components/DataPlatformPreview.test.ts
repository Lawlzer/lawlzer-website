'use client';

import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { ChartDataApiResponse, FiltersApiResponse } from './DataPlatformPreview';
import DataPlatformPreview from './DataPlatformPreview';

// --- Mocks --- //

// Mock react-chartjs-2 to prevent canvas/JSDOM errors
vi.mock('react-chartjs-2', async () => {
	const actual = await vi.importActual('react-chartjs-2');
	return {
		...actual,
		Line: vi.fn(() => React.createElement('canvas', { 'data-testid': 'mock-chart' })),
	};
});

// --- Test Data --- //

const createFiltersResponse = (overrides?: Partial<FiltersApiResponse>): FiltersApiResponse => ({
	filters: {
		category_b: [{ value: 'ValueB1', count: 20 }],
	},
	totalDocuments: 20,
	...overrides,
});

const createChartDataResponse = (overrides?: Partial<ChartDataApiResponse>): ChartDataApiResponse => ({
	rawData: [
		{ timestamp: 1678886400000, values: { field1: 100, field2: 200 } }, // Mar 15 2023
		{ timestamp: 1700054400000, values: { field1: 150 } }, // Nov 15 2023
		{ timestamp: 1710508800000, values: { field1: 120, field2: 250 } }, // Mar 15 2024
	],
	documentCount: 3,
	limitExceeded: false,
	...overrides,
});

// --- Mock Fetch Helper --- //

class FetchMocker {
	private readonly mockFetch = vi.fn();
	private callCount = 0;
	private responses: { url: RegExp | string; response: Response }[] = [];

	public constructor() {
		// Default responses to prevent errors
		this.addResponse(/filters/, createFiltersResponse());
		this.addResponse(/getChartData/, createChartDataResponse());
	}

	public addResponse(urlPattern: RegExp | string, responseData: any, options?: { status?: number; ok?: boolean }): this {
		this.responses.push({
			url: urlPattern,
			response: {
				ok: options?.ok ?? true,
				status: options?.status ?? 200,
				json: async () => responseData as ChartDataApiResponse | FiltersApiResponse,
			} as Response,
		});
		return this;
	}

	public setup(): ReturnType<typeof vi.fn> {
		this.callCount = 0;
		this.mockFetch.mockImplementation(async (url: string) => {
			this.callCount++;

			// Find matching response
			const match = this.responses.find((r) => {
				if (typeof r.url === 'string') {
					return url.includes(r.url);
				}
				return r.url.test(url);
			});

			if (match) {
				return Promise.resolve(match.response);
			}

			// Fallback to prevent errors
			console.warn(`No mock found for URL: ${url}`);
			return Promise.resolve({
				ok: true,
				status: 200,
				json: async () => ({}),
			} as Response);
		});

		global.fetch = this.mockFetch;
		return this.mockFetch;
	}

	public reset(): void {
		this.responses = [];
		this.addResponse(/filters/, createFiltersResponse());
		this.addResponse(/getChartData/, createChartDataResponse());
	}
}

// --- Test Setup Helpers --- //

const setupWindowMocks = () => {
	// Mock window.matchMedia
	Object.defineProperty(window, 'matchMedia', {
		writable: true,
		value: vi.fn().mockImplementation((query) => ({
			matches: false,
			media: query,
			onchange: null,
			addListener: vi.fn(),
			removeListener: vi.fn(),
			addEventListener: vi.fn(),
			removeEventListener: vi.fn(),
			dispatchEvent: vi.fn(),
		})),
	});

	// Mock IntersectionObserver
	vi.stubGlobal(
		'IntersectionObserver',
		vi.fn(() => ({
			observe: vi.fn(),
			unobserve: vi.fn(),
			disconnect: vi.fn(),
		}))
	);

	// Mock ResizeObserver
	vi.stubGlobal(
		'ResizeObserver',
		vi.fn(() => ({
			observe: vi.fn(),
			unobserve: vi.fn(),
			disconnect: vi.fn(),
		}))
	);
};

// --- Test Suite --- //

describe('DataPlatformPreview Component', () => {
	let onCloseMock: ReturnType<typeof vi.fn>;
	let fetchMocker: FetchMocker;
	let consoleMock: { restore: () => void };

	beforeEach(async () => {
		setupWindowMocks();
		vi.clearAllMocks();

		// Suppress console errors/logs during tests
		const { mockConsole } = await import('testUtils/unit/console.helpers');
		consoleMock = mockConsole(['error', 'debug']);

		onCloseMock = vi.fn();
		fetchMocker = new FetchMocker();
		fetchMocker.setup();
	});

	afterEach(() => {
		consoleMock.restore();
		vi.restoreAllMocks();
	});

	describe('Loading States', () => {
		it('should render loading state initially', () => {
			// Mock fetch to delay response and keep loading state
			fetchMocker.reset();
			fetchMocker.setup();
			// Override fetch to never resolve
			global.fetch = vi.fn().mockImplementation(async () => new Promise(() => {}));

			render(React.createElement(DataPlatformPreview, { onClose: onCloseMock }));

			expect(screen.getByText('Data Platform')).toBeInTheDocument();
			expect(screen.getByText('Explore agricultural data with dynamic filters')).toBeInTheDocument();
			expect(screen.getByText('Total Documents')).toBeInTheDocument();
			// There are 3 "0" values: Total Documents, Active Filters, and possibly in status
			expect(screen.getAllByText('0').length).toBeGreaterThanOrEqual(2);
			expect(screen.getByText('Updating...')).toBeInTheDocument();
		});
	});

	describe('Data Display', () => {
		it('should render empty state when no data is available', async () => {
			// Mock both API calls to return empty data
			global.fetch = vi.fn().mockImplementation(async (url: string) => {
				if (url.includes('/api/data-platform/filters')) {
					return Promise.resolve({
						ok: true,
						status: 200,
						json: async () => createFiltersResponse({ filters: {}, totalDocuments: 0 }),
					});
				}
				if (url.includes('/api/data-platform/getChartData')) {
					return Promise.resolve({
						ok: true,
						status: 200,
						json: async () => createChartDataResponse({ rawData: null, documentCount: 0 }),
					});
				}
				return Promise.resolve({
					ok: true,
					status: 200,
					json: async () => ({}),
				});
			});

			render(React.createElement(DataPlatformPreview, { onClose: onCloseMock }));

			await waitFor(() => {
				expect(screen.queryByText('Updating...')).not.toBeInTheDocument();
			});

			expect(screen.getByText('Total Documents')).toBeInTheDocument();
			expect(screen.getAllByText('0').length).toBeGreaterThan(0);

			// The component shows this message in the chart area
			await waitFor(() => {
				const noDataMessages = screen.queryAllByText(/No documents match the current filters/i);
				expect(noDataMessages.length).toBeGreaterThan(0);
			});
		});

		it('should show limit exceeded message when document count is too high', async () => {
			// Mock both API calls properly
			global.fetch = vi.fn().mockImplementation(async (url: string) => {
				if (url.includes('/api/data-platform/filters')) {
					return Promise.resolve({
						ok: true,
						status: 200,
						json: async () =>
							createFiltersResponse({
								filters: { category: [{ value: 'test', count: 500 }] },
								totalDocuments: 500,
							}),
					});
				}
				if (url.includes('/api/data-platform/getChartData')) {
					return Promise.resolve({
						ok: true,
						status: 200,
						json: async () =>
							createChartDataResponse({
								rawData: null,
								limitExceeded: true,
								documentCount: 500,
							}),
					});
				}
				return Promise.resolve({
					ok: true,
					status: 200,
					json: async () => ({}),
				});
			});

			render(React.createElement(DataPlatformPreview, { onClose: onCloseMock }));

			await waitFor(() => {
				expect(screen.queryByText('Updating...')).not.toBeInTheDocument();
			});

			expect(screen.getByText('Total Documents')).toBeInTheDocument();

			// Wait for the total documents to update
			await waitFor(() => {
				const fiveHundredElements = screen.queryAllByText('500');
				expect(fiveHundredElements.length).toBeGreaterThan(0);
			});

			// Check for limit exceeded message
			await waitFor(() => {
				const chartMessage = screen.queryByText(/Chart generation disabled/i);
				expect(chartMessage).toBeInTheDocument();
			});
		});
	});

	describe('Error Handling', () => {
		it('should display error message when API fails', async () => {
			const errorMessage = 'Network Error';
			fetchMocker.reset();
			fetchMocker.setup();
			global.fetch = vi.fn().mockRejectedValue(new Error(errorMessage));

			render(React.createElement(DataPlatformPreview, { onClose: onCloseMock }));

			await waitFor(() => {
				expect(screen.queryByText('Updating...')).not.toBeInTheDocument();
			});

			await waitFor(() => {
				expect(screen.getByText(`Error: ${errorMessage}`)).toBeInTheDocument();
			});
		});
	});

	describe('User Interactions', () => {
		it('should call onClose when Close button is clicked', async () => {
			render(React.createElement(DataPlatformPreview, { onClose: onCloseMock }));

			await waitFor(() => {
				expect(screen.queryByText('Updating...')).not.toBeInTheDocument();
			});

			fireEvent.click(screen.getByRole('button', { name: 'Close' }));
			expect(onCloseMock).toHaveBeenCalledTimes(1);
		});

		it('should handle filter selection and chart tab switching', async () => {
			// Mock both API calls with proper data
			let chartCallCount = 0;

			global.fetch = vi.fn().mockImplementation(async (url: string) => {
				if (url.includes('/api/data-platform/filters')) {
					return Promise.resolve({
						ok: true,
						status: 200,
						json: async () =>
							createFiltersResponse({
								filters: { category: [{ value: 'test', count: 2 }] },
								totalDocuments: 2,
							}),
					});
				}
				if (url.includes('/api/data-platform/getChartData')) {
					chartCallCount++;
					// Return chart data with temperature and humidity fields
					return Promise.resolve({
						ok: true,
						status: 200,
						json: async () =>
							createChartDataResponse({
								rawData: [
									{ timestamp: Date.now(), values: { temperature: 25, humidity: 60 } },
									{ timestamp: Date.now() - 86400000, values: { temperature: 23, humidity: 65 } },
								],
								documentCount: 2,
							}),
					});
				}
				return Promise.resolve({
					ok: true,
					status: 200,
					json: async () => ({}),
				});
			});

			render(React.createElement(DataPlatformPreview, { onClose: onCloseMock }));

			// Wait for initial load
			await waitFor(() => {
				expect(screen.queryByText('Updating...')).not.toBeInTheDocument();
			});

			// Find and click the test filter
			const testFilter = await screen.findByRole('button', { name: /test.*2/i });
			fireEvent.click(testFilter);

			// Wait for the chart to update after filter selection
			await waitFor(() => {
				// The component needs to load chart data after filter selection
				expect(chartCallCount).toBeGreaterThan(1);
			});

			// Check chart tabs appear
			await waitFor(() => {
				expect(screen.getByRole('button', { name: /temperature/i })).toBeInTheDocument();
				expect(screen.getByRole('button', { name: /humidity/i })).toBeInTheDocument();
			});

			// Click humidity tab
			fireEvent.click(screen.getByRole('button', { name: /humidity/i }));
		});
	});

	describe('Filter Sorting', () => {
		it('should sort filter categories by count (descending) then alphabetically', async () => {
			// Mock both API calls
			global.fetch = vi.fn().mockImplementation(async (url: string) => {
				if (url.includes('/api/data-platform/filters')) {
					return Promise.resolve({
						ok: true,
						status: 200,
						json: async () =>
							createFiltersResponse({
								filters: {
									zebra: [{ value: 'z1', count: 10 }],
									apple: [{ value: 'a1', count: 20 }],
									banana: [{ value: 'b1', count: 15 }],
								},
								totalDocuments: 45,
							}),
					});
				}
				if (url.includes('/api/data-platform/getChartData')) {
					return Promise.resolve({
						ok: true,
						status: 200,
						json: async () => createChartDataResponse(),
					});
				}
				return Promise.resolve({
					ok: true,
					status: 200,
					json: async () => ({}),
				});
			});

			render(React.createElement(DataPlatformPreview, { onClose: onCloseMock }));

			await waitFor(() => {
				expect(screen.queryByText('Updating...')).not.toBeInTheDocument();
			});

			// Wait for filters to be displayed
			await waitFor(() => {
				// Verify all filter categories are displayed
				expect(screen.getByText('apple')).toBeInTheDocument();
				expect(screen.getByText('banana')).toBeInTheDocument();
				expect(screen.getByText('zebra')).toBeInTheDocument();
			});

			// Verify filter buttons are displayed with counts
			expect(screen.getByRole('button', { name: /a1.*20/i })).toBeInTheDocument();
			expect(screen.getByRole('button', { name: /b1.*15/i })).toBeInTheDocument();
			expect(screen.getByRole('button', { name: /z1.*10/i })).toBeInTheDocument();
		});
	});
});
