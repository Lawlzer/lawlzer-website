'use client';

import type { Food } from '@prisma/client';
import { useEffect, useState } from 'react';

import { useToast } from '~/components/Toast';
import { Button } from '~/components/ui/Button';

interface Alternative {
	id: string;
	food?: { name: string };
	recipe?: { name: string };
	amount: number;
	unit: string;
	notes?: string | null;
	upvotes: number;
	downvotes: number;
}

interface IngredientAlternativesProps {
	recipeItemId: string;
	availableFoods: Food[];
	availableRecipes: any[]; // Simplified for now
}

export function IngredientAlternatives({ recipeItemId, availableFoods, availableRecipes: _availableRecipes }: IngredientAlternativesProps) {
	const [alternatives, setAlternatives] = useState<Alternative[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [showSuggestForm, setShowSuggestForm] = useState(false);
	const { addToast } = useToast();

	useEffect(() => {
		const fetchAlternatives = async () => {
			setIsLoading(true);
			try {
				const response = await fetch(`/api/cooking/recipes/alternatives?itemId=${recipeItemId}`);
				if (!response.ok) throw new Error('Failed to fetch alternatives');
				const data = await response.json();
				setAlternatives(data);
			} catch (error) {
				console.error(error);
				addToast('Could not load alternatives.', 'error');
			} finally {
				setIsLoading(false);
			}
		};
		void fetchAlternatives();
	}, [recipeItemId, addToast]);

	const handleVote = async (alternativeId: string, voteType: 'downvote' | 'upvote') => {
		try {
			const response = await fetch('/api/cooking/recipes/alternatives', {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ alternativeId, voteType }),
			});
			if (!response.ok) throw new Error('Failed to vote');
			// Refetch or update state locally
			addToast('Vote submitted!', 'success');
		} catch (error) {
			addToast('Failed to submit vote.', 'error');
		}
	};

	const handleSuggest = async (event: React.FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		const formData = new FormData(event.currentTarget);
		const data = {
			foodId: formData.get('foodId') as string,
			amount: formData.get('amount') as string,
			unit: formData.get('unit') as string,
			notes: formData.get('notes') as string,
		};

		try {
			const response = await fetch('/api/cooking/recipes/alternatives', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					originalItemId: recipeItemId,
					foodId: data.foodId,
					amount: Number(data.amount),
					unit: data.unit,
					notes: data.notes,
				}),
			});

			if (!response.ok) throw new Error('Failed to suggest alternative');

			const newAlternative = await response.json();
			setAlternatives([...alternatives, newAlternative]);
			setShowSuggestForm(false);
			addToast('Suggestion submitted!', 'success');
		} catch (error) {
			addToast('Failed to submit suggestion.', 'error');
		}
	};

	return (
		<div className='mt-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg'>
			<h4 className='font-semibold mb-2'>Ingredient Alternatives</h4>
			{isLoading ? (
				<p>Loading alternatives...</p>
			) : alternatives.length > 0 ? (
				<div className='space-y-3'>
					{alternatives.map((alt) => (
						<div key={alt.id} className='text-sm p-3 border rounded-md'>
							<p className='font-medium'>{alt.food?.name ?? alt.recipe?.name ?? 'Unknown item'}</p>
							<p>
								{alt.amount} {alt.unit}
							</p>
							{alt.notes !== null && alt.notes !== undefined && alt.notes !== '' && <p className='text-xs italic text-gray-500'>&quot;{alt.notes}&quot;</p>}
							<div className='flex items-center gap-2 mt-2'>
								<Button size='sm' variant='ghost' onClick={() => void handleVote(alt.id, 'upvote')}>
									👍 {alt.upvotes}
								</Button>
								<Button size='sm' variant='ghost' onClick={() => void handleVote(alt.id, 'downvote')}>
									👎 {alt.downvotes}
								</Button>
							</div>
						</div>
					))}
				</div>
			) : (
				<p className='text-sm text-gray-500'>No alternatives suggested yet.</p>
			)}

			<div className='mt-4'>
				<Button
					onClick={() => {
						setShowSuggestForm(!showSuggestForm);
					}}
					variant='outline'
				>
					{showSuggestForm ? 'Cancel' : 'Suggest an Alternative'}
				</Button>

				{showSuggestForm && (
					<form onSubmit={(e) => void handleSuggest(e)} className='mt-4 space-y-3 border-t pt-4'>
						<select name='foodId' required className='w-full p-2 border rounded'>
							<option value=''>Select an ingredient</option>
							{availableFoods.map((food) => (
								<option key={food.id} value={food.id}>
									{food.name}
								</option>
							))}
						</select>
						<div className='flex gap-2'>
							<input type='number' name='amount' placeholder='Amount' required className='w-full p-2 border rounded' />
							<input type='text' name='unit' placeholder='Unit' required className='w-full p-2 border rounded' />
						</div>
						<textarea name='notes' placeholder='Notes (optional)' className='w-full p-2 border rounded' />
						<Button type='submit'>Submit Suggestion</Button>
					</form>
				)}
			</div>
		</div>
	);
}
