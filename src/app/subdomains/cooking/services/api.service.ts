import type { Food } from '@prisma/client';

import type { RecipeFormData, RecipeUpdateData, RecipeWithDetails } from '../types/recipe.types';

import type { FoodProduct } from './foodDatabase';

// Base API configuration
const API_BASE = '/api/cooking';

// Generic API response type
interface ApiResponse<T> {
	data?: T;
	error?: string;
	success: boolean;
}

// Generic API error handler
async function handleApiResponse<T>(response: Response): Promise<T> {
	if (!response.ok) {
		const error = (await response.json()) as { error?: string };
		throw new Error(error.error ?? `API Error: ${response.status}`);
	}
	return response.json() as Promise<T>;
}

// Session API
export const sessionApi = {
	async getSession() {
		try {
			const response = await fetch('/api/auth/session');
			return await handleApiResponse<{ user: any }>(response);
		} catch (error) {
			console.error('Failed to get session:', error);
			return { user: null };
		}
	},
};

// Foods API
export const foodsApi = {
	async getFoods(): Promise<{ foods: Food[] }> {
		const response = await fetch(`${API_BASE}/foods`);
		return handleApiResponse(response);
	},

	async createFood(food: FoodProduct): Promise<Food> {
		const response = await fetch(`${API_BASE}/foods`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(food),
		});
		return handleApiResponse(response);
	},

	async deleteFood(foodId: string): Promise<void> {
		const response = await fetch(`${API_BASE}/foods?id=${foodId}`, {
			method: 'DELETE',
		});
		return handleApiResponse(response);
	},
};

// Recipes API
export const recipesApi = {
	async getRecipes(): Promise<RecipeWithDetails[]> {
		const response = await fetch(`${API_BASE}/recipes`);
		return handleApiResponse(response);
	},

	async createRecipe(recipe: RecipeFormData): Promise<RecipeWithDetails> {
		const response = await fetch(`${API_BASE}/recipes`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(recipe),
		});
		return handleApiResponse(response);
	},

	async updateRecipe(recipe: RecipeUpdateData): Promise<RecipeWithDetails> {
		const response = await fetch(`${API_BASE}/recipes`, {
			method: 'PUT',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(recipe),
		});
		return handleApiResponse(response);
	},

	async deleteRecipe(recipeId: string): Promise<void> {
		const response = await fetch(`${API_BASE}/recipes?id=${recipeId}`, {
			method: 'DELETE',
		});
		return handleApiResponse(response);
	},

	async revertRecipeVersion(recipeId: string, versionId: string): Promise<RecipeWithDetails> {
		const response = await fetch(`${API_BASE}/recipes/${recipeId}/revert`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ versionId }),
		});
		return handleApiResponse(response);
	},
};

// Days API
export const daysApi = {
	async getDays(): Promise<{ days: any[] }> {
		const response = await fetch(`${API_BASE}/days`);
		return handleApiResponse(response);
	},

	async createDayEntry(entry: any): Promise<any> {
		const response = await fetch(`${API_BASE}/days/entries`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(entry),
		});
		return handleApiResponse(response);
	},

	async deleteDayEntry(entryId: string): Promise<void> {
		const response = await fetch(`${API_BASE}/days/entries/${entryId}`, {
			method: 'DELETE',
		});
		return handleApiResponse(response);
	},

	async duplicateDay(dayId: string): Promise<any> {
		const response = await fetch(`${API_BASE}/days/duplicate`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ dayId }),
		});
		return handleApiResponse(response);
	},
};

// Goals API
export const goalsApi = {
	async getGoals(): Promise<any> {
		const response = await fetch(`${API_BASE}/goals`);
		return handleApiResponse(response);
	},

	async updateGoals(goals: any): Promise<any> {
		const response = await fetch(`${API_BASE}/goals`, {
			method: 'PUT',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(goals),
		});
		return handleApiResponse(response);
	},
};

// Migration API
export const migrationApi = {
	async migrateGuestData(data: { recipes: any[]; foods: any[]; days: any[]; goals: any }): Promise<ApiResponse<any>> {
		const response = await fetch(`${API_BASE}/migrate-guest-data`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(data),
		});
		return handleApiResponse(response);
	},
};

// Search API
export const searchApi = {
	async searchRecipes(params: { query?: string; ingredients?: string[]; minLikes?: number; maxDislikes?: number; includeReported?: boolean }): Promise<RecipeWithDetails[]> {
		const queryParams = new URLSearchParams();
		if (params.query !== undefined && params.query !== null && params.query !== '') queryParams.append('q', params.query);
		if (params.ingredients !== undefined && params.ingredients !== null && params.ingredients.length > 0) {
			queryParams.append('ingredients', params.ingredients.join(','));
		}
		if (params.minLikes !== undefined) {
			queryParams.append('minLikes', params.minLikes.toString());
		}
		if (params.maxDislikes !== undefined) {
			queryParams.append('maxDislikes', params.maxDislikes.toString());
		}
		if (params.includeReported === true) {
			queryParams.append('includeReported', 'true');
		}

		const response = await fetch(`${API_BASE}/search?${queryParams}`);
		return handleApiResponse(response);
	},
};

// Export all APIs
export const cookingApi = {
	session: sessionApi,
	foods: foodsApi,
	recipes: recipesApi,
	days: daysApi,
	goals: goalsApi,
	migration: migrationApi,
	search: searchApi,
};
