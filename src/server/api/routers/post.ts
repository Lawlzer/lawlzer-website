import { z } from 'zod';

import { createTRPCRouter, protectedProcedure, publicProcedure } from '~/app/api/trpc';

export const postRouter = createTRPCRouter({
	hello: publicProcedure.input(z.object({ text: z.string() })).query(({ input }) => {
		return {
			greeting: `Hello ${input.text}`,
		};
	}),

	create: protectedProcedure.input(z.object({ name: z.string().min(1) })).mutation(async ({ ctx, input }) => {
		const thing = await ctx.db.post.create({
			data: {
				name: input.name,
				createdBy: { connect: { id: ctx.session.userId } },
			},
		});

		// eslint-disable-next-line @typescript-eslint/no-unsafe-return
		return thing;
	}),

	getLatest: protectedProcedure.query(async ({ ctx }) => {
		const post = await ctx.db.post.findFirst({
			orderBy: { createdAt: 'desc' },
			where: { createdBy: { id: ctx.session.userId } },
		});

		// eslint-disable-next-line @typescript-eslint/no-unsafe-return
		return post ?? null;
	}),

	getSecretMessage: protectedProcedure.query(() => {
		return 'you can now see this secret message!';
	}),
});
