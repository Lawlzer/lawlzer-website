import type { Food } from '@prisma/client';
import { useCallback, useState } from 'react';

// import { useToast } from '~/components/Toast';
import type { RecipeWithDetails } from '../types/recipe.types';
import { convertUnit } from '../utils/conversion';

interface RecipeItem {
  id: string;
  foodId?: string;
  recipeId?: string;
  food?: Food;
  recipe?: RecipeWithDetails;
  amount: number;
  unit: string;
}

interface RecipeFormState {
  name: string;
  description: string;
  notes: string;
  prepTime: string;
  cookTime: string;
  servings: string;
  visibility: 'private' | 'public' | 'unlisted';
  isComponent: boolean;
  imageUrl: string;
  items: RecipeItem[];
}

export function useRecipeForm(initialState: Partial<RecipeFormState> = {}) {
  const [formData, setFormData] = useState<RecipeFormState>({
    name: initialState.name ?? '',
    description: initialState.description ?? '',
    notes: initialState.notes ?? '',
    prepTime: initialState.prepTime ?? '',
    cookTime: initialState.cookTime ?? '',
    servings: initialState.servings ?? '1',
    visibility: initialState.visibility ?? 'private',
    isComponent: initialState.isComponent ?? false,
    imageUrl: initialState.imageUrl ?? '',
    items: initialState.items ?? [],
  });

  const [selectedType, setSelectedType] = useState<'food' | 'recipe'>('food');
  const [selectedFoodId, setSelectedFoodId] = useState('');
  const [selectedRecipeId, setSelectedRecipeId] = useState('');
  const [amount, setAmount] = useState('100');
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState<string | null>(null);
  // const { addToast } = useToast();

  const handleInputChange = useCallback((field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  }, []);

  const addIngredient = useCallback(
    (availableFoods: Food[], availableRecipes: RecipeWithDetails[]) => {
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

        const newItem: RecipeItem = {
          id: crypto.randomUUID(),
          foodId: selectedFoodId,
          food,
          amount: parsedAmount,
          unit: 'g',
        };

        setFormData((prev) => ({
          ...prev,
          items: [...prev.items, newItem],
        }));

        // addToast(`${food.name} added`, 'success');
        console.info(`${food.name} added`);
      } else {
        const nestedRecipe = availableRecipes.find(
          (r) => r.id === selectedRecipeId
        );
        if (!nestedRecipe) {
          setError('Invalid recipe selected');
          return;
        }

        const newItem: RecipeItem = {
          id: crypto.randomUUID(),
          recipeId: selectedRecipeId,
          recipe: nestedRecipe,
          amount: parsedAmount,
          unit: 'g',
        };

        setFormData((prev) => ({
          ...prev,
          items: [...prev.items, newItem],
        }));

        // addToast(`${nestedRecipe.name} added`, 'success');
        console.info(`${nestedRecipe.name} added`);
      }

      // Reset form
      setSelectedFoodId('');
      setSelectedRecipeId('');
      setAmount('100');
      setError(null);
    },
    [selectedType, selectedFoodId, selectedRecipeId, amount]
  );

  const updateIngredient = useCallback(
    (index: number, updates: Partial<RecipeItem>) => {
      setFormData((prev) => {
        const newItems = [...prev.items];
        newItems[index] = { ...newItems[index], ...updates };
        return { ...prev, items: newItems };
      });
    },
    []
  );

  const removeIngredient = useCallback((index: number) => {
    setFormData((prev) => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index),
    }));
  }, []);

  const calculateTotalNutrition = useCallback(() => {
    let totalCalories = 0;
    let totalProtein = 0;
    let totalCarbs = 0;
    let totalFat = 0;

    formData.items.forEach((item) => {
      const amountInGrams = convertUnit(item.amount, item.unit, 'g');
      const factor = amountInGrams / 100;

      if (item.food) {
        totalCalories += item.food.calories * factor;
        totalProtein += item.food.protein * factor;
        totalCarbs += item.food.carbs * factor;
        totalFat += item.food.fat * factor;
      } else if (item.recipe?.currentVersion) {
        const { currentVersion, servings: recipeServings } = item.recipe;
        const servingFactor = factor / recipeServings;
        totalCalories +=
          currentVersion.caloriesPerServing * recipeServings * servingFactor;
        totalProtein +=
          currentVersion.proteinPerServing * recipeServings * servingFactor;
        totalCarbs +=
          currentVersion.carbsPerServing * recipeServings * servingFactor;
        totalFat +=
          currentVersion.fatPerServing * recipeServings * servingFactor;
      }
    });

    const parsedServings = parseInt(formData.servings);
    const servingCount =
      Number.isNaN(parsedServings) || parsedServings === 0 ? 1 : parsedServings;

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
  }, [formData.items, formData.servings]);

  const validateForm = useCallback(() => {
    if (!formData.name.trim()) {
      setError('Recipe name is required');
      return false;
    }
    if (formData.items.length === 0) {
      setError('At least one ingredient is required');
      return false;
    }
    setError(null);
    return true;
  }, [formData.name, formData.items]);

  return {
    formData,
    setFormData,
    handleInputChange,
    addIngredient,
    removeIngredient,
    updateIngredient,
    calculateTotalNutrition,
    validateForm,
    // ingredient selection state
    selectedType,
    setSelectedType,
    selectedFoodId,
    setSelectedFoodId,
    selectedRecipeId,
    setSelectedRecipeId,
    amount,
    setAmount,
    searchTerm,
    setSearchTerm,
    error,
    setError,
  };
}
