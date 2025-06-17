'use client';

import type { Food } from '@prisma/client';
import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';

import { DayTracker } from './components/DayTracker';
import { RecipeCreator } from './components/RecipeCreator';
import { useGuestDataMigration } from './hooks/useGuestDataMigration';
import type { FoodProduct } from './services/foodDatabase';
import { fetchFoodByBarcode } from './services/foodDatabase';
import { addGuestFood, getGuestFoods, hasGuestData } from './services/guestStorage';

// Dynamically import BarcodeScanner to avoid SSR issues
const BarcodeScanner = dynamic(async () => import('./components/BarcodeScanner'), {
	ssr: false,
	loading: () => <p>Loading scanner...</p>,
});

// Simple icon components
const HomeIcon = () => <span>🏠</span>;
const CameraIcon = () => <span>📷</span>;
const UtensilsIcon = () => <span>🍴</span>;
const CalendarIcon = () => <span>📅</span>;
const GoalIcon = () => <span>🎯</span>;
const ChefHatIcon = () => <span>👨‍🍳</span>;

// Add type for recipe with version
interface RecipeWithVersion {
	id: string;
	name: string;
	description: string | null;
	prepTime: number | null;
	cookTime: number | null;
	servings: number;
	currentVersion: {
		caloriesPerServing: number;
		proteinPerServing: number;
		carbsPerServing: number;
		fatPerServing: number;
	} | null;
}

export default function CookingPage() {
	const [activeTab, setActiveTab] = useState('overview');
	const [isScanning, setIsScanning] = useState(false);
	const [scannedProduct, setScannedProduct] = useState<FoodProduct | null>(null);
	const [scanError, setScanError] = useState<string | null>(null);
	const [isLoading, setIsLoading] = useState(false);
	const [isSaving, setIsSaving] = useState(false);
	const [saveStatus, setSaveStatus] = useState<{ type: 'error' | 'success'; message: string } | null>(null);
	const [isGuest, setIsGuest] = useState(true);
	const [hasUnsavedData, setHasUnsavedData] = useState(false);
	const [guestFoodsCount, setGuestFoodsCount] = useState(0);
	const [isCreatingRecipe, setIsCreatingRecipe] = useState(false);
	const [availableFoods, setAvailableFoods] = useState<Food[]>([]);
	const [recipes, setRecipes] = useState<RecipeWithVersion[]>([]);
	const [loadingRecipes, setLoadingRecipes] = useState(false);
	const [user, setUser] = useState<any>(null);

	// Check if user is logged in
	useEffect(() => {
		const checkAuthStatus = async () => {
			try {
				const response = await fetch('/api/auth/session');
				const data = await response.json();
				setIsGuest(!data.user);
				setUser(data.user);
			} catch (error) {
				setIsGuest(true);
			}
		};

		void checkAuthStatus();
	}, []);

	// Check for guest data
	useEffect(() => {
		if (isGuest) {
			setHasUnsavedData(hasGuestData());
			setGuestFoodsCount(getGuestFoods().length);
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
			if (!isGuest) {
				setLoadingRecipes(true);
				try {
					const response = await fetch('/api/cooking/recipes');
					if (response.ok) {
						const data = await response.json();
						setRecipes(data.recipes);
					}
				} catch (error) {
					console.error('Error fetching recipes:', error);
				} finally {
					setLoadingRecipes(false);
				}
			}
		};

		void fetchRecipes();
	}, [isGuest]);

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
					isPublic: false,
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
		setRecipes([...recipes, data.recipe]);
		setIsCreatingRecipe(false);
	};

	return (
		<div className='space-y-6'>
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

			{/* Guest Mode Notice */}
			{isGuest && (
				<div className='rounded-lg border border-yellow-500 bg-yellow-50 dark:bg-yellow-950/20 p-4'>
					<div className='flex items-start justify-between'>
						<div className='flex-1'>
							<h3 className='text-lg font-semibold mb-1'>You&apos;re in Guest Mode</h3>
							<p className='text-sm text-gray-600 dark:text-gray-400'>
								Your data is saved locally on this device.
								{hasUnsavedData && guestFoodsCount > 0 && (
									<span className='font-medium'>
										{' '}
										You have {guestFoodsCount} saved food{guestFoodsCount !== 1 ? 's' : ''}.
									</span>
								)}{' '}
								Sign in to sync across devices and never lose your data!
							</p>
						</div>
						<a href='/api/auth/login' className='ml-4 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm font-medium'>
							Sign In
						</a>
					</div>
				</div>
			)}

			{/* Main Navigation Tabs */}
			<div className='space-y-4'>
				{/* Tab List */}
				<div className='grid grid-cols-3 sm:grid-cols-6 gap-2 border-b'>
					{tabs.map((tab) => (
						<button
							key={tab.id}
							onClick={() => {
								setActiveTab(tab.id);
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
							{!isCreatingRecipe ? (
								<>
									<div className='flex items-center justify-between'>
										<h2 className='text-2xl font-bold'>My Recipes</h2>
										<button
											onClick={() => {
												setIsCreatingRecipe(true);
											}}
											className='px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors'
											disabled={isGuest}
										>
											Create Recipe
										</button>
									</div>

									{isGuest ? (
										<div className='rounded-lg border border-yellow-500 bg-yellow-50 dark:bg-yellow-950/20 p-6'>
											<h3 className='text-lg font-semibold mb-2'>Sign In to Create Recipes</h3>
											<p className='text-sm text-gray-600 dark:text-gray-400 mb-4'>Recipe creation requires an account to save your creations and access them from any device.</p>
											<a href='/api/auth/login' className='inline-block px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors'>
												Sign In
											</a>
										</div>
									) : loadingRecipes ? (
										<div className='flex justify-center py-8'>
											<div className='animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500'></div>
										</div>
									) : recipes.length > 0 ? (
										<div className='grid gap-4 md:grid-cols-2 lg:grid-cols-3'>
											{recipes.map((recipe) => (
												<div key={recipe.id} className='rounded-lg border p-4 hover:shadow-lg transition-shadow'>
													<h4 className='font-semibold text-lg'>{recipe.name}</h4>
													{recipe.description != null && recipe.description !== '' && <p className='text-sm text-gray-600 dark:text-gray-400 mt-1'>{recipe.description}</p>}

													<div className='mt-3 flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400'>
														{recipe.prepTime != null && recipe.prepTime > 0 && <span>⏱️ Prep: {recipe.prepTime}min</span>}
														{recipe.cookTime != null && recipe.cookTime > 0 && <span>🔥 Cook: {recipe.cookTime}min</span>}
													</div>

													{recipe.currentVersion && (
														<div className='mt-3 text-sm'>
															<span className='font-medium'>Per serving:</span>
															<div className='grid grid-cols-2 gap-1 mt-1'>
																<span>Calories: {recipe.currentVersion.caloriesPerServing.toFixed(0)}</span>
																<span>Protein: {recipe.currentVersion.proteinPerServing.toFixed(1)}g</span>
																<span>Carbs: {recipe.currentVersion.carbsPerServing.toFixed(1)}g</span>
																<span>Fat: {recipe.currentVersion.fatPerServing.toFixed(1)}g</span>
															</div>
														</div>
													)}

													<div className='mt-4 flex gap-2'>
														<button className='flex-1 px-3 py-1 text-sm border rounded hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors'>View</button>
														<button className='flex-1 px-3 py-1 text-sm border rounded hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors'>Cook</button>
													</div>
												</div>
											))}
										</div>
									) : (
										<div className='rounded-lg border p-10 flex flex-col items-center justify-center'>
											<UtensilsIcon />
											<p className='text-lg font-medium mt-4'>No recipes yet</p>
											<p className='text-sm text-gray-600 dark:text-gray-400'>Create your first recipe to get started</p>
										</div>
									)}
								</>
							) : (
								<RecipeCreator
									availableFoods={availableFoods}
									onSave={handleSaveRecipe}
									onCancel={() => {
										setIsCreatingRecipe(false);
									}}
								/>
							)}
						</div>
					)}

					{/* Days Tab */}
					{activeTab === 'days' && (
						<div>
							<DayTracker user={user} />
						</div>
					)}

					{/* Goals Tab */}
					{activeTab === 'goals' && (
						<div className='space-y-4'>
							<div className='flex items-center justify-between'>
								<h2 className='text-2xl font-bold'>Nutrition Goals</h2>
								<button className='px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors'>Set Goals</button>
							</div>
							<div className='rounded-lg border p-10 flex flex-col items-center justify-center'>
								<GoalIcon />
								<p className='text-lg font-medium mt-4'>No goals set</p>
								<p className='text-sm text-gray-600 dark:text-gray-400'>Set your daily nutrition targets</p>
							</div>
						</div>
					)}

					{/* Cooking Mode Tab */}
					{activeTab === 'cooking' && (
						<div className='rounded-lg border p-6'>
							<h2 className='text-xl font-bold mb-2'>Cooking Mode</h2>
							<p className='text-gray-600 dark:text-gray-400 mb-6'>Select a recipe and set ingredient weights for perfect proportions</p>
							<div className='flex flex-col items-center justify-center py-10'>
								<ChefHatIcon />
								<p className='text-lg font-medium mt-4'>No recipes available</p>
								<p className='text-sm text-gray-600 dark:text-gray-400'>Create recipes first to use cooking mode</p>
							</div>
						</div>
					)}
				</div>
			</div>
		</div>
	);
}
