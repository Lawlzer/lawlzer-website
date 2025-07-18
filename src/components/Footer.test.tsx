import { render, screen } from '@testing-library/react';
import React from 'react';
import { describe, expect, it, vi } from 'vitest';

import Footer from './Footer';

describe('Footer', () => {
	it('renders without errors', () => {
		render(<Footer />);
		const footer = screen.getByRole('contentinfo');
		expect(footer).toBeInTheDocument();
	});

	it('displays copyright text', () => {
		render(<Footer />);
		const currentYear = new Date().getFullYear();
		const copyrightText = screen.getByText(`© ${currentYear} Lawlzer. All rights reserved.`);
		expect(copyrightText).toBeInTheDocument();
	});

	it('has correct styling classes', () => {
		render(<Footer />);
		const footer = screen.getByRole('contentinfo');
		expect(footer).toHaveClass('border-t', 'border-border', 'bg-background');
	});

	it('centers the copyright text', () => {
		render(<Footer />);
		const copyrightText = screen.getByText(/© \d{4} Lawlzer\. All rights reserved\./);
		expect(copyrightText).toHaveClass('text-center');
	});

	it('uses correct text styling', () => {
		render(<Footer />);
		const copyrightText = screen.getByText(/© \d{4} Lawlzer\. All rights reserved\./);
		expect(copyrightText).toHaveClass('text-sm', 'text-muted-foreground');
	});

	it('updates year automatically', () => {
		// Mock Date to test year change
		const mockDate = new Date('2025-01-01');
		vi.spyOn(global, 'Date').mockImplementation(() => mockDate as any);

		render(<Footer />);
		expect(screen.getByText('© 2025 Lawlzer. All rights reserved.')).toBeInTheDocument();

		vi.restoreAllMocks();
	});
});