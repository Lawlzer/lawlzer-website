import React from 'react';
import { render, screen, within } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import MainPage from './page';
import { vi } from 'vitest';

// Mock getBaseUrl to avoid actual URL parsing in tests
vi.mock('~/lib/utils', () => ({
	getBaseUrl: vi.fn((subdomain?: string) => {
		const protocol = 'http';
		const hostname = 'dev.lawlzer';
		let url = `${protocol}://${hostname}`;
		if (subdomain) {
			url = `${protocol}://${subdomain}.${hostname}`;
		}
		return url; // Return without trailing slash
	}),
}));

describe('MainPage', () => {
	it('renders the main heading', () => {
		render(<MainPage />);
		const heading = screen.getByRole('heading', { name: /Welcome!/i });
		expect(heading).toBeInTheDocument();
	});

	it('renders the introduction text with profile links', () => {
		render(<MainPage />);
		expect(screen.getByText(/The website of/i)).toBeInTheDocument();
		expect(screen.getByRole('link', { name: /Kevin Porter/i })).toHaveAttribute('href', 'https://www.linkedin.com/in/kevin-porter-6a80b7210/');
		expect(screen.getByRole('link', { name: /Lawlzer/i })).toHaveAttribute('href', 'https://github.com/Lawlzer');
	});

	it('renders the "View Source on GitHub" link', () => {
		render(<MainPage />);
		const githubLink = screen.getByRole('link', { name: /View Source Code on GitHub/i });
		expect(githubLink).toBeInTheDocument();
		expect(githubLink).toHaveAttribute('href', 'https://github.com/Lawlzer/lawlzer-website');
	});

	it('renders the "Featured Projects" section heading', () => {
		render(<MainPage />);
		const projectsHeading = screen.getByRole('heading', { name: /Featured Projects/i });
		expect(projectsHeading).toBeInTheDocument();
	});

	it('renders the project showcase with title and description', () => {
		render(<MainPage />);
		// Use a regex that allows for different hostnames potentially determined by getBaseUrl
		expect(screen.getByRole('heading', { name: /dev\.lawlzer \(This Website!\)/i })).toBeInTheDocument();
		expect(screen.getByText(/A personal portfolio and project hub built with Next.js/i)).toBeInTheDocument();
	});

	it('renders the key features including links', () => {
		render(<MainPage />);
		// Find the container for the first project (This Website!)
		const projectContainer = screen.getByRole('heading', { name: /dev\.lawlzer \(This Website!\)/i }).closest('div.flex-grow')?.parentElement;
		expect(projectContainer).toBeInTheDocument(); // Assert the container is found

		if (projectContainer) {
			// Scope the search within the first project's container
			expect(within(projectContainer).getByText(/Key Features:/i)).toBeInTheDocument();
			expect(within(projectContainer).getByRole('link', { name: /Dynamic Color Theming/i })).toHaveAttribute('href', 'http://colors.dev.lawlzer');
			expect(within(projectContainer).getByRole('link', { name: /Valorant Lineup Tool/i })).toHaveAttribute('href', 'http://valorant.dev.lawlzer');
			expect(within(projectContainer).getByText(/Responsive & Mobile-First/i)).toBeInTheDocument();
		} else {
			// Fail the test explicitly if the container wasn't found
			expect(projectContainer).not.toBeNull();
		}
	});
});
