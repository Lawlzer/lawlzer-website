import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import * as foodDatabase from '../services/foodDatabase';

import { useScanner } from './useScanner';

// Mock the foodDatabase module
vi.mock('../services/foodDatabase', () => ({
	fetchFoodByBarcode: vi.fn(),
}));

describe('useScanner', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('should initialize with correct default state', () => {
		const { result } = renderHook(() => useScanner());

		expect(result.current.isScanning).toBe(false);
		expect(result.current.isLoading).toBe(false);
		expect(result.current.isSaving).toBe(false);
		expect(result.current.scannedProduct).toBe(null);
		expect(result.current.scanError).toBe(null);
	});

	it('should start scanning when startScan is called', () => {
		const { result } = renderHook(() => useScanner());

		act(() => {
			result.current.startScan();
		});

		expect(result.current.isScanning).toBe(true);
		expect(result.current.scannedProduct).toBe(null);
		expect(result.current.scanError).toBe(null);
	});

	it('should cancel scanning and clear state when cancelScan is called', () => {
		const { result } = renderHook(() => useScanner());

		// Set some initial state
		act(() => {
			result.current.startScan();
		});

		// Cancel scan
		act(() => {
			result.current.cancelScan();
		});

		expect(result.current.isScanning).toBe(false);
		expect(result.current.scannedProduct).toBe(null);
		expect(result.current.scanError).toBe(null);
	});

	it('should handle successful barcode scan', async () => {
		const mockProduct = {
			barcode: '123456789',
			name: 'Test Product',
			brand: 'Test Brand',
			nutrition: {
				calories: 100,
				protein: 10,
				carbs: 20,
				fat: 5,
				fiber: 2,
				sugar: 8,
				sodium: 150,
			},
		};

		vi.mocked(foodDatabase.fetchFoodByBarcode).mockResolvedValue(mockProduct);

		const { result } = renderHook(() => useScanner());

		await act(async () => {
			await result.current.handleScan('123456789');
		});

		expect(result.current.isScanning).toBe(false);
		expect(result.current.isLoading).toBe(false);
		expect(result.current.scannedProduct).toEqual(mockProduct);
		expect(result.current.scanError).toBe(null);
		expect(foodDatabase.fetchFoodByBarcode).toHaveBeenCalledWith('123456789');
	});

	it('should handle barcode scan when product not found', async () => {
		vi.mocked(foodDatabase.fetchFoodByBarcode).mockResolvedValue(null);

		const { result } = renderHook(() => useScanner());

		await act(async () => {
			await result.current.handleScan('999999999');
		});

		expect(result.current.isScanning).toBe(false);
		expect(result.current.isLoading).toBe(false);
		expect(result.current.scannedProduct).toBe(null);
		expect(result.current.scanError).toBe('Product not found. Try scanning another barcode.');
	});

	it('should handle errors during barcode scan', async () => {
		vi.mocked(foodDatabase.fetchFoodByBarcode).mockRejectedValue(new Error('Network error'));

		const { result } = renderHook(() => useScanner());

		await act(async () => {
			await result.current.handleScan('123456789');
		});

		expect(result.current.isScanning).toBe(false);
		expect(result.current.isLoading).toBe(false);
		expect(result.current.scannedProduct).toBe(null);
		expect(result.current.scanError).toBe('Failed to fetch product information. Please try again.');
	});

	it('should set loading state during scan', async () => {
		let resolvePromise: (value: any) => void;
		const promise = new Promise((resolve) => {
			resolvePromise = resolve;
		});

		vi.mocked(foodDatabase.fetchFoodByBarcode).mockReturnValue(promise as any);

		const { result } = renderHook(() => useScanner());

		// Start scan
		act(() => {
			void result.current.handleScan('123456789');
		});

		// Check loading state is true
		expect(result.current.isLoading).toBe(true);

		// Resolve the promise
		await act(async () => {
			resolvePromise!(null);
			await promise;
		});

		// Loading should be false after completion
		expect(result.current.isLoading).toBe(false);
	});

	it('should clear product and error when clearProduct is called', () => {
		const { result } = renderHook(() => useScanner());

		// Set some state first
		act(() => {
			result.current.startScan();
		});

		// Clear product
		act(() => {
			result.current.clearProduct();
		});

		expect(result.current.scannedProduct).toBe(null);
		expect(result.current.scanError).toBe(null);
	});
});
