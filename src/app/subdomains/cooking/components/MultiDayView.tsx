'use client';

import { useState } from 'react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

interface DayData {
	date: string;
	entries: {
		calories: number;
		protein: number;
		carbs: number;
		fat: number;
	}[];
}

interface AggregatedData {
	totalDays: number;
	totalCalories: number;
	totalProtein: number;
	totalCarbs: number;
	totalFat: number;
	avgCalories: number;
	avgProtein: number;
	avgCarbs: number;
	avgFat: number;
	chartData: {
		date: string;
		calories: number;
	}[];
}

export function MultiDayView() {
	const [startDate, setStartDate] = useState('');
	const [endDate, setEndDate] = useState('');
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [data, setData] = useState<AggregatedData | null>(null);

	const handleFetch = async () => {
		if (!startDate || !endDate) {
			setError('Please select both a start and end date.');
			return;
		}
		if (new Date(startDate) > new Date(endDate)) {
			setError('Start date cannot be after end date.');
			return;
		}

		setIsLoading(true);
		setError(null);
		setData(null);

		try {
			const response = await fetch(`/api/cooking/days?startDate=${startDate}&endDate=${endDate}`);
			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(errorData.error || 'Failed to fetch data');
			}
			const { days } = (await response.json()) as { days: DayData[] };

			if (days.length === 0) {
				setError('No data found for the selected period.');
				setIsLoading(false);
				return;
			}

			// Process the data
			const aggregated = days.reduce(
				(acc, day) => {
					const dayTotal = day.entries.reduce(
						(dayAcc, entry) => {
							dayAcc.calories += entry.calories;
							dayAcc.protein += entry.protein;
							dayAcc.carbs += entry.carbs;
							dayAcc.fat += entry.fat;
							return dayAcc;
						},
						{ calories: 0, protein: 0, carbs: 0, fat: 0 }
					);

					acc.totalCalories += dayTotal.calories;
					acc.totalProtein += dayTotal.protein;
					acc.totalCarbs += dayTotal.carbs;
					acc.totalFat += dayTotal.fat;
					acc.chartData.push({
						date: new Date(day.date).toLocaleDateString('en-US', {
							month: 'short',
							day: 'numeric',
						}),
						calories: dayTotal.calories,
					});

					return acc;
				},
				{
					totalCalories: 0,
					totalProtein: 0,
					totalCarbs: 0,
					totalFat: 0,
					chartData: [] as { date: string; calories: number }[],
				}
			);

			const totalDays = days.length;
			setData({
				totalDays,
				...aggregated,
				avgCalories: aggregated.totalCalories / totalDays,
				avgProtein: aggregated.totalProtein / totalDays,
				avgCarbs: aggregated.totalCarbs / totalDays,
				avgFat: aggregated.totalFat / totalDays,
			});
		} catch (err) {
			setError(err instanceof Error ? err.message : 'An unknown error occurred.');
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<div className='space-y-6'>
			<h2 className='text-2xl font-bold'>Multi-Day Analysis</h2>

			<div className='p-4 border rounded-lg space-y-4'>
				<div className='grid grid-cols-1 md:grid-cols-3 gap-4 items-end'>
					<div>
						<label className='block text-sm font-medium mb-1'>Start Date</label>
						<input
							type='date'
							value={startDate}
							onChange={(e) => {
								setStartDate(e.target.value);
							}}
							className='w-full px-4 py-2 border rounded-lg'
						/>
					</div>
					<div>
						<label className='block text-sm font-medium mb-1'>End Date</label>
						<input
							type='date'
							value={endDate}
							onChange={(e) => {
								setEndDate(e.target.value);
							}}
							className='w-full px-4 py-2 border rounded-lg'
						/>
					</div>
					<button onClick={() => void handleFetch()} className='px-6 py-2 bg-blue-500 text-white rounded-lg h-10' disabled={isLoading}>
						{isLoading ? 'Fetching...' : 'Analyze Period'}
					</button>
				</div>
				{error !== null && <p className='text-red-500 text-sm'>{error}</p>}
			</div>

			{data && (
				<div className='space-y-6'>
					<div className='grid grid-cols-2 md:grid-cols-4 gap-4'>
						<div className='rounded-lg border p-4'>
							<h3 className='text-sm font-medium text-gray-600 dark:text-gray-400'>Avg. Daily Calories</h3>
							<p className='text-2xl font-bold'>{data.avgCalories.toFixed(0)}</p>
						</div>
						<div className='rounded-lg border p-4'>
							<h3 className='text-sm font-medium text-gray-600 dark:text-gray-400'>Avg. Daily Protein</h3>
							<p className='text-2xl font-bold'>{data.avgProtein.toFixed(1)}g</p>
						</div>
						<div className='rounded-lg border p-4'>
							<h3 className='text-sm font-medium text-gray-600 dark:text-gray-400'>Avg. Daily Carbs</h3>
							<p className='text-2xl font-bold'>{data.avgCarbs.toFixed(1)}g</p>
						</div>
						<div className='rounded-lg border p-4'>
							<h3 className='text-sm font-medium text-gray-600 dark:text-gray-400'>Avg. Daily Fat</h3>
							<p className='text-2xl font-bold'>{data.avgFat.toFixed(1)}g</p>
						</div>
					</div>

					<div className='rounded-lg border p-4 h-80'>
						<h3 className='font-semibold mb-4'>Daily Calorie Intake</h3>
						<ResponsiveContainer width='100%' height='100%'>
							<BarChart data={data.chartData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
								<CartesianGrid strokeDasharray='3 3' />
								<XAxis dataKey='date' />
								<YAxis />
								<Tooltip />
								<Bar dataKey='calories' fill='#3b82f6' />
							</BarChart>
						</ResponsiveContainer>
					</div>
				</div>
			)}
		</div>
	);
}
