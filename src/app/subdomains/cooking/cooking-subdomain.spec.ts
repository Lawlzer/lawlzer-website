import { expect, test } from '@playwright/test';

test.describe('Cooking Subdomain', () => {
	const devUrl = 'http://cooking.localhost:3000/';
	test.setTimeout(30000); // Set timeout for all tests in this describe block

	test.beforeEach(async ({ page, context }) => {
		// Set cookie on the correct domain before navigating
		await context.addCookies([
			{
				name: 'cooking_guest_data',
				value: JSON.stringify({
					foods: [
						{
							guestId: 'test-food-id',
							barcode: '12345',
							name: 'Flour',
							brand: 'Test Brand',
							calories: 100,
							protein: 10,
							carbs: 76,
							fat: 1,
							fiber: 1,
							sugar: 0,
							sodium: 0,
							createdAt: new Date().toISOString(),
							updatedAt: new Date().toISOString(),
							visibility: 'private',
						},
					],
					recipes: [],
					days: [],
					goals: [],
				}),
				domain: '.localhost', // Set the cookie on the parent domain to work across subdomains
				path: '/',
			},
		]);

		// Navigate directly to the development URL
		await page.goto(devUrl);
		// Wait for the main heading to ensure the page is loaded
		await expect(page.getByRole('heading', { name: 'Cooking & Nutrition' })).toBeVisible({ timeout: 30000 });
	});

	test('should allow creating a new recipe as a guest', async ({ page }) => {
		// Navigate to the recipes tab
		await page.getByRole('button', { name: 'Recipes' }).click();

		// Wait for the recipes tab content to load
		await expect(page.getByText('My Recipes')).toBeVisible();

		// Click the create recipe button - use the specific class to avoid ambiguity
		await page.locator('button:has-text("Create Recipe")').first().click();

		// Wait for the RecipeCreator component to render
		await expect(page.getByText('Create New Recipe')).toBeVisible();

		// Fill in the recipe name using the actual placeholder from the form
		const recipeName = `Test Recipe ${Date.now()}`;
		await page.locator('input[type="text"]').first().fill(recipeName);

		// Fill in servings (required field)
		await page.locator('input[type="number"]').first().fill('2');

		// Select food type (already selected by default)
		// Find and select the food dropdown
		await page.selectOption('select:has(option:text("Select a food..."))', {
			index: 1,
		}); // Select first food

		// Fill in the amount
		await page.locator('input[placeholder="Amount"]').fill('150');

		// Click Add Ingredient button
		await page.getByRole('button', { name: 'Add Ingredient' }).click();

		// Wait for ingredient to be added
		await expect(page.getByText('Food:')).toBeVisible();

		// Save the recipe
		await page.getByRole('button', { name: 'Save Recipe' }).click();

		// Wait for success and verify we're back to the recipe list
		await expect(page.getByText('My Recipes')).toBeVisible();
		await expect(page.getByText(recipeName)).toBeVisible();
	});
});
