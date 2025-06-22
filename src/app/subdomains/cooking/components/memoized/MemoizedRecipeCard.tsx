'use client';

import React from 'react';

import type { RecipeWithDetails } from '../../types/recipe.types';
import { createMemoizedComponent } from '../../utils/memoization';
import { RecipeCard } from '../RecipeCard';

// Custom comparison function for RecipeCard props
const recipeCardPropsAreEqual = (
  prevProps: { recipe: RecipeWithDetails; [key: string]: any },
  nextProps: { recipe: RecipeWithDetails; [key: string]: any }
) => {
  // Check if recipe ID changed
  if (prevProps.recipe.id !== nextProps.recipe.id) {
    return false;
  }

  // Check if key recipe properties changed
  const keysToCheck = [
    'name',
    'description',
    'servings',
    'visibility',
    'updatedAt',
  ];
  for (const key of keysToCheck) {
    if (
      prevProps.recipe[key as keyof RecipeWithDetails] !==
      nextProps.recipe[key as keyof RecipeWithDetails]
    ) {
      return false;
    }
  }

  // Check if callbacks changed
  const callbackKeys = Object.keys(prevProps).filter(
    (key) => typeof prevProps[key] === 'function'
  );
  for (const key of callbackKeys) {
    if (prevProps[key] !== nextProps[key]) {
      return false;
    }
  }

  return true;
};

// Memoized RecipeCard
export const MemoizedRecipeCard = createMemoizedComponent(
  RecipeCard,
  recipeCardPropsAreEqual
);

// List wrapper that ensures callbacks are stable
interface RecipeListProps {
  recipes: RecipeWithDetails[];
  onEdit?: (recipe: RecipeWithDetails) => void;
  onDelete?: (id: string) => void;
  onView?: (recipe: RecipeWithDetails) => void;
  onViewFullDay?: (recipe: RecipeWithDetails) => void;
}

export const MemoizedRecipeList: React.FC<RecipeListProps> = React.memo(
  ({ recipes, onEdit, onDelete, onView, onViewFullDay }) => {
    // Stable callbacks using useCallback
    const handleEdit = React.useCallback(
      (recipe: RecipeWithDetails) => {
        onEdit?.(recipe);
      },
      [onEdit]
    );

    const handleDelete = React.useCallback(
      (id: string) => {
        onDelete?.(id);
      },
      [onDelete]
    );

    const handleView = React.useCallback(
      (recipe: RecipeWithDetails) => {
        onView?.(recipe);
      },
      [onView]
    );

    const handleViewFullDay = React.useCallback(
      (recipe: RecipeWithDetails) => {
        onViewFullDay?.(recipe);
      },
      [onViewFullDay]
    );

    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {recipes.map((recipe) => (
          <MemoizedRecipeCard
            key={recipe.id}
            recipe={recipe}
            onEdit={onEdit ? () => handleEdit(recipe) : undefined}
            onDelete={onDelete ? () => handleDelete(recipe.id) : undefined}
            onViewFullDay={() => handleViewFullDay(recipe)}
          />
        ))}
      </div>
    );
  }
);
