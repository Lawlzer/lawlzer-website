import { notFound } from 'next/navigation';
import Image from 'next/image';

import { RecipeSocial } from '~/app/subdomains/cooking/components/RecipeSocial';
import { Card, CardBadge, RecipeMeta } from '~/app/subdomains/cooking/components/ui/Card';
import { Button } from '~/app/subdomains/cooking/components/ui/Button';
import { db } from '~/server/db';
import { getSession } from '~/server/db/session';

async function getRecipe(id: string) {
	const recipe = await db.recipe.findFirst({
		where: { id, visibility: 'public' },
		include: {
			currentVersion: {
				include: { items: { include: { food: true, recipe: true } } },
			},
			user: { select: { name: true } },
		},
	});
	return recipe;
}

export default async function RecipePage({ params }: { params: Promise<{ recipeId: string }> }) {
	const { recipeId } = await params;
	const recipe = await getRecipe(recipeId);
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
			name: recipe.user?.name !== null && recipe.user?.name !== undefined ? recipe.user.name : 'Anonymous',
		},
		datePublished: recipe.createdAt.toISOString(),
		description: recipe.description,
		prepTime: `PT${recipe.prepTime}M`,
		cookTime: `PT${recipe.cookTime}M`,
		recipeIngredient: recipe.currentVersion?.items.map((item) => `${item.amount}${item.unit} ${item.food?.name ?? item.recipe?.name ?? 'Unknown item'}`) ?? [],
	};

	const nutrition = recipe.currentVersion ? {
		calories: recipe.currentVersion.caloriesPerServing,
		protein: recipe.currentVersion.proteinPerServing,
		carbs: recipe.currentVersion.carbsPerServing,
		fat: recipe.currentVersion.fatPerServing,
	} : null;

	return (
		<div className='min-h-screen bg-gradient-to-br from-cooking-neutral-50 via-white to-cooking-primary/5'>
			<script type='application/ld+json' dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
			
			{/* Hero Section */}
			<div className='relative h-[40vh] md:h-[50vh] w-full bg-cooking-neutral-100'>
				{recipe.imageUrl ? (
					<>
						<Image
							src={recipe.imageUrl}
							alt={recipe.name}
							fill
							className='object-cover'
							priority
						/>
						<div className='absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent' />
					</>
				) : (
					<div className='h-full flex items-center justify-center'>
						<div className='text-center'>
							<div className='mx-auto h-24 w-24 text-cooking-neutral-400 mb-4'>
								<svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
									<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
								</svg>
							</div>
							<p className='text-lg text-cooking-neutral-500'>No image available</p>
						</div>
					</div>
				)}
				
				{/* Title Overlay */}
				<div className='absolute bottom-0 left-0 right-0 p-6 md:p-8'>
					<div className='container mx-auto'>
						<h1 className='text-3xl md:text-5xl font-bold text-white mb-2'>
							{recipe.name}
						</h1>
						<p className='text-lg text-white/90'>
							By {recipe.user?.name || 'Anonymous'}
						</p>
					</div>
				</div>
			</div>

			{/* Content */}
			<div className='container mx-auto px-4 py-8 -mt-16 relative z-10'>
				<div className='grid grid-cols-1 lg:grid-cols-3 gap-8'>
					{/* Main Content */}
					<div className='lg:col-span-2 space-y-6'>
						{/* Quick Info Card */}
						<Card variant='elevated' className='p-6'>
							<RecipeMeta
								prepTime={recipe.prepTime}
								cookTime={recipe.cookTime}
								servings={recipe.servings}
								difficulty={undefined}
							/>
							
							{recipe.description && (
								<p className='text-cooking-neutral-700 mt-4 text-lg leading-relaxed'>
									{recipe.description}
								</p>
							)}
						</Card>

						{/* Ingredients */}
						<Card variant='elevated' className='p-6'>
							<h2 className='text-2xl font-bold text-cooking-neutral-900 mb-6'>
								Ingredients
							</h2>
							<div className='space-y-3'>
								{recipe.currentVersion?.items.map((item, index) => (
									<div 
										key={item.id} 
										className='flex items-center gap-3 p-3 rounded-lg hover:bg-cooking-neutral-50 transition-colors'
									>
										<div className='flex-shrink-0 w-8 h-8 bg-cooking-primary/10 rounded-full flex items-center justify-center'>
											<span className='text-sm font-medium text-cooking-primary'>
												{index + 1}
											</span>
										</div>
										<div className='flex-1'>
											<span className='font-medium text-cooking-neutral-900'>
												{item.amount} {item.unit}
											</span>
											<span className='text-cooking-neutral-700 ml-2'>
												{item.food?.name ?? item.recipe?.name ?? 'Unknown item'}
											</span>
										</div>
									</div>
								))}
							</div>
						</Card>

						{/* Instructions */}
						{recipe.notes && (
							<Card variant='elevated' className='p-6'>
								<h2 className='text-2xl font-bold text-cooking-neutral-900 mb-6'>
									Instructions
								</h2>
								<div className='prose prose-cooking max-w-none'>
									<p className='text-cooking-neutral-700 leading-relaxed whitespace-pre-wrap'>
										{recipe.notes}
									</p>
								</div>
							</Card>
						)}
					</div>

					{/* Sidebar */}
					<div className='space-y-6'>
						{/* Nutrition Card */}
						{nutrition && (
							<Card variant='elevated' className='p-6'>
								<h3 className='text-xl font-bold text-cooking-neutral-900 mb-4'>
									Nutrition per Serving
								</h3>
								<div className='space-y-4'>
									<div className='flex justify-between items-center p-3 bg-cooking-calories/10 rounded-lg'>
										<span className='font-medium text-cooking-neutral-700'>Calories</span>
										<span className='text-xl font-bold text-cooking-calories'>
											{nutrition.calories.toFixed(0)}
										</span>
									</div>
									<div className='grid grid-cols-3 gap-3'>
										<div className='text-center p-3 bg-cooking-protein/10 rounded-lg'>
											<p className='text-2xl font-bold text-cooking-protein'>
												{nutrition.protein.toFixed(0)}g
											</p>
											<p className='text-xs text-cooking-neutral-600 mt-1'>Protein</p>
										</div>
										<div className='text-center p-3 bg-cooking-carbs/10 rounded-lg'>
											<p className='text-2xl font-bold text-cooking-carbs'>
												{nutrition.carbs.toFixed(0)}g
											</p>
											<p className='text-xs text-cooking-neutral-600 mt-1'>Carbs</p>
										</div>
										<div className='text-center p-3 bg-cooking-fat/10 rounded-lg'>
											<p className='text-2xl font-bold text-cooking-fat'>
												{nutrition.fat.toFixed(0)}g
											</p>
											<p className='text-xs text-cooking-neutral-600 mt-1'>Fat</p>
										</div>
									</div>
								</div>
							</Card>
						)}

						{/* Actions Card */}
						<Card variant='elevated' className='p-6'>
							<Button
								variant='primary'
								size='lg'
								fullWidth
								leftIcon={
									<svg className='w-5 h-5' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
										<path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z' />
									</svg>
								}
								className='mb-3'
							>
								Start Cooking
							</Button>
							<div className='grid grid-cols-2 gap-3'>
								<Button variant='outline' size='sm'>
									<svg className='w-4 h-4 mr-2' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
										<path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z' />
									</svg>
									Copy
								</Button>
								<Button variant='outline' size='sm'>
									<svg className='w-4 h-4 mr-2' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
										<path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4' />
									</svg>
									Export
								</Button>
							</div>
						</Card>

						{/* Social Card */}
						<Card variant='elevated' className='p-6'>
							<RecipeSocial recipeId={recipe.id} currentUser={session?.user || null} />
						</Card>
					</div>
				</div>
			</div>
		</div>
	);
}
