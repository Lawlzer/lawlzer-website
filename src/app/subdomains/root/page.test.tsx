import { render, screen } from '@testing-library/react';
import React from 'react';
import { describe, expect, it } from 'vitest';
import { vi } from 'vitest';

import MainPage from './page';

// Mock getBaseUrl to avoid actual URL parsing in tests
vi.mock('~/lib/utils', () => ({
	getBaseUrl: vi.fn((subdomain?: string) => {
		const protocol = 'http';
		const hostname = 'dev.lawlzer';
		let url = `${protocol}://${hostname}`;
		if (subdomain !== undefined && subdomain.trim() !== '') {
			url = `${protocol}://${subdomain}.${hostname}`;
		}
		return url; // Return without trailing slash
	}),
}));

// Mock DataPlatformPreview to avoid lazy loading issues
vi.mock('./components/DataPlatformPreview', () => ({
	default: () => <div data-testid='data-platform-preview'>Data Platform Preview</div>,
}));

describe('MainPage', () => {
	it('should render the page title', () => {
		render(<MainPage />);

		// Debug output removed - was causing linter error

		// Look for the main heading with both parts
		expect(screen.getByText(/Hi, I'm/i)).toBeInTheDocument();
		expect(screen.getByText(/Kevin Porter/i)).toBeInTheDocument();
	});

	it('should render the introduction text', () => {
		render(<MainPage />);

		expect(screen.getByText(/I'm a full-stack developer passionate about creating elegant solutions to complex problems/i)).toBeInTheDocument();
	});

	it('should render stats', () => {
		render(<MainPage />);

		expect(screen.getByText('7+')).toBeInTheDocument();
		expect(screen.getByText('Years of Experience')).toBeInTheDocument();
		expect(screen.getByText('50+')).toBeInTheDocument();
		expect(screen.getByText('Projects Completed')).toBeInTheDocument();
		expect(screen.getByText('100+')).toBeInTheDocument();
		expect(screen.getByText('Production Deployments')).toBeInTheDocument();
		expect(screen.getByText('200+')).toBeInTheDocument();
		expect(screen.getByText('Websites Autonomously Scraped')).toBeInTheDocument();
		expect(screen.getByText('250+')).toBeInTheDocument();
		expect(screen.getByText('APIs integrated')).toBeInTheDocument();
		expect(screen.getByText('800+')).toBeInTheDocument();
		expect(screen.getByText('Peer Reviews Completed')).toBeInTheDocument();
	});

	it('should render featured projects', () => {
		render(<MainPage />);

		expect(screen.getByText('Featured Projects')).toBeInTheDocument();
		expect(screen.getByText(/dev.lawlzer \(This Website!\)/i)).toBeInTheDocument();
		expect(screen.getByText(/Data Platform/i)).toBeInTheDocument();
		expect(screen.getByText(/Web Scraping Solutions/i)).toBeInTheDocument();
		expect(screen.getByText(/Open Source Contributions/i)).toBeInTheDocument();
	});

	it('should render GitHub and LinkedIn links', () => {
		render(<MainPage />);

		const githubLink = screen.getByRole('link', { name: /GitHub/i });
		expect(githubLink).toHaveAttribute('href', 'https://github.com/lawlzer');
		expect(githubLink).toHaveAttribute('target', '_blank');

		const linkedinLink = screen.getByRole('link', { name: /LinkedIn/i });
		expect(linkedinLink).toHaveAttribute('href', 'https://www.linkedin.com/in/kevin-porter-6a80b7210/');
		expect(linkedinLink).toHaveAttribute('target', '_blank');
	});

	it('should render project features', () => {
		render(<MainPage />);

		// Website features
		expect(screen.getByText('Dynamic Color Theming')).toBeInTheDocument();
		expect(screen.getByText('Valorant Lineup Tool')).toBeInTheDocument();
		expect(screen.getByText('Responsive & Mobile-First')).toBeInTheDocument();
		expect(screen.getByText('Perfect Lighthouse Score')).toBeInTheDocument();

		// Data Platform features
		expect(screen.getByText('Dynamic Mongoose DB for 2+ billion documents')).toBeInTheDocument();
		expect(screen.getByText('Hourly USDA API integration')).toBeInTheDocument();
		expect(screen.getByText('Vercel deployment with global CDN')).toBeInTheDocument();
		expect(screen.getByText('98% test coverage (Jest & Supertest)')).toBeInTheDocument();
	});
});
