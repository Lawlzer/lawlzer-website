import { useCallback, useState } from 'react';

import type { TabId } from '../components/tabs';
import type { RecipeWithDetails } from '../types/recipe.types';

interface UseCookingUIReturn {
	// Tab state
	activeTab: TabId;
	setActiveTab: (tab: TabId) => void;

	// Recipe UI state
	isCreatingRecipe: boolean;
	editingRecipe: RecipeWithDetails | null;
	viewingHistoryRecipe: RecipeWithDetails | null;
	viewingFullDayRecipe: RecipeWithDetails | null;
	recipeSearchTerm: string;

	// Recipe UI actions
	startCreatingRecipe: () => void;
	cancelCreatingRecipe: () => void;
	startEditingRecipe: (recipe: RecipeWithDetails) => void;
	cancelEditingRecipe: () => void;
	viewRecipeHistory: (recipe: RecipeWithDetails) => void;
	closeRecipeHistory: () => void;
	viewFullDayNutrition: (recipe: RecipeWithDetails) => void;
	closeFullDayNutrition: () => void;
	setRecipeSearchTerm: (term: string) => void;

	// Generic modal/dialog close
	closeAllDialogs: () => void;
}

export function useCookingUI(): UseCookingUIReturn {
	// Tab state
	const [activeTab, setActiveTab] = useState<TabId>('overview');

	// Recipe UI state
	const [isCreatingRecipe, setIsCreatingRecipe] = useState(false);
	const [editingRecipe, setEditingRecipe] = useState<RecipeWithDetails | null>(null);
	const [viewingHistoryRecipe, setViewingHistoryRecipe] = useState<RecipeWithDetails | null>(null);
	const [viewingFullDayRecipe, setViewingFullDayRecipe] = useState<RecipeWithDetails | null>(null);
	const [recipeSearchTerm, setRecipeSearchTerm] = useState('');

	// Recipe UI actions
	const startCreatingRecipe = useCallback(() => {
		setIsCreatingRecipe(true);
		setEditingRecipe(null);
	}, []);

	const cancelCreatingRecipe = useCallback(() => {
		setIsCreatingRecipe(false);
	}, []);

	const startEditingRecipe = useCallback((recipe: RecipeWithDetails) => {
		setEditingRecipe(recipe);
		setIsCreatingRecipe(false);
	}, []);

	const cancelEditingRecipe = useCallback(() => {
		setEditingRecipe(null);
	}, []);

	const viewRecipeHistory = useCallback((recipe: RecipeWithDetails) => {
		setViewingHistoryRecipe(recipe);
	}, []);

	const closeRecipeHistory = useCallback(() => {
		setViewingHistoryRecipe(null);
	}, []);

	const viewFullDayNutrition = useCallback((recipe: RecipeWithDetails) => {
		setViewingFullDayRecipe(recipe);
	}, []);

	const closeFullDayNutrition = useCallback(() => {
		setViewingFullDayRecipe(null);
	}, []);

	const closeAllDialogs = useCallback(() => {
		setIsCreatingRecipe(false);
		setEditingRecipe(null);
		setViewingHistoryRecipe(null);
		setViewingFullDayRecipe(null);
	}, []);

	return {
		// Tab state
		activeTab,
		setActiveTab,

		// Recipe UI state
		isCreatingRecipe,
		editingRecipe,
		viewingHistoryRecipe,
		viewingFullDayRecipe,
		recipeSearchTerm,

		// Recipe UI actions
		startCreatingRecipe,
		cancelCreatingRecipe,
		startEditingRecipe,
		cancelEditingRecipe,
		viewRecipeHistory,
		closeRecipeHistory,
		viewFullDayNutrition,
		closeFullDayNutrition,
		setRecipeSearchTerm,
		closeAllDialogs,
	};
}
