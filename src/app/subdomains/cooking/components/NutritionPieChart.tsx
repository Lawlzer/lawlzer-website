'use client';

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';

interface NutritionData {
	[key: string]: number;
	calories: number;
	protein: number;
	carbs: number;
	fat: number;
}

interface NutritionPieChartProps {
	nutrition: NutritionData;
	width?: number;
	height?: number;
}

const COLORS = ['#8884d8', '#82ca9d', '#ffc658'];
const MACROS = ['protein', 'carbs', 'fat'];

export function NutritionPieChart({ nutrition, width = 150, height = 150 }: NutritionPieChartProps) {
	const totalCalories = nutrition.protein * 4 + nutrition.carbs * 4 + nutrition.fat * 9;

	const data = MACROS.map((macro) => {
		const grams = nutrition[macro];
		const calories = grams * (macro === 'fat' ? 9 : 4);
		return {
			name: macro.charAt(0).toUpperCase() + macro.slice(1),
			value: calories,
			percentage: totalCalories > 0 ? (calories / totalCalories) * 100 : 0,
			grams,
		};
	});

	return (
		<ResponsiveContainer width={width} height={height}>
			<PieChart>
				<Pie data={data} cx='50%' cy='50%' labelLine={false} outerRadius={width / 2 - 10} fill='#8884d8' dataKey='value'>
					{data.map((entry, index) => (
						<Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
					))}
				</Pie>
				<Tooltip
					formatter={(value: number, name, props) => {
						const { percentage, grams } = props.payload;
						return [`${grams.toFixed(1)}g (${percentage.toFixed(0)}%)`, name];
					}}
				/>
			</PieChart>
		</ResponsiveContainer>
	);
}
