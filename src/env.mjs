import { createEnv } from '@t3-oss/env-nextjs';
import { z } from 'zod';

const env = createEnv({
	server: {
		VERCEL_URL: z.string().url().optional(),
		DEBUG_CONTEXT_KEYS: z.preprocess((val) => val === 'true', z.boolean()).optional(),
		DEBUG_SUBDOMAIN_VALUE: z.preprocess((val) => val === 'true', z.boolean()).optional(),
		DEBUG_SESSION_STUFF: z.preprocess((val) => val === 'true', z.boolean()).optional(),
		DATABASE_URL: z.string().url(),
		NODE_ENV: z.enum(['development', 'production', 'test']),
		NEXT_PUBLIC_AUTH_GOOGLE_ID: z.string().min(1),
		AUTH_GOOGLE_SECRET: z.string().min(1),
		NEXT_PUBLIC_AUTH_DISCORD_ID: z.string().min(1),
		AUTH_DISCORD_SECRET: z.string().min(1),
		NEXT_PUBLIC_AUTH_GITHUB_ID: z.string().min(1),
		AUTH_GITHUB_SECRET: z.string().min(1),
	},
	client: {
		NEXT_PUBLIC_SCHEME: z.string(),
		NEXT_PUBLIC_SECOND_LEVEL_DOMAIN: z.string(),
		NEXT_PUBLIC_TOP_LEVEL_DOMAIN: z.string(),
		NEXT_PUBLIC_FRONTEND_PORT: z.string(),
		NEXT_PUBLIC_AUTH_DISCORD_ID: z.string().min(1),
		NEXT_PUBLIC_AUTH_GOOGLE_ID: z.string().min(1),
		NEXT_PUBLIC_AUTH_GITHUB_ID: z.string().min(1),
	},
	skipValidation: !!process.env.SKIP_ENV_VALIDATION,
	emptyStringAsUndefined: true,
	runtimeEnv: {
		DEBUG_CONTEXT_KEYS: process.env.DEBUG_CONTEXT_KEYS,
		DEBUG_SUBDOMAIN_VALUE: process.env.DEBUG_SUBDOMAIN_VALUE,
		DEBUG_SESSION_STUFF: process.env.DEBUG_SESSION_STUFF,
		DATABASE_URL: process.env.DATABASE_URL,
		NODE_ENV: process.env.NODE_ENV,
		VERCEL_URL: process.env.VERCEL_URL,
		NEXT_PUBLIC_AUTH_GOOGLE_ID: process.env.NEXT_PUBLIC_AUTH_GOOGLE_ID,
		AUTH_GOOGLE_SECRET: process.env.AUTH_GOOGLE_SECRET,
		NEXT_PUBLIC_AUTH_DISCORD_ID: process.env.NEXT_PUBLIC_AUTH_DISCORD_ID,
		AUTH_DISCORD_SECRET: process.env.AUTH_DISCORD_SECRET,
		NEXT_PUBLIC_AUTH_GITHUB_ID: process.env.NEXT_PUBLIC_AUTH_GITHUB_ID,
		AUTH_GITHUB_SECRET: process.env.AUTH_GITHUB_SECRET,
		NEXT_PUBLIC_SCHEME: process.env.NEXT_PUBLIC_SCHEME,
		NEXT_PUBLIC_SECOND_LEVEL_DOMAIN: process.env.NEXT_PUBLIC_SECOND_LEVEL_DOMAIN,
		NEXT_PUBLIC_TOP_LEVEL_DOMAIN: process.env.NEXT_PUBLIC_TOP_LEVEL_DOMAIN,
		NEXT_PUBLIC_FRONTEND_PORT: process.env.NEXT_PUBLIC_FRONTEND_PORT,
	},
});

export { env };
