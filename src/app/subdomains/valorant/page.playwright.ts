import type { Page, Locator } from '@playwright/test';
import { test, expect } from '@playwright/test';
// import { metadata } from './page'; // <-- Remove this import
import { testPageBasics } from '@testUtils/playwright';
import { pathToURLTestsOnly } from '~/lib/utils';
const pathToThisFile = import.meta.url;

// Define the expected metadata directly for the test
const expectedMetadata = {
	title: 'Valorant Lineups',
};
const valorantUrl = pathToURLTestsOnly(pathToThisFile);

export async function getMapSvg(page: Page): Promise<Locator> {
	// Updated selector: target the svg inside the map display container
	const mapSvg = page.locator('div.flex.flex-grow.items-center.justify-center > svg');
	await expect(mapSvg).toBeVisible();
	return mapSvg;
}

async function clickExampleTo(
	page: Page,
	options: {
		name: string;
		currentOpacity: number;
	}
): Promise<void> {
	// Locate the specific button state to click
	const clickableImage = page.locator(`image[data-testid*="${options.name}"][opacity="${options.currentOpacity}"]`).first();
	await expect(clickableImage).toBeVisible();
	await clickableImage.click({ force: true });

	// Re-locate the button using only the stable testid
	const clickedImage = page.locator(`image[data-testid*="${options.name}"]`).first();
	const expectedOpacity = options.currentOpacity === 0.5 ? '1' : '0.5';

	// Wait for the button to have the new opacity
	await expect(clickedImage).toHaveAttribute('opacity', expectedOpacity);
}

test('valorant subdomain page loads healthily and has correct title', async ({ page }) => {
	// Use the locally defined metadata
	await testPageBasics(page, valorantUrl, expectedMetadata, {});
});

test('images load correctly and multiple maps work', async ({ page }) => {
	await page.goto(valorantUrl);
	const mapSvg = await getMapSvg(page);

	// --- Basic Setup Verification ---
	await expect(page.getByRole('button', { name: 'Ascent' })).toBeVisible();
	const gekkoButton = page.getByRole('button', { name: 'Gekko' });
	await expect(gekkoButton).toBeVisible();
	const moshPitButton = page.getByRole('button', { name: 'Mosh Pit' });
	await expect(moshPitButton).toBeVisible();

	await expect(mapSvg.locator('image').first()).toBeVisible({ timeout: 3000 });
	await gekkoButton.click();
	await moshPitButton.click();
	await page.waitForTimeout(500); // Increased from 200
});

test('should allow us to select utilities on the map properly, and show the correct lineup', async ({ page }) => {
	await page.goto(valorantUrl);
	const mapSvg = await getMapSvg(page);

	const ascentButton = page.getByRole('button', { name: 'Ascent' });
	const gekkoButton = page.getByRole('button', { name: 'Gekko' });
	const moshPitButton = page.getByRole('button', { name: 'Mosh Pit' });
	await expect(ascentButton).toBeVisible();
	await expect(gekkoButton).toBeVisible();
	await expect(moshPitButton).toBeVisible();

	// The image should not yet be visible
	const lineupImageOriginal = page.locator('img[alt="Lineup step 1"]');
	await expect(lineupImageOriginal).not.toBeVisible();

	await clickExampleTo(page, { name: 'map-icon-utility-Mosh Pit', currentOpacity: 0.5 });
	await clickExampleTo(page, { name: 'map-icon-agent-Gekko', currentOpacity: 0.5 });

	// Check if the lineup image is visible in the bottom left
	const lineupImage = page.locator('img[alt="Lineup step 1"]');
	await expect(lineupImage).toBeVisible();
});

test('should allow us to change maps, select different agents, and select different utility types', async ({ page }) => {
	await page.goto(valorantUrl);
	const mapSvg = await getMapSvg(page);

	// 1. Change map
	const breezeButton = page.getByRole('button', { name: 'Breeze' });
	await expect(breezeButton).toBeVisible();
	await breezeButton.click();

	// Add a small wait or assertion to ensure the map change has processed if necessary
	// For example, wait for an element specific to the Breeze map if available, or just a timeout

	// 2. Click Sova agent
	const sovaButton = page.getByRole('button', { name: 'Sova' });
	await expect(sovaButton).toBeVisible();
	await sovaButton.click();

	// 3. Click Recon Dart utility
	const reconDartButton = page.getByRole('button', { name: 'Recon Dart' });
	await expect(reconDartButton).toBeVisible();
	await reconDartButton.click();

	await clickExampleTo(page, { name: 'map-icon-utility-Recon Dart', currentOpacity: 0.5 });
	await clickExampleTo(page, { name: 'map-icon-agent-Sova', currentOpacity: 0.5 });

	// Verify a lineup image is visible
	const lineupImage = page.locator('img[alt="Lineup step 1"]');
	await expect(lineupImage).toBeVisible();
});

test('should allow us to change to Split, test Poison clouds', async ({ page }) => {
	await page.goto(valorantUrl);
	const mapSvg = await getMapSvg(page);

	// Ensure initial elements are visible before interaction
	await expect(page.getByRole('button', { name: 'Ascent' })).toBeVisible(); // Example check for initial map
	await expect(page.getByRole('button', { name: 'Gekko' })).toBeVisible(); // Example check for initial agent

	// 1. Change map to Split
	const splitButton = page.getByRole('button', { name: 'Split' });
	await expect(splitButton).toBeVisible();
	await splitButton.click();
	await page.waitForLoadState('networkidle'); // Wait after map change

	// 2. Click Viper agent (assuming Poison Cloud is Viper's)
	const viperButton = page.getByRole('button', { name: 'Viper' });
	await expect(viperButton).toBeVisible();
	await viperButton.click();
	await page.waitForLoadState('networkidle'); // Wait after agent change

	// 3. Click Poison Cloud utility
	const poisonCloudButton = page.getByRole('button', { name: 'Poison Cloud' });
	await expect(poisonCloudButton).toBeVisible();
	await poisonCloudButton.click();

	await clickExampleTo(page, { name: 'map-icon-utility-Poison Cloud', currentOpacity: 0.5 });
	await clickExampleTo(page, { name: 'map-icon-agent-Viper', currentOpacity: 0.5 });

	// Verify a lineup image is visible
	const lineupImage = page.locator('img[alt="Lineup step 1"]');
	await expect(lineupImage).toBeVisible();
});

test('start->destination button works', async ({ page }) => {
	await page.goto(valorantUrl);

	// --- Setup: Select Ascent, Gekko, Mosh Pit and click icons ---
	const ascentButton = page.getByRole('button', { name: 'Ascent' });
	const gekkoButton = page.getByRole('button', { name: 'Gekko' });
	const moshPitButton = page.getByRole('button', { name: 'Mosh Pit' });
	await expect(ascentButton).toBeVisible();
	await expect(gekkoButton).toBeVisible();
	await expect(moshPitButton).toBeVisible();
	await ascentButton.click();
	await gekkoButton.click();
	await moshPitButton.click();

	// Verify lineup is not visible initially
	const lineupImage = page.locator('img[alt="Lineup step 1"]');
	await expect(lineupImage).not.toBeVisible();

	// 1. Click the Start -> Destination button
	const startDestButton = page.getByRole('button', {
		name: 'Start ➔ Destination',
	});
	await expect(startDestButton).toBeVisible();
	await startDestButton.click();

	await clickExampleTo(page, { name: 'map-icon-agent-Gekko', currentOpacity: 0.5 });
	await clickExampleTo(page, { name: 'map-icon-utility-Mosh Pit', currentOpacity: 0.5 });

	// --- Verification ---
	// Verify lineup is no longer visible
	await expect(lineupImage).toBeVisible();
});

test('should allow us to select a lineup, then click the selected Utility, to reset the selected lineup', async ({ page }) => {
	await page.goto(valorantUrl);

	// The image should not yet be visible
	const lineupImageOriginal = page.locator('img[alt="Lineup step 1"]');
	await expect(lineupImageOriginal).not.toBeVisible();

	await clickExampleTo(page, { name: 'map-icon-utility-Mosh Pit', currentOpacity: 0.5 });
	await clickExampleTo(page, { name: 'map-icon-agent-Gekko', currentOpacity: 0.5 });

	// Check if the lineup image is visible in the bottom left
	const lineupImage = page.locator('img[alt="Lineup step 1"]');
	await expect(lineupImage).toBeVisible();

	// Click the Mosh pit to reset the lineup
	await clickExampleTo(page, { name: 'map-icon-utility-Mosh Pit', currentOpacity: 1 });
	// Lineup image should now be hidden
	await expect(lineupImage).not.toBeVisible();

	// and, we should see multiple clickable images again
	const multipleImages = page.locator('image[opacity="0.5"]');
	expect(await multipleImages.count()).toBeGreaterThanOrEqual(2);
});

test('should allow us to select a lineup, then click the selected Agent, to reset the selected lineup', async ({ page }) => {
	await page.goto(valorantUrl);

	// The image should not yet be visible
	const lineupImageOriginal = page.locator('img[alt="Lineup step 1"]');
	await expect(lineupImageOriginal).not.toBeVisible();

	await clickExampleTo(page, { name: 'map-icon-utility-Mosh Pit', currentOpacity: 0.5 });
	await clickExampleTo(page, { name: 'map-icon-agent-Gekko', currentOpacity: 0.5 });

	// Check if the lineup image is visible in the bottom left
	const lineupImage = page.locator('img[alt="Lineup step 1"]');
	await expect(lineupImage).toBeVisible();

	// --- Click the Gekko agent icon again to reset ---
	// Locate the *selected* agent icon (opacity=1)
	const selectedGekkoIcon = page.locator('image[data-testid*="map-icon-agent-Gekko"][opacity="1"]').first();
	await expect(selectedGekkoIcon).toBeVisible(); // Ensure it exists before clicking
	await selectedGekkoIcon.click({ force: true }); // Click it directly

	// --- Verify Reset ---
	// Lineup image should now be hidden
	await expect(lineupImage).not.toBeVisible();

	// and, we should see multiple clickable images again
	const multipleImages = page.locator('image[opacity="0.5"]');
	expect(await multipleImages.count()).toBeGreaterThanOrEqual(2);
});
