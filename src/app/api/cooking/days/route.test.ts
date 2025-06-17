import type { NextRequest } from 'next/server';
import { describe, expect, it, vi } from 'vitest';

import { GET, POST } from './route';

// Mock the database module
vi.mock('~/server/db', () => ({
	db: {
		day: {
			findUnique: vi.fn(),
			findMany: vi.fn(),
			upsert: vi.fn(),
		},
		dayEntry: {
			deleteMany: vi.fn(),
			create: vi.fn(),
		},
		food: {
			findUnique: vi.fn(),
		},
		recipeVersion: {
			findUnique: vi.fn(),
		},
	},
}));

// Mock the session module
vi.mock('~/server/db/session', () => ({
	getSession: vi.fn(),
}));

import { db } from '~/server/db';
import { getSession } from '~/server/db/session';

describe('/api/cooking/days', () => {
	describe('GET', () => {
		it('should return single day when date parameter provided', async () => {
			const mockSession = {
				user: { id: 'user123' },
				expires: new Date(Date.now() + 86400000).toISOString(),
			} as any;
			const mockDay = {
				id: 'day1',
				date: '2024-01-01T00:00:00.000Z',
				entries: [],
				targetCalories: 2000,
			};

			vi.mocked(getSession).mockResolvedValueOnce(mockSession);
			vi.mocked(db.day).findUnique.mockResolvedValueOnce(mockDay as any);

			const req = {
				nextUrl: new URL('http://localhost:3000/api/cooking/days?date=2024-01-01'),
			} as NextRequest;
			const response = await GET(req);
			const data = await response.json();

			expect(response.status).toBe(200);
			expect(data.day).toEqual(mockDay);
		});

		it('should return recent days when no parameters provided', async () => {
			const mockSession = {
				user: { id: 'user123' },
				expires: new Date(Date.now() + 86400000).toISOString(),
			} as any;
			const mockDays = [
				{ id: 'day1', date: '2024-01-01T00:00:00.000Z', entries: [] },
				{ id: 'day2', date: '2024-01-02T00:00:00.000Z', entries: [] },
			];

			vi.mocked(getSession).mockResolvedValueOnce(mockSession);
			vi.mocked(db.day).findMany.mockResolvedValueOnce(mockDays as any);

			const req = {
				nextUrl: new URL('http://localhost:3000/api/cooking/days'),
			} as NextRequest;
			const response = await GET(req);
			const data = await response.json();

			expect(response.status).toBe(200);
			expect(data.days).toEqual(mockDays);
		});

		it('should return 401 for non-logged-in users', async () => {
			vi.mocked(getSession).mockResolvedValueOnce(null);

			const req = {
				nextUrl: new URL('http://localhost:3000/api/cooking/days'),
			} as NextRequest;
			const response = await GET(req);
			const data = await response.json();

			expect(response.status).toBe(401);
			expect(data).toHaveProperty('error', 'Unauthorized');
		});
	});

	describe('POST', () => {
		it('should create new day with entries', async () => {
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
			vi.mocked(db.day).upsert.mockResolvedValueOnce({ id: 'newDay' } as any);
			vi.mocked(db.food).findUnique.mockResolvedValueOnce(mockFood as any);
			vi.mocked(db.day).findUnique.mockResolvedValueOnce({
				id: 'newDay',
				entries: [{ id: 'entry1', foodId: 'food1', amount: 200 }],
			} as any);

			const dayData = {
				date: '2024-01-01',
				entries: [{ foodId: 'food1', amount: 200 }],
			};

			const req = {
				json: async () => dayData,
			} as NextRequest;

			const response = await POST(req);
			const data = await response.json();

			expect(response.status).toBe(200);
			expect(data).toHaveProperty('day');
		});

		it('should return 401 for non-logged-in users', async () => {
			vi.mocked(getSession).mockResolvedValueOnce(null);

			const req = {
				json: async () => ({ date: '2024-01-01' }),
			} as NextRequest;

			const response = await POST(req);
			const data = await response.json();

			expect(response.status).toBe(401);
			expect(data).toHaveProperty('error', 'Unauthorized');
		});
	});
});
