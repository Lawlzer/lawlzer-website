'use client';

// import type { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime'; // Unused import
import { ArrowDownTrayIcon, ArrowPathIcon, ArrowUpTrayIcon, CheckIcon, CubeIcon, FireIcon, GlobeAltIcon, HeartIcon, MoonIcon, PaintBrushIcon, SparklesIcon, SunIcon, SwatchIcon } from '@heroicons/react/24/outline';
import { ExclamationTriangleIcon } from '@heroicons/react/24/solid';
import { AnimatePresence, motion } from 'framer-motion';
import Head from 'next/head';
import { usePathname, useRouter } from 'next/navigation';
import type { JSX } from 'react';
import React, { useCallback, useEffect, useRef, useState } from 'react';

import { COOKIE_KEYS, getCookie, getDefaultColors, LIGHT_MODE_COLORS, PREDEFINED_PALETTES, setCookie } from '~/lib/palette';

// Throttle utility to prevent lag when dragging color picker
function throttle<T extends (...args: any[]) => void>(func: T, limit: number): T {
	let inThrottle: boolean;
	let lastArgs: Parameters<T> | null = null;

	return ((...args: Parameters<T>) => {
		if (!inThrottle) {
			func(...args);
			inThrottle = true;
			setTimeout(() => {
				inThrottle = false;
				if (lastArgs) {
					func(...lastArgs);
					lastArgs = null;
				}
			}, limit);
		} else {
			lastArgs = args;
		}
	}) as T;
}

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
const isTestEnvironment = (): boolean => typeof process !== 'undefined' && process.env.NODE_ENV === 'test';

// Add helper for palette icons
const paletteIcons: Record<string, React.ElementType> = {
	'Light Mode': SunIcon,
	'Dark Mode': MoonIcon,
	'Darker Mode': MoonIcon,
	'Soft Pastel': SparklesIcon,
	'Ocean Breeze': GlobeAltIcon,
	'Sunset Glow': FireIcon,
	'Forest Calm': PaintBrushIcon,
	'Midnight Blue': MoonIcon,
	'Warm Earth': HeartIcon,
	'Cotton Candy': HeartIcon,
	Cyberpunk: CubeIcon,
	'Solarized Light': SunIcon,
	'Gruvbox Dark': MoonIcon,
};

export default function ColorsPage(): JSX.Element {
	// Always call hooks unconditionally
	const router = useRouter();
	const pathname = usePathname();

	const [paletteName, setPaletteName] = useState<string | null>(null);

	const [isClient, setIsClient] = useState<boolean>(false);
	const [initialDefaults, setInitialDefaults] = useState<ColorPalette>(LIGHT_MODE_COLORS);

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

	// Create throttled versions of the color setters to prevent lag
	const throttledSetPageBg = useRef(throttle(setPageBg, 50)).current;
	const throttledSetPrimaryTextColor = useRef(throttle(setPrimaryTextColor, 50)).current;
	const throttledSetPrimaryColor = useRef(throttle(setPrimaryColor, 50)).current;
	const throttledSetSecondaryColor = useRef(throttle(setSecondaryColor, 50)).current;
	const throttledSetSecondaryTextColor = useRef(throttle(setSecondaryTextColor, 50)).current;
	const throttledSetBorderColor = useRef(throttle(setBorderColor, 50)).current;
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
	const checkForUnsavedChanges = useCallback((): boolean => pageBg !== savedColors.PAGE_BG || primaryTextColor !== savedColors.PRIMARY_TEXT_COLOR || primaryColor !== savedColors.PRIMARY_COLOR || secondaryColor !== savedColors.SECONDARY_COLOR || secondaryTextColor !== savedColors.SECONDARY_TEXT_COLOR || borderColor !== savedColors.BORDER_COLOR, [pageBg, primaryTextColor, primaryColor, secondaryColor, secondaryTextColor, borderColor, savedColors]);

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

		// Check if current colors match a predefined palette
		const currentColors = {
			PAGE_BG: savedPageBg,
			PRIMARY_TEXT_COLOR: savedPrimaryTextColor,
			PRIMARY_COLOR: savedPrimaryColor,
			SECONDARY_COLOR: savedSecondaryColor,
			SECONDARY_TEXT_COLOR: savedSecondaryTextColor,
			BORDER_COLOR: savedBorderColor,
		};
		const matchingPalette = Object.entries(PREDEFINED_PALETTES).find(([, palette]) => JSON.stringify(palette) === JSON.stringify(currentColors));
		setPaletteName(matchingPalette ? matchingPalette[0] : null);

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

		// Check if current colors match a predefined palette
		const currentColors = {
			PAGE_BG: pageBg,
			PRIMARY_TEXT_COLOR: primaryTextColor,
			PRIMARY_COLOR: primaryColor,
			SECONDARY_COLOR: secondaryColor,
			SECONDARY_TEXT_COLOR: secondaryTextColor,
			BORDER_COLOR: borderColor,
		};
		const matchingPalette = Object.entries(PREDEFINED_PALETTES).find(([, palette]) => JSON.stringify(palette) === JSON.stringify(currentColors));
		setPaletteName(matchingPalette ? matchingPalette[0] : null);
	}, [pageBg, primaryTextColor, primaryColor, secondaryColor, secondaryTextColor, borderColor, colorsLoaded, checkForUnsavedChanges]);

	// Function to apply a predefined palette
	const applyPalette = useCallback((palette: ColorPalette): void => {
		setPageBg(palette.PAGE_BG);
		setPrimaryTextColor(palette.PRIMARY_TEXT_COLOR);
		setPrimaryColor(palette.PRIMARY_COLOR);
		setSecondaryColor(palette.SECONDARY_COLOR);
		setSecondaryTextColor(palette.SECONDARY_TEXT_COLOR);
		setBorderColor(palette.BORDER_COLOR);
		setClipboardStatus(''); // Clear status on palette change
	}, []);

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
			if (pendingNavigation !== null && pendingNavigation.trim().length > 0) {
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
			} else {
				// No unsaved changes, navigate directly
				router.push(path);
			}
		},
		[hasUnsavedChanges, router]
	);

	// Function to continue navigation without saving
	const handleContinueWithoutSaving = useCallback((): void => {
		setHasUnsavedChanges(false);
		setShowConfirmDialog(false);

		const hasPendingNavigation = pendingNavigation !== null && pendingNavigation.trim().length > 0;
		if (hasPendingNavigation) {
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
	const handleExportColors = useCallback((): void => {
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
		navigator.clipboard
			.writeText(jsonString)
			.then(() => {
				setClipboardStatus('Colors copied to clipboard!');
			})
			.catch((err) => {
				console.error('Failed to copy colors:', err);
				setClipboardStatus('Failed to copy colors to clipboard.');
			});
	}, [pageBg, primaryTextColor, primaryColor, secondaryColor, secondaryTextColor, borderColor]);

	// Function to import colors from clipboard
	const handleImportColors = useCallback((): void => {
		navigator.clipboard
			.readText()
			.then((text) => {
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
			})
			.catch((err) => {
				console.error('Failed to import colors:', err);
				let message = 'Failed to import colors from clipboard.';
				if (err instanceof Error) {
					message += ` ${err.message}`;
				}
				setClipboardStatus(message);
			});
	}, []);

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
		if (clipboardStatus.length > 0) {
			const timer = setTimeout(() => {
				setClipboardStatus('');
			}, 3000); // Clear after 3 seconds
			return () => {
				clearTimeout(timer);
			};
		}
	}, [clipboardStatus]);

	// Render inputs only on the client after defaults are determined
	if (!colorsLoaded || !isClient) {
		return (
			<div className='flex h-full min-h-0 w-full flex-col items-center justify-center'>
				<motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }} className='mb-4 h-12 w-12 rounded-full border-4 border-primary border-t-transparent' />
				<p className='text-secondary-text'>Loading color settings...</p>
			</div>
		);
	}

	return (
		<div className='relative flex h-full min-h-0 w-full flex-col overflow-y-auto bg-gradient-to-br from-background via-background to-secondary/10'>
			<Head>
				<title>Color Theme Customizer</title>
			</Head>

			{/* Unsaved Changes Banner */}
			<AnimatePresence>
				{hasUnsavedChanges && (
					<motion.div initial={{ y: -60, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -60, opacity: 0 }} transition={{ type: 'spring', stiffness: 400, damping: 30 }} className='fixed top-0 left-0 right-0 z-50 bg-primary/90 border-b border-primary shadow-md'>
						<div className='px-4 py-3 sm:px-6'>
							<div className='flex items-center justify-between gap-4'>
								<div className='flex items-center gap-2'>
									<ExclamationTriangleIcon className='h-5 w-5 text-primary-foreground' />
									<p className='text-sm font-medium text-primary-foreground'>You have unsaved changes</p>
								</div>
								<div className='flex items-center gap-2'>
									<motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={handleResetColors} className='px-3 py-1.5 text-sm font-medium text-primary-foreground/70 hover:text-primary-foreground transition-colors'>
										Discard
									</motion.button>
									<motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={handleSaveColors} className='inline-flex items-center gap-1.5 rounded-lg bg-primary-foreground/10 px-4 py-1.5 text-sm font-medium text-primary-foreground shadow-sm hover:bg-primary-foreground/20 transition-all'>
										<CheckIcon className='h-4 w-4' />
										Save Changes
									</motion.button>
								</div>
							</div>
						</div>
					</motion.div>
				)}
			</AnimatePresence>

			<div className='p-4 pb-8 sm:p-6 md:p-6 lg:p-8'>
				{/* Header */}
				<motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className='mb-6 text-center'>
					<h1 className='text-3xl font-bold tracking-tight text-foreground sm:text-4xl mb-2'>Color Theme Studio</h1>
					<p className='text-base text-secondary-text max-w-2xl mx-auto'>Customize the color scheme to match your style.</p>
				</motion.div>

				{/* Color Customization */}
				<motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className='mb-6 mx-auto max-w-6xl'>
					<div className='rounded-2xl border border-border bg-card/50 p-6 shadow-lg'>
						<h2 className='mb-6 text-xl font-bold text-foreground flex items-center gap-3'>
							<PaintBrushIcon className='h-5 w-5 text-primary' />
							Custom Colors
						</h2>
						<div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4'>
							{[
								{ label: 'Background', value: pageBg, setter: setPageBg, throttledSetter: throttledSetPageBg, icon: '🎨' },
								{ label: 'Primary Color', value: primaryColor, setter: setPrimaryColor, throttledSetter: throttledSetPrimaryColor, icon: '🌟' },
								{ label: 'Secondary Background', value: secondaryColor, setter: setSecondaryColor, throttledSetter: throttledSetSecondaryColor, icon: '🎭' },
								{ label: 'Text Color', value: primaryTextColor, setter: setPrimaryTextColor, throttledSetter: throttledSetPrimaryTextColor, icon: '✏️' },
								{ label: 'Secondary Text', value: secondaryTextColor, setter: setSecondaryTextColor, throttledSetter: throttledSetSecondaryTextColor, icon: '📝' },
								{ label: 'Border Color', value: borderColor, setter: setBorderColor, throttledSetter: throttledSetBorderColor, icon: '🖼️' },
							].map((color) => (
								<motion.div key={color.label} whileHover={{ scale: 1.02 }} className='group relative'>
									<label className='block'>
										<span className='mb-1.5 flex items-center gap-2 text-sm font-medium text-foreground'>
											<span className='text-base'>{color.icon}</span>
											{color.label}
										</span>
										<div className='relative'>
											<input
												type='color'
												value={color.value ?? ''}
												onChange={(e) => {
													color.throttledSetter(e.target.value);
												}}
												className='h-16 w-full cursor-pointer rounded-lg border-2 border-border transition-all hover:border-primary focus:border-primary focus:ring-4 focus:ring-primary/20'
											/>
										</div>
									</label>
								</motion.div>
							))}
						</div>

						{/* Action Buttons */}
						<div className='mt-6 flex flex-wrap items-center justify-center gap-2'>
							<motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={handleImportColors} className='inline-flex items-center gap-2 rounded-lg bg-card border border-border px-4 py-2.5 text-sm font-medium text-foreground shadow-sm hover:bg-secondary transition-all'>
								<ArrowDownTrayIcon className='h-4 w-4' />
								Import
							</motion.button>
							<motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={handleExportColors} className='inline-flex items-center gap-2 rounded-lg bg-card border border-border px-4 py-2.5 text-sm font-medium text-foreground shadow-sm hover:bg-secondary transition-all'>
								<ArrowUpTrayIcon className='h-4 w-4' />
								Export
							</motion.button>
							<motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={handleResetColors} className='inline-flex items-center gap-2 rounded-lg bg-card border border-border px-4 py-2.5 text-sm font-medium text-foreground shadow-sm hover:bg-secondary transition-all'>
								<ArrowPathIcon className='h-4 w-4' />
								Reset
							</motion.button>
							{hasUnsavedChanges && (
								<motion.button initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={handleSaveColors} className='inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground shadow-lg hover:bg-primary/90 transition-all'>
									<CheckIcon className='h-4 w-4' />
									Save Colors
								</motion.button>
							)}
						</div>
					</div>
				</motion.div>

				{/* Predefined Palettes */}
				<motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className='mx-auto max-w-6xl'>
					<h2 className='mb-4 text-xl font-bold text-foreground text-center'>Predefined Themes</h2>
					<div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3'>
						{Object.entries(PREDEFINED_PALETTES).map(([name, palette], index) => {
							const Icon = paletteIcons[name] ?? SwatchIcon;
							const isActive = paletteName === name;

							return (
								<motion.div key={name} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: index * 0.05 }} whileHover={{ y: -2 }} className='relative'>
									<button
										onClick={() => {
											applyPalette(palette);
										}}
										className={`
											relative w-full overflow-hidden rounded-xl border-2 p-3 text-left transition-all
											${isActive ? 'border-primary bg-primary/5 shadow-lg' : 'border-border bg-card hover:border-primary/50 hover:shadow-md'}
										`}
									>
										{isActive && <motion.div layoutId='activePaletteIndicator' className='absolute inset-0 bg-primary/10 rounded-xl' transition={{ type: 'spring', stiffness: 500, damping: 30 }} />}

										<div className='relative z-10'>
											<div className='mb-2 flex items-center justify-between'>
												<Icon className={`h-4 w-4 ${isActive ? 'text-primary' : 'text-secondary-text'}`} />
												{isActive && (
													<motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className='rounded-full bg-primary p-0.5'>
														<CheckIcon className='h-2.5 w-2.5 text-primary-foreground' />
													</motion.div>
												)}
											</div>

											<h3 className='mb-2 text-sm font-semibold text-foreground'>{name}</h3>

											<div className='grid grid-cols-3 gap-1'>
												<motion.div whileHover={{ scale: 1.1 }} className='h-6 rounded-md shadow-sm ring-1 ring-black/5' style={{ backgroundColor: palette.PAGE_BG }} title='Background' />
												<motion.div whileHover={{ scale: 1.1 }} className='h-6 rounded-md shadow-sm ring-1 ring-black/5' style={{ backgroundColor: palette.PRIMARY_COLOR }} title='Primary Color' />
												<motion.div whileHover={{ scale: 1.1 }} className='h-6 rounded-md shadow-sm ring-1 ring-black/5' style={{ backgroundColor: palette.SECONDARY_COLOR }} title='Secondary Color' />
											</div>

											{/* Additional color swatches */}
											<div className='mt-1.5 flex gap-0.5'>
												<div className='h-1.5 flex-1 rounded-full opacity-60' style={{ backgroundColor: palette.PRIMARY_TEXT_COLOR }} title='Text Color' />
												<div className='h-1.5 flex-1 rounded-full opacity-60' style={{ backgroundColor: palette.SECONDARY_TEXT_COLOR }} title='Secondary Text' />
												<div className='h-1.5 flex-1 rounded-full opacity-60' style={{ backgroundColor: palette.BORDER_COLOR }} title='Border Color' />
											</div>
										</div>
									</button>
								</motion.div>
							);
						})}
					</div>
				</motion.div>
			</div>

			{/* Status Messages */}
			<AnimatePresence>
				{clipboardStatus.length > 0 && (
					<motion.div initial={{ opacity: 0, y: 20, scale: 0.9 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 20, scale: 0.9 }} className='fixed bottom-6 right-6 z-30'>
						<div className={clipboardStatus.includes('Error') || clipboardStatus.includes('Failed') ? 'rounded-lg px-4 py-3 shadow-lg backdrop-blur-sm bg-red-500/90 text-white' : 'rounded-lg px-4 py-3 shadow-lg backdrop-blur-sm bg-primary/90 text-primary-foreground'}>
							<p className='text-sm font-medium'>{clipboardStatus}</p>
						</div>
					</motion.div>
				)}
			</AnimatePresence>

			{/* Confirmation Dialog */}
			<AnimatePresence>
				{showConfirmDialog && (
					<motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className='fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4'>
						<motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className='w-full max-w-md rounded-2xl bg-card p-6 shadow-2xl'>
							<div className='mb-6'>
								<div className='mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10'>
									<ExclamationTriangleIcon className='h-6 w-6 text-primary' />
								</div>
								<h3 className='text-xl font-bold text-foreground'>Unsaved Changes</h3>
								<p className='mt-2 text-secondary-text'>You have unsaved color changes. Would you like to save them before leaving?</p>
							</div>

							<div className='flex flex-col gap-3'>
								<motion.button
									whileHover={{ scale: 1.02 }}
									whileTap={{ scale: 0.98 }}
									onClick={() => {
										handleSaveColors();
										setShowConfirmDialog(false);
									}}
									className='w-full rounded-lg bg-primary px-4 py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-all'
								>
									Save & Continue
								</motion.button>
								<motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={handleContinueWithoutSaving} className='w-full rounded-lg border border-border bg-background px-4 py-3 text-sm font-medium text-foreground hover:bg-secondary transition-all'>
									Discard Changes
								</motion.button>
								<motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={handleCancelNavigation} className='w-full rounded-lg px-4 py-3 text-sm font-medium text-secondary-text hover:text-foreground transition-all'>
									Cancel
								</motion.button>
							</div>
						</motion.div>
					</motion.div>
				)}
			</AnimatePresence>
		</div>
	);
}
