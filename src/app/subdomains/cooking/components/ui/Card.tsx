import { clsx } from 'clsx';
import React from 'react';

interface CardProps {
	children: React.ReactNode;
	className?: string;
	variant?: 'default' | 'elevated' | 'interactive' | 'recipe' | 'glass';
	noPadding?: boolean;
	onClick?: () => void;
}

export function Card({ children, className = '', variant = 'default', noPadding = false, onClick }: CardProps) {
	const variants = {
		default: 'bg-card border border-border shadow-sm',
		elevated: 'bg-card shadow-lg hover:shadow-xl transition-all duration-300',
		interactive: 'bg-card border border-border hover:shadow-lg hover:scale-[1.02] hover:border-cooking-primary/30 transition-all duration-300 cursor-pointer',
		recipe: 'recipe-card bg-card',
		glass: 'glass backdrop-blur-md bg-white/70 dark:bg-cooking-neutral-800/70 border border-white/20 shadow-lg',
	};

	return (
		<div 
			className={clsx(
				'rounded-xl overflow-hidden',
				variant !== 'recipe' && 'p-4',
				variants[variant], 
				!noPadding && variant !== 'recipe' && 'p-6', 
				className
			)}
			onClick={onClick}
		>
			{children}
		</div>
	);
}

interface CardHeaderProps {
	children: React.ReactNode;
	className?: string;
	icon?: React.ReactNode;
	action?: React.ReactNode;
}

export function CardHeader({ children, className = '', icon, action }: CardHeaderProps) {
	return (
		<div className={clsx('flex items-center justify-between', className)}>
			<div className='flex items-center gap-3'>
				{icon !== undefined && (
					<div className='p-2 bg-cooking-primary/10 rounded-lg text-cooking-primary'>
						{icon}
					</div>
				)}
				<h3 className='text-xl font-bold text-card-foreground'>{children}</h3>
			</div>
			{action !== undefined && <div>{action}</div>}
		</div>
	);
}

interface CardContentProps {
	children: React.ReactNode;
	className?: string;
}

export function CardContent({ children, className = '' }: CardContentProps) {
	return <div className={clsx('text-card-foreground mt-4', className)}>{children}</div>;
}

interface CardFooterProps {
	children: React.ReactNode;
	className?: string;
}

export function CardFooter({ children, className = '' }: CardFooterProps) {
	return (
		<div className={clsx(
			'flex items-center justify-end gap-2 mt-6 pt-4 border-t border-cooking-neutral-200',
			className
		)}>
			{children}
		</div>
	);
}

// Stat Card Component
interface StatCardProps {
	title: string;
	value: number | string;
	subtitle?: string;
	icon?: React.ReactNode;
	trend?: {
		value: number;
		isPositive: boolean;
	};
	className?: string;
}

export function StatCard({ title, value, subtitle, icon, trend, className = '' }: StatCardProps) {
	return (
		<Card variant="elevated" className={clsx('hover:shadow-xl transition-all duration-300', className)}>
			<div className='flex items-start justify-between'>
				<div className='flex-1'>
					<p className='text-sm font-medium text-cooking-neutral-600'>{title}</p>
					<p className='mt-2 text-3xl font-bold bg-gradient-to-r from-cooking-primary to-cooking-accent bg-clip-text text-transparent'>
						{value}
					</p>
					{subtitle !== undefined && subtitle !== null && subtitle !== '' && (
						<p className='mt-1 text-sm text-cooking-neutral-500'>{subtitle}</p>
					)}
					{trend !== undefined && (
						<div className={clsx(
							'mt-3 inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium',
							trend.isPositive 
								? 'bg-cooking-secondary-light text-cooking-secondary' 
								: 'bg-cooking-accent-light text-cooking-accent'
						)}>
							<span>{trend.isPositive ? '↑' : '↓'}</span>
							<span>{Math.abs(trend.value)}%</span>
						</div>
					)}
				</div>
				{icon !== undefined && (
					<div className='ml-4 flex-shrink-0'>
						<div className='p-3 bg-gradient-to-br from-cooking-primary/10 to-cooking-accent/10 rounded-xl text-cooking-primary'>
							{icon}
						</div>
					</div>
				)}
			</div>
		</Card>
	);
}

// Pre-styled card variants for common use cases
interface MetricCardProps {
	title: string;
	value: string | number;
	subtitle?: string;
	icon?: React.ReactNode;
	className?: string;
}

export function MetricCard({ title, value, subtitle, icon, className = '' }: MetricCardProps) {
	return (
		<Card className={clsx('relative overflow-hidden', className)}>
			<div className='flex items-start justify-between'>
				<div>
					<p className='text-sm font-medium text-muted-foreground'>{title}</p>
					<p className='mt-2 text-3xl font-semibold text-card-foreground'>{value}</p>
					{subtitle !== undefined && subtitle !== null && subtitle !== '' && <p className='mt-1 text-sm text-muted-foreground'>{subtitle}</p>}
				</div>
				{icon !== undefined && <div className='p-3 bg-muted rounded-lg text-muted-foreground'>{icon}</div>}
			</div>
		</Card>
	);
}

// New Recipe-specific card components
interface CardImageProps {
	src?: string;
	alt: string;
	className?: string;
}

export function CardImage({ src, alt, className = '' }: CardImageProps) {
	return (
		<div className={clsx('relative h-48 w-full overflow-hidden bg-cooking-neutral-100', className)}>
			{src ? (
				<>
					<img 
						src={src} 
						alt={alt} 
						className="h-full w-full object-cover transition-transform duration-500 hover:scale-110" 
					/>
					<div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
				</>
			) : (
				<div className="flex h-full items-center justify-center">
					<div className="text-center">
						<div className="mx-auto h-12 w-12 text-cooking-neutral-400">
							<svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
							</svg>
						</div>
						<p className="mt-2 text-sm text-cooking-neutral-500">No image</p>
					</div>
				</div>
			)}
		</div>
	);
}

interface CardBadgeProps {
	children: React.ReactNode;
	variant?: 'default' | 'success' | 'warning' | 'info' | 'calories' | 'protein' | 'carbs' | 'fat';
	className?: string;
}

export function CardBadge({ children, variant = 'default', className = '' }: CardBadgeProps) {
	const variants = {
		default: 'bg-cooking-neutral-200 text-cooking-neutral-700',
		success: 'bg-cooking-secondary-light text-cooking-secondary',
		warning: 'bg-cooking-calories/20 text-cooking-calories',
		info: 'bg-cooking-primary-light text-cooking-primary',
		calories: 'bg-cooking-calories/20 text-cooking-calories',
		protein: 'bg-cooking-protein/20 text-cooking-protein',
		carbs: 'bg-cooking-carbs/20 text-cooking-carbs',
		fat: 'bg-cooking-fat/20 text-cooking-fat',
	};
	
	return (
		<span className={clsx(
			"inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium",
			variants[variant],
			className
		)}>
			{children}
		</span>
	);
}

interface RecipeMetaProps {
	prepTime?: number | null;
	cookTime?: number | null;
	servings?: number;
	difficulty?: 'easy' | 'medium' | 'hard';
	className?: string;
}

export function RecipeMeta({ prepTime, cookTime, servings, difficulty, className = '' }: RecipeMetaProps) {
	const totalTime = (prepTime ?? 0) + (cookTime ?? 0);
	const difficultyColors = {
		easy: 'text-green-600',
		medium: 'text-amber-600',
		hard: 'text-red-600',
	};
	
	return (
		<div className={clsx('flex flex-wrap gap-4 text-sm text-cooking-neutral-600', className)}>
			{totalTime > 0 && (
				<div className="flex items-center gap-1">
					<svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
					</svg>
					<span>{totalTime} min</span>
				</div>
			)}
			{servings && (
				<div className="flex items-center gap-1">
					<svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
					</svg>
					<span>{servings} servings</span>
				</div>
			)}
			{difficulty && (
				<div className={clsx('flex items-center gap-1', difficultyColors[difficulty])}>
					<span className="font-medium capitalize">{difficulty}</span>
				</div>
			)}
		</div>
	);
}
