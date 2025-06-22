'use client';

import React from 'react';

import { CalendarIcon, ChefHatIcon, UtensilsIcon } from '../Icons';
import { StatCard } from '../ui/Card';

interface OverviewTabProps {
  dailyCalories: { current: number; goal: number };
  dailyProtein: { current: number; goal: number };
  recipeCount: number;
  loggedDays: number;
}

export function OverviewTab({
  dailyCalories,
  dailyProtein,
  recipeCount,
  loggedDays,
}: OverviewTabProps) {
  const caloriePercentage =
    dailyCalories.goal > 0
      ? (dailyCalories.current / dailyCalories.goal) * 100
      : 0;
  const proteinPercentage =
    dailyProtein.goal > 0
      ? (dailyProtein.current / dailyProtein.goal) * 100
      : 0;

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
      <StatCard
        title="Today's Calories"
        value={`${dailyCalories.current} / ${dailyCalories.goal}`}
        subtitle={`${caloriePercentage.toFixed(0)}% of daily goal`}
        icon={<ChefHatIcon size={24} />}
        trend={
          caloriePercentage > 0
            ? {
                value: caloriePercentage - 100,
                isPositive: caloriePercentage <= 100,
              }
            : undefined
        }
      />

      <StatCard
        title="Protein"
        value={`${dailyProtein.current}g`}
        subtitle={`${dailyProtein.goal}g goal • ${proteinPercentage.toFixed(0)}%`}
        icon={
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
              d="M13 10V3L4 14h7v7l9-11h-7z"
            />
          </svg>
        }
        trend={
          proteinPercentage > 0
            ? {
                value: proteinPercentage - 100,
                isPositive: proteinPercentage >= 80,
              }
            : undefined
        }
      />

      <StatCard
        title="My Recipes"
        value={recipeCount}
        subtitle={
          recipeCount === 0
            ? 'Create your first recipe'
            : `${recipeCount} recipe${recipeCount !== 1 ? 's' : ''} saved`
        }
        icon={<UtensilsIcon size={24} />}
      />

      <StatCard
        title="Logged Days"
        value={loggedDays}
        subtitle={
          loggedDays === 0
            ? 'Start tracking today'
            : `${loggedDays} day${loggedDays !== 1 ? 's' : ''} tracked`
        }
        icon={<CalendarIcon size={24} />}
        trend={
          loggedDays > 0
            ? {
                value: 100,
                isPositive: true,
              }
            : undefined
        }
      />
    </div>
  );
}
