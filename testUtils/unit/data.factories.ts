import type { CommodityData, Session, User } from '@prisma/client';

// User and Session factories
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

export function createMockSession(overrides?: Partial<Session>): Session {
	const now = new Date();
	const futureDate = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 days from now

	return {
		id: 'test-session-id',
		sessionToken: 'test-session-token',
		userId: 'test-user-id',
		expires: futureDate,
		...overrides,
	};
}

// Create expired session helper
export function createExpiredSession(overrides?: Partial<Session>): Session {
	const pastDate = new Date(Date.now() - 24 * 60 * 60 * 1000); // 1 day ago
	return createMockSession({
		expires: pastDate,
		...overrides,
	});
}

// Session with user included (common pattern in tests)
export function createMockSessionWithUser(sessionOverrides?: Partial<Session>, userOverrides?: Partial<User>): Session & { user: User } {
	const user = createMockUser(userOverrides);
	const session = createMockSession({
		userId: user.id,
		...sessionOverrides,
	});

	return {
		...session,
		user,
	};
}

// TRPC Session type (simplified version used in TRPC context)
export function createMockTRPCSession(userId = 'test-user-id'): { userId: string } {
	return { userId };
}

// Chart/Graph data factories
export function createMockChartData(overrides?: Partial<CommodityData>): CommodityData {
	return {
		id: 'test-commodity-id',
		unixDate: Date.now() - 24 * 60 * 60 * 1000, // Yesterday
		type: 'Cattle',
		category: 'Livestock',
		country: 'USA',
		state: 'Texas',
		exports: 1500.5,
		price: 125.75,
		head: 1000,
		totalVolume: 50000,
		cattleType: 'Beef',
		choiceGrade: 'Prime',
		...overrides,
	};
}

export function createMockChartDataSeries(count = 10, type = 'Cattle', baseDate = Date.now()): CommodityData[] {
	return Array.from({ length: count }, (_, index) =>
		createMockChartData({
			id: `test-commodity-${index}`,
			unixDate: baseDate - index * 24 * 60 * 60 * 1000, // Go back one day per item
			type,
			price: 100 + Math.random() * 50, // Random price between 100-150
			exports: 1000 + Math.random() * 1000, // Random exports between 1000-2000
		})
	);
}

// Valorant data factories
export interface MockLineupData {
	id: string;
	map: string;
	site: string;
	throwFrom: string;
	landingSpot: string;
	description: string;
	difficulty: 'Easy' | 'Hard' | 'Medium';
	agent: string;
	ability: string;
	imageUrl?: string;
}

export function createMockLineup(overrides?: Partial<MockLineupData>): MockLineupData {
	return {
		id: 'test-lineup-1',
		map: 'Bind',
		site: 'A',
		throwFrom: 'A Short',
		landingSpot: 'A Site Default',
		description: 'Standard smoke for A site execute',
		difficulty: 'Easy',
		agent: 'Viper',
		ability: 'Poison Cloud',
		imageUrl: '/images/bind/lineup-1.jpg',
		...overrides,
	};
}

export function createMockLineupSet(map: string, count = 5): MockLineupData[] {
	const agents = ['Viper', 'Brimstone', 'Omen', 'Astra', 'Harbor'];
	const sites = ['A', 'B', 'Mid'];
	const difficulties: ('Easy' | 'Hard' | 'Medium')[] = ['Easy', 'Medium', 'Hard'];

	return Array.from({ length: count }, (_, index) =>
		createMockLineup({
			id: `test-lineup-${index}`,
			map,
			site: sites[index % sites.length] ?? 'A',
			agent: agents[index % agents.length] ?? 'Viper',
			difficulty: difficulties[index % difficulties.length] ?? 'Easy',
			throwFrom: `Position ${index + 1}`,
			landingSpot: `Spot ${index + 1}`,
		})
	);
}

// Color palette data factories
export interface MockPaletteData {
	id: string;
	name: string;
	colors: string[];
	description?: string;
	tags?: string[];
}

export function createMockPalette(overrides?: Partial<MockPaletteData>): MockPaletteData {
	return {
		id: 'test-palette-1',
		name: 'Ocean Blues',
		colors: ['#0077BE', '#00A8E8', '#00C9FF', '#7CFEF0', '#B8FFF9'],
		description: 'A calming palette inspired by ocean waves',
		tags: ['blue', 'ocean', 'calm'],
		...overrides,
	};
}

// API response factories
export function createMockApiResponse<T>(
	data: T,
	options?: {
		status?: number;
		message?: string;
		error?: string;
	}
) {
	const { status = 200, message, error } = options || {};

	if (error !== undefined && error !== null && error !== '') {
		return {
			status,
			error,
			data: null,
		};
	}

	return {
		status,
		message: message !== undefined && message !== null && message !== '' ? message : 'Success',
		data,
	};
}

// Error response factory
export function createMockErrorResponse(status = 500, error = 'Internal Server Error', details?: Record<string, unknown>) {
	return {
		status,
		error,
		message: error,
		details,
	};
}

// TRPC response factories
export function createMockTRPCResponse<T>(data: T) {
	return {
		result: {
			data: {
				json: data,
			},
		},
	};
}

export function createMockTRPCError(code: string, message: string, cause?: unknown) {
	return {
		error: {
			json: {
				message,
				code,
				data: {
					code,
					httpStatus: 500,
					path: undefined,
					cause,
				},
			},
		},
	};
}

// Filter options for data platform
export interface MockFilterOptions {
	types: string[];
	countries: string[];
	states?: string[];
	dateRange: {
		start: Date;
		end: Date;
	};
}

export function createMockFilterOptions(overrides?: Partial<MockFilterOptions>): MockFilterOptions {
	const endDate = new Date();
	const startDate = new Date();
	startDate.setMonth(startDate.getMonth() - 3); // 3 months ago

	return {
		types: ['Cattle', 'Hogs', 'Barley', 'Wheat'],
		countries: ['USA', 'Canada', 'Mexico'],
		states: ['Texas', 'Iowa', 'Nebraska', 'Kansas'],
		dateRange: {
			start: startDate,
			end: endDate,
		},
		...overrides,
	};
}
