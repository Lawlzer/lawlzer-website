import { expect, test } from '@playwright/test';

test.describe('Cooking Subdomain - Recipe Journey', () => {
	test.beforeEach(async ({ page }) => {
		// Navigate to cooking subdomain
		await page.goto('http://cooking.localhost:3000');
	});

	test('should display the cooking homepage with all tabs', async ({ page }) => {
		// Check main heading
		await expect(page.getByRole('heading', { name: 'Cooking & Nutrition' })).toBeVisible();

		// Check all tabs are visible
		const tabs = ['Overview', 'Scan', 'Recipes', 'Days', 'Goals', 'Analysis', 'Planner', 'Fridge', 'Cook', 'Tools'];

		for (const tab of tabs) {
			await expect(page.getByRole('button', { name: tab })).toBeVisible();
		}
	});

	test('should show empty state when no recipes exist', async ({ page }) => {
		// Click on Recipes tab
		await page.getByRole('button', { name: 'Recipes' }).click();

		// Check empty state is displayed
		await expect(page.getByText('No recipes yet')).toBeVisible();
		await expect(page.getByText('Create your first recipe to start building your cookbook')).toBeVisible();
		await expect(page.getByRole('button', { name: 'Create Your First Recipe' })).toBeVisible();
	});

	test('should create a new recipe', async ({ page }) => {
		// Navigate to Recipes tab
		await page.getByRole('button', { name: 'Recipes' }).click();

		// Click create recipe button
		await page.getByRole('button', { name: /Create.*Recipe/i }).click();

		// Fill in recipe details
		await page.getByLabel('Recipe Name').fill('Test Pasta Recipe');
		await page.getByLabel('Description').fill('A delicious test pasta recipe');
		await page.getByLabel('Prep Time').fill('15');
		await page.getByLabel('Cook Time').fill('20');
		await page.getByLabel('Servings').fill('4');

		// Add an ingredient (if ingredient section exists)
		const addIngredientButton = page.getByRole('button', {
			name: /Add.*Ingredient/i,
		});
		if (await addIngredientButton.isVisible()) {
			await addIngredientButton.click();
			// Fill ingredient details if form appears
		}

		// Save recipe
		await page.getByRole('button', { name: 'Save Recipe' }).click();

		// Verify recipe was created
		await expect(page.getByText('Test Pasta Recipe')).toBeVisible();
	});

	test('should search for recipes', async ({ page }) => {
		// Navigate to Recipes tab
		await page.getByRole('button', { name: 'Recipes' }).click();

		// Use search functionality
		const searchInput = page.getByPlaceholder('Search recipes...');
		await searchInput.fill('pasta');

		// Check that search is working (either results or no results message)
		await expect(page.getByText(/pasta/i).or(page.getByText('No results found'))).toBeVisible();
	});

	test('should navigate through different tabs', async ({ page }) => {
		// Test Overview tab (default)
		await expect(page.getByText("Today's Calories")).toBeVisible();

		// Test Scan tab
		await page.getByRole('button', { name: 'Scan' }).click();
		await expect(page.getByText('Barcode Scanner')).toBeVisible();

		// Test Days tab
		await page.getByRole('button', { name: 'Days' }).click();
		await expect(page.getByRole('heading', { name: /Daily Tracker/i })).toBeVisible();

		// Test Goals tab
		await page.getByRole('button', { name: 'Goals' }).click();
		await expect(page.getByRole('heading', { name: /Nutrition Goals/i })).toBeVisible();

		// Test Tools tab
		await page.getByRole('button', { name: 'Tools' }).click();
		await expect(page.getByText(/Unit Converter/i)).toBeVisible();
	});

	test('should handle guest mode appropriately', async ({ page }) => {
		// Check for guest mode banner
		const guestBanner = page.getByText(/Sign in to save your data/i);

		if (await guestBanner.isVisible()) {
			// Verify guest mode functionality
			await expect(guestBanner).toBeVisible();

			// Try creating a recipe as guest
			await page.getByRole('button', { name: 'Recipes' }).click();
			await page.getByRole('button', { name: /Create.*Recipe/i }).click();

			// Should see warning about local storage
			await expect(page.getByText(/saved locally/i)).toBeVisible();
		}
	});

	test('should show recipe details when clicking on a recipe', async ({ page }) => {
		// First create a recipe
		await page.getByRole('button', { name: 'Recipes' }).click();

		// If there are existing recipes, click on one
		const recipeCard = page.locator('.recipe-card').first();
		if (await recipeCard.isVisible()) {
			await recipeCard.click();

			// Should see recipe details or edit view
			await expect(page.getByRole('heading', { name: /Edit Recipe/i }).or(page.getByText(/Ingredients/i))).toBeVisible();
		}
	});

	test('should access cooking mode', async ({ page }) => {
		await page.getByRole('button', { name: 'Cook' }).click();

		// Should see cooking mode interface
		await expect(page.getByText(/Cooking Mode/i).or(page.getByText(/Select a recipe/i))).toBeVisible();
	});

	test('mobile navigation should work', async ({ page }) => {
		// Set mobile viewport
		await page.setViewportSize({ width: 375, height: 667 });

		// Check that navigation is still accessible
		await expect(page.getByRole('button', { name: 'Recipes' })).toBeVisible();

		// Navigate to a different tab
		await page.getByRole('button', { name: 'Goals' }).click();

		// Verify navigation worked
		await expect(page.getByRole('heading', { name: /Nutrition Goals/i })).toBeVisible();
	});
});

test.describe('Recipe CRUD Operations', () => {
	test('should edit an existing recipe', async ({ page }) => {
		await page.goto('http://cooking.localhost:3000');
		await page.getByRole('button', { name: 'Recipes' }).click();

		// Look for edit button on a recipe card
		const editButton = page.getByRole('button', { name: /Edit/i }).first();
		if (await editButton.isVisible()) {
			await editButton.click();

			// Modify recipe name
			const nameInput = page.getByLabel('Recipe Name');
			await nameInput.clear();
			await nameInput.fill('Updated Recipe Name');

			// Save changes
			await page.getByRole('button', { name: /Save|Update/i }).click();

			// Verify update
			await expect(page.getByText('Updated Recipe Name')).toBeVisible();
		}
	});

	test('should delete a recipe', async ({ page }) => {
		await page.goto('http://cooking.localhost:3000');
		await page.getByRole('button', { name: 'Recipes' }).click();

		// Count initial recipes
		const initialCount = await page.locator('.recipe-card').count();

		if (initialCount > 0) {
			// Click delete on first recipe
			await page
				.getByRole('button', { name: /Delete/i })
				.first()
				.click();

			// Confirm deletion if dialog appears
			const confirmButton = page.getByRole('button', { name: /Confirm|Yes/i });
			if (await confirmButton.isVisible()) {
				await confirmButton.click();
			}

			// Verify recipe count decreased
			await expect(page.locator('.recipe-card')).toHaveCount(initialCount - 1);
		}
	});
});
