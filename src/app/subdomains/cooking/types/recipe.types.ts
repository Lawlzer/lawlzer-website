import type { Food, Recipe, RecipeItem, RecipeVersion } from '@prisma/client';

// Complete recipe with all relations
export interface RecipeWithDetails extends Recipe {
	currentVersion: RecipeVersionWithItems | null;
	versions: RecipeVersion[];
}

// Recipe version with items and their relations
export interface RecipeVersionWithItems extends RecipeVersion {
	items: RecipeItemWithRelations[];
}

// Recipe item with food/recipe relations
export interface RecipeItemWithRelations extends RecipeItem {
	food: Food | null;
	recipe: RecipeWithDetails | null;
}

// Form data for creating/updating recipes
export interface RecipeFormData {
	name: string;
	description?: string;
	notes?: string;
	prepTime?: number | null;
	cookTime?: number | null;
	servings: number;
	items: RecipeIngredientInput[];
}

// Input for recipe ingredients
export interface RecipeIngredientInput {
	foodId?: string;
	recipeId?: string;
	amount: number;
	unit: string;
}

// Nutrition information
export interface NutritionInfo {
	calories: number;
	protein: number;
	carbs: number;
	fat: number;
	fiber: number;
	sugar: number;
	sodium: number;
}

// Recipe with calculated nutrition
export interface RecipeWithNutrition extends RecipeWithDetails {
	nutrition: {
		total: NutritionInfo;
		perServing: NutritionInfo;
	};
}

// Recipe search/filter options
export interface RecipeSearchOptions {
	search?: string;
	userId?: string;
	includePublic?: boolean;
	limit?: number;
	offset?: number;
}

// Recipe creation response
export interface RecipeCreateResponse {
	recipe: RecipeWithDetails;
	message?: string;
}

// Recipe update data (includes ID)
export interface RecipeUpdateData extends RecipeFormData {
	id: string;
}

// Available units for ingredients
export const INGREDIENT_UNITS = [
	{ value: 'g', label: 'grams' },
	{ value: 'kg', label: 'kilograms' },
	{ value: 'mg', label: 'milligrams' },
	{ value: 'ml', label: 'milliliters' },
	{ value: 'l', label: 'liters' },
	{ value: 'cup', label: 'cups' },
	{ value: 'tbsp', label: 'tablespoons' },
	{ value: 'tsp', label: 'teaspoons' },
	{ value: 'oz', label: 'ounces' },
	{ value: 'lb', label: 'pounds' },
	{ value: 'piece', label: 'pieces' },
] as const;

export type IngredientUnit = (typeof INGREDIENT_UNITS)[number]['value'];

// Recipe scaling options
export interface RecipeScalingOptions {
	mode: 'servings' | 'totalWeight';
	targetValue: number;
}

// Error types for better error handling
export class RecipeValidationError extends Error {
	public field?: string;

	public constructor(message: string, field?: string) {
		super(message);
		this.name = 'RecipeValidationError';
		this.field = field;
	}
}

export class RecipeNotFoundError extends Error {
	public constructor(recipeId: string) {
		super(`Recipe with ID ${recipeId} not found`);
		this.name = 'RecipeNotFoundError';
	}
}

export class RecipePermissionError extends Error {
	public constructor(message = 'You do not have permission to perform this action') {
		super(message);
		this.name = 'RecipePermissionError';
	}
}
