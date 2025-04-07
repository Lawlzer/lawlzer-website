import { fetchRequestHandler } from '@trpc/server/adapters/fetch';
import type { NextRequest } from 'next/server';

import { env } from '~/env';
import { appRouter } from '~/server/api/root';
import { createTRPCContext } from '~/server/api/trpc';
import type { Session } from 'next-auth';
import type { db } from '~/server/db';

/**
 * This wraps the `createTRPCContext` helper and provides the required context for the tRPC API when
 * handling a HTTP request (e.g. when you make requests from Client Components).
 */
const createContext = async (
	req: NextRequest
): Promise<{
	db: typeof db;
	session: Session | null;
	headers: Headers;
}> => {
	return createTRPCContext({
		headers: req.headers,
	});
};

const handler = async (req: NextRequest): Promise<Response> =>
	fetchRequestHandler({
		endpoint: '/api/trpc',
		req,
		router: appRouter,
		createContext: async () => createContext(req),
		onError:
			env.NODE_ENV === 'development'
				? ({ path, error }) => {
						console.error(`❌ tRPC failed on ${path ?? '<no-path>'}: ${error.message}`);
					}
				: undefined,
	});

export { handler as GET, handler as POST };
