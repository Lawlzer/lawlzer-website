'use client';

import type { Food } from '@prisma/client';
import { useEffect, useState } from 'react';

import type { RecipeWithDetails } from '../types/recipe.types';

interface RecipeEditorProps {
	recipe: RecipeWithDetails;
	availableFoods: Food[];
	availableRecipes?: RecipeWithDetails[];
	onSave: (recipeData: any) => Promise<void>;
	onCancel: () => void;
}

interface IngredientItem {
	foodId?: string;
	recipeId?: string;
	amount: number;
	unit: string;
}

export function RecipeEditor({ recipe, availableFoods, onSave, onCancel }: RecipeEditorProps) {
	const [name, setName] = useState(recipe.name);
	const [description, setDescription] = useState(recipe.description ?? '');
	const [notes, setNotes] = useState(recipe.notes ?? '');
	const [prepTime, setPrepTime] = useState(recipe.prepTime?.toString() ?? '');
	const [cookTime, setCookTime] = useState(recipe.cookTime?.toString() ?? '');
	const [servings, setServings] = useState(recipe.servings.toString());
	const [visibility, setVisibility] = useState(recipe.visibility);
	const [items, setItems] = useState<IngredientItem[]>([]);
	const [searchTerm, setSearchTerm] = useState('');
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [showVersionWarning, setShowVersionWarning] = useState(true);

	// Initialize items from current version
	useEffect(() => {
		if (recipe.currentVersion) {
			const initialItems = recipe.currentVersion.items.map((item) => ({
				foodId: item.foodId ?? undefined,
				recipeId: item.recipeId ?? undefined,
				amount: item.amount,
				unit: item.unit,
			}));
			setItems(initialItems);
		}
	}, [recipe]);

	const filteredFoods = availableFoods.filter((food) => food.name.toLowerCase().includes(searchTerm.toLowerCase()));

	const addIngredient = (food: Food) => {
		setItems([...items, { foodId: food.id, amount: 100, unit: 'g' }]);
		setSearchTerm('');
	};

	const updateIngredient = (index: number, updates: Partial<IngredientItem>) => {
		const newItems = [...items];
		newItems[index] = { ...newItems[index], ...updates };
		setItems(newItems);
	};

	const removeIngredient = (index: number) => {
		setItems(items.filter((_, i) => i !== index));
	};

	const calculateNutrition = () => {
		let totalCalories = 0;
		let totalProtein = 0;
		let totalCarbs = 0;
		let totalFat = 0;

		items.forEach((item) => {
			const food = availableFoods.find((f) => f.id === item.foodId);
			if (food) {
				const factor = item.amount / 100;
				totalCalories += food.calories * factor;
				totalProtein += food.protein * factor;
				totalCarbs += food.carbs * factor;
				totalFat += food.fat * factor;
			}
		});

		const parsedServings = parseInt(servings);
		const servingCount = Number.isNaN(parsedServings) || parsedServings === 0 ? 1 : parsedServings;
		return {
			totalCalories,
			totalProtein,
			totalCarbs,
			totalFat,
			perServing: {
				calories: totalCalories / servingCount,
				protein: totalProtein / servingCount,
				carbs: totalCarbs / servingCount,
				fat: totalFat / servingCount,
			},
		};
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();

		if (!name.trim() || items.length === 0) {
			return;
		}

		setIsSubmitting(true);
		await onSave({
			id: recipe.id,
			name: name.trim(),
			description: description.trim(),
			notes: notes.trim(),
			prepTime: prepTime || null,
			cookTime: cookTime || null,
			servings: Number.isNaN(parseInt(servings)) ? 1 : parseInt(servings),
			visibility,
			items,
		});
		setIsSubmitting(false);
	};

	const nutrition = calculateNutrition();

	return (
		<div className='space-y-4'>
			<div className='flex items-center justify-between'>
				<h2 className='text-xl font-bold'>Edit Recipe</h2>
				<span className='text-sm text-gray-600 dark:text-gray-400'>
					Version {recipe.currentVersion?.version ?? 1} → Version {(recipe.currentVersion?.version ?? 0) + 1}
				</span>
			</div>

			{showVersionWarning && (
				<div className='rounded-lg border border-blue-500 bg-blue-50 dark:bg-blue-950/20 p-4'>
					<div className='flex items-start justify-between'>
						<div className='flex-1'>
							<h3 className='font-semibold mb-1'>Recipe Versioning Active</h3>
							<p className='text-sm text-gray-600 dark:text-gray-400'>Editing this recipe will create Version {(recipe.currentVersion?.version ?? 0) + 1}. Previous versions are preserved for historical accuracy in your day tracking.</p>
							{recipe.versions.length > 1 && <p className='text-sm text-gray-600 dark:text-gray-400 mt-1'>This recipe has {recipe.versions.length} versions total.</p>}
						</div>
						<button
							type='button'
							onClick={() => {
								setShowVersionWarning(false);
							}}
							className='ml-4 text-gray-500 hover:text-gray-700'
						>
							✕
						</button>
					</div>
				</div>
			)}

			<form onSubmit={(e) => void handleSubmit(e)} className='space-y-4'>
				{/* Basic Info */}
				<div className='grid gap-4 md:grid-cols-2'>
					<div>
						<label className='block text-sm font-medium mb-1'>Recipe Name *</label>
						<input
							type='text'
							value={name}
							onChange={(e) => {
								setName(e.target.value);
							}}
							className='w-full px-3 py-2 border rounded-lg'
							required
						/>
					</div>
					<div>
						<label className='block text-sm font-medium mb-1'>Servings *</label>
						<input
							type='number'
							value={servings}
							onChange={(e) => {
								setServings(e.target.value);
							}}
							className='w-full px-3 py-2 border rounded-lg'
							min='1'
							required
						/>
					</div>
				</div>

				<div>
					<label className='block text-sm font-medium mb-1'>Visibility</label>
					<select
						value={visibility}
						onChange={(e) => {
							setVisibility(e.target.value as 'private' | 'public' | 'unlisted');
						}}
						className='w-full px-3 py-2 border rounded-lg'
					>
						<option value='private'>Private</option>
						<option value='unlisted'>Unlisted</option>
						<option value='public'>Public</option>
					</select>
					<p className='text-xs text-gray-500 mt-1'>{visibility === 'private' ? 'Only you can see this recipe.' : visibility === 'unlisted' ? 'Anyone with the link can see this recipe.' : 'This recipe will appear in public search results.'}</p>
				</div>

				<div>
					<label className='block text-sm font-medium mb-1'>Description</label>
					<textarea
						value={description}
						onChange={(e) => {
							setDescription(e.target.value);
						}}
						className='w-full px-3 py-2 border rounded-lg'
						rows={2}
					/>
				</div>

				<div className='grid gap-4 md:grid-cols-2'>
					<div>
						<label className='block text-sm font-medium mb-1'>Prep Time (minutes)</label>
						<input
							type='number'
							value={prepTime}
							onChange={(e) => {
								setPrepTime(e.target.value);
							}}
							className='w-full px-3 py-2 border rounded-lg'
							min='0'
						/>
					</div>
					<div>
						<label className='block text-sm font-medium mb-1'>Cook Time (minutes)</label>
						<input
							type='number'
							value={cookTime}
							onChange={(e) => {
								setCookTime(e.target.value);
							}}
							className='w-full px-3 py-2 border rounded-lg'
							min='0'
						/>
					</div>
				</div>

				<div>
					<label className='block text-sm font-medium mb-1'>Cooking Instructions</label>
					<textarea
						value={notes}
						onChange={(e) => {
							setNotes(e.target.value);
						}}
						className='w-full px-3 py-2 border rounded-lg'
						rows={3}
						placeholder='Step-by-step cooking instructions...'
					/>
				</div>

				{/* Ingredients */}
				<div>
					<h3 className='font-semibold mb-2'>Ingredients</h3>

					{/* Current Ingredients */}
					{items.length > 0 && (
						<div className='space-y-2 mb-4'>
							{items.map((item, index) => {
								const food = availableFoods.find((f) => f.id === item.foodId);
								return (
									<div key={index} className='flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-900 rounded'>
										<span className='flex-1'>{food?.name ?? 'Unknown'}</span>
										<input
											type='number'
											value={item.amount}
											onChange={(e) => {
												const value = parseFloat(e.target.value);
												updateIngredient(index, { amount: Number.isNaN(value) ? 0 : value });
											}}
											className='w-20 px-2 py-1 border rounded'
											min='0'
											step='0.1'
										/>
										<select
											value={item.unit}
											onChange={(e) => {
												updateIngredient(index, { unit: e.target.value });
											}}
											className='px-2 py-1 border rounded'
										>
											<option value='g'>g</option>
											<option value='kg'>kg</option>
											<option value='mg'>mg</option>
											<option value='ml'>ml</option>
											<option value='l'>L</option>
											<option value='cup'>cup</option>
											<option value='tbsp'>tbsp</option>
											<option value='tsp'>tsp</option>
											<option value='piece'>piece</option>
										</select>
										<button
											type='button'
											onClick={() => {
												removeIngredient(index);
											}}
											className='px-2 py-1 text-red-600 hover:bg-red-100 rounded'
										>
											Remove
										</button>
									</div>
								);
							})}
						</div>
					)}

					{/* Add Ingredient */}
					<div>
						<input
							type='text'
							value={searchTerm}
							onChange={(e) => {
								setSearchTerm(e.target.value);
							}}
							placeholder='Search ingredients...'
							className='w-full px-3 py-2 border rounded-lg'
						/>
						{searchTerm.length > 0 && (
							<div className='mt-2 max-h-40 overflow-y-auto border rounded-lg'>
								{filteredFoods.length > 0 ? (
									filteredFoods.map((food) => (
										<button
											key={food.id}
											type='button'
											onClick={() => {
												addIngredient(food);
											}}
											className='w-full text-left px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-800'
										>
											{food.name}
											{food.brand != null && food.brand !== '' && <span className='text-sm text-gray-600 dark:text-gray-400'> - {food.brand}</span>}
										</button>
									))
								) : (
									<p className='px-3 py-2 text-sm text-gray-600 dark:text-gray-400'>No ingredients found</p>
								)}
							</div>
						)}
					</div>
				</div>

				{/* Nutrition Summary */}
				<div className='rounded-lg border p-4 bg-gray-50 dark:bg-gray-900'>
					<h3 className='font-semibold mb-2'>Nutrition Summary</h3>
					<div className='grid grid-cols-2 md:grid-cols-4 gap-4 text-sm'>
						<div>
							<p className='text-gray-600 dark:text-gray-400'>Calories</p>
							<p className='font-medium'>{nutrition.perServing.calories.toFixed(0)} per serving</p>
							<p className='text-xs text-gray-600 dark:text-gray-400'>{nutrition.totalCalories.toFixed(0)} total</p>
						</div>
						<div>
							<p className='text-gray-600 dark:text-gray-400'>Protein</p>
							<p className='font-medium'>{nutrition.perServing.protein.toFixed(1)}g per serving</p>
							<p className='text-xs text-gray-600 dark:text-gray-400'>{nutrition.totalProtein.toFixed(1)}g total</p>
						</div>
						<div>
							<p className='text-gray-600 dark:text-gray-400'>Carbs</p>
							<p className='font-medium'>{nutrition.perServing.carbs.toFixed(1)}g per serving</p>
							<p className='text-xs text-gray-600 dark:text-gray-400'>{nutrition.totalCarbs.toFixed(1)}g total</p>
						</div>
						<div>
							<p className='text-gray-600 dark:text-gray-400'>Fat</p>
							<p className='font-medium'>{nutrition.perServing.fat.toFixed(1)}g per serving</p>
							<p className='text-xs text-gray-600 dark:text-gray-400'>{nutrition.totalFat.toFixed(1)}g total</p>
						</div>
					</div>
				</div>

				{/* Version History */}
				{recipe.versions.length > 1 && (
					<div className='rounded-lg border p-4'>
						<h3 className='font-semibold mb-2'>Version History</h3>
						<div className='space-y-1 text-sm'>
							{recipe.versions.slice(0, 3).map((version) => (
								<div key={version.id} className='flex justify-between text-gray-600 dark:text-gray-400'>
									<span>Version {version.version}</span>
									<span>{new Date(version.createdAt).toLocaleDateString()}</span>
								</div>
							))}
							{recipe.versions.length > 3 && <p className='text-xs text-gray-500'>And {recipe.versions.length - 3} more versions...</p>}
						</div>
					</div>
				)}

				{/* Actions */}
				<div className='flex justify-end gap-2'>
					<button type='button' onClick={onCancel} className='px-4 py-2 border rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800' disabled={isSubmitting}>
						Cancel
					</button>
					<button type='submit' className='px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50' disabled={isSubmitting || !name.trim() || items.length === 0}>
						{isSubmitting ? 'Saving...' : 'Save New Version'}
					</button>
				</div>
			</form>
		</div>
	);
}
