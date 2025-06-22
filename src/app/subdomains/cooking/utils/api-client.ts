import type { Food } from '@prisma/client';

import type { FoodProduct } from '../services/foodDatabase';
import type { RecipeFormData, RecipeUpdateData, RecipeWithDetails } from '../types/recipe.types';

interface ApiResponse<T> {
	data?: T;
	error?: string;
	ok: boolean;
}

async function fetchApi<T>(url: string, options?: RequestInit): Promise<ApiResponse<T>> {
	try {
		const response = await fetch(url, {
			...options,
			headers: {
				'Content-Type': 'application/json',
				...options?.headers,
			},
		});

		const data = await response.json();

		if (!response.ok) {
			return {
				ok: false,
				error: data.error ?? `Request failed with status ${response.status}`,
			};
		}

		return { ok: true, data };
	} catch (error) {
		return {
			ok: false,
			error: error instanceof Error ? error.message : 'Network error',
		};
	}
}

// Auth API
export async function checkAuthStatus() {
	const result = await fetchApi<{ user: unknown }>('/api/auth/session');
	return {
		isGuest: !result.data?.user,
		user: result.data?.user,
	};
}

// Foods API
export async function fetchFoods() {
	const result = await fetchApi<{ foods: Food[] }>('/api/cooking/foods');
	return result.data?.foods ?? [];
}

export async function saveFood(foodProduct: FoodProduct) {
	return fetchApi<Food>('/api/cooking/foods', {
		method: 'POST',
		body: JSON.stringify(foodProduct),
	});
}

// Recipes API
export async function fetchRecipes() {
	const result = await fetchApi<RecipeWithDetails[]>('/api/cooking/recipes');
	return result.data ?? [];
}

export async function createRecipe(recipeData: RecipeFormData) {
	return fetchApi<RecipeWithDetails>('/api/cooking/recipes', {
		method: 'POST',
		body: JSON.stringify(recipeData),
	});
}

export async function updateRecipe(recipeData: RecipeUpdateData) {
	return fetchApi<RecipeWithDetails>('/api/cooking/recipes', {
		method: 'PUT',
		body: JSON.stringify(recipeData),
	});
}

export async function deleteRecipe(recipeId: string) {
	return fetchApi<unknown>(`/api/cooking/recipes?id=${recipeId}`, {
		method: 'DELETE',
	});
}

export async function revertRecipeVersion(recipeId: string, versionId: string) {
	return fetchApi<RecipeWithDetails>(`/api/cooking/recipes/${recipeId}/revert`, {
		method: 'POST',
		body: JSON.stringify({ versionId }),
	});
}

// Day Entries API
export async function createDayEntry(entry: { date: string; type: 'food' | 'recipe'; itemId: string; quantity: number; unit?: string }) {
	return fetchApi<unknown>('/api/cooking/days/entries', {
		method: 'POST',
		body: JSON.stringify(entry),
	});
}

export async function deleteDayEntry(entryId: string) {
	return fetchApi<unknown>(`/api/cooking/days/entries/${entryId}`, {
		method: 'DELETE',
	});
}

// Goals API
export async function fetchGoals() {
	return fetchApi<unknown>('/api/cooking/goals');
}

export async function saveGoals(goals: unknown) {
	return fetchApi<unknown>('/api/cooking/goals', {
		method: 'POST',
		body: JSON.stringify(goals),
	});
}

// Guest Data Migration API
export async function migrateGuestData() {
	return fetchApi<{
		foods: { migrated: number; skipped: number };
		recipes: { migrated: number; skipped: number };
		days: { migrated: number; skipped: number };
		goals: { migrated: boolean };
	}>('/api/cooking/migrate-guest-data', {
		method: 'POST',
	});
}
