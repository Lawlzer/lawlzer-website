'use client';

import type { ReactNode } from 'react';
import { useState } from 'react';

import { animations } from '../../utils/animations';

interface TooltipProps {
	children: ReactNode;
	content: string;
	position?: 'bottom' | 'left' | 'right' | 'top';
	delay?: number;
}

export const Tooltip: React.FC<TooltipProps> = ({ children, content, position = 'top', delay = 300 }) => {
	const [isVisible, setIsVisible] = useState(false);
	const [timeoutId, setTimeoutId] = useState<NodeJS.Timeout | null>(null);

	const showTooltip = () => {
		const id = setTimeout(() => {
			setIsVisible(true);
		}, delay);
		setTimeoutId(id);
	};

	const hideTooltip = () => {
		if (timeoutId) {
			clearTimeout(timeoutId);
			setTimeoutId(null);
		}
		setIsVisible(false);
	};

	const positionClasses = {
		top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
		bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
		left: 'right-full top-1/2 -translate-y-1/2 mr-2',
		right: 'left-full top-1/2 -translate-y-1/2 ml-2',
	};

	const arrowClasses = {
		top: 'top-full left-1/2 -translate-x-1/2 border-t-gray-900 border-x-transparent border-b-transparent',
		bottom: 'bottom-full left-1/2 -translate-x-1/2 border-b-gray-900 border-x-transparent border-t-transparent',
		left: 'left-full top-1/2 -translate-y-1/2 border-l-gray-900 border-y-transparent border-r-transparent',
		right: 'right-full top-1/2 -translate-y-1/2 border-r-gray-900 border-y-transparent border-l-transparent',
	};

	return (
		<div className='relative inline-block' onMouseEnter={showTooltip} onMouseLeave={hideTooltip}>
			{children}
			{isVisible && (
				<div
					className={`
            absolute z-50 px-3 py-2 text-sm text-white
            bg-gray-900 rounded-md whitespace-nowrap
            ${positionClasses[position]}
            ${animations.fadeIn}
          `}
				>
					{content}
					<div
						className={`
              absolute w-0 h-0 border-4
              ${arrowClasses[position]}
            `}
					/>
				</div>
			)}
		</div>
	);
};

// Help icon with tooltip
interface HelpTooltipProps {
	content: string;
	size?: 'lg' | 'md' | 'sm';
}

export const HelpTooltip: React.FC<HelpTooltipProps> = ({ content, size = 'sm' }) => {
	const sizeClasses = {
		sm: 'h-4 w-4',
		md: 'h-5 w-5',
		lg: 'h-6 w-6',
	};

	return (
		<Tooltip content={content}>
			<svg className={`${sizeClasses[size]} text-muted-foreground hover:text-foreground transition-colors cursor-help`} fill='none' stroke='currentColor' viewBox='0 0 24 24'>
				<path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z' />
			</svg>
		</Tooltip>
	);
};
