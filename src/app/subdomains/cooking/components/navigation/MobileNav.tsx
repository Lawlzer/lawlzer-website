'use client';

import { useState } from 'react';

import { animations } from '../../utils/animations';
import { Button } from '../ui/Button';

interface MobileNavProps {
	tabs: {
		id: string;
		label: string;
		icon?: React.ReactNode;
	}[];
	activeTab: string;
	onTabChange: (tabId: string) => void;
}

export const MobileNav: React.FC<MobileNavProps> = ({ tabs, activeTab, onTabChange }) => {
	const [isOpen, setIsOpen] = useState(false);

	return (
		<>
			{/* Mobile menu button */}
			<div className='fixed bottom-4 right-4 z-50 lg:hidden'>
				<Button
					onClick={() => {
						setIsOpen(!isOpen);
					}}
					variant='primary'
					size='lg'
					className='rounded-full shadow-lg'
				>
					<svg className='h-6 w-6' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
						{isOpen ? <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M6 18L18 6M6 6l12 12' /> : <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M4 6h16M4 12h16M4 18h16' />}
					</svg>
				</Button>
			</div>

			{/* Mobile menu overlay */}
			{isOpen && (
				<div
					className={`fixed inset-0 z-40 bg-black/50 lg:hidden ${animations.fadeIn}`}
					onClick={() => {
						setIsOpen(false);
					}}
				/>
			)}

			{/* Mobile menu */}
			<div
				className={`
          fixed bottom-0 left-0 right-0 z-40 
          transform bg-background p-4 shadow-lg transition-transform
          lg:hidden
          ${isOpen ? 'translate-y-0' : 'translate-y-full'}
        `}
			>
				<nav className='grid grid-cols-2 gap-2'>
					{tabs.map((tab) => (
						<Button
							key={tab.id}
							onClick={() => {
								onTabChange(tab.id);
								setIsOpen(false);
							}}
							variant={activeTab === tab.id ? 'primary' : 'secondary'}
							className='flex items-center justify-center gap-2'
						>
							{tab.icon}
							<span>{tab.label}</span>
						</Button>
					))}
				</nav>
			</div>
		</>
	);
};
