import { fireEvent, render, screen } from '@testing-library/react';
import React from 'react';
import { describe, expect, it, vi } from 'vitest';

import { ImprovedTabNavigation } from './ImprovedTabNavigation';

describe('ImprovedTabNavigation', () => {
	const defaultTabs = [
		{ id: 'overview', label: 'Overview', icon: <span data-testid="overview-icon">📊</span> },
		{ id: 'recipes', label: 'Recipes', icon: <span data-testid="recipes-icon">📖</span> },
		{ id: 'tracker', label: 'Tracker', icon: <span data-testid="tracker-icon">📈</span> },
		{ id: 'scan', label: 'Scan', icon: <span data-testid="scan-icon">📷</span> }
	];

	it('renders all tabs', () => {
		render(
			<ImprovedTabNavigation
				tabs={defaultTabs}
				activeTab="overview"
				onTabChange={() => {}}
			/>
		);

		expect(screen.getByText('Overview')).toBeInTheDocument();
		expect(screen.getByText('Recipes')).toBeInTheDocument();
		expect(screen.getByText('Tracker')).toBeInTheDocument();
		expect(screen.getByText('Scan')).toBeInTheDocument();
	});

	it('renders tab icons', () => {
		render(
			<ImprovedTabNavigation
				tabs={defaultTabs}
				activeTab="overview"
				onTabChange={() => {}}
			/>
		);

		expect(screen.getByTestId('overview-icon')).toBeInTheDocument();
		expect(screen.getByTestId('recipes-icon')).toBeInTheDocument();
		expect(screen.getByTestId('tracker-icon')).toBeInTheDocument();
		expect(screen.getByTestId('scan-icon')).toBeInTheDocument();
	});

	it('highlights active tab', () => {
		const { rerender } = render(
			<ImprovedTabNavigation
				tabs={defaultTabs}
				activeTab="overview"
				onTabChange={() => {}}
			/>
		);

		// Check active tab has correct classes
		const overviewButton = screen.getByRole('button', { name: /Overview/i });
		expect(overviewButton).toHaveClass('text-cooking-primary');
		expect(overviewButton).toHaveClass('border-b-2');
		expect(overviewButton).toHaveClass('border-cooking-primary');

		// Change active tab
		rerender(
			<ImprovedTabNavigation
				tabs={defaultTabs}
				activeTab="recipes"
				onTabChange={() => {}}
			/>
		);

		const recipesButton = screen.getByRole('button', { name: /Recipes/i });
		expect(recipesButton).toHaveClass('text-cooking-primary');
		expect(overviewButton).not.toHaveClass('text-cooking-primary');
	});

	it('calls onTabChange when tab clicked', () => {
		const onTabChange = vi.fn();
		render(
			<ImprovedTabNavigation
				tabs={defaultTabs}
				activeTab="overview"
				onTabChange={onTabChange}
			/>
		);

		fireEvent.click(screen.getByRole('button', { name: /Recipes/i }));
		expect(onTabChange).toHaveBeenCalledWith('recipes');

		fireEvent.click(screen.getByRole('button', { name: /Tracker/i }));
		expect(onTabChange).toHaveBeenCalledWith('tracker');
	});

	it('does not call onTabChange when clicking active tab', () => {
		const onTabChange = vi.fn();
		render(
			<ImprovedTabNavigation
				tabs={defaultTabs}
				activeTab="overview"
				onTabChange={onTabChange}
			/>
		);

		fireEvent.click(screen.getByRole('button', { name: /Overview/i }));
		expect(onTabChange).not.toHaveBeenCalled();
	});

	it('handles empty tabs array', () => {
		render(
			<ImprovedTabNavigation
				tabs={[]}
				activeTab="overview"
				onTabChange={() => {}}
			/>
		);

		// Should render without crashing
		const navigation = screen.getByRole('navigation');
		expect(navigation).toBeInTheDocument();
	});

	it('handles tabs without icons', () => {
		const tabsWithoutIcons = [
			{ id: 'tab1', label: 'Tab 1' },
			{ id: 'tab2', label: 'Tab 2' }
		];

		render(
			<ImprovedTabNavigation
				tabs={tabsWithoutIcons}
				activeTab="tab1"
				onTabChange={() => {}}
			/>
		);

		expect(screen.getByText('Tab 1')).toBeInTheDocument();
		expect(screen.getByText('Tab 2')).toBeInTheDocument();
	});

	describe('Mobile behavior', () => {
		it('applies mobile-specific classes', () => {
			render(
				<ImprovedTabNavigation
					tabs={defaultTabs}
					activeTab="overview"
					onTabChange={() => {}}
				/>
			);

			const navigation = screen.getByRole('navigation');
			expect(navigation).toHaveClass('overflow-x-auto');
			expect(navigation).toHaveClass('md:overflow-visible');
		});

		it('allows horizontal scrolling on mobile', () => {
			render(
				<ImprovedTabNavigation
					tabs={defaultTabs}
					activeTab="overview"
					onTabChange={() => {}}
				/>
			);

			const tabList = screen.getByRole('tablist');
			expect(tabList).toHaveClass('flex');
			expect(tabList).toHaveClass('space-x-1');
		});
	});

	describe('Accessibility', () => {
		it('has proper ARIA attributes', () => {
			render(
				<ImprovedTabNavigation
					tabs={defaultTabs}
					activeTab="overview"
					onTabChange={() => {}}
				/>
			);

			const tabList = screen.getByRole('tablist');
			expect(tabList).toBeInTheDocument();

			const tabs = screen.getAllByRole('tab');
			expect(tabs).toHaveLength(4);

			// Active tab should have aria-selected
			const activeTab = screen.getByRole('tab', { name: /Overview/i });
			expect(activeTab).toHaveAttribute('aria-selected', 'true');

			// Inactive tabs should have aria-selected false
			const inactiveTab = screen.getByRole('tab', { name: /Recipes/i });
			expect(inactiveTab).toHaveAttribute('aria-selected', 'false');
		});

		it('supports keyboard navigation', () => {
			const onTabChange = vi.fn();
			render(
				<ImprovedTabNavigation
					tabs={defaultTabs}
					activeTab="overview"
					onTabChange={onTabChange}
				/>
			);

			const recipesTab = screen.getByRole('tab', { name: /Recipes/i });
			recipesTab.focus();

			// Enter key should activate tab
			fireEvent.keyDown(recipesTab, { key: 'Enter' });
			expect(onTabChange).toHaveBeenCalledWith('recipes');

			// Space key should also activate tab
			onTabChange.mockClear();
			fireEvent.keyDown(recipesTab, { key: ' ' });
			expect(onTabChange).toHaveBeenCalledWith('recipes');
		});
	});

	describe('Edge cases', () => {
		it('handles undefined activeTab', () => {
			render(
				<ImprovedTabNavigation
					tabs={defaultTabs}
					activeTab={undefined as any}
					onTabChange={() => {}}
				/>
			);

			// No tab should be highlighted
			const tabs = screen.getAllByRole('tab');
			tabs.forEach(tab => {
				expect(tab).not.toHaveClass('text-cooking-primary');
			});
		});

		it('handles activeTab that does not match any tab id', () => {
			render(
				<ImprovedTabNavigation
					tabs={defaultTabs}
					activeTab="non-existent"
					onTabChange={() => {}}
				/>
			);

			// No tab should be highlighted
			const tabs = screen.getAllByRole('tab');
			tabs.forEach(tab => {
				expect(tab).not.toHaveClass('text-cooking-primary');
			});
		});

		it('handles very long tab labels', () => {
			const longLabelTabs = [
				{ id: 'tab1', label: 'This is a very long tab label that might overflow' },
				{ id: 'tab2', label: 'Another extremely long label for testing purposes' }
			];

			render(
				<ImprovedTabNavigation
					tabs={longLabelTabs}
					activeTab="tab1"
					onTabChange={() => {}}
				/>
			);

			expect(screen.getByText('This is a very long tab label that might overflow')).toBeInTheDocument();
		});
	});

	describe('Styling', () => {
		it('applies correct hover styles to inactive tabs', () => {
			render(
				<ImprovedTabNavigation
					tabs={defaultTabs}
					activeTab="overview"
					onTabChange={() => {}}
				/>
			);

			const inactiveTab = screen.getByRole('tab', { name: /Recipes/i });
			expect(inactiveTab).toHaveClass('hover:text-cooking-primary');
			expect(inactiveTab).toHaveClass('hover:bg-cooking-neutral-50');
		});

		it('applies transition classes for smooth animations', () => {
			render(
				<ImprovedTabNavigation
					tabs={defaultTabs}
					activeTab="overview"
					onTabChange={() => {}}
				/>
			);

			const tabs = screen.getAllByRole('tab');
			tabs.forEach(tab => {
				expect(tab).toHaveClass('transition-all');
				expect(tab).toHaveClass('duration-200');
			});
		});
	});
});