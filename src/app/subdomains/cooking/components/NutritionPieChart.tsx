'use client';

import { Group } from '@visx/group';
import { scaleOrdinal } from '@visx/scale';
import { Pie } from '@visx/shape';
import { Text } from '@visx/text';
import { useTheme } from 'next-themes';

interface MacroData {
	label: string;
	value: number;
}

interface NutritionPieChartProps {
	protein: number;
	carbs: number;
	fat: number;
	width: number;
	height: number;
}

export function NutritionPieChart({ protein, carbs, fat, width, height }: NutritionPieChartProps) {
	const { theme } = useTheme();
	const isDarkMode = theme === 'dark';

	const data: MacroData[] = [
		{ label: 'Protein', value: protein },
		{ label: 'Carbs', value: carbs },
		{ label: 'Fat', value: fat },
	];

	const total = protein + carbs + fat;
	if (total === 0) {
		return <p>No nutrition data to display.</p>;
	}

	const getColor = scaleOrdinal({
		domain: data.map((d) => d.label),
		range: ['#3b82f6', '#10b981', '#f59e0b'], // Blue, Green, Amber
	});

	const half = width / 2;

	return (
		<svg width={width} height={height}>
			<Group top={height / 2} left={half}>
				<Pie data={data} pieValue={(d) => d.value} outerRadius={half} innerRadius={half - 20} padAngle={0.02}>
					{(pie) =>
						pie.arcs.map((arc, index) => {
							const [centroidX, centroidY] = pie.path.centroid(arc);
							const percent = (arc.data.value / total) * 100;
							return (
								<g key={`arc-${arc.data.label}-${index}`}>
									<path d={pie.path(arc) ?? ''} fill={getColor(arc.data.label)} />
									{percent > 5 && (
										<Text x={centroidX} y={centroidY} dy='.33em' fill={isDarkMode ? '#fff' : '#000'} fontSize={12} textAnchor='middle' pointerEvents='none'>
											{`${percent.toFixed(0)}%`}
										</Text>
									)}
								</g>
							);
						})
					}
				</Pie>
				<Text textAnchor='middle' fill={isDarkMode ? '#fff' : '#000'} fontSize={18} dy='-0.5em'>
					{`${total.toFixed(0)}g`}
					<tspan x={0} dy='1.2em' fontSize={12}>
						Total
					</tspan>
				</Text>
			</Group>
		</svg>
	);
}
