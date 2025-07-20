'use client';

import { clsx } from 'clsx';
import React, { useState } from 'react';
import { Button } from '../ui/Button';

export type TabGroup = 'main' | 'tools' | 'planning';
export type TabId = 'overview' | 'recipes' | 'scan' | 'tracker' | 'planner' | 'analysis' | 'cooking' | 'converter';

interface TabConfig {
	id: TabId;
	label: string;
	icon: React.ReactNode;
	description?: string;
	group: TabGroup;
	badge?: number | string;
}

interface TabNavigationProps {
	activeTab: TabId;
	onTabChange: (tab: TabId) => void;
	recipesCount?: number;
}

const tabGroups = {
	main: {
		label: 'Main',
		color: 'cooking-primary',
	},
	tools: {
		label: 'Tools',
		color: 'cooking-secondary',
	},
	planning: {
		label: 'Planning',
		color: 'cooking-accent',
	},
};

export function ImprovedTabNavigation({ activeTab, onTabChange, recipesCount = 0 }: TabNavigationProps) {
	const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
	
	const tabs: TabConfig[] = [
		{
			id: 'overview',
			label: 'Dashboard',
			icon: (
				<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
					<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
				</svg>
			),
			description: 'Overview & Stats',
			group: 'main',
		},
		{
			id: 'recipes',
			label: 'Recipes',
			icon: (
				<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
					<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
				</svg>
			),
			description: 'Browse & Create',
			group: 'main',
			badge: recipesCount,
		},
		{
			id: 'scan',
			label: 'Scan',
			icon: (
				<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
					<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
				</svg>
			),
			description: 'Barcode Scanner',
			group: 'main',
		},
		{
			id: 'tracker',
			label: 'Tracker',
			icon: (
				<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
					<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
				</svg>
			),
			description: 'Daily Tracking',
			group: 'main',
		},
		{
			id: 'planner',
			label: 'Meal Planner',
			icon: (
				<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
					<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
				</svg>
			),
			description: 'Plan Your Meals',
			group: 'planning',
		},
		{
			id: 'analysis',
			label: 'Analysis',
			icon: (
				<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
					<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
				</svg>
			),
			description: 'Nutrition Insights',
			group: 'planning',
		},
		{
			id: 'cooking',
			label: 'Cook Mode',
			icon: (
				<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
					<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
				</svg>
			),
			description: 'Step-by-Step',
			group: 'tools',
		},
		{
			id: 'converter',
			label: 'Converter',
			icon: (
				<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
					<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
				</svg>
			),
			description: 'Unit Converter',
			group: 'tools',
		},
	];

	const groupedTabs = tabs.reduce((acc, tab) => {
		if (!acc[tab.group]) {
			acc[tab.group] = [];
		}
		acc[tab.group].push(tab);
		return acc;
	}, {} as Record<TabGroup, TabConfig[]>);

	const activeTabConfig = tabs.find(tab => tab.id === activeTab);

	return (
		<>
			{/* Desktop Navigation */}
			<nav className="hidden lg:block mb-8">
				<div className="bg-white dark:bg-cooking-neutral-800 rounded-2xl shadow-lg p-2">
					<div className="flex gap-6">
						{Object.entries(groupedTabs).map(([groupKey, groupTabs]) => (
							<div key={groupKey} className="flex gap-1">
								{groupTabs.map((tab, index) => (
									<React.Fragment key={tab.id}>
										{index === 0 && (
											<div className="flex items-center px-3 text-xs font-medium text-cooking-neutral-500">
												{tabGroups[groupKey as TabGroup].label}
											</div>
										)}
										<button
											onClick={() => onTabChange(tab.id)}
											className={clsx(
												'relative flex items-center gap-2 px-4 py-3 rounded-xl transition-all duration-200',
												'hover:bg-cooking-neutral-100 dark:hover:bg-cooking-neutral-700',
												activeTab === tab.id
													? 'bg-cooking-primary text-white shadow-md transform scale-105'
													: 'text-cooking-neutral-700 dark:text-cooking-neutral-300'
											)}
										>
											{tab.icon}
											<span className="font-medium">{tab.label}</span>
											{tab.badge && (
												<span className={clsx(
													"ml-1 px-2 py-0.5 text-xs rounded-full",
													activeTab === tab.id
														? 'bg-white/20 text-white'
														: 'bg-cooking-primary/10 text-cooking-primary'
												)}>
													{tab.badge}
												</span>
											)}
										</button>
									</React.Fragment>
								))}
							</div>
						))}
					</div>
				</div>
			</nav>

			{/* Tablet Navigation */}
			<nav className="hidden md:block lg:hidden mb-6">
				<div className="bg-white dark:bg-cooking-neutral-800 rounded-xl shadow-md">
					<div className="grid grid-cols-4 gap-1 p-1">
						{tabs.slice(0, 8).map((tab) => (
							<button
								key={tab.id}
								onClick={() => onTabChange(tab.id)}
								className={clsx(
									'flex flex-col items-center gap-1 p-3 rounded-lg transition-all duration-200',
									activeTab === tab.id
										? 'bg-cooking-primary text-white shadow-md'
										: 'text-cooking-neutral-600 hover:bg-cooking-neutral-100'
								)}
							>
								{tab.icon}
								<span className="text-xs font-medium">{tab.label}</span>
							</button>
						))}
					</div>
				</div>
			</nav>

			{/* Mobile Navigation */}
			<nav className="md:hidden mb-4">
				<Button
					variant="outline"
					fullWidth
					onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
					className="justify-between"
				>
					<div className="flex items-center gap-2">
						{activeTabConfig?.icon}
						<span>{activeTabConfig?.label}</span>
					</div>
					<svg 
						className={clsx("w-5 h-5 transition-transform", mobileMenuOpen && "rotate-180")} 
						fill="none" 
						viewBox="0 0 24 24" 
						stroke="currentColor"
					>
						<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
					</svg>
				</Button>

				{mobileMenuOpen && (
					<div className="absolute left-0 right-0 z-50 mt-2 mx-4 bg-white dark:bg-cooking-neutral-800 rounded-xl shadow-xl overflow-hidden">
						{Object.entries(groupedTabs).map(([groupKey, groupTabs]) => (
							<div key={groupKey}>
								<div className="px-4 py-2 bg-cooking-neutral-50 dark:bg-cooking-neutral-700">
									<p className="text-xs font-medium text-cooking-neutral-600 dark:text-cooking-neutral-400">
										{tabGroups[groupKey as TabGroup].label}
									</p>
								</div>
								{groupTabs.map((tab) => (
									<button
										key={tab.id}
										onClick={() => {
											onTabChange(tab.id);
											setMobileMenuOpen(false);
										}}
										className={clsx(
											'w-full flex items-center gap-3 px-4 py-3 transition-all',
											'hover:bg-cooking-neutral-100 dark:hover:bg-cooking-neutral-700',
											activeTab === tab.id
												? 'bg-cooking-primary/10 text-cooking-primary border-l-4 border-cooking-primary'
												: 'text-cooking-neutral-700 dark:text-cooking-neutral-300'
										)}
									>
										{tab.icon}
										<div className="flex-1 text-left">
											<p className="font-medium">{tab.label}</p>
											{tab.description && (
												<p className="text-xs text-cooking-neutral-500">{tab.description}</p>
											)}
										</div>
										{tab.badge && (
											<span className="px-2 py-0.5 text-xs bg-cooking-primary/10 text-cooking-primary rounded-full">
												{tab.badge}
											</span>
										)}
									</button>
								))}
							</div>
						))}
					</div>
				)}
			</nav>

			{/* Mobile Bottom Navigation */}
			<div className="fixed bottom-0 left-0 right-0 md:hidden bg-white dark:bg-cooking-neutral-800 border-t border-cooking-neutral-200 dark:border-cooking-neutral-700 z-40">
				<div className="grid grid-cols-4 gap-1 p-2">
					{tabs.slice(0, 4).map((tab) => (
						<button
							key={tab.id}
							onClick={() => onTabChange(tab.id)}
							className={clsx(
								'flex flex-col items-center gap-1 py-2 rounded-lg transition-all',
								activeTab === tab.id
									? 'text-cooking-primary'
									: 'text-cooking-neutral-500'
							)}
						>
							{tab.icon}
							<span className="text-xs font-medium">{tab.label}</span>
						</button>
					))}
				</div>
			</div>
		</>
	);
}