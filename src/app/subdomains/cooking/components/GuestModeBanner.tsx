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
			<div className={`bg-yellow-50 dark:bg-yellow-950/90 border border-yellow-500 rounded-lg shadow-lg transition-all ${isMinimized ? 'w-auto' : 'w-full'}`}>
				{!isMinimized ? (
					<div className='p-4'>
						<div className='flex items-start justify-between mb-2'>
							<div className='flex items-center gap-2'>
								<svg className='w-5 h-5 text-yellow-600 dark:text-yellow-400' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
									<path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z' />
								</svg>
								<h3 className='font-semibold text-yellow-800 dark:text-yellow-200'>Guest Mode Active</h3>
							</div>
							<button
								onClick={() => {
									setIsMinimized(true);
								}}
								className='text-yellow-600 hover:text-yellow-700 dark:text-yellow-400 dark:hover:text-yellow-300'
								aria-label='Minimize'
							>
								<svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
									<path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M20 12H4' />
								</svg>
							</button>
						</div>

						<p className='text-sm text-yellow-700 dark:text-yellow-300 mb-3'>Your data is saved locally on this device only.</p>

						{totalItems > 0 && (
							<div className='bg-yellow-100 dark:bg-yellow-900/50 rounded p-2 mb-3'>
								<p className='text-xs font-medium text-yellow-800 dark:text-yellow-200'>Currently stored locally:</p>
								<div className='flex gap-3 mt-1 text-xs text-yellow-700 dark:text-yellow-300'>
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
							<a href='/api/auth/login' className='block text-center px-3 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors text-sm font-medium'>
								Sign In to Save
							</a>
							<p className='text-xs text-center text-yellow-700 dark:text-yellow-300'>Sync across devices & never lose data</p>
						</div>
					</div>
				) : (
					<button
						onClick={() => {
							setIsMinimized(false);
						}}
						className='flex items-center gap-2 px-3 py-2 text-sm font-medium text-yellow-800 dark:text-yellow-200 hover:bg-yellow-100 dark:hover:bg-yellow-900/50 rounded-lg transition-colors'
					>
						<svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
							<path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' />
						</svg>
						<span>Guest Mode</span>
						{totalItems > 0 && <span className='bg-yellow-600 text-yellow-100 text-xs px-1.5 py-0.5 rounded-full'>{totalItems}</span>}
					</button>
				)}
			</div>
		</div>
	);
}
