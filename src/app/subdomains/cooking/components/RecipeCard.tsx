'use client';

import { useState } from 'react';
import Image from 'next/image';

import type { RecipeWithDetails } from '../types/recipe.types';
import { formatDuration, getTotalTime } from '../utils/recipe.utils';

import { CaloriesIcon, ChevronDownIcon, TimeIcon, UserIcon } from './Icons';
import { PieChartIcon } from './Icons';
import { NutritionPieChart } from './NutritionPieChart';

import { Button } from './ui/Button';
import { Card, CardImage, CardBadge, RecipeMeta } from './ui/Card';

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
    <Card variant="recipe" className="group">
      <CardImage src={recipe.imageUrl ?? undefined} alt={recipe.name} />
      
      <div className="p-6">
        <div className="flex justify-between items-start mb-3">
          <h3 className="text-xl font-bold text-cooking-neutral-900 group-hover:text-cooking-primary transition-colors">
            {recipe.name}
          </h3>
          <Button
            variant="ghost"
            size="xs"
            onClick={() => setShowDetails(!showDetails)}
            className="ml-2"
          >
            <ChevronDownIcon
              className={`w-5 h-5 transition-transform ${showDetails ? 'rotate-180' : ''}`}
            />
          </Button>
        </div>
        
        {recipe.description && (
          <p className="text-sm text-cooking-neutral-600 mb-4 line-clamp-2">
            {recipe.description}
          </p>
        )}
        
        <RecipeMeta 
          prepTime={recipe.prepTime}
          cookTime={recipe.cookTime}
          servings={recipe.servings}
          className="mb-4"
        />
        
        <div className="flex flex-wrap gap-2 mb-4">
          {perServingNutrition && (
            <>
              <CardBadge variant="calories">
                {perServingNutrition.calories.toFixed(0)} cal
              </CardBadge>
              <CardBadge variant="protein">
                {perServingNutrition.protein.toFixed(0)}g protein
              </CardBadge>
            </>
          )}
        </div>
        {showDetails && (
          <div className="border-t border-cooking-neutral-200 pt-4 mt-4 space-y-4 animate-fade-in">
            <div>
              <h4 className="font-semibold text-sm text-cooking-neutral-700 mb-2">Ingredients</h4>
              <div className="grid grid-cols-2 gap-2 text-sm">
                {recipe.currentVersion?.items
                  .slice(0, 6)
                  .map((item) => (
                    <div key={item.id} className="flex items-center gap-1">
                      <span className="w-2 h-2 bg-cooking-primary rounded-full"></span>
                      <span className="text-cooking-neutral-600">
                        {item.food?.name ?? item.recipe?.name}
                      </span>
                    </div>
                  ))}
                {recipe.currentVersion &&
                  recipe.currentVersion.items.length > 6 && (
                    <div className="text-cooking-neutral-500 italic">
                      +{recipe.currentVersion.items.length - 6} more
                    </div>
                  )}
              </div>
            </div>
            
            {perServingNutrition && (
              <div className="bg-cooking-neutral-50 rounded-lg p-3">
                <NutritionPieChart nutrition={perServingNutrition} />
              </div>
            )}
          </div>
        )}
        {/* Action Buttons */}
        <div className="flex gap-2 mt-4 pt-4 border-t border-cooking-neutral-100">
          {isOwner ? (
            <>
              <Button
                variant="primary"
                size="sm"
                fullWidth
                onClick={onCook}
              >
                Cook Now
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={onEdit}
              >
                Edit
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowDeleteConfirm(true)}
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </Button>
            </>
          ) : (
            <Button
              variant="primary"
              size="sm"
              fullWidth
              onClick={onViewFullDay}
            >
              View Details
            </Button>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="absolute inset-0 bg-white/95 dark:bg-cooking-neutral-900/95 backdrop-blur-sm flex flex-col items-center justify-center p-6 rounded-xl">
          <div className="text-center">
            <div className="mx-auto w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-cooking-neutral-900 mb-2">
              Delete Recipe?
            </h3>
            <p className="text-sm text-cooking-neutral-600 mb-6">
              This action cannot be undone. This recipe will be permanently deleted.
            </p>
            <div className="flex gap-3 justify-center">
              <Button
                variant="danger"
                size="sm"
                onClick={() => {
                  onDelete?.();
                  setShowDeleteConfirm(false);
                }}
              >
                Delete Recipe
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowDeleteConfirm(false)}
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}
