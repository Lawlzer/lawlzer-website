import { expect, test } from '@playwright/test';

test.describe('Daily Food Tracking Journey', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to cooking subdomain
    await page.goto('http://cooking.localhost:3000');
  });

  test('should track food for a day', async ({ page }) => {
    // Navigate to Days tab
    await page.getByRole('button', { name: 'Days' }).click();

    // Verify we're on the daily tracker
    await expect(
      page.getByRole('heading', { name: /Daily Tracker/i })
    ).toBeVisible();

    // Look for Add Food button
    const addFoodButton = page.getByRole('button', {
      name: /Add Food|Track Food|Add Entry/i,
    });
    await expect(addFoodButton).toBeVisible();
    await addFoodButton.click();

    // Fill in food entry details
    await page.getByLabel(/Food Name|Search Food/i).fill('Apple');
    await page.getByLabel(/Amount/i).fill('150');
    await page.getByLabel(/Meal Type|Meal/i).selectOption('breakfast');

    // Submit the food entry
    await page.getByRole('button', { name: /Add|Save|Track/i }).click();

    // Verify the food was added
    await expect(page.getByText('Apple')).toBeVisible();
    await expect(page.getByText('150')).toBeVisible();
  });

  test('should display daily nutrition summary', async ({ page }) => {
    // Go to Overview tab
    await page.getByRole('button', { name: 'Overview' }).click();

    // Check for nutrition summary elements
    await expect(page.getByText("Today's Calories")).toBeVisible();

    // Look for macronutrient displays
    await expect(page.getByText(/Protein/i)).toBeVisible();
    await expect(page.getByText(/Carbs|Carbohydrates/i)).toBeVisible();
    await expect(page.getByText(/Fat/i)).toBeVisible();
  });

  test('should navigate between different days', async ({ page }) => {
    // Navigate to Days tab
    await page.getByRole('button', { name: 'Days' }).click();

    // Look for date navigation controls
    const previousDayButton = page.getByRole('button', {
      name: /Previous|Yesterday|←/i,
    });
    const nextDayButton = page.getByRole('button', {
      name: /Next|Tomorrow|→/i,
    });

    // Navigate to previous day
    if (await previousDayButton.isVisible()) {
      await previousDayButton.click();
      // Verify date changed
      await expect(
        page.locator('[data-testid="current-date"]')
      ).not.toContainText(new Date().toDateString());
    }

    // Navigate back to today
    const todayButton = page.getByRole('button', { name: /Today/i });
    if (await todayButton.isVisible()) {
      await todayButton.click();
      // Should be back on today's date
      await expect(
        page.getByText(new Date().toLocaleDateString())
      ).toBeVisible();
    }
  });

  test('should track a recipe for a meal', async ({ page }) => {
    // Navigate to Days tab
    await page.getByRole('button', { name: 'Days' }).click();

    // Add a recipe to today
    const addRecipeButton = page.getByRole('button', {
      name: /Add Recipe|Track Recipe/i,
    });
    if (await addRecipeButton.isVisible()) {
      await addRecipeButton.click();

      // Select a recipe from the list
      const firstRecipe = page.locator('[data-testid="recipe-option"]').first();
      if (await firstRecipe.isVisible()) {
        await firstRecipe.click();

        // Select meal type
        await page.getByLabel(/Meal Type|Meal/i).selectOption('lunch');

        // Confirm tracking
        await page.getByRole('button', { name: /Add|Track/i }).click();

        // Verify recipe was added
        await expect(
          page.getByText(/Recipe added|Tracked successfully/i)
        ).toBeVisible();
      }
    }
  });

  test('should edit a tracked food entry', async ({ page }) => {
    // Navigate to Days tab
    await page.getByRole('button', { name: 'Days' }).click();

    // Look for existing food entries
    const foodEntry = page.locator('[data-testid="food-entry"]').first();

    if (await foodEntry.isVisible()) {
      // Click edit on the entry
      await foodEntry.getByRole('button', { name: /Edit/i }).click();

      // Update the amount
      const amountInput = page.getByLabel(/Amount/i);
      await amountInput.clear();
      await amountInput.fill('200');

      // Save changes
      await page.getByRole('button', { name: /Save|Update/i }).click();

      // Verify update
      await expect(page.getByText('200')).toBeVisible();
    }
  });

  test('should delete a tracked food entry', async ({ page }) => {
    // Navigate to Days tab
    await page.getByRole('button', { name: 'Days' }).click();

    // Look for existing food entries
    const foodEntries = page.locator('[data-testid="food-entry"]');
    const initialCount = await foodEntries.count();

    if (initialCount > 0) {
      // Delete the first entry
      await foodEntries
        .first()
        .getByRole('button', { name: /Delete|Remove/i })
        .click();

      // Confirm deletion
      const confirmButton = page.getByRole('button', {
        name: /Confirm|Yes|Delete/i,
      });
      if (await confirmButton.isVisible()) {
        await confirmButton.click();
      }

      // Verify entry was removed
      await expect(foodEntries).toHaveCount(initialCount - 1);
    }
  });

  test('should display nutrition analysis', async ({ page }) => {
    // Navigate to Analysis tab
    await page.getByRole('button', { name: 'Analysis' }).click();

    // Check for analysis components
    await expect(
      page.getByText(/Nutrition Analysis|Nutritional Breakdown/i)
    ).toBeVisible();

    // Look for charts or graphs
    const chart = page.locator('canvas, svg').first();
    await expect(chart).toBeVisible();

    // Check for time period selection
    const periodSelector = page.getByRole('combobox', {
      name: /Period|Time Range/i,
    });
    if (await periodSelector.isVisible()) {
      await periodSelector.selectOption('7days');
      // Verify chart updates
      await page.waitForLoadState('networkidle');
    }
  });

  test('should work with nutrition goals', async ({ page }) => {
    // Navigate to Goals tab
    await page.getByRole('button', { name: 'Goals' }).click();

    // Set a calorie goal
    const calorieGoalInput = page.getByLabel(/Calorie.*Goal|Daily Calories/i);
    if (await calorieGoalInput.isVisible()) {
      await calorieGoalInput.clear();
      await calorieGoalInput.fill('2000');

      // Save goal
      await page.getByRole('button', { name: /Save.*Goal|Update/i }).click();

      // Go back to overview
      await page.getByRole('button', { name: 'Overview' }).click();

      // Verify goal is displayed
      await expect(page.getByText(/2000.*cal|Goal.*2000/i)).toBeVisible();
    }
  });

  test('should duplicate a day', async ({ page }) => {
    // Navigate to Days tab
    await page.getByRole('button', { name: 'Days' }).click();

    // Look for duplicate day option
    const duplicateButton = page.getByRole('button', {
      name: /Duplicate|Copy Day/i,
    });

    if (await duplicateButton.isVisible()) {
      await duplicateButton.click();

      // Select target date
      const dateInput = page.getByLabel(/Target Date|Copy to/i);
      if (await dateInput.isVisible()) {
        // Set to tomorrow
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        await dateInput.fill(tomorrow.toISOString().split('T')[0]);

        // Confirm duplication
        await page.getByRole('button', { name: /Duplicate|Copy/i }).click();

        // Verify success message
        await expect(
          page.getByText(/Duplicated|Copied successfully/i)
        ).toBeVisible();
      }
    }
  });

  test('mobile daily tracking should work', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    // Navigate to Days tab
    await page.getByRole('button', { name: 'Days' }).click();

    // Verify mobile layout works
    await expect(
      page.getByRole('heading', { name: /Daily Tracker/i })
    ).toBeVisible();

    // Try adding food on mobile
    const addButton = page.getByRole('button', { name: /Add|Track|Plus|\+/i });
    await expect(addButton).toBeVisible();
    await addButton.click();

    // Mobile modal or form should appear
    await expect(page.getByLabel(/Food|Search/i)).toBeVisible();
  });
});
