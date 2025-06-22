'use client';

import { memo, useMemo } from 'react';

// Helper for creating deeply memoized components
export function createMemoizedComponent<P extends object>(
  Component: React.ComponentType<P>,
  propsAreEqual?: (prevProps: P, nextProps: P) => boolean
) {
  return memo(Component, propsAreEqual);
}

// Deep comparison function for complex objects
export function deepPropsAreEqual<P extends object>(
  prevProps: P,
  nextProps: P
): boolean {
  const keys1 = Object.keys(prevProps);
  const keys2 = Object.keys(nextProps);

  if (keys1.length !== keys2.length) {
    return false;
  }

  for (const key of keys1) {
    const val1 = prevProps[key as keyof P];
    const val2 = nextProps[key as keyof P];

    if (val1 !== val2) {
      if (typeof val1 === 'object' && typeof val2 === 'object') {
        if (!deepPropsAreEqual(val1 as any, val2 as any)) {
          return false;
        }
      } else {
        return false;
      }
    }
  }

  return true;
}

// Memoization hook for expensive computations
export function useMemoizedValue<T>(
  factory: () => T,
  deps: React.DependencyList,
  shouldUpdate?: (prev: T | undefined, next: T) => boolean
): T {
  const memoizedValue = useMemo(factory, deps);

  // Additional check if provided
  if (shouldUpdate) {
    const prevValue = useMemo(() => memoizedValue, []);
    if (shouldUpdate(prevValue, memoizedValue)) {
      return memoizedValue;
    }
    return prevValue;
  }

  return memoizedValue;
}

// Common memoization patterns for cooking app
export const memoPatterns = {
  // Memoize recipe filtering
  useFilteredRecipes: (
    recipes: any[],
    searchQuery: string,
    filters: Record<string, any>
  ) => {
    return useMemo(() => {
      if (!recipes) return [];

      let filtered = recipes;

      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        filtered = filtered.filter(
          (recipe) =>
            recipe.name?.toLowerCase().includes(query) ||
            recipe.description?.toLowerCase().includes(query)
        );
      }

      if (filters.visibility) {
        filtered = filtered.filter(
          (recipe) => recipe.visibility === filters.visibility
        );
      }

      if (filters.servings) {
        filtered = filtered.filter(
          (recipe) => recipe.servings === filters.servings
        );
      }

      return filtered;
    }, [recipes, searchQuery, filters]);
  },

  // Memoize nutrition calculations
  useNutritionTotals: (entries: any[], recipes: any[]) => {
    return useMemo(() => {
      if (!entries || !recipes) {
        return { calories: 0, protein: 0, carbs: 0, fat: 0 };
      }

      return entries.reduce(
        (acc, entry) => {
          const recipe = recipes.find((r) => r.id === entry.recipeId);
          if (recipe && recipe.nutrition) {
            const multiplier = entry.servings / recipe.servings;
            acc.calories += (recipe.nutrition.calories || 0) * multiplier;
            acc.protein += (recipe.nutrition.protein || 0) * multiplier;
            acc.carbs += (recipe.nutrition.carbs || 0) * multiplier;
            acc.fat += (recipe.nutrition.fat || 0) * multiplier;
          }
          return acc;
        },
        { calories: 0, protein: 0, carbs: 0, fat: 0 }
      );
    }, [entries, recipes]);
  },
};
