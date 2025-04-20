'use client';

import React, { useState, useEffect, useRef } from 'react';
import type { JSX } from 'react';
import {
	COOKIE_KEYS,
	DEFAULT_COLORS,
	setCookie,
	getCookie,
	PREDEFINED_PALETTES, // Import predefined palettes
} from '~/lib/palette';

// Define the type for a single palette
interface ColorPalette {
	PAGE_BG: string;
	FG_COLOR: string;
	PRIMARY_COLOR: string;
	TOPBAR_BG: string;
}

// Helper to detect if we're in test environment
const isTestEnvironment = (): boolean => {
	return typeof process !== 'undefined' && process.env.NODE_ENV === 'test';
};

export default function ColorsPage(): JSX.Element {
	// Initialize state with DEFAULT_COLORS but don't render them until properly loaded
	const [pageBg, setPageBg] = useState<string>(DEFAULT_COLORS.PAGE_BG);
	const [fgColor, setFgColor] = useState<string>(DEFAULT_COLORS.FG_COLOR);
	const [primaryColor, setPrimaryColor] = useState<string>(DEFAULT_COLORS.PRIMARY_COLOR);
	const [topbarBg, setTopbarBg] = useState<string>(DEFAULT_COLORS.TOPBAR_BG);
	// State for feedback messages (optional)
	const [clipboardStatus, setClipboardStatus] = useState<string>('');
	// Track if colors are loaded from cookies - initialize to true in test environment
	const [colorsLoaded, setColorsLoaded] = useState<boolean>(isTestEnvironment());
	// Track if the initial render has occurred
	const initialRenderRef = useRef<boolean>(true);

	// Effect: Load colors from cookies on mount and prevent applying styles until complete
	useEffect(() => {
		// In test environment, only skip the visual transition handling
		const inTestEnv = isTestEnvironment();

		// Prevent any color application until we've checked cookies
		if (!inTestEnv && initialRenderRef.current) {
			document.documentElement.classList.add('color-transition-paused');
			initialRenderRef.current = false;
		}

		// Always load cookies (even in test mode)
		const savedPageBg = getCookie(COOKIE_KEYS.PAGE_BG);
		const savedFgColor = getCookie(COOKIE_KEYS.FG_COLOR);
		const savedPrimaryColor = getCookie(COOKIE_KEYS.PRIMARY_COLOR);
		const savedTopbarBg = getCookie(COOKIE_KEYS.TOPBAR_BG);

		// Only update state if cookie values exist
		if (savedPageBg) setPageBg(savedPageBg);
		if (savedFgColor) setFgColor(savedFgColor);
		if (savedPrimaryColor) setPrimaryColor(savedPrimaryColor);
		if (savedTopbarBg) setTopbarBg(savedTopbarBg);

		// Only add delay in non-test environment
		if (!inTestEnv) {
			// Add a small delay to ensure DOM updates before removing class
			setTimeout(() => {
				document.documentElement.classList.remove('color-transition-paused');
				setColorsLoaded(true);
			}, 50);
		}

		// Cleanup function to remove class if component unmounts
		return () => {
			if (!inTestEnv) {
				document.documentElement.classList.remove('color-transition-paused');
			}
		};
	}, []); // Empty dependency array ensures this runs only once on mount

	// Effect: Apply colors to DOM when state changes (DOES NOT SAVE TO COOKIES)
	useEffect(() => {
		// Only apply colors when all values are loaded
		if (!colorsLoaded) return;

		// Apply colors to the DOM for instant feedback
		const rootStyle = document.documentElement.style;
		const bodyStyle = document.body.style;

		// Apply to both <html> and <body> to override initial inline styles
		rootStyle.setProperty('--page-background', pageBg);
		bodyStyle.setProperty('--page-background', pageBg);
		rootStyle.setProperty('--background', pageBg);
		bodyStyle.setProperty('--background', pageBg);

		rootStyle.setProperty('--foreground-color', fgColor);
		bodyStyle.setProperty('--foreground-color', fgColor);
		rootStyle.setProperty('--foreground', fgColor);
		bodyStyle.setProperty('--foreground', fgColor);

		rootStyle.setProperty('--primary-color', primaryColor);
		bodyStyle.setProperty('--primary-color', primaryColor);
		rootStyle.setProperty('--primary', primaryColor);
		bodyStyle.setProperty('--primary', primaryColor);

		rootStyle.setProperty('--topbar-background', topbarBg);
		bodyStyle.setProperty('--topbar-background', topbarBg);

		// Apply derived variables too
		rootStyle.setProperty('--secondary', topbarBg);
		bodyStyle.setProperty('--secondary', topbarBg);
		rootStyle.setProperty('--muted', topbarBg);
		bodyStyle.setProperty('--muted', topbarBg);
		rootStyle.setProperty('--border', topbarBg);
		bodyStyle.setProperty('--border', topbarBg);
		rootStyle.setProperty('--input', topbarBg);
		bodyStyle.setProperty('--input', topbarBg);

		// REMOVED: Saving to cookies is now handled by handleSaveColors
	}, [pageBg, fgColor, primaryColor, topbarBg, colorsLoaded]); // Re-run when colors change or when loaded

	// Function to apply a predefined palette
	const applyPalette = (palette: ColorPalette): void => {
		setPageBg(palette.PAGE_BG);
		setFgColor(palette.FG_COLOR);
		setPrimaryColor(palette.PRIMARY_COLOR);
		setTopbarBg(palette.TOPBAR_BG);
		setClipboardStatus(''); // Clear status on palette change
	};

	// Function to save current colors to cookies
	const handleSaveColors = (): void => {
		try {
			setCookie(COOKIE_KEYS.PAGE_BG, pageBg);
			setCookie(COOKIE_KEYS.FG_COLOR, fgColor);
			setCookie(COOKIE_KEYS.PRIMARY_COLOR, primaryColor);
			setCookie(COOKIE_KEYS.TOPBAR_BG, topbarBg);
			setClipboardStatus('Colors saved successfully!');
		} catch (error) {
			setClipboardStatus('Error saving colors.');
			console.error('Failed to save colors:', error);
		}
	};

	// Function to export colors to clipboard
	const handleExportColors = async (): Promise<void> => {
		const colorData: ColorPalette = {
			PAGE_BG: pageBg,
			FG_COLOR: fgColor,
			PRIMARY_COLOR: primaryColor,
			TOPBAR_BG: topbarBg,
		};
		const jsonString = JSON.stringify(colorData, null, 2); // Pretty print JSON
		try {
			await navigator.clipboard.writeText(jsonString);
			setClipboardStatus('Colors copied to clipboard!');
		} catch (err) {
			console.error('Failed to copy colors:', err);
			setClipboardStatus('Failed to copy colors to clipboard.');
		}
	};

	// Function to import colors from clipboard
	const handleImportColors = async (): Promise<void> => {
		try {
			const text = await navigator.clipboard.readText();
			const importedData = JSON.parse(text) as Partial<ColorPalette>; // Parse as partial for validation

			// Basic validation: Check if it's an object and has the expected keys with string values
			if (
				typeof importedData === 'object' && // Ensure it's an object first
				importedData !== null && // Ensure it's not null
				typeof importedData.PAGE_BG === 'string' &&
				typeof importedData.FG_COLOR === 'string' &&
				typeof importedData.PRIMARY_COLOR === 'string' &&
				typeof importedData.TOPBAR_BG === 'string'
			) {
				// Hex color validation (simple check for # and 3/4/6/8 hex chars)
				const hexRegex = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/;
				if (hexRegex.test(importedData.PAGE_BG) && hexRegex.test(importedData.FG_COLOR) && hexRegex.test(importedData.PRIMARY_COLOR) && hexRegex.test(importedData.TOPBAR_BG)) {
					setPageBg(importedData.PAGE_BG);
					setFgColor(importedData.FG_COLOR);
					setPrimaryColor(importedData.PRIMARY_COLOR);
					setTopbarBg(importedData.TOPBAR_BG);
					setClipboardStatus('Colors imported successfully!');
				} else {
					throw new Error('Invalid hex color format found in clipboard data.');
				}
			} else {
				throw new Error('Invalid or incomplete color data format in clipboard.');
			}
		} catch (err) {
			console.error('Failed to import colors:', err);
			let message = 'Failed to import colors from clipboard.';
			if (err instanceof Error) {
				message += ` ${err.message}`;
			}
			setClipboardStatus(message);
		}
	};

	// Clear status message after a delay
	useEffect(() => {
		if (clipboardStatus) {
			const timer = setTimeout(() => {
				setClipboardStatus('');
			}, 3000); // Clear after 3 seconds
			return () => {
				clearTimeout(timer);
			};
		}
	}, [clipboardStatus]);

	return (
		<div className='flex flex-col flex-grow w-full p-4 sm:p-6 md:p-8'>
			{/* Header: Title Only */}
			<div className='mb-4'>
				<h1>Color Theme Colors</h1>
				<p className='mt-2 text-muted-foreground'>Adjust the colors used across the site or choose a predefined palette.</p>
			</div>

			{/* Individual Color Pickers */}
			<div className='mt-8 p-4 border border-border rounded-lg'>
				<h2 className='text-lg font-semibold mb-4'>Customize Colors</h2>
				<div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4'>
					<label className='flex flex-col'>
						<span className='mb-1 text-sm font-medium'>Page Background</span>
						<div className='relative w-full h-10'>
							{colorsLoaded && (
								<input
									type='color'
									value={pageBg}
									onChange={(e) => {
										setPageBg(e.target.value);
									}}
									className='w-full h-10 rounded border border-input bg-input cursor-pointer'
								/>
							)}
							{!colorsLoaded && <div className='w-full h-10 opacity-0' />}
						</div>
					</label>
					<label className='flex flex-col'>
						<span className='mb-1 text-sm font-medium'>Foreground Text</span>
						<div className='relative w-full h-10'>
							{colorsLoaded && (
								<input
									type='color'
									value={fgColor}
									onChange={(e) => {
										setFgColor(e.target.value);
									}}
									className='w-full h-10 rounded border border-input bg-input cursor-pointer'
								/>
							)}
							{!colorsLoaded && <div className='w-full h-10 opacity-0' />}
						</div>
					</label>
					<label className='flex flex-col'>
						<span className='mb-1 text-sm font-medium'>Primary Color</span>
						<div className='relative w-full h-10'>
							{colorsLoaded && (
								<input
									type='color'
									value={primaryColor}
									onChange={(e) => {
										setPrimaryColor(e.target.value);
									}}
									className='w-full h-10 rounded border border-input bg-input cursor-pointer'
								/>
							)}
							{!colorsLoaded && <div className='w-full h-10 opacity-0' />}
						</div>
					</label>
					<label className='flex flex-col'>
						<span className='mb-1 text-sm font-medium'>Topbar Background</span>
						<div className='relative w-full h-10'>
							{colorsLoaded && (
								<input
									type='color'
									value={topbarBg}
									onChange={(e) => {
										setTopbarBg(e.target.value);
									}}
									className='w-full h-10 rounded border border-input bg-input cursor-pointer'
								/>
							)}
							{!colorsLoaded && <div className='w-full h-10 opacity-0' />}
						</div>
					</label>
				</div>
			</div>

			{/* Action Buttons & Status - Centered */}
			<div className='my-6 flex flex-col items-center gap-3'>
				<div className='flex gap-2 flex-shrink-0'>
					<button
						type='button'
						onClick={() => {
							void handleImportColors(); // Explicitly ignore promise return
						}}
						className='px-3 py-1.5 rounded-md border border-input bg-background hover:bg-accent hover:text-accent-foreground text-sm'
						title='Import colors from clipboard (JSON format)'
						disabled={!colorsLoaded}
					>
						Import
					</button>
					<button
						type='button'
						onClick={() => {
							void handleExportColors(); // Explicitly ignore promise return
						}}
						className='px-3 py-1.5 rounded-md border border-input bg-background hover:bg-accent hover:text-accent-foreground text-sm'
						title='Export current colors to clipboard (JSON format)'
						disabled={!colorsLoaded}
					>
						Export
					</button>
					<button type='button' onClick={handleSaveColors} className='px-4 py-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 text-sm font-semibold' disabled={!colorsLoaded}>
						Save
					</button>
				</div>
				{clipboardStatus && <p className='mt-2 text-sm text-muted-foreground'>{clipboardStatus}</p>}
			</div>

			{/* Predefined Palettes */}
			<div className='mt-8 p-4 border border-border rounded-lg'>
				<h2 className='text-lg font-semibold mb-4'>Predefined Palettes</h2>
				<div className='flex flex-wrap gap-3'>
					{Object.entries(PREDEFINED_PALETTES).map(([name, palette]) => (
						<button
							key={name}
							type='button'
							onClick={() => {
								applyPalette(palette as ColorPalette);
							}}
							className='px-4 py-2 rounded-md border border-border bg-secondary text-secondary-foreground hover:bg-secondary/80 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2'
							disabled={!colorsLoaded}
						>
							{name}
						</button>
					))}
				</div>
			</div>
		</div>
	);
}
