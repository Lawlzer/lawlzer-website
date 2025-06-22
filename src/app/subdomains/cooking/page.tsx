'use client';

import Head from 'next/head';
import { useSession } from 'next-auth/react';
import { Suspense } from 'react';

import { PageTransition } from './components/AnimatedWrapper';
import { CookingMode } from './components/CookingMode';
import { DayTracker } from './components/DayTracker';
import { ApiErrorBoundary, ErrorBoundary } from './components/ErrorBoundary';
import { FridgeManager } from './components/FridgeManager';
import { FullDayNutrition } from './components/FullDayNutrition';
import { GeneralUnitConverter } from './components/GeneralUnitConverter';
import { GoalsManager } from './components/GoalsManager';
import { GuestModeBanner } from './components/GuestModeBanner';
import { KeyboardShortcutsHelp } from './components/KeyboardShortcutsHelp';
import { MealPlanner } from './components/MealPlanner';
import { MultiDayView } from './components/MultiDayView';
import { RecipeHistory } from './components/RecipeHistory';
import { OverviewTab, RecipesTab, ScanTab, type TabId, TabNavigation } from './components/tabs';
import { ToastContainer } from './components/ToastContainer';
import { CookingProvider } from './contexts/CookingContext';
// Custom hooks
import { useCookingData } from './hooks/useCookingData';
import { useCookingUI } from './hooks/useCookingUI';
import { useGuestDataMigration } from './hooks/useGuestDataMigration';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import { useScanner } from './hooks/useScanner';
import { useToast } from './hooks/useToast';
import Loading from './loading';

function CookingPageContent() {
	const { data: session } = useSession();
	const _toast = useToast();

	// Use custom hooks for cleaner state management
	const { isGuest, isLoading, availableFoods, recipes, filteredRecipes, createFood, createRecipe, updateRecipe, deleteRecipe, revertRecipeVersion, searchRecipes } = useCookingData();

	const scanner = useScanner();

	const ui = useCookingUI();

	// Handle guest data migration
	useGuestDataMigration(isGuest);

	// Handle saving scanned food
	const handleSaveScannedFood = async () => {
		if (!scanner.scannedProduct) return;
		try {
			await createFood(scanner.scannedProduct);
			setTimeout(() => {
				scanner.clearProduct();
			}, 2000);
		} catch (error) {
			// Error handling is done in the hook
		}
	};

	// Tab navigation shortcuts
	const tabs: TabId[] = ['overview', 'scan', 'recipes', 'days', 'goals', 'analysis', 'planner', 'fridge', 'cooking'];

	// Setup keyboard shortcuts
	useKeyboardShortcuts([
		// Tab navigation with number keys
		...tabs.slice(0, 9).map((tab, index) => ({
			key: String(index + 1),
			handler: () => {
				ui.setActiveTab(tab);
			},
			description: `Switch to ${tab} tab`,
		})),
		// Create new recipe
		{
			key: 'n',
			ctrlKey: true,
			handler: () => {
				if (ui.activeTab === 'recipes' && !ui.isCreatingRecipe && !ui.editingRecipe) {
					ui.startCreatingRecipe();
				}
			},
			description: 'Create new recipe',
		},
		// Focus search
		{
			key: '/',
			ctrlKey: true,
			handler: () => {
				const searchInput = document.querySelector('input[placeholder*="Search"]');
				if (searchInput instanceof HTMLInputElement) {
					searchInput.focus();
				}
			},
			description: 'Focus search',
		},
		// Cancel/close dialogs
		{
			key: 'Escape',
			handler: ui.closeAllDialogs,
			description: 'Close dialogs/cancel actions',
		},
	]);

	// Page metadata
	const pageTitle = ui.editingRecipe !== null ? `${ui.editingRecipe.name} | Lawlzer's Cooking` : "Cooking & Nutrition | Lawlzer's Website";
	const pageDescription = ui.editingRecipe !== null ? (ui.editingRecipe.description ?? 'Edit recipe details') : 'Track your nutrition, create recipes, and manage your diet';

	return (
		<div className='min-h-screen bg-gray-50'>
			{session === null && <GuestModeBanner isGuest={true} />}

			<div className='container mx-auto p-4'>
				<Head>
					<title>{pageTitle}</title>
					<meta name='description' content={pageDescription} />
				</Head>

				<h1 className='mb-6 text-3xl font-bold text-gray-900'>Cooking & Nutrition Tracker</h1>

				<TabNavigation activeTab={ui.activeTab} onTabChange={ui.setActiveTab} />

				<div className='mt-6'>
					<ApiErrorBoundary>
						{ui.activeTab === 'overview' && (
							<PageTransition>
								<OverviewTab dailyCalories={{ current: 0, goal: 2000 }} dailyProtein={{ current: 0, goal: 50 }} recipeCount={recipes.length} loggedDays={0} />
							</PageTransition>
						)}

						{ui.activeTab === 'scan' && (
							<ScanTab
								isScanning={scanner.isScanning}
								isLoading={scanner.isLoading}
								scannedProduct={scanner.scannedProduct}
								scanError={scanner.scanError}
								isSaving={scanner.isSaving}
								saveStatus={null}
								onStartScan={scanner.startScan}
								onScan={(barcode) => {
									void scanner.handleScan(barcode);
								}}
								onSaveFood={() => {
									void handleSaveScannedFood();
								}}
								onCancelScan={scanner.cancelScan}
							/>
						)}

						{ui.activeTab === 'recipes' && (
							<RecipesTab
								isCreatingRecipe={ui.isCreatingRecipe}
								editingRecipe={ui.editingRecipe}
								recipes={recipes}
								filteredRecipes={filteredRecipes}
								recipeSearchTerm={ui.recipeSearchTerm}
								loadingRecipes={isLoading}
								availableFoods={availableFoods}
								isGuest={isGuest}
								onCreateRecipe={ui.startCreatingRecipe}
								onCancelCreate={ui.cancelCreatingRecipe}
								onSaveRecipe={createRecipe}
								onUpdateRecipe={updateRecipe}
								onCancelEdit={ui.cancelEditingRecipe}
								onEditRecipe={ui.startEditingRecipe}
								onDeleteRecipe={(recipeId) => {
									void deleteRecipe(recipeId);
								}}
								onCookRecipe={() => {
									ui.setActiveTab('cooking');
								}}
								onViewHistory={(recipe) => {
									ui.viewRecipeHistory(recipe);
								}}
								onViewFullDay={(recipe) => {
									ui.viewFullDayNutrition(recipe);
								}}
								onSearchChange={(e) => {
									ui.setRecipeSearchTerm(e.target.value);
									searchRecipes(e.target.value);
								}}
								onSearchResults={() => undefined} // Not needed with new approach
							/>
						)}

						{ui.activeTab === 'days' && <DayTracker isGuest={isGuest} availableFoods={availableFoods} availableRecipes={recipes} />}

						{ui.activeTab === 'goals' && <GoalsManager isGuest={isGuest} />}

						{ui.activeTab === 'analysis' && <MultiDayView />}

						{ui.activeTab === 'planner' && <MealPlanner isGuest={isGuest} availableFoods={availableFoods} availableRecipes={recipes} />}

						{ui.activeTab === 'fridge' && <FridgeManager availableFoods={availableFoods} isGuest={isGuest} />}

						{ui.activeTab === 'cooking' && <CookingMode recipes={recipes} isGuest={isGuest} />}

						{ui.activeTab === 'tools' && <GeneralUnitConverter />}
					</ApiErrorBoundary>
				</div>

				{/* Modals */}
				{ui.viewingHistoryRecipe !== null && (
					<RecipeHistory
						recipeId={ui.viewingHistoryRecipe.id}
						currentVersionId={ui.viewingHistoryRecipe.currentVersionId}
						onClose={ui.closeRecipeHistory}
						onRevert={(versionId) => {
							if (ui.viewingHistoryRecipe) {
								void revertRecipeVersion(ui.viewingHistoryRecipe.id, versionId);
							}
						}}
					/>
				)}

				{ui.viewingFullDayRecipe && <FullDayNutrition recipe={ui.viewingFullDayRecipe} onClose={ui.closeFullDayNutrition} />}

				{/* Keyboard shortcuts help */}
				<KeyboardShortcutsHelp />

				{/* Toast notifications */}
				<ToastContainer />
			</div>
		</div>
	);
}

export default function CookingPage() {
	return (
		<ErrorBoundary>
			<CookingProvider>
				<Suspense fallback={<Loading />}>
					<CookingPageContent />
				</Suspense>
			</CookingProvider>
		</ErrorBoundary>
	);
}
