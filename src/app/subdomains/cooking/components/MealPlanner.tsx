'use client';

import type { Food } from '@prisma/client';
import { useEffect, useState } from 'react';

import type { RecipeWithDetails } from '../types/recipe.types';

import { CalendarIcon } from './Icons';

import { Button } from '~/components/ui/Button';
import { Card } from '~/components/ui/Card';

interface MealPlan {
	id: string;
	date: string;
	mealType: 'breakfast' | 'dinner' | 'lunch' | 'snack';
	foodId?: string;
	recipeId?: string;
	food?: Food;
	recipe?: RecipeWithDetails;
	amount: number;
	notes?: string;
}

interface MealPlannerProps {
	isGuest: boolean;
	availableFoods: Food[];
	availableRecipes: RecipeWithDetails[];
}

export function MealPlanner({ isGuest, availableFoods, availableRecipes }: MealPlannerProps) {
	const [selectedDate, setSelectedDate] = useState(() => {
		const tomorrow = new Date();
		tomorrow.setDate(tomorrow.getDate() + 1);
		return tomorrow;
	});
	const [mealPlans, setMealPlans] = useState<MealPlan[]>([]);
	const [isLoading, setIsLoading] = useState(false);
	const [showAddMeal, setShowAddMeal] = useState(false);
	const [selectedMealType, setSelectedMealType] = useState<'breakfast' | 'dinner' | 'lunch' | 'snack'>('breakfast');
	const [selectedType, setSelectedType] = useState<'food' | 'recipe'>('food');
	const [selectedFoodId, setSelectedFoodId] = useState('');
	const [selectedRecipeId, setSelectedRecipeId] = useState('');
	const [amount, setAmount] = useState('100');
	const [notes, setNotes] = useState('');

	// Format date for display
	const formatDate = (date: Date) =>
		date.toLocaleDateString('en-US', {
			weekday: 'long',
			year: 'numeric',
			month: 'long',
			day: 'numeric',
		});

	// Format date for API
	const formatDateForAPI = (date: Date) => {
		const year = date.getFullYear();
		const month = String(date.getMonth() + 1).padStart(2, '0');
		const day = String(date.getDate()).padStart(2, '0');
		return `${year}-${month}-${day}`;
	};

	// Load meal plans for selected date
	useEffect(() => {
		const loadMealPlans = () => {
			if (isGuest) {
				// Load from localStorage for guests
				const storedPlans = localStorage.getItem('guestMealPlans');
				if (storedPlans !== null) {
					const allPlans = JSON.parse(storedPlans) as MealPlan[];
					const datePlans = allPlans.filter((plan) => plan.date === formatDateForAPI(selectedDate));

					// Attach food/recipe details
					const plansWithDetails = datePlans.map((plan) => {
						if (plan.foodId !== undefined && plan.foodId !== null) {
							const food = availableFoods.find((f) => f.id === plan.foodId);
							return { ...plan, food };
						} else if (plan.recipeId !== undefined && plan.recipeId !== null) {
							const recipe = availableRecipes.find((r) => r.id === plan.recipeId);
							return { ...plan, recipe };
						}
						return plan;
					});

					setMealPlans(plansWithDetails);
				}
			} else {
				// TODO: Implement API call to load meal plans
				console.info('Loading meal plans from API not yet implemented');
			}
			setIsLoading(false);
		};

		loadMealPlans();
	}, [selectedDate, isGuest, availableFoods, availableRecipes]);

	const handleAddMeal = () => {
		const newPlan: MealPlan = {
			id: crypto.randomUUID(),
			date: formatDateForAPI(selectedDate),
			mealType: selectedMealType,
			amount: parseFloat(amount),
			notes,
		};

		if (selectedType === 'food' && selectedFoodId !== '') {
			const food = availableFoods.find((f) => f.id === selectedFoodId);
			if (food) {
				newPlan.foodId = selectedFoodId;
				newPlan.food = food;
			}
		} else if (selectedType === 'recipe' && selectedRecipeId !== '') {
			const recipe = availableRecipes.find((r) => r.id === selectedRecipeId);
			if (recipe) {
				newPlan.recipeId = selectedRecipeId;
				newPlan.recipe = recipe;
			}
		}

		if (isGuest) {
			// Save to localStorage for guests
			const storedPlans = localStorage.getItem('guestMealPlans');
			const allPlans = storedPlans !== null ? (JSON.parse(storedPlans) as MealPlan[]) : [];
			allPlans.push(newPlan);
			localStorage.setItem('guestMealPlans', JSON.stringify(allPlans));
			setMealPlans([...mealPlans, newPlan]);
		} else {
			// TODO: Implement API call to save meal plan
			console.info('Saving meal plan to API not yet implemented');
		}

		// Reset form
		setShowAddMeal(false);
		setSelectedFoodId('');
		setSelectedRecipeId('');
		setAmount('100');
		setNotes('');
	};

	const handleRemoveMeal = (planId: string) => {
		if (isGuest) {
			const storedPlans = localStorage.getItem('guestMealPlans');
			if (storedPlans !== null) {
				const allPlans = JSON.parse(storedPlans) as MealPlan[];
				const updatedPlans = allPlans.filter((p) => p.id !== planId);
				localStorage.setItem('guestMealPlans', JSON.stringify(updatedPlans));
				setMealPlans(mealPlans.filter((p) => p.id !== planId));
			}
		} else {
			// TODO: Implement API call to remove meal plan
			console.info('Removing meal plan from API not yet implemented');
		}
	};

	const handleCopyToToday = async (plan: MealPlan) => {
		// This would add the meal plan as an actual entry in today's tracking
		console.info('Copy to today functionality not yet implemented', plan);
	};

	// Group meal plans by type
	const mealsByType = mealPlans.reduce<Record<string, MealPlan[]>>((acc, plan) => {
		const existingPlans = acc[plan.mealType];
		if (existingPlans === undefined) {
			acc[plan.mealType] = [];
		}
		acc[plan.mealType].push(plan);
		return acc;
	}, {});

	// Calculate totals
	const calculateTotals = () => {
		let calories = 0;
		let protein = 0;
		let carbs = 0;
		let fat = 0;

		mealPlans.forEach((plan) => {
			const multiplier = plan.amount / 100;
			if (plan.food) {
				calories += plan.food.calories * multiplier;
				protein += plan.food.protein * multiplier;
				carbs += plan.food.carbs * multiplier;
				fat += plan.food.fat * multiplier;
			} else if (plan.recipe?.currentVersion) {
				calories += plan.recipe.currentVersion.caloriesPerServing * plan.recipe.servings * multiplier;
				protein += plan.recipe.currentVersion.proteinPerServing * plan.recipe.servings * multiplier;
				carbs += plan.recipe.currentVersion.carbsPerServing * plan.recipe.servings * multiplier;
				fat += plan.recipe.currentVersion.fatPerServing * plan.recipe.servings * multiplier;
			}
		});

		return { calories, protein, carbs, fat };
	};

	const totals = calculateTotals();

	return (
		<div className='space-y-6'>
			<div className='flex items-center justify-between'>
				<h2 className='text-2xl font-bold'>Meal Planning</h2>
				<div className='flex items-center gap-2'>
					<CalendarIcon className='w-5 h-5' />
					<input
						type='date'
						value={formatDateForAPI(selectedDate)}
						onChange={(e) => {
							setSelectedDate(new Date(e.target.value));
						}}
						min={formatDateForAPI(new Date())}
						className='px-3 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700'
					/>
				</div>
			</div>

			<Card className='p-4'>
				<h3 className='font-semibold mb-2'>{formatDate(selectedDate)}</h3>

				{isLoading ? (
					<div className='flex justify-center py-8'>
						<div className='animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500'></div>
					</div>
				) : (
					<div className='space-y-4'>
						{/* Nutrition Summary */}
						<div className='grid grid-cols-4 gap-4 p-3 bg-gray-50 dark:bg-gray-900 rounded-lg'>
							<div>
								<p className='text-sm text-gray-600 dark:text-gray-400'>Calories</p>
								<p className='font-semibold'>{totals.calories.toFixed(0)}</p>
							</div>
							<div>
								<p className='text-sm text-gray-600 dark:text-gray-400'>Protein</p>
								<p className='font-semibold'>{totals.protein.toFixed(1)}g</p>
							</div>
							<div>
								<p className='text-sm text-gray-600 dark:text-gray-400'>Carbs</p>
								<p className='font-semibold'>{totals.carbs.toFixed(1)}g</p>
							</div>
							<div>
								<p className='text-sm text-gray-600 dark:text-gray-400'>Fat</p>
								<p className='font-semibold'>{totals.fat.toFixed(1)}g</p>
							</div>
						</div>

						{/* Meals by Type */}
						{(['breakfast', 'lunch', 'dinner', 'snack'] as const).map((mealType) => (
							<div key={mealType} className='border rounded-lg p-4'>
								<h4 className='font-medium capitalize mb-2'>{mealType}</h4>
								{mealsByType[mealType] !== undefined && mealsByType[mealType].length > 0 ? (
									mealsByType[mealType].map((plan) => (
										<div key={plan.id} className='flex items-center justify-between py-2'>
											<div>
												<p className='font-medium'>{plan.food?.name ?? plan.recipe?.name ?? 'Unknown item'}</p>
												<p className='text-sm text-gray-600 dark:text-gray-400'>
													{plan.amount}g{plan.notes !== undefined && plan.notes !== null && plan.notes !== '' ? ` • ${plan.notes}` : ''}
												</p>
											</div>
											<div className='flex gap-2'>
												<Button size='sm' variant='ghost' onClick={() => void handleCopyToToday(plan)} title="Add to today's tracking">
													📋
												</Button>
												<Button
													size='sm'
													variant='ghost'
													onClick={() => {
														handleRemoveMeal(plan.id);
													}}
												>
													❌
												</Button>
											</div>
										</div>
									))
								) : (
									<p className='text-sm text-gray-500'>No meals planned</p>
								)}
							</div>
						))}

						{/* Add Meal Button/Form */}
						{!showAddMeal ? (
							<Button
								onClick={() => {
									setShowAddMeal(true);
								}}
								className='w-full'
							>
								+ Plan a Meal
							</Button>
						) : (
							<Card className='p-4 space-y-4'>
								<h4 className='font-semibold'>Add Planned Meal</h4>

								<div>
									<label className='block text-sm font-medium mb-1'>Meal Type</label>
									<select
										value={selectedMealType}
										onChange={(e) => {
											setSelectedMealType(e.target.value as any);
										}}
										className='w-full px-3 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700'
									>
										<option value='breakfast'>Breakfast</option>
										<option value='lunch'>Lunch</option>
										<option value='dinner'>Dinner</option>
										<option value='snack'>Snack</option>
									</select>
								</div>

								<div className='flex gap-2'>
									<Button
										size='sm'
										variant={selectedType === 'food' ? 'default' : 'outline'}
										onClick={() => {
											setSelectedType('food');
										}}
									>
										Food
									</Button>
									<Button
										size='sm'
										variant={selectedType === 'recipe' ? 'default' : 'outline'}
										onClick={() => {
											setSelectedType('recipe');
										}}
									>
										Recipe
									</Button>
								</div>

								{selectedType === 'food' ? (
									<select
										value={selectedFoodId}
										onChange={(e) => {
											setSelectedFoodId(e.target.value);
										}}
										className='w-full px-3 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700'
									>
										<option value=''>Select a food...</option>
										{availableFoods.map((food) => (
											<option key={food.id} value={food.id}>
												{food.name} {food.brand !== null && food.brand !== undefined && food.brand !== '' ? `(${food.brand})` : ''}
											</option>
										))}
									</select>
								) : (
									<select
										value={selectedRecipeId}
										onChange={(e) => {
											setSelectedRecipeId(e.target.value);
										}}
										className='w-full px-3 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700'
									>
										<option value=''>Select a recipe...</option>
										{availableRecipes.map((recipe) => (
											<option key={recipe.id} value={recipe.id}>
												{recipe.name}
											</option>
										))}
									</select>
								)}

								<div>
									<label className='block text-sm font-medium mb-1'>Amount (g)</label>
									<input
										type='number'
										value={amount}
										onChange={(e) => {
											setAmount(e.target.value);
										}}
										className='w-full px-3 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700'
										min='1'
									/>
								</div>

								<div>
									<label className='block text-sm font-medium mb-1'>Notes (optional)</label>
									<input
										type='text'
										value={notes}
										onChange={(e) => {
											setNotes(e.target.value);
										}}
										placeholder='e.g., prep night before'
										className='w-full px-3 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700'
									/>
								</div>

								<div className='flex gap-2'>
									<Button onClick={handleAddMeal} disabled={selectedFoodId === '' && selectedRecipeId === ''}>
										Add to Plan
									</Button>
									<Button
										variant='outline'
										onClick={() => {
											setShowAddMeal(false);
										}}
									>
										Cancel
									</Button>
								</div>
							</Card>
						)}
					</div>
				)}
			</Card>

			{isGuest && (
				<div className='p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg'>
					<p className='text-sm text-yellow-800 dark:text-yellow-200'>Your meal plans are saved locally. Sign in to sync them across devices.</p>
				</div>
			)}
		</div>
	);
}
