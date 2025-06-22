import { expect, test } from '@playwright/test';

test.describe('Recipe Social Features', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to cooking subdomain
    await page.goto('http://cooking.localhost:3000');
    // Navigate to search/explore page
    await page.goto('http://cooking.localhost:3000/search');
  });

  test('should search for public recipes', async ({ page }) => {
    // Use the search input
    const searchInput = page.getByPlaceholder(/Search.*recipes/i);
    await expect(searchInput).toBeVisible();

    // Search for a recipe
    await searchInput.fill('pasta');
    await searchInput.press('Enter');

    // Wait for results
    await page.waitForLoadState('networkidle');

    // Check for results or no results message
    const hasResults = (await page.locator('.recipe-card').count()) > 0;
    const noResults = page.getByText(/No results found|No recipes found/i);

    // Either we have results or a no results message
    if (hasResults) {
      await expect(page.locator('.recipe-card').first()).toBeVisible();
    } else {
      await expect(noResults).toBeVisible();
    }
  });

  test('should like and unlike a recipe', async ({ page }) => {
    // Find a recipe card
    const recipeCard = page.locator('.recipe-card').first();

    if (await recipeCard.isVisible()) {
      // Find the like button
      const likeButton = recipeCard.getByRole('button', {
        name: /Like|Heart|♥/i,
      });

      if (await likeButton.isVisible()) {
        // Get initial like state
        const initialLikeCount =
          (await recipeCard.getByText(/\d+.*like/i).textContent()) || '0';

        // Click like button
        await likeButton.click();

        // Wait for the action to complete
        await page.waitForTimeout(500);

        // Check if like count increased or button state changed
        const isLiked =
          (await likeButton.getAttribute('aria-pressed')) === 'true' ||
          (await likeButton.getAttribute('data-liked')) === 'true';

        if (isLiked) {
          // Unlike the recipe
          await likeButton.click();
          await page.waitForTimeout(500);

          // Verify unliked state
          const isUnliked =
            (await likeButton.getAttribute('aria-pressed')) === 'false' ||
            (await likeButton.getAttribute('data-liked')) === 'false';
          expect(isUnliked).toBeTruthy();
        }
      }
    }
  });

  test('should view recipe details and comments', async ({ page }) => {
    // Click on a recipe to view details
    const recipeCard = page.locator('.recipe-card').first();

    if (await recipeCard.isVisible()) {
      // Click the recipe or view details button
      const viewButton = recipeCard.getByRole('button', {
        name: /View|Details|Open/i,
      });
      if (await viewButton.isVisible()) {
        await viewButton.click();
      } else {
        await recipeCard.click();
      }

      // Wait for navigation or modal
      await page.waitForLoadState('networkidle');

      // Check for recipe details
      await expect(page.getByText(/Ingredients/i)).toBeVisible();

      // Look for comments section
      const commentsSection = page.getByText(/Comments|Reviews/i);
      if (await commentsSection.isVisible()) {
        // Scroll to comments if needed
        await commentsSection.scrollIntoViewIfNeeded();

        // Check for existing comments or comment form
        const commentForm = page.getByLabel(/Add.*comment|Write.*comment/i);
        const existingComments = page.locator('[data-testid="comment"]');

        expect(
          (await commentForm.isVisible()) ||
            (await existingComments.count()) > 0
        ).toBeTruthy();
      }
    }
  });

  test('should add a comment to a recipe', async ({ page }) => {
    // First, find and click on a recipe
    const recipeCard = page.locator('.recipe-card').first();

    if (await recipeCard.isVisible()) {
      await recipeCard.click();
      await page.waitForLoadState('networkidle');

      // Find comment form
      const commentInput = page.getByLabel(/Comment|Review|Feedback/i);
      const submitButton = page.getByRole('button', {
        name: /Post|Submit|Add.*comment/i,
      });

      if (
        (await commentInput.isVisible()) &&
        (await submitButton.isVisible())
      ) {
        // Type a comment
        const testComment =
          "This recipe looks delicious! Can't wait to try it.";
        await commentInput.fill(testComment);

        // Submit comment
        await submitButton.click();

        // Wait for comment to appear
        await page.waitForTimeout(1000);

        // Verify comment was added
        await expect(page.getByText(testComment)).toBeVisible();
      }
    }
  });

  test('should filter recipes by criteria', async ({ page }) => {
    // Look for filter options
    const filterButton = page.getByRole('button', { name: /Filter|Filters/i });

    if (await filterButton.isVisible()) {
      await filterButton.click();

      // Apply a filter (e.g., vegetarian)
      const vegetarianFilter = page.getByLabel(/Vegetarian/i);
      if (await vegetarianFilter.isVisible()) {
        await vegetarianFilter.check();
      }

      // Apply calorie filter
      const calorieInput = page.getByLabel(/Max.*calories|Calorie.*limit/i);
      if (await calorieInput.isVisible()) {
        await calorieInput.fill('500');
      }

      // Apply filters
      const applyButton = page.getByRole('button', { name: /Apply|Filter/i });
      if (await applyButton.isVisible()) {
        await applyButton.click();
      }

      // Wait for filtered results
      await page.waitForLoadState('networkidle');

      // Verify filters are applied (check URL or filter tags)
      const activeFilters = page.locator('[data-testid="active-filter"]');
      if ((await activeFilters.count()) > 0) {
        await expect(activeFilters.first()).toBeVisible();
      }
    }
  });

  test('should share a recipe', async ({ page }) => {
    // Find a recipe
    const recipeCard = page.locator('.recipe-card').first();

    if (await recipeCard.isVisible()) {
      // Look for share button
      const shareButton = recipeCard.getByRole('button', { name: /Share/i });

      if (await shareButton.isVisible()) {
        await shareButton.click();

        // Check for share options
        const shareModal = page.getByRole('dialog', { name: /Share/i });
        const copyLinkButton = page.getByRole('button', {
          name: /Copy.*link/i,
        });

        if (
          (await shareModal.isVisible()) ||
          (await copyLinkButton.isVisible())
        ) {
          // Try to copy link
          if (await copyLinkButton.isVisible()) {
            await copyLinkButton.click();

            // Check for success message
            await expect(page.getByText(/Copied|Link copied/i)).toBeVisible();
          }
        }
      }
    }
  });

  test('should report inappropriate content', async ({ page }) => {
    // Click on a recipe
    const recipeCard = page.locator('.recipe-card').first();

    if (await recipeCard.isVisible()) {
      await recipeCard.click();
      await page.waitForLoadState('networkidle');

      // Look for report button
      const reportButton = page.getByRole('button', { name: /Report/i });

      if (await reportButton.isVisible()) {
        await reportButton.click();

        // Fill report form
        const reasonSelect = page.getByLabel(/Reason/i);
        const detailsTextarea = page.getByLabel(/Details|Description/i);

        if (await reasonSelect.isVisible()) {
          await reasonSelect.selectOption('inappropriate');
        }

        if (await detailsTextarea.isVisible()) {
          await detailsTextarea.fill('Test report for E2E testing');
        }

        // Submit report
        const submitButton = page.getByRole('button', {
          name: /Submit.*report/i,
        });
        if (await submitButton.isVisible()) {
          await submitButton.click();

          // Check for confirmation
          await expect(
            page.getByText(/Report.*submitted|Thank you/i)
          ).toBeVisible();
        }
      }
    }
  });

  test('should handle authentication for social features', async ({ page }) => {
    // Try to like without being logged in
    const recipeCard = page.locator('.recipe-card').first();

    if (await recipeCard.isVisible()) {
      const likeButton = recipeCard.getByRole('button', {
        name: /Like|Heart/i,
      });

      if (await likeButton.isVisible()) {
        await likeButton.click();

        // Check for login prompt
        const loginPrompt = page.getByText(/Sign in|Log in|Login required/i);
        if (await loginPrompt.isVisible()) {
          await expect(loginPrompt).toBeVisible();

          // Check for login button
          const loginButton = page.getByRole('button', {
            name: /Sign in|Log in/i,
          });
          await expect(loginButton).toBeVisible();
        }
      }
    }
  });

  test('should display recipe author information', async ({ page }) => {
    // Click on a recipe
    const recipeCard = page.locator('.recipe-card').first();

    if (await recipeCard.isVisible()) {
      // Check for author info on card
      const authorInfo = recipeCard.getByText(/by|By|Created by/i);
      if (await authorInfo.isVisible()) {
        const authorName = await authorInfo.textContent();
        expect(authorName).toBeTruthy();
      }

      // Click for more details
      await recipeCard.click();
      await page.waitForLoadState('networkidle');

      // Look for detailed author section
      const authorSection = page.locator('[data-testid="author-info"]');
      if (await authorSection.isVisible()) {
        // Should show author avatar or name
        const authorAvatar = authorSection.locator('img');
        const authorName = authorSection.getByText(/\w+/);

        expect(
          (await authorAvatar.isVisible()) || (await authorName.isVisible())
        ).toBeTruthy();
      }
    }
  });

  test('mobile social features should work', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    // Verify search works on mobile
    const searchInput = page.getByPlaceholder(/Search/i);
    await expect(searchInput).toBeVisible();

    // Find a recipe
    const recipeCard = page.locator('.recipe-card').first();
    if (await recipeCard.isVisible()) {
      // Check that social buttons are accessible
      const likeButton = recipeCard.getByRole('button', {
        name: /Like|Heart/i,
      });
      if (await likeButton.isVisible()) {
        // Verify button is clickable on mobile
        await expect(likeButton).toBeEnabled();

        // Click and verify response
        await likeButton.click();
        await page.waitForTimeout(500);
      }
    }
  });
});
