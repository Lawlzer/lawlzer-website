'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';

import { COOKIE_KEYS, getCookie, getDefaultColors, LIGHT_MODE_COLORS, PREDEFINED_PALETTES, setCookie } from '~/lib/palette';

interface ColorPalette {
	PAGE_BG: string;
	PRIMARY_TEXT_COLOR: string;
	PRIMARY_COLOR: string;
	SECONDARY_COLOR: string;
	SECONDARY_TEXT_COLOR: string;
	BORDER_COLOR: string;
}

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

const isTestEnvironment = (): boolean => typeof process !== 'undefined' && process.env.NODE_ENV === 'test';

function loadColorsFromCookies(defaults: ColorPalette): ColorPalette {
	return {
		PAGE_BG: getCookie(COOKIE_KEYS.PAGE_BG) ?? defaults.PAGE_BG,
		PRIMARY_TEXT_COLOR: getCookie(COOKIE_KEYS.PRIMARY_TEXT_COLOR) ?? defaults.PRIMARY_TEXT_COLOR,
		PRIMARY_COLOR: getCookie(COOKIE_KEYS.PRIMARY_COLOR) ?? defaults.PRIMARY_COLOR,
		SECONDARY_COLOR: getCookie(COOKIE_KEYS.SECONDARY_COLOR) ?? defaults.SECONDARY_COLOR,
		SECONDARY_TEXT_COLOR: getCookie(COOKIE_KEYS.SECONDARY_TEXT_COLOR) ?? defaults.SECONDARY_TEXT_COLOR,
		BORDER_COLOR: getCookie(COOKIE_KEYS.BORDER_COLOR) ?? defaults.BORDER_COLOR,
	};
}

function findPaletteName(colors: ColorPalette): string | null {
	const match = Object.entries(PREDEFINED_PALETTES).find(([, p]) => JSON.stringify(p) === JSON.stringify(colors));
	return match != null ? match[0] : null;
}

function applyColorsToDom(pageBg: string, primaryTextColor: string, primaryColor: string, secondaryColor: string, secondaryTextColor: string, borderColor: string): void {
	const rs = document.documentElement.style;
	const bs = document.body.style;
	const setVar = (name: string, value: string): void => {
		rs.setProperty(name, value);
		bs.setProperty(name, value);
	};
	setVar('--page-background', pageBg);
	setVar('--background', pageBg);
	setVar('--primary-text-color', primaryTextColor);
	setVar('--foreground', primaryTextColor);
	setVar('--primary-foreground', primaryTextColor);
	setVar('--primary-color', primaryColor);
	setVar('--primary', primaryColor);
	setVar('--secondary-colour', secondaryColor);
	setVar('--secondary', secondaryColor);
	setVar('--muted', secondaryColor);
	setVar('--input', secondaryColor);
	setVar('--secondary-text-color', secondaryTextColor);
	setVar('--secondary-text', secondaryTextColor);
	setVar('--custom-border-color', borderColor);
	setVar('--border', borderColor);
}

function saveColorsToCookies(colors: ColorPalette): void {
	setCookie(COOKIE_KEYS.PAGE_BG, colors.PAGE_BG);
	setCookie(COOKIE_KEYS.PRIMARY_TEXT_COLOR, colors.PRIMARY_TEXT_COLOR);
	setCookie(COOKIE_KEYS.PRIMARY_COLOR, colors.PRIMARY_COLOR);
	setCookie(COOKIE_KEYS.SECONDARY_COLOR, colors.SECONDARY_COLOR);
	setCookie(COOKIE_KEYS.SECONDARY_TEXT_COLOR, colors.SECONDARY_TEXT_COLOR);
	setCookie(COOKIE_KEYS.BORDER_COLOR, colors.BORDER_COLOR);
}

function validateAndParseImport(text: string): ColorPalette {
	const imported = JSON.parse(text) as Partial<ColorPalette>;
	const hexRegex = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/;
	if (typeof imported !== 'object' || imported === null || typeof imported.PAGE_BG !== 'string' || typeof imported.PRIMARY_TEXT_COLOR !== 'string' || typeof imported.PRIMARY_COLOR !== 'string' || typeof imported.SECONDARY_COLOR !== 'string' || typeof imported.SECONDARY_TEXT_COLOR !== 'string' || typeof imported.BORDER_COLOR !== 'string') throw new Error('Invalid or incomplete color data format in clipboard.');
	if (!hexRegex.test(imported.PAGE_BG) || !hexRegex.test(imported.PRIMARY_TEXT_COLOR) || !hexRegex.test(imported.PRIMARY_COLOR) || !hexRegex.test(imported.SECONDARY_COLOR) || !hexRegex.test(imported.SECONDARY_TEXT_COLOR) || !hexRegex.test(imported.BORDER_COLOR)) throw new Error('Invalid hex color format found in clipboard data.');
	return imported as ColorPalette;
}

function getCurrentColors(pageBg: string | null, primaryTextColor: string | null, primaryColor: string | null, secondaryColor: string | null, secondaryTextColor: string | null, borderColor: string | null): ColorPalette | null {
	if (pageBg === null || primaryTextColor === null || primaryColor === null || secondaryColor === null || secondaryTextColor === null || borderColor === null) return null;
	return { PAGE_BG: pageBg, PRIMARY_TEXT_COLOR: primaryTextColor, PRIMARY_COLOR: primaryColor, SECONDARY_COLOR: secondaryColor, SECONDARY_TEXT_COLOR: secondaryTextColor, BORDER_COLOR: borderColor };
}

declare global {
	interface Window {
		__NEXT_PROTECT_UNSAVED_CHANGES__?: (targetPath: string) => boolean;
	}
}

export function useColorsPage(): {
	paletteName: string | null;
	isClient: boolean;
	colorsLoaded: boolean;
	hasUnsavedChanges: boolean;
	showConfirmDialog: boolean;
	clipboardStatus: string;
	pageBg: string | null;
	primaryTextColor: string | null;
	primaryColor: string | null;
	secondaryColor: string | null;
	secondaryTextColor: string | null;
	borderColor: string | null;
	throttledSetPageBg: (v: string) => void;
	throttledSetPrimaryTextColor: (v: string) => void;
	throttledSetPrimaryColor: (v: string) => void;
	throttledSetSecondaryColor: (v: string) => void;
	throttledSetSecondaryTextColor: (v: string) => void;
	throttledSetBorderColor: (v: string) => void;
	applyPalette: (palette: ColorPalette) => void;
	handleSaveColors: () => void;
	handleResetColors: () => void;
	handleExportColors: () => void;
	handleImportColors: () => void;
	handleContinueWithoutSaving: () => void;
	handleCancelNavigation: () => void;
	setShowConfirmDialog: (v: boolean) => void;
} {
	const router = useRouter();
	const pathname = usePathname();
	const [paletteName, setPaletteName] = useState<string | null>(null);
	const [isClient, setIsClient] = useState<boolean>(false);
	const [initialDefaults, setInitialDefaults] = useState<ColorPalette>(LIGHT_MODE_COLORS);
	useEffect(() => {
		setInitialDefaults(getDefaultColors());
		setIsClient(true);
	}, []);
	const [pageBg, setPageBg] = useState<string | null>(null);
	const [primaryTextColor, setPrimaryTextColor] = useState<string | null>(null);
	const [primaryColor, setPrimaryColor] = useState<string | null>(null);
	const [secondaryColor, setSecondaryColor] = useState<string | null>(null);
	const [secondaryTextColor, setSecondaryTextColor] = useState<string | null>(null);
	const [borderColor, setBorderColor] = useState<string | null>(null);
	const throttledSetPageBg = useRef(throttle(setPageBg, 50)).current;
	const throttledSetPrimaryTextColor = useRef(throttle(setPrimaryTextColor, 50)).current;
	const throttledSetPrimaryColor = useRef(throttle(setPrimaryColor, 50)).current;
	const throttledSetSecondaryColor = useRef(throttle(setSecondaryColor, 50)).current;
	const throttledSetSecondaryTextColor = useRef(throttle(setSecondaryTextColor, 50)).current;
	const throttledSetBorderColor = useRef(throttle(setBorderColor, 50)).current;
	const [clipboardStatus, setClipboardStatus] = useState<string>('');
	const [colorsLoaded, setColorsLoaded] = useState<boolean>(isTestEnvironment());
	const initialRenderRef = useRef<boolean>(true);
	const [hasUnsavedChanges, setHasUnsavedChanges] = useState<boolean>(false);
	const [showConfirmDialog, setShowConfirmDialog] = useState<boolean>(false);
	const [pendingNavigation, setPendingNavigation] = useState<string | null>(null);
	const [savedColors, setSavedColors] = useState<ColorPalette>(initialDefaults);
	useEffect(() => {
		setSavedColors(initialDefaults);
	}, [initialDefaults]);
	const checkForUnsavedChanges = useCallback((): boolean => pageBg !== savedColors.PAGE_BG || primaryTextColor !== savedColors.PRIMARY_TEXT_COLOR || primaryColor !== savedColors.PRIMARY_COLOR || secondaryColor !== savedColors.SECONDARY_COLOR || secondaryTextColor !== savedColors.SECONDARY_TEXT_COLOR || borderColor !== savedColors.BORDER_COLOR, [pageBg, primaryTextColor, primaryColor, secondaryColor, secondaryTextColor, borderColor, savedColors]);
	useEffect(() => {
		const inTest = isTestEnvironment();
		if (!inTest && initialRenderRef.current) {
			document.documentElement.classList.add('color-transition-paused');
			initialRenderRef.current = false;
		}
		const s = loadColorsFromCookies(initialDefaults);
		setSavedColors(s);
		setPageBg(s.PAGE_BG);
		setPrimaryTextColor(s.PRIMARY_TEXT_COLOR);
		setPrimaryColor(s.PRIMARY_COLOR);
		setSecondaryColor(s.SECONDARY_COLOR);
		setSecondaryTextColor(s.SECONDARY_TEXT_COLOR);
		setBorderColor(s.BORDER_COLOR);
		setHasUnsavedChanges(false);
		setPaletteName(findPaletteName(s));
		if (!inTest) {
			setTimeout(() => {
				document.documentElement.classList.remove('color-transition-paused');
				setColorsLoaded(true);
			}, 50);
		} else {
			setColorsLoaded(true);
		}
		return () => {
			if (!inTest) document.documentElement.classList.remove('color-transition-paused');
		};
	}, [initialDefaults]);
	useEffect(() => {
		if (!colorsLoaded || pageBg === null || primaryTextColor === null || primaryColor === null || secondaryColor === null || secondaryTextColor === null || borderColor === null) return;
		applyColorsToDom(pageBg, primaryTextColor, primaryColor, secondaryColor, secondaryTextColor, borderColor);
		if (colorsLoaded) setHasUnsavedChanges(checkForUnsavedChanges());
		setPaletteName(findPaletteName({ PAGE_BG: pageBg, PRIMARY_TEXT_COLOR: primaryTextColor, PRIMARY_COLOR: primaryColor, SECONDARY_COLOR: secondaryColor, SECONDARY_TEXT_COLOR: secondaryTextColor, BORDER_COLOR: borderColor }));
	}, [pageBg, primaryTextColor, primaryColor, secondaryColor, secondaryTextColor, borderColor, colorsLoaded, checkForUnsavedChanges]);
	const applyPalette = useCallback((p: ColorPalette): void => {
		setPageBg(p.PAGE_BG);
		setPrimaryTextColor(p.PRIMARY_TEXT_COLOR);
		setPrimaryColor(p.PRIMARY_COLOR);
		setSecondaryColor(p.SECONDARY_COLOR);
		setSecondaryTextColor(p.SECONDARY_TEXT_COLOR);
		setBorderColor(p.BORDER_COLOR);
		setClipboardStatus('');
	}, []);
	const handleSaveColors = useCallback((): void => {
		const c = getCurrentColors(pageBg, primaryTextColor, primaryColor, secondaryColor, secondaryTextColor, borderColor);
		if (c === null) {
			console.error('Attempted to save null color values.');
			setClipboardStatus('Error: Cannot save invalid colors.');
			return;
		}
		try {
			saveColorsToCookies(c);
			setSavedColors(c);
			setClipboardStatus('Colors saved successfully!');
			setHasUnsavedChanges(false);
			if (pendingNavigation !== null && pendingNavigation.trim().length > 0) {
				router.push(pendingNavigation);
				setPendingNavigation(null);
			}
		} catch (error) {
			setClipboardStatus('Error saving colors.');
			console.error('Failed to save colors:', error);
		}
	}, [pageBg, primaryTextColor, primaryColor, secondaryColor, secondaryTextColor, borderColor, pendingNavigation, router]);
	const handleRouteChange = useCallback(
		(path: string): void => {
			if (hasUnsavedChanges) {
				setPendingNavigation(path);
				setShowConfirmDialog(true);
			} else {
				router.push(path);
			}
		},
		[hasUnsavedChanges, router]
	);
	const handleContinueWithoutSaving = useCallback((): void => {
		setHasUnsavedChanges(false);
		setShowConfirmDialog(false);
		if (pendingNavigation !== null && pendingNavigation.trim().length > 0) {
			router.push(pendingNavigation);
			setPendingNavigation(null);
		}
	}, [pendingNavigation, router]);
	const handleCancelNavigation = useCallback((): void => {
		setShowConfirmDialog(false);
		setPendingNavigation(null);
	}, []);
	useEffect(() => {
		const h = (e: BeforeUnloadEvent): void => {
			if (hasUnsavedChanges) {
				e.preventDefault();
				e.returnValue = '';
			}
		};
		window.addEventListener('beforeunload', h);
		return () => {
			window.removeEventListener('beforeunload', h);
		};
	}, [hasUnsavedChanges]);
	useEffect(() => {
		window.__NEXT_PROTECT_UNSAVED_CHANGES__ = (tp: string): boolean => {
			if (hasUnsavedChanges && tp !== pathname) {
				handleRouteChange(tp);
				return true;
			}
			return false;
		};
		return () => {
			delete window.__NEXT_PROTECT_UNSAVED_CHANGES__;
		};
	}, [hasUnsavedChanges, pathname, handleRouteChange]);
	const handleExportColors = useCallback((): void => {
		const c = getCurrentColors(pageBg, primaryTextColor, primaryColor, secondaryColor, secondaryTextColor, borderColor);
		if (c === null) {
			console.error('Attempted to export null color values.');
			setClipboardStatus('Error: Cannot export invalid colors.');
			return;
		}
		navigator.clipboard
			.writeText(JSON.stringify(c, null, 2))
			.then(() => {
				setClipboardStatus('Colors copied to clipboard!');
			})
			.catch((err) => {
				console.error('Failed to copy colors:', err);
				setClipboardStatus('Failed to copy colors to clipboard.');
			});
	}, [pageBg, primaryTextColor, primaryColor, secondaryColor, secondaryTextColor, borderColor]);
	const handleImportColors = useCallback((): void => {
		navigator.clipboard
			.readText()
			.then((text) => {
				const v = validateAndParseImport(text);
				setPageBg(v.PAGE_BG);
				setPrimaryTextColor(v.PRIMARY_TEXT_COLOR);
				setPrimaryColor(v.PRIMARY_COLOR);
				setSecondaryColor(v.SECONDARY_COLOR);
				setSecondaryTextColor(v.SECONDARY_TEXT_COLOR);
				setBorderColor(v.BORDER_COLOR);
				setClipboardStatus('Colors imported successfully!');
			})
			.catch((err) => {
				console.error('Failed to import colors:', err);
				let msg = 'Failed to import colors from clipboard.';
				if (err instanceof Error) {
					msg += ` ${err.message}`;
				}
				setClipboardStatus(msg);
			});
	}, []);
	const handleResetColors = useCallback((): void => {
		const s = loadColorsFromCookies(initialDefaults);
		setPageBg(s.PAGE_BG);
		setPrimaryTextColor(s.PRIMARY_TEXT_COLOR);
		setPrimaryColor(s.PRIMARY_COLOR);
		setSecondaryColor(s.SECONDARY_COLOR);
		setSecondaryTextColor(s.SECONDARY_TEXT_COLOR);
		setBorderColor(s.BORDER_COLOR);
		setHasUnsavedChanges(false);
		setClipboardStatus('');
		setPaletteName(findPaletteName(s));
	}, [initialDefaults]);
	useEffect(() => {
		if (clipboardStatus.length > 0) {
			const t = setTimeout(() => {
				setClipboardStatus('');
			}, 3000);
			return () => {
				clearTimeout(t);
			};
		}
	}, [clipboardStatus]);
	return {
		paletteName,
		isClient,
		colorsLoaded,
		hasUnsavedChanges,
		showConfirmDialog,
		clipboardStatus,
		pageBg,
		primaryTextColor,
		primaryColor,
		secondaryColor,
		secondaryTextColor,
		borderColor,
		throttledSetPageBg,
		throttledSetPrimaryTextColor,
		throttledSetPrimaryColor,
		throttledSetSecondaryColor,
		throttledSetSecondaryTextColor,
		throttledSetBorderColor,
		applyPalette,
		handleSaveColors,
		handleResetColors,
		handleExportColors,
		handleImportColors,
		handleContinueWithoutSaving,
		handleCancelNavigation,
		setShowConfirmDialog,
	};
}
