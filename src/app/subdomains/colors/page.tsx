'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import type { JSX } from 'react';
import { COOKIE_KEYS, PREDEFINED_PALETTES, setCookie, getCookie, getDefaultColors, LIGHT_MODE_COLORS } from '~/lib/palette';
import { useRouter, usePathname } from 'next/navigation';
import type { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime';
import Head from 'next/head';

// Define the type for a single palette
interface ColorPalette {
	PAGE_BG: string;
	PRIMARY_TEXT_COLOR: string;
	PRIMARY_COLOR: string;
	SECONDARY_COLOR: string;
	SECONDARY_TEXT_COLOR: string;
	BORDER_COLOR: string;
}

// Extend Window interface for our custom property
declare global {
	interface Window {
		__NEXT_PROTECT_UNSAVED_CHANGES__?: (targetPath: string) => boolean;
	}
}

// Helper to detect if we're in test environment
const isTestEnvironment = (): boolean => {
	return typeof process !== 'undefined' && process.env.NODE_ENV === 'test';
};

export default function ColorsPage(): JSX.Element {
	// Safe check for testing environments where router might not be available
	let router: AppRouterInstance | undefined;
	let pathname: string = '/';
	try {
		router = useRouter();
		pathname = usePathname() || '/';
	} catch (e) {
		// Router is not available in test environment
	}

	const [paletteName, setPaletteName] = useState<string | null>(null);
	const [isClient, setIsClient] = useState(false);
	const [initialDefaults, setInitialDefaults] = useState(LIGHT_MODE_COLORS);

	// Determine defaults on client-side mount
	useEffect(() => {
		setInitialDefaults(getDefaultColors());
		setIsClient(true);
	}, []);

	// Initialize state with null initially, load from cookies/defaults in effect
	const [pageBg, setPageBg] = useState<string | null>(null);
	const [primaryTextColor, setPrimaryTextColor] = useState<string | null>(null);
	const [primaryColor, setPrimaryColor] = useState<string | null>(null);
	const [secondaryColor, setSecondaryColor] = useState<string | null>(null);
	const [secondaryTextColor, setSecondaryTextColor] = useState<string | null>(null);
	const [borderColor, setBorderColor] = useState<string | null>(null);
	// State for feedback messages (optional)
	const [clipboardStatus, setClipboardStatus] = useState<string>('');
	// Track if colors are loaded from cookies - initialize to true in test environment
	const [colorsLoaded, setColorsLoaded] = useState<boolean>(isTestEnvironment());
	// Track if the initial render has occurred
	const initialRenderRef = useRef<boolean>(true);
	// State to track if there are unsaved changes
	const [hasUnsavedChanges, setHasUnsavedChanges] = useState<boolean>(false);
	// State to control the confirmation dialog
	const [showConfirmDialog, setShowConfirmDialog] = useState<boolean>(false);
	// Store the intended navigation path
	const [pendingNavigation, setPendingNavigation] = useState<string | null>(null);

	// Track the last saved colors to detect actual changes
	// Initialize savedColors based on initialDefaults, update it when cookies load
	const [savedColors, setSavedColors] = useState<ColorPalette>(initialDefaults);
	useEffect(() => {
		setSavedColors(initialDefaults);
	}, [initialDefaults]);

	// Function to check if current colors differ from saved colors
	const checkForUnsavedChanges = useCallback((): boolean => {
		return pageBg !== savedColors.PAGE_BG || primaryTextColor !== savedColors.PRIMARY_TEXT_COLOR || primaryColor !== savedColors.PRIMARY_COLOR || secondaryColor !== savedColors.SECONDARY_COLOR || secondaryTextColor !== savedColors.SECONDARY_TEXT_COLOR || borderColor !== savedColors.BORDER_COLOR;
	}, [pageBg, primaryTextColor, primaryColor, secondaryColor, secondaryTextColor, borderColor, savedColors]);

	// Effect: Load colors from cookies on mount and prevent applying styles until complete
	useEffect(() => {
		// In test environment, only skip the visual transition handling
		const inTestEnv = isTestEnvironment();

		// Prevent any color application until we've checked cookies
		if (!inTestEnv && initialRenderRef.current) {
			document.documentElement.classList.add('color-transition-paused');
			initialRenderRef.current = false;
		}

		// Always load from cookies (even in test mode)
		const savedPageBg = getCookie(COOKIE_KEYS.PAGE_BG) ?? initialDefaults.PAGE_BG; // Use initialDefaults
		const savedPrimaryTextColor = getCookie(COOKIE_KEYS.PRIMARY_TEXT_COLOR) ?? initialDefaults.PRIMARY_TEXT_COLOR; // Use initialDefaults
		const savedPrimaryColor = getCookie(COOKIE_KEYS.PRIMARY_COLOR) ?? initialDefaults.PRIMARY_COLOR; // Use initialDefaults
		const savedSecondaryColor = getCookie(COOKIE_KEYS.SECONDARY_COLOR) ?? initialDefaults.SECONDARY_COLOR; // Use initialDefaults
		const savedSecondaryTextColor = getCookie(COOKIE_KEYS.SECONDARY_TEXT_COLOR) ?? initialDefaults.SECONDARY_TEXT_COLOR; // Use initialDefaults
		const savedBorderColor = getCookie(COOKIE_KEYS.BORDER_COLOR) ?? initialDefaults.BORDER_COLOR; // Use initialDefaults

		// Store the saved values used for comparison
		setSavedColors({
			PAGE_BG: savedPageBg,
			PRIMARY_TEXT_COLOR: savedPrimaryTextColor,
			PRIMARY_COLOR: savedPrimaryColor,
			SECONDARY_COLOR: savedSecondaryColor,
			SECONDARY_TEXT_COLOR: savedSecondaryTextColor,
			BORDER_COLOR: savedBorderColor,
		});

		// Update the actual color state for the inputs
		setPageBg(savedPageBg);
		setPrimaryTextColor(savedPrimaryTextColor);
		setPrimaryColor(savedPrimaryColor);
		setSecondaryColor(savedSecondaryColor);
		setSecondaryTextColor(savedSecondaryTextColor);
		setBorderColor(savedBorderColor);

		// Initial load should not count as unsaved changes
		setHasUnsavedChanges(false);

		// Only add delay in non-test environment
		if (!inTestEnv) {
			// Add a small delay to ensure DOM updates before removing class
			setTimeout(() => {
				document.documentElement.classList.remove('color-transition-paused');
				setColorsLoaded(true);
			}, 50);
		} else {
			setColorsLoaded(true); // Ensure colorsLoaded is set in test env
		}

		// Cleanup function to remove class if component unmounts
		return () => {
			if (!inTestEnv) {
				document.documentElement.classList.remove('color-transition-paused');
			}
		};
	}, [initialDefaults]); // Depend only on initialDefaults

	// Effect: Apply colors to DOM when state changes (DOES NOT SAVE TO COOKIES)
	useEffect(() => {
		// Only apply colors when all values are loaded and state is not null
		if (!colorsLoaded || pageBg === null || primaryTextColor === null || primaryColor === null || secondaryColor === null || secondaryTextColor === null || borderColor === null) return;

		// Apply colors to the DOM for instant feedback
		const rootStyle = document.documentElement.style;
		const bodyStyle = document.body.style;

		// Apply to both <html> and <body> to override initial inline styles
		rootStyle.setProperty('--page-background', pageBg ?? '');
		bodyStyle.setProperty('--page-background', pageBg ?? '');
		rootStyle.setProperty('--background', pageBg ?? '');
		bodyStyle.setProperty('--background', pageBg ?? '');

		rootStyle.setProperty('--primary-text-color', primaryTextColor ?? '');
		bodyStyle.setProperty('--primary-text-color', primaryTextColor ?? '');
		rootStyle.setProperty('--foreground', primaryTextColor ?? '');
		bodyStyle.setProperty('--foreground', primaryTextColor ?? '');

		rootStyle.setProperty('--primary-color', primaryColor ?? '');
		bodyStyle.setProperty('--primary-color', primaryColor ?? '');
		rootStyle.setProperty('--primary', primaryColor ?? '');
		bodyStyle.setProperty('--primary', primaryColor ?? '');

		// Add primary-foreground for text on primary colored elements
		rootStyle.setProperty('--primary-foreground', primaryTextColor ?? '');
		bodyStyle.setProperty('--primary-foreground', primaryTextColor ?? '');

		rootStyle.setProperty('--secondary-colour', secondaryColor ?? '');
		bodyStyle.setProperty('--secondary-colour', secondaryColor ?? '');

		// Apply derived variables
		rootStyle.setProperty('--secondary', secondaryColor ?? '');
		bodyStyle.setProperty('--secondary', secondaryColor ?? '');
		rootStyle.setProperty('--muted', secondaryColor ?? '');
		bodyStyle.setProperty('--muted', secondaryColor ?? '');
		rootStyle.setProperty('--input', secondaryColor ?? '');
		bodyStyle.setProperty('--input', secondaryColor ?? '');

		rootStyle.setProperty('--secondary-text-color', secondaryTextColor ?? '');
		bodyStyle.setProperty('--secondary-text-color', secondaryTextColor ?? '');
		rootStyle.setProperty('--secondary-text', secondaryTextColor ?? '');
		bodyStyle.setProperty('--secondary-text', secondaryTextColor ?? '');

		rootStyle.setProperty('--custom-border-color', borderColor ?? '');
		bodyStyle.setProperty('--custom-border-color', borderColor ?? '');
		rootStyle.setProperty('--border', borderColor ?? '');
		bodyStyle.setProperty('--border', borderColor ?? '');

		// Check if colors have actually changed from the saved values
		if (colorsLoaded) {
			setHasUnsavedChanges(checkForUnsavedChanges());
		}
	}, [pageBg, primaryTextColor, primaryColor, secondaryColor, secondaryTextColor, borderColor, colorsLoaded, checkForUnsavedChanges]);

	// Function to apply a predefined palette
	const applyPalette = (palette: ColorPalette): void => {
		setPageBg(palette.PAGE_BG);
		setPrimaryTextColor(palette.PRIMARY_TEXT_COLOR);
		setPrimaryColor(palette.PRIMARY_COLOR);
		setSecondaryColor(palette.SECONDARY_COLOR);
		setSecondaryTextColor(palette.SECONDARY_TEXT_COLOR);
		setBorderColor(palette.BORDER_COLOR);
		setClipboardStatus(''); // Clear status on palette change
	};

	// Function to save current colors to cookies
	const handleSaveColors = useCallback((): void => {
		// Ensure all values are non-null before saving
		if (pageBg === null || primaryTextColor === null || primaryColor === null || secondaryColor === null || secondaryTextColor === null || borderColor === null) {
			console.error('Attempted to save null color values.');
			setClipboardStatus('Error: Cannot save invalid colors.');
			return;
		}

		try {
			setCookie(COOKIE_KEYS.PAGE_BG, pageBg);
			setCookie(COOKIE_KEYS.PRIMARY_TEXT_COLOR, primaryTextColor);
			setCookie(COOKIE_KEYS.PRIMARY_COLOR, primaryColor);
			setCookie(COOKIE_KEYS.SECONDARY_COLOR, secondaryColor);
			setCookie(COOKIE_KEYS.SECONDARY_TEXT_COLOR, secondaryTextColor);
			setCookie(COOKIE_KEYS.BORDER_COLOR, borderColor);

			// Update the saved colors reference (already guaranteed non-null here)
			setSavedColors({
				PAGE_BG: pageBg,
				PRIMARY_TEXT_COLOR: primaryTextColor,
				PRIMARY_COLOR: primaryColor,
				SECONDARY_COLOR: secondaryColor,
				SECONDARY_TEXT_COLOR: secondaryTextColor,
				BORDER_COLOR: borderColor,
			});

			setClipboardStatus('Colors saved successfully!');
			setHasUnsavedChanges(false); // Mark changes as saved

			// If there was a pending navigation, execute it now
			if (pendingNavigation && router) {
				router.push(pendingNavigation);
				setPendingNavigation(null);
			}
		} catch (error) {
			setClipboardStatus('Error saving colors.');
			console.error('Failed to save colors:', error);
		}
	}, [pageBg, primaryTextColor, primaryColor, secondaryColor, secondaryTextColor, borderColor, pendingNavigation, router]);

	// Function to handle link/route changes
	const handleRouteChange = useCallback(
		(path: string): void => {
			if (hasUnsavedChanges) {
				// Store the intended navigation path
				setPendingNavigation(path);
				// Show confirmation dialog
				setShowConfirmDialog(true);
			} else if (router) {
				// No unsaved changes, navigate directly if router is available
				router.push(path);
			}
		},
		[hasUnsavedChanges, router]
	);

	// Function to continue navigation without saving
	const handleContinueWithoutSaving = useCallback((): void => {
		setHasUnsavedChanges(false);
		setShowConfirmDialog(false);

		if (pendingNavigation && router) {
			router.push(pendingNavigation);
			setPendingNavigation(null);
		}
	}, [pendingNavigation, router]);

	// Function to cancel navigation
	const handleCancelNavigation = useCallback((): void => {
		setShowConfirmDialog(false);
		setPendingNavigation(null);
	}, []);

	// Function to handle beforeunload event (for browser navigation/refresh)
	const handleBeforeUnload = useCallback(
		(e: BeforeUnloadEvent): string => {
			if (hasUnsavedChanges) {
				// Standard way to show a confirmation dialog when closing/refreshing the page
				e.preventDefault();
				e.returnValue = '';
				return '';
			}
			return '';
		},
		[hasUnsavedChanges]
	);

	// Listen for beforeunload event
	useEffect(() => {
		window.addEventListener('beforeunload', handleBeforeUnload);
		return () => {
			window.removeEventListener('beforeunload', handleBeforeUnload);
		};
	}, [handleBeforeUnload]);

	// This effect sets up intercepting Link component navigation attempts
	useEffect(() => {
		// Define a global function to check if navigation should be intercepted
		window.__NEXT_PROTECT_UNSAVED_CHANGES__ = (targetPath: string): boolean => {
			// If we have unsaved changes, intercept the navigation
			if (hasUnsavedChanges && targetPath !== pathname) {
				handleRouteChange(targetPath);
				return true; // Returning true prevents default navigation
			}
			return false; // Returning false allows default navigation
		};

		return () => {
			// Clean up
			delete window.__NEXT_PROTECT_UNSAVED_CHANGES__;
		};
	}, [hasUnsavedChanges, pathname, handleRouteChange]);

	// Function to export colors to clipboard
	const handleExportColors = async (): Promise<void> => {
		// Ensure all values are non-null before exporting
		if (pageBg === null || primaryTextColor === null || primaryColor === null || secondaryColor === null || secondaryTextColor === null || borderColor === null) {
			console.error('Attempted to export null color values.');
			setClipboardStatus('Error: Cannot export invalid colors.');
			return;
		}
		const colorData: ColorPalette = {
			PAGE_BG: pageBg, // Guaranteed non-null here
			PRIMARY_TEXT_COLOR: primaryTextColor, // Guaranteed non-null here
			PRIMARY_COLOR: primaryColor, // Guaranteed non-null here
			SECONDARY_COLOR: secondaryColor, // Guaranteed non-null here
			SECONDARY_TEXT_COLOR: secondaryTextColor, // Guaranteed non-null here
			BORDER_COLOR: borderColor, // Guaranteed non-null here
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
				typeof importedData.PRIMARY_TEXT_COLOR === 'string' &&
				typeof importedData.PRIMARY_COLOR === 'string' &&
				typeof importedData.SECONDARY_COLOR === 'string' &&
				typeof importedData.SECONDARY_TEXT_COLOR === 'string' &&
				typeof importedData.BORDER_COLOR === 'string'
			) {
				// Hex color validation (simple check for # and 3/4/6/8 hex chars)
				const hexRegex = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/;
				if (hexRegex.test(importedData.PAGE_BG) && hexRegex.test(importedData.PRIMARY_TEXT_COLOR) && hexRegex.test(importedData.PRIMARY_COLOR) && hexRegex.test(importedData.SECONDARY_COLOR) && hexRegex.test(importedData.SECONDARY_TEXT_COLOR) && hexRegex.test(importedData.BORDER_COLOR)) {
					setPageBg(importedData.PAGE_BG);
					setPrimaryTextColor(importedData.PRIMARY_TEXT_COLOR);
					setPrimaryColor(importedData.PRIMARY_COLOR);
					setSecondaryColor(importedData.SECONDARY_COLOR);
					setSecondaryTextColor(importedData.SECONDARY_TEXT_COLOR);
					setBorderColor(importedData.BORDER_COLOR);
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

	// Function to reset colors to the last saved configuration from cookies
	const handleResetColors = (): void => {
		const savedPageBg = getCookie(COOKIE_KEYS.PAGE_BG) ?? initialDefaults.PAGE_BG; // Use initialDefaults
		const savedPrimaryTextColor = getCookie(COOKIE_KEYS.PRIMARY_TEXT_COLOR) ?? initialDefaults.PRIMARY_TEXT_COLOR; // Use initialDefaults
		const savedPrimaryColor = getCookie(COOKIE_KEYS.PRIMARY_COLOR) ?? initialDefaults.PRIMARY_COLOR; // Use initialDefaults
		const savedSecondaryColor = getCookie(COOKIE_KEYS.SECONDARY_COLOR) ?? initialDefaults.SECONDARY_COLOR; // Use initialDefaults
		const savedSecondaryTextColor = getCookie(COOKIE_KEYS.SECONDARY_TEXT_COLOR) ?? initialDefaults.SECONDARY_TEXT_COLOR; // Use initialDefaults
		const savedBorderColor = getCookie(COOKIE_KEYS.BORDER_COLOR) ?? initialDefaults.BORDER_COLOR; // Use initialDefaults

		setPageBg(savedPageBg);
		setPrimaryTextColor(savedPrimaryTextColor);
		setPrimaryColor(savedPrimaryColor);
		setSecondaryColor(savedSecondaryColor);
		setSecondaryTextColor(savedSecondaryTextColor);
		setBorderColor(savedBorderColor);

		// This action reverts to saved state, so unsaved changes are gone
		setHasUnsavedChanges(false);
		setClipboardStatus(''); // Clear status on reset

		// Check if the reset colors match a predefined palette
		const resetColors = {
			PAGE_BG: savedPageBg,
			PRIMARY_TEXT_COLOR: savedPrimaryTextColor,
			PRIMARY_COLOR: savedPrimaryColor,
			SECONDARY_COLOR: savedSecondaryColor,
			SECONDARY_TEXT_COLOR: savedSecondaryTextColor,
			BORDER_COLOR: savedBorderColor,
		};
		const matchingPalette = Object.entries(PREDEFINED_PALETTES).find(([, palette]) => JSON.stringify(palette) === JSON.stringify(resetColors));
		setPaletteName(matchingPalette ? matchingPalette[0] : null);
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

	// Reset colors to default determined by system preference
	const handleResetToSystemDefaults = useCallback(() => {
		const defaults = getDefaultColors(); // Get current system defaults
		applyPalette(defaults);
		const matchingPalette = Object.entries(PREDEFINED_PALETTES).find(([, palette]) => JSON.stringify(palette) === JSON.stringify(defaults));
		setPaletteName(matchingPalette ? matchingPalette[0] : null);
		setClipboardStatus('');
	}, [applyPalette]);

	// Function to handle confirming navigation away
	const confirmNavigation = (allow: boolean): void => {
		if (allow && pendingNavigation && router) {
			// Temporarily disable the hook to allow navigation
			const originalHandler = window.__NEXT_PROTECT_UNSAVED_CHANGES__;
			window.__NEXT_PROTECT_UNSAVED_CHANGES__ = undefined;
			router.push(pendingNavigation);
			// Attempt to restore the hook after navigation starts
			setTimeout(() => {
				window.__NEXT_PROTECT_UNSAVED_CHANGES__ = originalHandler;
			}, 0);
		}
		setShowConfirmDialog(false);
		setPendingNavigation(null);
	};

	// Render inputs only on the client after defaults are determined
	if (!colorsLoaded || !isClient) {
		return <></>; // Return empty fragment instead of null
	}

	return (
		<div className='flex flex-col w-full min-h-0 h-full overflow-y-auto'>
			<Head>
				<title>Color Theme Colors</title>
			</Head>
			<div className='p-4 sm:p-6 md:p-8 pb-16'>
				{/* Header: Title Only */}
				<div className='mb-4'>
					<h1>Color Theme Colors</h1>
					<p className='mt-2 text-secondary-text'>Adjust the colors used across the site or choose a predefined palette.</p>
				</div>

				{/* Individual Color Pickers */}
				<div className='mt-8 p-4 border border-border rounded-lg'>
					<h2 className='text-lg font-semibold mb-4'>Customize Colors</h2>
					<div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4'>
						<label className='flex flex-col'>
							<span className='mb-1 text-sm font-medium'>Page Background</span>
							<div className='relative w-full h-10'>
								{colorsLoaded && (
									<input
										type='color'
										value={pageBg ?? ''}
										onChange={(e) => {
											setPageBg(e.target.value);
										}}
										className='w-full h-10 rounded border border-border bg-input cursor-pointer'
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
										value={primaryColor ?? ''}
										onChange={(e) => {
											setPrimaryColor(e.target.value);
										}}
										className='w-full h-10 rounded border border-border bg-input cursor-pointer'
									/>
								)}
								{!colorsLoaded && <div className='w-full h-10 opacity-0' />}
							</div>
						</label>
						<label className='flex flex-col'>
							<span className='mb-1 text-sm font-medium'>Secondary Colour</span>
							<div className='relative w-full h-10'>
								{colorsLoaded && (
									<input
										type='color'
										value={secondaryColor ?? ''}
										onChange={(e) => {
											setSecondaryColor(e.target.value);
										}}
										className='w-full h-10 rounded border border-border bg-input cursor-pointer'
									/>
								)}
								{!colorsLoaded && <div className='w-full h-10 opacity-0' />}
							</div>
						</label>
						<label className='flex flex-col'>
							<span className='mb-1 text-sm font-medium'>Primary Text</span>
							<div className='relative w-full h-10'>
								{colorsLoaded && (
									<input
										type='color'
										value={primaryTextColor ?? ''}
										onChange={(e) => {
											setPrimaryTextColor(e.target.value);
										}}
										className='w-full h-10 rounded border border-border bg-input cursor-pointer'
									/>
								)}
								{!colorsLoaded && <div className='w-full h-10 opacity-0' />}
							</div>
						</label>
						<label className='flex flex-col'>
							<span className='mb-1 text-sm font-medium'>Secondary Text</span>
							<div className='relative w-full h-10'>
								{colorsLoaded && (
									<input
										type='color'
										value={secondaryTextColor ?? ''}
										onChange={(e) => {
											setSecondaryTextColor(e.target.value);
										}}
										className='w-full h-10 rounded border border-border bg-input cursor-pointer'
									/>
								)}
								{!colorsLoaded && <div className='w-full h-10 opacity-0' />}
							</div>
						</label>
						<label className='flex flex-col'>
							<span className='mb-1 text-sm font-medium'>Border Color</span>
							<div className='relative w-full h-10'>
								{colorsLoaded && (
									<input
										type='color'
										value={borderColor ?? ''}
										onChange={(e) => {
											setBorderColor(e.target.value);
										}}
										className='w-full h-10 rounded border border-border bg-input cursor-pointer'
									/>
								)}
								{!colorsLoaded && <div className='w-full h-10 opacity-0' />}
							</div>
						</label>
					</div>
				</div>

				{/* Action Buttons & Status - Centered */}
				<div className='my-6 flex flex-col items-center gap-4'>
					<div className='flex gap-3 flex-shrink-0 flex-wrap justify-center'>
						<button
							type='button'
							onClick={() => {
								void handleImportColors();
							}}
							className='px-5 py-2.5 rounded-md border border-border bg-background hover:bg-accent hover:text-accent-foreground text-base'
							title='Import colors from clipboard (JSON format)'
							disabled={!colorsLoaded}
						>
							Import
						</button>
						<button
							type='button'
							onClick={() => {
								void handleExportColors();
							}}
							className='px-5 py-2.5 rounded-md border border-border bg-background hover:bg-accent hover:text-accent-foreground text-base'
							title='Export current colors to clipboard (JSON format)'
							disabled={!colorsLoaded}
						>
							Export
						</button>
						<button type='button' onClick={handleResetColors} className='px-5 py-2.5 rounded-md border border-border bg-background hover:bg-accent hover:text-accent-foreground text-base' title='Reset to last saved configuration' disabled={!colorsLoaded || !hasUnsavedChanges}>
							Reset
						</button>
						<button type='button' onClick={handleSaveColors} className='px-6 py-2.5 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 text-base font-semibold' disabled={!colorsLoaded || !hasUnsavedChanges}>
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
								className='px-4 py-2 rounded-md border border-border hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2'
								style={{
									backgroundColor: (palette as ColorPalette).PAGE_BG,
									color: (palette as ColorPalette).PRIMARY_TEXT_COLOR,
									borderColor: (palette as ColorPalette).BORDER_COLOR,
								}}
								disabled={!colorsLoaded}
							>
								{name}
							</button>
						))}
					</div>
				</div>

				{/* Confirmation Dialog */}
				{showConfirmDialog && (
					<div className='fixed inset-0 bg-black/50 flex items-center justify-center z-50'>
						<div className='bg-background p-6 rounded-lg max-w-md w-full shadow-lg'>
							<h3 className='text-lg font-medium mb-3'>Unsaved Changes</h3>
							<p className='mb-4'>You have unsaved color changes. Would you like to save them before leaving?</p>
							<div className='flex justify-end gap-3'>
								<button onClick={handleCancelNavigation} className='px-3 py-1.5 rounded-md border border-border bg-background hover:bg-accent hover:text-accent-foreground text-sm'>
									Cancel
								</button>
								<button onClick={handleContinueWithoutSaving} className='px-3 py-1.5 rounded-md border border-border bg-background hover:bg-accent hover:text-accent-foreground text-sm'>
									Continue Without Saving
								</button>
								<button onClick={handleSaveColors} className='px-4 py-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 text-sm font-semibold'>
									Save & Continue
								</button>
							</div>
						</div>
					</div>
				)}
			</div>
		</div>
	);
}
