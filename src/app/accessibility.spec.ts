import { expect, test } from '@playwright/test';
import { checkA11y, injectAxe } from 'axe-playwright';

test.describe('Accessibility Tests', () => {
	test.beforeEach(async ({ page }) => {
		await page.goto('http://cooking.localhost:3000');
	});

	test('should pass axe accessibility checks on main page', async ({ page }) => {
		await injectAxe(page);
		await checkA11y(page, null, {
			detailedReport: true,
			detailedReportOptions: {
				html: true,
			},
		});
	});

	test('should have proper heading hierarchy', async ({ page }) => {
		const headings = await page.$$eval('h1, h2, h3, h4, h5, h6', (elements) =>
			elements.map((el) => ({
				level: parseInt(el.tagName[1]),
				text: el.textContent?.trim(),
			}))
		);

		// Check that we have at least one h1
		const h1Count = headings.filter((h) => h.level === 1).length;
		expect(h1Count).toBe(1);

		// Check heading hierarchy doesn't skip levels
		for (let i = 1; i < headings.length; i++) {
			const currentLevel = headings[i].level;
			const previousLevel = headings[i - 1].level;
			expect(currentLevel).toBeLessThanOrEqual(previousLevel + 1);
		}
	});

	test('should have accessible navigation', async ({ page }) => {
		// Check that main navigation is keyboard accessible
		await page.keyboard.press('Tab');

		// Check that focused element is visible
		const focusedElement = await page.evaluateHandle(() => document.activeElement);
		const isVisible = await focusedElement.evaluate((el) => {
			const rect = el.getBoundingClientRect();
			return rect.width > 0 && rect.height > 0;
		});
		expect(isVisible).toBe(true);

		// Check ARIA labels on navigation
		const navElement = page.locator('nav').first();
		const ariaLabel = await navElement.getAttribute('aria-label');
		expect(ariaLabel).toBeTruthy();
	});

	test('should have accessible forms', async ({ page }) => {
		// Navigate to recipes and create form
		await page.click('text=Recipes');
		await page.click('text=Create New Recipe');

		// Check that all form inputs have labels
		const inputs = await page.$$('input, textarea, select');
		for (const input of inputs) {
			const id = await input.getAttribute('id');
			const ariaLabel = await input.getAttribute('aria-label');
			const ariaLabelledBy = await input.getAttribute('aria-labelledby');

			if (id) {
				const label = await page.$(`label[for="${id}"]`);
				const hasLabel = label !== null || ariaLabel !== null || ariaLabelledBy !== null;
				expect(hasLabel).toBe(true);
			}
		}

		// Check form validation messages are accessible
		await page.click('button:has-text("Save Recipe")');

		// Check for aria-invalid on required fields
		const requiredInputs = await page.$$('[required]');
		for (const input of requiredInputs) {
			const value = await input.inputValue();
			if (!value) {
				const ariaInvalid = await input.getAttribute('aria-invalid');
				expect(ariaInvalid).toBe('true');
			}
		}
	});

	test('should have accessible images', async ({ page }) => {
		const images = await page.$$('img');

		for (const img of images) {
			const alt = await img.getAttribute('alt');
			const role = await img.getAttribute('role');

			// Images should have alt text or role="presentation" for decorative images
			if (role !== 'presentation') {
				expect(alt).toBeTruthy();
			}
		}
	});

	test('should support keyboard navigation', async ({ page }) => {
		// Test tab navigation through interactive elements
		const interactiveElements = await page.$$('button, a, input, textarea, select, [tabindex]');

		for (let i = 0; i < Math.min(interactiveElements.length, 10); i++) {
			await page.keyboard.press('Tab');

			const focusedElement = await page.evaluateHandle(() => document.activeElement);
			const tagName = await focusedElement.evaluate((el) => el.tagName.toLowerCase());

			// Verify focused element is interactive
			expect(['button', 'a', 'input', 'textarea', 'select']).toContain(tagName);
		}
	});

	test('should have sufficient color contrast', async ({ page }) => {
		await injectAxe(page);

		// Check specifically for color contrast issues
		const results = await page.evaluate(
			async () =>
				// @ts-expect-error - axe is injected
				await axe.run(document, {
					rules: {
						'color-contrast': { enabled: true },
					},
				})
		);

		expect(results.violations.filter((v) => v.id === 'color-contrast')).toHaveLength(0);
	});

	test('should have accessible modals and dialogs', async ({ page }) => {
		// Trigger a modal (e.g., recipe creation)
		await page.click('text=Recipes');
		await page.click('text=Create New Recipe');

		// Check for proper dialog attributes
		const dialog = page.locator('[role="dialog"], dialog');
		if (await dialog.isVisible()) {
			// Check for aria-labelledby or aria-label
			const ariaLabelledBy = await dialog.getAttribute('aria-labelledby');
			const ariaLabel = await dialog.getAttribute('aria-label');
			expect(ariaLabelledBy || ariaLabel).toBeTruthy();

			// Check that focus is trapped within modal
			await page.keyboard.press('Tab');
			const focusedElement = await page.evaluateHandle(() => document.activeElement);
			const isWithinDialog = await dialog.evaluateHandle((dialogEl, focused) => dialogEl.contains(focused), focusedElement);
			expect(await isWithinDialog.jsonValue()).toBe(true);

			// Check for close button
			const closeButton = dialog.locator('[aria-label*="close" i], button:has-text("Close")');
			expect(await closeButton.isVisible()).toBe(true);
		}
	});

	test('should announce dynamic content changes', async ({ page }) => {
		// Check for ARIA live regions
		const liveRegions = await page.$$('[aria-live]');
		expect(liveRegions.length).toBeGreaterThan(0);

		// Test that status messages use appropriate ARIA
		await page.click('text=Recipes');
		await page.click('text=Create New Recipe');
		await page.fill('input[placeholder="Recipe name"]', 'Test Recipe');
		await page.click('button:has-text("Save Recipe")');

		// Check for status message announcement
		const statusMessage = page.locator('[role="status"], [aria-live="polite"]');
		await expect(statusMessage).toBeVisible();
	});

	test('should have accessible data tables', async ({ page }) => {
		// Navigate to a view with tables (if any)
		const tables = await page.$$('table');

		for (const table of tables) {
			// Check for caption or aria-label
			const caption = await table.$('caption');
			const ariaLabel = await table.getAttribute('aria-label');
			expect(caption !== null || ariaLabel !== null).toBe(true);

			// Check for proper header cells
			const headers = await table.$$('th');
			expect(headers.length).toBeGreaterThan(0);

			// Check scope attributes on headers
			for (const header of headers) {
				const scope = await header.getAttribute('scope');
				expect(['row', 'col', 'rowgroup', 'colgroup']).toContain(scope);
			}
		}
	});

	test('should support screen reader navigation', async ({ page }) => {
		// Check for skip links
		const skipLink = page.locator('a[href="#main"], a:has-text("Skip to content")');

		// Skip link might be visually hidden but should exist
		const skipLinkExists = (await skipLink.count()) > 0;
		expect(skipLinkExists).toBe(true);

		// Check for landmark regions
		const landmarks = {
			main: await page.$('main, [role="main"]'),
			navigation: await page.$('nav, [role="navigation"]'),
			banner: await page.$('header, [role="banner"]'),
			contentinfo: await page.$('footer, [role="contentinfo"]'),
		};

		// Should have at least main and navigation landmarks
		expect(landmarks.main).toBeTruthy();
		expect(landmarks.navigation).toBeTruthy();
	});

	test('should have accessible error messages', async ({ page }) => {
		// Trigger validation errors
		await page.click('text=Recipes');
		await page.click('text=Create New Recipe');
		await page.click('button:has-text("Save Recipe")');

		// Check error messages are associated with inputs
		const errorMessages = await page.$$('[role="alert"], .error-message');

		for (const error of errorMessages) {
			const id = await error.getAttribute('id');
			if (id) {
				// Check if any input references this error
				const associatedInput = await page.$(`[aria-describedby*="${id}"]`);
				expect(associatedInput).toBeTruthy();
			}
		}
	});

	test('should support reduced motion preferences', async ({ page }) => {
		// Check for prefers-reduced-motion support
		await page.emulateMedia({ reducedMotion: 'reduce' });

		// Verify animations are disabled/reduced
		const animatedElements = await page.$$('[class*="animate"], [class*="transition"]');

		for (const element of animatedElements) {
			const animationDuration = await element.evaluate((el) => {
				const styles = window.getComputedStyle(el);
				return styles.animationDuration;
			});

			// Animation should be instant or very short with reduced motion
			if (animationDuration !== 'none') {
				const duration = parseFloat(animationDuration);
				expect(duration).toBeLessThanOrEqual(0.1);
			}
		}
	});

	test('should have accessible loading states', async ({ page }) => {
		// Check loading indicators
		const loadingElements = await page.$$('[class*="loading"], [class*="skeleton"]');

		for (const element of loadingElements) {
			const ariaLabel = await element.getAttribute('aria-label');
			const ariaLive = await element.getAttribute('aria-live');
			const role = await element.getAttribute('role');

			// Loading elements should announce their state
			expect(ariaLabel || ariaLive || role === 'status').toBeTruthy();
		}
	});

	test('should support high contrast mode', async ({ page }) => {
		// Emulate high contrast mode
		await page.emulateMedia({ colorScheme: 'dark' });

		// Check that interactive elements are still distinguishable
		const buttons = await page.$$('button');

		for (const button of buttons) {
			const styles = await button.evaluate((el) => {
				const computed = window.getComputedStyle(el);
				return {
					color: computed.color,
					backgroundColor: computed.backgroundColor,
					borderColor: computed.borderColor,
				};
			});

			// Verify button has visible styling (not transparent)
			expect(styles.backgroundColor).not.toBe('rgba(0, 0, 0, 0)');
		}
	});

	test('should have proper focus indicators', async ({ page }) => {
		// Tab through elements and check focus visibility
		const focusableElements = await page.$$('button, a, input, textarea, select');

		for (const element of focusableElements.slice(0, 5)) {
			await element.focus();

			const focusStyles = await element.evaluate((el) => {
				const styles = window.getComputedStyle(el);
				return {
					outline: styles.outline,
					boxShadow: styles.boxShadow,
					border: styles.border,
				};
			});

			// Element should have visible focus indicator
			const hasVisibleFocus = focusStyles.outline !== 'none' || focusStyles.boxShadow !== 'none' || focusStyles.border !== 'none';

			expect(hasVisibleFocus).toBe(true);
		}
	});
});
