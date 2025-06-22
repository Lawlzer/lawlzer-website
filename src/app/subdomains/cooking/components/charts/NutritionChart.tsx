'use client';

import { useMemo } from 'react';
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';

import { animations } from '../../utils/animations';

interface NutritionChartProps {
  calories?: number;
  protein?: number;
  carbs?: number;
  fat?: number;
  showLabels?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const COLORS = {
  protein: '#8b5cf6', // Purple
  carbs: '#3b82f6', // Blue
  fat: '#f59e0b', // Amber
};

const sizeConfig = {
  sm: { width: 200, height: 200, innerRadius: 40, outerRadius: 70 },
  md: { width: 300, height: 300, innerRadius: 60, outerRadius: 100 },
  lg: { width: 400, height: 400, innerRadius: 80, outerRadius: 140 },
};

export const NutritionChart: React.FC<NutritionChartProps> = ({
  calories = 0,
  protein = 0,
  carbs = 0,
  fat = 0,
  showLabels = true,
  size = 'md',
}) => {
  const data = useMemo(() => {
    const proteinCal = protein * 4;
    const carbsCal = carbs * 4;
    const fatCal = fat * 9;
    const totalCal = proteinCal + carbsCal + fatCal;

    if (totalCal === 0) {
      return [];
    }

    return [
      {
        name: 'Protein',
        value: proteinCal,
        percentage: Math.round((proteinCal / totalCal) * 100),
        grams: protein,
      },
      {
        name: 'Carbs',
        value: carbsCal,
        percentage: Math.round((carbsCal / totalCal) * 100),
        grams: carbs,
      },
      {
        name: 'Fat',
        value: fatCal,
        percentage: Math.round((fatCal / totalCal) * 100),
        grams: fat,
      },
    ];
  }, [protein, carbs, fat]);

  const config = sizeConfig[size];

  if (data.length === 0) {
    return (
      <div
        className={`flex items-center justify-center ${animations.fadeIn}`}
        style={{ width: config.width, height: config.height }}
      >
        <p className="text-sm text-muted-foreground">No nutrition data</p>
      </div>
    );
  }

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      return (
        <div className="rounded-lg border bg-background p-3 shadow-lg">
          <p className="font-medium">{data.name}</p>
          <p className="text-sm text-muted-foreground">
            {data.payload.grams}g ({data.payload.percentage}%)
          </p>
          <p className="text-sm text-muted-foreground">{data.value} calories</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className={`${animations.fadeIn}`}>
      <ResponsiveContainer width={config.width} height={config.height}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={config.innerRadius}
            outerRadius={config.outerRadius}
            paddingAngle={2}
            dataKey="value"
            animationBegin={0}
            animationDuration={800}
          >
            {data.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={COLORS[entry.name.toLowerCase() as keyof typeof COLORS]}
              />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
        </PieChart>
      </ResponsiveContainer>

      {showLabels && (
        <div className="mt-4 space-y-2">
          {data.map((item) => (
            <div key={item.name} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div
                  className="h-3 w-3 rounded-full"
                  style={{
                    backgroundColor:
                      COLORS[item.name.toLowerCase() as keyof typeof COLORS],
                  }}
                />
                <span className="text-sm">{item.name}</span>
              </div>
              <span className="text-sm font-medium">
                {item.grams}g ({item.percentage}%)
              </span>
            </div>
          ))}
          <div className="border-t pt-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Total Calories</span>
              <span className="text-sm font-bold">{calories}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
