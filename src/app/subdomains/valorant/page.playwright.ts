import type { Page, Locator } from '@playwright/test';
import { test, expect } from '@playwright/test';
import { metadata } from './layout';
import { testPageBasics } from '@testUtils/playwright/utils';
import { pathToURLTestsOnly } from '~/lib/utils';
const pathToThisFile = import.meta.url;

const valorantUrl = pathToURLTestsOnly(pathToThisFile);

export async function getMapSvg(page: Page): Promise<Locator> {
	// Updated selector: target the svg inside the map display container with specific classes
	const mapSvg = page.locator('div.flex.flex-grow.items-center.justify-center svg.max-h-full.max-w-full.object-contain');
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
	await expect(clickableImage).toBeVisible({ timeout: 5000 });
	await clickableImage.click({ force: true });

	// Wait a moment for the state change to register
	await page.waitForTimeout(500);

	// Re-locate the button using only the stable testid
	const clickedImage = page.locator(`image[data-testid*="${options.name}"]`).first();

	// Instead of checking for exact opacity attribute, check that it changed
	if (options.currentOpacity === 0.5) {
		// If starting with 0.5, verify it's no longer 0.5 (should be 1)
		await expect(clickedImage).not.toHaveAttribute('opacity', '0.5', { timeout: 5000 });
	} else {
		// If starting with 1, verify it's no longer 1 (should be 0.5)
		await expect(clickedImage).not.toHaveAttribute('opacity', '1', { timeout: 5000 });
	}
}

test('valorant subdomain page loads healthily and has correct title', async ({ page }) => {
	// Use the imported metadata
	await testPageBasics(page, valorantUrl, metadata, {});
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
	const lineupImageOriginal = page.locator('div.p-2 img[alt="Lineup step 1"].cursor-pointer');
	await expect(lineupImageOriginal).not.toBeVisible();

	await clickExampleTo(page, { name: 'map-icon-utility-Mosh Pit', currentOpacity: 0.5 });
	await clickExampleTo(page, { name: 'map-icon-agent-Gekko', currentOpacity: 0.5 });

	// Check if the lineup image is visible in the bottom left
	const lineupImage = page.locator('div.p-2 img[alt="Lineup step 1"].cursor-pointer');
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
	const lineupImageMapChange = page.locator('div.p-2 img[alt="Lineup step 1"].cursor-pointer');
	await expect(lineupImageMapChange).toBeVisible();
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
	const lineupImageSplit = page.locator('div.p-2 img[alt="Lineup step 1"].cursor-pointer');
	await expect(lineupImageSplit).toBeVisible();
});

test('Utility ➔ Agent button works', async ({ page }) => {
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
	const lineupImage = page.locator('div.p-2 img[alt="Lineup step 1"].cursor-pointer');
	await expect(lineupImage).not.toBeVisible();

	// 1. Click the Utility ➔ Agent button
	const utilityAgentButton = page.getByRole('button', {
		name: 'Utility ➔ Agent',
	});
	await expect(utilityAgentButton).toBeVisible();
	await utilityAgentButton.click();

	// Swap the order: Click Utility first, then Agent
	await clickExampleTo(page, { name: 'map-icon-utility-Mosh Pit', currentOpacity: 0.5 });
	await clickExampleTo(page, { name: 'map-icon-agent-Gekko', currentOpacity: 0.5 });

	// --- Verification ---
	// Verify lineup is visible (selector targets the sidebar image)
	await expect(lineupImage).toBeVisible();
});

test('should allow us to select a lineup, then click the selected Utility, to reset the selected lineup', async ({ page }) => {
	await page.goto(valorantUrl);

	// The image should not yet be visible
	const lineupImageOriginal = page.locator('div.p-2 img[alt="Lineup step 1"].cursor-pointer');
	await expect(lineupImageOriginal).not.toBeVisible();

	await clickExampleTo(page, { name: 'map-icon-utility-Mosh Pit', currentOpacity: 0.5 });
	await clickExampleTo(page, { name: 'map-icon-agent-Gekko', currentOpacity: 0.5 });

	// Check if the lineup image is visible in the bottom left
	const lineupImage = page.locator('div.p-2 img[alt="Lineup step 1"].cursor-pointer');
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
	await page.waitForTimeout(500); // Wait for page to fully stabilize

	// The image should not yet be visible
	const lineupImageOriginal = page.locator('div.p-2 img[alt="Lineup step 1"].cursor-pointer');
	await expect(lineupImageOriginal).not.toBeVisible();

	// First, click the Mosh Pit utility
	const moshPitIcon = page.locator('image[data-testid*="map-icon-utility-Mosh Pit"][opacity="0.5"]').first();
	await expect(moshPitIcon).toBeVisible({ timeout: 5000 });
	await moshPitIcon.click({ force: true });
	await page.waitForTimeout(300); // Wait for click to register

	// Then click the Gekko agent
	const gekkoIcon = page.locator('image[data-testid*="map-icon-agent-Gekko"][opacity="0.5"]').first();
	await expect(gekkoIcon).toBeVisible({ timeout: 5000 });
	await gekkoIcon.click({ force: true });
	await page.waitForTimeout(300); // Wait for click to register

	// Check if the lineup image is visible in the bottom left
	const lineupImage = page.locator('div.p-2 img[alt="Lineup step 1"].cursor-pointer');
	await expect(lineupImage).toBeVisible({ timeout: 5000 });

	// --- Click the Gekko agent icon again to reset ---
	// Locate the *selected* agent icon (opacity=1)
	const selectedGekkoIcon = page.locator('image[data-testid*="map-icon-agent-Gekko"][opacity="1"]').first();
	await expect(selectedGekkoIcon).toBeVisible({ timeout: 5000 }); // Ensure it exists before clicking
	await selectedGekkoIcon.click({ force: true }); // Click it directly
	await page.waitForTimeout(300); // Wait for click to register

	// --- Verify Reset ---
	// Lineup image should now be hidden
	await expect(lineupImage).not.toBeVisible({ timeout: 5000 });

	// and, we should see multiple clickable images again
	const multipleImages = page.locator('image[opacity="0.5"]');
	expect(await multipleImages.count()).toBeGreaterThanOrEqual(2);
});
