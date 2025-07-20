import { fireEvent, render, screen } from '@testing-library/react';
import React from 'react';
import { describe, expect, it, vi } from 'vitest';

import { RecipeCard } from './RecipeCard';
import type { Recipe } from '@/types/cooking/recipe';

describe('RecipeCard', () => {
	const mockRecipe: Recipe = {
		id: '1',
		userId: 'user123',
		name: 'Chicken Salad',
		description: 'A delicious and healthy chicken salad',
		imageUrl: '/chicken-salad.jpg',
		servings: 4,
		prepTime: 15,
		cookTime: 20,
		totalTime: 35,
		difficulty: 'easy',
		cuisine: 'American',
		category: 'Salad',
		tags: ['healthy', 'quick', 'protein'],
		ingredients: [],
		instructions: [],
		nutrition: {
			calories: 250,
			protein: 30,
			carbs: 15,
			fat: 10,
			fiber: 5,
			sugar: 3,
			sodium: 300
		},
		rating: 4.5,
		reviewCount: 12,
		isFavorite: false,
		createdAt: new Date('2024-01-01'),
		updatedAt: new Date('2024-01-01')
	};

	it('renders recipe information correctly', () => {
		render(<RecipeCard recipe={mockRecipe} />);

		expect(screen.getByText('Chicken Salad')).toBeInTheDocument();
		expect(screen.getByText('A delicious and healthy chicken salad')).toBeInTheDocument();
		expect(screen.getByAltText('Chicken Salad')).toHaveAttribute('src', '/chicken-salad.jpg');
	});

	it('displays cooking time information', () => {
		render(<RecipeCard recipe={mockRecipe} />);

		expect(screen.getByText('35 min')).toBeInTheDocument();
		expect(screen.getByText('4 servings')).toBeInTheDocument();
	});

	it('displays difficulty level with correct styling', () => {
		const { rerender } = render(<RecipeCard recipe={mockRecipe} />);
		
		let badge = screen.getByText('Easy');
		expect(badge).toHaveClass('bg-green-100');
		expect(badge).toHaveClass('text-green-800');

		rerender(<RecipeCard recipe={{ ...mockRecipe, difficulty: 'medium' }} />);
		badge = screen.getByText('Medium');
		expect(badge).toHaveClass('bg-yellow-100');
		expect(badge).toHaveClass('text-yellow-800');

		rerender(<RecipeCard recipe={{ ...mockRecipe, difficulty: 'hard' }} />);
		badge = screen.getByText('Hard');
		expect(badge).toHaveClass('bg-red-100');
		expect(badge).toHaveClass('text-red-800');
	});

	it('displays nutrition information', () => {
		render(<RecipeCard recipe={mockRecipe} />);

		expect(screen.getByText('250')).toBeInTheDocument();
		expect(screen.getByText('cal')).toBeInTheDocument();
		expect(screen.getByText('30g')).toBeInTheDocument();
		expect(screen.getByText('protein')).toBeInTheDocument();
	});

	it('handles recipes without nutrition info', () => {
		const recipeWithoutNutrition = { ...mockRecipe, nutrition: undefined };
		render(<RecipeCard recipe={recipeWithoutNutrition} />);

		expect(screen.queryByText('cal')).not.toBeInTheDocument();
		expect(screen.queryByText('protein')).not.toBeInTheDocument();
	});

	it('displays rating and review count', () => {
		render(<RecipeCard recipe={mockRecipe} />);

		// Rating is displayed as stars, check for the rating number
		expect(screen.getByText('4.5')).toBeInTheDocument();
		expect(screen.getByText('(12)')).toBeInTheDocument();
	});

	it('handles recipes without rating', () => {
		const recipeWithoutRating = { ...mockRecipe, rating: undefined, reviewCount: undefined };
		render(<RecipeCard recipe={recipeWithoutRating} />);

		expect(screen.queryByText('4.5')).not.toBeInTheDocument();
		expect(screen.queryByText('(12)')).not.toBeInTheDocument();
	});

	it('displays tags', () => {
		render(<RecipeCard recipe={mockRecipe} />);

		expect(screen.getByText('healthy')).toBeInTheDocument();
		expect(screen.getByText('quick')).toBeInTheDocument();
		expect(screen.getByText('protein')).toBeInTheDocument();
	});

	it('handles recipes without tags', () => {
		const recipeWithoutTags = { ...mockRecipe, tags: [] };
		render(<RecipeCard recipe={recipeWithoutTags} />);

		// Tags section should not render
		expect(screen.queryByText('healthy')).not.toBeInTheDocument();
	});

	it('handles recipes without image', () => {
		const recipeWithoutImage = { ...mockRecipe, imageUrl: null };
		render(<RecipeCard recipe={recipeWithoutImage} />);

		// Should render placeholder
		expect(screen.getByText('No Image')).toBeInTheDocument();
	});

	it('truncates long descriptions', () => {
		const longDescription = 'This is a very long description that goes on and on and on and should be truncated at some point to maintain the card layout consistency';
		const recipeWithLongDesc = { ...mockRecipe, description: longDescription };
		
		render(<RecipeCard recipe={recipeWithLongDesc} />);

		const description = screen.getByText((content, element) => {
			return element?.classList.contains('line-clamp-2') && content.includes('This is a very long');
		});
		expect(description).toBeInTheDocument();
	});

	describe('Interactive features', () => {
		it('calls onClick when card is clicked', () => {
			const onClick = vi.fn();
			render(<RecipeCard recipe={mockRecipe} onClick={onClick} />);

			fireEvent.click(screen.getByText('Chicken Salad'));
			expect(onClick).toHaveBeenCalledWith(mockRecipe);
		});

		it('calls onEdit when edit button is clicked', () => {
			const onEdit = vi.fn();
			const onClick = vi.fn();
			
			render(<RecipeCard recipe={mockRecipe} onEdit={onEdit} onClick={onClick} />);

			const editButton = screen.getByLabelText('Edit recipe');
			fireEvent.click(editButton);
			
			expect(onEdit).toHaveBeenCalledWith(mockRecipe);
			expect(onClick).not.toHaveBeenCalled(); // Should not trigger card click
		});

		it('calls onDelete when delete button is clicked', () => {
			const onDelete = vi.fn();
			const onClick = vi.fn();
			
			render(<RecipeCard recipe={mockRecipe} onDelete={onDelete} onClick={onClick} />);

			const deleteButton = screen.getByLabelText('Delete recipe');
			fireEvent.click(deleteButton);
			
			expect(onDelete).toHaveBeenCalledWith(mockRecipe);
			expect(onClick).not.toHaveBeenCalled();
		});

		it('calls onToggleFavorite when favorite button is clicked', () => {
			const onToggleFavorite = vi.fn();
			
			render(<RecipeCard recipe={mockRecipe} onToggleFavorite={onToggleFavorite} />);

			const favoriteButton = screen.getByLabelText('Toggle favorite');
			fireEvent.click(favoriteButton);
			
			expect(onToggleFavorite).toHaveBeenCalledWith(mockRecipe);
		});

		it('shows filled heart icon when recipe is favorite', () => {
			const favoriteRecipe = { ...mockRecipe, isFavorite: true };
			render(<RecipeCard recipe={favoriteRecipe} onToggleFavorite={() => {}} />);

			const favoriteButton = screen.getByLabelText('Toggle favorite');
			expect(favoriteButton).toHaveClass('text-red-500');
		});

		it('shows outline heart icon when recipe is not favorite', () => {
			render(<RecipeCard recipe={mockRecipe} onToggleFavorite={() => {}} />);

			const favoriteButton = screen.getByLabelText('Toggle favorite');
			expect(favoriteButton).toHaveClass('text-cooking-neutral-400');
		});
	});

	describe('Loading state', () => {
		it('renders loading skeleton', () => {
			render(<RecipeCard isLoading />);

			// Check for skeleton elements
			const skeletons = document.querySelectorAll('.animate-pulse');
			expect(skeletons.length).toBeGreaterThan(0);
		});

		it('does not render recipe content when loading', () => {
			render(<RecipeCard recipe={mockRecipe} isLoading />);

			expect(screen.queryByText('Chicken Salad')).not.toBeInTheDocument();
		});
	});

	describe('Disabled state', () => {
		it('applies disabled styles', () => {
			render(<RecipeCard recipe={mockRecipe} disabled />);

			const card = screen.getByText('Chicken Salad').closest('.group');
			expect(card).toHaveClass('opacity-50');
			expect(card).toHaveClass('cursor-not-allowed');
		});

		it('prevents interactions when disabled', () => {
			const onClick = vi.fn();
			const onEdit = vi.fn();
			
			render(
				<RecipeCard
					recipe={mockRecipe}
					disabled
					onClick={onClick}
					onEdit={onEdit}
				/>
			);

			fireEvent.click(screen.getByText('Chicken Salad'));
			expect(onClick).not.toHaveBeenCalled();

			const editButton = screen.getByLabelText('Edit recipe');
			expect(editButton).toBeDisabled();
		});
	});

	describe('Accessibility', () => {
		it('has proper heading structure', () => {
			render(<RecipeCard recipe={mockRecipe} />);

			const heading = screen.getByRole('heading', { name: 'Chicken Salad' });
			expect(heading.tagName).toBe('H3');
		});

		it('has accessible action buttons', () => {
			render(
				<RecipeCard
					recipe={mockRecipe}
					onEdit={() => {}}
					onDelete={() => {}}
					onToggleFavorite={() => {}}
				/>
			);

			expect(screen.getByLabelText('Edit recipe')).toBeInTheDocument();
			expect(screen.getByLabelText('Delete recipe')).toBeInTheDocument();
			expect(screen.getByLabelText('Toggle favorite')).toBeInTheDocument();
		});

		it('image has proper alt text', () => {
			render(<RecipeCard recipe={mockRecipe} />);

			const img = screen.getByAltText('Chicken Salad');
			expect(img).toBeInTheDocument();
		});
	});

	describe('Edge cases', () => {
		it('handles missing optional fields gracefully', () => {
			const minimalRecipe = {
				...mockRecipe,
				description: null,
				imageUrl: null,
				tags: [],
				nutrition: undefined,
				rating: undefined,
				reviewCount: undefined,
				prepTime: undefined,
				cookTime: undefined,
				totalTime: undefined,
				difficulty: undefined
			};

			render(<RecipeCard recipe={minimalRecipe} />);

			expect(screen.getByText('Chicken Salad')).toBeInTheDocument();
			expect(screen.getByText('4 servings')).toBeInTheDocument();
			expect(screen.getByText('No Image')).toBeInTheDocument();
		});

		it('handles very long recipe names', () => {
			const longNameRecipe = {
				...mockRecipe,
				name: 'This is an extremely long recipe name that should be truncated to maintain card layout'
			};

			render(<RecipeCard recipe={longNameRecipe} />);

			const heading = screen.getByRole('heading');
			expect(heading).toHaveClass('line-clamp-1');
		});
	});
});