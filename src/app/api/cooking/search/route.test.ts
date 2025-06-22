import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { GET } from './route';

// Mock dependencies
vi.mock('~/server/db', () => ({
	db: {
		recipe: {
			findMany: vi.fn(),
		},
	},
}));

vi.mock('~/server/db/session', () => ({
	getSession: vi.fn(),
}));

// Import mocked modules
import { db } from '~/server/db';
import { getSession } from '~/server/db/session';

const mockSession = {
	user: {
		id: 'test-user-id',
		email: 'test@example.com',
		name: 'Test User',
	},
};

const mockRecipes = [
	{
		id: 'recipe-1',
		userId: 'test-user-id',
		name: 'Pasta Carbonara',
		description: 'Classic Italian pasta dish',
		prepTime: 15,
		cookTime: 20,
		visibility: 'public',
		isComponent: false,
		currentVersion: {
			id: 'version-1',
			items: [
				{
					id: 'item-1',
					food: { id: 'food-1', name: 'Pasta' },
					recipe: null,
				},
			],
		},
		user: {
			name: 'Test User',
			image: null,
		},
		_count: {
			likes: 5,
			comments: 3,
			reports: 0,
		},
	},
	{
		id: 'recipe-2',
		userId: 'other-user-id',
		name: 'Tomato Soup',
		description: 'Homemade tomato soup',
		prepTime: 10,
		cookTime: 30,
		visibility: 'public',
		isComponent: false,
		currentVersion: {
			id: 'version-2',
			items: [
				{
					id: 'item-2',
					food: { id: 'food-2', name: 'Tomato' },
					recipe: null,
				},
			],
		},
		user: {
			name: 'Other User',
			image: null,
		},
		_count: {
			likes: 10,
			comments: 7,
			reports: 0,
		},
	},
];

describe('/api/cooking/search', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe('GET', () => {
		it('should return all public recipes when no filters are applied', async () => {
			(getSession as any).mockResolvedValue(null);
			(db.recipe.findMany as any).mockResolvedValue(mockRecipes.filter((r) => r.visibility === 'public'));

			const request = new NextRequest('http://localhost:3000/api/cooking/search');
			const response = await GET(request);
			const data = await response.json();

			expect(response.status).toBe(200);
			expect(data).toHaveLength(2);
			expect(db.recipe.findMany).toHaveBeenCalledWith({
				where: {
					AND: [{ OR: [{ visibility: 'public' }] }, { isComponent: false }],
				},
				include: expect.any(Object),
				orderBy: { createdAt: 'desc' },
			});
		});

		it('should include user recipes when authenticated', async () => {
			(getSession as any).mockResolvedValue(mockSession);
			(db.recipe.findMany as any).mockResolvedValue(mockRecipes);

			const request = new NextRequest('http://localhost:3000/api/cooking/search');
			const response = await GET(request);
			const _data = await response.json();

			expect(response.status).toBe(200);
			expect(db.recipe.findMany).toHaveBeenCalledWith({
				where: {
					AND: [
						{
							OR: [{ userId: mockSession.user.id }, { visibility: 'public' }],
						},
						{ isComponent: false },
					],
				},
				include: expect.any(Object),
				orderBy: { createdAt: 'desc' },
			});
		});

		it('should filter by query string', async () => {
			(getSession as any).mockResolvedValue(null);
			(db.recipe.findMany as any).mockResolvedValue([mockRecipes[0]]);

			const request = new NextRequest('http://localhost:3000/api/cooking/search?query=pasta');
			const response = await GET(request);
			const data = await response.json();

			expect(response.status).toBe(200);
			expect(data).toHaveLength(1);
			expect(db.recipe.findMany).toHaveBeenCalledWith({
				where: {
					AND: [
						{ OR: [{ visibility: 'public' }] },
						{
							OR: [{ name: { contains: 'pasta', mode: 'insensitive' } }, { description: { contains: 'pasta', mode: 'insensitive' } }],
						},
						{ isComponent: false },
					],
				},
				include: expect.any(Object),
				orderBy: { createdAt: 'desc' },
			});
		});

		it('should filter by ingredients', async () => {
			(getSession as any).mockResolvedValue(null);
			(db.recipe.findMany as any).mockResolvedValue([mockRecipes[1]]);

			const request = new NextRequest('http://localhost:3000/api/cooking/search?ingredients=tomato,onion');
			const response = await GET(request);
			const _data = await response.json();

			expect(response.status).toBe(200);
			expect(db.recipe.findMany).toHaveBeenCalledWith({
				where: {
					AND: [
						{ OR: [{ visibility: 'public' }] },
						{
							currentVersion: {
								items: {
									some: {
										food: {
											name: { in: ['tomato', 'onion'], mode: 'insensitive' },
										},
									},
								},
							},
						},
						{ isComponent: false },
					],
				},
				include: expect.any(Object),
				orderBy: { createdAt: 'desc' },
			});
		});

		it('should filter by max prep time', async () => {
			(getSession as any).mockResolvedValue(null);
			(db.recipe.findMany as any).mockResolvedValue([mockRecipes[1]]);

			const request = new NextRequest('http://localhost:3000/api/cooking/search?maxPrepTime=15');
			const response = await GET(request);
			const _data = await response.json();

			expect(response.status).toBe(200);
			expect(db.recipe.findMany).toHaveBeenCalledWith({
				where: {
					AND: [{ OR: [{ visibility: 'public' }] }, { prepTime: { lte: 15 } }, { isComponent: false }],
				},
				include: expect.any(Object),
				orderBy: { createdAt: 'desc' },
			});
		});

		it('should sort by likes when specified', async () => {
			(getSession as any).mockResolvedValue(null);
			(db.recipe.findMany as any).mockResolvedValue(mockRecipes);

			const request = new NextRequest('http://localhost:3000/api/cooking/search?sortBy=likes');
			const response = await GET(request);
			const _data = await response.json();

			expect(response.status).toBe(200);
			expect(db.recipe.findMany).toHaveBeenCalledWith({
				where: expect.any(Object),
				include: expect.any(Object),
				orderBy: { likes: { _count: 'desc' } },
			});
		});

		it('should handle combined filters', async () => {
			(getSession as any).mockResolvedValue(mockSession);
			(db.recipe.findMany as any).mockResolvedValue([mockRecipes[0]]);

			const request = new NextRequest('http://localhost:3000/api/cooking/search?query=pasta&ingredients=pasta&maxPrepTime=20&sortBy=likes');
			const response = await GET(request);
			const _data = await response.json();

			expect(response.status).toBe(200);
			expect(db.recipe.findMany).toHaveBeenCalledWith({
				where: {
					AND: [
						{
							OR: [{ userId: mockSession.user.id }, { visibility: 'public' }],
						},
						{
							OR: [{ name: { contains: 'pasta', mode: 'insensitive' } }, { description: { contains: 'pasta', mode: 'insensitive' } }],
						},
						{
							currentVersion: {
								items: {
									some: {
										food: {
											name: { in: ['pasta'], mode: 'insensitive' },
										},
									},
								},
							},
						},
						{ prepTime: { lte: 20 } },
						{ isComponent: false },
					],
				},
				include: expect.any(Object),
				orderBy: { likes: { _count: 'desc' } },
			});
		});

		it('should handle database errors', async () => {
			(getSession as any).mockResolvedValue(null);
			(db.recipe.findMany as any).mockRejectedValue(new Error('Database error'));

			const request = new NextRequest('http://localhost:3000/api/cooking/search');
			const response = await GET(request);
			const data = await response.json();

			expect(response.status).toBe(500);
			expect(data).toEqual({ error: 'Failed to search recipes' });
		});

		it('should exclude component recipes', async () => {
			(getSession as any).mockResolvedValue(null);
			(db.recipe.findMany as any).mockResolvedValue(mockRecipes.filter((r) => !r.isComponent));

			const request = new NextRequest('http://localhost:3000/api/cooking/search');
			const response = await GET(request);

			expect(response.status).toBe(200);
			expect(db.recipe.findMany).toHaveBeenCalledWith(
				expect.objectContaining({
					where: expect.objectContaining({
						AND: expect.arrayContaining([{ isComponent: false }]),
					}),
				})
			);
		});
	});
});
