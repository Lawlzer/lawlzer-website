import type { Food } from '@prisma/client';

import type { NutritionInfo, RecipeFormData, RecipeIngredientInput, RecipeItemWithRelations } from '../types/recipe.types';

// Clone the error type for use in utils
class RecipeValidationError extends Error {
	public field?: string;

	public constructor(message: string, field?: string) {
		super(message);
		this.name = 'RecipeValidationError';
		this.field = field;
	}
}

// Calculate nutrition for a list of ingredients
export function calculateNutrition(items: RecipeItemWithRelations[], servings = 1): { total: NutritionInfo; perServing: NutritionInfo } {
	const total: NutritionInfo = {
		calories: 0,
		protein: 0,
		carbs: 0,
		fat: 0,
		fiber: 0,
		sugar: 0,
		sodium: 0,
	};

	for (const item of items) {
		if (item.food) {
			const factor = item.amount / 100; // Food nutrition is per 100g
			total.calories += item.food.calories * factor;
			total.protein += item.food.protein * factor;
			total.carbs += item.food.carbs * factor;
			total.fat += item.food.fat * factor;
			total.fiber += item.food.fiber * factor;
			total.sugar += item.food.sugar * factor;
			total.sodium += item.food.sodium * factor;
		} else if (item.recipe?.currentVersion) {
			// Handle nested recipes
			const { recipe } = item;
			const version = item.recipe.currentVersion;
			const factor = item.amount / 100;
			const servingFactor = factor / recipe.servings;

			total.calories += version.caloriesPerServing * recipe.servings * servingFactor;
			total.protein += version.proteinPerServing * recipe.servings * servingFactor;
			total.carbs += version.carbsPerServing * recipe.servings * servingFactor;
			total.fat += version.fatPerServing * recipe.servings * servingFactor;
			total.fiber += version.fiberPerServing * recipe.servings * servingFactor;
			total.sugar += version.sugarPerServing * recipe.servings * servingFactor;
			total.sodium += version.sodiumPerServing * recipe.servings * servingFactor;
		}
	}

	const perServing: NutritionInfo = {
		calories: total.calories / servings,
		protein: total.protein / servings,
		carbs: total.carbs / servings,
		fat: total.fat / servings,
		fiber: total.fiber / servings,
		sugar: total.sugar / servings,
		sodium: total.sodium / servings,
	};

	return { total, perServing };
}

// Calculate nutrition for ingredient inputs (used in forms)
export function calculateNutritionFromInputs(items: RecipeIngredientInput[], availableFoods: Food[], servings = 1): { total: NutritionInfo; perServing: NutritionInfo } {
	const total: NutritionInfo = {
		calories: 0,
		protein: 0,
		carbs: 0,
		fat: 0,
		fiber: 0,
		sugar: 0,
		sodium: 0,
	};

	for (const item of items) {
		if (item.foodId !== undefined && item.foodId !== '') {
			const food = availableFoods.find((f) => f.id === item.foodId);
			if (food) {
				const factor = item.amount / 100;
				total.calories += food.calories * factor;
				total.protein += food.protein * factor;
				total.carbs += food.carbs * factor;
				total.fat += food.fat * factor;
				total.fiber += food.fiber * factor;
				total.sugar += food.sugar * factor;
				total.sodium += food.sodium * factor;
			}
		}
		// TODO: Handle nested recipes when needed
	}

	const perServing: NutritionInfo = {
		calories: total.calories / servings,
		protein: total.protein / servings,
		carbs: total.carbs / servings,
		fat: total.fat / servings,
		fiber: total.fiber / servings,
		sugar: total.sugar / servings,
		sodium: total.sodium / servings,
	};

	return { total, perServing };
}

// Validate recipe form data
export function validateRecipeForm(data: Partial<RecipeFormData>): void {
	if (data.name == null || data.name.trim() === '') {
		throw new RecipeValidationError('Recipe name is required', 'name');
	}

	if (!data.items || data.items.length === 0) {
		throw new RecipeValidationError('Recipe must have at least one ingredient', 'items');
	}

	if (data.servings !== undefined && (data.servings < 1 || !Number.isInteger(data.servings))) {
		throw new RecipeValidationError('Servings must be a positive whole number', 'servings');
	}

	if (data.prepTime !== undefined && data.prepTime !== null && data.prepTime < 0) {
		throw new RecipeValidationError('Prep time cannot be negative', 'prepTime');
	}

	if (data.cookTime !== undefined && data.cookTime !== null && data.cookTime < 0) {
		throw new RecipeValidationError('Cook time cannot be negative', 'cookTime');
	}

	// Validate items
	for (let i = 0; i < data.items.length; i++) {
		const item = data.items[i];

		if ((item.foodId == null || item.foodId === '') && (item.recipeId == null || item.recipeId === '')) {
			throw new RecipeValidationError(`Ingredient ${i + 1} must have a food or recipe selected`, `items[${i}]`);
		}

		if (item.amount <= 0) {
			throw new RecipeValidationError(`Ingredient ${i + 1} must have a positive amount`, `items[${i}].amount`);
		}

		if (item.unit == null || item.unit === '') {
			throw new RecipeValidationError(`Ingredient ${i + 1} must have a unit`, `items[${i}].unit`);
		}
	}
}

// Format nutrition value for display
export function formatNutritionValue(value: number, unit = 'g'): string {
	if (value < 0.1) return `0${unit}`;
	if (value < 1) return `${value.toFixed(1)}${unit}`;
	if (value < 10) return `${value.toFixed(1)}${unit}`;
	return `${Math.round(value)}${unit}`;
}

// Format time duration
export function formatDuration(minutes: number | null | undefined): string {
	if (minutes == null || minutes === 0) return '';

	if (minutes < 60) {
		return `${minutes} min`;
	}

	const hours = Math.floor(minutes / 60);
	const mins = minutes % 60;

	if (mins === 0) {
		return `${hours} hr`;
	}

	return `${hours} hr ${mins} min`;
}

// Calculate total time
export function getTotalTime(prepTime?: number | null, cookTime?: number | null): number | null {
	if ((prepTime == null || prepTime === 0) && (cookTime == null || cookTime === 0)) return null;
	return (prepTime ?? 0) + (cookTime ?? 0);
}

// Convert between units (basic implementation)
export function convertUnit(amount: number, fromUnit: string, toUnit: string): number {
	// Simple conversion for common units
	const conversions: Record<string, Record<string, number>> = {
		g: { kg: 0.001, mg: 1000, oz: 0.035274, lb: 0.00220462 },
		kg: { g: 1000, mg: 1000000, oz: 35.274, lb: 2.20462 },
		mg: { g: 0.001, kg: 0.000001, oz: 0.000035274, lb: 0.00000220462 },
		ml: { l: 0.001, cup: 0.00422675, tbsp: 0.067628, tsp: 0.202884 },
		l: { ml: 1000, cup: 4.22675, tbsp: 67.628, tsp: 202.884 },
		cup: { ml: 236.588, l: 0.236588, tbsp: 16, tsp: 48 },
		tbsp: { ml: 14.7868, l: 0.0147868, cup: 0.0625, tsp: 3 },
		tsp: { ml: 4.92892, l: 0.00492892, cup: 0.0208333, tbsp: 0.333333 },
		oz: { g: 28.3495, kg: 0.0283495, lb: 0.0625 },
		lb: { g: 453.592, kg: 0.453592, oz: 16 },
	};

	if (fromUnit === toUnit) return amount;

	const conversion = conversions[fromUnit]?.[toUnit];
	if (conversion !== undefined) {
		return amount * conversion;
	}

	// If no direct conversion, try inverse
	const inverseConversion = conversions[toUnit]?.[fromUnit];
	if (inverseConversion !== undefined) {
		return amount / inverseConversion;
	}

	// If no conversion available, return original amount
	console.warn(`No conversion available from ${fromUnit} to ${toUnit}`);
	return amount;
}

// Format ingredient amount for display
export function formatIngredientAmount(amount: number, unit: string): string {
	// For small amounts, show more precision
	if (amount < 1) {
		return `${amount.toFixed(2)} ${unit}`;
	}

	// For medium amounts, show one decimal
	if (amount < 100) {
		return `${amount.toFixed(1)} ${unit}`;
	}

	// For large amounts, show no decimals
	return `${Math.round(amount)} ${unit}`;
}

// Get a summary of recipe info
export function getRecipeSummary(recipe: { prepTime?: number | null; cookTime?: number | null; servings: number }): string[] {
	const summary: string[] = [];

	if (recipe.prepTime != null && recipe.prepTime > 0) {
		summary.push(`Prep: ${formatDuration(recipe.prepTime)}`);
	}

	if (recipe.cookTime != null && recipe.cookTime > 0) {
		summary.push(`Cook: ${formatDuration(recipe.cookTime)}`);
	}

	const totalTime = getTotalTime(recipe.prepTime, recipe.cookTime);
	if (totalTime != null && totalTime > 0) {
		summary.push(`Total: ${formatDuration(totalTime)}`);
	}

	summary.push(`${recipe.servings} serving${recipe.servings > 1 ? 's' : ''}`);

	return summary;
}
