'use client';

import { useEffect, useState } from 'react';

import { getGuestData } from '../services/guestStorage';

interface GuestModeBannerProps {
	isGuest: boolean;
}

export function GuestModeBanner({ isGuest }: GuestModeBannerProps) {
	const [guestData, setGuestData] = useState<{ foods: number; recipes: number; days: number }>();
	const [isMinimized, setIsMinimized] = useState(false);

	useEffect(() => {
		if (isGuest) {
			const data = getGuestData();
			setGuestData({
				foods: data.foods.length,
				recipes: data.recipes.length,
				days: data.days.length,
			});
		}
	}, [isGuest]);

	if (!isGuest || !guestData) return null;

	const totalItems = guestData.foods + guestData.recipes + guestData.days;

	return (
		<div className='fixed bottom-4 right-4 z-50 max-w-sm'>
			<div className={`bg-accent/10 dark:bg-accent/20 border border-accent rounded-lg shadow-lg backdrop-blur-sm transition-all ${isMinimized ? 'w-auto' : 'w-full'}`}>
				{!isMinimized ? (
					<div className='p-4'>
						<div className='flex items-start justify-between mb-2'>
							<div className='flex items-center gap-2'>
								<svg className='w-5 h-5 text-accent' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
									<path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z' />
								</svg>
								<h3 className='font-semibold text-foreground'>Guest Mode Active</h3>
							</div>
							<button
								onClick={() => {
									setIsMinimized(true);
								}}
								className='text-muted-foreground hover:text-foreground transition-colors'
								aria-label='Minimize'
							>
								<svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
									<path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M20 12H4' />
								</svg>
							</button>
						</div>

						<p className='text-sm text-muted-foreground mb-3'>Your data is saved locally on this device only.</p>

						{totalItems > 0 && (
							<div className='bg-muted rounded p-2 mb-3'>
								<p className='text-xs font-medium text-foreground'>Currently stored locally:</p>
								<div className='flex gap-3 mt-1 text-xs text-muted-foreground'>
									{guestData.foods > 0 && (
										<span>
											{guestData.foods} food{guestData.foods !== 1 ? 's' : ''}
										</span>
									)}
									{guestData.recipes > 0 && (
										<span>
											{guestData.recipes} recipe{guestData.recipes !== 1 ? 's' : ''}
										</span>
									)}
									{guestData.days > 0 && (
										<span>
											{guestData.days} day{guestData.days !== 1 ? 's' : ''}
										</span>
									)}
								</div>
							</div>
						)}

						<div className='flex flex-col gap-2'>
							<a href='/api/auth/login?provider=google' className='block text-center px-3 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90 transition-colors text-sm font-medium'>
								Sign In to Save
							</a>
							<p className='text-xs text-center text-muted-foreground'>Sync across devices & never lose data</p>
						</div>
					</div>
				) : (
					<button
						onClick={() => {
							setIsMinimized(false);
						}}
						className='flex items-center gap-2 px-3 py-2 text-sm font-medium text-foreground hover:bg-accent/10 rounded-lg transition-colors'
					>
						<svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
							<path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' />
						</svg>
						<span>Guest Mode</span>
						{totalItems > 0 && <span className='bg-accent text-accent-foreground text-xs px-1.5 py-0.5 rounded-full'>{totalItems}</span>}
					</button>
				)}
			</div>
		</div>
	);
}
