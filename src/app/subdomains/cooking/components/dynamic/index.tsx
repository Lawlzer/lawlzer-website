import dynamic from 'next/dynamic';

// Heavy components that should be loaded on demand
// RecipeCreator is a named export
export const RecipeCreator = dynamic(async () => import('../RecipeCreator').then((mod) => ({ default: mod.RecipeCreator })), {
	loading: () => <div className='animate-pulse h-96 bg-muted rounded-lg' />,
	ssr: false,
});

// RecipeEditor is a named export
export const RecipeEditor = dynamic(async () => import('../RecipeEditor').then((mod) => ({ default: mod.RecipeEditor })), {
	loading: () => <div className='animate-pulse h-96 bg-muted rounded-lg' />,
	ssr: false,
});

// BarcodeScanner is a default export
export const BarcodeScanner = dynamic(async () => import('../BarcodeScanner'), {
	loading: () => <div className='animate-pulse h-64 bg-muted rounded-lg' />,
	ssr: false,
});

// MealPlanner is a named export
export const MealPlanner = dynamic(async () => import('../MealPlanner').then((mod) => ({ default: mod.MealPlanner })), {
	loading: () => <div className='animate-pulse h-96 bg-muted rounded-lg' />,
});

// FridgeManager is a named export
export const FridgeManager = dynamic(async () => import('../FridgeManager').then((mod) => ({ default: mod.FridgeManager })), {
	loading: () => <div className='animate-pulse h-96 bg-muted rounded-lg' />,
});

// RecipeHistory is a named export
export const RecipeHistory = dynamic(async () => import('../RecipeHistory').then((mod) => ({ default: mod.RecipeHistory })), {
	loading: () => <div className='animate-pulse h-64 bg-muted rounded-lg' />,
});

// IngredientAlternatives is a named export
export const IngredientAlternatives = dynamic(
	async () =>
		import('../IngredientAlternatives').then((mod) => ({
			default: mod.IngredientAlternatives,
		})),
	{
		loading: () => <div className='animate-pulse h-48 bg-muted rounded-lg' />,
	}
);

// CookingMode is a named export
export const CookingMode = dynamic(async () => import('../CookingMode').then((mod) => ({ default: mod.CookingMode })), {
	loading: () => <div className='animate-pulse h-screen bg-muted' />,
});

// MultiDayView is a named export
export const MultiDayView = dynamic(async () => import('../MultiDayView').then((mod) => ({ default: mod.MultiDayView })), {
	loading: () => <div className='animate-pulse h-96 bg-muted rounded-lg' />,
});

// NutritionChart is a named export
export const NutritionChart = dynamic(
	async () =>
		import('../charts/NutritionChart').then((mod) => ({
			default: mod.NutritionChart,
		})),
	{
		loading: () => <div className='animate-pulse h-64 w-64 bg-muted rounded-full mx-auto' />,
	}
);
