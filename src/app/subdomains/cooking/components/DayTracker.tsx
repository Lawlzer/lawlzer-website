'use client';

import { useCallback, useEffect, useState } from 'react';

// Define types locally since Prisma types are not available
interface Food {
	id: string;
	name: string;
	brand?: string | null;
	calories: number;
	protein: number;
	carbs: number;
	fat: number;
	fiber: number;
	sugar: number;
	sodium: number;
}

interface Recipe {
	id: string;
	name: string;
}

interface RecipeVersion {
	id: string;
	servings: number;
	caloriesPerServing: number;
	proteinPerServing: number;
	carbsPerServing: number;
	fatPerServing: number;
	fiberPerServing: number;
	sugarPerServing: number;
	sodiumPerServing: number;
	recipe: Recipe;
}

interface DayEntry {
	id: string;
	amount: number;
	mealType?: string | null;
	calories: number;
	protein: number;
	carbs: number;
	fat: number;
	fiber: number;
	food?: Food | null;
	recipeVersion?: RecipeVersion | null;
}

interface Day {
	id: string;
	date: string;
	targetCalories?: number | null;
	targetProtein?: number | null;
	targetCarbs?: number | null;
	targetFat?: number | null;
	targetFiber?: number | null;
	notes?: string | null;
	entries: DayEntry[];
}

interface DayTrackerProps {
	user: any;
}

export const DayTracker: React.FC<DayTrackerProps> = ({ user }) => {
	const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
	const [currentDay, setCurrentDay] = useState<Day | null>(null);
	const [loading, setLoading] = useState(false);
	const [isAddingFood, setIsAddingFood] = useState(false);
	const [availableFoods, setAvailableFoods] = useState<Food[]>([]);
	const [selectedFoodId, setSelectedFoodId] = useState('');
	const [amount, setAmount] = useState(100);
	const [mealType, setMealType] = useState('');

	const fetchDayData = useCallback(async () => {
		setLoading(true);
		try {
			const response = await fetch(`/api/cooking/days?date=${selectedDate}`);
			const data = await response.json();
			setCurrentDay(data.day);
		} catch (error) {
			console.error('Error fetching day data:', error);
		} finally {
			setLoading(false);
		}
	}, [selectedDate]);

	const fetchAvailableFoods = useCallback(async () => {
		try {
			const [foodsResponse] = await Promise.all([
				fetch('/api/cooking/foods'),
				// fetch('/api/cooking/recipes') // Removed for now as we're not handling recipes yet
			]);
			const foods = await foodsResponse.json();
			setAvailableFoods(foods);
		} catch (error) {
			console.error('Error fetching foods:', error);
		}
	}, []);

	// Fetch day data when date changes
	useEffect(() => {
		if (!user) return;
		void fetchDayData();
	}, [selectedDate, user, fetchDayData]);

	// Fetch available foods
	useEffect(() => {
		if (!user) return;
		void fetchAvailableFoods();
	}, [user, fetchAvailableFoods]);

	const handleAddEntry = async () => {
		if (!selectedFoodId || amount <= 0) return;

		try {
			const entries = currentDay?.entries ?? [];
			const newEntries = [
				...entries.map((e) => ({
					foodId: e.food?.id,
					recipeVersionId: e.recipeVersion?.id,
					amount: e.amount,
					mealType: e.mealType,
				})),
				{
					foodId: selectedFoodId,
					amount,
					mealType: mealType || undefined,
				},
			];

			const response = await fetch('/api/cooking/days', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					date: selectedDate,
					entries: newEntries,
				}),
			});

			if (response.ok) {
				const data = await response.json();
				setCurrentDay(data.day);
				setIsAddingFood(false);
				setSelectedFoodId('');
				setAmount(100);
				setMealType('');
			}
		} catch (error) {
			console.error('Error adding entry:', error);
		}
	};

	const handleRemoveEntry = async (entryId: string) => {
		if (!currentDay) return;

		const newEntries = currentDay.entries
			.filter((e) => e.id !== entryId)
			.map((e) => ({
				foodId: e.food?.id,
				recipeVersionId: e.recipeVersion?.id,
				amount: e.amount,
				mealType: e.mealType,
			}));

		try {
			const response = await fetch('/api/cooking/days', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					date: selectedDate,
					entries: newEntries,
				}),
			});

			if (response.ok) {
				const data = await response.json();
				setCurrentDay(data.day);
			}
		} catch (error) {
			console.error('Error removing entry:', error);
		}
	};

	const calculateTotals = () => {
		if (!currentDay?.entries) return { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 };

		return currentDay.entries.reduce(
			(totals, entry) => ({
				calories: totals.calories + entry.calories,
				protein: totals.protein + entry.protein,
				carbs: totals.carbs + entry.carbs,
				fat: totals.fat + entry.fat,
				fiber: totals.fiber + entry.fiber,
			}),
			{ calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 }
		);
	};

	const totals = calculateTotals();

	if (!user) {
		return (
			<div className='p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800'>
				<p className='text-yellow-800 dark:text-yellow-200'>Please log in to track your daily nutrition</p>
			</div>
		);
	}

	return (
		<div className='space-y-6'>
			{/* Date Selector */}
			<div className='flex items-center justify-between'>
				<input
					type='date'
					value={selectedDate}
					onChange={(e) => {
						setSelectedDate(e.target.value);
					}}
					className='px-4 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700'
				/>
				<button
					onClick={() => {
						setIsAddingFood(true);
					}}
					className='px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors'
				>
					Add Food
				</button>
			</div>

			{/* Daily Summary */}
			<div className='grid grid-cols-2 md:grid-cols-5 gap-4'>
				<div className='bg-white dark:bg-gray-800 p-4 rounded-lg border'>
					<p className='text-sm text-gray-600 dark:text-gray-400'>Calories</p>
					<p className='text-2xl font-bold'>{Math.round(totals.calories)}</p>
					{currentDay?.targetCalories !== null && currentDay?.targetCalories !== undefined && currentDay?.targetCalories > 0 && <p className='text-xs text-gray-500'>of {currentDay.targetCalories}</p>}
				</div>
				<div className='bg-white dark:bg-gray-800 p-4 rounded-lg border'>
					<p className='text-sm text-gray-600 dark:text-gray-400'>Protein</p>
					<p className='text-2xl font-bold'>{Math.round(totals.protein)}g</p>
					{currentDay?.targetProtein !== null && currentDay?.targetProtein !== undefined && currentDay?.targetProtein > 0 && <p className='text-xs text-gray-500'>of {currentDay.targetProtein}g</p>}
				</div>
				<div className='bg-white dark:bg-gray-800 p-4 rounded-lg border'>
					<p className='text-sm text-gray-600 dark:text-gray-400'>Carbs</p>
					<p className='text-2xl font-bold'>{Math.round(totals.carbs)}g</p>
					{currentDay?.targetCarbs !== null && currentDay?.targetCarbs !== undefined && currentDay?.targetCarbs > 0 && <p className='text-xs text-gray-500'>of {currentDay.targetCarbs}g</p>}
				</div>
				<div className='bg-white dark:bg-gray-800 p-4 rounded-lg border'>
					<p className='text-sm text-gray-600 dark:text-gray-400'>Fat</p>
					<p className='text-2xl font-bold'>{Math.round(totals.fat)}g</p>
					{currentDay?.targetFat !== null && currentDay?.targetFat !== undefined && currentDay?.targetFat > 0 && <p className='text-xs text-gray-500'>of {currentDay.targetFat}g</p>}
				</div>
				<div className='bg-white dark:bg-gray-800 p-4 rounded-lg border'>
					<p className='text-sm text-gray-600 dark:text-gray-400'>Fiber</p>
					<p className='text-2xl font-bold'>{Math.round(totals.fiber)}g</p>
					{currentDay?.targetFiber !== null && currentDay?.targetFiber !== undefined && currentDay?.targetFiber > 0 && <p className='text-xs text-gray-500'>of {currentDay.targetFiber}g</p>}
				</div>
			</div>

			{/* Food Entries */}
			<div className='space-y-4'>
				<h3 className='text-lg font-semibold'>Food Entries</h3>
				{loading ? (
					<p className='text-gray-500'>Loading...</p>
				) : currentDay?.entries.length === 0 ? (
					<p className='text-gray-500'>No entries for this day</p>
				) : (
					<div className='space-y-2'>
						{currentDay?.entries.map((entry) => (
							<div key={entry.id} className='flex items-center justify-between bg-white dark:bg-gray-800 p-4 rounded-lg border'>
								<div className='flex-1'>
									<p className='font-medium'>{entry.food?.name ?? entry.recipeVersion?.recipe.name}</p>
									<p className='text-sm text-gray-600 dark:text-gray-400'>
										{entry.amount}g {entry.mealType !== null && entry.mealType !== undefined && entry.mealType !== '' && `• ${entry.mealType}`}
									</p>
								</div>
								<div className='flex items-center gap-4'>
									<div className='text-right'>
										<p className='text-sm'>{Math.round(entry.calories)} cal</p>
										<p className='text-xs text-gray-600 dark:text-gray-400'>
											P: {Math.round(entry.protein)}g | C: {Math.round(entry.carbs)}g | F: {Math.round(entry.fat)}g
										</p>
									</div>
									<button onClick={() => void handleRemoveEntry(entry.id)} className='text-red-500 hover:text-red-600'>
										✕
									</button>
								</div>
							</div>
						))}
					</div>
				)}
			</div>

			{/* Add Food Modal */}
			{isAddingFood && (
				<div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50'>
					<div className='bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full'>
						<h3 className='text-lg font-semibold mb-4'>Add Food Entry</h3>

						<div className='space-y-4'>
							<div>
								<label className='block text-sm font-medium mb-1'>Food</label>
								<select
									value={selectedFoodId}
									onChange={(e) => {
										setSelectedFoodId(e.target.value);
									}}
									className='w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600'
								>
									<option value=''>Select a food</option>
									{availableFoods.map((food) => (
										<option key={food.id} value={food.id}>
											{food.name} {food.brand !== null && food.brand !== undefined && food.brand !== '' && `(${food.brand})`}
										</option>
									))}
								</select>
							</div>

							<div>
								<label className='block text-sm font-medium mb-1'>Amount (g)</label>
								<input
									type='number'
									value={amount}
									onChange={(e) => {
										setAmount(Number(e.target.value));
									}}
									className='w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600'
									min='1'
								/>
							</div>

							<div>
								<label className='block text-sm font-medium mb-1'>Meal Type (optional)</label>
								<select
									value={mealType}
									onChange={(e) => {
										setMealType(e.target.value);
									}}
									className='w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600'
								>
									<option value=''>Select meal type</option>
									<option value='breakfast'>Breakfast</option>
									<option value='lunch'>Lunch</option>
									<option value='dinner'>Dinner</option>
									<option value='snack'>Snack</option>
								</select>
							</div>
						</div>

						<div className='flex gap-3 mt-6'>
							<button onClick={() => void handleAddEntry()} disabled={!selectedFoodId || amount <= 0} className='flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-400 transition-colors'>
								Add Entry
							</button>
							<button
								onClick={() => {
									setIsAddingFood(false);
									setSelectedFoodId('');
									setAmount(100);
									setMealType('');
								}}
								className='flex-1 px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors'
							>
								Cancel
							</button>
						</div>
					</div>
				</div>
			)}
		</div>
	);
};
