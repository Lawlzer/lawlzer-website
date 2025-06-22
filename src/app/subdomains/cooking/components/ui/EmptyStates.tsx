'use client';

import type { ReactNode } from 'react';

import { animations } from '../../utils/animations';

import { Button } from './Button';

interface BaseEmptyStateProps {
	icon?: ReactNode;
	title: string;
	description?: string;
	action?: {
		label: string;
		onClick: () => void;
	};
	className?: string;
}

const BaseEmptyState: React.FC<BaseEmptyStateProps> = ({ icon, title, description, action, className = '' }) => (
	<div
		className={`
      flex min-h-[400px] flex-col items-center justify-center 
      space-y-4 p-8 text-center
      ${animations.fadeIn}
      ${className}
    `}
	>
		{icon !== undefined && <div className='text-muted-foreground'>{icon}</div>}
		<div className='space-y-2'>
			<h3 className='text-lg font-semibold'>{title}</h3>
			{description !== undefined && description !== null && description !== '' && <p className='max-w-sm text-sm text-muted-foreground'>{description}</p>}
		</div>
		{action !== undefined && (
			<Button onClick={action.onClick} variant='primary'>
				{action.label}
			</Button>
		)}
	</div>
);

// Recipe empty state
export const RecipeEmptyState: React.FC<{ onCreateRecipe?: () => void }> = ({ onCreateRecipe }) => (
	<BaseEmptyState
		icon={
			<svg className='h-12 w-12' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
				<path strokeLinecap='round' strokeLinejoin='round' strokeWidth={1.5} d='M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253' />
			</svg>
		}
		title='No recipes yet'
		description='Create your first recipe to start building your cookbook'
		action={
			onCreateRecipe
				? {
						label: 'Create Recipe',
						onClick: onCreateRecipe,
					}
				: undefined
		}
	/>
);

// Search empty state
export const SearchEmptyState: React.FC<{
	query: string;
	onClear?: () => void;
}> = ({ query, onClear }) => (
	<BaseEmptyState
		icon={
			<svg className='h-12 w-12' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
				<path strokeLinecap='round' strokeLinejoin='round' strokeWidth={1.5} d='M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z' />
			</svg>
		}
		title='No results found'
		description={`We couldn't find any recipes matching "${query}"`}
		action={
			onClear
				? {
						label: 'Clear search',
						onClick: onClear,
					}
				: undefined
		}
	/>
);

// Food empty state
export const FoodEmptyState: React.FC<{ onScanFood?: () => void }> = ({ onScanFood }) => (
	<BaseEmptyState
		icon={
			<svg className='h-12 w-12' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
				<path strokeLinecap='round' strokeLinejoin='round' strokeWidth={1.5} d='M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z' />
			</svg>
		}
		title='No foods scanned'
		description='Scan a barcode to add foods to your database'
		action={
			onScanFood
				? {
						label: 'Scan Food',
						onClick: onScanFood,
					}
				: undefined
		}
	/>
);

// Goal empty state
export const GoalEmptyState: React.FC<{ onSetGoal?: () => void }> = ({ onSetGoal }) => (
	<BaseEmptyState
		icon={
			<svg className='h-12 w-12' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
				<path strokeLinecap='round' strokeLinejoin='round' strokeWidth={1.5} d='M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' />
			</svg>
		}
		title='No nutrition goals set'
		description='Set daily targets for calories and macronutrients'
		action={
			onSetGoal
				? {
						label: 'Set Goals',
						onClick: onSetGoal,
					}
				: undefined
		}
	/>
);

// Generic empty state
export const EmptyState: React.FC<BaseEmptyStateProps> = (props) => <BaseEmptyState {...props} />;
