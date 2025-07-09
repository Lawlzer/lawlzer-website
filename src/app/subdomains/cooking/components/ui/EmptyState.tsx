'use client';

import React from 'react';
import { clsx } from 'clsx';

interface EmptyStateAction {
	label: string;
	onClick: () => void;
	variant?: 'primary' | 'secondary';
}

interface EmptyStateProps {
	title: string;
	description?: string;
	icon?: React.ReactNode;
	actions?: EmptyStateAction[];
	compact?: boolean;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ title, description, icon, actions, compact = false }) => {
	return (
		<div className={clsx('text-center', compact ? 'py-6' : 'py-12')}>
			{icon ?? (
				<svg className='w-16 h-16 mx-auto text-muted-foreground' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
					<path strokeLinecap='round' strokeLinejoin='round' strokeWidth={1.5} d='M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4' />
				</svg>
			)}

			<h3 className='mt-4 text-lg font-semibold text-foreground'>{title}</h3>
			<p className='mt-2 text-muted-foreground max-w-md mx-auto'>{description}</p>

			{actions !== undefined && actions.length > 0 && (
				<div className='mt-6 flex flex-wrap gap-3 justify-center'>
					{actions.map((action, index) => (
						<button key={index} onClick={action.onClick} className={clsx('px-4 py-2 rounded-lg font-medium transition-colors', action.variant === 'secondary' ? 'border border-border hover:bg-muted' : 'bg-primary text-primary-foreground hover:bg-primary/90')}>
							{action.label}
						</button>
					))}
				</div>
			)}
		</div>
	);
};

// Specialized empty states for common scenarios
export const NoRecipesEmptyState: React.FC<{ onCreateRecipe: () => void }> = ({ onCreateRecipe }) => (
	<EmptyState
		icon={
			<svg className='w-16 h-16 mx-auto text-muted-foreground' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
				<path strokeLinecap='round' strokeLinejoin='round' strokeWidth={1.5} d='M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253' />
			</svg>
		}
		title='No recipes yet'
		description='Create your first recipe to start tracking your nutrition'
		actions={[{ label: 'Create Recipe', onClick: onCreateRecipe, variant: 'primary' }]}
	/>
);

export const NoFoodsEmptyState: React.FC<{ onAddFood: () => void }> = ({ onAddFood }) => (
	<EmptyState
		icon={
			<svg className='w-16 h-16 mx-auto text-muted-foreground' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
				<path strokeLinecap='round' strokeLinejoin='round' strokeWidth={1.5} d='M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z' />
			</svg>
		}
		title='No foods added'
		description='Add foods to start building your recipes'
		actions={[{ label: 'Add Food', onClick: onAddFood, variant: 'primary' }]}
	/>
);

export function NoSearchResultsEmptyState({ searchTerm, onClear }: { searchTerm: string; onClear: () => void }) {
	return (
		<EmptyState
			icon={
				<svg className='w-16 h-16 mx-auto text-muted-foreground' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
					<path strokeLinecap='round' strokeLinejoin='round' strokeWidth={1.5} d='M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z' />
				</svg>
			}
			title='No results found'
			description={`No items match "${searchTerm}". Try a different search term.`}
			actions={[
				{
					label: 'Clear search',
					onClick: onClear,
					variant: 'secondary',
				},
			]}
		/>
	);
}

export function NoDataEmptyState({ message }: { message?: string }) {
	return <EmptyState title='No data available' description={message ?? 'Start by adding some items to see data here.'} />;
}

export function ErrorEmptyState({ onRetry, message }: { onRetry?: () => void; message?: string }) {
	return (
		<EmptyState
			icon={
				<svg className='w-16 h-16 mx-auto text-destructive' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
					<path strokeLinecap='round' strokeLinejoin='round' strokeWidth={1.5} d='M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z' />
				</svg>
			}
			title='Something went wrong'
			description={message ?? 'An error occurred while loading the data.'}
			actions={
				onRetry
					? [
							{
								label: 'Try again',
								onClick: onRetry,
							},
						]
					: undefined
			}
		/>
	);
}
