'use client';

import React, { useState } from 'react';

export const DayTracker: React.FC = () => {
	const [selectedDate] = useState(new Date());

	return (
		<div className='space-y-4'>
			<h2 className='text-xl font-bold'>Day Tracking</h2>
			<p className='text-gray-600 dark:text-gray-400'>Track your daily food intake and monitor your nutritional goals.</p>

			<div className='rounded-lg border p-4'>
				<h3 className='font-semibold mb-2'>
					{selectedDate.toLocaleDateString('en-US', {
						weekday: 'long',
						year: 'numeric',
						month: 'long',
						day: 'numeric',
					})}
				</h3>
				<p className='text-sm text-gray-600 dark:text-gray-400'>No entries for this day yet. Start by adding foods or recipes you&apos;ve consumed.</p>
			</div>

			<div className='text-center py-8 text-gray-500'>
				<p>Day tracking feature coming soon!</p>
			</div>
		</div>
	);
};
