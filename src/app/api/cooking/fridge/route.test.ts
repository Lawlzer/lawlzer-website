import { beforeEach, describe, expect, it, vi } from 'vitest';

import { DELETE, GET, POST } from './route';

// Mock dependencies
vi.mock('~/server/db', () => ({
	db: {
		fridgeItem: {
			findMany: vi.fn(),
			create: vi.fn(),
			delete: vi.fn(),
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

const mockFridgeItems = [
	{
		id: 'item-1',
		userId: 'test-user-id',
		foodId: 'food-1',
		quantity: 2,
		food: {
			id: 'food-1',
			name: 'Milk',
			brand: 'Brand A',
			calories: 150,
			protein: 8,
			carbs: 12,
			fat: 8,
		},
	},
	{
		id: 'item-2',
		userId: 'test-user-id',
		foodId: 'food-2',
		quantity: 1.5,
		food: {
			id: 'food-2',
			name: 'Eggs',
			brand: null,
			calories: 70,
			protein: 6,
			carbs: 1,
			fat: 5,
		},
	},
];

describe('/api/cooking/fridge', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe('GET', () => {
		it('should return 401 if user is not authenticated', async () => {
			(getSession as any).mockResolvedValue(null);

			const response = await GET();
			const data = await response.json();

			expect(response.status).toBe(401);
			expect(data).toEqual({ error: 'Unauthorized' });
		});

		it('should return user fridge items', async () => {
			(getSession as any).mockResolvedValue(mockSession);
			(db.fridgeItem.findMany as any).mockResolvedValue(mockFridgeItems);

			const response = await GET();
			const data = await response.json();

			expect(response.status).toBe(200);
			expect(data).toEqual(mockFridgeItems);
			expect(db.fridgeItem.findMany).toHaveBeenCalledWith({
				where: { userId: mockSession.user.id },
				include: { food: true },
				orderBy: { food: { name: 'asc' } },
			});
		});

		it('should return empty array when no items exist', async () => {
			(getSession as any).mockResolvedValue(mockSession);
			(db.fridgeItem.findMany as any).mockResolvedValue([]);

			const response = await GET();
			const data = await response.json();

			expect(response.status).toBe(200);
			expect(data).toEqual([]);
		});

		it('should handle database errors', async () => {
			(getSession as any).mockResolvedValue(mockSession);
			(db.fridgeItem.findMany as any).mockRejectedValue(new Error('Database error'));

			// The current implementation doesn't handle errors, so this will throw
			await expect(GET()).rejects.toThrow('Database error');
		});
	});

	describe('POST', () => {
		it('should return 401 if user is not authenticated', async () => {
			(getSession as any).mockResolvedValue(null);

			const request = new Request('http://localhost:3000/api/cooking/fridge', {
				method: 'POST',
				body: JSON.stringify({ foodId: 'food-1', quantity: 2 }),
			});

			const response = await POST(request);
			const data = await response.json();

			expect(response.status).toBe(401);
			expect(data).toEqual({ error: 'Unauthorized' });
		});

		it('should return 400 for invalid data', async () => {
			(getSession as any).mockResolvedValue(mockSession);

			// Missing foodId
			const request = new Request('http://localhost:3000/api/cooking/fridge', {
				method: 'POST',
				body: JSON.stringify({ quantity: 2 }),
			});

			const response = await POST(request);
			const data = await response.json();

			expect(response.status).toBe(400);
			expect(data).toEqual({ error: 'Invalid data' });
		});

		it('should return 400 for invalid quantity', async () => {
			(getSession as any).mockResolvedValue(mockSession);

			const request = new Request('http://localhost:3000/api/cooking/fridge', {
				method: 'POST',
				body: JSON.stringify({ foodId: 'food-1', quantity: 0 }),
			});

			const response = await POST(request);
			const data = await response.json();

			expect(response.status).toBe(400);
			expect(data).toEqual({ error: 'Invalid data' });
		});

		it('should create a new fridge item', async () => {
			(getSession as any).mockResolvedValue(mockSession);

			const newItem = {
				id: 'new-item-id',
				userId: mockSession.user.id,
				foodId: 'food-3',
				quantity: 3,
				food: {
					id: 'food-3',
					name: 'Bread',
					brand: 'Brand B',
					calories: 250,
				},
			};

			(db.fridgeItem.create as any).mockResolvedValue(newItem);

			const request = new Request('http://localhost:3000/api/cooking/fridge', {
				method: 'POST',
				body: JSON.stringify({ foodId: 'food-3', quantity: 3 }),
			});

			const response = await POST(request);
			const data = await response.json();

			expect(response.status).toBe(200);
			expect(data).toEqual(newItem);
			expect(db.fridgeItem.create).toHaveBeenCalledWith({
				data: {
					userId: mockSession.user.id,
					foodId: 'food-3',
					quantity: 3,
				},
				include: { food: true },
			});
		});

		it('should handle database errors on create', async () => {
			(getSession as any).mockResolvedValue(mockSession);
			(db.fridgeItem.create as any).mockRejectedValue(new Error('Database error'));

			const request = new Request('http://localhost:3000/api/cooking/fridge', {
				method: 'POST',
				body: JSON.stringify({ foodId: 'food-1', quantity: 2 }),
			});

			// The current implementation doesn't handle errors, so this will throw
			await expect(POST(request)).rejects.toThrow('Database error');
		});
	});

	describe('DELETE', () => {
		it('should return 401 if user is not authenticated', async () => {
			(getSession as any).mockResolvedValue(null);

			const request = new Request('http://localhost:3000/api/cooking/fridge?id=item-1', {
				method: 'DELETE',
			});

			const response = await DELETE(request);
			const data = await response.json();

			expect(response.status).toBe(401);
			expect(data).toEqual({ error: 'Unauthorized' });
		});

		it('should return 400 if id is missing', async () => {
			(getSession as any).mockResolvedValue(mockSession);

			const request = new Request('http://localhost:3000/api/cooking/fridge', {
				method: 'DELETE',
			});

			const response = await DELETE(request);
			const data = await response.json();

			expect(response.status).toBe(400);
			expect(data).toEqual({ error: 'ID is required' });
		});

		it('should delete fridge item', async () => {
			(getSession as any).mockResolvedValue(mockSession);
			(db.fridgeItem.delete as any).mockResolvedValue({ id: 'item-1' });

			const request = new Request('http://localhost:3000/api/cooking/fridge?id=item-1', {
				method: 'DELETE',
			});

			const response = await DELETE(request);
			const data = await response.json();

			expect(response.status).toBe(200);
			expect(data).toEqual({ success: true });
			expect(db.fridgeItem.delete).toHaveBeenCalledWith({
				where: {
					id: 'item-1',
					userId: mockSession.user.id,
				},
			});
		});

		it('should handle database errors on delete', async () => {
			(getSession as any).mockResolvedValue(mockSession);
			(db.fridgeItem.delete as any).mockRejectedValue(new Error('Database error'));

			const request = new Request('http://localhost:3000/api/cooking/fridge?id=item-1', {
				method: 'DELETE',
			});

			// The current implementation doesn't handle errors, so this will throw
			await expect(DELETE(request)).rejects.toThrow('Database error');
		});
	});
});
