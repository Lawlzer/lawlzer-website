/* eslint-disable @typescript-eslint/strict-boolean-expressions */
'use client';

import type { Food } from '@prisma/client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useSpeechRecognition, useSpeechSynthesis } from 'react-speech-kit';

import { convertUnit } from '../utils/recipe.utils';

import type { IngredientUnit, RecipeWithDetails } from '@/app/subdomains/cooking/types/recipe.types';

interface CookingModeProps {
	recipes: RecipeWithDetails[];
	isGuest: boolean;
}

interface ScaledIngredient {
	name: string;
	originalQuantity: number;
	originalUnit: string;
	scaledQuantity: number;
	scaledUnit: string;
	isRecipe: boolean;
	nutrition: {
		calories: number;
		protein: number;
		carbs: number;
		fat: number;
	};
}

interface NutritionData {
	calories: number;
	protein: number;
	carbs: number;
	fat: number;
}

// Type guard to check if ingredient is a Food
function isFood(ingredient: Food | RecipeWithDetails): ingredient is Food {
	return 'calories' in ingredient;
}

// Helper to get nutrition from ingredient (food or recipe)
function getNutrition(ingredient: Food | RecipeWithDetails): NutritionData {
	if (isFood(ingredient)) {
		return {
			calories: ingredient.calories,
			protein: ingredient.protein,
			carbs: ingredient.carbs,
			fat: ingredient.fat,
		};
	}

	// For recipes, calculate from their ingredients
	if (!ingredient.currentVersion) {
		return { calories: 0, protein: 0, carbs: 0, fat: 0 };
	}

	const totals: NutritionData = ingredient.currentVersion.items.reduce<NutritionData>(
		(acc, ing) => {
			if (!ing.food && !ing.recipe) return acc;
			const ingNutrition: NutritionData = getNutrition(ing.food ?? ing.recipe!);
			const multiplier = ing.amount / 100; // Assuming per 100g

			return {
				calories: acc.calories + ingNutrition.calories * multiplier,
				protein: acc.protein + ingNutrition.protein * multiplier,
				carbs: acc.carbs + ingNutrition.carbs * multiplier,
				fat: acc.fat + ingNutrition.fat * multiplier,
			};
		},
		{ calories: 0, protein: 0, carbs: 0, fat: 0 }
	);

	// Return per serving
	return {
		calories: totals.calories / ingredient.servings,
		protein: totals.protein / ingredient.servings,
		carbs: totals.carbs / ingredient.servings,
		fat: totals.fat / ingredient.servings,
	};
}

export function CookingMode({ recipes, isGuest }: CookingModeProps) {
	const [selectedRecipeId, setSelectedRecipeId] = useState<string | null>(null);
	const [_currentStep, setCurrentStep] = useState(0);
	const [_servings, _setServings] = useState(1);
	const [isHandsFree, setIsHandsFree] = useState(false);
	const handsFreeContainerRef = useRef<HTMLDivElement>(null);
	const [isVoiceActive, setIsVoiceActive] = useState(false);

	const selectedRecipe = recipes.find((r) => r.id === selectedRecipeId);
	const steps = selectedRecipe?.notes?.split('\n').filter((s) => s.trim() !== '') ?? [];

	const [targetWeight, setTargetWeight] = useState<number>(0);
	const [targetUnit, setTargetUnit] = useState<string>('g');
	const [scaleFactor, setScaleFactor] = useState<number>(1);
	const [scaledIngredients, setScaledIngredients] = useState<ScaledIngredient[]>([]);
	const [mode, setMode] = useState<'servings' | 'weight'>('servings');
	const [targetServings, setTargetServings] = useState<number>(1);

	const prevStep = () => {
		setCurrentStep((prev) => (prev > 0 ? prev - 1 : 0));
	};

	const nextStep = () => {
		setCurrentStep((prev) => (prev < steps.length - 1 ? prev + 1 : prev));
	};

	const calculateTotalWeight = useCallback(
		(recipe?: RecipeWithDetails) => {
			const recipeToCalculate = recipe || selectedRecipe;
			if (!recipeToCalculate?.currentVersion) return 0;

			let totalWeight = 0;
			recipeToCalculate.currentVersion.items.forEach((ing) => {
				// Convert all units to grams for a consistent total weight calculation
				let weightInGrams = 0;
				try {
					weightInGrams = convertUnit(ing.amount, (ing.unit || 'g') as IngredientUnit, 'g');
				} catch (error) {
					console.error(`Failed to convert ${ing.amount} ${ing.unit} to grams for total weight calculation.`, error);
					// Fallback to the original amount if conversion fails, assuming it might be in grams.
					weightInGrams = ing.amount;
				}
				totalWeight += weightInGrams;
			});

			return totalWeight;
		},
		[selectedRecipe]
	);

	// Update calculations when recipe or target changes
	useEffect(() => {
		if (!selectedRecipe?.currentVersion) return;

		let newScaleFactor = 1;

		if (mode === 'servings') {
			newScaleFactor = targetServings / selectedRecipe.servings;
		} else if (mode === 'weight' && targetWeight > 0) {
			const originalTotalWeight = calculateTotalWeight();

			// Convert target weight to grams using the utility function
			const targetWeightInGrams = targetUnit === 'g' ? targetWeight : convertUnit(targetWeight, targetUnit, 'g');

			newScaleFactor = targetWeightInGrams / originalTotalWeight;
		}

		setScaleFactor(newScaleFactor);

		// Calculate scaled ingredients
		const scaled: ScaledIngredient[] = selectedRecipe.currentVersion.items.map((ing) => {
			const ingredient = ing.food ?? ing.recipe!;
			const scaledQuantity = ing.amount * newScaleFactor;

			// Calculate nutrition for the scaled amount
			// Convert to grams for nutrition calculation (nutrition is per 100g)
			const scaledQuantityInGrams = ing.unit === 'g' ? scaledQuantity : convertUnit(scaledQuantity, ing.unit as IngredientUnit, 'g');
			const nutritionMultiplier = scaledQuantityInGrams / 100;

			const baseNutrition = getNutrition(ingredient);

			return {
				name: ingredient.name,
				originalQuantity: ing.amount,
				originalUnit: ing.unit,
				scaledQuantity: scaledQuantity,
				scaledUnit: ing.unit,
				isRecipe: !!ing.recipeId,
				nutrition: {
					calories: baseNutrition.calories * nutritionMultiplier,
					protein: baseNutrition.protein * nutritionMultiplier,
					carbs: baseNutrition.carbs * nutritionMultiplier,
					fat: baseNutrition.fat * nutritionMultiplier,
				},
			};
		});

		setScaledIngredients(scaled);
	}, [selectedRecipe, targetWeight, targetUnit, targetServings, mode, calculateTotalWeight]);

	// Calculate totals for scaled recipe
	const calculateTotals = (): NutritionData =>
		scaledIngredients.reduce<NutritionData>(
			(acc, ing) => ({
				calories: acc.calories + ing.nutrition.calories,
				protein: acc.protein + ing.nutrition.protein,
				carbs: acc.carbs + ing.nutrition.carbs,
				fat: acc.fat + ing.nutrition.fat,
			}),
			{ calories: 0, protein: 0, carbs: 0, fat: 0 }
		);

	const toggleHandsFree = async () => {
		if (!isHandsFree) {
			try {
				if (handsFreeContainerRef.current) {
					await handsFreeContainerRef.current.requestFullscreen();
				}
				await navigator.wakeLock.request('screen');
				setIsHandsFree(true);
			} catch (err) {
				console.error('Failed to enter hands-free mode:', err);
			}
		} else {
			try {
				if (document.fullscreenElement) {
					await document.exitFullscreen();
				}
				// The wake lock is released automatically when the document becomes inactive.
			} catch (err) {
				console.error('Failed to exit hands-free mode:', err);
			}
			setIsHandsFree(false);
		}
	};

	// Initialize speech synthesis without onEnd first
	const { speak } = useSpeechSynthesis({});

	// Then use it in useSpeechRecognition
	const { listen, listening, stop } = useSpeechRecognition({
		onResult: (result: string) => {
			const command = result.toLowerCase();
			if (command.includes('next')) {
				nextStep();
				speak({ text: `Next step: ${steps[_currentStep + 1]}` });
			} else if (command.includes('previous')) {
				prevStep();
				speak({ text: `Previous step: ${steps[_currentStep - 1]}` });
			} else if (command.includes('repeat')) {
				speak({ text: steps[_currentStep] });
			}
		},
	});

	const toggleVoice = () => {
		if (isVoiceActive) {
			stop();
			setIsVoiceActive(false);
		} else {
			listen();
			setIsVoiceActive(true);
			speak({ text: 'Voice commands enabled.' });
		}
	};

	useEffect(() => {
		const handleFullscreenChange = () => {
			if (!document.fullscreenElement) {
				setIsHandsFree(false);
			}
		};
		document.addEventListener('fullscreenchange', handleFullscreenChange);
		return () => {
			document.removeEventListener('fullscreenchange', handleFullscreenChange);
		};
	}, []);

	if (isGuest) {
		return (
			<div className='rounded-lg border border-yellow-500 bg-yellow-50 dark:bg-yellow-950/20 p-6'>
				<h3 className='text-lg font-semibold mb-2'>Sign In to Use Cooking Mode</h3>
				<p className='text-sm text-gray-600 dark:text-gray-400 mb-4'>Cooking mode requires an account to access your saved recipes and calculate proper scaling.</p>
				<a href='/api/auth/login' className='inline-block px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors'>
					Sign In
				</a>
			</div>
		);
	}

	if (recipes.length === 0) {
		return (
			<div className='rounded-lg border p-10 flex flex-col items-center justify-center'>
				<span className='text-4xl mb-4'>👨‍🍳</span>
				<p className='text-lg font-medium'>No recipes available</p>
				<p className='text-sm text-gray-600 dark:text-gray-400'>Create recipes first to use cooking mode</p>
			</div>
		);
	}

	return (
		<div ref={handsFreeContainerRef} className={`space-y-4 ${isHandsFree ? 'bg-white dark:bg-black p-8' : ''}`}>
			<div className='flex items-center justify-between'>
				<h2 className='text-2xl font-bold'>Cooking Mode</h2>
				<div>
					{isHandsFree && (
						<button onClick={toggleVoice} className='px-3 py-2 text-sm border rounded mr-2'>
							{listening ? 'Listening...' : 'Voice CMD'}
						</button>
					)}
					<button onClick={() => void toggleHandsFree()} className='px-3 py-2 text-sm border rounded'>
						{isHandsFree ? 'Exit Hands-Free' : 'Hands-Free Mode'}
					</button>
				</div>
			</div>

			{/* Recipe Selection */}
			<div className='rounded-lg border p-6'>
				<h3 className='text-lg font-semibold mb-4'>Select Recipe</h3>
				<div className='grid gap-3 md:grid-cols-2 lg:grid-cols-3'>
					{recipes.map((recipe) => (
						<button
							key={recipe.id}
							onClick={() => {
								setSelectedRecipeId(recipe.id);
								setTargetServings(recipe.servings);
							}}
							className={`p-4 rounded-lg border transition-all text-left ${selectedRecipeId === recipe.id ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/20' : 'hover:border-gray-400'}`}
						>
							<h4 className='font-medium'>{recipe.name}</h4>
							{recipe.description != null && recipe.description !== '' && <p className='text-sm text-gray-600 dark:text-gray-400 mt-1'>{recipe.description}</p>}
							<p className='text-sm mt-2'>
								{recipe.servings} serving{recipe.servings > 1 ? 's' : ''}
							</p>
						</button>
					))}
				</div>
			</div>

			{/* Scaling Options */}
			{selectedRecipe && (
				<div className='rounded-lg border p-6'>
					<h3 className='text-lg font-semibold mb-4'>Scaling Options</h3>

					{/* Mode Selection */}
					<div className='flex gap-4 mb-4'>
						<button
							onClick={() => {
								setMode('servings');
							}}
							className={`px-4 py-2 rounded-lg transition-colors ${mode === 'servings' ? 'bg-blue-500 text-white' : 'bg-gray-200 dark:bg-gray-700'}`}
						>
							Scale by Servings
						</button>
						<button
							onClick={() => {
								setMode('weight');
							}}
							className={`px-4 py-2 rounded-lg transition-colors ${mode === 'weight' ? 'bg-blue-500 text-white' : 'bg-gray-200 dark:bg-gray-700'}`}
						>
							Scale by Total Weight
						</button>
					</div>

					{/* Input Fields */}
					{mode === 'servings' ? (
						<div className='flex items-center gap-4'>
							<label className='font-medium'>Target Servings:</label>
							<input
								type='number'
								value={targetServings}
								onChange={(e) => {
									const value = parseFloat(e.target.value);
									setTargetServings(Math.max(0.1, Number.isNaN(value) ? 1 : value));
								}}
								className='px-3 py-2 border rounded-lg w-24'
								step='0.5'
								min='0.1'
							/>
							<span className='text-sm text-gray-600 dark:text-gray-400'>(Original: {selectedRecipe.servings})</span>
						</div>
					) : (
						<div className='flex items-center gap-4'>
							<label className='font-medium'>Target Weight:</label>
							<input
								type='number'
								value={targetWeight}
								onChange={(e) => {
									const value = parseFloat(e.target.value);
									setTargetWeight(Math.max(0, Number.isNaN(value) ? 0 : value));
								}}
								className='px-3 py-2 border rounded-lg w-32'
								step='10'
								min='0'
							/>
							<select
								value={targetUnit}
								onChange={(e) => {
									setTargetUnit(e.target.value);
								}}
								className='px-3 py-2 border rounded-lg'
							>
								<option value='g'>grams</option>
								<option value='kg'>kilograms</option>
								<option value='mg'>milligrams</option>
								<option value='oz'>ounces</option>
								<option value='lb'>pounds</option>
								<option value='ml'>milliliters</option>
								<option value='l'>liters</option>
								<option value='cup'>cups</option>
								<option value='tbsp'>tablespoons</option>
								<option value='tsp'>teaspoons</option>
							</select>
							<span className='text-sm text-gray-600 dark:text-gray-400'>(Original: {calculateTotalWeight().toFixed(0)}g)</span>
						</div>
					)}

					{/* Scale Factor Display */}
					<div className='mt-4 p-3 bg-gray-100 dark:bg-gray-800 rounded-lg'>
						<p className='text-sm'>
							<span className='font-medium'>Scale Factor:</span> {scaleFactor.toFixed(2)}x
						</p>
					</div>
				</div>
			)}

			{/* Scaled Ingredients */}
			{selectedRecipe !== null && scaledIngredients.length > 0 && (
				<div className='rounded-lg border p-6'>
					<h3 className='text-lg font-semibold mb-4'>Scaled Ingredients</h3>
					<div className='space-y-3'>
						{scaledIngredients.map((ing, index) => (
							<div key={index} className='flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900 rounded-lg'>
								<div className='flex-1'>
									<span className='font-medium'>{ing.name}</span>
									{ing.isRecipe && <span className='ml-2 text-xs bg-blue-100 dark:bg-blue-900 px-2 py-1 rounded'>Recipe</span>}
								</div>
								<div className='text-right'>
									<p className='font-medium'>
										{ing.scaledQuantity.toFixed(1)} {ing.scaledUnit}
									</p>
									<p className='text-xs text-gray-600 dark:text-gray-400'>
										was {ing.originalQuantity.toFixed(1)} {ing.originalUnit}
									</p>
								</div>
							</div>
						))}
					</div>

					{/* Nutrition Summary */}
					<div className='mt-6 p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg'>
						<h4 className='font-medium mb-2'>Total Nutrition (Scaled Recipe)</h4>
						<div className='grid grid-cols-2 md:grid-cols-4 gap-3'>
							{(() => {
								const totals = calculateTotals();
								return (
									<>
										<div>
											<p className='text-sm text-gray-600 dark:text-gray-400'>Calories</p>
											<p className='font-semibold'>{totals.calories.toFixed(0)} kcal</p>
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
									</>
								);
							})()}
						</div>
						{mode === 'servings' && targetServings > 0 && <p className='text-sm text-gray-600 dark:text-gray-400 mt-3'>Per serving: {(calculateTotals().calories / targetServings).toFixed(0)} kcal</p>}
					</div>
				</div>
			)}

			{isHandsFree && (
				<div className='flex justify-between mt-8'>
					<button onClick={prevStep} className='px-8 py-4 bg-gray-200 dark:bg-gray-800 rounded-lg text-lg'>
						Previous
					</button>
					<button onClick={nextStep} className='px-8 py-4 bg-blue-500 text-white rounded-lg text-lg'>
						Next
					</button>
				</div>
			)}
		</div>
	);
}
