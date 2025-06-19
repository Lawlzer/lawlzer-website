import type { Food } from '@prisma/client';

// Guest data types
export interface GuestFood extends Omit<Food, 'createdAt' | 'id' | 'updatedAt' | 'userId'> {
	guestId: string;
	createdAt: string;
	updatedAt: string;
}

export interface GuestRecipeItem {
	foodId?: string;
	recipeId?: string;
	amount: number;
	unit: string;
}

export interface GuestRecipe {
	guestId: string;
	name: string;
	description?: string | null;
	notes?: string | null;
	prepTime?: number | null;
	cookTime?: number | null;
	servings: number;
	items: GuestRecipeItem[];
	createdAt: string;
	updatedAt: string;
}

export interface GuestData {
	foods: GuestFood[];
	recipes: GuestRecipe[];
	days: any[]; // Will be implemented later
	goals: any[]; // Will be implemented later
}

const GUEST_COOKIE_NAME = 'cooking_guest_data';
const GUEST_COOKIE_MAX_AGE = 60 * 60 * 24 * 30; // 30 days

// Helper to get cookie value
const getCookie = (name: string): string | null => {
	if (typeof document === 'undefined') return null;

	const value = `; ${document.cookie}`;
	const parts = value.split(`; ${name}=`);

	if (parts.length === 2) {
		const cookieValue = parts.pop()?.split(';').shift();
		return cookieValue != null && cookieValue !== '' ? decodeURIComponent(cookieValue) : null;
	}

	return null;
};

// Helper to set cookie value
const setCookie = (name: string, value: string, maxAge: number = GUEST_COOKIE_MAX_AGE) => {
	if (typeof document === 'undefined') return;

	const encodedValue = encodeURIComponent(value);
	document.cookie = `${name}=${encodedValue}; max-age=${maxAge}; path=/; SameSite=Lax`;
};

// Get guest data from cookies
export const getGuestData = (): GuestData => {
	const cookieValue = getCookie(GUEST_COOKIE_NAME);

	if (cookieValue == null || cookieValue === '') {
		return {
			foods: [],
			recipes: [],
			days: [],
			goals: [],
		};
	}

	try {
		return JSON.parse(cookieValue) as GuestData;
	} catch (error) {
		console.error('Failed to parse guest data from cookie:', error);
		return {
			foods: [],
			recipes: [],
			days: [],
			goals: [],
		};
	}
};

// Save guest data to cookies
export const saveGuestData = (data: GuestData) => {
	try {
		const jsonData = JSON.stringify(data);
		// Check if data size is reasonable (cookies have size limits)
		if (jsonData.length > 4000) {
			console.warn('Guest data is getting large. Consider prompting user to sign in.');
		}
		setCookie(GUEST_COOKIE_NAME, jsonData);
	} catch (error) {
		console.error('Failed to save guest data to cookie:', error);
	}
};

// Add a food item for guest
export const addGuestFood = (food: Omit<GuestFood, 'createdAt' | 'guestId' | 'updatedAt'>): GuestFood => {
	const guestData = getGuestData();

	const newFood: GuestFood = {
		...food,
		guestId: crypto.randomUUID(),
		createdAt: new Date().toISOString(),
		updatedAt: new Date().toISOString(),
	};

	// Check if food with same barcode already exists
	if (food.barcode != null && food.barcode !== '') {
		const existingIndex = guestData.foods.findIndex((f) => f.barcode === food.barcode);
		if (existingIndex !== -1) {
			// Update existing food
			guestData.foods[existingIndex] = newFood;
		} else {
			guestData.foods.push(newFood);
		}
	} else {
		guestData.foods.push(newFood);
	}

	saveGuestData(guestData);
	return newFood;
};

// Get all guest foods
export const getGuestFoods = (): GuestFood[] => {
	const guestData = getGuestData();
	return guestData.foods;
};

// Delete a guest food
export const deleteGuestFood = (guestId: string): boolean => {
	const guestData = getGuestData();
	const initialLength = guestData.foods.length;

	guestData.foods = guestData.foods.filter((food) => food.guestId !== guestId);

	if (guestData.foods.length < initialLength) {
		saveGuestData(guestData);
		return true;
	}

	return false;
};

// Clear all guest data
export const clearGuestData = () => {
	setCookie(GUEST_COOKIE_NAME, '', 0); // Set max-age to 0 to delete
};

// Check if guest has data worth saving
export const hasGuestData = (): boolean => {
	const guestData = getGuestData();
	return guestData.foods.length > 0 || guestData.recipes.length > 0 || guestData.days.length > 0 || guestData.goals.length > 0;
};

// Migrate guest data to user account (to be called after login)
export const prepareGuestDataForMigration = () => {
	const guestData = getGuestData();

	// Transform guest foods to match database schema
	const foods = guestData.foods.map(({ guestId, createdAt, updatedAt, ...food }) => ({
		...food,
		createdAt: new Date(createdAt),
		updatedAt: new Date(updatedAt),
	}));

	return {
		foods,
		recipes: guestData.recipes,
		days: guestData.days,
		goals: guestData.goals,
	};
};

// Add a recipe for guest
export const addGuestRecipe = (recipe: Omit<GuestRecipe, 'createdAt' | 'guestId' | 'updatedAt'>): GuestRecipe => {
	const guestData = getGuestData();

	const newRecipe: GuestRecipe = {
		...recipe,
		guestId: crypto.randomUUID(),
		createdAt: new Date().toISOString(),
		updatedAt: new Date().toISOString(),
	};

	guestData.recipes.push(newRecipe);
	saveGuestData(guestData);
	return newRecipe;
};

// Get all guest recipes
export const getGuestRecipes = (): GuestRecipe[] => {
	const guestData = getGuestData();
	return guestData.recipes;
};

// Update a guest recipe
export const updateGuestRecipe = (guestId: string, recipe: Partial<Omit<GuestRecipe, 'createdAt' | 'guestId' | 'updatedAt'>>): GuestRecipe | null => {
	const guestData = getGuestData();
	const recipeIndex = guestData.recipes.findIndex((r) => r.guestId === guestId);

	if (recipeIndex === -1) return null;

	const updatedRecipe: GuestRecipe = {
		...guestData.recipes[recipeIndex],
		...recipe,
		updatedAt: new Date().toISOString(),
	};

	guestData.recipes[recipeIndex] = updatedRecipe;
	saveGuestData(guestData);
	return updatedRecipe;
};

// Delete a guest recipe
export const deleteGuestRecipe = (guestId: string): boolean => {
	const guestData = getGuestData();
	const initialLength = guestData.recipes.length;

	guestData.recipes = guestData.recipes.filter((recipe) => recipe.guestId !== guestId);

	if (guestData.recipes.length < initialLength) {
		saveGuestData(guestData);
		return true;
	}

	return false;
};
