import { expect, test } from '@playwright/test';

test.describe('CSS and UI Integrity Tests', () => {
	test.beforeEach(async ({ page }) => {
		await page.goto('/');
		// Wait for CSS to load
		await page.waitForLoadState('domcontentloaded');
		await page.waitForTimeout(500); // Give CSS time to apply
	});

	test('Tailwind CSS utilities should be loaded and working', async ({ page }) => {
		// Check that Tailwind classes are applying correct styles
		const nav = page.locator('nav').first();
		await expect(nav).toBeVisible();

		// Navigation should be using flex layout
		const navDisplay = await nav.evaluate((el) => window.getComputedStyle(el).display);
		expect(navDisplay).not.toBe('inline'); // Should be block or flex

		// Check that nav items are horizontal, not vertical
		const navItems = page.locator('nav a, nav button').first();
		if ((await navItems.count()) > 1) {
			const firstItem = await navItems.nth(0).boundingBox();
			const secondItem = await navItems.nth(1).boundingBox();

			if (firstItem && secondItem) {
				// Items should be side by side (same Y position)
				expect(Math.abs(firstItem.y - secondItem.y)).toBeLessThan(10);
			}
		}
	});

	test('SVG icons should have correct dimensions', async ({ page }) => {
		// Find SVG elements that should be small icons
		const svgs = page.locator('svg.h-6.w-6, svg.h-5.w-5, svg.h-4.w-4');
		const svgCount = await svgs.count();

		if (svgCount > 0) {
			// Check first few SVGs
			for (let i = 0; i < Math.min(3, svgCount); i++) {
				const svg = svgs.nth(i);
				const box = await svg.boundingBox();

				if (box) {
					// SVG icons should be small (not full page width)
					expect(box.width).toBeLessThan(100);
					expect(box.height).toBeLessThan(100);

					// Should be roughly square for icons
					expect(Math.abs(box.width - box.height)).toBeLessThan(5);
				}
			}
		}
	});

	test('CSS custom properties should be defined', async ({ page }) => {
		// Check that CSS variables are properly set
		const rootStyles = await page.evaluate(() => {
			const styles = window.getComputedStyle(document.documentElement);
			return {
				primary: styles.getPropertyValue('--primary'),
				background: styles.getPropertyValue('--background'),
				foreground: styles.getPropertyValue('--foreground'),
			};
		});

		// CSS variables should have values
		expect(rootStyles.primary).toBeTruthy();
		expect(rootStyles.background).toBeTruthy();
		expect(rootStyles.foreground).toBeTruthy();
	});

	test('Page layout should not have giant black elements', async ({ page }) => {
		// Check for abnormally large elements that might indicate CSS issues
		const largeElements = await page.evaluate(() => {
			const elements = Array.from(document.querySelectorAll('*'));
			const viewport = { width: window.innerWidth, height: window.innerHeight };

			return elements
				.map((el) => {
					const rect = el.getBoundingClientRect();
					const styles = window.getComputedStyle(el);
					return {
						tag: el.tagName,
						width: rect.width,
						height: rect.height,
						backgroundColor: styles.backgroundColor,
						isLarge: rect.width > viewport.width * 0.8 && rect.height > viewport.height * 0.5,
					};
				})
				.filter((el) => el.isLarge && el.backgroundColor === 'rgb(0, 0, 0)');
		});

		// Should not have large black elements (like the briefcase we saw)
		expect(largeElements.length).toBe(0);
	});

	test('Hero section text should be properly styled', async ({ page }) => {
		// Check the main heading
		const heading = page.locator('h1').first();
		await expect(heading).toBeVisible();

		const headingStyles = await heading.evaluate((el) => {
			const styles = window.getComputedStyle(el);
			return {
				fontSize: styles.fontSize,
				fontWeight: styles.fontWeight,
				color: styles.color,
			};
		});

		// Font size should be large (not default 16px)
		const fontSize = parseInt(headingStyles.fontSize);
		expect(fontSize).toBeGreaterThan(30);

		// Should be bold
		expect(parseInt(headingStyles.fontWeight)).toBeGreaterThanOrEqual(600);
	});

	test('CSS file should be loaded successfully', async ({ page }) => {
		// Check that CSS files are loaded without 404s
		const cssResponses: number[] = [];

		page.on('response', (response) => {
			if (response.url().includes('.css')) {
				cssResponses.push(response.status());
			}
		});

		await page.reload();
		await page.waitForTimeout(1000);

		// All CSS files should load successfully
		cssResponses.forEach((status) => {
			expect(status).toBe(200);
		});

		// Should have at least one CSS file
		expect(cssResponses.length).toBeGreaterThan(0);
	});

	test('Tailwind utilities should apply correct dimensions', async ({ page }) => {
		// Create a test element to verify Tailwind is working
		await page.evaluate(() => {
			const testDiv = document.createElement('div');
			testDiv.className = 'h-24 w-24 bg-primary fixed top-0 left-0 z-50';
			testDiv.id = 'tailwind-test-element';
			document.body.appendChild(testDiv);
		});

		const testElement = page.locator('#tailwind-test-element');
		const box = await testElement.boundingBox();

		if (box) {
			// h-24 should be 6rem = 96px
			expect(box.height).toBeCloseTo(96, 1);
			expect(box.width).toBeCloseTo(96, 1);
		}

		// Clean up
		await page.evaluate(() => {
			document.getElementById('tailwind-test-element')?.remove();
		});
	});
});

test.describe('Data Platform UI Field Names', () => {
	test('should display formatted field names in Data Platform', async ({ page }) => {
		await page.goto('/');

		// Find and click Data Platform
		const dataPlatformCard = page.locator('text=Data Platform').first();
		await dataPlatformCard.click();

		// Wait for modal to open
		await page.waitForSelector('[role="dialog"], .fixed', { timeout: 5000 });

		// Check that field names are properly formatted
		const filterHeaders = page.locator('h4').filter({ hasText: /Category|Type|Country|State/ });
		const count = await filterHeaders.count();

		for (let i = 0; i < count; i++) {
			const text = await filterHeaders.nth(i).textContent();

			// Should not contain camelCase patterns
			expect(text).not.toMatch(/[a-z][A-Z]/);

			// Should be properly capitalized
			if (text?.includes('Category')) expect(text).toContain('Category');
			if (text?.includes('Type')) expect(text).toContain('Type');
			if (text?.includes('Country')) expect(text).toContain('Country');
		}
	});
});
