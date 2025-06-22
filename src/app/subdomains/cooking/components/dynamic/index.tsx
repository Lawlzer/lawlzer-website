import dynamic from 'next/dynamic';

// Heavy components that should be loaded on demand
// RecipeCreator is a named export
export const RecipeCreator = dynamic(
  () =>
    import('../RecipeCreator').then((mod) => ({ default: mod.RecipeCreator })),
  {
    loading: () => <div className="animate-pulse h-96 bg-muted rounded-lg" />,
    ssr: false,
  }
);

// RecipeEditor is a named export
export const RecipeEditor = dynamic(
  () =>
    import('../RecipeEditor').then((mod) => ({ default: mod.RecipeEditor })),
  {
    loading: () => <div className="animate-pulse h-96 bg-muted rounded-lg" />,
    ssr: false,
  }
);

// BarcodeScanner is a default export
export const BarcodeScanner = dynamic(() => import('../BarcodeScanner'), {
  loading: () => <div className="animate-pulse h-64 bg-muted rounded-lg" />,
  ssr: false,
});

// MealPlanner is a named export
export const MealPlanner = dynamic(
  () => import('../MealPlanner').then((mod) => ({ default: mod.MealPlanner })),
  {
    loading: () => <div className="animate-pulse h-96 bg-muted rounded-lg" />,
  }
);

// FridgeManager is a named export
export const FridgeManager = dynamic(
  () =>
    import('../FridgeManager').then((mod) => ({ default: mod.FridgeManager })),
  {
    loading: () => <div className="animate-pulse h-96 bg-muted rounded-lg" />,
  }
);

// RecipeHistory is a named export
export const RecipeHistory = dynamic(
  () =>
    import('../RecipeHistory').then((mod) => ({ default: mod.RecipeHistory })),
  {
    loading: () => <div className="animate-pulse h-64 bg-muted rounded-lg" />,
  }
);

// IngredientAlternatives is a named export
export const IngredientAlternatives = dynamic(
  () =>
    import('../IngredientAlternatives').then((mod) => ({
      default: mod.IngredientAlternatives,
    })),
  {
    loading: () => <div className="animate-pulse h-48 bg-muted rounded-lg" />,
  }
);

// CookingMode is a named export
export const CookingMode = dynamic(
  () => import('../CookingMode').then((mod) => ({ default: mod.CookingMode })),
  {
    loading: () => <div className="animate-pulse h-screen bg-muted" />,
  }
);

// MultiDayView is a named export
export const MultiDayView = dynamic(
  () =>
    import('../MultiDayView').then((mod) => ({ default: mod.MultiDayView })),
  {
    loading: () => <div className="animate-pulse h-96 bg-muted rounded-lg" />,
  }
);

// NutritionChart is a named export
export const NutritionChart = dynamic(
  () =>
    import('../charts/NutritionChart').then((mod) => ({
      default: mod.NutritionChart,
    })),
  {
    loading: () => (
      <div className="animate-pulse h-64 w-64 bg-muted rounded-full mx-auto" />
    ),
  }
);
