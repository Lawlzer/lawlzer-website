'use client';

import { useState } from 'react';
import Image from 'next/image';

import type { RecipeWithDetails } from '../types/recipe.types';
import { formatDuration, getTotalTime } from '../utils/recipe.utils';

import { CaloriesIcon, ChevronDownIcon, TimeIcon, UserIcon } from './Icons';
import { PieChartIcon } from './Icons';
import { NutritionPieChart } from './NutritionPieChart';

import { Button } from '~/components/ui/Button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '~/components/ui/Card';

interface RecipeCardProps {
  recipe: RecipeWithDetails;
  onEdit?: () => void;
  onCook?: () => void;
  onDelete?: () => void;
  onViewHistory?: () => void;
  onViewFullDay: () => void;
  isOwner?: boolean;
}

export function RecipeCard({
  recipe,
  onEdit,
  onCook,
  onDelete,
  onViewHistory,
  onViewFullDay,
  isOwner = false,
}: RecipeCardProps) {
  const [showDetails, setShowDetails] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const _handleExport = () => {
    window.location.href = `/api/cooking/recipes/${recipe.id}/export`;
  };

  const _hasNutrition = recipe.currentVersion !== null;
  const _totalTime = (recipe.prepTime ?? 0) + (recipe.cookTime ?? 0);

  const timeSummary = [
    {
      label: 'Prep',
      value:
        recipe.prepTime !== null && recipe.prepTime !== 0
          ? formatDuration(recipe.prepTime)
          : null,
    },
    {
      label: 'Cook',
      value:
        recipe.cookTime !== null && recipe.cookTime !== 0
          ? formatDuration(recipe.cookTime)
          : null,
    },
    {
      label: 'Total',
      value:
        getTotalTime(recipe.prepTime, recipe.cookTime) !== null &&
        getTotalTime(recipe.prepTime, recipe.cookTime) !== 0
          ? formatDuration(getTotalTime(recipe.prepTime, recipe.cookTime))
          : null,
    },
  ].filter((t) => t.value !== null);

  const perServingNutrition = recipe.currentVersion
    ? {
        calories: recipe.currentVersion.caloriesPerServing,
        protein: recipe.currentVersion.proteinPerServing,
        carbs: recipe.currentVersion.carbsPerServing,
        fat: recipe.currentVersion.fatPerServing,
      }
    : null;

  return (
    <Card className="relative overflow-hidden hover-lift card-hover transition-all-300">
      <CardHeader>
        <CardTitle className="flex justify-between items-start">
          {recipe.name}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              setShowDetails(!showDetails);
            }}
          >
            <ChevronDownIcon
              className={`transition-transform ${showDetails ? 'rotate-180' : ''}`}
            />
          </Button>
        </CardTitle>
        <CardDescription>{recipe.description}</CardDescription>
      </CardHeader>
      {recipe.imageUrl && (
        <div className="relative h-48 w-full">
          <Image
            src={recipe.imageUrl}
            alt={recipe.name}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            className="object-cover"
            priority={false}
          />
        </div>
      )}
      <CardContent>
        <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
          <div className="flex items-center gap-1">
            <TimeIcon className="w-4 h-4" />
            <span>
              {timeSummary.find((t) => t.label === 'Total')?.value ?? 'N/A'}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <UserIcon className="w-4 h-4" />
            <span>{recipe.servings} servings</span>
          </div>
          <div className="flex items-center gap-1">
            <CaloriesIcon className="w-4 h-4" />
            <span>
              {perServingNutrition?.calories.toFixed(0) ?? 'N/A'} cal/serving
            </span>
          </div>
        </div>
        {showDetails && (
          <div className="mt-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h4 className="font-semibold mb-2">Ingredients</h4>
                <ul className="list-disc list-inside text-sm">
                  {recipe.currentVersion?.items
                    .slice(0, 5)
                    .map((item) => (
                      <li key={item.id}>
                        {item.food?.name ?? item.recipe?.name}
                      </li>
                    ))}
                  {recipe.currentVersion &&
                    recipe.currentVersion.items.length > 5 && (
                      <li>
                        ...and {recipe.currentVersion.items.length - 5} more
                      </li>
                    )}
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Nutrition per Serving</h4>
                {perServingNutrition && (
                  <NutritionPieChart nutrition={perServingNutrition} />
                )}
              </div>
            </div>
            {isOwner && (
              <div className="flex gap-2 mt-4">
                <Button onClick={onEdit}>Edit</Button>
                <Button onClick={onCook}>Cook</Button>
                <Button
                  variant="destructive"
                  onClick={() => {
                    setShowDeleteConfirm(true);
                  }}
                >
                  Delete
                </Button>
              </div>
            )}
          </div>
        )}
      </CardContent>
      {isOwner && (
        <CardFooter className="flex justify-between">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={onViewHistory}>
              <TimeIcon className="mr-2" /> History
            </Button>
            <Button variant="ghost" size="sm" onClick={onViewFullDay}>
              <PieChartIcon /> <span className="ml-2">Full Day</span>
            </Button>
          </div>
        </CardFooter>
      )}

      {showDeleteConfirm && (
        <div className="absolute inset-0 bg-white/80 dark:bg-black/80 flex flex-col items-center justify-center p-4">
          <p className="font-semibold">Are you sure?</p>
          <p className="text-sm text-center text-gray-600 dark:text-gray-400 mb-4">
            This action cannot be undone.
          </p>
          <div className="flex gap-2">
            <Button
              variant="destructive"
              onClick={() => {
                onDelete?.();
                setShowDeleteConfirm(false);
              }}
            >
              Yes, delete
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setShowDeleteConfirm(false);
              }}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
}
