'use client';

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import DataPlatformPreview from './DataPlatformPreview';
import type { AggregationResult } from './DataPlatformPreview';

// --- Mocks --- //

// Mock fetch API
const mockFetch = vi.fn();
global.fetch = mockFetch;

// --- Test Data --- //
const mockSuccessData: AggregationResult = {
	category_a: { ValueA1: 10, ValueA2: 5 },
	category_b: { ValueB1: 20 },
	category_c: { ValueC1: 15, ValueC2: 25, ValueC3: 8 }, // For sorting test
};

const mockEmptyData: AggregationResult = {};

// --- Test Suite --- //

describe('DataPlatformPreview Component', () => {
	let onCloseMock: ReturnType<typeof vi.fn>;

	beforeEach(() => {
		vi.clearAllMocks();
		onCloseMock = vi.fn();

		// Default successful fetch mock
		mockFetch.mockResolvedValue({
			ok: true,
			status: 200,
			json: async () => mockSuccessData,
		} as Response);
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	it('should render loading state initially', () => {
		render(React.createElement(DataPlatformPreview, { onClose: onCloseMock }));
		expect(screen.getByText('(Loading...)')).toBeInTheDocument();
		expect(screen.getByRole('heading', { name: /Data Platform - Filters/i })).toBeInTheDocument();
	});

	it('should render data correctly after successful fetch', async () => {
		render(React.createElement(DataPlatformPreview, { onClose: onCloseMock }));
		await waitFor(() => {
			expect(screen.queryByText('(Loading...)')).not.toBeInTheDocument();
		});

		const categories = screen.getAllByRole('heading', { level: 3 });
		// Categories are sorted by the highest count *within* that category descending.
		// category_c has max 25 (ValueC2)
		// category_b has max 20 (ValueB1)
		// category_a has max 10 (ValueA1)
		expect(categories[0]).toHaveTextContent('category c');
		expect(categories[1]).toHaveTextContent('category b');
		expect(categories[2]).toHaveTextContent('category a');

		expect(screen.getByRole('button', { name: /ValueA1 \(10\)/i })).toBeInTheDocument();
		expect(screen.getByRole('button', { name: /ValueB1 \(20\)/i })).toBeInTheDocument();
		expect(screen.getByRole('button', { name: /ValueC2 \(25\)/i })).toBeInTheDocument();
	});

	it('should render "No data" message when fetch returns empty data', async () => {
		mockFetch.mockResolvedValueOnce({
			ok: true,
			status: 200,
			json: async () => mockEmptyData,
		} as Response);

		render(React.createElement(DataPlatformPreview, { onClose: onCloseMock }));
		await waitFor(() => {
			expect(screen.queryByText('(Loading...)')).not.toBeInTheDocument();
		});
		expect(screen.getByText(/No data available or matching the current filters./i)).toBeInTheDocument();
	});

	it('should render error message when fetch fails', async () => {
		const errorMessage = 'Network Error';
		mockFetch.mockRejectedValueOnce(new Error(errorMessage));

		render(React.createElement(DataPlatformPreview, { onClose: onCloseMock }));
		await waitFor(() => {
			expect(screen.queryByText('(Loading...)')).not.toBeInTheDocument();
		});
		expect(screen.getByText(`Error loading data: ${errorMessage}`)).toBeInTheDocument();
		expect(screen.queryByRole('button', { name: /ValueA1/i })).not.toBeInTheDocument();
	});

	it('should handle filter toggle and trigger refetch', async () => {
		render(React.createElement(DataPlatformPreview, { onClose: onCloseMock }));
		await waitFor(() => {
			expect(screen.queryByText('(Loading...)')).not.toBeInTheDocument();
		});

		const filterButtonA1 = screen.getByRole('button', { name: /ValueA1 \(10\)/i });
		const filterButtonB1 = screen.getByRole('button', { name: /ValueB1 \(20\)/i });

		expect(mockFetch).toHaveBeenCalledTimes(1);
		expect(mockFetch).toHaveBeenCalledWith('/api/data-platform/aggregate?');

		fireEvent.click(filterButtonA1);
		await waitFor(() => {
			expect(mockFetch).toHaveBeenCalledTimes(2);
		});
		expect(mockFetch).toHaveBeenCalledWith(`/api/data-platform/aggregate?filters=${encodeURIComponent(JSON.stringify({ category_a: ['ValueA1'] }))}`);
		expect(filterButtonA1).toHaveClass('bg-primary');

		fireEvent.click(filterButtonB1);
		await waitFor(() => {
			expect(mockFetch).toHaveBeenCalledTimes(3);
		});
		expect(mockFetch).toHaveBeenCalledWith(`/api/data-platform/aggregate?filters=${encodeURIComponent(JSON.stringify({ category_a: ['ValueA1'], category_b: ['ValueB1'] }))}`);
		expect(filterButtonB1).toHaveClass('bg-primary');

		fireEvent.click(filterButtonA1);
		await waitFor(() => {
			expect(mockFetch).toHaveBeenCalledTimes(4);
		});
		expect(mockFetch).toHaveBeenCalledWith(`/api/data-platform/aggregate?filters=${encodeURIComponent(JSON.stringify({ category_b: ['ValueB1'] }))}`);
		expect(filterButtonA1).not.toHaveClass('bg-primary');
		expect(filterButtonA1).toHaveClass('bg-muted');

		fireEvent.click(filterButtonB1);
		await waitFor(() => {
			expect(mockFetch).toHaveBeenCalledTimes(5);
		});
		expect(mockFetch).toHaveBeenCalledWith('/api/data-platform/aggregate?');
		expect(filterButtonB1).not.toHaveClass('bg-primary');
		expect(filterButtonB1).toHaveClass('bg-muted');
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

	it('should sort filter values within a category by count desc, then alphabetically', async () => {
		const sortTestData: AggregationResult = {
			sorting_test: { C: 10, A: 20, B: 20, D: 5 },
		};
		mockFetch.mockResolvedValueOnce({
			ok: true,
			status: 200,
			json: async () => sortTestData,
		} as Response);

		render(React.createElement(DataPlatformPreview, { onClose: onCloseMock }));
		await waitFor(() => {
			expect(screen.queryByText('(Loading...)')).not.toBeInTheDocument();
		});

		const categoryDiv = screen.getByText('sorting test').closest('div');
		expect(categoryDiv).toBeInTheDocument();
		if (!categoryDiv) throw new Error('Category div not found');

		const buttons = Array.from(categoryDiv.querySelectorAll('button'));
		const buttonTexts = buttons.map((btn) => btn.textContent?.trim());
		expect(buttonTexts).toEqual(['A (20)', 'B (20)', 'C (10)', 'D (5)']);
	});

	it('should calculate min-width correctly based on longest value text', async () => {
		const widthTestData: AggregationResult = {
			width_test: { Short: 10, 'Very Long Value Name': 5 },
		};
		mockFetch.mockResolvedValueOnce({
			ok: true,
			status: 200,
			json: async () => widthTestData,
		} as Response);

		render(React.createElement(DataPlatformPreview, { onClose: onCloseMock }));
		await waitFor(() => {
			expect(screen.queryByText('(Loading...)')).not.toBeInTheDocument();
		});

		const longButton = screen.getByRole('button', { name: /Very Long Value Name \(5\)/i });
		const shortButton = screen.getByRole('button', { name: /Short \(10\)/i });

		const expectedLength = 'Very Long Value Name (5)'.length + 3;
		const expectedClass = `min-w-[${expectedLength}ch]`;

		expect(longButton).toHaveClass(expectedClass);
		expect(shortButton).toHaveClass(expectedClass);
	});
});
