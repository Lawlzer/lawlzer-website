'use client';

import dynamic from 'next/dynamic';

import { CameraIcon } from '../Icons';
import type { FoodProduct } from '../../services/foodDatabase';

// Dynamically import BarcodeScanner to avoid SSR issues
const BarcodeScannerComponent = dynamic(
  async () => import('../BarcodeScanner'),
  { ssr: false }
);

interface ScanTabProps {
  isScanning: boolean;
  isLoading: boolean;
  scannedProduct: FoodProduct | null;
  scanError: string | null;
  isSaving: boolean;
  saveStatus: { type: 'error' | 'success'; message: string } | null;
  onStartScan: () => void;
  onScan: (barcode: string) => void;
  onSaveFood: () => void;
  onCancelScan: () => void;
}

export function ScanTab({
  isScanning,
  isLoading,
  scannedProduct,
  scanError,
  isSaving,
  saveStatus,
  onStartScan,
  onScan,
  onSaveFood,
  onCancelScan,
}: ScanTabProps) {
  return (
    <div className="space-y-4">
      <div className="rounded-lg border p-6">
        <h2 className="text-xl font-bold mb-2">Barcode Scanner</h2>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          Scan a food product barcode to quickly add nutrition information
        </p>

        {!isScanning && !isLoading && scannedProduct === null && (
          <div className="flex flex-col items-center space-y-4">
            <div className="h-64 w-full max-w-md rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-700 flex items-center justify-center">
              <p className="text-gray-500">Click below to start scanning</p>
            </div>
            <button
              onClick={onStartScan}
              className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-2"
            >
              <CameraIcon />
              Start Scanning
            </button>
            {scanError && <p className="text-red-500 text-sm">{scanError}</p>}
          </div>
        )}

        {isScanning && (
          <BarcodeScannerComponent onScan={onScan} isActive={isScanning} />
        )}

        {isLoading && (
          <div className="flex flex-col items-center justify-center py-10">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            <p className="mt-4 text-gray-600 dark:text-gray-400">
              Looking up product...
            </p>
          </div>
        )}
      </div>

      {scannedProduct && (
        <div className="rounded-lg border p-6">
          <h3 className="text-lg font-bold mb-4">Scanned Product</h3>
          <div className="space-y-4">
            <div>
              <h4 className="font-semibold">{scannedProduct.name}</h4>
              {scannedProduct.brand && (
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {scannedProduct.brand}
                </p>
              )}
              <p className="text-xs text-gray-500 mt-1">
                Barcode: {scannedProduct.barcode}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <h5 className="font-medium">Nutrition per 100g:</h5>
                <div className="text-sm space-y-1">
                  <p>
                    Calories: {scannedProduct.nutrition.calories.toFixed(0)}{' '}
                    kcal
                  </p>
                  <p>Protein: {scannedProduct.nutrition.protein.toFixed(1)}g</p>
                  <p>Carbs: {scannedProduct.nutrition.carbs.toFixed(1)}g</p>
                  <p>Fat: {scannedProduct.nutrition.fat.toFixed(1)}g</p>
                </div>
              </div>
              <div className="space-y-2">
                <h5 className="font-medium">Additional:</h5>
                <div className="text-sm space-y-1">
                  <p>Fiber: {scannedProduct.nutrition.fiber.toFixed(1)}g</p>
                  <p>Sugar: {scannedProduct.nutrition.sugar.toFixed(1)}g</p>
                  <p>Sodium: {scannedProduct.nutrition.sodium.toFixed(0)}mg</p>
                </div>
              </div>
            </div>

            <div className="flex gap-2 mt-4">
              <button
                className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50"
                onClick={onSaveFood}
                disabled={isSaving}
              >
                {isSaving ? 'Saving...' : 'Save to My Foods'}
              </button>
              <button
                onClick={onCancelScan}
                className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
              >
                Scan Another
              </button>
            </div>
            {saveStatus && (
              <div
                className={`mt-4 p-3 rounded-lg ${
                  saveStatus.type === 'success'
                    ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                    : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                }`}
              >
                {saveStatus.message}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
