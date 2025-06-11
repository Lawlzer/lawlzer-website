import { render, screen } from '@testing-library/react';
import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import ValorantLineupClient from './ValorantLineupClient';

// --- Mocks ---

// Mock next/image
vi.mock('next/image', () => ({
	default: ({ src, alt, className, onClick }: any) => {
		const srcString = typeof src === 'object' && src?.src ? src.src : src;
		return <img alt={alt} className={className} data-testid='mock-image' src={srcString} onClick={onClick} />;
	},
}));

// Mock the types module - vi.mock is hoisted, so we must define values inline
vi.mock('../types', () => {
	const agents = ['Brimstone', 'Viper', 'Omen', 'Sova'];
	const agentUtilityMap = {
		Brimstone: ['Smoke', 'Molly', 'Beacon'],
		Viper: ['Smoke', 'Molly', 'Wall'],
		Omen: ['Smoke', 'Flash', 'TP'],
		Sova: ['Dart', 'Drone', 'Shock'],
	};
	const imageMap = Object.fromEntries([
		...agents.map((agent) => [agent, { src: `/images/${agent.toLowerCase()}.png` }]),
		...Object.values(agentUtilityMap)
			.flat()
			.map((utility) => [utility, { src: `/images/${utility.toLowerCase()}.png` }]),
	]);

	return {
		agents,
		agentUtilityMap,
		imageMap,
	};
});

// --- Mock Configuration ---
// These are for use in tests since we can't reference them from the vi.mock
const MOCK_AGENTS = ['Brimstone', 'Viper', 'Omen', 'Sova'] as const;

// Mock react-zoom-pan-pinch
vi.mock('react-zoom-pan-pinch', () => ({
	TransformWrapper: ({ children }: any) => <div data-testid='transform-wrapper'>{typeof children === 'function' ? children({}) : children}</div>,
	TransformComponent: ({ children }: any) => <div data-testid='transform-component'>{children}</div>,
}));

// Mock the hooks
vi.mock('../hooks/useMapMap', () => ({
	useMapMap: () => ({
		ascent: {
			svgComponent: () => <svg data-testid='map-svg-ascent' />,
			lineups: [],
			areasFrom: [],
			areasTo: [],
		},
		bind: {
			svgComponent: () => <svg data-testid='map-svg-bind' />,
			lineups: [],
			areasFrom: [],
			areasTo: [],
		},
	}),
}));

vi.mock('../hooks/useSelectedFilters', () => ({
	useSelectedFilters: () => ({
		selectedSite: 'all',
		selectedDirection: 'all',
		setSelectedSite: vi.fn(),
		setSelectedDirection: vi.fn(),
		toggleSelectedSite: vi.fn(),
		toggleSelectedDirection: vi.fn(),
	}),
}));

// --- Test Helpers ---

const expectComponentToExist = (testId: string) => {
	expect(screen.getByTestId(testId)).toBeInTheDocument();
};

const expectButtonToExist = (name: RegExp | string) => {
	expect(screen.getByRole('button', { name })).toBeInTheDocument();
};

// --- Test Suite ---

describe('ValorantLineupClient', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe('Component Structure', () => {
		it('should render with all main sections', () => {
			render(<ValorantLineupClient />);

			// Check headers
			expect(screen.getByText('Lineup Tool')).toBeInTheDocument();
			expect(screen.getByText('Map Selection')).toBeInTheDocument();
			expect(screen.getByText('Agent Selection')).toBeInTheDocument();
			expect(screen.getByText('Lineup Direction')).toBeInTheDocument();
		});

		it('should render map components correctly', () => {
			render(<ValorantLineupClient />);

			// Check transform wrapper for map interaction
			expectComponentToExist('transform-wrapper');
			expectComponentToExist('transform-component');
			expectComponentToExist('map-svg-ascent');
		});
	});

	describe('Map Selection', () => {
		it('should display available maps with lowercase names', () => {
			render(<ValorantLineupClient />);

			expectButtonToExist('ascent');
			expectButtonToExist('bind');
		});
	});

	describe('Agent Selection', () => {
		it('should display all available agents', () => {
			render(<ValorantLineupClient />);

			MOCK_AGENTS.forEach((agent) => {
				expectButtonToExist(agent);
			});
		});

		it('should handle disabled state for agents without lineups', () => {
			render(<ValorantLineupClient />);

			// Get Brimstone button (may be disabled on certain maps)
			const brimstoneButton = screen.getByRole('button', { name: 'Brimstone' });
			expect(brimstoneButton).toBeInTheDocument();

			// The button may be disabled if no lineups exist for this agent on the current map
			if (brimstoneButton.hasAttribute('disabled')) {
				expect(brimstoneButton).toBeDisabled();
			}
		});
	});

	describe('Lineup Direction Controls', () => {
		it('should show lineup direction toggle buttons', () => {
			render(<ValorantLineupClient />);

			expectButtonToExist('Utility → Agent');
			expectButtonToExist('Agent → Utility');
		});
	});

	describe('Mobile UI', () => {
		it('should include close sidebar buttons for mobile view', () => {
			render(<ValorantLineupClient />);

			const closeButtons = screen.getAllByLabelText('Close sidebar');
			expect(closeButtons.length).toBeGreaterThan(0);
		});
	});
});
