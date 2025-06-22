import { db } from '~/server/db';
import { notFound } from 'next/navigation';
import { RecipeSocial } from '~/app/subdomains/cooking/components/RecipeSocial';
import { getSession } from '~/server/db/session';

async function getRecipe(id: string) {
	const recipe = await db.recipe.findFirst({
		where: { id, visibility: 'public' },
		include: {
			currentVersion: { include: { items: { include: { food: true, recipe: true } } } },
			user: { select: { name: true } },
		},
	});
	return recipe;
}

export default async function RecipePage({ params }: { params: { id: string } }) {
	const recipe = await getRecipe(params.id);
	if (!recipe) {
		notFound();
	}

	const session = await getSession();
	const jsonLd = {
		'@context': 'https://schema.org',
		'@type': 'Recipe',
		name: recipe.name,
		author: {
			'@type': 'Person',
			name: recipe.user?.name || 'Anonymous',
		},
		datePublished: recipe.createdAt.toISOString(),
		description: recipe.description,
		prepTime: `PT${recipe.prepTime}M`,
		cookTime: `PT${recipe.cookTime}M`,
		recipeIngredient: recipe.currentVersion?.items.map((item) => `${item.amount}${item.unit} ${item.food?.name || item.recipe?.name}`) || [],
	};

	return (
		<div className='container mx-auto p-4'>
			<script type='application/ld+json' dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
			<h1>{recipe.name}</h1>
			<p>By {recipe.user?.name || 'Anonymous'}</p>
			<p>{recipe.description}</p>

			<h2>Ingredients</h2>
			<ul>
				{recipe.currentVersion?.items.map((item) => (
					<li key={item.id}>
						{item.amount}
						{item.unit} {item.food?.name || item.recipe?.name}
					</li>
				))}
			</ul>

			<h2>Instructions</h2>
			<p>{recipe.notes}</p>

			<RecipeSocial recipeId={recipe.id} currentUser={session?.user || null} />
		</div>
	);
}
