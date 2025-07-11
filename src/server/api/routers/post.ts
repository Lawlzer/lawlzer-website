import { z } from 'zod';

import { createTRPCRouter, protectedProcedure, publicProcedure } from '~/server/api/trpc';

export const postRouter = createTRPCRouter({
	hello: publicProcedure.input(z.object({ text: z.string() })).query(({ input }) => ({
		greeting: `Hello ${input.text}`,
	})),

	create: protectedProcedure.input(z.object({ name: z.string().min(1) })).mutation(async ({ ctx, input }) => {
		const thing = await ctx.db.post.create({
			data: {
				name: input.name,
				createdBy: { connect: { id: ctx.session.userId } },
			},
		});

		return thing;
	}),

	getLatest: protectedProcedure.query(async ({ ctx }) => {
		const post = await ctx.db.post.findFirst({
			orderBy: { createdAt: 'desc' },
			where: { createdBy: { id: ctx.session.userId } },
		});

		return post ?? null;
	}),

	getSecretMessage: protectedProcedure.query(() => 'you can now see this secret message!'),
});
