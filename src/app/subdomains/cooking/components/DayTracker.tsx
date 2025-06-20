'use client';

import type { Food } from '@prisma/client';
import React, { useEffect, useState } from 'react';

import type { RecipeWithDetails } from '../types/recipe.types';

interface DayEntry {
	id: string;
	foodId?: string;
	recipeId?: string;
	food?: Food;
	recipe?: RecipeWithDetails;
	amount: number;
	mealType: 'breakfast' | 'dinner' | 'lunch' | 'snack';
	calories: number;
	protein: number;
	carbs: number;
	fat: number;
	fiber: number;
	sugar: number;
	sodium: number;
}

interface DayData {
	id: string;
	date: string;
	targetCalories?: number;
	targetProtein?: number;
	targetCarbs?: number;
	targetFat?: number;
	targetFiber?: number;
	entries: DayEntry[];
}

interface DayTrackerProps {
	isGuest?: boolean;
	availableFoods?: Food[];
	availableRecipes?: RecipeWithDetails[];
}

export const DayTracker: React.FC<DayTrackerProps> = ({ isGuest = false, availableFoods = [], availableRecipes = [] }) => {
	const [selectedDate, setSelectedDate] = useState(new Date());
	const [dayData, setDayData] = useState<DayData | null>(null);
	const [isLoading, setIsLoading] = useState(false);
	const [showAddEntry, setShowAddEntry] = useState(false);
	const [selectedMealType, setSelectedMealType] = useState<'breakfast' | 'dinner' | 'lunch' | 'snack'>('breakfast');
	const [selectedType, setSelectedType] = useState<'food' | 'recipe'>('food');
	const [selectedFoodId, setSelectedFoodId] = useState('');
	const [selectedRecipeId, setSelectedRecipeId] = useState('');
	const [amount, setAmount] = useState('100');
	const [isSaving, setIsSaving] = useState(false);

	// Format date for API and display
	const formatDateForAPI = (date: Date) => {
		const year = date.getFullYear();
		const month = String(date.getMonth() + 1).padStart(2, '0');
		const day = String(date.getDate()).padStart(2, '0');
		return `${year}-${month}-${day}`;
	};

	// Fetch day data when date changes
	useEffect(() => {
		const fetchDayData = async () => {
			if (isGuest) {
				// For guest users, use local storage
				const dateStr = formatDateForAPI(selectedDate);
				const storedData = localStorage.getItem(`day_${dateStr}`);
				if (storedData !== null && storedData !== '') {
					setDayData(JSON.parse(storedData) as DayData);
				} else {
					setDayData({
						id: dateStr,
						date: dateStr,
						targetCalories: 2000,
						targetProtein: 50,
						targetCarbs: 250,
						targetFat: 65,
						targetFiber: 25,
						entries: [],
					});
				}
			} else {
				// For logged-in users, fetch from API
				setIsLoading(true);
				try {
					const response = await fetch(`/api/cooking/days?date=${formatDateForAPI(selectedDate)}`);
					if (response.ok) {
						const data = await response.json();
						setDayData(data);
					} else {
						// Create default day data
						setDayData({
							id: '',
							date: formatDateForAPI(selectedDate),
							targetCalories: 2000,
							targetProtein: 50,
							targetCarbs: 250,
							targetFat: 65,
							targetFiber: 25,
							entries: [],
						});
					}
				} catch (error) {
					console.error('Error fetching day data:', error);
				} finally {
					setIsLoading(false);
				}
			}
		};

		void fetchDayData();
	}, [selectedDate, isGuest]);

	// Calculate total nutrition for the day
	const calculateDayTotals = () => {
		if (!dayData) return { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0, sugar: 0, sodium: 0 };

		return dayData.entries.reduce(
			(totals, entry) => ({
				calories: totals.calories + entry.calories,
				protein: totals.protein + entry.protein,
				carbs: totals.carbs + entry.carbs,
				fat: totals.fat + entry.fat,
				fiber: totals.fiber + entry.fiber,
				sugar: totals.sugar + entry.sugar,
				sodium: totals.sodium + entry.sodium,
			}),
			{ calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0, sugar: 0, sodium: 0 }
		);
	};

	// Add entry to the day
	const handleAddEntry = async () => {
		if (!dayData) return;

		const parsedAmount = parseFloat(amount);
		if (isNaN(parsedAmount) || parsedAmount <= 0) {
			alert('Please enter a valid amount');
			return;
		}

		setIsSaving(true);

		let entry: DayEntry;
		if (selectedType === 'food') {
			const food = availableFoods.find((f) => f.id === selectedFoodId);
			if (!food) {
				alert('Please select a food');
				setIsSaving(false);
				return;
			}

			const factor = parsedAmount / 100;
			entry = {
				id: crypto.randomUUID(),
				foodId: food.id,
				food,
				amount: parsedAmount,
				mealType: selectedMealType,
				calories: food.calories * factor,
				protein: food.protein * factor,
				carbs: food.carbs * factor,
				fat: food.fat * factor,
				fiber: food.fiber * factor,
				sugar: food.sugar * factor,
				sodium: food.sodium * factor,
			};
		} else {
			const recipe = availableRecipes.find((r) => r.id === selectedRecipeId);
			if (!recipe?.currentVersion) {
				alert('Please select a recipe');
				setIsSaving(false);
				return;
			}

			const factor = parsedAmount / 100;
			entry = {
				id: crypto.randomUUID(),
				recipeId: recipe.id,
				recipe,
				amount: parsedAmount,
				mealType: selectedMealType,
				calories: recipe.currentVersion.caloriesPerServing * recipe.servings * factor,
				protein: recipe.currentVersion.proteinPerServing * recipe.servings * factor,
				carbs: recipe.currentVersion.carbsPerServing * recipe.servings * factor,
				fat: recipe.currentVersion.fatPerServing * recipe.servings * factor,
				fiber: recipe.currentVersion.fiberPerServing * recipe.servings * factor,
				sugar: recipe.currentVersion.sugarPerServing * recipe.servings * factor,
				sodium: recipe.currentVersion.sodiumPerServing * recipe.servings * factor,
			};
		}

		const updatedDayData = {
			...dayData,
			entries: [...dayData.entries, entry],
		};

		if (isGuest) {
			// Save to local storage
			localStorage.setItem(`day_${dayData.date}`, JSON.stringify(updatedDayData));
			setDayData(updatedDayData);
		} else {
			// Save to API
			try {
				const response = await fetch('/api/cooking/days/entries', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({
						date: dayData.date,
						entry,
					}),
				});

				if (response.ok) {
					setDayData(updatedDayData);
				}
			} catch (error) {
				console.error('Error saving entry:', error);
			}
		}

		// Reset form
		setSelectedFoodId('');
		setSelectedRecipeId('');
		setAmount('100');
		setShowAddEntry(false);
		setIsSaving(false);
	};

	// Remove entry
	const handleRemoveEntry = async (entryId: string) => {
		if (!dayData) return;

		const updatedDayData = {
			...dayData,
			entries: dayData.entries.filter((e) => e.id !== entryId),
		};

		if (isGuest) {
			localStorage.setItem(`day_${dayData.date}`, JSON.stringify(updatedDayData));
			setDayData(updatedDayData);
		} else {
			// Delete from API
			try {
				const response = await fetch(`/api/cooking/days/entries/${entryId}`, {
					method: 'DELETE',
				});

				if (response.ok) {
					setDayData(updatedDayData);
				}
			} catch (error) {
				console.error('Error removing entry:', error);
			}
		}
	};

	const totals = calculateDayTotals();

	// Group entries by meal type
	const entriesByMeal =
		dayData?.entries.reduce(
			(acc, entry) => {
				if (acc[entry.mealType] == null) acc[entry.mealType] = [];
				acc[entry.mealType].push(entry);
				return acc;
			},
			{} as Record<string, DayEntry[]>
		) || {};

	return (
		<div className='space-y-6'>
			<div className='flex items-center justify-between'>
				<h2 className='text-2xl font-bold'>Day Tracking</h2>
				<div className='flex items-center gap-2'>
					<button
						onClick={() => {
							const newDate = new Date(selectedDate);
							newDate.setDate(newDate.getDate() - 1);
							setSelectedDate(newDate);
						}}
						className='p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded'
					>
						<svg className='w-5 h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
							<path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M15 19l-7-7 7-7' />
						</svg>
					</button>
					<input
						type='date'
						value={formatDateForAPI(selectedDate)}
						onChange={(e) => {
							setSelectedDate(new Date(e.target.value));
						}}
						className='px-3 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700'
					/>
					<button
						onClick={() => {
							const newDate = new Date(selectedDate);
							newDate.setDate(newDate.getDate() + 1);
							setSelectedDate(newDate);
						}}
						className='p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded'
					>
						<svg className='w-5 h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
							<path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M9 5l7 7-7 7' />
						</svg>
					</button>
				</div>
			</div>

			{isLoading ? (
				<div className='flex justify-center py-8'>
					<div className='animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500'></div>
				</div>
			) : (
				<>
					{/* Daily Summary */}
					<div className='grid grid-cols-2 md:grid-cols-4 gap-4'>
						<div className='rounded-lg border p-4'>
							<h3 className='text-sm font-medium text-gray-600 dark:text-gray-400'>Calories</h3>
							<p className='text-2xl font-bold'>{totals.calories.toFixed(0)}</p>
							{dayData?.targetCalories !== undefined && dayData.targetCalories > 0 && (
								<p className='text-sm text-gray-500'>
									of {dayData.targetCalories} ({((totals.calories / dayData.targetCalories) * 100).toFixed(0)}%)
								</p>
							)}
						</div>
						<div className='rounded-lg border p-4'>
							<h3 className='text-sm font-medium text-gray-600 dark:text-gray-400'>Protein</h3>
							<p className='text-2xl font-bold'>{totals.protein.toFixed(1)}g</p>
							{dayData?.targetProtein !== undefined && dayData.targetProtein > 0 && (
								<p className='text-sm text-gray-500'>
									of {dayData.targetProtein}g ({((totals.protein / dayData.targetProtein) * 100).toFixed(0)}%)
								</p>
							)}
						</div>
						<div className='rounded-lg border p-4'>
							<h3 className='text-sm font-medium text-gray-600 dark:text-gray-400'>Carbs</h3>
							<p className='text-2xl font-bold'>{totals.carbs.toFixed(1)}g</p>
							{dayData?.targetCarbs !== undefined && dayData.targetCarbs > 0 && (
								<p className='text-sm text-gray-500'>
									of {dayData.targetCarbs}g ({((totals.carbs / dayData.targetCarbs) * 100).toFixed(0)}%)
								</p>
							)}
						</div>
						<div className='rounded-lg border p-4'>
							<h3 className='text-sm font-medium text-gray-600 dark:text-gray-400'>Fat</h3>
							<p className='text-2xl font-bold'>{totals.fat.toFixed(1)}g</p>
							{dayData?.targetFat !== undefined && dayData.targetFat > 0 && (
								<p className='text-sm text-gray-500'>
									of {dayData.targetFat}g ({((totals.fat / dayData.targetFat) * 100).toFixed(0)}%)
								</p>
							)}
						</div>
					</div>

					{/* Meal Entries */}
					<div className='space-y-4'>
						{(['breakfast', 'lunch', 'dinner', 'snack'] as const).map((mealType) => (
							<div key={mealType} className='rounded-lg border p-4'>
								<h3 className='font-semibold mb-3 capitalize'>{mealType}</h3>
								{entriesByMeal[mealType] != null && entriesByMeal[mealType].length > 0 ? (
									<div className='space-y-2'>
										{entriesByMeal[mealType].map((entry) => (
											<div key={entry.id} className='flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-900 rounded'>
												<div className='flex-1'>
													<span className='font-medium'>{entry.food?.name || entry.recipe?.name}</span>
													<span className='text-sm text-gray-600 dark:text-gray-400 ml-2'>{entry.amount}g</span>
												</div>
												<div className='flex items-center gap-4'>
													<span className='text-sm text-gray-600 dark:text-gray-400'>{entry.calories.toFixed(0)} cal</span>
													<button onClick={() => void handleRemoveEntry(entry.id)} className='text-red-600 hover:bg-red-100 dark:hover:bg-red-900/20 p-1 rounded'>
														<svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
															<path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M6 18L18 6M6 6l12 12' />
														</svg>
													</button>
												</div>
											</div>
										))}
									</div>
								) : (
									<p className='text-sm text-gray-500'>No entries yet</p>
								)}
							</div>
						))}
					</div>

					{/* Add Entry */}
					{!showAddEntry ? (
						<button
							onClick={() => {
								setShowAddEntry(true);
							}}
							className='w-full px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors'
						>
							Add Food/Recipe
						</button>
					) : (
						<div className='rounded-lg border p-4 space-y-4'>
							<h3 className='font-semibold'>Add Entry</h3>

							{/* Meal Type */}
							<div>
								<label className='block text-sm font-medium mb-1'>Meal</label>
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

							{/* Type Selection */}
							<div className='flex gap-2'>
								<button
									onClick={() => {
										setSelectedType('food');
									}}
									className={`px-3 py-1 rounded ${selectedType === 'food' ? 'bg-blue-500 text-white' : 'bg-gray-200 dark:bg-gray-700'}`}
								>
									Food
								</button>
								<button
									onClick={() => {
										setSelectedType('recipe');
									}}
									className={`px-3 py-1 rounded ${selectedType === 'recipe' ? 'bg-blue-500 text-white' : 'bg-gray-200 dark:bg-gray-700'}`}
									disabled={!availableRecipes || availableRecipes.length === 0}
								>
									Recipe
								</button>
							</div>

							{/* Item Selection */}
							<div className='flex gap-2'>
								{selectedType === 'food' ? (
									<select
										value={selectedFoodId}
										onChange={(e) => {
											setSelectedFoodId(e.target.value);
										}}
										className='flex-1 px-3 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700'
									>
										<option value=''>Select a food...</option>
										{availableFoods.map((food) => (
											<option key={food.id} value={food.id}>
												{food.name} {food.brand && `(${food.brand})`}
											</option>
										))}
									</select>
								) : (
									<select
										value={selectedRecipeId ?? ''}
										onChange={(e) => {
											setSelectedRecipeId(e.target.value);
										}}
										className='flex-1 px-3 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700'
									>
										<option value=''>Select a recipe...</option>
										{availableRecipes.map((recipe) => (
											<option key={recipe.id} value={recipe.id}>
												{recipe.name}
											</option>
										))}
									</select>
								)}
								<input
									type='number'
									value={amount}
									onChange={(e) => {
										setAmount(e.target.value);
									}}
									className='w-24 px-3 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700'
									placeholder='100'
									min='1'
								/>
								<span className='px-3 py-2'>g</span>
							</div>

							{/* Actions */}
							<div className='flex gap-2'>
								<button onClick={() => void handleAddEntry()} className='px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50' disabled={isSaving}>
									{isSaving ? 'Saving...' : 'Add'}
								</button>
								<button
									onClick={() => {
										setShowAddEntry(false);
									}}
									className='px-4 py-2 border rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors'
								>
									Cancel
								</button>
							</div>
						</div>
					)}
				</>
			)}
		</div>
	);
};
