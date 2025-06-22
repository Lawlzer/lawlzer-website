import { beforeEach, describe, expect, it, vi } from 'vitest';

import { GET, POST, PUT } from './route';

// Mock dependencies
vi.mock('~/server/db', () => ({
	db: {
		goal: {
			findFirst: vi.fn(),
			create: vi.fn(),
			updateMany: vi.fn(),
			update: vi.fn(),
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

describe('/api/cooking/goals', () => {
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

		it('should return default goals if no active goal exists', async () => {
			(getSession as any).mockResolvedValue(mockSession);
			(db.goal.findFirst as any).mockResolvedValue(null);

			const response = await GET();
			const data = await response.json();

			expect(response.status).toBe(200);
			expect(data).toEqual({
				calories: 2000,
				protein: 50,
				carbs: 250,
				fat: 65,
				fiber: 25,
				sugar: 50,
				sodium: 2300,
				isDefault: true,
			});
		});

		it('should return active goal if exists', async () => {
			const mockGoal = {
				id: 'goal-id',
				userId: mockSession.user.id,
				calories: 2500,
				protein: 75,
				carbs: 300,
				fat: 80,
				fiber: 30,
				sugar: 60,
				sodium: 2500,
				isActive: true,
				startDate: new Date(),
			};

			(getSession as any).mockResolvedValue(mockSession);
			(db.goal.findFirst as any).mockResolvedValue(mockGoal);

			const response = await GET();
			const data = await response.json();

			expect(response.status).toBe(200);
			expect(data).toEqual(
				expect.objectContaining({
					id: 'goal-id',
					userId: mockSession.user.id,
					calories: 2500,
					protein: 75,
					carbs: 300,
					fat: 80,
					fiber: 30,
					sugar: 60,
					sodium: 2500,
					isActive: true,
					startDate: expect.any(String),
				})
			);
			expect(db.goal.findFirst).toHaveBeenCalledWith({
				where: {
					userId: mockSession.user.id,
					isActive: true,
				},
				orderBy: {
					startDate: 'desc',
				},
			});
		});

		it('should handle database errors', async () => {
			(getSession as any).mockResolvedValue(mockSession);
			(db.goal.findFirst as any).mockRejectedValue(new Error('Database error'));

			const response = await GET();
			const data = await response.json();

			expect(response.status).toBe(500);
			expect(data).toEqual({ error: 'Failed to fetch goal' });
		});
	});

	describe('POST', () => {
		it('should return 401 if user is not authenticated', async () => {
			(getSession as any).mockResolvedValue(null);

			const request = new Request('http://localhost:3000/api/cooking/goals', {
				method: 'POST',
				body: JSON.stringify({ calories: 2000 }),
			});

			const response = await POST(request);
			const data = await response.json();

			expect(response.status).toBe(401);
			expect(data).toEqual({ error: 'Unauthorized' });
		});

		it('should return 400 if calories are invalid', async () => {
			(getSession as any).mockResolvedValue(mockSession);

			const request = new Request('http://localhost:3000/api/cooking/goals', {
				method: 'POST',
				body: JSON.stringify({ calories: 0 }),
			});

			const response = await POST(request);
			const data = await response.json();

			expect(response.status).toBe(400);
			expect(data).toEqual({ error: 'Invalid calorie goal' });
		});

		it('should create a new goal and deactivate existing ones', async () => {
			(getSession as any).mockResolvedValue(mockSession);
			(db.goal.updateMany as any).mockResolvedValue({ count: 1 });
			(db.goal.create as any).mockResolvedValue({
				id: 'new-goal-id',
				userId: mockSession.user.id,
				calories: 2200,
				protein: 60,
				carbs: 275,
				fat: 70,
				isActive: true,
				startDate: new Date(),
			});

			const requestBody = {
				calories: 2200,
				protein: 60,
				carbs: 275,
				fat: 70,
			};

			const request = new Request('http://localhost:3000/api/cooking/goals', {
				method: 'POST',
				body: JSON.stringify(requestBody),
			});

			const response = await POST(request);
			const data = await response.json();

			expect(response.status).toBe(200);
			expect(data.calories).toBe(2200);
			expect(data.protein).toBe(60);

			// Verify deactivation of existing goals
			expect(db.goal.updateMany).toHaveBeenCalledWith({
				where: {
					userId: mockSession.user.id,
					isActive: true,
				},
				data: {
					isActive: false,
					endDate: expect.any(Date),
				},
			});

			// Verify creation of new goal
			expect(db.goal.create).toHaveBeenCalledWith({
				data: expect.objectContaining({
					userId: mockSession.user.id,
					calories: 2200,
					protein: 60,
					carbs: 275,
					fat: 70,
					isActive: true,
				}),
			});
		});

		it('should handle database errors', async () => {
			(getSession as any).mockResolvedValue(mockSession);
			(db.goal.updateMany as any).mockRejectedValue(new Error('Database error'));

			const request = new Request('http://localhost:3000/api/cooking/goals', {
				method: 'POST',
				body: JSON.stringify({ calories: 2000 }),
			});

			const response = await POST(request);
			const data = await response.json();

			expect(response.status).toBe(500);
			expect(data).toEqual({ error: 'Failed to create goal' });
		});
	});

	describe('PUT', () => {
		it('should return 401 if user is not authenticated', async () => {
			(getSession as any).mockResolvedValue(null);

			const request = new Request('http://localhost:3000/api/cooking/goals', {
				method: 'PUT',
				body: JSON.stringify({ calories: 2000 }),
			});

			const response = await PUT(request);
			const data = await response.json();

			expect(response.status).toBe(401);
			expect(data).toEqual({ error: 'Unauthorized' });
		});

		it('should return 404 if no active goal exists', async () => {
			(getSession as any).mockResolvedValue(mockSession);
			(db.goal.findFirst as any).mockResolvedValue(null);

			const request = new Request('http://localhost:3000/api/cooking/goals', {
				method: 'PUT',
				body: JSON.stringify({ calories: 2000 }),
			});

			const response = await PUT(request);
			const data = await response.json();

			expect(response.status).toBe(404);
			expect(data).toEqual({ error: 'No active goal found' });
		});

		it('should update existing goal', async () => {
			const existingGoal = {
				id: 'goal-id',
				userId: mockSession.user.id,
				calories: 2000,
				protein: 50,
				carbs: 250,
				fat: 65,
				isActive: true,
			};

			const updatedGoal = {
				...existingGoal,
				calories: 2500,
				protein: 75,
			};

			(getSession as any).mockResolvedValue(mockSession);
			(db.goal.findFirst as any).mockResolvedValue(existingGoal);
			(db.goal.update as any).mockResolvedValue(updatedGoal);

			const request = new Request('http://localhost:3000/api/cooking/goals', {
				method: 'PUT',
				body: JSON.stringify({ calories: 2500, protein: 75 }),
			});

			const response = await PUT(request);
			const data = await response.json();

			expect(response.status).toBe(200);
			expect(data.calories).toBe(2500);
			expect(data.protein).toBe(75);
			expect(data.carbs).toBe(250); // Should remain unchanged

			expect(db.goal.update).toHaveBeenCalledWith({
				where: { id: 'goal-id' },
				data: expect.objectContaining({
					calories: 2500,
					protein: 75,
				}),
			});
		});

		it('should handle database errors', async () => {
			(getSession as any).mockResolvedValue(mockSession);
			(db.goal.findFirst as any).mockResolvedValue({ id: 'goal-id' });
			(db.goal.update as any).mockRejectedValue(new Error('Database error'));

			const request = new Request('http://localhost:3000/api/cooking/goals', {
				method: 'PUT',
				body: JSON.stringify({ calories: 2000 }),
			});

			const response = await PUT(request);
			const data = await response.json();

			expect(response.status).toBe(500);
			expect(data).toEqual({ error: 'Failed to update goal' });
		});
	});
});
