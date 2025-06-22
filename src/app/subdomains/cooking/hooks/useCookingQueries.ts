'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { Food } from '@prisma/client';

import { cookingApi } from '../services/api.service';
import type { FoodProduct } from '../services/foodDatabase';
import type {
  RecipeFormData,
  RecipeUpdateData,
  RecipeWithDetails,
} from '../types/recipe.types';

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
export const useFoods = () => {
  return useQuery({
    queryKey: cookingKeys.foods(),
    queryFn: async () => {
      const result = await cookingApi.foods.getFoods();
      return result.foods;
    },
  });
};

// Recipes queries
export const useRecipes = () => {
  return useQuery({
    queryKey: cookingKeys.recipes(),
    queryFn: () => cookingApi.recipes.getRecipes(),
  });
};

// Days queries
export const useDays = () => {
  return useQuery({
    queryKey: cookingKeys.days(),
    queryFn: () => cookingApi.days.getDays(),
  });
};

// Goals queries
export const useGoals = () => {
  return useQuery({
    queryKey: cookingKeys.goals(),
    queryFn: () => cookingApi.goals.getGoals(),
  });
};

// Recipe mutations
export const useCreateRecipe = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: RecipeFormData) => cookingApi.recipes.createRecipe(data),
    onSuccess: (newRecipe) => {
      queryClient.invalidateQueries({ queryKey: cookingKeys.recipes() });
      // Optionally optimistically update
      queryClient.setQueryData<RecipeWithDetails[]>(
        cookingKeys.recipes(),
        (old) => [...(old || []), newRecipe]
      );
    },
  });
};

export const useUpdateRecipe = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: RecipeUpdateData) =>
      cookingApi.recipes.updateRecipe(data),
    onSuccess: (updatedRecipe) => {
      queryClient.invalidateQueries({ queryKey: cookingKeys.recipes() });
      // Optimistically update the specific recipe
      queryClient.setQueryData<RecipeWithDetails[]>(
        cookingKeys.recipes(),
        (old) =>
          old?.map((recipe) =>
            recipe.id === updatedRecipe.id ? updatedRecipe : recipe
          ) || []
      );
    },
  });
};

export const useDeleteRecipe = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => cookingApi.recipes.deleteRecipe(id),
    onSuccess: (_, deletedId) => {
      queryClient.invalidateQueries({ queryKey: cookingKeys.recipes() });
      // Optimistically remove the recipe
      queryClient.setQueryData<RecipeWithDetails[]>(
        cookingKeys.recipes(),
        (old) => old?.filter((recipe) => recipe.id !== deletedId) || []
      );
    },
  });
};

// Food mutations
export const useCreateFood = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: FoodProduct) => cookingApi.foods.createFood(data),
    onSuccess: (newFood) => {
      queryClient.invalidateQueries({ queryKey: cookingKeys.foods() });
      // Optimistically update
      queryClient.setQueryData<Food[]>(cookingKeys.foods(), (old) => [
        ...(old || []),
        newFood,
      ]);
    },
  });
};

// Goals mutations
export const useUpdateGoals = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (
      data: Partial<{
        calories?: number;
        protein?: number;
        carbs?: number;
        fat?: number;
      }>
    ) => cookingApi.goals.updateGoals(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: cookingKeys.goals() });
    },
  });
};

// Day entry mutations
export const useCreateDayEntry = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      date,
      recipeId,
      servings,
    }: {
      date: string;
      recipeId: string;
      servings: number;
    }) => cookingApi.days.createDayEntry({ date, recipeId, servings }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: cookingKeys.days() });
    },
  });
};

export const useDeleteDayEntry = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (entryId: string) => cookingApi.days.deleteDayEntry(entryId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: cookingKeys.days() });
    },
  });
};
