'use client';

// Re-export everything from the React Query based CookingProvider
export * from './CookingProvider';

// Additional types that might be needed by components
export interface Goal {
  id: string;
  calories?: number;
  protein?: number;
  carbs?: number;
  fat?: number;
  userId?: string | null;
}

export interface DayEntry {
  id: string;
  recipeId: string;
  servings: number;
  recipe?: import('../types/recipe.types').RecipeWithDetails;
}

export interface DayWithEntries {
  id: string;
  date: Date;
  userId?: string | null;
  entries: DayEntry[];
}
