'use client';

import React, { useCallback, useMemo } from 'react';
import { VariableSizeGrid as Grid } from 'react-window';

import type { RecipeWithDetails } from '../types/recipe.types';

import { RecipeCard } from './RecipeCard';

interface VirtualizedRecipeListProps {
  recipes: RecipeWithDetails[];
  isOwner?: boolean;
  onEdit?: (recipe: RecipeWithDetails) => void;
  onCook?: () => void;
  onDelete?: (recipeId: string) => void;
  onViewHistory?: (recipe: RecipeWithDetails) => void;
  onViewFullDay: (recipe: RecipeWithDetails) => void;
}

const CARD_WIDTH = 350; // Base width for cards
const CARD_HEIGHT = 280; // Estimated height for cards
const GAP = 16; // Gap between cards

export const VirtualizedRecipeList: React.FC<VirtualizedRecipeListProps> = ({
  recipes,
  isOwner = true,
  onEdit,
  onCook,
  onDelete,
  onViewHistory,
  onViewFullDay,
}) => {
  // Calculate grid dimensions based on viewport
  const [containerWidth, setContainerWidth] = React.useState(
    typeof window !== 'undefined' ? window.innerWidth - 48 : 1200
  ); // Account for padding
  const [containerHeight, setContainerHeight] = React.useState(
    typeof window !== 'undefined' ? window.innerHeight - 300 : 800
  ); // Account for header/footer

  // Update dimensions on resize
  React.useEffect(() => {
    const handleResize = () => {
      setContainerWidth(window.innerWidth - 48);
      setContainerHeight(window.innerHeight - 300);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Calculate columns based on container width
  const columnCount = useMemo(() => {
    if (containerWidth < 768) return 1; // Mobile
    if (containerWidth < 1024) return 2; // Tablet
    return Math.floor((containerWidth + GAP) / (CARD_WIDTH + GAP)); // Desktop
  }, [containerWidth]);

  // Calculate how many rows we need
  const rowCount = Math.ceil(recipes.length / columnCount);

  // Get column width based on available space
  const getColumnWidth = useCallback(() => {
    if (columnCount === 1) return containerWidth;
    return (containerWidth - GAP * (columnCount - 1)) / columnCount;
  }, [containerWidth, columnCount]);

  // Get row height (fixed for now, could be made variable later)
  const getRowHeight = useCallback(() => CARD_HEIGHT + GAP, []);

  // Cell renderer
  const Cell = useCallback(
    ({
      columnIndex,
      rowIndex,
      style,
    }: {
      columnIndex: number;
      rowIndex: number;
      style: React.CSSProperties;
    }) => {
      const index = rowIndex * columnCount + columnIndex;
      if (index >= recipes.length) return null;

      const recipe = recipes[index];

      return (
        <div
          style={{
            ...style,
            paddingRight: columnIndex < columnCount - 1 ? GAP : 0,
            paddingBottom: GAP,
          }}
        >
          <RecipeCard
            recipe={recipe}
            isOwner={isOwner}
            onEdit={onEdit ? () => onEdit(recipe) : undefined}
            onCook={onCook}
            onDelete={onDelete ? () => onDelete(recipe.id) : undefined}
            onViewHistory={
              onViewHistory ? () => onViewHistory(recipe) : undefined
            }
            onViewFullDay={() => onViewFullDay(recipe)}
          />
        </div>
      );
    },
    [
      columnCount,
      recipes,
      isOwner,
      onEdit,
      onCook,
      onDelete,
      onViewHistory,
      onViewFullDay,
    ]
  );

  // If no recipes, show empty state
  if (recipes.length === 0) {
    return null;
  }

  return (
    <Grid
      columnCount={columnCount}
      columnWidth={getColumnWidth}
      height={containerHeight}
      rowCount={rowCount}
      rowHeight={getRowHeight}
      width={containerWidth}
      overscanRowCount={2} // Render 2 extra rows outside visible area
      className="scrollbar-thin scrollbar-thumb-gray-400 dark:scrollbar-thumb-gray-600"
    >
      {Cell}
    </Grid>
  );
};
