import { useCallback, useState } from 'react';

import type { FoodProduct } from '../services/foodDatabase';
import { fetchFoodByBarcode } from '../services/foodDatabase';

interface UseScannerReturn {
	// State
	isScanning: boolean;
	isLoading: boolean;
	isSaving: boolean;
	scannedProduct: FoodProduct | null;
	scanError: string | null;

	// Actions
	startScan: () => void;
	cancelScan: () => void;
	handleScan: (barcode: string) => Promise<void>;
	clearProduct: () => void;
}

export function useScanner(): UseScannerReturn {
	const [isScanning, setIsScanning] = useState(false);
	const [isLoading, setIsLoading] = useState(false);
	const [isSaving, _setIsSaving] = useState(false);
	const [scannedProduct, setScannedProduct] = useState<FoodProduct | null>(null);
	const [scanError, setScanError] = useState<string | null>(null);

	const startScan = useCallback(() => {
		setIsScanning(true);
		setScannedProduct(null);
		setScanError(null);
	}, []);

	const cancelScan = useCallback(() => {
		setIsScanning(false);
		setScannedProduct(null);
		setScanError(null);
	}, []);

	const handleScan = useCallback(async (barcode: string) => {
		setIsScanning(false);
		setIsLoading(true);
		setScanError(null);

		try {
			const product = await fetchFoodByBarcode(barcode);

			if (product !== null) {
				setScannedProduct(product);
			} else {
				setScanError('Product not found. Try scanning another barcode.');
			}
		} catch (error) {
			setScanError('Failed to fetch product information. Please try again.');
			console.error('Scanner error:', error);
		} finally {
			setIsLoading(false);
		}
	}, []);

	const clearProduct = useCallback(() => {
		setScannedProduct(null);
		setScanError(null);
	}, []);

	return {
		isScanning,
		isLoading,
		isSaving,
		scannedProduct,
		scanError,
		startScan,
		cancelScan,
		handleScan,
		clearProduct,
	};
}
