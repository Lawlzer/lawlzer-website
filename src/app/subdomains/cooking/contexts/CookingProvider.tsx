'use client';

import type { ReactNode } from 'react';
import { createContext, useContext, useMemo, useState } from 'react';

import { useCreateDayEntry, useCreateFood, useCreateRecipe, useDays, useDeleteDayEntry, useDeleteRecipe, useFoods, useGoals, useRecipes, useUpdateGoals, useUpdateRecipe } from '../hooks/useCookingQueries';
import { useToast } from '../hooks/useToast';
import type { FoodProduct } from '../services/foodDatabase';
import type { RecipeFormData, RecipeUpdateData, RecipeWithDetails } from '../types/recipe.types';

// Temporary type for Day until properly typed in API
interface Day {
	id: string;
	date: string;
	targetCalories?: number;
	targetProtein?: number;
	targetCarbs?: number;
	targetFat?: number;
	targetFiber?: number;
	entries: {
		id: string;
		foodId?: string;
		recipeId?: string;
		amount: number;
		mealType: 'breakfast' | 'dinner' | 'lunch' | 'snack';
		calories: number;
		protein: number;
		carbs: number;
		fat: number;
		fiber: number;
		sugar: number;
		sodium: number;
	}[];
}

interface CookingContextType {
	// Data from queries
	foods: ReturnType<typeof useFoods>['data'];
	recipes: ReturnType<typeof useRecipes>['data'];
	days: ReturnType<typeof useDays>['data'];
	goals: ReturnType<typeof useGoals>['data'];

	// Loading states
	isLoadingFoods: boolean;
	isLoadingRecipes: boolean;
	isLoadingDays: boolean;
	isLoadingGoals: boolean;

	// Error states
	foodsError: Error | null;
	recipesError: Error | null;
	daysError: Error | null;
	goalsError: Error | null;

	// UI state
	selectedDate: Date;
	searchQuery: string;
	activeFilters: {
		visibility?: 'component' | 'private' | 'public';
		servings?: number;
		sortBy?: 'name' | 'newest' | 'oldest' | 'servings';
	};

	// UI actions
	setSelectedDate: (date: Date) => void;
	setSearchQuery: (query: string) => void;
	setFilters: (filters: CookingContextType['activeFilters']) => void;

	// Mutations
	createRecipe: (data: RecipeFormData) => Promise<RecipeWithDetails>;
	updateRecipe: (data: RecipeUpdateData) => Promise<void>;
	deleteRecipe: (id: string) => Promise<void>;
	saveFood: (data: FoodProduct) => Promise<void>;
	updateGoal: (
		data: Partial<{
			calories?: number;
			protein?: number;
			carbs?: number;
			fat?: number;
		}>
	) => Promise<void>;
	addDayEntry: (recipeId: string, servings: number) => Promise<void>;
	removeDayEntry: (entryId: string) => Promise<void>;

	// Computed values
	filteredRecipes: RecipeWithDetails[];
	currentDay: Day | null;
}

const CookingContext = createContext<CookingContextType | undefined>(undefined);

export function CookingProvider({ children }: { children: ReactNode }) {
	const toast = useToast();

	// Query hooks with error handling
	const { data: foods = [], isLoading: isLoadingFoods, error: foodsError } = useFoods();
	const { data: recipes = [], isLoading: isLoadingRecipes, error: recipesError } = useRecipes();
	const { data: days = [], isLoading: isLoadingDays, error: daysError } = useDays();
	const {
		data: goals = {
			calories: 2000,
			protein: 50,
			carbs: 250,
			fat: 65,
		},
		isLoading: isLoadingGoals,
		error: goalsError,
	} = useGoals();

	// Mutation hooks
	const createRecipeMutation = useCreateRecipe();
	const updateRecipeMutation = useUpdateRecipe();
	const deleteRecipeMutation = useDeleteRecipe();
	const createFoodMutation = useCreateFood();
	const updateGoalsMutation = useUpdateGoals();
	const createDayEntryMutation = useCreateDayEntry();
	const deleteDayEntryMutation = useDeleteDayEntry();

	// UI state
	const [selectedDate, setSelectedDate] = useState(new Date());
	const [searchQuery, setSearchQuery] = useState('');
	const [activeFilters, setFilters] = useState<CookingContextType['activeFilters']>({});

	// Computed values
	const currentDay = useMemo(() => {
		const found = (days as Day[]).find((d) => new Date(d.date).toDateString() === selectedDate.toDateString());
		return found ?? null;
	}, [days, selectedDate]);

	const filteredRecipes = useMemo(() => {
		let filtered = recipes;

		// Apply search query
		if (searchQuery !== '') {
			const query = searchQuery.toLowerCase();
			filtered = filtered.filter((recipe) => recipe.name.toLowerCase().includes(query) || recipe.description?.toLowerCase().includes(query));
		}

		// Apply filters
		if (activeFilters.visibility !== undefined) {
			filtered = filtered.filter((recipe) => recipe.visibility === activeFilters.visibility);
		}

		if (activeFilters.servings !== undefined && activeFilters.servings !== null) {
			filtered = filtered.filter((recipe) => recipe.servings === activeFilters.servings);
		}

		// Apply sorting
		if (activeFilters.sortBy !== undefined) {
			filtered = [...filtered].sort((a, b) => {
				switch (activeFilters.sortBy) {
					case 'name':
						return a.name.localeCompare(b.name);
					case 'newest':
						return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
					case 'oldest':
						return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
					case 'servings':
						return a.servings - b.servings;
					case undefined:
					default:
						return 0;
				}
			});
		}

		return filtered;
	}, [recipes, searchQuery, activeFilters]);

	// Mutation wrappers with toast notifications
	const createRecipe = async (data: RecipeFormData) => {
		try {
			const result = await createRecipeMutation.mutateAsync(data);
			toast.success('Recipe created successfully');
			return result;
		} catch (error) {
			toast.error(error instanceof Error ? error.message : 'Failed to create recipe');
			throw error;
		}
	};

	const updateRecipe = async (data: RecipeUpdateData) => {
		try {
			await updateRecipeMutation.mutateAsync(data);
			toast.success('Recipe updated successfully');
		} catch (error) {
			toast.error(error instanceof Error ? error.message : 'Failed to update recipe');
			throw error;
		}
	};

	const deleteRecipe = async (id: string) => {
		try {
			await deleteRecipeMutation.mutateAsync(id);
			toast.success('Recipe deleted successfully');
		} catch (error) {
			toast.error(error instanceof Error ? error.message : 'Failed to delete recipe');
			throw error;
		}
	};

	const saveFood = async (data: FoodProduct) => {
		try {
			await createFoodMutation.mutateAsync(data);
			toast.success('Food saved successfully');
		} catch (error) {
			toast.error(error instanceof Error ? error.message : 'Failed to save food');
			throw error;
		}
	};

	const updateGoal = async (
		data: Partial<{
			calories?: number;
			protein?: number;
			carbs?: number;
			fat?: number;
		}>
	) => {
		try {
			await updateGoalsMutation.mutateAsync(data);
			toast.success('Goal updated successfully');
		} catch (error) {
			toast.error(error instanceof Error ? error.message : 'Failed to update goal');
			throw error;
		}
	};

	const addDayEntry = async (recipeId: string, servings: number) => {
		try {
			const dateStr = selectedDate.toISOString().split('T')[0];
			await createDayEntryMutation.mutateAsync({
				date: dateStr,
				recipeId,
				servings,
			});
			toast.success('Entry added successfully');
		} catch (error) {
			toast.error(error instanceof Error ? error.message : 'Failed to add entry');
			throw error;
		}
	};

	const removeDayEntry = async (entryId: string) => {
		try {
			await deleteDayEntryMutation.mutateAsync(entryId);
			toast.success('Entry removed successfully');
		} catch (error) {
			toast.error(error instanceof Error ? error.message : 'Failed to remove entry');
			throw error;
		}
	};

	const value: CookingContextType = {
		// Data
		foods,
		recipes,
		days,
		goals,

		// Loading states
		isLoadingFoods,
		isLoadingRecipes,
		isLoadingDays,
		isLoadingGoals,

		// Error states
		foodsError: foodsError,
		recipesError: recipesError,
		daysError: daysError,
		goalsError: goalsError,

		// UI state
		selectedDate,
		searchQuery,
		activeFilters,

		// UI actions
		setSelectedDate,
		setSearchQuery,
		setFilters,

		// Mutations
		createRecipe,
		updateRecipe,
		deleteRecipe,
		saveFood,
		updateGoal,
		addDayEntry,
		removeDayEntry,

		// Computed values
		filteredRecipes,
		currentDay,
	};

	return <CookingContext.Provider value={value}>{children}</CookingContext.Provider>;
}

export function useCooking() {
	const context = useContext(CookingContext);
	if (!context) {
		throw new Error('useCooking must be used within a CookingProvider');
	}
	return context;
}
