import { render } from '@testing-library/react';
import React from 'react';
import { describe, expect, it } from 'vitest';

import Loading from './loading';

describe('Loading Component', () => {
	it('should render the loading spinner', () => {
		const { container } = render(React.createElement(Loading));

		// Check for the main container using a more specific selector
		const mainContainer = container.querySelector('.flex.h-full.w-full.items-center.justify-center');
		expect(mainContainer).toBeInTheDocument();

		// Check for animated elements
		const animatedElements = container.querySelectorAll('[class*="animate-"]');
		expect(animatedElements.length).toBeGreaterThan(0);

		// Check for specific animation classes
		const spinElement = container.querySelector('.animate-spin');
		expect(spinElement).toBeInTheDocument();

		const pulseElement = container.querySelector('.animate-pulse');
		expect(pulseElement).toBeInTheDocument();
	});

	it('should have proper structure with outer ring and inner dot', () => {
		const { container } = render(React.createElement(Loading));

		// Check for gradient ring
		const gradientRing = container.querySelector('.bg-gradient-to-r');
		expect(gradientRing).toBeInTheDocument();
		expect(gradientRing).toHaveClass('from-primary', 'via-primary/50', 'to-transparent');

		// Check for inner background
		const innerBg = container.querySelector('.bg-background');
		expect(innerBg).toBeInTheDocument();

		// Check for center dot
		const centerDot = container.querySelector('.absolute.left-1\\/2.top-1\\/2');
		expect(centerDot).toBeInTheDocument();
		expect(centerDot).toHaveClass('bg-primary');
	});
});
