'use client';

import { useState } from 'react';

import { convertUnit } from '../utils/conversion';

import { Button } from '~/components/ui/Button';

type UnitCategory = 'temperature' | 'volume' | 'weight';

const unitCategories: Record<UnitCategory, string[]> = {
	volume: ['cup', 'tbsp', 'tsp', 'ml', 'l', 'fl oz', 'pt', 'qt', 'gal'],
	weight: ['g', 'kg', 'oz', 'lb', 'mg'],
	temperature: ['°C', '°F', 'K'],
};

export function GeneralUnitConverter() {
	const [amount, setAmount] = useState<string>('1');
	const [fromUnit, setFromUnit] = useState<string>('cup');
	const [toUnit, setToUnit] = useState<string>('ml');
	const [category, setCategory] = useState<UnitCategory>('volume');
	const [result, setResult] = useState<number | null>(null);

	const handleConvert = () => {
		const numAmount = parseFloat(amount);
		if (isNaN(numAmount)) {
			setResult(null);
			return;
		}

		// For temperature, use direct conversion
		if (category === 'temperature') {
			let celsius: number;

			// Convert to Celsius first
			if (fromUnit === '°C') {
				celsius = numAmount;
			} else if (fromUnit === '°F') {
				celsius = ((numAmount - 32) * 5) / 9;
			} else if (fromUnit === 'K') {
				celsius = numAmount - 273.15;
			} else {
				setResult(null);
				return;
			}

			// Convert from Celsius to target
			let convertedValue: number;
			if (toUnit === '°C') {
				convertedValue = celsius;
			} else if (toUnit === '°F') {
				convertedValue = (celsius * 9) / 5 + 32;
			} else if (toUnit === 'K') {
				convertedValue = celsius + 273.15;
			} else {
				setResult(null);
				return;
			}

			setResult(convertedValue);
		} else {
			// Use the existing conversion utility for volume and weight
			const converted = convertUnit(numAmount, fromUnit, toUnit);
			setResult(converted);
		}
	};

	const handleCategoryChange = (newCategory: UnitCategory) => {
		setCategory(newCategory);
		const units = unitCategories[newCategory];
		setFromUnit(units[0] ?? '');
		setToUnit(units[1] ?? units[0] ?? '');
		setResult(null);
	};

	return (
		<div className='space-y-6'>
			<div>
				<h2 className='text-2xl font-bold mb-4'>Unit Converter</h2>
				<p className='text-gray-600 dark:text-gray-400'>Convert between common cooking measurements</p>
			</div>

			{/* Category Selection */}
			<div className='flex gap-2 mb-4'>
				{Object.keys(unitCategories).map((cat) => (
					<Button
						key={cat}
						variant={category === cat ? 'default' : 'outline'}
						onClick={() => {
							handleCategoryChange(cat as UnitCategory);
						}}
						className='capitalize'
					>
						{cat}
					</Button>
				))}
			</div>

			<div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
				{/* Input Section */}
				<div className='space-y-4'>
					<div>
						<label className='block text-sm font-medium mb-1'>Amount</label>
						<input
							type='number'
							value={amount}
							onChange={(e) => {
								setAmount(e.target.value);
								setResult(null);
							}}
							className='w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg'
							placeholder='Enter amount'
							step='any'
						/>
					</div>

					<div>
						<label className='block text-sm font-medium mb-1'>From</label>
						<select
							value={fromUnit}
							onChange={(e) => {
								setFromUnit(e.target.value);
								setResult(null);
							}}
							className='w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg'
						>
							{unitCategories[category].map((unit) => (
								<option key={unit} value={unit}>
									{unit}
								</option>
							))}
						</select>
					</div>

					<div>
						<label className='block text-sm font-medium mb-1'>To</label>
						<select
							value={toUnit}
							onChange={(e) => {
								setToUnit(e.target.value);
								setResult(null);
							}}
							className='w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg'
						>
							{unitCategories[category].map((unit) => (
								<option key={unit} value={unit}>
									{unit}
								</option>
							))}
						</select>
					</div>

					<Button onClick={handleConvert} className='w-full' disabled={!amount || fromUnit === toUnit}>
						Convert
					</Button>
				</div>

				{/* Result Section */}
				<div className='flex items-center justify-center'>
					{result !== null ? (
						<div className='text-center p-6 bg-gray-50 dark:bg-gray-800 rounded-lg'>
							<p className='text-3xl font-bold text-blue-600 dark:text-blue-400'>
								{result.toFixed(category === 'temperature' ? 1 : 2)} {toUnit}
							</p>
							<p className='text-gray-600 dark:text-gray-400 mt-2'>
								{amount} {fromUnit} = {result.toFixed(category === 'temperature' ? 1 : 2)} {toUnit}
							</p>
						</div>
					) : (
						<div className='text-center p-6 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg'>
							<p className='text-gray-500'>Enter values and click Convert to see the result</p>
						</div>
					)}
				</div>
			</div>

			{/* Common Conversions Reference */}
			<div className='mt-8 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg'>
				<h3 className='font-semibold mb-3'>Common Conversions</h3>
				<div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm'>
					<div>
						<h4 className='font-medium mb-1'>Volume</h4>
						<ul className='space-y-1 text-gray-600 dark:text-gray-400'>
							<li>1 cup = 237 ml</li>
							<li>1 tbsp = 15 ml</li>
							<li>1 tsp = 5 ml</li>
							<li>1 fl oz = 30 ml</li>
						</ul>
					</div>
					<div>
						<h4 className='font-medium mb-1'>Weight</h4>
						<ul className='space-y-1 text-gray-600 dark:text-gray-400'>
							<li>1 oz = 28.35 g</li>
							<li>1 lb = 453.59 g</li>
							<li>1 kg = 2.205 lb</li>
						</ul>
					</div>
					<div>
						<h4 className='font-medium mb-1'>Temperature</h4>
						<ul className='space-y-1 text-gray-600 dark:text-gray-400'>
							<li>0°C = 32°F</li>
							<li>100°C = 212°F</li>
							<li>350°F = 177°C</li>
						</ul>
					</div>
				</div>
			</div>
		</div>
	);
}
