import fs from 'fs';
import path from 'path';
import { describe, expect, it } from 'vitest';

describe('CSS and Tailwind Configuration', () => {
	it('should have Tailwind import in globals.css', () => {
		const globalsPath = path.join(process.cwd(), 'src', 'styles', 'globals.css');
		const cssContent = fs.readFileSync(globalsPath, 'utf-8');

		// Check for Tailwind v4 import
		expect(cssContent).toContain("@import 'tailwindcss'");
	});

	it('should have PostCSS configuration with Tailwind v4', () => {
		const postcssPath = path.join(process.cwd(), 'postcss.config.mjs');
		const postcssContent = fs.readFileSync(postcssPath, 'utf-8');

		// Check for correct Tailwind v4 PostCSS plugin
		expect(postcssContent).toContain('@tailwindcss/postcss');
		expect(postcssContent).not.toContain('tailwindcss: {}'); // Old v3 format
	});

	it('should have CSS custom properties defined', () => {
		const globalsPath = path.join(process.cwd(), 'src', 'styles', 'globals.css');
		const cssContent = fs.readFileSync(globalsPath, 'utf-8');

		// Check for essential CSS variables
		expect(cssContent).toContain('--primary:');
		expect(cssContent).toContain('--background:');
		expect(cssContent).toContain('--foreground:');
		// Note: Tailwind v4 doesn't define CSS variables for utility classes like h-6
	});

	it('should have utility classes defined', () => {
		const globalsPath = path.join(process.cwd(), 'src', 'styles', 'globals.css');
		const cssContent = fs.readFileSync(globalsPath, 'utf-8');

		// Check for @utility definitions that map to CSS variables
		expect(cssContent).toContain('@utility');
		expect(cssContent).toContain('bg-background');
		expect(cssContent).toContain('text-foreground');
	});

	it('should not have old Tailwind v3 directives', () => {
		const globalsPath = path.join(process.cwd(), 'src', 'styles', 'globals.css');
		const cssContent = fs.readFileSync(globalsPath, 'utf-8');

		// Ensure we're not using old v3 directives
		expect(cssContent).not.toContain('@tailwind base');
		expect(cssContent).not.toContain('@tailwind components');
		expect(cssContent).not.toContain('@tailwind utilities');
	});
});
