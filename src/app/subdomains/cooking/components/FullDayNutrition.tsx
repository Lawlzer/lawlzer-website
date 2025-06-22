'use client';

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Button } from '~/components/ui/Button';
import type { RecipeWithDetails } from '../types/recipe.types';
import { NutritionPieChart } from './NutritionPieChart';

interface FullDayNutritionProps {
  recipe: RecipeWithDetails;
  onClose: () => void;
}

const DAILY_GOAL = 2000; // Daily calorie goal for projection

export function FullDayNutrition({ recipe, onClose }: FullDayNutritionProps) {
  if (!recipe.currentVersion) {
    return null;
  }

  const {
    caloriesPerServing,
    proteinPerServing,
    carbsPerServing,
    fatPerServing,
    fiberPerServing,
    sugarPerServing,
    sodiumPerServing,
  } = recipe.currentVersion;

  // Calculate how many servings to reach the daily goal
  const servingsForGoal = DAILY_GOAL / caloriesPerServing;

  const fullDayNutrition = {
    calories: caloriesPerServing * servingsForGoal,
    protein: proteinPerServing * servingsForGoal,
    carbs: carbsPerServing * servingsForGoal,
    fat: fatPerServing * servingsForGoal,
    fiber: fiberPerServing * servingsForGoal,
    sugar: sugarPerServing * servingsForGoal,
    sodium: sodiumPerServing * servingsForGoal,
  };

  const macroData = [
    { name: 'Protein', value: fullDayNutrition.protein, fill: '#8884d8' },
    { name: 'Carbs', value: fullDayNutrition.carbs, fill: '#82ca9d' },
    { name: 'Fat', value: fullDayNutrition.fat, fill: '#ffc658' },
  ];

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold">
            Full Day Nutrition: {recipe.name}
          </h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </Button>
        </div>

        <div className="overflow-y-auto flex-1 space-y-6">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            This projects your nutrition if you only ate{' '}
            <strong>{recipe.name}</strong> to reach a{' '}
            <strong>{DAILY_GOAL} kcal</strong> goal. This would require
            approximately <strong>{servingsForGoal.toFixed(1)}</strong>{' '}
            servings.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex flex-col items-center justify-center">
              <h3 className="font-semibold mb-2">Macro Distribution (grams)</h3>
              <div className="w-full h-60">
                <ResponsiveContainer>
                  <BarChart
                    data={macroData}
                    layout="vertical"
                    margin={{ top: 5, right: 20, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis type="category" dataKey="name" width={60} />
                    <Tooltip cursor={{ fill: 'rgba(240, 240, 240, 0.3)' }} />
                    <Bar
                      dataKey="value"
                      fill="#8884d8"
                      background={{ fill: '#eee' }}
                      unit="g"
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className="flex flex-col items-center justify-center">
              <h3 className="font-semibold mb-2">Calorie Breakdown</h3>
              <div className="w-full h-60">
                <NutritionPieChart nutrition={fullDayNutrition} />
              </div>
            </div>
          </div>

          <div>
            <h3 className="font-semibold mb-2">Detailed Nutrition Stats</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
              <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
                <p className="text-gray-600 dark:text-gray-400">Calories</p>
                <p className="font-bold text-lg">
                  {fullDayNutrition.calories.toFixed(0)} kcal
                </p>
              </div>
              <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
                <p className="text-gray-600 dark:text-gray-400">Protein</p>
                <p className="font-bold text-lg">
                  {fullDayNutrition.protein.toFixed(1)} g
                </p>
              </div>
              <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
                <p className="text-gray-600 dark:text-gray-400">
                  Carbohydrates
                </p>
                <p className="font-bold text-lg">
                  {fullDayNutrition.carbs.toFixed(1)} g
                </p>
              </div>
              <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
                <p className="text-gray-600 dark:text-gray-400">Fat</p>
                <p className="font-bold text-lg">
                  {fullDayNutrition.fat.toFixed(1)} g
                </p>
              </div>
              <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
                <p className="text-gray-600 dark:text-gray-400">Fiber</p>
                <p className="font-bold text-lg">
                  {fullDayNutrition.fiber.toFixed(1)} g
                </p>
              </div>
              <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
                <p className="text-gray-600 dark:text-gray-400">Sugar</p>
                <p className="font-bold text-lg">
                  {fullDayNutrition.sugar.toFixed(1)} g
                </p>
              </div>
              <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg col-span-full">
                <p className="text-gray-600 dark:text-gray-400">Sodium</p>
                <p className="font-bold text-lg">
                  {fullDayNutrition.sodium.toFixed(0)} mg
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
