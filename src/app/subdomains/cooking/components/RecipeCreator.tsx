'use client';

import type { Food } from '@prisma/client';
import { useState } from 'react';

import type { RecipeWithDetails } from '../types/recipe.types';

interface RecipeIngredient {
	foodId?: string;
	recipeId?: string;
	food?: Food;
	recipe?: RecipeWithDetails;
	amount: number;
	unit: string;
}

interface RecipeCreatorProps {
	availableFoods: Food[];
	availableRecipes?: RecipeWithDetails[];
	onSave: (recipe: any) => Promise<void>;
	onCancel: () => void;
}

export const RecipeCreator: React.FC<RecipeCreatorProps> = ({ availableFoods, availableRecipes = [], onSave, onCancel }) => {
	const [recipeName, setRecipeName] = useState('');
	const [description, setDescription] = useState('');
	const [notes, setNotes] = useState('');
	const [prepTime, setPrepTime] = useState('');
	const [cookTime, setCookTime] = useState('');
	const [servings, setServings] = useState('1');
	const [visibility, setVisibility] = useState<'private' | 'public' | 'unlisted'>('private');
	const [isComponent, setIsComponent] = useState(false);
	const [ingredients, setIngredients] = useState<RecipeIngredient[]>([]);
	const [selectedType, setSelectedType] = useState<'food' | 'recipe'>('food');
	const [selectedFoodId, setSelectedFoodId] = useState('');
	const [selectedRecipeId, setSelectedRecipeId] = useState('');
	const [amount, setAmount] = useState('100');
	const [isSaving, setIsSaving] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const addIngredient = () => {
		if (selectedType === 'food' && !selectedFoodId) {
			setError('Please select a food item');
			return;
		}
		if (selectedType === 'recipe' && !selectedRecipeId) {
			setError('Please select a recipe');
			return;
		}

		const parsedAmount = parseFloat(amount);
		if (isNaN(parsedAmount) || parsedAmount <= 0) {
			setError('Please enter a valid amount');
			return;
		}

		if (selectedType === 'food') {
			const food = availableFoods.find((f) => f.id === selectedFoodId);
			if (!food) {
				setError('Invalid food selected');
				return;
			}

			setIngredients([
				...ingredients,
				{
					foodId: selectedFoodId,
					food,
					amount: parsedAmount,
					unit: 'g',
				},
			]);
		} else {
			const recipe = availableRecipes.find((r) => r.id === selectedRecipeId);
			if (!recipe) {
				setError('Invalid recipe selected');
				return;
			}

			// Check for circular reference
			if (recipe.id === recipeName) {
				setError('Cannot add a recipe to itself');
				return;
			}

			setIngredients([
				...ingredients,
				{
					recipeId: selectedRecipeId,
					recipe,
					amount: parsedAmount,
					unit: 'g',
				},
			]);
		}

		// Reset form
		setSelectedFoodId('');
		setSelectedRecipeId('');
		setAmount('100');
		setError(null);
	};

	const removeIngredient = (index: number) => {
		setIngredients(ingredients.filter((_, i) => i !== index));
	};

	const calculateTotalNutrition = () => {
		let totalCalories = 0;
		let totalProtein = 0;
		let totalCarbs = 0;
		let totalFat = 0;

		ingredients.forEach((ing) => {
			if (ing.food) {
				const factor = ing.amount / 100;
				totalCalories += ing.food.calories * factor;
				totalProtein += ing.food.protein * factor;
				totalCarbs += ing.food.carbs * factor;
				totalFat += ing.food.fat * factor;
			} else if (ing.recipe?.currentVersion) {
				// For recipes, use the nutrition from the current version
				const factor = ing.amount / 100;
				totalCalories += (ing.recipe.currentVersion.caloriesPerServing * ing.recipe.servings * factor) / ing.recipe.servings;
				totalProtein += (ing.recipe.currentVersion.proteinPerServing * ing.recipe.servings * factor) / ing.recipe.servings;
				totalCarbs += (ing.recipe.currentVersion.carbsPerServing * ing.recipe.servings * factor) / ing.recipe.servings;
				totalFat += (ing.recipe.currentVersion.fatPerServing * ing.recipe.servings * factor) / ing.recipe.servings;
			}
		});

		const servingsNum = servings !== '' ? parseInt(servings) : 1;
		return {
			total: { calories: totalCalories, protein: totalProtein, carbs: totalCarbs, fat: totalFat },
			perServing: {
				calories: totalCalories / servingsNum,
				protein: totalProtein / servingsNum,
				carbs: totalCarbs / servingsNum,
				fat: totalFat / servingsNum,
			},
		};
	};

	const handleSave = async () => {
		if (recipeName === '' || recipeName.trim() === '') {
			setError('Recipe name is required');
			return;
		}

		if (ingredients.length === 0) {
			setError('Please add at least one ingredient');
			return;
		}

		setIsSaving(true);
		setError(null);

		try {
			await onSave({
				name: recipeName,
				description,
				notes: notes.trim(),
				prepTime: prepTime || null,
				cookTime: cookTime || null,
				servings: Number.isNaN(parseInt(servings)) ? 1 : parseInt(servings),
				visibility,
				isComponent,
				items: ingredients.map((ing) => ({
					foodId: ing.foodId,
					recipeId: ing.recipeId,
					amount: ing.amount,
					unit: ing.unit,
				})),
			});
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Failed to save recipe');
			setIsSaving(false);
		}
	};

	const nutrition = calculateTotalNutrition();

	return (
		<div className='space-y-6'>
			<h2 className='text-2xl font-bold'>Create New Recipe</h2>

			{error !== null && error !== '' && <div className='p-3 rounded-lg bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'>{error}</div>}

			{/* Basic Info */}
			<div className='space-y-4'>
				<div>
					<label className='block text-sm font-medium mb-1'>Recipe Name *</label>
					<input
						type='text'
						value={recipeName}
						onChange={(e) => {
							setRecipeName(e.target.value);
						}}
						className='w-full px-3 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700'
						placeholder='e.g., Chicken Stir Fry'
					/>
				</div>

				<div>
					<label className='block text-sm font-medium mb-1'>Description</label>
					<textarea
						value={description}
						onChange={(e) => {
							setDescription(e.target.value);
						}}
						className='w-full px-3 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700'
						placeholder='Brief description of the recipe'
						rows={2}
					/>
				</div>

				<div className='grid grid-cols-3 gap-4'>
					<div>
						<label className='block text-sm font-medium mb-1'>Prep Time (min)</label>
						<input
							type='number'
							value={prepTime}
							onChange={(e) => {
								setPrepTime(e.target.value);
							}}
							className='w-full px-3 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700'
							placeholder='15'
						/>
					</div>
					<div>
						<label className='block text-sm font-medium mb-1'>Cook Time (min)</label>
						<input
							type='number'
							value={cookTime}
							onChange={(e) => {
								setCookTime(e.target.value);
							}}
							className='w-full px-3 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700'
							placeholder='30'
						/>
					</div>
					<div>
						<label className='block text-sm font-medium mb-1'>Servings</label>
						<input
							type='number'
							value={servings}
							onChange={(e) => {
								setServings(e.target.value);
							}}
							className='w-full px-3 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700'
							min='1'
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
					<label className='flex items-center gap-2'>
						<input
							type='checkbox'
							checked={isComponent}
							onChange={(e) => {
								setIsComponent(e.target.checked);
							}}
							className='rounded'
						/>
						<span className='text-sm font-medium'>Component Recipe</span>
					</label>
					<p className='text-xs text-gray-500 mt-1'>Component recipes (e.g., sauces, doughs) can be used in other recipes but wont show up in the main recipe list.</p>
				</div>
			</div>

			{/* Ingredients */}
			<div>
				<h3 className='text-lg font-semibold mb-3'>Ingredients</h3>

				{ingredients.length > 0 && (
					<div className='space-y-2 mb-4'>
						{ingredients.map((ing, index) => (
							<div key={index} className='flex items-center gap-2 p-2 border rounded-lg dark:border-gray-700'>
								<span className='flex-1'>
									{ing.food ? (
										<>
											<span className='text-xs text-gray-500 dark:text-gray-400'>Food: </span>
											{ing.food.name} - {ing.amount}g
										</>
									) : ing.recipe ? (
										<>
											<span className='text-xs text-gray-500 dark:text-gray-400'>Recipe: </span>
											{ing.recipe.name} - {ing.amount}g
										</>
									) : null}
								</span>
								<button
									onClick={() => {
										removeIngredient(index);
									}}
									className='px-2 py-1 text-red-600 hover:bg-red-100 dark:hover:bg-red-900/20 rounded'
								>
									Remove
								</button>
							</div>
						))}
					</div>
				)}

				<div className='space-y-2'>
					{/* Type selector */}
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
							disabled={availableRecipes.length === 0}
						>
							Recipe
						</button>
					</div>

					{/* Ingredient selector */}
					<div className='flex gap-2'>
						{selectedType === 'food' ? (
							<select
								value={selectedFoodId}
								onChange={(e) => {
									setSelectedFoodId(e.target.value);
								}}
								className='flex-1 px-3 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700'
							>
								<option value=''>Select a food item...</option>
								{availableFoods.map((food) => (
									<option key={food.id} value={food.id}>
										{food.name} {food.brand !== null && food.brand !== '' && `(${food.brand})`}
									</option>
								))}
							</select>
						) : (
							<select
								value={selectedRecipeId}
								onChange={(e) => {
									setSelectedRecipeId(e.target.value);
								}}
								className='flex-1 px-3 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700'
							>
								<option value=''>Select a recipe...</option>
								{availableRecipes.map((recipe) => (
									<option key={recipe.id} value={recipe.id}>
										{recipe.name} {recipe.description != null && recipe.description !== '' && `- ${recipe.description}`}
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
						<button onClick={addIngredient} className='px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors'>
							Add
						</button>
					</div>
				</div>
			</div>

			{/* Cooking Notes */}
			<div>
				<label className='block text-sm font-medium mb-1'>Cooking Instructions</label>
				<textarea
					value={notes}
					onChange={(e) => {
						setNotes(e.target.value);
					}}
					className='w-full px-3 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700'
					placeholder='Step-by-step cooking instructions...'
					rows={4}
				/>
			</div>

			{/* Nutrition Summary */}
			{ingredients.length > 0 && (
				<div className='p-4 bg-gray-100 dark:bg-gray-800 rounded-lg'>
					<h4 className='font-medium mb-2'>Nutrition Summary</h4>
					<div className='grid grid-cols-2 gap-4 text-sm'>
						<div>
							<span className='font-medium'>Total:</span>
							<div>Calories: {nutrition.total.calories.toFixed(0)}</div>
							<div>Protein: {nutrition.total.protein.toFixed(1)}g</div>
							<div>Carbs: {nutrition.total.carbs.toFixed(1)}g</div>
							<div>Fat: {nutrition.total.fat.toFixed(1)}g</div>
						</div>
						<div>
							<span className='font-medium'>Per Serving:</span>
							<div>Calories: {nutrition.perServing.calories.toFixed(0)}</div>
							<div>Protein: {nutrition.perServing.protein.toFixed(1)}g</div>
							<div>Carbs: {nutrition.perServing.carbs.toFixed(1)}g</div>
							<div>Fat: {nutrition.perServing.fat.toFixed(1)}g</div>
						</div>
					</div>
				</div>
			)}

			{/* Actions */}
			<div className='flex justify-end gap-2'>
				<button onClick={onCancel} className='px-4 py-2 border rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors' disabled={isSaving}>
					Cancel
				</button>
				<button onClick={() => void handleSave()} className='px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50' disabled={isSaving}>
					{isSaving ? 'Saving...' : 'Save Recipe'}
				</button>
			</div>
		</div>
	);
};
