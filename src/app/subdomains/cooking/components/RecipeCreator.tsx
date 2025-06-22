'use client';

import type { Food } from '@prisma/client';
import { useState } from 'react';

import type { RecipeWithDetails } from '../types/recipe.types';
import { useRecipeForm } from '../hooks/useRecipeForm';
import { RecipeForm } from './RecipeForm';
// import { useToast } from '~/components/Toast';

interface RecipeCreatorProps {
  availableFoods: Food[];
  availableRecipes?: RecipeWithDetails[];
  onSave: (recipe: any) => Promise<void>;
  onCancel: () => void;
}

export const RecipeCreator: React.FC<RecipeCreatorProps> = ({
  availableFoods,
  availableRecipes = [],
  onSave,
  onCancel,
}) => {
  const {
    formData,
    handleInputChange,
    addIngredient,
    removeIngredient,
    updateIngredient,
    calculateTotalNutrition,
    validateForm,
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
  } = useRecipeForm();

  const [isSubmitting, setIsSubmitting] = useState(false);
  // const { addToast } = useToast();

  const handleSaveWrapper = async () => {
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    try {
      await onSave({
        name: formData.name.trim(),
        description: formData.description.trim(),
        notes: formData.notes.trim(),
        prepTime: formData.prepTime ? parseInt(formData.prepTime) : null,
        cookTime: formData.cookTime ? parseInt(formData.cookTime) : null,
        servings: parseInt(formData.servings) || 1,
        visibility: formData.visibility,
        isComponent: formData.isComponent,
        items: formData.items.map((item) => ({
          foodId: item.foodId,
          recipeId: item.recipeId,
          amount: item.amount,
          unit: item.unit,
        })),
      });
      // addToast('Recipe created successfully!', 'success');
      console.log('Recipe created successfully!');
    } catch (error) {
      setError(
        error instanceof Error ? error.message : 'Failed to save recipe'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const nutrition = calculateTotalNutrition();

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Create New Recipe</h2>

      <RecipeForm
        formData={formData}
        onInputChange={handleInputChange}
        onAddIngredient={() => addIngredient(availableFoods, availableRecipes)}
        onRemoveIngredient={removeIngredient}
        onUpdateIngredient={updateIngredient}
        availableFoods={availableFoods}
        availableRecipes={availableRecipes}
        selectedType={selectedType}
        onSelectedTypeChange={setSelectedType}
        selectedFoodId={selectedFoodId}
        onSelectedFoodIdChange={setSelectedFoodId}
        selectedRecipeId={selectedRecipeId}
        onSelectedRecipeIdChange={setSelectedRecipeId}
        amount={amount}
        onAmountChange={setAmount}
        error={error}
        searchTerm={searchTerm}
        onSearchTermChange={setSearchTerm}
        nutrition={nutrition}
      />

      {/* Actions */}
      <div className="flex justify-end gap-2">
        <button
          onClick={onCancel}
          className="px-4 py-2 border rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={() => void handleSaveWrapper()}
          disabled={isSubmitting}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50"
        >
          {isSubmitting ? 'Saving...' : 'Save Recipe'}
        </button>
      </div>
    </div>
  );
};
