'use client';

import { useEffect, useState } from 'react';
import { useZxing } from 'react-zxing';

interface BarcodeScannerProps {
	onScan: (barcode: string) => void;
	isActive: boolean;
}

export default function BarcodeScanner({ onScan, isActive }: BarcodeScannerProps) {
	const [hasPermission, setHasPermission] = useState<boolean | null>(null);
	const [error, setError] = useState<string | null>(null);

	const { ref } = useZxing({
		onResult(result) {
			const text = result?.getText();
			if (text) {
				onScan(text);
			}
		},
		onError(err) {
			console.error('Scanner error:', err);
			setError(err.message || 'Unknown scanner error');
		},
		paused: !isActive,
	});

	useEffect(() => {
		// Check for camera permissions
		if (isActive && typeof navigator !== 'undefined') {
			const { mediaDevices } = navigator;
			if (mediaDevices != null) {
				mediaDevices
					.getUserMedia({ video: true })
					.then(() => {
						setHasPermission(true);
					})
					.catch(() => {
						setHasPermission(false);
					});
			}
		}
	}, [isActive]);

	if (!isActive) {
		return null;
	}

	if (hasPermission === false) {
		return (
			<div className='text-center p-4'>
				<p className='text-red-500'>Camera permission denied</p>
				<p className='text-sm text-gray-600 dark:text-gray-400 mt-2'>Please allow camera access to scan barcodes</p>
			</div>
		);
	}

	if (error !== null && error !== '') {
		return (
			<div className='text-center p-4'>
				<p className='text-red-500'>Scanner error</p>
				<p className='text-sm text-gray-600 dark:text-gray-400 mt-2'>{error}</p>
			</div>
		);
	}

	return (
		<div className='relative w-full max-w-md mx-auto'>
			<video ref={ref} className='w-full h-64 object-cover rounded-lg' />
			<div className='absolute inset-0 border-2 border-green-500 rounded-lg pointer-events-none'>
				<div className='absolute inset-x-0 top-1/2 h-0.5 bg-green-500 animate-pulse'></div>
			</div>
			<p className='text-center text-sm text-gray-600 dark:text-gray-400 mt-2'>Position barcode within the frame</p>
		</div>
	);
}
