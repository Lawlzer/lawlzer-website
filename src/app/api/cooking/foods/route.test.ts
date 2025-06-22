import { NextRequest } from 'next/server';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET, POST, DELETE } from './route';

// Mock Prisma
vi.mock('@/server/db', () => ({
  db: {
    food: {
      findMany: vi.fn(),
      create: vi.fn(),
      delete: vi.fn(),
      findFirst: vi.fn(),
    },
  },
}));

// Mock auth
vi.mock('@/server/db/session', () => ({
  getSession: vi.fn(),
}));

import { db } from '@/server/db';
import { getSession } from '@/server/db/session';

describe('/api/cooking/foods', () => {
  const mockUser = {
    id: 'test-user-id',
    email: 'test@example.com',
    name: 'Test User',
    emailVerified: null,
    image: null,
    discordId: null,
  };
  const mockSession = {
    user: mockUser,
    expires: new Date(Date.now() + 24 * 60 * 60 * 1000),
  } as any;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET', () => {
    it('should return empty array for unauthenticated users when no public foods exist', async () => {
      vi.mocked(getSession).mockResolvedValue(null);
      vi.mocked(db.food.findMany).mockResolvedValue([]);

      const request = new NextRequest('http://localhost/api/cooking/foods');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(Array.isArray(data)).toBe(true);
      expect(data).toHaveLength(0);
    });

    it('should return user foods when authenticated', async () => {
      vi.mocked(getSession).mockResolvedValue(mockSession);

      const mockFoods = [
        {
          id: 'food-1',
          name: 'Apple',
          calories: 95,
          protein: 0.5,
          carbs: 25,
          fat: 0.3,
          userId: mockUser.id,
        },
        {
          id: 'food-2',
          name: 'Banana',
          calories: 105,
          protein: 1.3,
          carbs: 27,
          fat: 0.4,
          userId: mockUser.id,
        },
      ];

      vi.mocked(db.food.findMany).mockResolvedValue(mockFoods as any);

      const request = new NextRequest('http://localhost/api/cooking/foods');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(Array.isArray(data)).toBe(true);
      expect(data).toHaveLength(2);
      expect(data[0].name).toBe('Apple');
    });
  });

  describe('POST', () => {
    it('should return 401 if not authenticated', async () => {
      vi.mocked(getSession).mockResolvedValue(null);

      const request = new NextRequest('http://localhost/api/cooking/foods', {
        method: 'POST',
        body: JSON.stringify({ name: 'Test Food' }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Guest food saving coming soon');
    });

    it('should create a new food when authenticated', async () => {
      vi.mocked(getSession).mockResolvedValue(mockSession);

      const newFood = {
        name: 'Test Food',
        barcode: '123456',
        brand: 'Test Brand',
        nutrition: {
          calories: 100,
          protein: 10,
          carbs: 20,
          fat: 5,
          fiber: 2,
          sugar: 8,
          sodium: 150,
        },
        servingSize: 100,
        servingUnit: 'g',
      };

      const createdFood = {
        id: 'new-food-id',
        ...newFood,
        userId: mockUser.id,
        calories: newFood.nutrition.calories,
        protein: newFood.nutrition.protein,
        carbs: newFood.nutrition.carbs,
        fat: newFood.nutrition.fat,
        fiber: newFood.nutrition.fiber,
        sugar: newFood.nutrition.sugar,
        sodium: newFood.nutrition.sodium,
        defaultServingSize: newFood.servingSize,
        defaultServingUnit: newFood.servingUnit,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(db.food.create).mockResolvedValue(createdFood as any);

      const request = new NextRequest('http://localhost/api/cooking/foods', {
        method: 'POST',
        body: JSON.stringify(newFood),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.name).toBe('Test Food');
      expect(db.food.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          name: 'Test Food',
          barcode: '123456',
          userId: mockUser.id,
        }),
      });
    });

    it('should return 500 for invalid food data', async () => {
      vi.mocked(getSession).mockResolvedValue(mockSession);

      const invalidFood = {
        // Missing required fields
        name: 'Test Food',
      };

      const request = new NextRequest('http://localhost/api/cooking/foods', {
        method: 'POST',
        body: JSON.stringify(invalidFood),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to save food');
    });
  });

  describe('DELETE', () => {
    it('should return 401 if not authenticated', async () => {
      vi.mocked(getSession).mockResolvedValue(null);

      const request = new NextRequest(
        'http://localhost/api/cooking/foods?id=food-id'
      );
      const response = await DELETE(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
    });

    it('should delete food owned by user', async () => {
      vi.mocked(getSession).mockResolvedValue(mockSession);

      const foodToDelete = {
        id: 'food-to-delete',
        userId: mockUser.id,
        name: 'Test Food',
      };

      vi.mocked(db.food.findFirst).mockResolvedValue(foodToDelete as any);
      vi.mocked(db.food.delete).mockResolvedValue(foodToDelete as any);

      const request = new NextRequest(
        'http://localhost/api/cooking/foods?id=food-to-delete'
      );
      const response = await DELETE(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.message).toBe('Food deleted successfully');
      expect(db.food.delete).toHaveBeenCalledWith({
        where: { id: 'food-to-delete' },
      });
    });

    it('should return 404 if food not found', async () => {
      vi.mocked(getSession).mockResolvedValue(mockSession);
      vi.mocked(db.food.findFirst).mockResolvedValue(null);

      const request = new NextRequest(
        'http://localhost/api/cooking/foods?id=non-existent'
      );
      const response = await DELETE(request);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe('Food not found or unauthorized');
    });

    it('should return 400 if no food ID provided', async () => {
      vi.mocked(getSession).mockResolvedValue(mockSession);

      const request = new NextRequest('http://localhost/api/cooking/foods');
      const response = await DELETE(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Food ID is required');
    });
  });
});
