import { describe, expect, it, vi, beforeEach } from 'vitest';

import { GET, POST } from './route';

// Mock the database module
vi.mock('~/server/db', () => ({
  db: {
    comment: {
      findMany: vi.fn(),
      create: vi.fn(),
    },
  },
}));

// Mock the session module
vi.mock('~/server/db/session', () => ({
  getSession: vi.fn(),
}));

import { db } from '~/server/db';
import { getSession } from '~/server/db/session';

describe('/api/cooking/recipes/[recipeId]/comments', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET', () => {
    it('should return comments for a recipe', async () => {
      const recipeId = 'recipe123';
      const mockComments = [
        {
          id: 'comment1',
          content: 'Great recipe!',
          createdAt: new Date('2024-01-01').toISOString(),
          author: {
            id: 'user1',
            name: 'John Doe',
            image: 'https://example.com/avatar.jpg',
          },
        },
        {
          id: 'comment2',
          content: 'Loved it!',
          createdAt: new Date('2024-01-02').toISOString(),
          author: {
            id: 'user2',
            name: 'Jane Smith',
            image: null,
          },
        },
      ];

      vi.mocked(db.comment).findMany.mockResolvedValueOnce(mockComments as any);

      const request = new Request(
        `http://localhost:3000/api/cooking/recipes/${recipeId}/comments`
      );
      const response = await GET(request, {
        params: Promise.resolve({ recipeId }),
      });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual(mockComments);

      expect(db.comment.findMany).toHaveBeenCalledWith({
        where: {
          recipeId,
        },
        include: {
          author: {
            select: {
              id: true,
              name: true,
              image: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      });
    });

    it('should return empty array when no comments exist', async () => {
      const recipeId = 'recipe123';

      vi.mocked(db.comment).findMany.mockResolvedValueOnce([]);

      const request = new Request(
        `http://localhost:3000/api/cooking/recipes/${recipeId}/comments`
      );
      const response = await GET(request, {
        params: Promise.resolve({ recipeId }),
      });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual([]);
    });

    it('should handle database errors gracefully', async () => {
      const recipeId = 'recipe123';

      vi.mocked(db.comment).findMany.mockRejectedValueOnce(
        new Error('Database error')
      );

      const request = new Request(
        `http://localhost:3000/api/cooking/recipes/${recipeId}/comments`
      );
      const response = await GET(request, {
        params: Promise.resolve({ recipeId }),
      });
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data).toEqual({ error: 'Failed to fetch comments' });
    });
  });

  describe('POST', () => {
    it('should create a comment for authenticated user', async () => {
      const mockSession = {
        user: { id: 'user123', name: 'Test User' },
        expires: new Date(Date.now() + 86400000).toISOString(),
      } as any;
      const recipeId = 'recipe123';
      const commentContent = 'This recipe is amazing!';
      const newComment = {
        id: 'comment123',
        content: commentContent,
        recipeId,
        authorId: 'user123',
        createdAt: new Date().toISOString(),
        author: {
          id: 'user123',
          name: 'Test User',
          image: null,
        },
      };

      vi.mocked(getSession).mockResolvedValueOnce(mockSession);
      vi.mocked(db.comment).create.mockResolvedValueOnce(newComment as any);

      const request = new Request(
        `http://localhost:3000/api/cooking/recipes/${recipeId}/comments`,
        {
          method: 'POST',
          body: JSON.stringify({ content: commentContent }),
        }
      );
      const response = await POST(request, {
        params: Promise.resolve({ recipeId }),
      });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual(newComment);

      expect(db.comment.create).toHaveBeenCalledWith({
        data: {
          content: commentContent,
          recipeId,
          authorId: 'user123',
        },
        include: {
          author: {
            select: {
              id: true,
              name: true,
              image: true,
            },
          },
        },
      });
    });

    it('should trim whitespace from comment content', async () => {
      const mockSession = {
        user: { id: 'user123' },
        expires: new Date(Date.now() + 86400000).toISOString(),
      } as any;
      const recipeId = 'recipe123';
      const commentContent = '  Trimmed comment  ';

      vi.mocked(getSession).mockResolvedValueOnce(mockSession);
      vi.mocked(db.comment).create.mockResolvedValueOnce({} as any);

      const request = new Request(
        `http://localhost:3000/api/cooking/recipes/${recipeId}/comments`,
        {
          method: 'POST',
          body: JSON.stringify({ content: commentContent }),
        }
      );
      await POST(request, { params: Promise.resolve({ recipeId }) });

      expect(db.comment.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            content: 'Trimmed comment',
          }),
        })
      );
    });

    it('should return 401 for unauthenticated user', async () => {
      const recipeId = 'recipe123';

      vi.mocked(getSession).mockResolvedValueOnce(null);

      const request = new Request(
        `http://localhost:3000/api/cooking/recipes/${recipeId}/comments`,
        {
          method: 'POST',
          body: JSON.stringify({ content: 'Test comment' }),
        }
      );
      const response = await POST(request, {
        params: Promise.resolve({ recipeId }),
      });
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data).toEqual({ error: 'Unauthorized' });

      expect(db.comment.create).not.toHaveBeenCalled();
    });

    it('should validate empty comment content', async () => {
      const mockSession = {
        user: { id: 'user123' },
        expires: new Date(Date.now() + 86400000).toISOString(),
      } as any;
      const recipeId = 'recipe123';

      const testCases = [
        { content: '' },
        { content: '   ' },
        { content: null },
        { content: undefined },
        {},
      ];

      for (const testCase of testCases) {
        vi.mocked(getSession).mockResolvedValueOnce(mockSession);

        const request = new Request(
          `http://localhost:3000/api/cooking/recipes/${recipeId}/comments`,
          {
            method: 'POST',
            body: JSON.stringify(testCase),
          }
        );
        const response = await POST(request, {
          params: Promise.resolve({ recipeId }),
        });
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data).toEqual({ error: 'Comment content cannot be empty' });
      }

      expect(db.comment.create).not.toHaveBeenCalled();
    });

    it('should handle database errors gracefully', async () => {
      const mockSession = {
        user: { id: 'user123' },
        expires: new Date(Date.now() + 86400000).toISOString(),
      } as any;
      const recipeId = 'recipe123';

      vi.mocked(getSession).mockResolvedValueOnce(mockSession);
      vi.mocked(db.comment).create.mockRejectedValueOnce(
        new Error('Database error')
      );

      const request = new Request(
        `http://localhost:3000/api/cooking/recipes/${recipeId}/comments`,
        {
          method: 'POST',
          body: JSON.stringify({ content: 'Test comment' }),
        }
      );
      const response = await POST(request, {
        params: Promise.resolve({ recipeId }),
      });
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data).toEqual({ error: 'Failed to create comment' });
    });
  });
});
