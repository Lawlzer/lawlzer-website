'use client';

import { useState } from 'react';

import { RecipeCard } from '../components/RecipeCard';
import type { RecipeWithDetails } from '../types/recipe.types';

export default function AdvancedSearchPage() {
	const [searchTerm, setSearchTerm] = useState('');
	const [results, setResults] = useState<RecipeWithDetails[]>([]);
	const [isLoading, setIsLoading] = useState(false);

	const handleSearch = async () => {
		setIsLoading(true);
		try {
			const response = await fetch(`/api/cooking/search?query=${encodeURIComponent(searchTerm)}`);
			const data = await response.json();
			setResults(data);
		} catch (error) {
			console.error('Error searching recipes:', error);
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<div className='container mx-auto p-4 space-y-6'>
			<h1 className='text-3xl font-bold'>Advanced Recipe Search</h1>
			<div className='flex gap-2'>
				<input
					type='text'
					value={searchTerm}
					onChange={(e) => {
						setSearchTerm(e.target.value);
					}}
					placeholder='Search by name or description...'
					className='flex-1 px-4 py-2 border rounded-lg'
				/>
				<button onClick={() => void handleSearch()} className='px-6 py-2 bg-blue-500 text-white rounded-lg' disabled={isLoading}>
					{isLoading ? 'Searching...' : 'Search'}
				</button>
			</div>

			<div>
				<h2 className='text-2xl font-semibold mb-4'>Results ({results.length})</h2>
				{isLoading ? (
					<div className='text-center'>
						<p>Loading...</p>
					</div>
				) : (
					<div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
						{results.map((recipe) => (
							<RecipeCard key={recipe.id} recipe={recipe} />
						))}
					</div>
				)}
			</div>
		</div>
	);
}
