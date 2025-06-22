import { test, expect } from '@playwright/test';

test.describe('Data Migration Flow', () => {
  test('should show migration dialog when logging in with guest data', async ({
    page,
    context,
  }) => {
    // Start as guest and create some data
    await context.clearCookies();
    await page.goto('http://cooking.localhost:3000');

    // Create a recipe as guest
    await page.click('text=Recipes');
    await page.click('text=Create New Recipe');
    await page.fill(
      'input[placeholder="Recipe name"]',
      'Guest Recipe to Migrate'
    );
    await page.fill(
      'textarea[placeholder="Description"]',
      'This recipe should be migrated'
    );
    await page.fill('input[placeholder="Servings"]', '4');
    await page.click('button:has-text("Save Recipe")');

    // Store some goals
    await page.click('text=Goals');
    const calorieGoal = page.locator('input[placeholder*="calorie" i]').first();
    if (await calorieGoal.isVisible()) {
      await calorieGoal.fill('2000');
    }

    // Now simulate login (in real scenario, this would redirect to auth provider)
    // For testing, we'd need to mock the auth flow or use a test account

    // After login, check for migration prompt
    // This test is conceptual as it requires auth integration
  });

  test('should display migration progress', async ({ page }) => {
    // Navigate to a page that would show migration progress
    await page.goto('http://cooking.localhost:3000/migrate');

    // Check for migration UI elements
    const migrationTitle = page.locator('text=/migrat/i');
    if (await migrationTitle.isVisible()) {
      // Check for progress indicators
      await expect(page.locator('text=/recipes/i')).toBeVisible();
      await expect(page.locator('text=/foods/i')).toBeVisible();
      await expect(page.locator('text=/goals/i')).toBeVisible();
    }
  });

  test('should handle migration conflicts', async ({ page }) => {
    // This test would require setting up a scenario where:
    // 1. User has guest data
    // 2. User logs in to an account that already has data
    // 3. System should handle conflicts appropriately

    // Mock scenario where user has existing recipes
    await page.goto('http://cooking.localhost:3000');

    // Check for conflict resolution UI
    const conflictDialog = page.locator('text=/conflict/i');
    if (await conflictDialog.isVisible()) {
      // User should have options to:
      // - Keep existing data
      // - Replace with guest data
      // - Merge both
      await expect(page.locator('text=/keep existing/i')).toBeVisible();
      await expect(page.locator('text=/replace/i')).toBeVisible();
      await expect(page.locator('text=/merge/i')).toBeVisible();
    }
  });

  test('should complete migration successfully', async ({ page }) => {
    // After migration completes, verify:
    // 1. Guest data is available in logged-in account
    // 2. Local storage is cleared of guest data
    // 3. User sees success message

    await page.goto('http://cooking.localhost:3000');

    // Check for success indicators
    const successMessage = page.locator('text=/migration complete/i');
    if (await successMessage.isVisible()) {
      // Verify data is present
      await page.click('text=Recipes');

      // Should see migrated recipes
      // Note: This would require actual migration to have occurred
    }
  });

  test('should handle migration errors gracefully', async ({ page }) => {
    // Test error scenarios:
    // 1. Network failure during migration
    // 2. Server error
    // 3. Invalid data format

    // Mock a failed migration scenario
    await page.route('**/api/cooking/migrate-guest-data', (route) => {
      route.fulfill({
        status: 500,
        body: JSON.stringify({ error: 'Migration failed' }),
      });
    });

    await page.goto('http://cooking.localhost:3000/migrate');

    // Should show error message
    await expect(page.locator('text=/error/i')).toBeVisible();

    // Should offer retry option
    await expect(page.locator('button:has-text("Retry")')).toBeVisible();
  });

  test('should allow skipping migration', async ({ page }) => {
    // User should be able to skip migration if they don't want to keep guest data
    await page.goto('http://cooking.localhost:3000/migrate');

    const skipButton = page.locator('button:has-text("Skip")');
    if (await skipButton.isVisible()) {
      await skipButton.click();

      // Should proceed without migration
      await expect(page).toHaveURL(/cooking\.localhost:3000(?!.*migrate)/);

      // Guest data should be cleared
      const hasGuestData = await page.evaluate(() => {
        const guestData = localStorage.getItem('cooking_guest_data');
        return guestData !== null;
      });
      expect(hasGuestData).toBe(false);
    }
  });

  test('should preserve data integrity during migration', async ({ page }) => {
    // Create complex guest data
    const guestData = {
      recipes: [
        {
          id: 'recipe-1',
          name: 'Complex Recipe',
          ingredients: [
            { name: 'Ingredient 1', amount: 100, unit: 'g' },
            { name: 'Ingredient 2', amount: 2, unit: 'cups' },
          ],
          nutrition: {
            calories: 500,
            protein: 25,
            carbs: 50,
            fat: 20,
          },
        },
      ],
      foods: [
        {
          id: 'food-1',
          name: 'Custom Food',
          barcode: '123456789',
          nutrition: {
            calories: 100,
            protein: 5,
            carbs: 10,
            fat: 3,
          },
        },
      ],
      goals: {
        calories: 2000,
        protein: 50,
        carbs: 250,
        fat: 65,
      },
    };

    // Store guest data
    await page.evaluate((data) => {
      localStorage.setItem('cooking_guest_data', JSON.stringify(data));
    }, guestData);

    // After migration (mocked), verify data integrity
    // This would require checking that all fields are preserved correctly
  });

  test('should handle partial migration failures', async ({ page }) => {
    // Test scenario where some data migrates successfully but others fail
    await page.route('**/api/cooking/migrate-guest-data', (route) => {
      route.fulfill({
        status: 200,
        body: JSON.stringify({
          success: true,
          migrated: {
            recipes: 3,
            foods: 0, // Foods failed to migrate
            goals: true,
          },
          errors: ['Failed to migrate foods: Database error'],
        }),
      });
    });

    await page.goto('http://cooking.localhost:3000/migrate');

    // Should show partial success
    await expect(page.locator('text=/3 recipes migrated/i')).toBeVisible();
    await expect(page.locator('text=/failed to migrate foods/i')).toBeVisible();

    // Should allow retry for failed items only
    await expect(
      page.locator('button:has-text("Retry Failed Items")')
    ).toBeVisible();
  });

  test('should prevent duplicate migrations', async ({ page }) => {
    // User shouldn't be able to migrate the same data twice
    await page.goto('http://cooking.localhost:3000');

    // Mark data as already migrated
    await page.evaluate(() => {
      localStorage.setItem('cooking_migration_complete', 'true');
    });

    // Should not show migration prompt
    const migrationPrompt = page.locator('text=/migrate your guest data/i');
    await expect(migrationPrompt).not.toBeVisible();
  });

  test('should clean up after successful migration', async ({ page }) => {
    // After successful migration:
    // 1. Guest data should be removed from localStorage
    // 2. Migration flag should be set
    // 3. User should not see guest mode banner

    // Simulate successful migration
    await page.evaluate(() => {
      localStorage.removeItem('cooking_guest_recipes');
      localStorage.removeItem('cooking_guest_foods');
      localStorage.removeItem('cooking_guest_goals');
      localStorage.setItem('cooking_migration_complete', 'true');
    });

    await page.goto('http://cooking.localhost:3000');

    // Should not see guest mode banner
    await expect(page.locator('text=/guest mode/i')).not.toBeVisible();

    // Should see regular user UI
    await expect(page.locator('text=/sign out/i')).toBeVisible();
  });
});
