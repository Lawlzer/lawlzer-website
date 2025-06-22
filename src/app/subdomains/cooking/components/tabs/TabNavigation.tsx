'use client';

import { clsx } from 'clsx';
import React, { useState } from 'react';

import { AnalysisIcon, CalendarIcon, CameraIcon, ChefHatIcon, ChevronDownIcon, ClipboardIcon, GoalIcon, HomeIcon, LeafIcon, ToolIcon, UtensilsIcon } from '../Icons';

export type TabId = 'analysis' | 'cooking' | 'days' | 'fridge' | 'goals' | 'overview' | 'planner' | 'recipes' | 'scan' | 'tools';

interface TabNavigationProps {
	activeTab: TabId;
	onTabChange: (tab: TabId) => void;
}

interface TabConfig {
	id: TabId;
	label: string;
	icon: React.ReactNode;
	mobileLabel?: string;
}

const tabs: TabConfig[] = [
	{
		id: 'overview',
		label: 'Overview',
		icon: <HomeIcon size={20} />,
		mobileLabel: 'Home',
	},
	{
		id: 'scan',
		label: 'Scan Food',
		icon: <CameraIcon size={20} />,
		mobileLabel: 'Scan',
	},
	{ id: 'recipes', label: 'Recipes', icon: <UtensilsIcon size={20} /> },
	{
		id: 'days',
		label: 'Daily Log',
		icon: <CalendarIcon size={20} />,
		mobileLabel: 'Days',
	},
	{ id: 'goals', label: 'Goals', icon: <GoalIcon size={20} /> },
	{ id: 'analysis', label: 'Analysis', icon: <AnalysisIcon size={20} /> },
	{
		id: 'planner',
		label: 'Meal Planner',
		icon: <ClipboardIcon size={20} />,
		mobileLabel: 'Plan',
	},
	{
		id: 'fridge',
		label: 'My Fridge',
		icon: <LeafIcon size={20} />,
		mobileLabel: 'Fridge',
	},
	{
		id: 'cooking',
		label: 'Cooking Mode',
		icon: <ChefHatIcon size={20} />,
		mobileLabel: 'Cook',
	},
	{ id: 'tools', label: 'Tools', icon: <ToolIcon size={20} /> },
];

export function TabNavigation({ activeTab, onTabChange }: TabNavigationProps) {
	const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
	const activeTabConfig = tabs.find((tab) => tab.id === activeTab);

	return (
		<nav className='border-b border-gray-200 dark:border-gray-700'>
			{/* Desktop Navigation */}
			<div className='hidden md:block'>
				<div className='flex space-x-1 overflow-x-auto scrollbar-hide pb-px'>
					{tabs.map((tab) => (
						<button
							key={tab.id}
							onClick={() => {
								onTabChange(tab.id);
							}}
							className={clsx('flex items-center gap-2 px-4 py-3 text-sm font-medium rounded-t-lg transition-all whitespace-nowrap', 'hover:bg-gray-100 dark:hover:bg-gray-800', activeTab === tab.id ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 border-b-2 border-blue-600 dark:border-blue-400 -mb-px' : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100')}
						>
							{tab.icon}
							<span>{tab.label}</span>
						</button>
					))}
				</div>
			</div>

			{/* Mobile Navigation */}
			<div className='md:hidden'>
				<button
					onClick={() => {
						setIsMobileMenuOpen(!isMobileMenuOpen);
					}}
					className='w-full flex items-center justify-between px-4 py-3 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
				>
					<div className='flex items-center gap-2'>
						{activeTabConfig?.icon}
						<span>{activeTabConfig?.label}</span>
					</div>
					<ChevronDownIcon size={20} className={clsx('transition-transform', isMobileMenuOpen && 'rotate-180')} />
				</button>

				{/* Mobile Dropdown Menu */}
				{isMobileMenuOpen && (
					<div className='absolute z-50 w-full bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 shadow-lg'>
						<div className='max-h-80 overflow-y-auto'>
							{tabs.map((tab) => (
								<button
									key={tab.id}
									onClick={() => {
										onTabChange(tab.id);
										setIsMobileMenuOpen(false);
									}}
									className={clsx('w-full flex items-center gap-3 px-4 py-3 text-sm font-medium transition-all', 'hover:bg-gray-100 dark:hover:bg-gray-800', activeTab === tab.id ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20' : 'text-gray-700 dark:text-gray-300')}
								>
									{tab.icon}
									<span>{tab.mobileLabel !== undefined && tab.mobileLabel !== null && tab.mobileLabel !== '' ? tab.mobileLabel : tab.label}</span>
								</button>
							))}
						</div>
					</div>
				)}
			</div>
		</nav>
	);
}
