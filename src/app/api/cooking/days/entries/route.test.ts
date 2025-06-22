import { describe, expect, it, vi, beforeEach } from 'vitest';

import { POST } from './route';

// Mock the database module
vi.mock('~/server/db', () => ({
  db: {
    day: {
      upsert: vi.fn(),
    },
    dayEntry: {
      create: vi.fn(),
    },
    recipe: {
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

describe('/api/cooking/days/entries', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('POST', () => {
    it('should create a day entry with food for authenticated user', async () => {
      const mockSession = {
        user: { id: 'user123' },
        expires: new Date(Date.now() + 86400000).toISOString(),
      } as any;

      const mockDay = {
        id: 'day123',
        userId: 'user123',
        date: new Date('2024-01-01'),
      };
      const mockEntry = {
        id: 'entry123',
        dayId: 'day123',
        foodId: 'food123',
        recipeVersionId: null,
        amount: 150,
        mealType: 'breakfast',
        calories: 200,
        protein: 15,
        carbs: 20,
        fat: 10,
        fiber: 5,
        sugar: 8,
        sodium: 300,
      };

      vi.mocked(getSession).mockResolvedValueOnce(mockSession);
      vi.mocked(db.day).upsert.mockResolvedValueOnce(mockDay as any);
      vi.mocked(db.dayEntry).create.mockResolvedValueOnce(mockEntry as any);

      const requestData = {
        date: '2024-01-01',
        entry: {
          foodId: 'food123',
          amount: 150,
          mealType: 'breakfast',
          calories: 200,
          protein: 15,
          carbs: 20,
          fat: 10,
          fiber: 5,
          sugar: 8,
          sodium: 300,
        },
      };

      const request = new Request(
        'http://localhost:3000/api/cooking/days/entries',
        {
          method: 'POST',
          body: JSON.stringify(requestData),
        }
      );
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual(mockEntry);

      expect(db.day.upsert).toHaveBeenCalledWith({
        where: {
          userId_date: {
            userId: 'user123',
            date: new Date('2024-01-01'),
          },
        },
        create: {
          userId: 'user123',
          date: new Date('2024-01-01'),
        },
        update: {},
      });

      expect(db.dayEntry.create).toHaveBeenCalledWith({
        data: {
          dayId: 'day123',
          foodId: 'food123',
          recipeVersionId: null,
          amount: 150,
          mealType: 'breakfast',
          calories: 200,
          protein: 15,
          carbs: 20,
          fat: 10,
          fiber: 5,
          sugar: 8,
          sodium: 300,
        },
      });
    });

    it('should create a day entry with recipe for authenticated user', async () => {
      const mockSession = {
        user: { id: 'user123' },
        expires: new Date(Date.now() + 86400000).toISOString(),
      } as any;

      const mockDay = {
        id: 'day123',
        userId: 'user123',
        date: new Date('2024-01-01'),
      };
      const mockRecipe = { currentVersionId: 'version123' };
      const mockEntry = {
        id: 'entry123',
        dayId: 'day123',
        foodId: null,
        recipeVersionId: 'version123',
        amount: 250,
        mealType: 'lunch',
        calories: 400,
        protein: 30,
        carbs: 40,
        fat: 20,
        fiber: 10,
        sugar: 15,
        sodium: 600,
      };

      vi.mocked(getSession).mockResolvedValueOnce(mockSession);
      vi.mocked(db.day).upsert.mockResolvedValueOnce(mockDay as any);
      vi.mocked(db.recipe).findUnique.mockResolvedValueOnce(mockRecipe as any);
      vi.mocked(db.dayEntry).create.mockResolvedValueOnce(mockEntry as any);

      const requestData = {
        date: '2024-01-01',
        entry: {
          recipeId: 'recipe123',
          amount: 250,
          mealType: 'lunch',
          calories: 400,
          protein: 30,
          carbs: 40,
          fat: 20,
          fiber: 10,
          sugar: 15,
          sodium: 600,
        },
      };

      const request = new Request(
        'http://localhost:3000/api/cooking/days/entries',
        {
          method: 'POST',
          body: JSON.stringify(requestData),
        }
      );
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual(mockEntry);

      expect(db.recipe.findUnique).toHaveBeenCalledWith({
        where: { id: 'recipe123' },
        select: { currentVersionId: true },
      });

      expect(db.dayEntry.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          recipeVersionId: 'version123',
        }),
      });
    });

    it('should return 401 for unauthenticated user', async () => {
      vi.mocked(getSession).mockResolvedValueOnce(null);

      const request = new Request(
        'http://localhost:3000/api/cooking/days/entries',
        {
          method: 'POST',
          body: JSON.stringify({
            date: '2024-01-01',
            entry: {
              foodId: 'food123',
              amount: 100,
              mealType: 'breakfast',
              calories: 100,
              protein: 10,
              carbs: 10,
              fat: 5,
              fiber: 2,
              sugar: 3,
              sodium: 200,
            },
          }),
        }
      );
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data).toEqual({ error: 'Unauthorized' });

      expect(db.day.upsert).not.toHaveBeenCalled();
      expect(db.dayEntry.create).not.toHaveBeenCalled();
    });

    it('should validate required fields', async () => {
      const mockSession = {
        user: { id: 'user123' },
        expires: new Date(Date.now() + 86400000).toISOString(),
      } as any;

      vi.mocked(getSession).mockResolvedValueOnce(mockSession);

      const invalidData = {
        date: '2024-01-01',
        entry: {
          // Missing required fields
          amount: 100,
        },
      };

      const request = new Request(
        'http://localhost:3000/api/cooking/days/entries',
        {
          method: 'POST',
          body: JSON.stringify(invalidData),
        }
      );
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid data format');
      expect(data.details).toBeDefined();

      expect(db.day.upsert).not.toHaveBeenCalled();
      expect(db.dayEntry.create).not.toHaveBeenCalled();
    });

    it('should validate amount is positive', async () => {
      const mockSession = {
        user: { id: 'user123' },
        expires: new Date(Date.now() + 86400000).toISOString(),
      } as any;

      vi.mocked(getSession).mockResolvedValueOnce(mockSession);

      const invalidData = {
        date: '2024-01-01',
        entry: {
          foodId: 'food123',
          amount: -50, // Invalid negative amount
          mealType: 'breakfast',
          calories: 100,
          protein: 10,
          carbs: 10,
          fat: 5,
          fiber: 2,
          sugar: 3,
          sodium: 200,
        },
      };

      const request = new Request(
        'http://localhost:3000/api/cooking/days/entries',
        {
          method: 'POST',
          body: JSON.stringify(invalidData),
        }
      );
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid data format');

      expect(db.day.upsert).not.toHaveBeenCalled();
      expect(db.dayEntry.create).not.toHaveBeenCalled();
    });

    it('should handle database errors gracefully', async () => {
      const mockSession = {
        user: { id: 'user123' },
        expires: new Date(Date.now() + 86400000).toISOString(),
      } as any;

      vi.mocked(getSession).mockResolvedValueOnce(mockSession);
      vi.mocked(db.day).upsert.mockRejectedValueOnce(
        new Error('Database error')
      );

      const requestData = {
        date: '2024-01-01',
        entry: {
          foodId: 'food123',
          amount: 100,
          mealType: 'breakfast',
          calories: 100,
          protein: 10,
          carbs: 10,
          fat: 5,
          fiber: 2,
          sugar: 3,
          sodium: 200,
        },
      };

      const request = new Request(
        'http://localhost:3000/api/cooking/days/entries',
        {
          method: 'POST',
          body: JSON.stringify(requestData),
        }
      );
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data).toEqual({ error: 'Failed to create day entry' });
    });
  });
});
