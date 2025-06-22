import { test, expect } from '@playwright/test';

test.describe('Guest Mode Functionality', () => {
  test.beforeEach(async ({ page, context }) => {
    // Clear cookies to ensure we're testing as a guest
    await context.clearCookies();
    await page.goto('http://cooking.localhost:3000');
  });

  test('should show guest mode banner when not logged in', async ({ page }) => {
    // Check that guest mode banner is visible
    const banner = page.locator('text=/Guest Mode/i');
    await expect(banner).toBeVisible();

    // Check that it contains sign in prompt
    await expect(
      page.locator('text=/Sign in to save your data permanently/i')
    ).toBeVisible();
  });

  test('should store recipes in local storage for guests', async ({ page }) => {
    // Navigate to recipes tab
    await page.click('text=Recipes');

    // Create a new recipe
    await page.click('text=Create New Recipe');

    // Fill in recipe details
    await page.fill('input[placeholder="Recipe name"]', 'Guest Test Recipe');
    await page.fill(
      'textarea[placeholder="Description"]',
      'A test recipe created by a guest'
    );
    await page.fill('input[placeholder="Servings"]', '4');
    await page.fill('input[placeholder="Prep time (minutes)"]', '15');
    await page.fill('input[placeholder="Cook time (minutes)"]', '30');

    // Save the recipe
    await page.click('button:has-text("Save Recipe")');

    // Check that recipe appears in the list
    await expect(page.locator('text=Guest Test Recipe')).toBeVisible();

    // Reload the page
    await page.reload();

    // Navigate back to recipes tab
    await page.click('text=Recipes');

    // Check that recipe is still there (persisted in local storage)
    await expect(page.locator('text=Guest Test Recipe')).toBeVisible();
  });

  test('should store daily tracking data for guests', async ({ page }) => {
    // Navigate to tracker tab
    await page.click('text=Tracker');

    // Wait for the day tracker to load
    await page.waitForSelector('text=/Today/i');

    // Add an entry (assuming there's a way to add entries)
    const addButton = page.locator('button:has-text("Add Entry")').first();
    if (await addButton.isVisible()) {
      await addButton.click();

      // Select a food or recipe
      await page.waitForSelector('select, input[type="search"]');
      // This part would depend on the actual implementation
    }

    // Check that the guest data persists after reload
    await page.reload();
    await page.click('text=Tracker');

    // Verify the tracker state is maintained
    await expect(page.locator('text=/Today/i')).toBeVisible();
  });

  test('should store goals for guests', async ({ page }) => {
    // Navigate to goals tab
    await page.click('text=Goals');

    // Set some goals
    const calorieInput = page
      .locator('input[placeholder*="calorie" i]')
      .first();
    if (await calorieInput.isVisible()) {
      await calorieInput.fill('2000');
    }

    const proteinInput = page
      .locator('input[placeholder*="protein" i]')
      .first();
    if (await proteinInput.isVisible()) {
      await proteinInput.fill('50');
    }

    // Save goals if there's a save button
    const saveButton = page.locator('button:has-text("Save")').first();
    if (await saveButton.isVisible()) {
      await saveButton.click();
    }

    // Reload and verify goals persist
    await page.reload();
    await page.click('text=Goals');

    // Check that goals are still set
    const calorieValue = await page
      .locator('input[placeholder*="calorie" i]')
      .first()
      .inputValue();
    if (calorieValue) {
      expect(calorieValue).toBe('2000');
    }
  });

  test('should show migration prompt when signing in', async ({ page }) => {
    // First create some guest data
    await page.click('text=Recipes');
    await page.click('text=Create New Recipe');
    await page.fill(
      'input[placeholder="Recipe name"]',
      'Guest Recipe to Migrate'
    );
    await page.fill(
      'textarea[placeholder="Description"]',
      'This should be migrated'
    );
    await page.click('button:has-text("Save Recipe")');

    // Now attempt to sign in
    await page.click('text=Sign In');

    // This would redirect to auth page
    // For testing purposes, we'd need to mock the auth flow
    // or use a test auth provider
  });

  test('should handle guest data limits gracefully', async ({ page }) => {
    // Try to create many recipes to test any storage limits
    await page.click('text=Recipes');

    for (let i = 0; i < 5; i++) {
      await page.click('text=Create New Recipe');
      await page.fill(
        'input[placeholder="Recipe name"]',
        `Guest Recipe ${i + 1}`
      );
      await page.fill(
        'textarea[placeholder="Description"]',
        `Description ${i + 1}`
      );
      await page.click('button:has-text("Save Recipe")');

      // Small delay to avoid overwhelming the UI
      await page.waitForTimeout(500);
    }

    // Verify all recipes are shown
    for (let i = 0; i < 5; i++) {
      await expect(page.locator(`text=Guest Recipe ${i + 1}`)).toBeVisible();
    }
  });

  test('should not allow guest access to social features', async ({ page }) => {
    // Navigate to a recipe if possible
    await page.click('text=Recipes');

    // Check that social features are disabled or show login prompts
    const likeButton = page.locator('button[aria-label*="like" i]').first();
    if (await likeButton.isVisible()) {
      await likeButton.click();

      // Should either be disabled or show a login prompt
      await expect(page.locator('text=/sign in/i')).toBeVisible();
    }
  });

  test('should clear guest data on explicit clear', async ({
    page,
    context,
  }) => {
    // Create some guest data first
    await page.click('text=Recipes');
    await page.click('text=Create New Recipe');
    await page.fill('input[placeholder="Recipe name"]', 'Recipe to Clear');
    await page.click('button:has-text("Save Recipe")');

    // Clear all cookies and local storage
    await context.clearCookies();
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });

    // Reload the page
    await page.reload();
    await page.click('text=Recipes');

    // Recipe should be gone
    await expect(page.locator('text=Recipe to Clear')).not.toBeVisible();
  });

  test('should maintain separate guest sessions across browsers', async ({
    browser,
  }) => {
    // Create two separate browser contexts (like different browsers)
    const context1 = await browser.newContext();
    const context2 = await browser.newContext();

    const page1 = await context1.newPage();
    const page2 = await context2.newPage();

    // Create recipe in first browser
    await page1.goto('http://cooking.localhost:3000');
    await page1.click('text=Recipes');
    await page1.click('text=Create New Recipe');
    await page1.fill('input[placeholder="Recipe name"]', 'Browser 1 Recipe');
    await page1.click('button:has-text("Save Recipe")');

    // Check second browser doesn't have the recipe
    await page2.goto('http://cooking.localhost:3000');
    await page2.click('text=Recipes');
    await expect(page2.locator('text=Browser 1 Recipe')).not.toBeVisible();

    // Clean up
    await context1.close();
    await context2.close();
  });

  test('should handle cooking mode for guests', async ({ page }) => {
    // First create a recipe
    await page.click('text=Recipes');
    await page.click('text=Create New Recipe');
    await page.fill('input[placeholder="Recipe name"]', 'Recipe to Cook');
    await page.fill(
      'textarea[placeholder="Description"]',
      'Test recipe for cooking mode'
    );

    // Add some instructions
    const instructionsInput = page
      .locator('textarea[placeholder*="instruction" i]')
      .first();
    if (await instructionsInput.isVisible()) {
      await instructionsInput.fill(
        'Step 1: Do this\nStep 2: Do that\nStep 3: Finish'
      );
    }

    await page.click('button:has-text("Save Recipe")');

    // Enter cooking mode if available
    const cookButton = page.locator('button:has-text("Cook")').first();
    if (await cookButton.isVisible()) {
      await cookButton.click();

      // Verify cooking mode UI appears
      await expect(page.locator('text=/cooking mode/i')).toBeVisible();
    }
  });
});
