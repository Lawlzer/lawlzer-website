import React from 'react';

// Icon components for the cooking module
export const HomeIcon = ({ className = 'w-5 h-5' }: { className?: string }) => (
	<svg className={className} fill='none' stroke='currentColor' viewBox='0 0 24 24' xmlns='http://www.w3.org/2000/svg'>
		<path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' />
	</svg>
);

export const CameraIcon = ({ className = 'w-5 h-5' }: { className?: string }) => (
	<svg className={className} fill='none' stroke='currentColor' viewBox='0 0 24 24' xmlns='http://www.w3.org/2000/svg'>
		<path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z' />
		<path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M15 13a3 3 0 11-6 0 3 3 0 016 0z' />
	</svg>
);

export const UtensilsIcon = ({ className = 'w-5 h-5' }: { className?: string }) => (
	<svg className={className} fill='none' stroke='currentColor' viewBox='0 0 24 24' xmlns='http://www.w3.org/2000/svg'>
		<path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M12 8.5v13M7 8.5v13m10-13v13M5 3v5a2 2 0 002 2h0a2 2 0 002-2V3m10 0v5a2 2 0 01-2 2h0a2 2 0 01-2-2V3' />
		<path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M5 3h4M15 3h4' />
	</svg>
);

export const CalendarIcon = ({ className = 'w-5 h-5' }: { className?: string }) => (
	<svg className={className} fill='none' stroke='currentColor' viewBox='0 0 24 24' xmlns='http://www.w3.org/2000/svg'>
		<path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' />
	</svg>
);

export const GoalIcon = ({ className = 'w-5 h-5' }: { className?: string }) => (
	<svg className={className} fill='none' stroke='currentColor' viewBox='0 0 24 24' xmlns='http://www.w3.org/2000/svg'>
		<path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' />
	</svg>
);

export const ChefHatIcon = ({ className = 'w-5 h-5' }: { className?: string }) => (
	<svg className={className} fill='none' stroke='currentColor' viewBox='0 0 24 24' xmlns='http://www.w3.org/2000/svg'>
		<path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M12 3C9.8 3 8 4.8 8 7c-2.2 0-4 1.8-4 4 0 1.5.8 2.8 2 3.5V21h12v-6.5c1.2-.7 2-2 2-3.5 0-2.2-1.8-4-4-4 0-2.2-1.8-4-4-4z' />
		<path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M9 21v-3m6 3v-3m-3 3v-3' />
	</svg>
);
