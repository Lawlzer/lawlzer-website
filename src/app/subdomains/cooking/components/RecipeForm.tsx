'use client';

import type { Food } from '@prisma/client';

import type { RecipeWithDetails } from '../types/recipe.types';

interface RecipeFormData {
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

interface RecipeItem {
  id: string;
  foodId?: string;
  recipeId?: string;
  food?: Food;
  recipe?: RecipeWithDetails;
  amount: number;
  unit: string;
}

interface RecipeFormProps {
  formData: RecipeFormData;
  onInputChange: (field: string, value: any) => void;
  onAddIngredient: () => void;
  onRemoveIngredient: (index: number) => void;
  onUpdateIngredient: (index: number, updates: Partial<RecipeItem>) => void;
  availableFoods: Food[];
  availableRecipes: RecipeWithDetails[];
  selectedType: 'food' | 'recipe';
  onSelectedTypeChange: (type: 'food' | 'recipe') => void;
  selectedFoodId: string;
  onSelectedFoodIdChange: (id: string) => void;
  selectedRecipeId: string;
  onSelectedRecipeIdChange: (id: string) => void;
  amount: string;
  onAmountChange: (amount: string) => void;
  error?: string | null;
  searchTerm?: string;
  onSearchTermChange?: (term: string) => void;
  nutrition?: {
    totalCalories: number;
    totalProtein: number;
    totalCarbs: number;
    totalFat: number;
    perServing: {
      calories: number;
      protein: number;
      carbs: number;
      fat: number;
    };
  };
}

export function RecipeForm({
  formData,
  onInputChange,
  onAddIngredient,
  onRemoveIngredient,
  onUpdateIngredient,
  availableFoods,
  availableRecipes,
  selectedType,
  onSelectedTypeChange,
  selectedFoodId,
  onSelectedFoodIdChange,
  selectedRecipeId,
  onSelectedRecipeIdChange,
  amount,
  onAmountChange,
  error,
  searchTerm = '',
  onSearchTermChange,
  nutrition,
}: RecipeFormProps) {
  // Ensure arrays are never undefined
  const safeFoods = availableFoods ?? [];
  const safeRecipes = availableRecipes ?? [];

  const filteredFoods = searchTerm
    ? safeFoods.filter((food) =>
        food.name.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : safeFoods;

  return (
    <div className="space-y-4">
      {error !== null && error !== undefined && (
        <div className="p-3 rounded-lg bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400">
          {error}
        </div>
      )}

      {/* Basic Info */}
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className="block text-sm font-medium mb-1">
            Recipe Name *
          </label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => {
              onInputChange('name', e.target.value);
            }}
            className="w-full px-3 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Servings *</label>
          <input
            type="number"
            value={formData.servings}
            onChange={(e) => {
              onInputChange('servings', e.target.value);
            }}
            className="w-full px-3 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700"
            min="1"
            required
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Visibility</label>
        <select
          value={formData.visibility}
          onChange={(e) => {
            onInputChange('visibility', e.target.value);
          }}
          className="w-full px-3 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700"
        >
          <option value="private">Private</option>
          <option value="unlisted">Unlisted</option>
          <option value="public">Public</option>
        </select>
        <p className="text-xs text-gray-500 mt-1">
          {formData.visibility === 'private'
            ? 'Only you can see this recipe.'
            : formData.visibility === 'unlisted'
              ? 'Anyone with the link can see this recipe.'
              : 'This recipe will appear in public search results.'}
        </p>
      </div>

      <div>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={formData.isComponent}
            onChange={(e) => {
              onInputChange('isComponent', e.target.checked);
            }}
            className="rounded"
          />
          <span className="text-sm font-medium">Component Recipe</span>
        </label>
        <p className="text-xs text-gray-500 mt-1">
          Component recipes (e.g., sauces, doughs) can be used in other recipes
          but won&apos;t show up in the main recipe list.
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">
          Image URL (optional)
        </label>
        <input
          type="url"
          value={formData.imageUrl}
          onChange={(e) => {
            onInputChange('imageUrl', e.target.value);
          }}
          placeholder="https://example.com/recipe-image.jpg"
          className="w-full px-3 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Description</label>
        <textarea
          value={formData.description}
          onChange={(e) => {
            onInputChange('description', e.target.value);
          }}
          className="w-full px-3 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700"
          rows={2}
          placeholder="Brief description of your recipe..."
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className="block text-sm font-medium mb-1">
            Prep Time (minutes)
          </label>
          <input
            type="number"
            value={formData.prepTime}
            onChange={(e) => {
              onInputChange('prepTime', e.target.value);
            }}
            className="w-full px-3 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700"
            min="0"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">
            Cook Time (minutes)
          </label>
          <input
            type="number"
            value={formData.cookTime}
            onChange={(e) => {
              onInputChange('cookTime', e.target.value);
            }}
            className="w-full px-3 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700"
            min="0"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">
          Cooking Instructions
        </label>
        <textarea
          value={formData.notes}
          onChange={(e) => {
            onInputChange('notes', e.target.value);
          }}
          className="w-full px-3 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700"
          rows={3}
          placeholder="Step-by-step cooking instructions..."
        />
      </div>

      {/* Ingredients section */}
      <div>
        <h3 className="text-lg font-semibold mb-3">Ingredients</h3>

        {/* Current Ingredients */}
        {formData.items.length > 0 && (
          <div className="space-y-2 mb-4">
            {formData.items.map((item, index) => {
              const name =
                item.food?.name ?? item.recipe?.name ?? 'Unknown Ingredient';
              const type = item.food ? 'Food' : 'Recipe';
              return (
                <div
                  key={item.id}
                  className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-900 rounded"
                >
                  <span className="flex-1">
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {type}:{' '}
                    </span>
                    {name}
                  </span>
                  <input
                    type="number"
                    value={item.amount}
                    onChange={(e) => {
                      const value = parseFloat(e.target.value);
                      onUpdateIngredient(index, {
                        amount: Number.isNaN(value) ? 0 : value,
                      });
                    }}
                    className="w-20 px-2 py-1 border rounded dark:bg-gray-800 dark:border-gray-700"
                    min="0"
                    step="0.1"
                  />
                  <select
                    value={item.unit}
                    onChange={(e) => {
                      onUpdateIngredient(index, { unit: e.target.value });
                    }}
                    className="px-2 py-1 border rounded dark:bg-gray-800 dark:border-gray-700"
                  >
                    <option value="g">g</option>
                    <option value="kg">kg</option>
                    <option value="mg">mg</option>
                    <option value="ml">ml</option>
                    <option value="l">L</option>
                    <option value="cup">cup</option>
                    <option value="tbsp">tbsp</option>
                    <option value="tsp">tsp</option>
                    <option value="piece">piece</option>
                  </select>
                  <button
                    type="button"
                    onClick={() => {
                      onRemoveIngredient(index);
                    }}
                    className="px-2 py-1 text-red-600 hover:bg-red-100 dark:hover:bg-red-900/20 rounded"
                  >
                    Remove
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {/* Add Ingredient Form */}
        <div className="space-y-3 p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => {
                onSelectedTypeChange('food');
              }}
              className={`px-3 py-1 rounded ${selectedType === 'food' ? 'bg-blue-500 text-white' : 'bg-gray-200 dark:bg-gray-700'}`}
            >
              Food
            </button>
            <button
              type="button"
              onClick={() => {
                onSelectedTypeChange('recipe');
              }}
              className={`px-3 py-1 rounded ${selectedType === 'recipe' ? 'bg-blue-500 text-white' : 'bg-gray-200 dark:bg-gray-700'}`}
            >
              Recipe
            </button>
          </div>

          {selectedType === 'food' && onSearchTermChange && (
            <input
              type="text"
              placeholder="Search foods..."
              value={searchTerm}
              onChange={(e) => {
                onSearchTermChange(e.target.value);
              }}
              className="w-full px-3 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700"
            />
          )}

          <div className="grid gap-3 md:grid-cols-2">
            {selectedType === 'food' ? (
              <select
                value={selectedFoodId}
                onChange={(e) => {
                  onSelectedFoodIdChange(e.target.value);
                }}
                className="px-3 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700"
              >
                <option value="">Select a food...</option>
                {filteredFoods.map((food) => (
                  <option key={food.id} value={food.id}>
                    {food.name}{' '}
                    {food.brand !== null &&
                    food.brand !== undefined &&
                    food.brand !== ''
                      ? `(${food.brand})`
                      : ''}
                  </option>
                ))}
              </select>
            ) : (
              <select
                value={selectedRecipeId}
                onChange={(e) => {
                  onSelectedRecipeIdChange(e.target.value);
                }}
                className="px-3 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700"
              >
                <option value="">Select a recipe...</option>
                {safeRecipes.map((recipe) => (
                  <option key={recipe.id} value={recipe.id}>
                    {recipe.name}
                  </option>
                ))}
              </select>
            )}

            <div className="flex gap-2">
              <input
                type="number"
                value={amount}
                onChange={(e) => {
                  onAmountChange(e.target.value);
                }}
                placeholder="Amount"
                className="w-24 px-3 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700"
                min="0"
                step="0.1"
              />
              <span className="flex items-center">g</span>
            </div>
          </div>

          <button
            type="button"
            onClick={onAddIngredient}
            className="w-full px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            Add Ingredient
          </button>
        </div>
      </div>

      {/* Nutrition summary */}
      {nutrition && formData.items.length > 0 && (
        <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
          <h4 className="font-semibold mb-2">Nutrition Summary</h4>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total</p>
              <p className="font-medium">
                {nutrition.totalCalories.toFixed(0)} kcal
              </p>
              <p className="text-sm">
                P: {nutrition.totalProtein.toFixed(1)}g | C:{' '}
                {nutrition.totalCarbs.toFixed(1)}g | F:{' '}
                {nutrition.totalFat.toFixed(1)}g
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Per Serving
              </p>
              <p className="font-medium">
                {nutrition.perServing.calories.toFixed(0)} kcal
              </p>
              <p className="text-sm">
                P: {nutrition.perServing.protein.toFixed(1)}g | C:{' '}
                {nutrition.perServing.carbs.toFixed(1)}g | F:{' '}
                {nutrition.perServing.fat.toFixed(1)}g
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
