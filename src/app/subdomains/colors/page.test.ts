'use client';

import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import ColorsPage from './page';

import type * as PaletteModule from '~/lib/palette';
import { COOKIE_KEYS, DARK_MODE_COLORS, getCookie, LIGHT_MODE_COLORS, setCookie } from '~/lib/palette';

// --- Mocks --- //

// Mock Next.js navigation hooks
vi.mock('next/navigation', () => ({
	useRouter: () => ({
		push: vi.fn(),
		replace: vi.fn(),
		prefetch: vi.fn(),
		back: vi.fn(),
		forward: vi.fn(),
		refresh: vi.fn(),
	}),
	usePathname: () => '/subdomains/colors',
	useSearchParams: () => new URLSearchParams(),
}));

// Mock the palette module
vi.mock('~/lib/palette', async (importOriginal) => {
	const actual = await importOriginal<typeof PaletteModule>();
	return {
		...actual, // Keep actual constants like LIGHT_MODE_COLORS, DARK_MODE_COLORS, etc.
		getCookie: vi.fn(),
		setCookie: vi.fn(),
		// We will mock getDefaultColors within tests if needed, otherwise use actual
		getDefaultColors: actual.getDefaultColors, // Keep actual unless mocked
	};
});

// Mock navigator.clipboard
const mockClipboard = {
	writeText: vi.fn(),
	readText: vi.fn(),
};
Object.defineProperty(navigator, 'clipboard', {
	writable: true,
	value: mockClipboard,
});

// Mock documentElement.style.setProperty (optional but good for verifying effects)
const mockSetProperty = vi.fn();
Object.defineProperty(document.documentElement, 'style', {
	writable: true,
	value: {
		setProperty: mockSetProperty,
		// Add other style properties if needed by the component
	},
});
Object.defineProperty(document.body, 'style', {
	writable: true,
	value: {
		setProperty: mockSetProperty,
	},
});

// Mock window.matchMedia
let matchMediaMock: ReturnType<typeof vi.fn>;
const setupMatchMediaMock = (matches: boolean): void => {
	matchMediaMock = vi.fn().mockImplementation((query) => ({
		matches: query === '(prefers-color-scheme: dark)' ? matches : false,
		media: query,
		onchange: null,
		addListener: vi.fn(), // deprecated
		removeListener: vi.fn(), // deprecated
		addEventListener: vi.fn(),
		removeEventListener: vi.fn(),
		dispatchEvent: vi.fn(),
	}));
	Object.defineProperty(window, 'matchMedia', {
		writable: true,
		configurable: true,
		value: matchMediaMock,
	});
};

// --- Test Suite --- //

describe('ColorsPage Component', () => {
	const getCookieMock = getCookie as ReturnType<typeof vi.fn>;
	const setCookieMock = setCookie as ReturnType<typeof vi.fn>;

	beforeEach(() => {
		vi.clearAllMocks();
		// Default mock return values for getCookie (no saved cookies)
		getCookieMock.mockReturnValue(null);
		// Reset clipboard mocks
		mockClipboard.writeText.mockResolvedValue(undefined);
		mockClipboard.readText.mockResolvedValue('');
		// Default to light mode for matchMedia unless overridden in test
		setupMatchMediaMock(false);
	});

	it('should render with default colors if no cookies are set', () => {
		render(React.createElement(ColorsPage));

		expect(screen.getByLabelText('Page Background')).toHaveValue(LIGHT_MODE_COLORS.PAGE_BG);
		expect(screen.getByLabelText('Primary Color')).toHaveValue(LIGHT_MODE_COLORS.PRIMARY_COLOR);
		expect(screen.getByLabelText('Secondary Colour')).toHaveValue(LIGHT_MODE_COLORS.SECONDARY_COLOR);
		expect(screen.getByLabelText('Primary Text')).toHaveValue(LIGHT_MODE_COLORS.PRIMARY_TEXT_COLOR);
		expect(screen.getByLabelText('Secondary Text')).toHaveValue(LIGHT_MODE_COLORS.SECONDARY_TEXT_COLOR);
		expect(screen.getByLabelText('Border Color')).toHaveValue(LIGHT_MODE_COLORS.BORDER_COLOR);
	});

	it('should load colors from cookies on mount', () => {
		getCookieMock.mockImplementation((name: string) => {
			switch (name) {
				case COOKIE_KEYS.PAGE_BG:
					return '#111111';
				case COOKIE_KEYS.PRIMARY_COLOR:
					return '#333333';
				case COOKIE_KEYS.SECONDARY_COLOR:
					return '#444444';
				case COOKIE_KEYS.PRIMARY_TEXT_COLOR:
					return '#222222';
				case COOKIE_KEYS.SECONDARY_TEXT_COLOR:
					return '#555555';
				default:
					return null;
			}
		});

		render(React.createElement(ColorsPage));

		expect(screen.getByLabelText('Page Background')).toHaveValue('#111111');
		expect(screen.getByLabelText('Primary Color')).toHaveValue('#333333');
		expect(screen.getByLabelText('Secondary Colour')).toHaveValue('#444444');
		expect(screen.getByLabelText('Primary Text')).toHaveValue('#222222');
		expect(screen.getByLabelText('Secondary Text')).toHaveValue('#555555');
	});

	it('should update color state and DOM when input changes', () => {
		render(React.createElement(ColorsPage));
		const pageBgInput = screen.getByLabelText('Page Background');

		fireEvent.change(pageBgInput, { target: { value: '#abcdef' } });

		expect(pageBgInput).toHaveValue('#abcdef');

		// Check if style.setProperty was called (at least once for this change)
		// Note: This checks if it was called, not the exact args across all properties
		expect(mockSetProperty).toHaveBeenCalledWith(
			expect.stringContaining('background'), // Check for --page-background or --background
			'#abcdef'
		);
	});

	it('should call setCookie for each color when Save button is clicked', async () => {
		render(React.createElement(ColorsPage));
		const saveButton = screen.getByRole('button', { name: 'Save' });

		// Change a color first to ensure it saves the current state
		fireEvent.change(screen.getByLabelText('Page Background'), { target: { value: '#123456' } });

		act(() => {
			fireEvent.click(saveButton);
		});

		await waitFor(() => {
			// Check that cookies are set with the actual values from LIGHT_MODE_COLORS (except the changed one)
			expect(setCookieMock).toHaveBeenCalledWith(COOKIE_KEYS.PAGE_BG, '#123456'); // The changed value
			expect(setCookieMock).toHaveBeenCalledWith(COOKIE_KEYS.PRIMARY_TEXT_COLOR, LIGHT_MODE_COLORS.PRIMARY_TEXT_COLOR);
			expect(setCookieMock).toHaveBeenCalledWith(COOKIE_KEYS.PRIMARY_COLOR, LIGHT_MODE_COLORS.PRIMARY_COLOR);
			expect(setCookieMock).toHaveBeenCalledWith(COOKIE_KEYS.SECONDARY_COLOR, LIGHT_MODE_COLORS.SECONDARY_COLOR);
			expect(setCookieMock).toHaveBeenCalledWith(COOKIE_KEYS.SECONDARY_TEXT_COLOR, LIGHT_MODE_COLORS.SECONDARY_TEXT_COLOR);
			expect(setCookieMock).toHaveBeenCalledWith(COOKIE_KEYS.BORDER_COLOR, LIGHT_MODE_COLORS.BORDER_COLOR);
		});

		// Check for success message
		await screen.findByText('Colors saved successfully!');
	});

	it('should apply predefined palette when button is clicked', () => {
		render(React.createElement(ColorsPage));
		const lightModeButton = screen.getByRole('button', { name: 'Light Mode' });

		fireEvent.click(lightModeButton);

		// Assuming PREDEFINED_PALETTES['Light Mode'] is available via the mock
		const lightPalette = {
			PAGE_BG: '#ffffff',
			PRIMARY_COLOR: '#3c33e6',
			SECONDARY_COLOR: '#f2f2f2',
			PRIMARY_TEXT_COLOR: '#111827',
		};

		expect(screen.getByLabelText('Page Background')).toHaveValue(lightPalette.PAGE_BG);
		expect(screen.getByLabelText('Primary Color')).toHaveValue(lightPalette.PRIMARY_COLOR);
		expect(screen.getByLabelText('Secondary Colour')).toHaveValue(lightPalette.SECONDARY_COLOR);
		expect(screen.getByLabelText('Primary Text')).toHaveValue(lightPalette.PRIMARY_TEXT_COLOR);
	});

	it('should call clipboard.writeText when Export button is clicked', async () => {
		render(React.createElement(ColorsPage));
		const exportButton = screen.getByRole('button', { name: 'Export' });

		act(() => {
			fireEvent.click(exportButton);
		});

		await waitFor(() => {
			expect(mockClipboard.writeText).toHaveBeenCalledTimes(1);
		});
		expect(mockClipboard.writeText).toHaveBeenCalledWith(JSON.stringify(LIGHT_MODE_COLORS, null, 2));
		// Check for success message
		await screen.findByText('Colors copied to clipboard!');
	});

	it('should call clipboard.readText and update colors when Import button is clicked with valid JSON', async () => {
		const validJson = JSON.stringify(
			{
				PAGE_BG: '#aabbcc',
				PRIMARY_COLOR: '#112233',
				SECONDARY_COLOR: '#445566',
				PRIMARY_TEXT_COLOR: '#ddeeff',
				SECONDARY_TEXT_COLOR: '#556677',
				BORDER_COLOR: '#778899',
			},
			null,
			2
		);
		mockClipboard.readText.mockResolvedValue(validJson);

		render(React.createElement(ColorsPage));
		const importButton = screen.getByRole('button', { name: 'Import' });

		act(() => {
			fireEvent.click(importButton);
		});

		await waitFor(() => {
			expect(mockClipboard.readText).toHaveBeenCalledTimes(1);
		});

		// Check if colors updated
		await waitFor(() => {
			expect(screen.getByLabelText('Page Background')).toHaveValue('#aabbcc');
			expect(screen.getByLabelText('Primary Color')).toHaveValue('#112233');
			expect(screen.getByLabelText('Secondary Colour')).toHaveValue('#445566');
			expect(screen.getByLabelText('Primary Text')).toHaveValue('#ddeeff');
			expect(screen.getByLabelText('Secondary Text')).toHaveValue('#556677');
			expect(screen.getByLabelText('Border Color')).toHaveValue('#778899');
		});

		// Check for success message
		await screen.findByText('Colors imported successfully!');
	});

	it('should show error message when Import button is clicked with invalid JSON', async () => {
		mockClipboard.readText.mockResolvedValue('invalid json');

		render(React.createElement(ColorsPage));
		const importButton = screen.getByRole('button', { name: 'Import' });

		act(() => {
			fireEvent.click(importButton);
		});

		await waitFor(() => {
			expect(mockClipboard.readText).toHaveBeenCalledTimes(1);
		});

		// Check for error message (using regex for flexibility)
		await screen.findByText(/Failed to import colors from clipboard./i);
	});

	it('should show error message when Import button is clicked with invalid color format', async () => {
		// Setup mock to return invalid JSON
		mockClipboard.readText.mockResolvedValueOnce(
			JSON.stringify({
				PAGE_BG: 'not-a-color',
				PRIMARY_COLOR: '#112233',
				SECONDARY_COLOR: '#445566',
				PRIMARY_TEXT_COLOR: '#778899',
				SECONDARY_TEXT_COLOR: '#aabbcc',
				BORDER_COLOR: '#ddeeff',
			})
		);

		render(React.createElement(ColorsPage));
		const importButton = screen.getByRole('button', { name: 'Import' });

		act(() => {
			fireEvent.click(importButton);
		});

		await waitFor(() => {
			expect(mockClipboard.readText).toHaveBeenCalledTimes(1);
		});

		// Check for error message with updated format
		await screen.findByText(/Failed to import colors from clipboard. Invalid hex color format found in clipboard data./i);
	});

	// --- Tests for System Default Handling ---

	it('should render with dark mode defaults if system prefers dark and no cookies are set', async () => {
		// Override matchMedia mock for this test
		setupMatchMediaMock(true); // Simulate dark mode
		getCookieMock.mockReturnValue(null); // Ensure no cookies override

		render(React.createElement(ColorsPage));

		// Wait for state update after useEffect runs
		await waitFor(() => {
			expect(screen.getByLabelText('Page Background')).toHaveValue(DARK_MODE_COLORS.PAGE_BG);
		});

		// Check other inputs match dark mode defaults
		expect(screen.getByLabelText('Primary Color')).toHaveValue(DARK_MODE_COLORS.PRIMARY_COLOR);
		expect(screen.getByLabelText('Secondary Colour')).toHaveValue(DARK_MODE_COLORS.SECONDARY_COLOR);
		expect(screen.getByLabelText('Primary Text')).toHaveValue(DARK_MODE_COLORS.PRIMARY_TEXT_COLOR);
		expect(screen.getByLabelText('Secondary Text')).toHaveValue(DARK_MODE_COLORS.SECONDARY_TEXT_COLOR);
		expect(screen.getByLabelText('Border Color')).toHaveValue(DARK_MODE_COLORS.BORDER_COLOR);
	});

	// --- Test for Resetting Unsaved Changes ---
	it('should reset unsaved changes to the last saved state (initial load)', async () => {
		// Start with light mode defaults, no cookies
		setupMatchMediaMock(false);
		getCookieMock.mockReturnValue(null);

		render(React.createElement(ColorsPage));

		// Wait for initial light mode load
		await waitFor(() => {
			expect(screen.getByLabelText('Page Background')).toHaveValue(LIGHT_MODE_COLORS.PAGE_BG);
		});

		// Change a color
		const pageBgInput = screen.getByLabelText('Page Background');
		const originalBg = LIGHT_MODE_COLORS.PAGE_BG;
		const changedBg = '#abcdef';
		fireEvent.change(pageBgInput, { target: { value: changedBg } });
		await waitFor(() => {
			expect(pageBgInput).toHaveValue(changedBg);
		});

		// Find the "Reset" button (in the main action group)
		// It might be disabled initially if no changes detected, ensure it's enabled after change
		const resetButton = screen.getByRole('button', { name: 'Reset' });
		await waitFor(() => {
			expect(resetButton).not.toBeDisabled();
		}); // Wait for button to enable

		// Click the "Reset" button
		act(() => {
			fireEvent.click(resetButton);
		});

		// Verify the color resets to the initial loaded value (Light Mode BG)
		await waitFor(() => {
			expect(pageBgInput).toHaveValue(originalBg);
		});

		// Verify the reset button becomes disabled again as there are no unsaved changes
		await waitFor(() => {
			expect(resetButton).toBeDisabled();
		});
	});
});
