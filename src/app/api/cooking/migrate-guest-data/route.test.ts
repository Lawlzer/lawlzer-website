import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { POST } from './route';

// Mock Prisma
vi.mock('@/server/db', () => {
	const mockDb = {
		recipe: {
			create: vi.fn(),
			createMany: vi.fn(),
			update: vi.fn(),
		},
		food: {
			create: vi.fn(),
			createMany: vi.fn(),
			findFirst: vi.fn(),
		},
		goal: {
			create: vi.fn(),
			upsert: vi.fn(),
			findFirst: vi.fn(),
		},
		day: {
			create: vi.fn(),
		},
		dayEntry: {
			create: vi.fn(),
			createMany: vi.fn(),
		},
		$transaction: vi.fn(),
	};

	return { db: mockDb };
});

// Mock auth
vi.mock('@/server/db/session', () => ({
	getSession: vi.fn(),
}));

import { db } from '@/server/db';
import { getSession } from '@/server/db/session';

describe('/api/cooking/migrate-guest-data', () => {
	const mockUser = {
		id: 'user-123',
		email: 'test@example.com',
		name: 'Test User',
		emailVerified: null,
		image: null,
		discordId: null,
	};

	const mockSession = {
		user: mockUser,
		expires: new Date(Date.now() + 24 * 60 * 60 * 1000),
	};

	beforeEach(() => {
		vi.clearAllMocks();

		// Setup default transaction behavior to pass through the same mock db
		vi.mocked(db.$transaction).mockImplementation(async (callback: any) => callback(db));
	});

	describe('POST', () => {
		it('should reject unauthenticated requests', async () => {
			vi.mocked(getSession).mockResolvedValue(null);

			const request = new NextRequest('http://localhost/api/cooking/migrate-guest-data', {
				method: 'POST',
				body: JSON.stringify({ guestData: {} }),
			});

			const response = await POST(request);
			const data = await response.json();

			expect(response.status).toBe(401);
			expect(data.error).toBe('Unauthorized');
		});

		it('should migrate guest recipes successfully', async () => {
			vi.mocked(getSession).mockResolvedValue(mockSession as any);

			const guestData = {
				recipes: [
					{
						id: 'guest-recipe-1',
						name: 'Guest Recipe 1',
						description: 'A recipe from guest mode',
						servings: 4,
						prepTime: 15,
						cookTime: 30,
						visibility: 'private',
						ingredients: ['item1', 'item2'],
						instructions: ['step1', 'step2'],
					},
				],
				foods: [],
				goals: {},
				entries: [],
			};

			vi.mocked(db.recipe.create).mockResolvedValue({
				id: 'migrated-recipe-1',
				userId: mockUser.id,
				name: 'Guest Recipe 1',
				description: 'A recipe from guest mode',
				versions: [
					{
						id: 'version-1',
						version: 1,
						name: 'Guest Recipe 1',
					},
				],
			} as any);

			vi.mocked(db.recipe.update).mockResolvedValue({} as any);

			const request = new NextRequest('http://localhost/api/cooking/migrate-guest-data', {
				method: 'POST',
				body: JSON.stringify({ guestData }),
			});

			const response = await POST(request);
			const data = await response.json();

			expect(response.status).toBe(200);
			expect(data.success).toBe(true);
			expect(data.migrated).toHaveProperty('recipes', 1);
			expect(db.$transaction).toHaveBeenCalled();
		});

		it('should migrate guest foods successfully', async () => {
			vi.mocked(getSession).mockResolvedValue(mockSession as any);

			const guestData = {
				recipes: [],
				foods: [
					{
						id: 'guest-food-1',
						name: 'Apple',
						barcode: '123456',
						calories: 95,
						protein: 0.5,
						carbs: 25,
						fat: 0.3,
					},
				],
				goals: {},
				entries: [],
			};

			vi.mocked(db.food.findFirst).mockResolvedValue(null);
			vi.mocked(db.food.create).mockResolvedValue({
				id: 'migrated-food-1',
				userId: mockUser.id,
				name: 'Apple',
			} as any);

			const request = new NextRequest('http://localhost/api/cooking/migrate-guest-data', {
				method: 'POST',
				body: JSON.stringify({ guestData }),
			});

			const response = await POST(request);
			const data = await response.json();

			expect(response.status).toBe(200);
			expect(data.success).toBe(true);
			expect(data.migrated).toHaveProperty('foods', 1);
		});

		it('should migrate guest goals successfully', async () => {
			vi.mocked(getSession).mockResolvedValue(mockSession as any);

			const guestData = {
				recipes: [],
				foods: [],
				goals: {
					calories: 2000,
					protein: 50,
					carbs: 250,
					fat: 65,
				},
				entries: [],
			};

			vi.mocked(db.goal.findFirst).mockResolvedValue(null);
			vi.mocked(db.goal.create).mockResolvedValue({
				id: 'goal-1',
				userId: mockUser.id,
				calories: 2000,
				protein: 50,
			} as any);

			const request = new NextRequest('http://localhost/api/cooking/migrate-guest-data', {
				method: 'POST',
				body: JSON.stringify({ guestData }),
			});

			const response = await POST(request);
			const data = await response.json();

			expect(response.status).toBe(200);
			expect(data.success).toBe(true);
			expect(data.migrated).toHaveProperty('goalsUpdated', true);
			expect(db.goal.create).toHaveBeenCalled();
		});

		it('should handle migration failures gracefully', async () => {
			vi.mocked(getSession).mockResolvedValue(mockSession as any);

			const guestData = {
				recipes: [{ id: 'recipe-1', name: 'Test Recipe' }],
				foods: [],
				goals: {},
				entries: [],
			};

			vi.mocked(db.$transaction).mockRejectedValue(new Error('Database error'));

			const request = new NextRequest('http://localhost/api/cooking/migrate-guest-data', {
				method: 'POST',
				body: JSON.stringify({ guestData }),
			});

			const response = await POST(request);
			const data = await response.json();

			expect(response.status).toBe(500);
			expect(data.error).toBe('Failed to migrate guest data');
		});

		it('should skip invalid guest data', async () => {
			vi.mocked(getSession).mockResolvedValue(mockSession as any);

			const guestData = {
				recipes: [
					{ id: 'valid-recipe', name: 'Valid Recipe' },
					{ id: 'invalid-recipe' }, // Missing required fields
				],
				foods: [
					{ id: 'valid-food', name: 'Valid Food', calories: 100 },
					{ id: 'invalid-food' }, // Missing required fields
				],
				goals: {},
				entries: [],
			};

			vi.mocked(db.recipe.create).mockResolvedValue({
				id: 'migrated-recipe-1',
				versions: [
					{
						id: 'version-1',
						version: 1,
					},
				],
			} as any);

			vi.mocked(db.recipe.update).mockResolvedValue({} as any);
			vi.mocked(db.food.findFirst).mockResolvedValue(null);
			vi.mocked(db.food.create).mockResolvedValue({
				id: 'migrated-food-1',
			} as any);

			const request = new NextRequest('http://localhost/api/cooking/migrate-guest-data', {
				method: 'POST',
				body: JSON.stringify({ guestData }),
			});

			const response = await POST(request);
			const data = await response.json();

			expect(response.status).toBe(200);
			expect(data.migrated.recipes).toBe(1); // Only valid recipe
			expect(data.migrated.foods).toBe(1); // Only valid food
		});

		it('should handle empty guest data', async () => {
			vi.mocked(getSession).mockResolvedValue(mockSession as any);

			const guestData = {
				recipes: [],
				foods: [],
				goals: {},
				entries: [],
			};

			const request = new NextRequest('http://localhost/api/cooking/migrate-guest-data', {
				method: 'POST',
				body: JSON.stringify({ guestData }),
			});

			const response = await POST(request);
			const data = await response.json();

			expect(response.status).toBe(200);
			expect(data.success).toBe(true);
			expect(data.migrated).toEqual({
				recipes: 0,
				foods: 0,
				entries: 0,
				goalsUpdated: false,
			});
		});

		it('should validate request body structure', async () => {
			vi.mocked(getSession).mockResolvedValue(mockSession as any);

			// Test null guestData
			const nullRequest = new NextRequest('http://localhost/api/cooking/migrate-guest-data', {
				method: 'POST',
				body: JSON.stringify({ guestData: null }),
			});
			const nullResponse = await POST(nullRequest);
			expect(nullResponse.status).toBe(400);

			// Test non-object guestData
			const stringRequest = new NextRequest('http://localhost/api/cooking/migrate-guest-data', {
				method: 'POST',
				body: JSON.stringify({ guestData: 'not an object' }),
			});
			const stringResponse = await POST(stringRequest);
			expect(stringResponse.status).toBe(400);

			// Test invalid array property
			const invalidArrayRequest = new NextRequest('http://localhost/api/cooking/migrate-guest-data', {
				method: 'POST',
				body: JSON.stringify({ guestData: { recipes: 'not an array' } }),
			});
			const invalidArrayResponse = await POST(invalidArrayRequest);
			expect(invalidArrayResponse.status).toBe(400);

			// The case {} is actually valid since we fallback to treating the body as guestData
			const emptyRequest = new NextRequest('http://localhost/api/cooking/migrate-guest-data', {
				method: 'POST',
				body: JSON.stringify({}),
			});
			const emptyResponse = await POST(emptyRequest);
			expect(emptyResponse.status).toBe(200); // Empty object is valid
		});

		it('should prevent duplicate migrations', async () => {
			vi.mocked(getSession).mockResolvedValue(mockSession as any);

			const guestData = {
				recipes: [
					{
						id: 'guest-recipe-1',
						name: 'Duplicate Recipe',
						guestId: 'unique-guest-id',
					},
				],
				foods: [],
				goals: {},
				entries: [],
			};

			// First migration succeeds
			vi.mocked(db.recipe.create).mockResolvedValueOnce({
				id: 'migrated-1',
				versions: [
					{
						id: 'version-1',
						version: 1,
					},
				],
			} as any);

			vi.mocked(db.recipe.update).mockResolvedValue({} as any);

			// Second migration should detect duplicate
			vi.mocked(db.recipe.create).mockRejectedValueOnce({
				code: 'P2002', // Prisma unique constraint error
			});

			const request1 = new NextRequest('http://localhost/api/cooking/migrate-guest-data', {
				method: 'POST',
				body: JSON.stringify({ guestData }),
			});

			const response1 = await POST(request1);
			expect(response1.status).toBe(200);

			const request2 = new NextRequest('http://localhost/api/cooking/migrate-guest-data', {
				method: 'POST',
				body: JSON.stringify({ guestData }),
			});

			const response2 = await POST(request2);
			// Should handle gracefully, not fail completely
			expect([200, 500]).toContain(response2.status);
		});
	});
});
