import type { NextRequest } from 'next/server';
import { describe, expect, it, vi } from 'vitest';

import { GET, POST, PUT } from './route';

// Mock the database module
vi.mock('~/server/db', () => ({
	db: {
		recipe: {
			findMany: vi.fn(),
			create: vi.fn(),
			update: vi.fn(),
		},
		recipeVersion: {
			create: vi.fn(),
		},
		food: {
			findUnique: vi.fn(),
		},
		$transaction: vi.fn(),
	},
}));

// Mock the session module
vi.mock('~/server/db/session', () => ({
	getSession: vi.fn(),
}));

import { db } from '~/server/db';
import { getSession } from '~/server/db/session';

describe('/api/cooking/recipes', () => {
	describe('GET', () => {
		it('should return recipes for logged-in users', async () => {
			const mockSession = {
				user: { id: 'user123' },
				expires: new Date(Date.now() + 86400000).toISOString(),
			} as any;
			const mockRecipes = [
				{
					id: 'recipe1',
					name: 'Test Recipe',
					userId: 'user123',
					currentVersion: {
						caloriesPerServing: 250,
						proteinPerServing: 20,
						carbsPerServing: 30,
						fatPerServing: 10,
					},
				},
			];

			vi.mocked(getSession).mockResolvedValueOnce(mockSession);
			vi.mocked(db.recipe).findMany.mockResolvedValueOnce(mockRecipes as any);

			const req = {
				nextUrl: new URL('http://localhost:3000/api/cooking/recipes'),
			} as NextRequest;
			const response = await GET(req);
			const data = await response.json();

			expect(response.status).toBe(200);
			expect(data).toEqual(mockRecipes);
		});

		it('should return public recipes for non-logged-in users', async () => {
			vi.mocked(getSession).mockResolvedValueOnce(null);
			vi.mocked(db.recipe).findMany.mockResolvedValueOnce([]);

			const req = {
				nextUrl: new URL('http://localhost:3000/api/cooking/recipes'),
			} as NextRequest;
			const response = await GET(req);
			const data = await response.json();

			expect(response.status).toBe(200);
			expect(data).toEqual([]);
		});
	});

	describe('POST', () => {
		it('should create a recipe for logged-in users', async () => {
			const mockSession = {
				user: { id: 'user123' },
				expires: new Date(Date.now() + 86400000).toISOString(),
			} as any;
			const mockFood = {
				id: 'food1',
				calories: 100,
				protein: 10,
				carbs: 15,
				fat: 5,
				fiber: 2,
				sugar: 3,
				sodium: 100,
			};

			vi.mocked(getSession).mockResolvedValueOnce(mockSession);

			// Mock the transaction

			vi.mocked(db.$transaction).mockImplementationOnce(async (callback: (tx: any) => Promise<any>) => {
				const tx = {
					recipe: {
						create: vi.fn().mockResolvedValueOnce({ id: 'newRecipe', name: 'New Recipe' }),
						update: vi.fn().mockResolvedValueOnce({ id: 'newRecipe', currentVersionId: 'version1' }),
					},
					recipeVersion: {
						create: vi.fn().mockResolvedValueOnce({ id: 'version1' }),
					},
					food: {
						findUnique: vi.fn().mockResolvedValueOnce(mockFood),
					},
				};

				return callback(tx);
			});

			const recipeData = {
				name: 'New Recipe',
				description: 'Test description',
				servings: 2,
				items: [{ foodId: 'food1', amount: 200 }],
			};

			const req = new Request('http://localhost:3000/api/cooking/recipes', {
				method: 'POST',
				body: JSON.stringify(recipeData),
			});

			const response = await POST(req as NextRequest);
			const data = await response.json();

			expect(response.status).toBe(200);
			expect(data).toHaveProperty('id', 'newRecipe');
		});

		it('should return 401 for non-logged-in users', async () => {
			vi.mocked(getSession).mockResolvedValueOnce(null);

			const req = new Request('http://localhost:3000/api/cooking/recipes', {
				method: 'POST',
				body: JSON.stringify({ name: 'Test' }),
			});

			const response = await POST(req as NextRequest);
			const data = await response.json();

			expect(response.status).toBe(401);
			expect(data).toHaveProperty('error', 'Must be logged in to create recipes');
		});

		it('should validate recipe name', async () => {
			const mockSession = {
				user: { id: 'user123' },
				expires: new Date(Date.now() + 86400000).toISOString(),
			} as any;
			vi.mocked(getSession).mockResolvedValueOnce(mockSession);

			const req = new Request('http://localhost:3000/api/cooking/recipes', {
				method: 'POST',
				body: JSON.stringify({ name: '   ', items: [] }),
			});

			const response = await POST(req as NextRequest);
			const data = await response.json();

			expect(response.status).toBe(400);
			expect(data).toHaveProperty('error', 'Recipe name is required');
		});

		it('should validate recipe has ingredients', async () => {
			const mockSession = {
				user: { id: 'user123' },
				expires: new Date(Date.now() + 86400000).toISOString(),
			} as any;
			vi.mocked(getSession).mockResolvedValueOnce(mockSession);

			const req = new Request('http://localhost:3000/api/cooking/recipes', {
				method: 'POST',
				body: JSON.stringify({ name: 'Test Recipe', items: [] }),
			});

			const response = await POST(req as NextRequest);
			const data = await response.json();

			expect(response.status).toBe(400);
			expect(data).toHaveProperty('error', 'Recipe must have at least one ingredient');
		});
	});

	describe('PUT', () => {
		it('should create a new version when updating a recipe', async () => {
			const mockSession = {
				user: { id: 'user123' },
				expires: new Date(Date.now() + 86400000).toISOString(),
			} as any;

			vi.mocked(getSession).mockResolvedValueOnce(mockSession);

			// Mock the transaction for update

			vi.mocked(db.$transaction).mockImplementationOnce(async (callback: (tx: any) => Promise<any>) => {
				const tx = {
					recipe: {
						findFirst: vi.fn().mockResolvedValueOnce({
							id: 'recipe1',
							userId: 'user123',
							versions: [{ version: 1 }],
						}),
						update: vi
							.fn()
							.mockResolvedValueOnce({
								id: 'recipe1',
								name: 'Updated Recipe',
								description: 'Updated description',
								servings: 4,
							})
							.mockResolvedValueOnce({
								id: 'recipe1',
								name: 'Updated Recipe',
								description: 'Updated description',
								servings: 4,
								currentVersionId: 'version2',
								currentVersion: {
									id: 'version2',
									version: 2,
									caloriesPerServing: 75,
									proteinPerServing: 7.5,
									carbsPerServing: 15,
									fatPerServing: 3.75,
									items: [
										{
											id: 'item1',
											foodId: 'food1',
											amount: 300,
											unit: 'g',
											food: {
												id: 'food1',
												name: 'Test Food',
												calories: 100,
												protein: 10,
												carbs: 20,
												fat: 5,
											},
											recipe: null,
										},
									],
								},
								versions: [
									{ id: 'version1', version: 1 },
									{ id: 'version2', version: 2 },
								],
							}),
					},
					recipeVersion: {
						create: vi.fn().mockResolvedValueOnce({
							id: 'version2',
							version: 2,
							caloriesPerServing: 75,
							proteinPerServing: 7.5,
							carbsPerServing: 15,
							fatPerServing: 3.75,
						}),
					},
					food: {
						findUnique: vi.fn().mockResolvedValueOnce({
							calories: 100,
							protein: 10,
							carbs: 20,
							fat: 5,
							fiber: 2,
							sugar: 3,
							sodium: 50,
						}),
					},
				};

				return callback(tx);
			});

			const updateData = {
				id: 'recipe1',
				name: 'Updated Recipe',
				description: 'Updated description',
				servings: 4,
				items: [{ foodId: 'food1', amount: 300, unit: 'g' }],
			};

			const req = new Request('http://localhost:3000/api/cooking/recipes', {
				method: 'PUT',
				body: JSON.stringify(updateData),
			});

			const response = await PUT(req as NextRequest);
			const data = await response.json();

			expect(response.status).toBe(200);
			expect(data.name).toBe('Updated Recipe');
			expect(data.servings).toBe(4);
		});

		it('should return 401 for non-logged-in users', async () => {
			vi.mocked(getSession).mockResolvedValueOnce(null);

			const req = new Request('http://localhost:3000/api/cooking/recipes', {
				method: 'PUT',
				body: JSON.stringify({ id: 'recipe1', name: 'Test' }),
			});

			const response = await PUT(req as NextRequest);
			const data = await response.json();

			expect(response.status).toBe(401);
			expect(data).toHaveProperty('error', 'Must be logged in to update recipes');
		});

		it('should validate recipe ID is provided', async () => {
			const mockSession = {
				user: { id: 'user123' },
				expires: new Date(Date.now() + 86400000).toISOString(),
			} as any;
			vi.mocked(getSession).mockResolvedValueOnce(mockSession);

			const req = new Request('http://localhost:3000/api/cooking/recipes', {
				method: 'PUT',
				body: JSON.stringify({ name: 'Test Recipe' }),
			});

			const response = await PUT(req as NextRequest);
			const data = await response.json();

			expect(response.status).toBe(400);
			expect(data).toHaveProperty('error', 'Recipe ID is required');
		});

		it('should return error if recipe not found', async () => {
			const mockSession = {
				user: { id: 'user123' },
				expires: new Date(Date.now() + 86400000).toISOString(),
			} as any;
			vi.mocked(getSession).mockResolvedValueOnce(mockSession);

			vi.mocked(db.$transaction).mockImplementationOnce(async (callback: (tx: any) => Promise<any>) => {
				const tx = {
					recipe: {
						findFirst: vi.fn().mockResolvedValueOnce(null),
					},
				};

				return callback(tx);
			});

			const req = new Request('http://localhost:3000/api/cooking/recipes', {
				method: 'PUT',
				body: JSON.stringify({
					id: 'nonexistent',
					name: 'Test Recipe',
					items: [{ foodId: 'food1', amount: 100 }],
				}),
			});

			const response = await PUT(req as NextRequest);
			const data = await response.json();

			expect(response.status).toBe(500);
			expect(data.error).toContain('Recipe not found');
		});
	});
});
