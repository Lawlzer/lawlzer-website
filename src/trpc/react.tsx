'use client';

import { type QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { httpBatchStreamLink, loggerLink } from '@trpc/client';
import { createTRPCReact } from '@trpc/react-query';
import type { inferRouterInputs, inferRouterOutputs } from '@trpc/server';
import { type ReactElement, type ReactNode, useState } from 'react';
import SuperJSON from 'superjson';

import { createQueryClient } from './query-client';

import { env } from '~/env.mjs';
import { getBaseUrl } from '~/lib/utils';
import type { AppRouter } from '~/server/api/root';

let clientQueryClientSingleton: QueryClient | undefined = undefined;

const getQueryClient = (): QueryClient => {
	if (typeof window === 'undefined') {
		// Server: always make a new query client
		return createQueryClient();
	}
	// Browser: use singleton pattern to keep the same query client
	clientQueryClientSingleton ??= createQueryClient();

	return clientQueryClientSingleton;
};

export const api = createTRPCReact<AppRouter>();

/**
 * Inference helper for inputs.
 *
 * @example type HelloInput = RouterInputs['example']['hello']
 */
export type RouterInputs = inferRouterInputs<AppRouter>;

/**
 * Inference helper for outputs.
 *
 * @example type HelloOutput = RouterOutputs['example']['hello']
 */
export type RouterOutputs = inferRouterOutputs<AppRouter>;

export const TRPCReactProvider = (props: { children: ReactNode }): ReactElement => {
	const queryClient = getQueryClient();

	const [trpcClient] = useState(() =>
		api.createClient({
			links: [
				loggerLink({
					enabled: (op) => env.NODE_ENV === 'development' || (op.direction === 'down' && op.result instanceof Error),
				}),
				httpBatchStreamLink({
					transformer: SuperJSON,
					url: `${getBaseUrl()}/api/trpc`,
					headers() {
						const headers: Record<string, string> = {};
						headers['x-trpc-source'] = 'nextjs-react';
						return headers;
					},
				}),
			],
		})
	);

	return (
		<QueryClientProvider client={queryClient}>
			<api.Provider client={trpcClient} queryClient={queryClient}>
				{props.children}
			</api.Provider>
		</QueryClientProvider>
	);
};
