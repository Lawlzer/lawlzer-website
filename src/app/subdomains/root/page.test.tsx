import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import MainPage from './page';

describe('MainPage', () => {
	it('renders the main heading', () => {
		render(<MainPage />);
		const heading = screen.getByRole('heading', { name: /Main Domain Page/i });
		expect(heading).toBeInTheDocument();
	});
});
