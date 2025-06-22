import type { NextRequest } from 'next/server';
import { describe, expect, it, vi, beforeEach } from 'vitest';

import { GET, POST } from './route';

// Mock the database module
vi.mock('~/server/db', () => ({
  db: {
    like: {
      count: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      delete: vi.fn(),
    },
  },
}));

// Mock the session module
vi.mock('~/server/db/session', () => ({
  getSession: vi.fn(),
}));

import { db } from '~/server/db';
import { getSession } from '~/server/db/session';

describe('/api/cooking/recipes/[recipeId]/like', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET', () => {
    it('should return like count and user like status for authenticated user', async () => {
      const mockSession = {
        user: { id: 'user123' },
        expires: new Date(Date.now() + 86400000).toISOString(),
      } as any;
      const recipeId = 'recipe123';

      vi.mocked(getSession).mockResolvedValueOnce(mockSession);
      vi.mocked(db.like).count.mockResolvedValueOnce(5);
      vi.mocked(db.like).findFirst.mockResolvedValueOnce({
        id: 'like123',
      } as any);

      const request = new Request(
        `http://localhost:3000/api/cooking/recipes/${recipeId}/like`
      );
      const response = await GET(request, {
        params: Promise.resolve({ recipeId }),
      });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual({
        likeCount: 5,
        isLikedByUser: true,
      });

      expect(db.like.count).toHaveBeenCalledWith({
        where: { recipeId },
      });
      expect(db.like.findFirst).toHaveBeenCalledWith({
        where: {
          recipeId,
          userId: 'user123',
        },
      });
    });

    it('should return like count without user status for unauthenticated user', async () => {
      const recipeId = 'recipe123';

      vi.mocked(getSession).mockResolvedValueOnce(null);
      vi.mocked(db.like).count.mockResolvedValueOnce(3);

      const request = new Request(
        `http://localhost:3000/api/cooking/recipes/${recipeId}/like`
      );
      const response = await GET(request, {
        params: Promise.resolve({ recipeId }),
      });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual({
        likeCount: 3,
        isLikedByUser: false,
      });

      expect(db.like.findFirst).not.toHaveBeenCalled();
    });

    it('should handle database errors gracefully', async () => {
      const recipeId = 'recipe123';

      vi.mocked(getSession).mockResolvedValueOnce(null);
      vi.mocked(db.like).count.mockRejectedValueOnce(
        new Error('Database error')
      );

      const request = new Request(
        `http://localhost:3000/api/cooking/recipes/${recipeId}/like`
      );
      const response = await GET(request, {
        params: Promise.resolve({ recipeId }),
      });
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data).toEqual({ error: 'Failed to fetch likes' });
    });
  });

  describe('POST', () => {
    it('should create a like for authenticated user', async () => {
      const mockSession = {
        user: { id: 'user123' },
        expires: new Date(Date.now() + 86400000).toISOString(),
      } as any;
      const recipeId = 'recipe123';

      vi.mocked(getSession).mockResolvedValueOnce(mockSession);
      vi.mocked(db.like).findFirst.mockResolvedValueOnce(null);
      vi.mocked(db.like).create.mockResolvedValueOnce({
        id: 'newLike123',
      } as any);

      const request = new Request(
        `http://localhost:3000/api/cooking/recipes/${recipeId}/like`,
        {
          method: 'POST',
        }
      );
      const response = await POST(request, {
        params: Promise.resolve({ recipeId }),
      });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual({
        success: true,
        action: 'liked',
      });

      expect(db.like.create).toHaveBeenCalledWith({
        data: {
          recipeId,
          userId: 'user123',
        },
      });
    });

    it('should remove like if already liked (toggle functionality)', async () => {
      const mockSession = {
        user: { id: 'user123' },
        expires: new Date(Date.now() + 86400000).toISOString(),
      } as any;
      const recipeId = 'recipe123';
      const existingLikeId = 'like123';

      vi.mocked(getSession).mockResolvedValueOnce(mockSession);
      vi.mocked(db.like).findFirst.mockResolvedValueOnce({
        id: existingLikeId,
      } as any);
      vi.mocked(db.like).delete.mockResolvedValueOnce({
        id: existingLikeId,
      } as any);

      const request = new Request(
        `http://localhost:3000/api/cooking/recipes/${recipeId}/like`,
        {
          method: 'POST',
        }
      );
      const response = await POST(request, {
        params: Promise.resolve({ recipeId }),
      });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual({
        success: true,
        action: 'unliked',
      });

      expect(db.like.delete).toHaveBeenCalledWith({
        where: { id: existingLikeId },
      });
      expect(db.like.create).not.toHaveBeenCalled();
    });

    it('should return 401 for unauthenticated user', async () => {
      const recipeId = 'recipe123';

      vi.mocked(getSession).mockResolvedValueOnce(null);

      const request = new Request(
        `http://localhost:3000/api/cooking/recipes/${recipeId}/like`,
        {
          method: 'POST',
        }
      );
      const response = await POST(request, {
        params: Promise.resolve({ recipeId }),
      });
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data).toEqual({ error: 'Unauthorized' });

      expect(db.like.create).not.toHaveBeenCalled();
      expect(db.like.delete).not.toHaveBeenCalled();
    });

    it('should handle database errors gracefully', async () => {
      const mockSession = {
        user: { id: 'user123' },
        expires: new Date(Date.now() + 86400000).toISOString(),
      } as any;
      const recipeId = 'recipe123';

      vi.mocked(getSession).mockResolvedValueOnce(mockSession);
      vi.mocked(db.like).findFirst.mockRejectedValueOnce(
        new Error('Database error')
      );

      const request = new Request(
        `http://localhost:3000/api/cooking/recipes/${recipeId}/like`,
        {
          method: 'POST',
        }
      );
      const response = await POST(request, {
        params: Promise.resolve({ recipeId }),
      });
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data).toEqual({ error: 'Failed to update like status' });
    });
  });
});
