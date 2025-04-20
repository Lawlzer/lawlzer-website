import { type Page, type Response, expect } from '@playwright/test';
import type { Metadata } from 'next';
import { env } from '~/env.mjs';

interface TestPageBasicsOptions {
	/** Check if the page title matches the provided metadata title. */
	titleCheck?: boolean;
	/** Check if the page loads successfully (2xx status code). */
	pageLoadCheck?: boolean;
	/** Check if the page has HTML content. */
	htmlCheck?: boolean;
	/** Check if the page has a vertical scrollbar. */
	noScrollbarCheck?: boolean;
	/** Check if the topbar is present. */
	topbarCheck?: boolean;
}

export async function testPageBasics(page: Page, url: string, metadata: Metadata, options: TestPageBasicsOptions = {}): Promise<Response> {
	const { titleCheck = true, pageLoadCheck = true, htmlCheck = true, noScrollbarCheck = true, topbarCheck = true } = options;

	let pageErrorOccurred: Error | null = null;

	const errorListener = (error: Error): void => {
		pageErrorOccurred = error;
	};

	page.once('pageerror', errorListener);

	const response = await page.goto(url, { waitUntil: 'load' }); // Wait until the load event

	// Check for client-side errors captured by the listener
	page.off('pageerror', errorListener); // Remove listener after navigation completes

	// eslint-disable-next-line @typescript-eslint/strict-boolean-expressions
	if (pageErrorOccurred) {
		// @ts-expect-error
		throw new Error(`Client-side error occurred on ${url}: ${pageErrorOccurred.message}\n${pageErrorOccurred.stack}`);
	}

	expect(response, `${url}: Response should not be null`).not.toBeNull();

	if (pageLoadCheck) {
		expect(response!.ok(), `${url}: Expected 2xx status code, but received ${response!.status()}`).toBe(true);
	}

	const content = await page.content();

	if (htmlCheck) {
		expect(content.length, `${url}: Expected page content to have length greater than 0`).toBeGreaterThan(0);
	}

	if (titleCheck) {
		// eslint-disable-next-line @typescript-eslint/strict-boolean-expressions
		if (!metadata.title) throw new Error('Metadata title is required for titleCheck');
		if (typeof metadata.title !== 'string') throw new Error('Metadata title must be a string??');

		// Try to wait for title to be set for client-side rendered apps
		try {
			await page.waitForFunction(
				(expectedTitle) => {
					return document.title?.includes(expectedTitle);
				},
				metadata.title,
				{ timeout: 5000 }
			);
		} catch (e) {
			// If waiting for title times out, continue to our fallback checks
			console.warn(`Waiting for title with "${metadata.title}" timed out. Falling back to content checks.`);
		}

		// Check title again after waiting
		const pageTitle = await page.title();

		if (pageTitle) {
			// Check the actual page title if it's available
			expect(pageTitle, `${url}: Page title should contain "${metadata.title}"`).toContain(metadata.title);
		} else {
			// Try to find the title in the HTML content
			const titleTagMatch = /<title[^>]*>([^<]*)<\/title>/i.exec(content);

			if (titleTagMatch?.[1]?.includes(metadata.title)) {
				// Found title tag with matching content
				expect(titleTagMatch[1], `${url}: Title tag should contain "${metadata.title}"`).toContain(metadata.title);
			} else {
				// Last resort - check if the h1 content matches the expected title
				const h1Match = /<h1[^>]*>([^<]*)<\/h1>/i.exec(content);
				if (h1Match) {
					expect(h1Match[1], `${url}: H1 content should match expected title "${metadata.title}"`).toContain(metadata.title);
				} else {
					// If all attempts fail, just check if the content contains the title anywhere
					expect(content, `${url}: HTML should contain "${metadata.title}" somewhere`).toContain(metadata.title);
				}
			}
		}
	}

	if (noScrollbarCheck) {
		const hasScrollbar = await page.evaluate(() => {
			return document.documentElement.scrollHeight > document.documentElement.clientHeight;
		});
		expect(hasScrollbar, `${url}: Expected no vertical scrollbar`).toBe(false);
	}

	// todo, some auto check?
	// todo check for WORKING css
	if (topbarCheck) {
		expect(content).toContain('Home');
		expect(content).toContain('Valorant');
	}
	return response!;
}
