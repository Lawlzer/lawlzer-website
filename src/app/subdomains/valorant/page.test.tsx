import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import ValorantPage from './page';

describe('ValorantPage', () => {
	it('renders the main heading', () => {
		render(<ValorantPage />);
	});
});
