import type { Session } from '@prisma/client';
import { cookies } from 'next/headers';
import { createExpiredSession, createMockSessionWithUser, createMockUser } from 'testUtils/unit/data.factories';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { createSession, destroySession, getSession, getUserFromSession } from './session';

// Mock dependencies
vi.mock('next/headers', () => ({
	cookies: vi.fn(),
}));

// Hoist mock definitions
const { mockSessionFindUnique, mockSessionDelete, mockSessionCreate, mockSessionDeleteMany } = vi.hoisted(() => ({
	mockSessionFindUnique: vi.fn(),
	mockSessionDelete: vi.fn(),
	mockSessionCreate: vi.fn(),
	mockSessionDeleteMany: vi.fn(),
}));

vi.mock('~/server/db', () =>
	// Now these variables are guaranteed to be initialized
	({
		db: {
			session: {
				findUnique: mockSessionFindUnique,
				delete: mockSessionDelete,
				create: mockSessionCreate,
				deleteMany: mockSessionDeleteMany,
			},
		},
	})
);

// Helper to mock cookies() behavior
const mockCookies = (returnValue: { value: string } | undefined): void => {
	(cookies as ReturnType<typeof vi.fn>).mockImplementation(async () => ({
		get: (name: string) => {
			if (name === 'session_token') {
				return returnValue;
			}
			return undefined;
		},
	}));
};

describe('Session Management', () => {
	const mockUser = createMockUser();
	const validSessionToken = 'valid-session-token';
	const expiredSessionToken = 'expired-session-token';
	const notFoundSessionToken = 'not-found-session-token';

	const mockValidSession = createMockSessionWithUser({ sessionToken: validSessionToken }, { id: mockUser.id });

	const mockExpiredSession = createMockSessionWithUser(
		{
			...createExpiredSession({ sessionToken: expiredSessionToken }),
			userId: mockUser.id,
		},
		{ id: mockUser.id }
	);

	beforeEach(() => {
		vi.clearAllMocks();

		// Default mock behavior for findUnique
		mockSessionFindUnique.mockImplementation(async ({ where }) => {
			if (where.sessionToken === validSessionToken) {
				return Promise.resolve(mockValidSession);
			}
			if (where.sessionToken === expiredSessionToken) {
				return Promise.resolve(mockExpiredSession);
			}
			return Promise.resolve(null);
		});

		mockSessionDelete.mockResolvedValue({});
		mockSessionCreate.mockImplementation(async ({ data }): Promise<Session> => Promise.resolve({ ...data, id: 'new-session-id' } as Session));
		mockSessionDeleteMany.mockResolvedValue({ count: 1 });
	});

	describe('getSession', () => {
		it('should return null if no session token cookie exists', async () => {
			mockCookies(undefined);
			const session = await getSession();
			expect(session).toBeNull();
			expect(mockSessionFindUnique).not.toHaveBeenCalled();
		});

		it('should return null if session token is invalid or not found', async () => {
			mockCookies({ value: notFoundSessionToken });
			const session = await getSession();
			expect(session).toBeNull();
			expect(mockSessionFindUnique).toHaveBeenCalledWith({
				where: { sessionToken: notFoundSessionToken },
				include: { user: true },
			});
		});

		it('should return null and delete the session if it is expired', async () => {
			mockCookies({ value: expiredSessionToken });
			const session = await getSession();
			expect(session).toBeNull();
			expect(mockSessionFindUnique).toHaveBeenCalledWith({
				where: { sessionToken: expiredSessionToken },
				include: { user: true },
			});
			expect(mockSessionDelete).toHaveBeenCalledWith({
				where: { id: mockExpiredSession.id },
			});
		});

		it('should return session data if the session is valid', async () => {
			mockCookies({ value: validSessionToken });
			const session = await getSession();
			expect(session).toEqual({
				user: mockValidSession.user,
				expires: mockValidSession.expires,
			});
			expect(mockSessionFindUnique).toHaveBeenCalledWith({
				where: { sessionToken: validSessionToken },
				include: { user: true },
			});
			expect(mockSessionDelete).not.toHaveBeenCalled();
		});
	});

	describe('getUserFromSession', () => {
		it('should return null if getSession returns null', async () => {
			mockCookies(undefined); // Leads to getSession returning null
			const user = await getUserFromSession();
			expect(user).toBeNull();
		});

		it('should return the user if getSession returns a valid session', async () => {
			mockCookies({ value: validSessionToken });
			const user = await getUserFromSession();
			expect(user).toEqual(mockValidSession.user);
		});
	});

	describe('createSession', () => {
		it('should call db.session.create with correct user ID and expiration date', async () => {
			const userId = 'user456';
			const result = await createSession(userId);

			expect(mockSessionCreate).toHaveBeenCalledTimes(1);
			const createArgs = mockSessionCreate.mock.calls[0][0];

			expect(createArgs.data.userId).toBe(userId);
			expect(createArgs.data.sessionToken).toEqual(expect.any(String)); // UUID
			expect(createArgs.data.expires).toBeInstanceOf(Date);

			// Check if the expiration date is roughly 7 days in the future
			const expectedExpiry = new Date();
			expectedExpiry.setDate(expectedExpiry.getDate() + 7);
			const timeDifference = Math.abs(createArgs.data.expires.getTime() - expectedExpiry.getTime());
			expect(timeDifference).toBeLessThan(1000); // Allow 1 second difference

			expect(result.userId).toBe(userId);
			expect(result.sessionToken).toBe(createArgs.data.sessionToken);
			expect(result.expires).toBe(createArgs.data.expires);
		});
	});

	describe('destroySession', () => {
		it('should call db.session.deleteMany with the correct session token', async () => {
			const tokenToDestroy = 'token-to-destroy';
			await destroySession(tokenToDestroy);

			expect(mockSessionDeleteMany).toHaveBeenCalledWith({
				where: { sessionToken: tokenToDestroy },
			});
		});
	});
});
