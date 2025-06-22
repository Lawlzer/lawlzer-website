'use client';

import type { Food } from '@prisma/client';
import { useSession } from 'next-auth/react';
import { useState } from 'react';

import { useRecipeForm } from '../hooks/useRecipeForm';
import type { RecipeWithDetails } from '../types/recipe.types';

import { IngredientAlternatives } from './IngredientAlternatives';
import { RecipeForm } from './RecipeForm';
import { RecipeSocial } from './RecipeSocial';

import { useToast } from '~/components/Toast';
import { Button } from '~/components/ui/Button';

interface RecipeEditorProps {
  recipe: RecipeWithDetails;
  availableFoods: Food[];
  availableRecipes?: RecipeWithDetails[];
  onSave: (recipeData: any) => Promise<void>;
  onCancel: () => void;
}

export function RecipeEditor({
  recipe,
  availableFoods,
  availableRecipes = [],
  onSave,
  onCancel,
}: RecipeEditorProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showVersionWarning, setShowVersionWarning] = useState(true);
  const [viewingAlternatives, setViewingAlternatives] = useState<string | null>(
    null
  );
  const { data: session } = useSession();
  const { addToast } = useToast();

  // Initialize form with recipe data
  const initialItems =
    recipe.currentVersion?.items.map((item) => ({
      id: item.id,
      foodId: item.foodId ?? undefined,
      recipeId: item.recipeId ?? undefined,
      food: item.food ?? undefined,
      recipe: item.recipe ?? undefined,
      amount: item.amount,
      unit: item.unit,
    })) ?? [];

  const {
    formData,
    setFormData: _setFormData,
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
  } = useRecipeForm({
    name: recipe.name,
    description: recipe.description ?? '',
    notes: recipe.notes ?? '',
    prepTime: recipe.prepTime?.toString() ?? '',
    cookTime: recipe.cookTime?.toString() ?? '',
    servings: recipe.servings.toString(),
    visibility: recipe.visibility as 'private' | 'public' | 'unlisted',
    isComponent: recipe.isComponent,
    imageUrl: recipe.imageUrl ?? '',
    items: initialItems,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await onSave({
        id: recipe.id,
        name: formData.name.trim(),
        description: formData.description.trim(),
        notes: formData.notes.trim(),
        prepTime:
          formData.prepTime !== '' &&
          formData.prepTime !== undefined &&
          !Number.isNaN(parseInt(formData.prepTime))
            ? parseInt(formData.prepTime)
            : null,
        cookTime:
          formData.cookTime !== '' &&
          formData.cookTime !== undefined &&
          !Number.isNaN(parseInt(formData.cookTime))
            ? parseInt(formData.cookTime)
            : null,
        servings: !Number.isNaN(parseInt(formData.servings))
          ? parseInt(formData.servings)
          : 1,
        visibility: formData.visibility,
        isComponent: formData.isComponent,
        imageUrl: formData.imageUrl.trim() || undefined,
        items: formData.items.map((item) => ({
          foodId: item.foodId,
          recipeId: item.recipeId,
          amount: item.amount,
          unit: item.unit,
        })),
      });
      addToast('Recipe updated successfully!', 'success');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update recipe');
    } finally {
      setIsSubmitting(false);
    }
  };

  const nutrition = calculateTotalNutrition();

  // Custom remove ingredient handler that also handles alternatives view
  const handleRemoveIngredient = (index: number) => {
    const item = formData.items[index];
    if (viewingAlternatives === item.id) {
      setViewingAlternatives(null);
    }
    removeIngredient(index);
  };

  // Extended RecipeForm with alternatives
  const RecipeFormWithAlternatives = () => (
    <>
      <RecipeForm
        formData={formData}
        onInputChange={handleInputChange}
        onAddIngredient={() => {
          addIngredient(availableFoods, availableRecipes);
        }}
        onRemoveIngredient={handleRemoveIngredient}
        onUpdateIngredient={updateIngredient}
        availableFoods={availableFoods}
        availableRecipes={availableRecipes.filter((r) => r.id !== recipe.id)}
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

      {/* Ingredient Alternatives - shown separately */}
      {formData.items.map(
        (item, _index) =>
          viewingAlternatives === item.id && (
            <div key={item.id} className="mt-2">
              <IngredientAlternatives
                recipeItemId={item.id}
                availableFoods={availableFoods}
                availableRecipes={availableRecipes}
              />
            </div>
          )
      )}

      {/* Alternatives Toggle Buttons */}
      {formData.items.length > 0 && (
        <div className="space-y-2">
          <h4 className="font-medium">View Ingredient Alternatives</h4>
          {formData.items.map((item) => {
            const name = item.food?.name ?? item.recipe?.name ?? 'Unknown';
            return (
              <div key={item.id} className="flex items-center gap-2">
                <span className="flex-1">{name}</span>
                <Button
                  variant="link"
                  onClick={() => {
                    setViewingAlternatives(
                      viewingAlternatives === item.id ? null : item.id
                    );
                  }}
                >
                  {viewingAlternatives === item.id ? 'Hide' : 'View'}{' '}
                  Alternatives
                </Button>
              </div>
            );
          })}
        </div>
      )}
    </>
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">Edit Recipe</h2>
        <span className="text-sm text-gray-600 dark:text-gray-400">
          Version {recipe.currentVersion?.version ?? 1} → Version{' '}
          {(recipe.currentVersion?.version ?? 0) + 1}
        </span>
      </div>

      {showVersionWarning && (
        <div className="rounded-lg border border-blue-500 bg-blue-50 dark:bg-blue-950/20 p-4">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h3 className="font-semibold mb-1">Recipe Versioning Active</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Editing this recipe will create Version{' '}
                {(recipe.currentVersion?.version ?? 0) + 1}. Previous versions
                are preserved for historical accuracy in your day tracking.
              </p>
              {recipe.versions.length > 1 && (
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  This recipe has {recipe.versions.length} versions total.
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={() => {
                setShowVersionWarning(false);
              }}
              className="ml-4 text-gray-500 hover:text-gray-700"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
        <RecipeFormWithAlternatives />

        {/* Actions */}
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 border rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50"
          >
            {isSubmitting ? 'Updating...' : 'Update Recipe'}
          </button>
        </div>
      </form>

      {/* Social Features - only for public recipes */}
      {formData.visibility === 'public' && session?.user && (
        <div className="mt-8 pt-8 border-t">
          <h3 className="text-lg font-semibold mb-4">Social Features</h3>
          <RecipeSocial recipeId={recipe.id} currentUser={session.user} />
        </div>
      )}
    </div>
  );
}
