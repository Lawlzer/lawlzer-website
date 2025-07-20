'use client';

import React from 'react';
import { Card, CardContent, CardHeader, StatCard, CardBadge } from './ui/Card';
import { Button } from './ui/Button';

interface DashboardOverviewProps {
	dailyCalories: { current: number; goal: number };
	dailyProtein: { current: number; goal: number };
	recipeCount: number;
	loggedDays: number;
	recentRecipes?: Array<{ id: string; name: string; imageUrl?: string }>;
	onNavigate?: (tab: string) => void;
	weeklyStats?: {
		averageCalories: number;
		favoriteRecipe?: { name: string; count: number };
		streak: number;
	};
}

export function DashboardOverview({
	dailyCalories,
	dailyProtein,
	recipeCount,
	loggedDays,
	recentRecipes = [],
	onNavigate,
	weeklyStats = {
		averageCalories: 2150,
		favoriteRecipe: { name: 'Chicken Salad', count: 5 },
		streak: 7
	}
}: DashboardOverviewProps) {
	const caloriePercentage = Math.min((dailyCalories.current / dailyCalories.goal) * 100, 100);
	const proteinPercentage = Math.min((dailyProtein.current / dailyProtein.goal) * 100, 100);

	return (
		<div className="space-y-6 animate-fade-in">
			{/* Welcome Section */}
			<div className="bg-gradient-to-r from-cooking-primary to-cooking-accent rounded-2xl p-8 text-white">
				<h2 className="text-3xl font-bold mb-2">Welcome back!</h2>
				<p className="text-lg opacity-90">Track your nutrition and discover new recipes</p>
			</div>

			{/* Quick Actions */}
			<div className="grid grid-cols-2 md:grid-cols-4 gap-4">
				<Button
					variant="primary"
					fullWidth
					leftIcon={
						<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
						</svg>
					}
					className="h-full"
					onClick={() => onNavigate?.('tracker')}
				>
					Log Food
				</Button>
				<Button
					variant="secondary"
					fullWidth
					leftIcon={
						<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
						</svg>
					}
					className="h-full"
					onClick={() => onNavigate?.('scan')}
				>
					Scan Food
				</Button>
				<Button
					variant="outline"
					fullWidth
					leftIcon={
						<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
						</svg>
					}
					className="h-full"
					onClick={() => onNavigate?.('recipes')}
				>
					New Recipe
				</Button>
				<Button
					variant="outline"
					fullWidth
					leftIcon={
						<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
						</svg>
					}
					className="h-full"
					onClick={() => onNavigate?.('planner')}
				>
					Meal Plan
				</Button>
			</div>

			{/* Today's Progress */}
			<Card variant="elevated">
				<CardHeader
					icon={
						<svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
						</svg>
					}
				>
					Today's Progress
				</CardHeader>
				<CardContent>
					<div className="space-y-6">
						{/* Calories */}
						<div>
							<div className="flex justify-between items-center mb-2">
								<span className="text-sm font-medium text-cooking-neutral-700">Calories</span>
								<span className="text-sm text-cooking-neutral-500">
									{dailyCalories.current} / {dailyCalories.goal} kcal
								</span>
							</div>
							<div className="relative h-4 bg-cooking-neutral-200 rounded-full overflow-hidden">
								<div 
									className="absolute inset-y-0 left-0 bg-gradient-to-r from-cooking-calories to-amber-500 rounded-full transition-all duration-500 ease-out"
									style={{ width: `${caloriePercentage}%` }}
								/>
							</div>
						</div>

						{/* Protein */}
						<div>
							<div className="flex justify-between items-center mb-2">
								<span className="text-sm font-medium text-cooking-neutral-700">Protein</span>
								<span className="text-sm text-cooking-neutral-500">
									{dailyProtein.current} / {dailyProtein.goal} g
								</span>
							</div>
							<div className="relative h-4 bg-cooking-neutral-200 rounded-full overflow-hidden">
								<div 
									className="absolute inset-y-0 left-0 bg-gradient-to-r from-cooking-protein to-purple-500 rounded-full transition-all duration-500 ease-out"
									style={{ width: `${proteinPercentage}%` }}
								/>
							</div>
						</div>

						<div className="grid grid-cols-2 gap-4 pt-4">
							<div className="text-center p-4 bg-cooking-neutral-50 rounded-xl">
								<p className="text-2xl font-bold text-cooking-primary">{recipeCount}</p>
								<p className="text-sm text-cooking-neutral-600">Recipes</p>
							</div>
							<div className="text-center p-4 bg-cooking-neutral-50 rounded-xl">
								<p className="text-2xl font-bold text-cooking-secondary">{loggedDays}</p>
								<p className="text-sm text-cooking-neutral-600">Days Tracked</p>
							</div>
						</div>
					</div>
				</CardContent>
			</Card>

			{/* Stats Grid */}
			<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
				<StatCard
					title="Weekly Average"
					value={weeklyStats.averageCalories.toLocaleString()}
					subtitle="calories per day"
					icon={
						<svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
						</svg>
					}
					trend={{ value: 12, isPositive: true }}
				/>
				<StatCard
					title="Favorite Recipe"
					value={weeklyStats.favoriteRecipe?.name || 'None yet'}
					subtitle={weeklyStats.favoriteRecipe ? `${weeklyStats.favoriteRecipe.count} times this month` : 'Start cooking!'}
					icon={
						<svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
						</svg>
					}
				/>
				<StatCard
					title="Streak"
					value={`${weeklyStats.streak} day${weeklyStats.streak !== 1 ? 's' : ''}`}
					subtitle="Keep it up!"
					icon={
						<svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />
						</svg>
					}
					trend={{ value: 100, isPositive: true }}
				/>
			</div>

			{/* Recent Recipes */}
			{recentRecipes.length > 0 && (
				<Card variant="elevated">
					<CardHeader
						icon={
							<svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
							</svg>
						}
						action={
							<Button variant="ghost" size="sm" onClick={() => onNavigate?.('recipes')}>
								View All
							</Button>
						}
					>
						Recent Recipes
					</CardHeader>
					<CardContent>
						<div className="grid grid-cols-2 md:grid-cols-4 gap-4">
							{recentRecipes.slice(0, 4).map((recipe) => (
								<div
									key={recipe.id}
									className="group cursor-pointer"
									onClick={() => onNavigate?.('recipes')}
								>
									<div className="relative aspect-square rounded-lg overflow-hidden bg-cooking-neutral-100 mb-2">
										{recipe.imageUrl ? (
											<img 
												src={recipe.imageUrl} 
												alt={recipe.name}
												className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
											/>
										) : (
											<div className="flex items-center justify-center h-full">
												<svg className="w-12 h-12 text-cooking-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
													<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
												</svg>
											</div>
										)}
									</div>
									<p className="text-sm font-medium text-cooking-neutral-700 group-hover:text-cooking-primary transition-colors">
										{recipe.name}
									</p>
								</div>
							))}
						</div>
					</CardContent>
				</Card>
			)}
		</div>
	);
}