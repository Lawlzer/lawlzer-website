'use client';

import type { Food } from '@prisma/client';
import React, { useState } from 'react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Card } from '../ui/Card';

import type {
  RecipeFormData,
  RecipeUpdateData,
  RecipeWithDetails,
} from '../../types/recipe.types';
import { RecipeCard } from '../RecipeCard';
import { RecipeCreator } from '../RecipeCreator';
import { RecipeEditor } from '../RecipeEditor';
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

export function ImprovedRecipesTab({
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
  const [filterType, setFilterType] = useState<'all' | 'favorites' | 'recent'>('all');
  const [sortBy, setSortBy] = useState<'name' | 'recent' | 'calories'>('recent');

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
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-cooking-neutral-900">My Recipes</h2>
          <p className="text-cooking-neutral-600 mt-1">
            {recipes.length} recipes in your collection
          </p>
        </div>
        <Button
          variant="primary"
          size="lg"
          onClick={onCreateRecipe}
          leftIcon={
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          }
        >
          Create Recipe
        </Button>
      </div>

      {/* Search and Filters */}
      <Card variant="elevated" className="p-6">
        <div className="space-y-4">
          <div className="relative">
            <Input
              type="text"
              placeholder="Search recipes by name or ingredient..."
              value={recipeSearchTerm}
              onChange={onSearchChange}
              variant="default"
              leftIcon={
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              }
              className="text-lg"
            />
          </div>

          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex gap-2">
              <Button
                variant={filterType === 'all' ? 'primary' : 'ghost'}
                size="sm"
                onClick={() => setFilterType('all')}
              >
                All Recipes
              </Button>
              <Button
                variant={filterType === 'favorites' ? 'primary' : 'ghost'}
                size="sm"
                onClick={() => setFilterType('favorites')}
              >
                Favorites
              </Button>
              <Button
                variant={filterType === 'recent' ? 'primary' : 'ghost'}
                size="sm"
                onClick={() => setFilterType('recent')}
              >
                Recent
              </Button>
            </div>

            <div className="ml-auto flex items-center gap-2">
              <span className="text-sm text-cooking-neutral-600">Sort by:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="px-3 py-1.5 text-sm border border-cooking-neutral-300 rounded-lg focus:ring-2 focus:ring-cooking-primary focus:border-cooking-primary"
              >
                <option value="recent">Most Recent</option>
                <option value="name">Name (A-Z)</option>
                <option value="calories">Calories</option>
              </select>
            </div>
          </div>
        </div>
      </Card>

      {/* Recipe Grid */}
      {loadingRecipes ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i} variant="elevated" className="h-96 animate-pulse">
              <div className="h-48 bg-cooking-neutral-200"></div>
              <div className="p-6 space-y-3">
                <div className="h-6 bg-cooking-neutral-200 rounded"></div>
                <div className="h-4 bg-cooking-neutral-200 rounded w-3/4"></div>
                <div className="h-4 bg-cooking-neutral-200 rounded w-1/2"></div>
              </div>
            </Card>
          ))}
        </div>
      ) : filteredRecipes.length === 0 ? (
        <Card variant="glass" className="p-12 text-center">
          <div className="max-w-md mx-auto">
            <div className="w-24 h-24 bg-cooking-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-12 h-12 text-cooking-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-cooking-neutral-900 mb-2">
              {recipeSearchTerm ? 'No recipes found' : 'No recipes yet'}
            </h3>
            <p className="text-cooking-neutral-600 mb-6">
              {recipeSearchTerm 
                ? `We couldn't find any recipes matching "${recipeSearchTerm}"`
                : 'Start building your recipe collection by creating your first recipe!'}
            </p>
            {recipeSearchTerm ? (
              <Button
                variant="outline"
                onClick={() => onSearchChange({ target: { value: '' } } as any)}
              >
                Clear Search
              </Button>
            ) : (
              <Button variant="primary" onClick={onCreateRecipe}>
                Create Your First Recipe
              </Button>
            )}
          </div>
        </Card>
      ) : filteredRecipes.length > 20 ? (
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredRecipes.map((recipe) => (
            <RecipeCard
              key={recipe.id}
              recipe={recipe}
              isOwner={true}
              onEdit={() => onEditRecipe(recipe)}
              onCook={onCookRecipe}
              onDelete={() => onDeleteRecipe(recipe.id)}
              onViewHistory={() => onViewHistory(recipe)}
              onViewFullDay={() => onViewFullDay(recipe)}
            />
          ))}
        </div>
      )}

      {/* Floating Action Button for Mobile */}
      <div className="fixed bottom-24 right-4 md:hidden">
        <Button
          variant="primary"
          size="lg"
          onClick={onCreateRecipe}
          className="rounded-full shadow-xl w-14 h-14 p-0"
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        </Button>
      </div>
    </div>
  );
}