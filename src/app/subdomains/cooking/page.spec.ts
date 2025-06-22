import type { Locator, Page } from '@playwright/test';
import { expect, test } from '@playwright/test';

import { pathToURLTestsOnly } from '~/lib/utils';

const pathToThisFile = import.meta.url;
const cookingPageUrl = pathToURLTestsOnly(pathToThisFile);

// Helper interfaces for better type checking
interface NavigationTabs {
	overview: Locator;
	scan: Locator;
	recipes: Locator;
	days: Locator;
	goals: Locator;
	analysis: Locator;
	planner: Locator;
	fridge: Locator;
	cook: Locator;
	tools: Locator;
}

interface RecipeFormInputs {
	name: Locator;
	description: Locator;
	prepTime: Locator;
	cookTime: Locator;
	servings: Locator;
}

// Utility functions
const getNavigationTabs = (page: Page): NavigationTabs => ({
	overview: page.getByRole('button', { name: 'Overview' }),
	scan: page.getByRole('button', { name: 'Scan' }),
	recipes: page.getByRole('button', { name: 'Recipes' }),
	days: page.getByRole('button', { name: 'Days' }),
	goals: page.getByRole('button', { name: 'Goals' }),
	analysis: page.getByRole('button', { name: 'Analysis' }),
	planner: page.getByRole('button', { name: 'Planner' }),
	fridge: page.getByRole('button', { name: 'Fridge' }),
	cook: page.getByRole('button', { name: 'Cook' }),
	tools: page.getByRole('button', { name: 'Tools' }),
});

const getRecipeFormInputs = (page: Page): RecipeFormInputs => ({
	name: page.getByLabel(/Recipe Name/i),
	description: page.getByLabel(/Description/i),
	prepTime: page.getByLabel(/Prep Time/i),
	cookTime: page.getByLabel(/Cook Time/i),
	servings: page.getByLabel(/Servings/i),
});

test.describe('Cooking Page E2E Tests', () => {
	test.beforeEach(async ({ page, context }) => {
		// Clear any existing guest data cookies
		await context.clearCookies();
		await page.goto(cookingPageUrl);
	});

	test('page loads healthily', async ({ page }) => {
		await expect(page.getByRole('heading', { name: 'Cooking & Nutrition' })).toBeVisible();

		// Check page is responsive
		const mainContainer = page.locator('.container');
		await expect(mainContainer).toBeVisible();

		// Check no JavaScript errors
		const consoleErrors: string[] = [];
		page.on('console', (msg) => {
			if (msg.type() === 'error') {
				consoleErrors.push(msg.text());
			}
		});

		await page.waitForTimeout(1000);
		expect(consoleErrors).toHaveLength(0);
	});

	test('should display all navigation tabs', async ({ page }) => {
		const tabs = getNavigationTabs(page);

		// Check all tabs are visible
		await expect(tabs.overview).toBeVisible();
		await expect(tabs.scan).toBeVisible();
		await expect(tabs.recipes).toBeVisible();
		await expect(tabs.days).toBeVisible();
		await expect(tabs.goals).toBeVisible();
		await expect(tabs.analysis).toBeVisible();
		await expect(tabs.planner).toBeVisible();
		await expect(tabs.fridge).toBeVisible();
		await expect(tabs.cook).toBeVisible();
		await expect(tabs.tools).toBeVisible();
	});

	test('should navigate between tabs correctly', async ({ page }) => {
		const tabs = getNavigationTabs(page);

		// Test Overview tab (default)
		await expect(page.getByText("Today's Calories")).toBeVisible();

		// Test Scan tab
		await tabs.scan.click();
		await expect(page.getByText('Barcode Scanner')).toBeVisible({
			timeout: 10000,
		});

		// Test Recipes tab
		await tabs.recipes.click();
		await expect(page.getByText(/My Recipes|No recipes yet/)).toBeVisible({
			timeout: 10000,
		});

		// Test Days tab
		await tabs.days.click();
		await expect(page.getByRole('heading', { name: /Daily Tracker/i })).toBeVisible({ timeout: 10000 });

		// Test Goals tab
		await tabs.goals.click();
		await expect(page.getByRole('heading', { name: /Nutrition Goals/i })).toBeVisible({ timeout: 10000 });

		// Test Tools tab
		await tabs.tools.click();
		await expect(page.getByText(/Unit Converter/i)).toBeVisible({
			timeout: 10000,
		});
	});

	test('should handle guest mode with local storage', async ({ page }) => {
		// Verify guest mode banner appears
		await expect(page.getByText(/Sign in to save your data/i)).toBeVisible();

		// Create a recipe as guest
		const tabs = getNavigationTabs(page);
		await tabs.recipes.click();

		// Click create recipe button
		await page.getByRole('button', { name: /Create.*Recipe/i }).click();

		// Should see local storage warning
		await expect(page.getByText(/saved locally/i)).toBeVisible();
	});

	test('should create and save a recipe in guest mode', async ({ page }) => {
		const tabs = getNavigationTabs(page);
		await tabs.recipes.click();

		// Click create recipe
		await page.getByRole('button', { name: /Create.*Recipe/i }).click();

		// Fill recipe form
		const recipeName = `Guest Recipe ${Date.now()}`;
		const inputs = getRecipeFormInputs(page);

		await inputs.name.fill(recipeName);
		await inputs.description.fill('A delicious test recipe');
		await inputs.prepTime.fill('10');
		await inputs.cookTime.fill('20');
		await inputs.servings.fill('4');

		// Save recipe
		await page.getByRole('button', { name: /Save Recipe/i }).click();

		// Verify recipe was saved
		await expect(page.getByText(recipeName)).toBeVisible({ timeout: 10000 });

		// Reload page and verify recipe persists
		await page.reload();
		await tabs.recipes.click();
		await expect(page.getByText(recipeName)).toBeVisible({ timeout: 10000 });
	});

	test('should search for recipes', async ({ page }) => {
		const tabs = getNavigationTabs(page);
		await tabs.recipes.click();

		// Find search input
		const searchInput = page.getByPlaceholder(/Search recipes/i);
		await searchInput.fill('pasta');

		// Wait for search results
		await page.waitForTimeout(500); // Debounce delay

		// Verify search is working (either results or no results message)
		await expect(page.getByText(/pasta/i).or(page.getByText(/No results found/i))).toBeVisible();
	});

	test('should use barcode scanner', async ({ page }) => {
		const tabs = getNavigationTabs(page);
		await tabs.scan.click();

		// Verify scanner UI elements
		await expect(page.getByText('Barcode Scanner')).toBeVisible();
		await expect(page.getByPlaceholder(/Enter barcode manually/i)).toBeVisible();

		// Test manual barcode entry
		const barcodeInput = page.getByPlaceholder(/Enter barcode manually/i);
		await barcodeInput.fill('1234567890');

		// Should show product lookup or not found message
		await expect(page.getByText(/Searching/i).or(page.getByText(/Product not found/i))).toBeVisible({ timeout: 10000 });
	});

	test('should manage daily nutrition tracking', async ({ page }) => {
		const tabs = getNavigationTabs(page);
		await tabs.days.click();

		// Verify daily tracker UI
		await expect(page.getByRole('heading', { name: /Daily Tracker/i })).toBeVisible();

		// Should show current date
		const today = new Date().toLocaleDateString();
		await expect(page.getByText(new RegExp(today))).toBeVisible();

		// Verify nutrition summary is displayed
		await expect(page.getByText(/Calories:/i)).toBeVisible();
		await expect(page.getByText(/Protein:/i)).toBeVisible();
		await expect(page.getByText(/Carbs:/i)).toBeVisible();
		await expect(page.getByText(/Fat:/i)).toBeVisible();
	});

	test('should set and display nutrition goals', async ({ page }) => {
		const tabs = getNavigationTabs(page);
		await tabs.goals.click();

		// Set calorie goal
		const calorieInput = page.getByLabel(/Daily Calorie Goal/i);
		await calorieInput.fill('2000');

		// Set protein goal
		const proteinInput = page.getByLabel(/Daily Protein Goal/i);
		await proteinInput.fill('50');

		// Save goals
		await page.getByRole('button', { name: /Save Goals/i }).click();

		// Verify goals are saved
		await expect(page.getByText(/Goals saved/i)).toBeVisible();

		// Navigate back to overview
		await tabs.overview.click();

		// Verify goals are displayed
		await expect(page.getByText(/2000.*cal/i)).toBeVisible();
	});

	test('should use unit converter tool', async ({ page }) => {
		const tabs = getNavigationTabs(page);
		await tabs.tools.click();

		// Test weight conversion
		const fromValue = page.getByPlaceholder(/Enter value/i).first();
		await fromValue.fill('100');

		const fromUnit = page.getByRole('combobox').first();
		await fromUnit.selectOption('g');

		const toUnit = page.getByRole('combobox').last();
		await toUnit.selectOption('oz');

		// Verify conversion result
		await expect(page.getByText(/3.527/i)).toBeVisible();
	});

	test('should access cooking mode', async ({ page }) => {
		const tabs = getNavigationTabs(page);
		await tabs.cook.click();

		// Verify cooking mode UI
		await expect(page.getByText(/Cooking Mode/i).or(page.getByText(/Select a recipe to start cooking/i))).toBeVisible();

		// If recipes exist, test cooking mode features
		const recipeSelect = page.getByRole('combobox', { name: /Select recipe/i });
		if (await recipeSelect.isVisible()) {
			// Test timer functionality
			await expect(page.getByRole('button', { name: /Start Timer/i })).toBeVisible();
		}
	});

	test('should manage fridge inventory', async ({ page }) => {
		const tabs = getNavigationTabs(page);
		await tabs.fridge.click();

		// Verify fridge management UI
		await expect(page.getByText(/Fridge Inventory/i)).toBeVisible();

		// Add item to fridge
		const addButton = page.getByRole('button', { name: /Add Item/i });
		if (await addButton.isVisible()) {
			await addButton.click();

			// Fill item details
			const itemName = page.getByPlaceholder(/Item name/i);
			await itemName.fill('Milk');

			const quantity = page.getByPlaceholder(/Quantity/i);
			await quantity.fill('1');

			// Save item
			await page.getByRole('button', { name: /Save/i }).click();

			// Verify item was added
			await expect(page.getByText('Milk')).toBeVisible();
		}
	});

	test('mobile navigation should work correctly', async ({ page }) => {
		// Set mobile viewport
		await page.setViewportSize({ width: 375, height: 667 });

		const tabs = getNavigationTabs(page);

		// Navigation should still be accessible
		await expect(tabs.recipes).toBeVisible();

		// Navigate to different tabs
		await tabs.goals.click();
		await expect(page.getByRole('heading', { name: /Nutrition Goals/i })).toBeVisible();

		// Test horizontal scrolling of tabs if needed
		await tabs.tools.click();
		await expect(page.getByText(/Unit Converter/i)).toBeVisible();
	});

	test('should show analysis charts', async ({ page }) => {
		const tabs = getNavigationTabs(page);
		await tabs.analysis.click();

		// Verify analysis page loads
		await expect(page.getByText(/Nutrition Analysis/i)).toBeVisible();

		// Check for chart elements
		await expect(page.getByText(/Weekly Overview/i).or(page.getByText(/No data to display/i))).toBeVisible();
	});

	test('should handle meal planning', async ({ page }) => {
		const tabs = getNavigationTabs(page);
		await tabs.planner.click();

		// Verify meal planner UI
		await expect(page.getByText(/Meal Planner/i)).toBeVisible();

		// Check for week view
		await expect(page.getByText(/Monday/i)).toBeVisible();
		await expect(page.getByText(/Sunday/i)).toBeVisible();

		// Test adding a meal to a day
		const addMealButton = page.getByRole('button', { name: /Add Meal/i }).first();
		if (await addMealButton.isVisible()) {
			await addMealButton.click();

			// Should show meal selection dialog
			await expect(page.getByText(/Select a recipe/i)).toBeVisible();
		}
	});
});
