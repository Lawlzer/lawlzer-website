import type { Session, User } from '@prisma/client';
import type { Mock } from 'vitest';
import { vi } from 'vitest';

// Mock session data factory
export function createMockSession(overrides?: Partial<Session>): Session {
	return {
		id: 'test-session-id',
		sessionToken: 'test-session-token',
		userId: 'test-user-id',
		expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
		...overrides,
	};
}

// Mock user data factory
export function createMockUser(overrides?: Partial<User>): User {
	return {
		id: 'test-user-id',
		email: 'test@example.com',
		emailVerified: new Date(),
		name: 'Test User',
		image: null,
		discordId: null,
		...overrides,
	};
}

// Mock auth context for components
export interface MockAuthContext {
	user: User | null;
	session: Session | null;
	isLoading: boolean;
	isAuthenticated: boolean;
}

export function createMockAuthContext(overrides?: Partial<MockAuthContext>): MockAuthContext {
	const defaults: MockAuthContext = {
		user: null,
		session: null,
		isLoading: false,
		isAuthenticated: false,
	};

	const context = { ...defaults, ...overrides };

	// Auto-set isAuthenticated based on user/session presence if not explicitly set
	if (overrides?.isAuthenticated === undefined) {
		context.isAuthenticated = !!(context.user && context.session);
	}

	return context;
}

// Mock for getSession function
export function mockGetSession(returnValue: Session | null = null): Mock {
	return vi.fn().mockResolvedValue(returnValue);
}

// Mock for authentication redirect
export function mockAuthRedirect(url = '/'): Mock {
	return vi.fn().mockImplementation(() => ({
		redirect: url,
		status: 302,
	}));
}

// Helper to mock authentication state in tests
export function setupAuthMocks(
	options: {
		isAuthenticated?: boolean;
		user?: Partial<User>;
		session?: Partial<Session>;
	} = {}
): {
	user: User | null;
	session: Session | null;
	getSessionMock: Mock;
} {
	const user = options.isAuthenticated ? createMockUser(options.user) : null;
	const session = options.isAuthenticated ? createMockSession({ ...options.session, userId: user?.id }) : null;

	const getSessionMock = mockGetSession(session);

	// Mock the session module
	vi.doMock('~/server/db/session', () => ({
		getSession: getSessionMock,
		createSession: vi.fn().mockResolvedValue(session),
		deleteSession: vi.fn().mockResolvedValue(undefined),
	}));

	return {
		user,
		session,
		getSessionMock,
	};
}

// OAuth provider mock data
export const mockOAuthProviders = {
	google: {
		clientId: 'test-google-client-id',
		clientSecret: 'test-google-client-secret',
		redirectUri: 'http://localhost:3000/api/auth/callback/google',
	},
	github: {
		clientId: 'test-github-client-id',
		clientSecret: 'test-github-client-secret',
		redirectUri: 'http://localhost:3000/api/auth/callback/github',
	},
	discord: {
		clientId: 'test-discord-client-id',
		clientSecret: 'test-discord-client-secret',
		redirectUri: 'http://localhost:3000/api/auth/callback/discord',
	},
};

// Mock OAuth response data
export function createMockOAuthResponse(provider: 'discord' | 'github' | 'google', overrides?: Record<string, unknown>) {
	const defaults = {
		google: {
			id: 'google-user-id',
			email: 'test@gmail.com',
			verified_email: true,
			name: 'Google User',
			picture: 'https://example.com/picture.jpg',
		},
		github: {
			id: 123456,
			login: 'githubuser',
			email: 'test@github.com',
			name: 'GitHub User',
			avatar_url: 'https://example.com/avatar.jpg',
		},
		discord: {
			id: 'discord-user-id',
			username: 'discorduser',
			email: 'test@discord.com',
			verified: true,
			avatar: 'avatar-hash',
		},
	};

	return {
		...defaults[provider],
		...overrides,
	};
}

// Mock data constants that can be reused across tests
export const mockAuthData = {
	// Discord OAuth
	discord: {
		code: 'test-discord-auth-code',
		accessToken: 'test-discord-access-token',
		refreshToken: 'test-discord-refresh-token',
		tokenResponse: {
			access_token: 'test-discord-access-token',
			expires_in: 604800, // 7 days
			refresh_token: 'test-discord-refresh-token',
			scope: 'identify email',
			token_type: 'Bearer',
		},
		user: {
			id: 'discord-user-id',
			username: 'discorduser',
			email: 'test@discord.com',
			verified: true,
			avatar: 'avatar-hash',
			discriminator: '0001',
		},
	},

	// GitHub OAuth
	github: {
		code: 'test-github-auth-code',
		accessToken: 'test-github-access-token',
		tokenResponse: {
			access_token: 'test-github-access-token',
			scope: 'read:user user:email',
			token_type: 'bearer',
		},
		user: {
			id: 12345678,
			login: 'githubuser',
			email: 'test@github.com',
			name: 'GitHub User',
			avatar_url: 'https://avatars.githubusercontent.com/u/12345678',
		},
		emails: [
			{ email: 'test@github.com', primary: true, verified: true },
			{ email: 'alt@github.com', primary: false, verified: false },
		],
	},

	// Google OAuth
	google: {
		code: 'test-google-auth-code',
		accessToken: 'test-google-access-token',
		refreshToken: 'test-google-refresh-token',
		tokenResponse: {
			access_token: 'test-google-access-token',
			expires_in: 3600,
			refresh_token: 'test-google-refresh-token',
			scope: 'openid email profile',
			token_type: 'Bearer',
			id_token: 'test-google-id-token',
		},
		user: {
			id: 'google-user-id',
			email: 'test@google.com',
			verified_email: true,
			name: 'Google User',
			picture: 'https://lh3.googleusercontent.com/a/test-avatar',
		},
	},

	// Common user object after DB upsert
	dbUser: {
		id: 'test-user-id',
		email: 'test@example.com',
		name: 'Test User',
		discordId: null,
		emailVerified: new Date(),
		image: null,
	},
};

// Helper to create a user with specific provider
export function createMockUserWithProvider(provider: 'discord' | 'github' | 'google', overrides?: Partial<User>): User {
	const baseUser = { ...mockAuthData.dbUser };

	switch (provider) {
		case 'discord':
			return {
				...baseUser,
				discordId: mockAuthData.discord.user.id,
				email: mockAuthData.discord.user.email,
				name: mockAuthData.discord.user.username,
				...overrides,
			};
		case 'github':
			return {
				...baseUser,
				email: mockAuthData.github.user.email,
				name: mockAuthData.github.user.name,
				...overrides,
			};
		case 'google':
			return {
				...baseUser,
				email: mockAuthData.google.user.email,
				name: mockAuthData.google.user.name,
				...overrides,
			};
	}
}

export function setupAuthEnv() {
	vi.stubEnv('NEXT_PUBLIC_AUTH_DISCORD_ID', 'test-discord-client-id');
	vi.stubEnv('AUTH_DISCORD_SECRET', 'test-discord-client-secret');
	vi.stubEnv('NEXT_PUBLIC_AUTH_GITHUB_ID', 'test-github-client-id');
	vi.stubEnv('AUTH_GITHUB_SECRET', 'test-github-client-secret');
	vi.stubEnv('NEXT_PUBLIC_AUTH_GOOGLE_ID', 'test-google-client-id');
	vi.stubEnv('AUTH_GOOGLE_SECRET', 'test-google-client-secret');
	vi.stubEnv('NEXT_PUBLIC_SCHEME', 'http');
	vi.stubEnv('NEXT_PUBLIC_SECOND_LEVEL_DOMAIN', 'localhost');
	vi.stubEnv('NEXT_PUBLIC_TOP_LEVEL_DOMAIN', 'com');
	vi.stubEnv('NEXT_PUBLIC_FRONTEND_PORT', '3000');
}

/**
 * Sets up OAuth fetch mocks for successful authentication flow
 *
 * @param provider OAuth provider
 * @param mockFetch The mocked fetch function
 * @param options Optional overrides for token and user responses
 *
 * @example
 * ```typescript
 * const mockFetch = vi.fn();
 * global.fetch = mockFetch;
 *
 * setupOAuthFetchMocks('google', mockFetch);
 * ```
 */
export function setupOAuthFetchMocks(
	provider: 'discord' | 'github' | 'google',
	mockFetch: Mock,
	options?: {
		tokenResponse?: any;
		userResponse?: any;
		emailsResponse?: any; // For GitHub
	}
) {
	const tokenResponse = options?.tokenResponse || mockAuthData[provider].tokenResponse;
	const userResponse = options?.userResponse || mockAuthData[provider].user;

	// Token exchange response
	mockFetch.mockResolvedValueOnce({
		ok: true,
		json: async () => tokenResponse as unknown,
	} as Response);

	// User info response
	mockFetch.mockResolvedValueOnce({
		ok: true,
		json: async () => userResponse as unknown,
	} as Response);

	// GitHub emails endpoint (if needed)
	if (provider === 'github' && options?.emailsResponse) {
		mockFetch.mockResolvedValueOnce({
			ok: true,
			json: async () => options.emailsResponse as unknown,
		} as Response);
	}
}

/**
 * Sets up OAuth fetch mocks for failed token exchange
 *
 * @param mockFetch The mocked fetch function
 * @param errorResponse The error response to return
 */
export function setupOAuthTokenErrorMock(mockFetch: Mock, errorResponse = { error: 'invalid_grant', error_description: 'The authorization code is invalid' }) {
	mockFetch.mockResolvedValueOnce({
		ok: false,
		json: async () => errorResponse,
	} as Response);
}

/**
 * Sets up OAuth fetch mocks for failed user info fetch
 *
 * @param provider OAuth provider
 * @param mockFetch The mocked fetch function
 * @param errorResponse The error response to return
 */
export function setupOAuthUserErrorMock(provider: 'discord' | 'github' | 'google', mockFetch: Mock, errorResponse = { error: 'unauthorized' }) {
	// First mock successful token exchange
	mockFetch.mockResolvedValueOnce({
		ok: true,
		json: async () => mockAuthData[provider].tokenResponse,
	} as Response);

	// Then mock failed user fetch
	mockFetch.mockResolvedValueOnce({
		ok: false,
		json: async () => errorResponse,
	} as Response);
}
