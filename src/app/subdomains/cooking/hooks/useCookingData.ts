import { useCallback, useEffect, useState } from 'react';
import type { Food } from '@prisma/client';
import { cookingApi } from '../services/api.service';
import {
  getGuestFoods,
  getGuestRecipes,
  addGuestFood,
  addGuestRecipe,
} from '../services/guestStorage';
import type {
  RecipeFormData,
  RecipeUpdateData,
  RecipeWithDetails,
} from '../types/recipe.types';
import type { FoodProduct } from '../services/foodDatabase';
import { useToast } from './useToast';

interface UseCookingDataReturn {
  // State
  isGuest: boolean;
  isLoading: boolean;
  availableFoods: Food[];
  recipes: RecipeWithDetails[];
  filteredRecipes: RecipeWithDetails[];

  // Actions
  refreshData: () => Promise<void>;
  createFood: (food: FoodProduct) => Promise<void>;
  createRecipe: (recipe: RecipeFormData) => Promise<void>;
  updateRecipe: (recipe: RecipeUpdateData) => Promise<void>;
  deleteRecipe: (recipeId: string) => Promise<void>;
  revertRecipeVersion: (recipeId: string, versionId: string) => Promise<void>;
  searchRecipes: (term: string) => void;
}

export function useCookingData(): UseCookingDataReturn {
  const toast = useToast();
  const [isGuest, setIsGuest] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [availableFoods, setAvailableFoods] = useState<Food[]>([]);
  const [recipes, setRecipes] = useState<RecipeWithDetails[]>([]);
  const [filteredRecipes, setFilteredRecipes] = useState<RecipeWithDetails[]>(
    []
  );

  // Check authentication status
  const checkAuth = useCallback(async () => {
    try {
      const { user } = await cookingApi.session.getSession();
      setIsGuest(!user);
    } catch (error) {
      setIsGuest(true);
    }
  }, []);

  // Fetch foods
  const fetchFoods = useCallback(async () => {
    if (isGuest) {
      const guestFoodsList = getGuestFoods();
      const convertedFoods: Food[] = guestFoodsList.map((food) => ({
        id: food.guestId ?? '',
        userId: null,
        barcode: food.barcode,
        name: food.name,
        brand: food.brand,
        calories: food.calories,
        protein: food.protein,
        carbs: food.carbs,
        fat: food.fat,
        fiber: food.fiber,
        sugar: food.sugar,
        sodium: food.sodium,
        saturatedFat: food.saturatedFat,
        transFat: food.transFat,
        cholesterol: food.cholesterol,
        potassium: food.potassium,
        vitaminA: food.vitaminA,
        vitaminC: food.vitaminC,
        calcium: food.calcium,
        iron: food.iron,
        imageUrl: food.imageUrl,
        defaultServingSize: food.defaultServingSize,
        defaultServingUnit: food.defaultServingUnit,
        visibility: food.visibility,
        createdAt: new Date(),
        updatedAt: new Date(),
      }));
      setAvailableFoods(convertedFoods);
    } else {
      try {
        const { foods } = await cookingApi.foods.getFoods();
        setAvailableFoods(foods);
      } catch (error) {
        console.error('Error fetching foods:', error);
        toast.error('Failed to load foods');
      }
    }
  }, [isGuest, toast]);

  // Fetch recipes
  const fetchRecipes = useCallback(async () => {
    if (isGuest) {
      const guestRecipes = getGuestRecipes();
      const convertedRecipes: RecipeWithDetails[] = guestRecipes.map(
        (recipe) => ({
          id: recipe.guestId,
          userId: '',
          name: recipe.name,
          description: recipe.description ?? null,
          notes: recipe.notes ?? null,
          prepTime: recipe.prepTime ?? null,
          cookTime: recipe.cookTime ?? null,
          servings: recipe.servings,
          visibility: 'private',
          isComponent: false,
          imageUrl: null,
          createdAt: new Date(recipe.createdAt),
          updatedAt: new Date(recipe.updatedAt),
          currentVersionId: null,
          currentVersion: null,
          versions: [],
        })
      );
      setRecipes(convertedRecipes);
      setFilteredRecipes(convertedRecipes);
    } else {
      try {
        const data = await cookingApi.recipes.getRecipes();
        setRecipes(data);
        setFilteredRecipes(data);
      } catch (error) {
        console.error('Error fetching recipes:', error);
        toast.error('Failed to load recipes');
      }
    }
  }, [isGuest, toast]);

  // Create food
  const createFood = useCallback(
    async (food: FoodProduct) => {
      if (isGuest) {
        addGuestFood({
          barcode: food.barcode,
          name: food.name,
          brand: food.brand ?? null,
          calories: food.nutrition.calories,
          protein: food.nutrition.protein,
          carbs: food.nutrition.carbs,
          fat: food.nutrition.fat,
          fiber: food.nutrition.fiber,
          sugar: food.nutrition.sugar,
          sodium: food.nutrition.sodium,
          saturatedFat: food.nutrition.saturatedFat ?? null,
          transFat: food.nutrition.transFat ?? null,
          cholesterol: food.nutrition.cholesterol ?? null,
          potassium: 0,
          vitaminA: 0,
          vitaminC: 0,
          calcium: 0,
          iron: 0,
          imageUrl: food.imageUrl ?? null,
          defaultServingSize: 100,
          defaultServingUnit: 'g',
          visibility: 'private',
        });
        toast.success('Food saved locally! Sign in to sync across devices.');
        await fetchFoods();
      } else {
        try {
          await cookingApi.foods.createFood(food);
          toast.success('Food saved successfully!');
          await fetchFoods();
        } catch (error) {
          toast.error('Failed to save food');
          throw error;
        }
      }
    },
    [isGuest, fetchFoods, toast]
  );

  // Create recipe
  const createRecipe = useCallback(
    async (recipeData: RecipeFormData) => {
      if (isGuest) {
        const guestRecipe = addGuestRecipe({
          name: recipeData.name,
          description: recipeData.description ?? null,
          notes: recipeData.notes ?? null,
          prepTime: recipeData.prepTime,
          cookTime: recipeData.cookTime,
          servings: recipeData.servings,
          items: recipeData.items,
        });

        const newRecipe: RecipeWithDetails = {
          id: guestRecipe.guestId,
          userId: '',
          name: guestRecipe.name,
          description: guestRecipe.description ?? null,
          notes: guestRecipe.notes ?? null,
          prepTime: guestRecipe.prepTime ?? null,
          cookTime: guestRecipe.cookTime ?? null,
          servings: guestRecipe.servings,
          visibility: 'private',
          isComponent: false,
          imageUrl: null,
          createdAt: new Date(guestRecipe.createdAt),
          updatedAt: new Date(guestRecipe.updatedAt),
          currentVersionId: null,
          currentVersion: null,
          versions: [],
        };

        setRecipes([...recipes, newRecipe]);
        setFilteredRecipes([...filteredRecipes, newRecipe]);
        toast.success('Recipe saved locally! Sign in to sync across devices.');
      } else {
        try {
          const data = await cookingApi.recipes.createRecipe(recipeData);
          setRecipes([...recipes, data]);
          setFilteredRecipes([...filteredRecipes, data]);
          toast.success('Recipe saved successfully!');
        } catch (error) {
          toast.error('Failed to save recipe');
          throw error;
        }
      }
    },
    [isGuest, recipes, filteredRecipes, toast]
  );

  // Update recipe
  const updateRecipe = useCallback(
    async (recipeData: RecipeUpdateData) => {
      try {
        const data = await cookingApi.recipes.updateRecipe(recipeData);
        setRecipes(recipes.map((r) => (r.id === data.id ? data : r)));
        setFilteredRecipes(
          filteredRecipes.map((r) => (r.id === data.id ? data : r))
        );
        toast.success('Recipe updated successfully!');
      } catch (error) {
        toast.error('Failed to update recipe');
        throw error;
      }
    },
    [recipes, filteredRecipes, toast]
  );

  // Delete recipe
  const deleteRecipe = useCallback(
    async (recipeId: string) => {
      try {
        await cookingApi.recipes.deleteRecipe(recipeId);
        setRecipes(recipes.filter((r) => r.id !== recipeId));
        setFilteredRecipes(filteredRecipes.filter((r) => r.id !== recipeId));
        toast.success('Recipe deleted successfully!');
      } catch (error) {
        toast.error('Failed to delete recipe');
        throw error;
      }
    },
    [recipes, filteredRecipes, toast]
  );

  // Revert recipe version
  const revertRecipeVersion = useCallback(
    async (recipeId: string, versionId: string) => {
      try {
        const updatedRecipe = await cookingApi.recipes.revertRecipeVersion(
          recipeId,
          versionId
        );
        setRecipes(
          recipes.map((r) => (r.id === updatedRecipe.id ? updatedRecipe : r))
        );
        setFilteredRecipes(
          filteredRecipes.map((r) =>
            r.id === updatedRecipe.id ? updatedRecipe : r
          )
        );
        toast.success('Recipe version reverted successfully!');
      } catch (error) {
        toast.error('Failed to revert recipe version');
        throw error;
      }
    },
    [recipes, filteredRecipes, toast]
  );

  // Search recipes
  const searchRecipes = useCallback(
    (term: string) => {
      const search = term.toLowerCase();
      const filtered = recipes.filter(
        (r) =>
          r.name.toLowerCase().includes(search) ||
          (r.description && r.description.toLowerCase().includes(search))
      );
      setFilteredRecipes(filtered);
    },
    [recipes]
  );

  // Refresh all data
  const refreshData = useCallback(async () => {
    setIsLoading(true);
    try {
      await Promise.all([fetchFoods(), fetchRecipes()]);
    } finally {
      setIsLoading(false);
    }
  }, [fetchFoods, fetchRecipes]);

  // Initial data load
  useEffect(() => {
    void checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    if (isGuest !== undefined) {
      void refreshData();
    }
  }, [isGuest, refreshData]);

  return {
    isGuest,
    isLoading,
    availableFoods,
    recipes,
    filteredRecipes,
    refreshData,
    createFood,
    createRecipe,
    updateRecipe,
    deleteRecipe,
    revertRecipeVersion,
    searchRecipes,
  };
}
