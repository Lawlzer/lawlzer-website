import { NextResponse } from 'next/server';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import { POST } from './route';

// Mock dependencies
vi.mock('~/server/db', () => ({
  db: {
    $transaction: vi.fn(),
    recipe: {
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    food: {
      findFirst: vi.fn(),
      create: vi.fn(),
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

const validRecipeData = {
  name: 'Imported Pasta Recipe',
  description: 'A delicious imported pasta',
  notes: 'Some notes',
  prepTime: 15,
  cookTime: 20,
  servings: 4,
  visibility: 'private' as const,
  isComponent: false,
  items: [
    {
      amount: 200,
      unit: 'g',
      food: {
        name: 'Pasta',
        brand: null,
        calories: 350,
        protein: 12,
        carbs: 75,
        fat: 2,
        fiber: 3,
        sugar: 2,
        sodium: 5,
      },
    },
    {
      amount: 100,
      unit: 'g',
      food: {
        name: 'Tomato Sauce',
        brand: 'Brand X',
        calories: 50,
        protein: 1,
        carbs: 10,
        fat: 0.5,
        fiber: 2,
        sugar: 5,
        sodium: 300,
      },
    },
  ],
};

const nestedRecipeData = {
  name: 'Complex Recipe',
  description: 'Recipe with nested component',
  notes: null,
  prepTime: 30,
  cookTime: 45,
  servings: 6,
  visibility: 'public' as const,
  isComponent: false,
  items: [
    {
      amount: 1,
      unit: 'serving',
      recipe: {
        name: 'Sauce Component',
        description: 'Base sauce',
        notes: null,
        prepTime: 10,
        cookTime: 20,
        servings: 4,
        visibility: 'private' as const,
        isComponent: true,
        items: [
          {
            amount: 50,
            unit: 'ml',
            food: {
              name: 'Olive Oil',
              brand: null,
              calories: 120,
              protein: 0,
              carbs: 0,
              fat: 14,
              fiber: 0,
              sugar: 0,
              sodium: 0,
            },
          },
        ],
      },
    },
  ],
};

describe('/api/cooking/import', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('POST', () => {
    it('should return 401 if user is not authenticated', async () => {
      (getSession as any).mockResolvedValue(null);

      const request = new Request('http://localhost:3000/api/cooking/import', {
        method: 'POST',
        body: JSON.stringify(validRecipeData),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data).toEqual({ error: 'Unauthorized' });
    });

    it('should return 400 for invalid recipe format', async () => {
      (getSession as any).mockResolvedValue(mockSession);

      const invalidData = {
        name: 'Invalid Recipe',
        // Missing required fields
      };

      const request = new Request('http://localhost:3000/api/cooking/import', {
        method: 'POST',
        body: JSON.stringify(invalidData),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid recipe format');
      expect(data.details).toBeDefined();
    });

    it('should successfully import a simple recipe', async () => {
      (getSession as any).mockResolvedValue(mockSession);

      const mockRecipeId = 'new-recipe-id';
      const mockVersionId = 'new-version-id';

      // Mock transaction
      (db.$transaction as any).mockImplementation(async (callback: any) => {
        // Mock food operations within transaction
        const tx = {
          food: {
            findFirst: vi.fn(),
            create: vi.fn().mockResolvedValue({ id: 'food-id' }),
          },
          recipe: {
            create: vi.fn().mockResolvedValue({
              id: mockRecipeId,
              versions: [{ id: mockVersionId }],
            }),
            update: vi.fn().mockResolvedValue({ id: mockRecipeId }),
          },
        };

        // Existing food not found
        tx.food.findFirst.mockResolvedValue(null);

        return callback(tx);
      });

      const mockRecipe = {
        id: mockRecipeId,
        currentVersion: {
          id: mockVersionId,
          items: [],
        },
      };

      (db.recipe.findUnique as any).mockResolvedValue(mockRecipe);

      const request = new Request('http://localhost:3000/api/cooking/import', {
        method: 'POST',
        body: JSON.stringify(validRecipeData),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual(mockRecipe);
      expect(db.$transaction).toHaveBeenCalled();
      expect(db.recipe.findUnique).toHaveBeenCalledWith({
        where: { id: mockRecipeId },
        include: { currentVersion: { include: { items: true } } },
      });
    });

    it('should handle existing foods when importing', async () => {
      (getSession as any).mockResolvedValue(mockSession);

      const mockRecipeId = 'new-recipe-id';
      const existingFoodId = 'existing-food-id';

      (db.$transaction as any).mockImplementation(async (callback: any) => {
        const tx = {
          food: {
            findFirst: vi.fn().mockResolvedValue({ id: existingFoodId }),
            create: vi.fn(),
          },
          recipe: {
            create: vi.fn().mockResolvedValue({
              id: mockRecipeId,
              versions: [{ id: 'version-id' }],
            }),
            update: vi.fn().mockResolvedValue({ id: mockRecipeId }),
          },
        };

        return callback(tx);
      });

      (db.recipe.findUnique as any).mockResolvedValue({
        id: mockRecipeId,
        currentVersion: { items: [] },
      });

      const request = new Request('http://localhost:3000/api/cooking/import', {
        method: 'POST',
        body: JSON.stringify(validRecipeData),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.id).toBe(mockRecipeId);
    });

    it('should handle nested recipes correctly', async () => {
      (getSession as any).mockResolvedValue(mockSession);

      const mockRecipeId = 'parent-recipe-id';
      const mockNestedRecipeId = 'nested-recipe-id';

      (db.$transaction as any).mockImplementation(async (callback: any) => {
        const tx = {
          food: {
            findFirst: vi.fn().mockResolvedValue(null),
            create: vi.fn().mockResolvedValue({ id: 'food-id' }),
          },
          recipe: {
            create: vi
              .fn()
              .mockResolvedValueOnce({
                id: mockNestedRecipeId,
                versions: [{ id: 'nested-version-id' }],
              })
              .mockResolvedValueOnce({
                id: mockRecipeId,
                versions: [{ id: 'parent-version-id' }],
              }),
            update: vi
              .fn()
              .mockResolvedValueOnce({ id: mockNestedRecipeId })
              .mockResolvedValueOnce({ id: mockRecipeId }),
          },
        };

        return callback(tx);
      });

      (db.recipe.findUnique as any).mockResolvedValue({
        id: mockRecipeId,
        currentVersion: { items: [] },
      });

      const request = new Request('http://localhost:3000/api/cooking/import', {
        method: 'POST',
        body: JSON.stringify(nestedRecipeData),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.id).toBe(mockRecipeId);
    });

    it('should handle database errors', async () => {
      (getSession as any).mockResolvedValue(mockSession);
      (db.$transaction as any).mockRejectedValue(new Error('Database error'));

      const request = new Request('http://localhost:3000/api/cooking/import', {
        method: 'POST',
        body: JSON.stringify(validRecipeData),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data).toEqual({ error: 'Failed to import recipe' });
    });

    it('should validate visibility enum values', async () => {
      (getSession as any).mockResolvedValue(mockSession);

      const invalidVisibilityData = {
        ...validRecipeData,
        visibility: 'invalid-visibility',
      };

      const request = new Request('http://localhost:3000/api/cooking/import', {
        method: 'POST',
        body: JSON.stringify(invalidVisibilityData),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid recipe format');
    });
  });
});
