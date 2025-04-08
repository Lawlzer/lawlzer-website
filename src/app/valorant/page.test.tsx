import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

import ValorantHomePage from './page';

describe('ValorantHomePage', () => {
	it('renders the main heading', () => {
		render(<ValorantHomePage />);
		const heading = screen.getByRole('heading', { name: /Valorant Subdomain/i });
		expect(heading).toBeInTheDocument();
	});

	it('renders the description paragraph', () => {
		render(<ValorantHomePage />);
		const paragraph = screen.getByText(/This is the Valorant subdomain/i);
		expect(paragraph).toBeInTheDocument();
	});

	it('does not render unexpected text', () => {
		render(<ValorantHomePage />);
		const unexpectedText = screen.queryByText(/some unexpected text/i);
		expect(unexpectedText).toBeNull();
	});

	it('renders with correct styles', () => {
		const { container } = render(<ValorantHomePage />);
		const div = container.firstChild;
		expect(div).toHaveStyle({
			display: 'flex',
			minHeight: '100vh',
			flexDirection: 'column',
			alignItems: 'center',
			justifyContent: 'center',
			background: 'linear-gradient(to bottom, #fa4454, #1f1f1f)',
			color: 'white',
		});
		const heading = screen.getByRole('heading', { name: /Valorant Subdomain/i });
		expect(heading).toHaveStyle({
			fontSize: '3rem',
			fontWeight: 'bold',
		});
		const paragraph = screen.getByText(/This is the Valorant subdomain/i);
		expect(paragraph).toHaveStyle({
			marginTop: '1rem',
			fontSize: '1.25rem',
		});
	});
});
