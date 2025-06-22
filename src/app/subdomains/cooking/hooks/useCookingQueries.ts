'use client';

import type { Food } from '@prisma/client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { cookingApi } from '../services/api.service';
import type { FoodProduct } from '../services/foodDatabase';
import type { RecipeFormData, RecipeUpdateData, RecipeWithDetails } from '../types/recipe.types';

// Query keys
export const cookingKeys = {
	all: ['cooking'] as const,
	foods: () => [...cookingKeys.all, 'foods'] as const,
	recipes: () => [...cookingKeys.all, 'recipes'] as const,
	days: () => [...cookingKeys.all, 'days'] as const,
	day: (date: string) => [...cookingKeys.days(), date] as const,
	goals: () => [...cookingKeys.all, 'goals'] as const,
};

// Foods queries
export const useFoods = () =>
	useQuery({
		queryKey: cookingKeys.foods(),
		queryFn: async () => {
			try {
				const result = await cookingApi.foods.getFoods();
				return result.foods;
			} catch (error) {
				console.warn('Failed to fetch foods, using empty array:', error);
				return [] as Food[];
			}
		},
		retry: false,
		staleTime: 5 * 60 * 1000, // 5 minutes
	});

// Recipes queries
export const useRecipes = () =>
	useQuery({
		queryKey: cookingKeys.recipes(),
		queryFn: async () => {
			try {
				return await cookingApi.recipes.getRecipes();
			} catch (error) {
				console.warn('Failed to fetch recipes, using empty array:', error);
				return [] as RecipeWithDetails[];
			}
		},
		retry: false,
		staleTime: 5 * 60 * 1000,
	});

// Days queries
export const useDays = () =>
	useQuery({
		queryKey: cookingKeys.days(),
		queryFn: async () => {
			try {
				const result = await cookingApi.days.getDays();
				return result.days as unknown[];
			} catch (error) {
				console.warn('Failed to fetch days, using empty array:', error);
				return [] as unknown[];
			}
		},
		retry: false,
		staleTime: 5 * 60 * 1000,
	});

// Goals queries
export const useGoals = () =>
	useQuery({
		queryKey: cookingKeys.goals(),
		queryFn: async () => {
			try {
				const result = await cookingApi.goals.getGoals();
				return result as {
					calories?: number;
					protein?: number;
					carbs?: number;
					fat?: number;
				};
			} catch (error) {
				console.warn('Failed to fetch goals, using defaults:', error);
				return {
					calories: 2000,
					protein: 50,
					carbs: 250,
					fat: 65,
				};
			}
		},
		retry: false,
		staleTime: 5 * 60 * 1000,
	});

// Recipe mutations
export const useCreateRecipe = () => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async (data: RecipeFormData) => cookingApi.recipes.createRecipe(data),
		onSuccess: (newRecipe) => {
			void queryClient.invalidateQueries({ queryKey: cookingKeys.recipes() });
			// Optionally optimistically update
			queryClient.setQueryData<RecipeWithDetails[]>(cookingKeys.recipes(), (old) => [...(old || []), newRecipe]);
		},
	});
};

export const useUpdateRecipe = () => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async (data: RecipeUpdateData) => cookingApi.recipes.updateRecipe(data),
		onSuccess: (updatedRecipe) => {
			void queryClient.invalidateQueries({ queryKey: cookingKeys.recipes() });
			// Optimistically update the specific recipe
			queryClient.setQueryData<RecipeWithDetails[]>(cookingKeys.recipes(), (old) => old?.map((recipe) => (recipe.id === updatedRecipe.id ? updatedRecipe : recipe)) || []);
		},
	});
};

export const useDeleteRecipe = () => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async (id: string) => cookingApi.recipes.deleteRecipe(id),
		onSuccess: (_, deletedId) => {
			void queryClient.invalidateQueries({ queryKey: cookingKeys.recipes() });
			// Optimistically remove the recipe
			queryClient.setQueryData<RecipeWithDetails[]>(cookingKeys.recipes(), (old) => old?.filter((recipe) => recipe.id !== deletedId) || []);
		},
	});
};

// Food mutations
export const useCreateFood = () => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async (data: FoodProduct) => cookingApi.foods.createFood(data),
		onSuccess: (newFood) => {
			void queryClient.invalidateQueries({ queryKey: cookingKeys.foods() });
			// Optimistically update
			queryClient.setQueryData<Food[]>(cookingKeys.foods(), (old) => [...(old || []), newFood]);
		},
	});
};

// Goals mutations
export const useUpdateGoals = () => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async (
			data: Partial<{
				calories?: number;
				protein?: number;
				carbs?: number;
				fat?: number;
			}>
		) => {
			const result = await cookingApi.goals.updateGoals(data);
			return result as {
				calories?: number;
				protein?: number;
				carbs?: number;
				fat?: number;
			};
		},
		onSuccess: () => {
			void queryClient.invalidateQueries({ queryKey: cookingKeys.goals() });
		},
	});
};

// Day entry mutations
export const useCreateDayEntry = () => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async ({ date, recipeId, servings }: { date: string; recipeId: string; servings: number }) => {
			const result = await cookingApi.days.createDayEntry({
				date,
				recipeId,
				servings,
			});
			return result as unknown;
		},
		onSuccess: () => {
			void queryClient.invalidateQueries({ queryKey: cookingKeys.days() });
		},
	});
};

export const useDeleteDayEntry = () => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async (entryId: string) => cookingApi.days.deleteDayEntry(entryId),
		onSuccess: () => {
			void queryClient.invalidateQueries({ queryKey: cookingKeys.days() });
		},
	});
};
