'use client';

import type { RecipeVersion } from '@prisma/client';
import { useEffect, useState } from 'react';

interface RecipeHistoryProps {
	recipeId: string;
	currentVersionId: string | null;
	onClose: () => void;
	onRevert?: (versionId: string) => void;
}

interface VersionWithDetails extends RecipeVersion {
	items: {
		id: string;
		amount: number;
		unit: string;
		food?: {
			name: string;
		} | null;
		recipe?: {
			name: string;
		} | null;
	}[];
}

export const RecipeHistory: React.FC<RecipeHistoryProps> = ({ recipeId, currentVersionId, onClose, onRevert }) => {
	const [versions, setVersions] = useState<VersionWithDetails[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [selectedVersions, setSelectedVersions] = useState<string[]>([]);

	// Load version history
	useEffect(() => {
		const loadVersions = async () => {
			try {
				const response = await fetch(`/api/cooking/recipes/${recipeId}/versions`);
				if (response.ok) {
					const data = await response.json();
					setVersions(data);
				}
			} catch (error) {
				console.error('Error loading recipe versions:', error);
			} finally {
				setIsLoading(false);
			}
		};

		void loadVersions();
	}, [recipeId]);

	const formatDate = (date: Date | string) =>
		new Date(date).toLocaleString('en-US', {
			year: 'numeric',
			month: 'short',
			day: 'numeric',
			hour: '2-digit',
			minute: '2-digit',
		});

	const handleVersionSelect = (versionId: string) => {
		setSelectedVersions((prev) => {
			if (prev.includes(versionId)) {
				return prev.filter((id) => id !== versionId);
			}
			if (prev.length >= 2) {
				return [prev[1], versionId];
			}
			return [...prev, versionId];
		});
	};

	if (isLoading) {
		return (
			<div className='fixed inset-0 bg-black/50 flex items-center justify-center z-50'>
				<div className='bg-white dark:bg-gray-800 rounded-lg p-6 max-w-4xl w-full mx-4'>
					<div className='flex justify-center py-8'>
						<div className='animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500'></div>
					</div>
				</div>
			</div>
		);
	}

	return (
		<div className='fixed inset-0 bg-black/50 flex items-center justify-center z-50'>
			<div className='bg-white dark:bg-gray-800 rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden flex flex-col'>
				<div className='flex justify-between items-center mb-4'>
					<h2 className='text-2xl font-bold'>Recipe Version History</h2>
					<button onClick={onClose} className='text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'>
						<svg className='w-6 h-6' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
							<path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M6 18L18 6M6 6l12 12' />
						</svg>
					</button>
				</div>

				{selectedVersions.length === 2 && (
					<div className='mb-4 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg'>
						<p className='text-sm'>
							Comparing versions {versions.find((v) => v.id === selectedVersions[0])?.version} and {versions.find((v) => v.id === selectedVersions[1])?.version}
						</p>
					</div>
				)}

				<div className='overflow-y-auto flex-1'>
					<div className='space-y-4'>
						{versions.map((version) => (
							<div key={version.id} className={`border rounded-lg p-4 ${version.id === currentVersionId ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/20' : 'hover:border-gray-400'} ${selectedVersions.includes(version.id) ? 'ring-2 ring-blue-500' : ''}`}>
								<div className='flex items-start justify-between'>
									<div className='flex-1'>
										<div className='flex items-center gap-2'>
											<h3 className='font-semibold'>Version {version.version}</h3>
											{version.id === currentVersionId && <span className='text-xs bg-blue-500 text-white px-2 py-1 rounded'>Current</span>}
										</div>
										<p className='text-sm text-gray-600 dark:text-gray-400 mt-1'>{formatDate(version.createdAt)}</p>

										{/* Version details */}
										<div className='mt-3 space-y-2'>
											<div className='grid grid-cols-2 md:grid-cols-4 gap-2 text-sm'>
												<div>
													<span className='text-gray-600 dark:text-gray-400'>Servings:</span>
													<span className='ml-1 font-medium'>{version.servings}</span>
												</div>
												{version.prepTime != null && version.prepTime > 0 && (
													<div>
														<span className='text-gray-600 dark:text-gray-400'>Prep:</span>
														<span className='ml-1 font-medium'>{version.prepTime} min</span>
													</div>
												)}
												{version.cookTime != null && version.cookTime > 0 && (
													<div>
														<span className='text-gray-600 dark:text-gray-400'>Cook:</span>
														<span className='ml-1 font-medium'>{version.cookTime} min</span>
													</div>
												)}
											</div>

											{/* Nutrition per serving */}
											<div className='bg-gray-100 dark:bg-gray-700 rounded p-2'>
												<p className='text-xs font-medium mb-1'>Per Serving:</p>
												<div className='grid grid-cols-4 gap-2 text-xs'>
													<div>{version.caloriesPerServing.toFixed(0)} cal</div>
													<div>{version.proteinPerServing.toFixed(1)}g protein</div>
													<div>{version.carbsPerServing.toFixed(1)}g carbs</div>
													<div>{version.fatPerServing.toFixed(1)}g fat</div>
												</div>
											</div>

											{/* Ingredients */}
											<div>
												<p className='text-sm font-medium mb-1'>Ingredients ({version.items.length}):</p>
												<div className='text-xs space-y-1'>
													{version.items.slice(0, 3).map((item, idx) => (
														<div key={idx} className='text-gray-600 dark:text-gray-400'>
															• {item.amount}
															{item.unit} {item.food?.name ?? item.recipe?.name ?? 'Unknown'}
														</div>
													))}
													{version.items.length > 3 && <div className='text-gray-500'>... and {version.items.length - 3} more</div>}
												</div>
											</div>
										</div>
									</div>

									<div className='flex flex-col gap-2 ml-4'>
										<button
											onClick={() => {
												handleVersionSelect(version.id);
											}}
											className='px-3 py-1 text-sm border rounded hover:bg-gray-100 dark:hover:bg-gray-700'
										>
											{selectedVersions.includes(version.id) ? 'Deselect' : 'Compare'}
										</button>
										{version.id !== currentVersionId && onRevert && (
											<button
												onClick={() => {
													onRevert(version.id);
												}}
												className='px-3 py-1 text-sm bg-orange-500 text-white rounded hover:bg-orange-600'
											>
												Revert
											</button>
										)}
									</div>
								</div>
							</div>
						))}
					</div>
				</div>

				{selectedVersions.length === 2 && (
					<div className='mt-4 pt-4 border-t'>
						<button
							onClick={() => {
								// TODO: Show detailed comparison view
								console.info('Show comparison between versions:', selectedVersions);
							}}
							className='px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600'
						>
							View Detailed Comparison
						</button>
					</div>
				)}
			</div>
		</div>
	);
};
