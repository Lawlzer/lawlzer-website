'use client';

import type { Food } from '@prisma/client';

import type {
  RecipeFormData,
  RecipeUpdateData,
  RecipeWithDetails,
} from '../../types/recipe.types';
import { RecipeCard } from '../RecipeCard';
import { RecipeCreator } from '../RecipeCreator';
import { RecipeEditor } from '../RecipeEditor';
import { RecipeSearch } from '../RecipeSearch';
import {
  NoRecipesEmptyState,
  NoSearchResultsEmptyState,
} from '../ui/EmptyState';
import { RecipeListSkeleton } from '../ui/LoadingSkeleton';
import { VirtualizedRecipeList } from '../VirtualizedRecipeList';

interface RecipesTabProps {
  isCreatingRecipe: boolean;
  editingRecipe: RecipeWithDetails | null;
  recipes: RecipeWithDetails[];
  filteredRecipes: RecipeWithDetails[];
  recipeSearchTerm: string;
  loadingRecipes: boolean;
  availableFoods: Food[];
  isGuest: boolean;
  onCreateRecipe: () => void;
  onCancelCreate: () => void;
  onSaveRecipe: (data: RecipeFormData) => Promise<void>;
  onUpdateRecipe: (data: RecipeUpdateData) => Promise<void>;
  onCancelEdit: () => void;
  onEditRecipe: (recipe: RecipeWithDetails) => void;
  onDeleteRecipe: (recipeId: string) => void;
  onCookRecipe: () => void;
  onViewHistory: (recipe: RecipeWithDetails) => void;
  onViewFullDay: (recipe: RecipeWithDetails) => void;
  onSearchChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSearchResults: (results: RecipeWithDetails[]) => void;
}

export function RecipesTab({
  isCreatingRecipe,
  editingRecipe,
  recipes,
  filteredRecipes,
  recipeSearchTerm,
  loadingRecipes,
  availableFoods,
  isGuest,
  onCreateRecipe,
  onCancelCreate,
  onSaveRecipe,
  onUpdateRecipe,
  onCancelEdit,
  onEditRecipe,
  onDeleteRecipe,
  onCookRecipe,
  onViewHistory,
  onViewFullDay,
  onSearchChange,
  onSearchResults,
}: RecipesTabProps) {
  if (isCreatingRecipe) {
    return (
      <RecipeCreator
        availableFoods={availableFoods}
        availableRecipes={recipes}
        onSave={onSaveRecipe}
        onCancel={onCancelCreate}
      />
    );
  }

  if (editingRecipe) {
    return (
      <RecipeEditor
        recipe={editingRecipe}
        availableFoods={availableFoods}
        availableRecipes={recipes.filter((r) => r.id !== editingRecipe.id)}
        onSave={onUpdateRecipe}
        onCancel={onCancelEdit}
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">My Recipes</h2>
        <button
          onClick={onCreateRecipe}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors relative z-10"
        >
          Create Recipe
        </button>
      </div>

      {/* Recipe search/filter - Always visible */}
      <RecipeSearch recipes={recipes} onSearchResults={onSearchResults} />

      {loadingRecipes ? (
        <RecipeListSkeleton />
      ) : recipes.length > 0 ? (
        <div>
          {/* Recipe list header */}
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Your Recipes
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                {filteredRecipes.length}{' '}
                {filteredRecipes.length === 1 ? 'recipe' : 'recipes'}
                {recipeSearchTerm && ` matching "${recipeSearchTerm}"`}
              </p>
            </div>
          </div>

          {/* Recipe grid */}
          {filteredRecipes.length === 0 ? (
            <NoSearchResultsEmptyState
              searchTerm={recipeSearchTerm}
              onClear={() => {
                onSearchChange({
                  target: { value: '' },
                } as React.ChangeEvent<HTMLInputElement>);
              }}
            />
          ) : filteredRecipes.length > 20 ? (
            // Use virtual scrolling for large lists
            <VirtualizedRecipeList
              recipes={filteredRecipes}
              isOwner={true}
              onEdit={onEditRecipe}
              onCook={onCookRecipe}
              onDelete={onDeleteRecipe}
              onViewHistory={onViewHistory}
              onViewFullDay={onViewFullDay}
            />
          ) : (
            // Use regular grid for smaller lists
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredRecipes.map((recipe) => (
                <RecipeCard
                  key={recipe.id}
                  recipe={recipe}
                  isOwner={true}
                  onEdit={() => {
                    onEditRecipe(recipe);
                  }}
                  onCook={onCookRecipe}
                  onDelete={() => {
                    onDeleteRecipe(recipe.id);
                  }}
                  onViewHistory={() => {
                    onViewHistory(recipe);
                  }}
                  onViewFullDay={() => {
                    onViewFullDay(recipe);
                  }}
                />
              ))}
            </div>
          )}

          {isGuest && (
            <div className="mt-8 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
              <p className="text-sm text-yellow-800 dark:text-yellow-200">
                Sign in to save your recipes and access them from any device
              </p>
            </div>
          )}
        </div>
      ) : recipeSearchTerm ? (
        <NoSearchResultsEmptyState
          searchTerm={recipeSearchTerm}
          onClear={() => {
            onSearchChange({
              target: { value: '' },
            } as React.ChangeEvent<HTMLInputElement>);
          }}
        />
      ) : (
        <NoRecipesEmptyState onCreate={onCreateRecipe} />
      )}
    </div>
  );
}
