'use client';

import { useState } from 'react';

import type { RecipeWithDetails } from '../types/recipe.types';
import { formatDuration, formatNutritionValue } from '../utils/recipe.utils';

interface RecipeCardProps {
	recipe: RecipeWithDetails;
	onEdit?: () => void;
	onCook?: () => void;
	onDelete?: () => void;
	onViewHistory?: () => void;
	isOwner?: boolean;
}

export function RecipeCard({ recipe, onEdit, onCook, onDelete, onViewHistory, isOwner = false }: RecipeCardProps) {
	const [showDetails, setShowDetails] = useState(false);
	const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

	const hasNutrition = recipe.currentVersion !== null;
	const totalTime = (recipe.prepTime ?? 0) + (recipe.cookTime ?? 0);

	return (
		<div className='group relative rounded-xl border bg-white dark:bg-gray-900 shadow-sm hover:shadow-md transition-all duration-200'>
			{/* Header */}
			<div className='p-5'>
				<div className='flex items-start justify-between mb-3'>
					<h3 className='text-lg font-semibold text-gray-900 dark:text-gray-100 line-clamp-2'>{recipe.name}</h3>
					{recipe.visibility === 'public' && <span className='ml-2 px-2 py-1 text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-full'>Public</span>}
					{recipe.visibility === 'unlisted' && <span className='ml-2 px-2 py-1 text-xs bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded-full'>Unlisted</span>}
				</div>

				{recipe.description != null && recipe.description !== '' && <p className='text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2'>{recipe.description}</p>}

				{/* Quick Info */}
				<div className='flex flex-wrap gap-3 text-sm text-gray-600 dark:text-gray-400'>
					{totalTime > 0 && (
						<div className='flex items-center gap-1'>
							<svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
								<path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z' />
							</svg>
							<span>{formatDuration(totalTime)}</span>
						</div>
					)}
					<div className='flex items-center gap-1'>
						<svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
							<path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' />
						</svg>
						<span>
							{recipe.servings} {recipe.servings === 1 ? 'serving' : 'servings'}
						</span>
					</div>
					{hasNutrition && recipe.currentVersion && (
						<div className='flex items-center gap-1'>
							<svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
								<path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M13 10V3L4 14h7v7l9-11h-7z' />
							</svg>
							<span>{Math.round(recipe.currentVersion.caloriesPerServing)} cal</span>
						</div>
					)}
				</div>
			</div>

			{/* Nutrition Details (Expandable) */}
			{hasNutrition && recipe.currentVersion && (
				<div className='border-t dark:border-gray-800'>
					<button
						onClick={() => {
							setShowDetails(!showDetails);
						}}
						className='w-full px-5 py-3 text-left text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors flex items-center justify-between'
					>
						<span>Nutrition per serving</span>
						<svg className={`w-4 h-4 transition-transform ${showDetails ? 'rotate-180' : ''}`} fill='none' stroke='currentColor' viewBox='0 0 24 24'>
							<path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M19 9l-7 7-7-7' />
						</svg>
					</button>

					{showDetails && (
						<div className='px-5 pb-4'>
							<div className='grid grid-cols-2 gap-3 text-sm'>
								<div className='flex justify-between'>
									<span className='text-gray-600 dark:text-gray-400'>Calories</span>
									<span className='font-medium'>{Math.round(recipe.currentVersion.caloriesPerServing)}</span>
								</div>
								<div className='flex justify-between'>
									<span className='text-gray-600 dark:text-gray-400'>Protein</span>
									<span className='font-medium'>{formatNutritionValue(recipe.currentVersion.proteinPerServing)}</span>
								</div>
								<div className='flex justify-between'>
									<span className='text-gray-600 dark:text-gray-400'>Carbs</span>
									<span className='font-medium'>{formatNutritionValue(recipe.currentVersion.carbsPerServing)}</span>
								</div>
								<div className='flex justify-between'>
									<span className='text-gray-600 dark:text-gray-400'>Fat</span>
									<span className='font-medium'>{formatNutritionValue(recipe.currentVersion.fatPerServing)}</span>
								</div>
								<div className='flex justify-between'>
									<span className='text-gray-600 dark:text-gray-400'>Fiber</span>
									<span className='font-medium'>{formatNutritionValue(recipe.currentVersion.fiberPerServing)}</span>
								</div>
								<div className='flex justify-between'>
									<span className='text-gray-600 dark:text-gray-400'>Sodium</span>
									<span className='font-medium'>{formatNutritionValue(recipe.currentVersion.sodiumPerServing, 'mg')}</span>
								</div>
							</div>
						</div>
					)}
				</div>
			)}

			{/* Actions */}
			<div className='flex items-center gap-2 p-5 pt-0'>
				{onCook && (
					<button onClick={onCook} className='flex-1 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors text-sm font-medium'>
						Cook
					</button>
				)}
				{isOwner && onEdit && (
					<button onClick={onEdit} className='flex-1 px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-sm font-medium'>
						Edit
					</button>
				)}
				{isOwner && onDelete && (
					<button
						onClick={() => {
							setShowDeleteConfirm(true);
						}}
						className='p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors'
						title='Delete recipe'
					>
						<svg className='w-5 h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
							<path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16' />
						</svg>
					</button>
				)}
			</div>

			{/* Version Badge */}
			{recipe.versions.length > 1 && (
				<button onClick={onViewHistory} className='absolute top-3 right-3 group/version' title='View version history'>
					<span className='px-2 py-1 text-xs bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded-full group-hover/version:bg-gray-200 dark:group-hover/version:bg-gray-700 transition-colors flex items-center gap-1'>
						<svg className='w-3 h-3' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
							<path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z' />
						</svg>
						v{recipe.currentVersion?.version ?? 1}
					</span>
				</button>
			)}

			{/* Delete Confirmation Modal */}
			{showDeleteConfirm && (
				<div
					className='fixed inset-0 bg-black/50 flex items-center justify-center z-50'
					onClick={() => {
						setShowDeleteConfirm(false);
					}}
				>
					<div
						className='bg-white dark:bg-gray-900 rounded-lg p-6 max-w-sm mx-4 shadow-xl'
						onClick={(e) => {
							e.stopPropagation();
						}}
					>
						<h3 className='text-lg font-semibold mb-3'>Delete Recipe?</h3>
						<p className='text-gray-600 dark:text-gray-400 mb-6'>Are you sure you want to delete &quot;{recipe.name}&quot;? This action cannot be undone.</p>
						<div className='flex gap-3'>
							<button
								onClick={() => {
									setShowDeleteConfirm(false);
								}}
								className='flex-1 px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors'
							>
								Cancel
							</button>
							<button
								onClick={() => {
									onDelete?.();
									setShowDeleteConfirm(false);
								}}
								className='flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors'
							>
								Delete
							</button>
						</div>
					</div>
				</div>
			)}
		</div>
	);
}
