import { createEnv } from '@t3-oss/env-nextjs';
import { z } from 'zod';

const env = createEnv({
	server: {
		VERCEL_URL: z.string().url().optional(),
		MONGODB_URI: z.string().url(),
		DEBUG_CONTEXT_KEYS: z.preprocess((val) => val === 'true', z.boolean()).optional(),
		DEBUG_SUBDOMAIN_VALUE: z.preprocess((val) => val === 'true', z.boolean()).optional(),
		DEBUG_SESSION_STUFF: z.preprocess((val) => val === 'true', z.boolean()).optional(),
		DATABASE_URL: z.string().url(),
		NODE_ENV: z.enum(['development', 'production', 'test']),
		AUTH_GOOGLE_ID: z.string().min(1),
		AUTH_GOOGLE_SECRET: z.string().min(1),
		AUTH_DISCORD_ID: z.string().min(1),
		AUTH_DISCORD_SECRET: z.string().min(1),
		AUTH_GITHUB_ID: z.string().min(1),
		AUTH_GITHUB_SECRET: z.string().min(1),
		NEXT_PUBLIC_COOKIE_DOMAIN: z.string().min(1),
	},
	client: {
		NEXT_PUBLIC_BASE_URL: z.string().url(),
		NEXT_PUBLIC_FRONTEND_PORT: z.string(),
	},
	skipValidation: !!process.env.SKIP_ENV_VALIDATION,
	emptyStringAsUndefined: true,
	runtimeEnv: {
		MONGODB_URI: process.env.MONGODB_URI,
		DEBUG_CONTEXT_KEYS: process.env.DEBUG_CONTEXT_KEYS,
		DEBUG_SUBDOMAIN_VALUE: process.env.DEBUG_SUBDOMAIN_VALUE,
		DEBUG_SESSION_STUFF: process.env.DEBUG_SESSION_STUFF,
		DATABASE_URL: process.env.DATABASE_URL,
		NODE_ENV: process.env.NODE_ENV,
		VERCEL_URL: process.env.VERCEL_URL,
		AUTH_GOOGLE_ID: process.env.AUTH_GOOGLE_ID,
		AUTH_GOOGLE_SECRET: process.env.AUTH_GOOGLE_SECRET,
		AUTH_DISCORD_ID: process.env.AUTH_DISCORD_ID,
		AUTH_DISCORD_SECRET: process.env.AUTH_DISCORD_SECRET,
		AUTH_GITHUB_ID: process.env.AUTH_GITHUB_ID,
		AUTH_GITHUB_SECRET: process.env.AUTH_GITHUB_SECRET,
		NEXT_PUBLIC_COOKIE_DOMAIN: process.env.NEXT_PUBLIC_COOKIE_DOMAIN,
		NEXT_PUBLIC_BASE_URL: process.env.NEXT_PUBLIC_BASE_URL,
		NEXT_PUBLIC_FRONTEND_PORT: process.env.NEXT_PUBLIC_FRONTEND_PORT,
	},
});

export { env };
