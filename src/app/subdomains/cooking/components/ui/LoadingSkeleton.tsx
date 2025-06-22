interface SkeletonProps {
	className?: string;
	animate?: boolean;
}

export function Skeleton({ className = '', animate = true }: SkeletonProps) {
	return (
		<div
			className={`
        bg-gray-200 dark:bg-gray-700 rounded
        ${animate ? 'animate-pulse' : ''}
        ${className}
      `}
		/>
	);
}

export function RecipeCardSkeleton() {
	return (
		<div className='border rounded-lg p-4 space-y-3'>
			<Skeleton className='h-6 w-3/4' />
			<Skeleton className='h-4 w-full' />
			<Skeleton className='h-4 w-5/6' />
			<div className='flex gap-4 mt-4'>
				<Skeleton className='h-8 w-20' />
				<Skeleton className='h-8 w-20' />
			</div>
		</div>
	);
}

export function RecipeListSkeleton({ count = 6 }: { count?: number }) {
	return (
		<div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
			{Array.from({ length: count }).map((_, i) => (
				<RecipeCardSkeleton key={i} />
			))}
		</div>
	);
}

export function FoodItemSkeleton() {
	return (
		<div className='flex items-center justify-between p-3 border rounded'>
			<div className='flex-1 space-y-2'>
				<Skeleton className='h-5 w-1/2' />
				<Skeleton className='h-4 w-1/3' />
			</div>
			<Skeleton className='h-8 w-16' />
		</div>
	);
}

export function DayTrackerSkeleton() {
	return (
		<div className='space-y-4'>
			<Skeleton className='h-10 w-full' />
			<div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
				<div className='border rounded-lg p-4 space-y-3'>
					<Skeleton className='h-6 w-1/3' />
					<div className='space-y-2'>
						<FoodItemSkeleton />
						<FoodItemSkeleton />
						<FoodItemSkeleton />
					</div>
				</div>
				<div className='border rounded-lg p-4 space-y-3'>
					<Skeleton className='h-6 w-1/3' />
					<Skeleton className='h-32 w-full' />
				</div>
			</div>
		</div>
	);
}

export function GoalsSkeleton() {
	return (
		<div className='space-y-4'>
			<div className='flex justify-between items-center'>
				<Skeleton className='h-8 w-32' />
				<Skeleton className='h-10 w-24' />
			</div>
			<div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
				{Array.from({ length: 6 }).map((_, i) => (
					<div key={i} className='border rounded-lg p-4 space-y-2'>
						<Skeleton className='h-5 w-24' />
						<Skeleton className='h-8 w-full' />
						<Skeleton className='h-4 w-16' />
					</div>
				))}
			</div>
		</div>
	);
}

export function TabContentSkeleton() {
	return (
		<div className='space-y-4'>
			<Skeleton className='h-8 w-48' />
			<Skeleton className='h-4 w-64' />
			<div className='mt-6'>
				<Skeleton className='h-64 w-full' />
			</div>
		</div>
	);
}

export function OverviewCardSkeleton() {
	return (
		<div className='rounded-lg border p-4'>
			<div className='flex items-center justify-between mb-2'>
				<Skeleton className='h-4 w-24' />
				<Skeleton className='h-5 w-5 rounded' />
			</div>
			<Skeleton className='h-8 w-20 mb-1' />
			<Skeleton className='h-3 w-16' />
		</div>
	);
}

export function OverviewSkeleton() {
	return (
		<div className='grid gap-4 md:grid-cols-2 lg:grid-cols-4'>
			<OverviewCardSkeleton />
			<OverviewCardSkeleton />
			<OverviewCardSkeleton />
			<OverviewCardSkeleton />
		</div>
	);
}
