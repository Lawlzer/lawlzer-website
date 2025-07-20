import { fireEvent, render, screen } from '@testing-library/react';
import React from 'react';
import { describe, expect, it, vi } from 'vitest';

import { DashboardOverview } from './DashboardOverview';

describe('DashboardOverview', () => {
	const defaultProps = {
		dailyCalories: { current: 1500, goal: 2000 },
		dailyProtein: { current: 60, goal: 80 },
		recipeCount: 25,
		loggedDays: 7,
	};

	it('renders with all required props', () => {
		render(<DashboardOverview {...defaultProps} />);
		
		expect(screen.getByText('Welcome back!')).toBeInTheDocument();
		expect(screen.getByText('Track your nutrition and discover new recipes')).toBeInTheDocument();
	});

	it('displays nutrition progress correctly', () => {
		render(<DashboardOverview {...defaultProps} />);
		
		expect(screen.getByText('1500 / 2000 kcal')).toBeInTheDocument();
		expect(screen.getByText('60 / 80 g')).toBeInTheDocument();
	});

	it('calculates progress percentages correctly', () => {
		render(<DashboardOverview {...defaultProps} />);
		
		// Check that progress bars are rendered (they use inline styles)
		const progressBars = screen.getByText('1500 / 2000 kcal').closest('div')?.querySelector('[style*="width"]');
		expect(progressBars).toHaveStyle({ width: '75%' }); // 1500/2000 = 75%
	});

	it('caps progress at 100% when exceeding goal', () => {
		render(
			<DashboardOverview
				{...defaultProps}
				dailyCalories={{ current: 2500, goal: 2000 }}
			/>
		);
		
		const progressBar = screen.getByText('2500 / 2000 kcal').closest('div')?.querySelector('[style*="width"]');
		expect(progressBar).toHaveStyle({ width: '100%' });
	});

	it('displays recipe and logged days stats', () => {
		render(<DashboardOverview {...defaultProps} />);
		
		expect(screen.getByText('25')).toBeInTheDocument();
		expect(screen.getByText('Recipes')).toBeInTheDocument();
		expect(screen.getByText('7')).toBeInTheDocument();
		expect(screen.getByText('Days Tracked')).toBeInTheDocument();
	});

	describe('Quick Actions', () => {
		it('renders all quick action buttons', () => {
			render(<DashboardOverview {...defaultProps} />);
			
			expect(screen.getByText('Log Food')).toBeInTheDocument();
			expect(screen.getByText('Scan Food')).toBeInTheDocument();
			expect(screen.getByText('New Recipe')).toBeInTheDocument();
			expect(screen.getByText('Meal Plan')).toBeInTheDocument();
		});

		it('calls onNavigate with correct tab when buttons clicked', () => {
			const onNavigate = vi.fn();
			render(<DashboardOverview {...defaultProps} onNavigate={onNavigate} />);
			
			fireEvent.click(screen.getByText('Log Food'));
			expect(onNavigate).toHaveBeenCalledWith('tracker');
			
			fireEvent.click(screen.getByText('Scan Food'));
			expect(onNavigate).toHaveBeenCalledWith('scan');
			
			fireEvent.click(screen.getByText('New Recipe'));
			expect(onNavigate).toHaveBeenCalledWith('recipes');
			
			fireEvent.click(screen.getByText('Meal Plan'));
			expect(onNavigate).toHaveBeenCalledWith('planner');
		});
	});

	describe('Weekly Stats', () => {
		it('displays default weekly stats when not provided', () => {
			render(<DashboardOverview {...defaultProps} />);
			
			expect(screen.getByText('2,150')).toBeInTheDocument(); // Weekly average calories
			expect(screen.getByText('Chicken Salad')).toBeInTheDocument(); // Favorite recipe
			expect(screen.getByText('7 days')).toBeInTheDocument(); // Streak
		});

		it('displays custom weekly stats when provided', () => {
			const weeklyStats = {
				averageCalories: 1800,
				favoriteRecipe: { name: 'Pasta Salad', count: 3 },
				streak: 14
			};
			
			render(<DashboardOverview {...defaultProps} weeklyStats={weeklyStats} />);
			
			expect(screen.getByText('1,800')).toBeInTheDocument();
			expect(screen.getByText('Pasta Salad')).toBeInTheDocument();
			expect(screen.getByText('3 times this month')).toBeInTheDocument();
			expect(screen.getByText('14 days')).toBeInTheDocument();
		});

		it('handles single day streak correctly', () => {
			const weeklyStats = {
				averageCalories: 2000,
				favoriteRecipe: { name: 'Salad', count: 1 },
				streak: 1
			};
			
			render(<DashboardOverview {...defaultProps} weeklyStats={weeklyStats} />);
			
			expect(screen.getByText('1 day')).toBeInTheDocument(); // Singular
		});

		it('handles no favorite recipe', () => {
			const weeklyStats = {
				averageCalories: 2000,
				streak: 5
			};
			
			render(<DashboardOverview {...defaultProps} weeklyStats={weeklyStats} />);
			
			expect(screen.getByText('None yet')).toBeInTheDocument();
			expect(screen.getByText('Start cooking!')).toBeInTheDocument();
		});
	});

	describe('Recent Recipes', () => {
		it('does not render recent recipes section when empty', () => {
			render(<DashboardOverview {...defaultProps} recentRecipes={[]} />);
			
			expect(screen.queryByText('Recent Recipes')).not.toBeInTheDocument();
		});

		it('renders recent recipes when provided', () => {
			const recentRecipes = [
				{ id: '1', name: 'Recipe 1', imageUrl: 'image1.jpg' },
				{ id: '2', name: 'Recipe 2' },
				{ id: '3', name: 'Recipe 3', imageUrl: 'image3.jpg' }
			];
			
			render(<DashboardOverview {...defaultProps} recentRecipes={recentRecipes} />);
			
			expect(screen.getByText('Recent Recipes')).toBeInTheDocument();
			expect(screen.getByText('Recipe 1')).toBeInTheDocument();
			expect(screen.getByText('Recipe 2')).toBeInTheDocument();
			expect(screen.getByText('Recipe 3')).toBeInTheDocument();
		});

		it('renders View All button that navigates to recipes', () => {
			const onNavigate = vi.fn();
			const recentRecipes = [{ id: '1', name: 'Recipe 1' }];
			
			render(
				<DashboardOverview
					{...defaultProps}
					recentRecipes={recentRecipes}
					onNavigate={onNavigate}
				/>
			);
			
			fireEvent.click(screen.getByText('View All'));
			expect(onNavigate).toHaveBeenCalledWith('recipes');
		});

		it('navigates to recipes when recipe clicked', () => {
			const onNavigate = vi.fn();
			const recentRecipes = [{ id: '1', name: 'Recipe 1' }];
			
			render(
				<DashboardOverview
					{...defaultProps}
					recentRecipes={recentRecipes}
					onNavigate={onNavigate}
				/>
			);
			
			fireEvent.click(screen.getByText('Recipe 1'));
			expect(onNavigate).toHaveBeenCalledWith('recipes');
		});
	});

	describe('Edge Cases', () => {
		it('handles zero values correctly', () => {
			render(
				<DashboardOverview
					dailyCalories={{ current: 0, goal: 2000 }}
					dailyProtein={{ current: 0, goal: 80 }}
					recipeCount={0}
					loggedDays={0}
				/>
			);
			
			expect(screen.getByText('0 / 2000 kcal')).toBeInTheDocument();
			expect(screen.getByText('0 / 80 g')).toBeInTheDocument();
			expect(screen.getByText('0')).toBeInTheDocument();
		});

		it('handles undefined onNavigate gracefully', () => {
			render(<DashboardOverview {...defaultProps} />);
			
			// Should not throw when clicking buttons without onNavigate
			expect(() => fireEvent.click(screen.getByText('Log Food'))).not.toThrow();
		});
	});

	describe('Accessibility', () => {
		it('has proper heading structure', () => {
			render(<DashboardOverview {...defaultProps} />);
			
			const welcomeHeading = screen.getByRole('heading', { name: 'Welcome back!' });
			expect(welcomeHeading.tagName).toBe('H2');
		});

		it('quick action buttons have descriptive text', () => {
			render(<DashboardOverview {...defaultProps} />);
			
			expect(screen.getByRole('button', { name: /Log Food/i })).toBeInTheDocument();
			expect(screen.getByRole('button', { name: /Scan Food/i })).toBeInTheDocument();
			expect(screen.getByRole('button', { name: /New Recipe/i })).toBeInTheDocument();
			expect(screen.getByRole('button', { name: /Meal Plan/i })).toBeInTheDocument();
		});
	});

	describe('Animations', () => {
		it('applies fade-in animation class', () => {
			const { container } = render(<DashboardOverview {...defaultProps} />);
			
			const animatedDiv = container.firstChild;
			expect(animatedDiv).toHaveClass('animate-fade-in');
		});
	});
});