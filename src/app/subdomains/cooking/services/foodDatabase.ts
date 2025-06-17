interface OpenFoodFactsProduct {
	product_name?: string;
	brands?: string;
	image_url?: string;
	nutriments?: {
		energy_100g?: number;
		'energy-kcal_100g'?: number;
		proteins_100g?: number;
		carbohydrates_100g?: number;
		fat_100g?: number;
		fiber_100g?: number;
		sugars_100g?: number;
		sodium_100g?: number;
		'saturated-fat_100g'?: number;
		'trans-fat_100g'?: number;
		cholesterol_100g?: number;
	};
	serving_size?: string;
}

interface OpenFoodFactsResponse {
	status: number;
	status_verbose: string;
	product?: OpenFoodFactsProduct;
}

export interface FoodProduct {
	name: string;
	brand?: string;
	barcode: string;
	imageUrl?: string;
	nutrition: {
		calories: number;
		protein: number;
		carbs: number;
		fat: number;
		fiber: number;
		sugar: number;
		sodium: number;
		saturatedFat?: number;
		transFat?: number;
		cholesterol?: number;
	};
	servingSize?: string;
}

export async function fetchFoodByBarcode(barcode: string): Promise<FoodProduct | null> {
	try {
		const response = await fetch(`https://world.openfoodfacts.org/api/v0/product/${barcode}.json`);

		if (!response.ok) {
			console.error('Failed to fetch product:', response.statusText);
			return null;
		}

		const data: OpenFoodFactsResponse = await response.json();

		if (data.status !== 1 || !data.product) {
			// Product not found
			return null;
		}

		const { product } = data;
		const nutriments = product.nutriments || {};

		// Convert nutriments to our format
		// OpenFoodFacts provides values per 100g
		const foodProduct: FoodProduct = {
			name: product.product_name ?? 'Unknown Product',
			brand: product.brands,
			barcode,
			imageUrl: product.image_url,
			nutrition: {
				// Use energy-kcal if available, otherwise convert from energy (kJ)
				calories: nutriments['energy-kcal_100g'] ?? (nutriments.energy_100g != null ? nutriments.energy_100g / 4.184 : 0),
				protein: nutriments.proteins_100g ?? 0,
				carbs: nutriments.carbohydrates_100g ?? 0,
				fat: nutriments.fat_100g ?? 0,
				fiber: nutriments.fiber_100g ?? 0,
				sugar: nutriments.sugars_100g ?? 0,
				sodium: nutriments.sodium_100g != null ? nutriments.sodium_100g * 1000 : 0, // Convert g to mg
				saturatedFat: nutriments['saturated-fat_100g'],
				transFat: nutriments['trans-fat_100g'],
				cholesterol: nutriments.cholesterol_100g,
			},
			servingSize: product.serving_size,
		};

		return foodProduct;
	} catch (error) {
		console.error('Error fetching food data:', error);
		return null;
	}
}
