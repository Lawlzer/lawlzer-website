'use client';

import { motion } from 'framer-motion';
import React from 'react';

interface SkeletonLoaderProps {
	className?: string;
	variant?: 'circle' | 'rect' | 'text';
	width?: number | string;
	height?: number | string;
	count?: number;
}

export function SkeletonLoader({ className = '', variant = 'rect', width = '100%', height = 20, count = 1 }: SkeletonLoaderProps) {
	const baseClasses = 'bg-gradient-to-r from-muted/50 via-muted/30 to-muted/50 bg-[length:200%_100%]';

	const variantClasses = {
		text: 'rounded',
		rect: 'rounded-md',
		circle: 'rounded-full',
	};

	const skeletonClass = `${baseClasses} ${variantClasses[variant]} ${className}`;

	return (
		<>
			{Array.from({ length: count }).map((_, index) => (
				<motion.div
					key={index}
					className={skeletonClass}
					style={{ width, height }}
					animate={{
						backgroundPosition: ['200% 0', '-200% 0'],
					}}
					transition={{
						duration: 1.5,
						repeat: Infinity,
						ease: 'linear',
					}}
				/>
			))}
		</>
	);
}

export function FilterPanelSkeleton() {
	return (
		<div className='space-y-4'>
			{/* Header skeleton */}
			<div className='flex items-center justify-between'>
				<SkeletonLoader width={120} height={24} variant='text' />
				<SkeletonLoader width={80} height={32} variant='rect' />
			</div>

			{/* Filter categories skeleton */}
			{Array.from({ length: 3 }).map((_, i) => (
				<div key={i} className='space-y-2'>
					<SkeletonLoader width={150} height={20} variant='text' />
					<div className='space-y-1'>
						<SkeletonLoader count={4} height={36} variant='rect' className='mb-1' />
					</div>
				</div>
			))}
		</div>
	);
}

export function ChartPanelSkeleton() {
	return (
		<div className='space-y-4'>
			{/* Tabs skeleton */}
			<div className='flex gap-2'>
				<SkeletonLoader count={3} width={100} height={36} variant='rect' className='mr-2' />
			</div>

			{/* Chart area skeleton */}
			<div className='relative h-[400px] w-full'>
				<SkeletonLoader width='100%' height='100%' variant='rect' />

				{/* Axis lines */}
				<div className='absolute bottom-0 left-0 right-0 h-[1px] bg-muted/20' />
				<div className='absolute bottom-0 left-0 top-0 w-[1px] bg-muted/20' />
			</div>

			{/* Legend skeleton */}
			<div className='flex flex-wrap gap-4 mt-4'>
				<SkeletonLoader count={3} width={120} height={24} variant='rect' className='mr-2' />
			</div>
		</div>
	);
}
