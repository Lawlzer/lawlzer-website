'use client';

import type { Food } from '@prisma/client';
import dynamic from 'next/dynamic';
import Head from 'next/head';
import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import { useCallback } from 'react';

import { CookingMode } from './components/CookingMode';
import { DayTracker } from './components/DayTracker';
import { GoalsManager } from './components/GoalsManager';
import { GuestModeBanner } from './components/GuestModeBanner';
import { CalendarIcon, CameraIcon, ChefHatIcon, GoalIcon, HomeIcon, UtensilsIcon } from './components/Icons';
import { RecipeCard } from './components/RecipeCard';
import { RecipeCreator } from './components/RecipeCreator';
import { RecipeEditor } from './components/RecipeEditor';
import { RecipeHistory } from './components/RecipeHistory';
import { useGuestDataMigration } from './hooks/useGuestDataMigration';
import type { FoodProduct } from './services/foodDatabase';
import { fetchFoodByBarcode } from './services/foodDatabase';
import { addGuestFood, addGuestRecipe, getGuestFoods, getGuestRecipes, hasGuestData } from './services/guestStorage';
import type { RecipeWithDetails } from './types/recipe.types';

// Dynamically import BarcodeScanner to avoid SSR issues
const BarcodeScanner = dynamic(async () => import('./components/BarcodeScanner'), {
	ssr: false,
});

export default function CookingPage() {
	const [activeTab, setActiveTab] = useState<'cooking' | 'days' | 'goals' | 'history' | 'overview' | 'recipes' | 'scan'>('overview');
	const [isScanning, setIsScanning] = useState(false);
	const [scannedProduct, setScannedProduct] = useState<FoodProduct | null>(null);
	const [scanError, setScanError] = useState<string | null>(null);
	const [isLoading, setIsLoading] = useState(false);
	const [isSaving, setIsSaving] = useState(false);
	const [saveStatus, setSaveStatus] = useState<{ type: 'error' | 'success'; message: string } | null>(null);
	const [isGuest, setIsGuest] = useState(false);
	const [isCreatingRecipe, setIsCreatingRecipe] = useState(false);
	const [editingRecipe, setEditingRecipe] = useState<RecipeWithDetails | null>(null);
	const [viewingHistoryRecipe, setViewingHistoryRecipe] = useState<RecipeWithDetails | null>(null);
	const [availableFoods, setAvailableFoods] = useState<Food[]>([]);
	const [recipes, setRecipes] = useState<RecipeWithDetails[]>([]);
	const [filteredRecipes, setFilteredRecipes] = useState<RecipeWithDetails[]>([]);
	const [recipeSearchTerm, setRecipeSearchTerm] = useState('');
	const [loadingRecipes, setLoadingRecipes] = useState(false);

	// Check if user is logged in
	useEffect(() => {
		const checkAuthStatus = async () => {
			try {
				const response = await fetch('/api/auth/session');
				const data = await response.json();
				setIsGuest(!data.user);
			} catch (error) {
				setIsGuest(true);
			}
		};

		void checkAuthStatus();
	}, []);

	// Check for guest data
	useEffect(() => {
		if (isGuest) {
			// Check for guest data when status changes
			hasGuestData();
		}
	}, [isGuest, saveStatus]);

	// Handle guest data migration
	const migrationStatus = useGuestDataMigration(isGuest);

	// Fetch available foods for recipe creation
	useEffect(() => {
		const fetchFoods = async () => {
			if (isGuest) {
				// Convert guest foods to the Food type format
				const guestFoodsList = getGuestFoods();
				const convertedFoods: Food[] = guestFoodsList.map((food) => ({
					id: food.guestId ?? '',
					userId: '',
					barcode: food.barcode,
					name: food.name,
					brand: food.brand,
					calories: food.calories,
					protein: food.protein,
					carbs: food.carbs,
					fat: food.fat,
					fiber: food.fiber,
					sugar: food.sugar,
					sodium: food.sodium,
					saturatedFat: food.saturatedFat,
					transFat: food.transFat,
					cholesterol: food.cholesterol,
					potassium: food.potassium,
					vitaminA: food.vitaminA,
					vitaminC: food.vitaminC,
					calcium: food.calcium,
					iron: food.iron,
					imageUrl: food.imageUrl,
					defaultServingSize: food.defaultServingSize,
					defaultServingUnit: food.defaultServingUnit,
					isPublic: food.isPublic,
					createdAt: new Date(),
					updatedAt: new Date(),
				}));
				setAvailableFoods(convertedFoods);
			} else {
				try {
					const response = await fetch('/api/cooking/foods');
					if (response.ok) {
						const data = await response.json();
						setAvailableFoods(data.foods);
					}
				} catch (error) {
					console.error('Error fetching foods:', error);
				}
			}
		};

		void fetchFoods();
	}, [isGuest, saveStatus]);

	// Fetch user's recipes
	useEffect(() => {
		const fetchRecipes = async () => {
			setLoadingRecipes(true);
			try {
				if (isGuest) {
					// Convert guest recipes to RecipeWithDetails format
					const guestRecipes = getGuestRecipes();
					const convertedRecipes: RecipeWithDetails[] = guestRecipes.map((recipe) => ({
						id: recipe.guestId,
						userId: '',
						name: recipe.name,
						description: recipe.description ?? null,
						notes: recipe.notes ?? null,
						prepTime: recipe.prepTime ?? null,
						cookTime: recipe.cookTime ?? null,
						servings: recipe.servings,
						visibility: 'private',
						imageUrl: null,
						createdAt: new Date(recipe.createdAt),
						updatedAt: new Date(recipe.updatedAt),
						currentVersionId: null,
						currentVersion: null,
						versions: [],
					}));
					setRecipes(convertedRecipes);
					setFilteredRecipes(convertedRecipes);
				} else {
					const response = await fetch('/api/cooking/recipes');
					if (response.ok) {
						const data = await response.json();
						// Set recipes directly from API response
						setRecipes(data);
						setFilteredRecipes(data);
					}
				}
			} catch (error) {
				console.error('Error fetching recipes:', error);
			} finally {
				setLoadingRecipes(false);
			}
		};

		void fetchRecipes();
	}, [isGuest, saveStatus]);

	const tabs = [
		{ id: 'overview', label: 'Overview', icon: <HomeIcon /> },
		{ id: 'scan', label: 'Scan', icon: <CameraIcon /> },
		{ id: 'recipes', label: 'Recipes', icon: <UtensilsIcon /> },
		{ id: 'days', label: 'Days', icon: <CalendarIcon /> },
		{ id: 'goals', label: 'Goals', icon: <GoalIcon /> },
		{ id: 'cooking', label: 'Cook', icon: <ChefHatIcon /> },
	];

	const handleBarcodeScan = async (barcode: string) => {
		setIsScanning(false);
		setIsLoading(true);
		setScanError(null);
		setSaveStatus(null);

		const product = await fetchFoodByBarcode(barcode);

		if (product) {
			setScannedProduct(product);
		} else {
			setScanError('Product not found. Try scanning another barcode.');
		}

		setIsLoading(false);
	};

	const saveFoodToDatabase = async () => {
		if (!scannedProduct) return;

		setIsSaving(true);
		setSaveStatus(null);

		try {
			if (isGuest) {
				// Save to cookies for guest users
				addGuestFood({
					guestId: crypto.randomUUID(),
					createdAt: new Date().toISOString(),
					updatedAt: new Date().toISOString(),
					barcode: scannedProduct.barcode,
					name: scannedProduct.name,
					brand: scannedProduct.brand ?? null,
					calories: scannedProduct.nutrition.calories,
					protein: scannedProduct.nutrition.protein,
					carbs: scannedProduct.nutrition.carbs,
					fat: scannedProduct.nutrition.fat,
					fiber: scannedProduct.nutrition.fiber,
					sugar: scannedProduct.nutrition.sugar,
					sodium: scannedProduct.nutrition.sodium,
					saturatedFat: scannedProduct.nutrition.saturatedFat ?? null,
					transFat: scannedProduct.nutrition.transFat ?? null,
					cholesterol: scannedProduct.nutrition.cholesterol ?? null,
					potassium: 0,
					vitaminA: 0,
					vitaminC: 0,
					calcium: 0,
					iron: 0,
					imageUrl: scannedProduct.imageUrl ?? null,
					defaultServingSize: 100,
					defaultServingUnit: 'g',
					visibility: 'private',
				});

				setSaveStatus({
					type: 'success',
					message: 'Food saved locally! Sign in to sync across devices.',
				});

				// Clear the scanned product after a short delay
				setTimeout(() => {
					setScannedProduct(null);
					setSaveStatus(null);
				}, 3000);
			} else {
				// Save to database for logged-in users
				const response = await fetch('/api/cooking/foods', {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json',
					},
					body: JSON.stringify(scannedProduct),
				});

				const data = await response.json();

				if (!response.ok) {
					setSaveStatus({
						type: 'error',
						message: data.error || 'Failed to save food',
					});
				} else {
					setSaveStatus({
						type: 'success',
						message: 'Food saved successfully!',
					});
					// Clear the scanned product after a short delay
					setTimeout(() => {
						setScannedProduct(null);
						setSaveStatus(null);
					}, 2000);
				}
			}
		} catch (error) {
			setSaveStatus({
				type: 'error',
				message: 'Network error. Please try again.',
			});
		} finally {
			setIsSaving(false);
		}
	};

	const handleSaveRecipe = async (recipeData: any) => {
		if (isGuest) {
			// Save to guest storage
			const guestRecipe = addGuestRecipe({
				name: recipeData.name,
				description: recipeData.description || null,
				notes: recipeData.notes || null,
				prepTime: recipeData.prepTime,
				cookTime: recipeData.cookTime,
				servings: recipeData.servings,
				items: recipeData.items,
			});

			// Convert to RecipeWithDetails format
			const newRecipe: RecipeWithDetails = {
				id: guestRecipe.guestId,
				userId: '',
				name: guestRecipe.name,
				description: guestRecipe.description ?? null,
				notes: guestRecipe.notes ?? null,
				prepTime: guestRecipe.prepTime ?? null,
				cookTime: guestRecipe.cookTime ?? null,
				servings: guestRecipe.servings,
				visibility: 'private',
				imageUrl: null,
				createdAt: new Date(guestRecipe.createdAt),
				updatedAt: new Date(guestRecipe.updatedAt),
				currentVersionId: null,
				currentVersion: null,
				versions: [],
			};

			setRecipes([...recipes, newRecipe]);
			setFilteredRecipes([...filteredRecipes, newRecipe]);
			setIsCreatingRecipe(false);

			// Trigger re-render of guest data count
			setSaveStatus({
				type: 'success',
				message: 'Recipe saved locally! Sign in to sync across devices.',
			});
			setTimeout(() => {
				setSaveStatus(null);
			}, 3000);
		} else {
			const response = await fetch('/api/cooking/recipes', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify(recipeData),
			});

			if (!response.ok) {
				const error = await response.json();
				throw new Error(error.error || 'Failed to save recipe');
			}

			const data = await response.json();
			setRecipes([...recipes, data]);
			setFilteredRecipes([...filteredRecipes, data]);
			setIsCreatingRecipe(false);
		}
	};

	const handleUpdateRecipe = async (recipeData: any): Promise<void> => {
		const response = await fetch('/api/cooking/recipes', {
			method: 'PUT',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify(recipeData),
		});

		if (!response.ok) {
			const error = await response.json();
			throw new Error(error.error || 'Failed to update recipe');
		}

		const data: RecipeWithDetails = await response.json();

		// Update the recipe in the list
		setRecipes(recipes.map((r) => (r.id === data.id ? data : r)));
		setFilteredRecipes(filteredRecipes.map((r) => (r.id === data.id ? data : r)));
		setEditingRecipe(null);
	};

	const handleRevertRecipeVersion = async (versionId: string) => {
		if (!viewingHistoryRecipe) return;

		try {
			// Call API to revert to this version (creates a new version with old data)
			const response = await fetch(`/api/cooking/recipes/${viewingHistoryRecipe.id}/revert`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({ versionId }),
			});

			if (!response.ok) {
				throw new Error('Failed to revert recipe version');
			}

			const updatedRecipe = await response.json();

			// Update the recipe in the list
			setRecipes(recipes.map((r) => (r.id === updatedRecipe.id ? updatedRecipe : r)));
			setFilteredRecipes(filteredRecipes.map((r) => (r.id === updatedRecipe.id ? updatedRecipe : r)));
			setViewingHistoryRecipe(null);
		} catch (error) {
			console.error('Error reverting recipe version:', error);
			// TODO: Show error message to user
		}
	};

	const pageTitle = editingRecipe ? `${editingRecipe.name} | Lawlzer's Cooking` : "Cooking & Nutrition | Lawlzer's Website";
	const pageDescription = editingRecipe ? (editingRecipe.description ?? 'Edit recipe details') : 'Track your nutrition, create recipes, and manage your diet';

	const handleImportRecipe = async (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (!file) return;

		const reader = new FileReader();
		reader.onload = async (event) => {
			try {
				const content = event.target?.result;
				if (typeof content !== 'string') return;
				const data = JSON.parse(content);

				const response = await fetch('/api/cooking/import', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify(data),
				});

				if (!response.ok) {
					const error = await response.json();
					console.error('Import failed:', error);
					// TODO: Show error to user
					return;
				}

				const newRecipe = await response.json();
				setRecipes((prev) => [...prev, newRecipe]);
				setFilteredRecipes((prev) => [...prev, newRecipe]);
			} catch (error) {
				console.error('Error importing recipe:', error);
				// TODO: Show error to user
			}
		};
		reader.readAsText(file);
	};

	return (
		<div className='space-y-6'>
			<Head>
				<title>{pageTitle}</title>
				<meta name='description' content={pageDescription} />
			</Head>
			{/* Header */}
			<div className='flex items-center justify-between'>
				<div>
					<h1 className='text-3xl font-bold tracking-tight'>Cooking & Nutrition</h1>
					<p className='text-gray-600 dark:text-gray-400'>Track your nutrition, create recipes, and manage your diet</p>
				</div>
			</div>

			{/* Migration Status */}
			{(migrationStatus.isMigrating || migrationStatus.migrationComplete) && (
				<div className={`rounded-lg border p-4 ${migrationStatus.migrationComplete ? 'border-green-500 bg-green-50 dark:bg-green-950/20' : 'border-blue-500 bg-blue-50 dark:bg-blue-950/20'}`}>
					{migrationStatus.isMigrating ? (
						<div className='flex items-center'>
							<div className='animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500 mr-3'></div>
							<p className='text-sm font-medium'>Migrating your guest data to your account...</p>
						</div>
					) : migrationStatus.migrationComplete && migrationStatus.results ? (
						<div>
							<p className='text-sm font-medium text-green-700 dark:text-green-400'>
								✓ Successfully migrated {migrationStatus.results.foods.migrated} food{migrationStatus.results.foods.migrated !== 1 ? 's' : ''} to your account!
							</p>
						</div>
					) : null}
				</div>
			)}

			{/* Guest Mode Banner - now persistent and floating */}
			<GuestModeBanner isGuest={isGuest} />

			{/* Main Navigation Tabs */}
			<div className='space-y-4'>
				{/* Tab List */}
				<div className='grid grid-cols-3 sm:grid-cols-6 gap-2 border-b'>
					{tabs.map((tab) => (
						<button
							key={tab.id}
							onClick={() => {
								setActiveTab(tab.id as 'cooking' | 'days' | 'goals' | 'history' | 'overview' | 'recipes' | 'scan');
							}}
							className={`flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium transition-colors border-b-2 ${activeTab === tab.id ? 'border-blue-500 text-blue-600 dark:text-blue-400' : 'border-transparent text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100'}`}
						>
							{tab.icon}
							<span className='hidden sm:inline'>{tab.label}</span>
						</button>
					))}
				</div>

				{/* Tab Content */}
				<div className='min-h-[400px]'>
					{/* Overview Tab */}
					{activeTab === 'overview' && (
						<div className='grid gap-4 md:grid-cols-2 lg:grid-cols-4'>
							<div className='rounded-lg border p-4'>
								<div className='flex items-center justify-between mb-2'>
									<h3 className='text-sm font-medium'>Today&apos;s Calories</h3>
									<ChefHatIcon />
								</div>
								<div className='text-2xl font-bold'>0 / 2000</div>
								<p className='text-xs text-gray-600 dark:text-gray-400'>0% of daily goal</p>
							</div>
							<div className='rounded-lg border p-4'>
								<h3 className='text-sm font-medium mb-2'>Protein</h3>
								<div className='text-2xl font-bold'>0g / 50g</div>
								<p className='text-xs text-gray-600 dark:text-gray-400'>0% of daily goal</p>
							</div>
							<div className='rounded-lg border p-4'>
								<div className='flex items-center justify-between mb-2'>
									<h3 className='text-sm font-medium'>My Recipes</h3>
									<UtensilsIcon />
								</div>
								<div className='text-2xl font-bold'>0</div>
								<p className='text-xs text-gray-600 dark:text-gray-400'>Create your first recipe</p>
							</div>
							<div className='rounded-lg border p-4'>
								<div className='flex items-center justify-between mb-2'>
									<h3 className='text-sm font-medium'>Logged Days</h3>
									<CalendarIcon />
								</div>
								<div className='text-2xl font-bold'>0</div>
								<p className='text-xs text-gray-600 dark:text-gray-400'>Start tracking today</p>
							</div>
						</div>
					)}

					{/* Scan Tab */}
					{activeTab === 'scan' && (
						<div className='space-y-4'>
							<div className='rounded-lg border p-6'>
								<h2 className='text-xl font-bold mb-2'>Barcode Scanner</h2>
								<p className='text-gray-600 dark:text-gray-400 mb-6'>Scan a food product barcode to quickly add nutrition information</p>

								{!isScanning && !isLoading && !scannedProduct && (
									<div className='flex flex-col items-center space-y-4'>
										<div className='h-64 w-full max-w-md rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-700 flex items-center justify-center'>
											<p className='text-gray-500'>Click below to start scanning</p>
										</div>
										<button
											onClick={() => {
												setIsScanning(true);
												setScannedProduct(null);
												setScanError(null);
											}}
											className='px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-2'
										>
											<CameraIcon />
											Start Scanning
										</button>
										{scanError != null && scanError !== '' && <p className='text-red-500 text-sm'>{scanError}</p>}
									</div>
								)}

								{isScanning && <BarcodeScanner onScan={(barcode) => void handleBarcodeScan(barcode)} isActive={isScanning} />}

								{isLoading && (
									<div className='flex flex-col items-center justify-center py-10'>
										<div className='animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500'></div>
										<p className='mt-4 text-gray-600 dark:text-gray-400'>Looking up product...</p>
									</div>
								)}
							</div>

							{scannedProduct && (
								<div className='rounded-lg border p-6'>
									<h3 className='text-lg font-bold mb-4'>Scanned Product</h3>
									<div className='space-y-4'>
										<div>
											<h4 className='font-semibold'>{scannedProduct.name}</h4>
											{scannedProduct.brand != null && scannedProduct.brand !== '' && <p className='text-sm text-gray-600 dark:text-gray-400'>{scannedProduct.brand}</p>}
											<p className='text-xs text-gray-500 mt-1'>Barcode: {scannedProduct.barcode}</p>
										</div>

										<div className='grid grid-cols-2 gap-4'>
											<div className='space-y-2'>
												<h5 className='font-medium'>Nutrition per 100g:</h5>
												<div className='text-sm space-y-1'>
													<p>Calories: {scannedProduct.nutrition.calories.toFixed(0)} kcal</p>
													<p>Protein: {scannedProduct.nutrition.protein.toFixed(1)}g</p>
													<p>Carbs: {scannedProduct.nutrition.carbs.toFixed(1)}g</p>
													<p>Fat: {scannedProduct.nutrition.fat.toFixed(1)}g</p>
												</div>
											</div>
											<div className='space-y-2'>
												<h5 className='font-medium'>Additional:</h5>
												<div className='text-sm space-y-1'>
													<p>Fiber: {scannedProduct.nutrition.fiber.toFixed(1)}g</p>
													<p>Sugar: {scannedProduct.nutrition.sugar.toFixed(1)}g</p>
													<p>Sodium: {scannedProduct.nutrition.sodium.toFixed(0)}mg</p>
												</div>
											</div>
										</div>

										<div className='flex gap-2 mt-4'>
											<button className='px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50' onClick={() => void saveFoodToDatabase()} disabled={isSaving}>
												{isSaving ? 'Saving...' : 'Save to My Foods'}
											</button>
											<button
												onClick={() => {
													setScannedProduct(null);
													setScanError(null);
													setSaveStatus(null);
												}}
												className='px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors'
											>
												Scan Another
											</button>
										</div>
										{saveStatus && <div className={`mt-4 p-3 rounded-lg ${saveStatus.type === 'success' ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'}`}>{saveStatus.message}</div>}
									</div>
								</div>
							)}
						</div>
					)}

					{/* Recipes Tab - show recipe management */}
					{activeTab === 'recipes' && (
						<div className='space-y-4'>
							{!isCreatingRecipe && !editingRecipe ? (
								<>
									<div className='flex items-center justify-between'>
										<h2 className='text-2xl font-bold'>My Recipes</h2>
										<button
											onClick={() => {
												setIsCreatingRecipe(true);
											}}
											className='px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors'
										>
											Create Recipe
										</button>
									</div>

									{loadingRecipes ? (
										<div className='flex justify-center py-8'>
											<div className='animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500'></div>
										</div>
									) : recipes.length > 0 ? (
										<div>
											{/* Recipe list header */}
											<div className='flex justify-between items-center mb-6'>
												<div>
													<h3 className='text-lg font-semibold text-gray-900 dark:text-gray-100'>Your Recipes</h3>
													<p className='text-sm text-gray-600 dark:text-gray-400 mt-1'>
														{recipes.length} {recipes.length === 1 ? 'recipe' : 'recipes'}
													</p>
												</div>
												<button
													onClick={() => {
														setIsCreatingRecipe(true);
													}}
													className='px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-2'
												>
													<svg className='w-5 h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
														<path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M12 4v16m8-8H4' />
													</svg>
													Create Recipe
												</button>
											</div>

											{/* Recipe search/filter */}
											{recipes.length > 0 && (
												<div className='mb-4'>
													<div className='flex gap-2'>
														<input
															type='text'
															placeholder='Search recipes...'
															className='w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100'
															value={recipeSearchTerm}
															onChange={(e) => {
																const search = e.target.value.toLowerCase();
																setRecipeSearchTerm(e.target.value);
																const filtered = recipes.filter((r) => r.name.toLowerCase().includes(search) || r.description?.toLowerCase().includes(search));
																setFilteredRecipes(filtered);
															}}
														/>
														<a href='/subdomains/cooking/search' className='px-4 py-2 border rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800'>
															Advanced
														</a>
													</div>
												</div>
											)}

											{/* Recipe grid */}
											{recipes.length === 0 ? (
												<div className='text-center py-12'>
													<svg className='w-16 h-16 mx-auto text-gray-400 mb-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
														<path strokeLinecap='round' strokeLinejoin='round' strokeWidth={1.5} d='M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2' />
													</svg>
													<h3 className='text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2'>No recipes yet</h3>
													<p className='text-gray-600 dark:text-gray-400 mb-6'>Create your first recipe to start building your cookbook</p>
													<button
														onClick={() => {
															setIsCreatingRecipe(true);
														}}
														className='px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors'
													>
														Create Your First Recipe
													</button>
												</div>
											) : (
												<div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
													{filteredRecipes.map((recipe) => (
														<RecipeCard
															key={recipe.id}
															recipe={recipe}
															isOwner={true}
															onEdit={() => {
																setEditingRecipe(recipe);
															}}
															onCook={() => {
																setActiveTab('cooking');
																// You could add state to select this recipe in cooking mode
															}}
															onDelete={async () => {
																try {
																	const response = await fetch(`/api/cooking/recipes?id=${recipe.id}`, {
																		method: 'DELETE',
																	});
																	if (response.ok) {
																		setRecipes(recipes.filter((r) => r.id !== recipe.id));
																		setFilteredRecipes(filteredRecipes.filter((r) => r.id !== recipe.id));
																	}
																} catch (error) {
																	console.error('Failed to delete recipe:', error);
																}
															}}
															onViewHistory={() => {
																setViewingHistoryRecipe(recipe);
															}}
														/>
													))}
												</div>
											)}

											{isGuest && (
												<div className='mt-8 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg'>
													<p className='text-sm text-yellow-800 dark:text-yellow-200'>Sign in to save your recipes and access them from any device</p>
												</div>
											)}
										</div>
									) : (
										<div className='text-center py-12'>
											<svg className='w-16 h-16 mx-auto text-gray-400 mb-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
												<path strokeLinecap='round' strokeLinejoin='round' strokeWidth={1.5} d='M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2' />
											</svg>
											<h3 className='text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2'>No recipes yet</h3>
											<p className='text-gray-600 dark:text-gray-400 mb-6'>Create your first recipe to start building your cookbook</p>
											<button
												onClick={() => {
													setIsCreatingRecipe(true);
												}}
												className='px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors'
											>
												Create Your First Recipe
											</button>
										</div>
									)}
								</>
							) : isCreatingRecipe ? (
								<RecipeCreator
									availableFoods={availableFoods}
									availableRecipes={recipes}
									onSave={handleSaveRecipe}
									onCancel={() => {
										setIsCreatingRecipe(false);
									}}
								/>
							) : editingRecipe ? (
								<RecipeEditor
									recipe={editingRecipe}
									availableFoods={availableFoods}
									availableRecipes={recipes.filter((r) => r.id !== editingRecipe.id)}
									onSave={handleUpdateRecipe}
									onCancel={() => {
										setEditingRecipe(null);
									}}
								/>
							) : null}
						</div>
					)}

					{/* Days Tab */}
					{activeTab === 'days' && (
						<div>
							<DayTracker isGuest={isGuest} availableFoods={availableFoods} availableRecipes={recipes} />
						</div>
					)}

					{/* Goals Tab */}
					{activeTab === 'goals' && <GoalsManager isGuest={isGuest} />}

					{/* Cooking Mode Tab */}
					{activeTab === 'cooking' && (
						<CookingMode
							recipes={recipes as any} // Type casting due to RecipeWithDetails mismatch
							isGuest={isGuest}
						/>
					)}

					{/* Recipe History Tab */}
					{activeTab === 'history' && <RecipeHistory />}
				</div>
			</div>
			{viewingHistoryRecipe && (
				<RecipeHistory
					recipeId={viewingHistoryRecipe.id}
					currentVersionId={viewingHistoryRecipe.currentVersionId}
					onClose={() => {
						setViewingHistoryRecipe(null);
					}}
					onRevert={handleRevertRecipeVersion}
				/>
			)}
		</div>
	);
}
