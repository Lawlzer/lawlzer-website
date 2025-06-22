'use client';

import { useEffect, useState } from 'react';

import { getGuestData, saveGuestData } from '../services/guestStorage';
import type { GuestGoal } from '../services/guestStorage';

interface NutritionGoal extends GuestGoal {
	id?: string;
	calories: number;
	protein: number | null;
	carbs: number | null;
	fat: number | null;
	fiber: number | null;
	sugar: number | null;
	sodium: number | null;
	proteinPercentage: number | null;
	carbsPercentage: number | null;
	fatPercentage: number | null;
	isDefault?: boolean;
}

interface GoalsManagerProps {
	isGuest: boolean;
}

export function GoalsManager({ isGuest }: GoalsManagerProps) {
	const [goal, setGoal] = useState<NutritionGoal | null>(null);
	const [isLoading, setIsLoading] = useState(true);
	const [isEditing, setIsEditing] = useState(false);
	const [isSaving, setIsSaving] = useState(false);
	const [usePercentages, setUsePercentages] = useState(false);

	// Form state
	const [calories, setCalories] = useState('2000');
	const [protein, setProtein] = useState('50');
	const [carbs, setCarbs] = useState('250');
	const [fat, setFat] = useState('65');
	const [fiber, setFiber] = useState('25');
	const [sugar, setSugar] = useState('50');
	const [sodium, setSodium] = useState('2300');
	const [proteinPercentage, setProteinPercentage] = useState('20');
	const [carbsPercentage, setCarbsPercentage] = useState('50');
	const [fatPercentage, setFatPercentage] = useState('30');

	// Define populateForm before useEffect
	const populateForm = (goalData: NutritionGoal) => {
		setCalories(goalData.calories.toString());
		setProtein(goalData.protein !== null ? goalData.protein.toString() : '');
		setCarbs(goalData.carbs !== null ? goalData.carbs.toString() : '');
		setFat(goalData.fat !== null ? goalData.fat.toString() : '');
		setFiber(goalData.fiber !== null ? goalData.fiber.toString() : '');
		setSugar(goalData.sugar !== null ? goalData.sugar.toString() : '');
		setSodium(goalData.sodium !== null ? goalData.sodium.toString() : '');
		setProteinPercentage(goalData.proteinPercentage !== null ? goalData.proteinPercentage.toString() : '20');
		setCarbsPercentage(goalData.carbsPercentage !== null ? goalData.carbsPercentage.toString() : '50');
		setFatPercentage(goalData.fatPercentage !== null ? goalData.fatPercentage.toString() : '30');

		// Check if using percentages
		if (goalData.proteinPercentage !== null || goalData.carbsPercentage !== null || goalData.fatPercentage !== null) {
			setUsePercentages(true);
		}
	};

	// Load goals on mount
	useEffect(() => {
		const loadGoals = async () => {
			if (isGuest) {
				const guestData = getGuestData();
				if (guestData.goals) {
					const guestGoal: NutritionGoal = { ...guestData.goals, isDefault: false };
					setGoal(guestGoal);
					populateForm(guestGoal);
				} else {
					// Set default goals
					const defaultGoals: NutritionGoal = {
						calories: 2000,
						protein: 50,
						carbs: 250,
						fat: 65,
						fiber: 25,
						sugar: 50,
						sodium: 2300,
						proteinPercentage: 20,
						carbsPercentage: 50,
						fatPercentage: 30,
						isDefault: true,
					};
					setGoal(defaultGoals);
					populateForm(defaultGoals);
				}
				setIsLoading(false);
			} else {
				// Fetch from API
				try {
					const response = await fetch('/api/cooking/goals');
					if (response.ok) {
						const data = await response.json();
						setGoal(data);
						populateForm(data);
					}
				} catch (error) {
					console.error('Error loading goals:', error);
				} finally {
					setIsLoading(false);
				}
			}
		};

		void loadGoals();
	}, [isGuest]);

	const calculateMacrosFromPercentages = () => {
		const cal = calories !== '' ? parseFloat(calories) : 2000;
		const proteinPct = proteinPercentage !== '' && parseFloat(proteinPercentage) !== 0 ? parseFloat(proteinPercentage) : 0;
		const carbsPct = carbsPercentage !== '' && parseFloat(carbsPercentage) !== 0 ? parseFloat(carbsPercentage) : 0;
		const fatPct = fatPercentage !== '' && parseFloat(fatPercentage) !== 0 ? parseFloat(fatPercentage) : 0;

		// Calculate grams from percentages
		// Protein: 4 cal/g, Carbs: 4 cal/g, Fat: 9 cal/g
		const proteinGrams = (cal * (proteinPct / 100)) / 4;
		const carbsGrams = (cal * (carbsPct / 100)) / 4;
		const fatGrams = (cal * (fatPct / 100)) / 9;

		setProtein(proteinGrams.toFixed(0));
		setCarbs(carbsGrams.toFixed(0));
		setFat(fatGrams.toFixed(0));
	};

	const calculatePercentagesFromMacros = () => {
		const cal = calories !== '' ? parseFloat(calories) : 2000;
		const proteinG = protein !== '' ? parseFloat(protein) : 0;
		const carbsG = carbs !== '' ? parseFloat(carbs) : 0;
		const fatG = fat !== '' ? parseFloat(fat) : 0;

		// Calculate percentages from grams
		const proteinCal = proteinG * 4;
		const carbsCal = carbsG * 4;
		const fatCal = fatG * 9;

		const proteinPct = (proteinCal / cal) * 100;
		const carbsPct = (carbsCal / cal) * 100;
		const fatPct = (fatCal / cal) * 100;

		setProteinPercentage(proteinPct.toFixed(0));
		setCarbsPercentage(carbsPct.toFixed(0));
		setFatPercentage(fatPct.toFixed(0));
	};

	const handleSave = async () => {
		setIsSaving(true);

		const goalData: GuestGoal = {
			calories: calories !== '' ? parseFloat(calories) : 2000,
			protein: protein !== '' ? parseFloat(protein) : null,
			carbs: carbs !== '' ? parseFloat(carbs) : null,
			fat: fat !== '' ? parseFloat(fat) : null,
			fiber: fiber !== '' ? parseFloat(fiber) : null,
			sugar: sugar !== '' ? parseFloat(sugar) : null,
			sodium: sodium !== '' ? parseFloat(sodium) : null,
			proteinPercentage: usePercentages && proteinPercentage !== '' ? parseFloat(proteinPercentage) : null,
			carbsPercentage: usePercentages && carbsPercentage !== '' ? parseFloat(carbsPercentage) : null,
			fatPercentage: usePercentages && fatPercentage !== '' ? parseFloat(fatPercentage) : null,
		};

		if (isGuest) {
			const guestData = getGuestData();
			guestData.goals = goalData;
			saveGuestData(guestData);
			setGoal({ ...goalData, isDefault: false });
			setIsEditing(false);
		} else {
			// Save to API
			try {
				const method = goal?.id != null && goal.isDefault !== true ? 'PUT' : 'POST';
				const response = await fetch('/api/cooking/goals', {
					method,
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify(goalData),
				});

				if (response.ok) {
					const data = await response.json();
					setGoal(data);
					setIsEditing(false);
				}
			} catch (error) {
				console.error('Error saving goals:', error);
			}
		}

		setIsSaving(false);
	};

	if (isLoading) {
		return (
			<div className='flex justify-center py-8'>
				<div className='animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500'></div>
			</div>
		);
	}

	return (
		<div className='space-y-6'>
			<div className='flex items-center justify-between'>
				<h2 className='text-2xl font-bold'>Nutrition Goals</h2>
				{!isEditing && (
					<button
						onClick={() => {
							setIsEditing(true);
						}}
						className='px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors'
					>
						{goal?.isDefault === true ? 'Set Goals' : 'Edit Goals'}
					</button>
				)}
			</div>

			{!isEditing ? (
				<div className='space-y-4'>
					{/* Current Goals Display */}
					<div className='grid grid-cols-2 md:grid-cols-4 gap-4'>
						<div className='rounded-lg border p-4'>
							<h3 className='text-sm font-medium text-gray-600 dark:text-gray-400'>Daily Calories</h3>
							<p className='text-2xl font-bold'>{goal?.calories ?? 2000}</p>
						</div>
						{goal?.protein != null ? (
							<div className='rounded-lg border p-4'>
								<h3 className='text-sm font-medium text-gray-600 dark:text-gray-400'>Protein</h3>
								<p className='text-2xl font-bold'>{goal.protein}g</p>
								{goal.proteinPercentage != null && <p className='text-sm text-gray-500'>{goal.proteinPercentage}% of calories</p>}
							</div>
						) : null}
						{goal?.carbs != null ? (
							<div className='rounded-lg border p-4'>
								<h3 className='text-sm font-medium text-gray-600 dark:text-gray-400'>Carbs</h3>
								<p className='text-2xl font-bold'>{goal.carbs}g</p>
								{goal.carbsPercentage != null && <p className='text-sm text-gray-500'>{goal.carbsPercentage}% of calories</p>}
							</div>
						) : null}
						{goal?.fat != null ? (
							<div className='rounded-lg border p-4'>
								<h3 className='text-sm font-medium text-gray-600 dark:text-gray-400'>Fat</h3>
								<p className='text-2xl font-bold'>{goal.fat}g</p>
								{goal.fatPercentage != null && <p className='text-sm text-gray-500'>{goal.fatPercentage}% of calories</p>}
							</div>
						) : null}
						{goal?.fiber != null ? (
							<div className='rounded-lg border p-4'>
								<h3 className='text-sm font-medium text-gray-600 dark:text-gray-400'>Fiber</h3>
								<p className='text-2xl font-bold'>{goal.fiber}g</p>
							</div>
						) : null}
						{goal?.sugar != null ? (
							<div className='rounded-lg border p-4'>
								<h3 className='text-sm font-medium text-gray-600 dark:text-gray-400'>Sugar</h3>
								<p className='text-2xl font-bold'>{goal.sugar}g</p>
							</div>
						) : null}
						{goal?.sodium != null ? (
							<div className='rounded-lg border p-4'>
								<h3 className='text-sm font-medium text-gray-600 dark:text-gray-400'>Sodium</h3>
								<p className='text-2xl font-bold'>{goal.sodium}mg</p>
							</div>
						) : null}
					</div>

					{goal?.isDefault && (
						<div className='rounded-lg border border-blue-500 bg-blue-50 dark:bg-blue-950/20 p-4'>
							<p className='text-sm text-blue-700 dark:text-blue-300'>These are default goals. Click &quot;Set Goals&quot; to customize them for your needs.</p>
						</div>
					)}
				</div>
			) : (
				<div className='space-y-6'>
					{/* Goal Setting Form */}
					<div className='rounded-lg border p-6'>
						<h3 className='text-lg font-semibold mb-4'>Set Your Daily Goals</h3>

						{/* Calories */}
						<div className='mb-6'>
							<label className='block text-sm font-medium mb-1'>Daily Calorie Target *</label>
							<input
								type='number'
								value={calories}
								onChange={(e) => {
									setCalories(e.target.value);
								}}
								className='w-full px-3 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700'
								placeholder='2000'
								min='500'
								max='10000'
							/>
						</div>

						{/* Macro Toggle */}
						<div className='mb-4'>
							<label className='flex items-center gap-2'>
								<input
									type='checkbox'
									checked={usePercentages}
									onChange={(e) => {
										setUsePercentages(e.target.checked);
										if (e.target.checked) {
											calculatePercentagesFromMacros();
										} else {
											calculateMacrosFromPercentages();
										}
									}}
									className='rounded'
								/>
								<span className='text-sm font-medium'>Use percentage-based macro goals</span>
							</label>
						</div>

						{/* Macronutrients */}
						<div className='grid grid-cols-1 md:grid-cols-3 gap-4 mb-6'>
							{usePercentages ? (
								<>
									<div>
										<label className='block text-sm font-medium mb-1'>Protein %</label>
										<input
											type='number'
											value={proteinPercentage}
											onChange={(e) => {
												setProteinPercentage(e.target.value);
												// Auto-calculate grams
												const cal = calories !== '' ? parseFloat(calories) : 0;
												const pct = e.target.value !== '' ? parseFloat(e.target.value) : 0;
												setProtein(cal > 0 && pct > 0 ? ((cal * (pct / 100)) / 4).toFixed(0) : '');
											}}
											className='w-full px-3 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700'
											placeholder='20'
											min='0'
											max='100'
										/>
									</div>
									<div>
										<label className='block text-sm font-medium mb-1'>Carbs %</label>
										<input
											type='number'
											value={carbsPercentage}
											onChange={(e) => {
												setCarbsPercentage(e.target.value);
												const cal = calories !== '' ? parseFloat(calories) : 0;
												const pct = e.target.value !== '' ? parseFloat(e.target.value) : 0;
												setCarbs(cal > 0 && pct > 0 ? ((cal * (pct / 100)) / 4).toFixed(0) : '');
											}}
											className='w-full px-3 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700'
											placeholder='50'
											min='0'
											max='100'
										/>
									</div>
									<div>
										<label className='block text-sm font-medium mb-1'>Fat %</label>
										<input
											type='number'
											value={fatPercentage}
											onChange={(e) => {
												setFatPercentage(e.target.value);
												const cal = calories !== '' ? parseFloat(calories) : 0;
												const pct = e.target.value !== '' ? parseFloat(e.target.value) : 0;
												setFat(cal > 0 && pct > 0 ? ((cal * (pct / 100)) / 9).toFixed(0) : '');
											}}
											className='w-full px-3 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700'
											placeholder='30'
											min='0'
											max='100'
										/>
									</div>
								</>
							) : (
								<>
									<div>
										<label className='block text-sm font-medium mb-1'>Protein (g)</label>
										<input
											type='number'
											value={protein}
											onChange={(e) => {
												setProtein(e.target.value);
											}}
											className='w-full px-3 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700'
											placeholder='50'
											min='0'
										/>
									</div>
									<div>
										<label className='block text-sm font-medium mb-1'>Carbs (g)</label>
										<input
											type='number'
											value={carbs}
											onChange={(e) => {
												setCarbs(e.target.value);
											}}
											className='w-full px-3 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700'
											placeholder='250'
											min='0'
										/>
									</div>
									<div>
										<label className='block text-sm font-medium mb-1'>Fat (g)</label>
										<input
											type='number'
											value={fat}
											onChange={(e) => {
												setFat(e.target.value);
											}}
											className='w-full px-3 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700'
											placeholder='65'
											min='0'
										/>
									</div>
								</>
							)}
						</div>

						{/* Calculated values display */}
						{usePercentages && (
							<div className='mb-6 p-3 bg-gray-100 dark:bg-gray-800 rounded-lg'>
								<p className='text-sm text-gray-600 dark:text-gray-400'>
									Based on your percentages: {protein}g protein, {carbs}g carbs, {fat}g fat
								</p>
							</div>
						)}

						{/* Other Nutrients */}
						<h4 className='font-medium mb-3'>Other Nutrients (Optional)</h4>
						<div className='grid grid-cols-1 md:grid-cols-3 gap-4 mb-6'>
							<div>
								<label className='block text-sm font-medium mb-1'>Fiber (g)</label>
								<input
									type='number'
									value={fiber}
									onChange={(e) => {
										setFiber(e.target.value);
									}}
									className='w-full px-3 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700'
									placeholder='25'
									min='0'
								/>
							</div>
							<div>
								<label className='block text-sm font-medium mb-1'>Sugar (g)</label>
								<input
									type='number'
									value={sugar}
									onChange={(e) => {
										setSugar(e.target.value);
									}}
									className='w-full px-3 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700'
									placeholder='50'
									min='0'
								/>
							</div>
							<div>
								<label className='block text-sm font-medium mb-1'>Sodium (mg)</label>
								<input
									type='number'
									value={sodium}
									onChange={(e) => {
										setSodium(e.target.value);
									}}
									className='w-full px-3 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700'
									placeholder='2300'
									min='0'
								/>
							</div>
						</div>

						{/* Actions */}
						<div className='flex gap-2'>
							<button onClick={() => void handleSave()} className='px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50' disabled={isSaving || calories === ''}>
								{isSaving ? 'Saving...' : 'Save Goals'}
							</button>
							<button
								onClick={() => {
									setIsEditing(false);
									// Reset form to current values
									if (goal !== null) {
										populateForm(goal);
									}
								}}
								className='px-4 py-2 border rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors'
							>
								Cancel
							</button>
						</div>
					</div>

					{/* Info box */}
					<div className='rounded-lg border border-blue-500 bg-blue-50 dark:bg-blue-950/20 p-4'>
						<h4 className='font-semibold mb-2'>Setting Your Goals</h4>
						<ul className='text-sm text-gray-600 dark:text-gray-400 space-y-1'>
							<li>• Start with your calorie goal based on your activity level and objectives</li>
							<li>• Protein: 0.8-1g per pound of body weight for muscle maintenance</li>
							<li>• Fiber: 25g for women, 38g for men (general recommendation)</li>
							<li>• Sodium: 2,300mg or less per day</li>
						</ul>
					</div>
				</div>
			)}

			{isGuest && (
				<div className='rounded-lg border border-yellow-500 bg-yellow-50 dark:bg-yellow-950/20 p-4'>
					<p className='text-sm text-yellow-700 dark:text-yellow-300'>Your goals are saved locally. Sign in to sync them across devices.</p>
				</div>
			)}
		</div>
	);
}
