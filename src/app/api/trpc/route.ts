import type { TRPCError } from '@trpc/server';
import { fetchRequestHandler } from '@trpc/server/adapters/fetch';
import type { NextRequest } from 'next/server';

import { env } from '~/env.mjs';
import { appRouter } from '~/server/api/root';
import { createTRPCContext } from '~/server/api/trpc';

export const runtime = 'edge';

/**
 * This is the HTTP handler for tRPC API endpoints
 */
export async function POST(req: NextRequest): Promise<Response> {
	return fetchRequestHandler({
		endpoint: '/api/trpc',
		req,
		router: appRouter,
		createContext: async () => createTRPCContext({ headers: req.headers }),
		onError:
			env.NODE_ENV === 'development'
				? ({ path, error }: { path: string | undefined; error: TRPCError }) => {
						console.error(`❌ tRPC failed on ${path ?? '<no-path>'}: ${error.message}`);
					}
				: undefined,
	});
}
