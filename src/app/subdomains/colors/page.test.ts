'use client';

import React from 'react';
import { render, screen, fireEvent, act, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import ColorsPage from './page';
import { COOKIE_KEYS, DEFAULT_COLORS, setCookie, getCookie } from '~/lib/palette';
import type * as PaletteModule from '~/lib/palette';

// --- Mocks --- //

// Mock the palette module
vi.mock('~/lib/palette', async (importOriginal) => {
	const actual = await importOriginal<typeof PaletteModule>();
	return {
		...actual, // Keep actual PREDEFINED_PALETTES and COOKIE_KEYS
		getCookie: vi.fn(),
		setCookie: vi.fn(),
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
	});

	it('should render with default colors if no cookies are set', () => {
		render(React.createElement(ColorsPage));

		expect(screen.getByLabelText('Page Background')).toHaveValue(DEFAULT_COLORS.PAGE_BG);
		expect(screen.getByLabelText('Primary Color')).toHaveValue(DEFAULT_COLORS.PRIMARY_COLOR);
		expect(screen.getByLabelText('Secondary Colour')).toHaveValue(DEFAULT_COLORS.SECONDARY_COLOR);
		expect(screen.getByLabelText('Primary Text')).toHaveValue(DEFAULT_COLORS.PRIMARY_TEXT_COLOR);
		expect(screen.getByLabelText('Secondary Text')).toHaveValue(DEFAULT_COLORS.SECONDARY_TEXT_COLOR);
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

		// Change a color first
		fireEvent.change(screen.getByLabelText('Page Background'), { target: { value: '#123456' } });

		act(() => {
			fireEvent.click(saveButton);
		});

		await waitFor(() => {
			// Check that cookies are set with the actual values, not DEFAULT_COLORS
			expect(setCookieMock).toHaveBeenCalledWith(COOKIE_KEYS.PAGE_BG, '#123456');
			expect(setCookieMock).toHaveBeenCalledWith(COOKIE_KEYS.PRIMARY_TEXT_COLOR, '#f0e0f8');
			expect(setCookieMock).toHaveBeenCalledWith(COOKIE_KEYS.PRIMARY_COLOR, '#bb0fd9');
			expect(setCookieMock).toHaveBeenCalledWith(COOKIE_KEYS.SECONDARY_COLOR, '#3b0047');
			expect(setCookieMock).toHaveBeenCalledWith(COOKIE_KEYS.SECONDARY_TEXT_COLOR, '#c0a0c8');
			expect(setCookieMock).toHaveBeenCalledWith(COOKIE_KEYS.BORDER_COLOR, '#450052');
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
		expect(mockClipboard.writeText).toHaveBeenCalledWith(JSON.stringify(DEFAULT_COLORS, null, 2));
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
});
