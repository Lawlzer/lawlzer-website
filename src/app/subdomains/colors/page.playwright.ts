import { test, expect } from '@playwright/test';
import type { Page, Locator } from '@playwright/test';
import { testPageBasics } from '@testUtils/playwright/utils';
import { pathToURLTestsOnly } from '~/lib/utils';
import { COOKIE_KEYS, DEFAULT_COLORS, PREDEFINED_PALETTES } from '~/lib/palette';

const pathToThisFile = import.meta.url;

// Define the expected metadata directly for the test
const expectedMetadata = {
	title: 'Color Theme Colors',
	// description: '...', // Add if there's a meta description
};
const colorsPageUrl = pathToURLTestsOnly(pathToThisFile);

// Helper function to get color input locators
const getColorInputs = (page: Page): { [key: string]: Locator } => ({
	pageBg: page.locator('label:has-text("Page Background") input[type="color"]'),
	fgColor: page.locator('label:has-text("Foreground Text") input[type="color"]'),
	primaryColor: page.locator('label:has-text("Primary Color") input[type="color"]'),
	topbarBg: page.locator('label:has-text("Topbar Background") input[type="color"]'),
});

// Helper function to get the current value of a color input
async function getColorInputValue(locator: Locator): Promise<string> {
	const value = await locator.inputValue();
	return value;
}

// Helper function to check element style (adjust selector/property as needed)
async function checkElementStyle(page: Page, selector: string, property: string, expectedValue: string): Promise<void> {
	const element = page.locator(selector).first();

	// For color values, create a pattern that matches both hex and RGB formats
	if (property.includes('color') && expectedValue.startsWith('#')) {
		// Convert hex to RGB
		const hex = expectedValue.replace('#', '');
		let r = 0,
			g = 0,
			b = 0;

		if (hex.length === 6) {
			r = parseInt(hex.substring(0, 2), 16);
			g = parseInt(hex.substring(2, 4), 16);
			b = parseInt(hex.substring(4, 6), 16);
		} else if (hex.length === 3) {
			// Handle shorthand hex
			r = parseInt(hex.substring(0, 1).repeat(2), 16);
			g = parseInt(hex.substring(1, 2).repeat(2), 16);
			b = parseInt(hex.substring(2, 3).repeat(2), 16);
		}

		// Accept either hex or RGB format
		const rgbPattern = new RegExp(`(${expectedValue}|rgb\\(\\s*${r}\\s*,\\s*${g}\\s*,\\s*${b}\\s*\\))`, 'i');
		await expect(element).toHaveCSS(property, rgbPattern);
	} else {
		// For non-color properties use the original approach
		await expect(element).toHaveCSS(property, new RegExp(expectedValue, 'i'));
	}
}

test.describe('Colors Page E2E Tests', () => {
	test.beforeEach(async ({ page, context }) => {
		// Clear cookies before each test to ensure a clean state
		await context.clearCookies();
		await page.goto(colorsPageUrl);
	});

	test('page loads healthily and has correct title', async ({ page }) => {
		await testPageBasics(page, colorsPageUrl, expectedMetadata, {});
		await expect(page.locator('h1:has-text("Color Theme Colors")')).toBeVisible();
	});

	test('should display default colors on initial load', async ({ page }) => {
		const inputs = getColorInputs(page);
		await expect(inputs.pageBg).toHaveValue(DEFAULT_COLORS.PAGE_BG);
		await expect(inputs.fgColor).toHaveValue(DEFAULT_COLORS.FG_COLOR);
		await expect(inputs.primaryColor).toHaveValue(DEFAULT_COLORS.PRIMARY_COLOR);
		await expect(inputs.topbarBg).toHaveValue(DEFAULT_COLORS.TOPBAR_BG);

		// Also check if body background matches (example)
		await checkElementStyle(page, 'body', 'background-color', DEFAULT_COLORS.PAGE_BG);
	});

	test('should update color input value and page style on change', async ({ page }) => {
		const inputs = getColorInputs(page);
		const newBgColor = '#1a2b3c';

		// Use fill for color inputs - Playwright might need specific handling, try this first
		await inputs.pageBg.fill(newBgColor);

		// Verify input value changed
		await expect(inputs.pageBg).toHaveValue(newBgColor);

		// Verify body background style changed (wait for potential debounce/effect)
		await checkElementStyle(page, 'body', 'background-color', newBgColor);
	});

	test('should apply a predefined palette correctly', async ({ page }) => {
		const inputs = getColorInputs(page);
		const lightModeButton = page.getByRole('button', { name: 'Light Mode' });
		const lightPalette = PREDEFINED_PALETTES['Light Mode'];

		await lightModeButton.click();

		// Verify all inputs match the light palette
		await expect(inputs.pageBg).toHaveValue(lightPalette.PAGE_BG);
		await expect(inputs.fgColor).toHaveValue(lightPalette.FG_COLOR);
		await expect(inputs.primaryColor).toHaveValue(lightPalette.PRIMARY_COLOR);
		await expect(inputs.topbarBg).toHaveValue(lightPalette.TOPBAR_BG);

		// Verify a style change, e.g., body background
		await checkElementStyle(page, 'body', 'background-color', lightPalette.PAGE_BG);
	});

	test('should save colors to cookies and show success message', async ({ page, context }) => {
		const inputs = getColorInputs(page);
		const saveButton = page.getByRole('button', { name: 'Save' });
		const newFgColor = '#f0f0f0';

		// Change a color
		await inputs.fgColor.fill(newFgColor);
		await expect(inputs.fgColor).toHaveValue(newFgColor);

		// Wait for change to be fully applied
		await page.waitForTimeout(300);

		// Save
		await saveButton.click();

		// Check for success message
		await expect(page.getByText('Colors saved successfully!')).toBeVisible();

		// Verify cookies were set - use the current input values rather than expected values
		const cookies = await context.cookies();
		const findCookie = (name: string): any => cookies.find((c) => c.name === name);
		const currentFgColor = await inputs.fgColor.inputValue();

		expect(findCookie(COOKIE_KEYS.PAGE_BG)?.value).toBe(await getColorInputValue(inputs.pageBg));
		expect(findCookie(COOKIE_KEYS.FG_COLOR)?.value).toBe(currentFgColor);
		expect(findCookie(COOKIE_KEYS.PRIMARY_COLOR)?.value).toBe(await getColorInputValue(inputs.primaryColor));
		expect(findCookie(COOKIE_KEYS.TOPBAR_BG)?.value).toBe(await getColorInputValue(inputs.topbarBg));
	});

	test('should load saved colors from cookies on reload', async ({ page, context }) => {
		const inputs = getColorInputs(page);
		const saveButton = page.getByRole('button', { name: 'Save' });
		const testColors = {
			[COOKIE_KEYS.PAGE_BG]: '#99aabb',
			[COOKIE_KEYS.FG_COLOR]: '#ccddff',
			[COOKIE_KEYS.PRIMARY_COLOR]: '#119922',
			[COOKIE_KEYS.TOPBAR_BG]: '#665544',
		};

		// Manually set cookies before going to the page (alternative to UI interaction)
		await context.addCookies([
			{ name: COOKIE_KEYS.PAGE_BG, value: testColors[COOKIE_KEYS.PAGE_BG], url: colorsPageUrl },
			{ name: COOKIE_KEYS.FG_COLOR, value: testColors[COOKIE_KEYS.FG_COLOR], url: colorsPageUrl },
			{ name: COOKIE_KEYS.PRIMARY_COLOR, value: testColors[COOKIE_KEYS.PRIMARY_COLOR], url: colorsPageUrl },
			{ name: COOKIE_KEYS.TOPBAR_BG, value: testColors[COOKIE_KEYS.TOPBAR_BG], url: colorsPageUrl },
		]);

		// Reload the page
		await page.reload();

		// Verify inputs load the cookie values
		await expect(inputs.pageBg).toHaveValue(testColors[COOKIE_KEYS.PAGE_BG]);
		await expect(inputs.fgColor).toHaveValue(testColors[COOKIE_KEYS.FG_COLOR]);
		await expect(inputs.primaryColor).toHaveValue(testColors[COOKIE_KEYS.PRIMARY_COLOR]);
		await expect(inputs.topbarBg).toHaveValue(testColors[COOKIE_KEYS.TOPBAR_BG]);
	});

	// --- Import/Export Tests (Clipboard interaction can be tricky) ---

	// Note: Direct clipboard testing in Playwright requires granting browser permissions.
	// It's often more reliable to mock the clipboard API in the component test
	// or perform limited checks here (e.g., button click, status message).

	test('Export button shows success message', async ({ page }) => {
		// Mock the clipboard API before clicking
		await page.addInitScript(() => {
			// Create a more complete mock of the clipboard API
			Object.defineProperty(navigator, 'clipboard', {
				value: {
					writeText: async () => Promise.resolve(),
					readText: async () => Promise.resolve('{}'),
				},
				configurable: true,
				writable: true,
			});
		});

		await page.goto(colorsPageUrl);
		const exportButton = page.getByRole('button', { name: 'Export' });
		await exportButton.click();

		// Wait for the success message with increased timeout
		await expect(page.getByText('Colors copied to clipboard!')).toBeVisible({ timeout: 5000 });
	});

	test('Import button shows success message (requires clipboard mock/permission)', async ({ page }) => {
		// Create valid test data
		const validJson = JSON.stringify({
			PAGE_BG: '#aabbcc',
			FG_COLOR: '#ddeeff',
			PRIMARY_COLOR: '#112233',
			TOPBAR_BG: '#445566',
		});

		// Mock the clipboard API before loading the page
		await page.addInitScript((clipboardContent) => {
			Object.defineProperty(navigator, 'clipboard', {
				value: {
					writeText: async () => Promise.resolve(),
					readText: async () => Promise.resolve(clipboardContent),
				},
				configurable: true,
				writable: true,
			});
		}, validJson);

		await page.goto(colorsPageUrl);
		const importButton = page.getByRole('button', { name: 'Import' });
		await importButton.click();

		// Check for success message with increased timeout
		await expect(page.getByText('Colors imported successfully!')).toBeVisible({ timeout: 10000 });

		// Verify colors changed
		const inputs = getColorInputs(page);
		await expect(inputs.pageBg).toHaveValue('#aabbcc');
		await expect(inputs.fgColor).toHaveValue('#ddeeff');
	});

	test('Import button shows error message with invalid data', async ({ page }) => {
		// Mock clipboard with invalid content
		await page.addInitScript(() => {
			Object.defineProperty(navigator, 'clipboard', {
				value: {
					writeText: async () => Promise.resolve(),
					readText: async () => Promise.resolve('this is not json'),
				},
				configurable: true,
				writable: true,
			});
		});

		await page.goto(colorsPageUrl);
		const importButton = page.getByRole('button', { name: 'Import' });
		await importButton.click();

		// Check for error message
		await expect(page.getByText(/Failed to import colors/i)).toBeVisible({ timeout: 5000 });
	});
});
