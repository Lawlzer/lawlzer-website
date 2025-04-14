import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import ValorantPage from './page';

describe('ValorantPage', () => {
	it('renders the main heading', () => {
		render(<ValorantPage />);
	});

	// // New test case for the topbar
	// it('renders the topbar correctly', () => {
	// 	render(<ValorantPage />);

	// 	// Check for links
	// 	const homeLink = screen.getByRole('link', { name: /Home/i });
	// 	expect(homeLink).toBeInTheDocument();
	// 	expect(homeLink).toHaveAttribute('href', 'http://dev.localhost:3000');

	// 	const valorantLink = screen.getByRole('link', { name: /Valorant/i });
	// 	expect(valorantLink).toBeInTheDocument();
	// 	// Assuming the href should be the current page or the subdomain root
	// 	expect(valorantLink).toHaveAttribute('href', 'http://valorant.dev.localhost:3000');

	// 	const exampleLink = screen.getByRole('link', { name: /Example/i });
	// 	expect(exampleLink).toBeInTheDocument();
	// 	expect(exampleLink).toHaveAttribute('href', 'https://example.com');
	// 	expect(exampleLink).toHaveAttribute('target', '_blank');

	// 	// Check for the user menu button
	// 	const userMenuButton = screen.getByRole('button', { name: /lawlzer/i });
	// 	expect(userMenuButton).toBeInTheDocument();
	// });
});
