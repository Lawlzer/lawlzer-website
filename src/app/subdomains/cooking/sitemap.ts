import { db } from '~/server/db';

export default async function sitemap() {
	const recipes = await db.recipe.findMany({
		where: { visibility: 'public' },
		select: {
			id: true,
			updatedAt: true,
		},
	});

	const recipeUrls = recipes.map((recipe) => ({
		url: `https://www.yourdomain.com/subdomains/cooking/recipe/${recipe.id}`, // Replace with actual domain
		lastModified: recipe.updatedAt,
	}));

	return [
		{
			url: 'https://www.yourdomain.com/subdomains/cooking',
			lastModified: new Date(),
		},
		...recipeUrls,
	];
}
