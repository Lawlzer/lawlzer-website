'use client';

import { useSession } from 'next-auth/react';
import { useState, useEffect } from 'react';

import { FullDayNutrition } from '../components/FullDayNutrition';
import { RecipeCard } from '../components/RecipeCard';
import { VirtualizedRecipeList } from '../components/VirtualizedRecipeList';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import type { RecipeWithDetails } from '../types/recipe.types';

export default function AdvancedSearchPage() {
	const [searchTerm, setSearchTerm] = useState('');
	const [ingredients, setIngredients] = useState('');
	const [maxPrepTime, setMaxPrepTime] = useState('');
	const [sortBy, setSortBy] = useState('createdAt');
	const [results, setResults] = useState<RecipeWithDetails[]>([]);
	const [isLoading, setIsLoading] = useState(false);
	const [viewingFullDayRecipe, setViewingFullDayRecipe] = useState<RecipeWithDetails | null>(null);
	const { data: session } = useSession();
	const isAdmin = session?.user?.id === 'your_admin_user_id_here'; // Replace with actual admin ID

	const handleSearch = async () => {
		setIsLoading(true);
		const queryParams = new URLSearchParams();
		if (searchTerm) {
			queryParams.append('query', searchTerm);
		}
		if (ingredients) {
			queryParams.append('ingredients', ingredients);
		}
		if (maxPrepTime) {
			queryParams.append('maxPrepTime', maxPrepTime);
		}
		if (sortBy) {
			queryParams.append('sortBy', sortBy);
		}

		try {
			const response = await fetch(`/api/cooking/search?${queryParams.toString()}`);
			const data = await response.json();
			setResults(data);
		} catch (error) {
			console.error('Error searching recipes:', error);
		} finally {
			setIsLoading(false);
		}
	};

	// Auto-search on filter changes
	useEffect(() => {
		const timer = setTimeout(() => {
			if (searchTerm || ingredients || maxPrepTime) {
				void handleSearch();
			}
		}, 500);
		return () => clearTimeout(timer);
	}, [searchTerm, ingredients, maxPrepTime, sortBy]);

	return (
		<div className='min-h-screen bg-gradient-to-br from-cooking-neutral-50 via-white to-cooking-primary/5'>
			<div className='container mx-auto px-4 py-8'>
				{/* Header */}
				<div className='text-center mb-8'>
					<h1 className='text-4xl font-bold bg-gradient-to-r from-cooking-primary to-cooking-accent bg-clip-text text-transparent mb-2'>
						Discover Recipes
					</h1>
					<p className='text-lg text-cooking-neutral-600'>
						Find the perfect recipe for any occasion
					</p>
				</div>

				{/* Search Filters */}
				<Card variant='glass' className='p-6 mb-8'>
					<div className='space-y-6'>
						{/* Main Search */}
						<Input
							type='text'
							value={searchTerm}
							onChange={(e) => setSearchTerm(e.target.value)}
							placeholder='Search by recipe name or description...'
							variant='floating'
							label='Search Recipes'
							leftIcon={
								<svg className='w-5 h-5' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
									<path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z' />
								</svg>
							}
							className='text-lg'
						/>

						{/* Filter Options */}
						<div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
							<Input
								type='text'
								value={ingredients}
								onChange={(e) => setIngredients(e.target.value)}
								placeholder='e.g., chicken, tomato, basil'
								label='Ingredients'
								helperText='Separate multiple ingredients with commas'
								leftIcon={
									<svg className='w-5 h-5' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
										<path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z' />
									</svg>
								}
							/>

							<Input
								type='number'
								value={maxPrepTime}
								onChange={(e) => setMaxPrepTime(e.target.value)}
								placeholder='30'
								label='Max Time (minutes)'
								leftIcon={
									<svg className='w-5 h-5' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
										<path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z' />
									</svg>
								}
							/>

							<div>
								<label className='block text-sm font-medium text-cooking-neutral-700 mb-2'>
									Sort By
								</label>
								<select
									value={sortBy}
									onChange={(e) => setSortBy(e.target.value)}
									className='w-full px-4 py-3 border border-cooking-neutral-300 rounded-lg focus:ring-2 focus:ring-cooking-primary focus:border-cooking-primary'
								>
									<option value='createdAt'>Newest First</option>
									<option value='likes'>Most Popular</option>
									<option value='calories'>Lowest Calories</option>
									<option value='prepTime'>Quickest</option>
									{isAdmin && <option value='reports'>Most Reported</option>}
								</select>
							</div>
						</div>

						{/* Quick Filters */}
						<div className='flex flex-wrap gap-2'>
							<span className='text-sm text-cooking-neutral-600'>Quick filters:</span>
							<Button
								variant='outline'
								size='xs'
								onClick={() => setMaxPrepTime('15')}
							>
								Under 15 min
							</Button>
							<Button
								variant='outline'
								size='xs'
								onClick={() => setIngredients('vegetarian')}
							>
								Vegetarian
							</Button>
							<Button
								variant='outline'
								size='xs'
								onClick={() => setSortBy('calories')}
							>
								Low Calorie
							</Button>
							{(searchTerm || ingredients || maxPrepTime) && (
								<Button
									variant='ghost'
									size='xs'
									onClick={() => {
										setSearchTerm('');
										setIngredients('');
										setMaxPrepTime('');
										setResults([]);
									}}
									className='text-cooking-accent'
								>
									Clear All
								</Button>
							)}
						</div>
					</div>
				</Card>

				{/* Results Section */}
				<div>
					{/* Results Header */}
					{(isLoading || results.length > 0) && (
						<div className='flex items-center justify-between mb-6'>
							<h2 className='text-2xl font-bold text-cooking-neutral-900'>
								{isLoading ? 'Searching...' : `Found ${results.length} recipes`}
							</h2>
							{results.length > 0 && (
								<p className='text-sm text-cooking-neutral-600'>
									Showing results for{' '}
									{searchTerm && <span className='font-medium'>"{searchTerm}"</span>}
									{ingredients && <span className='font-medium'> with {ingredients}</span>}
									{maxPrepTime && <span className='font-medium'> under {maxPrepTime} minutes</span>}
								</p>
							)}
						</div>
					)}

					{/* Loading State */}
					{isLoading ? (
						<div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
							{[...Array(6)].map((_, i) => (
								<Card key={i} variant='elevated' className='h-96 animate-pulse'>
									<div className='h-48 bg-cooking-neutral-200'></div>
									<div className='p-6 space-y-3'>
										<div className='h-6 bg-cooking-neutral-200 rounded'></div>
										<div className='h-4 bg-cooking-neutral-200 rounded w-3/4'></div>
										<div className='h-4 bg-cooking-neutral-200 rounded w-1/2'></div>
									</div>
								</Card>
							))}
						</div>
					) : results.length === 0 ? (
						/* Empty State */
						<Card variant='glass' className='p-12 text-center'>
							<div className='max-w-md mx-auto'>
								<div className='w-24 h-24 bg-cooking-primary/10 rounded-full flex items-center justify-center mx-auto mb-6'>
									<svg className='w-12 h-12 text-cooking-primary' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
										<path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z' />
									</svg>
								</div>
								<h3 className='text-xl font-semibold text-cooking-neutral-900 mb-2'>
									{searchTerm || ingredients || maxPrepTime ? 'No recipes found' : 'Start your search'}
								</h3>
								<p className='text-cooking-neutral-600'>
									{searchTerm || ingredients || maxPrepTime
										? 'Try adjusting your filters or search terms'
										: 'Enter a recipe name, ingredients, or use the filters above'}
								</p>
							</div>
						</Card>
					) : results.length > 20 ? (
						/* Virtual List for Large Results */
						<VirtualizedRecipeList 
							recipes={results} 
							isOwner={false} 
							onViewFullDay={(recipe) => setViewingFullDayRecipe(recipe)} 
						/>
					) : (
						/* Recipe Grid */
						<div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
							{results.map((recipe) => (
								<RecipeCard
									key={recipe.id}
									recipe={recipe}
									isOwner={false}
									onCook={() => {}}
									onDelete={() => {}}
									onEdit={() => {}}
									onViewHistory={() => {}}
									onViewFullDay={() => setViewingFullDayRecipe(recipe)}
								/>
							))}
						</div>
					)}
				</div>

				{/* Modal */}
				{viewingFullDayRecipe && (
					<FullDayNutrition
						recipe={viewingFullDayRecipe}
						onClose={() => setViewingFullDayRecipe(null)}
					/>
				)}
			</div>
		</div>
	);
}
