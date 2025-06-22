'use client';

import { animations } from '../../utils/animations';

// Recipe card skeleton
export const RecipeCardSkeleton: React.FC = () => (
  <div className={`rounded-lg border bg-card p-4 ${animations.skeleton}`}>
    <div className="mb-4 h-40 rounded bg-muted" />
    <div className="mb-2 h-6 w-3/4 rounded bg-muted" />
    <div className="mb-4 h-4 w-full rounded bg-muted" />
    <div className="flex justify-between">
      <div className="h-4 w-16 rounded bg-muted" />
      <div className="h-4 w-20 rounded bg-muted" />
    </div>
  </div>
);

// List skeleton
export const ListSkeleton: React.FC<{ count?: number }> = ({ count = 3 }) => (
  <div className="space-y-3">
    {Array.from({ length: count }).map((_, i) => (
      <div
        key={i}
        className={`flex items-center space-x-4 p-3 ${animations.skeleton}`}
      >
        <div className="h-12 w-12 rounded-full bg-muted" />
        <div className="flex-1 space-y-2">
          <div className="h-4 w-1/2 rounded bg-muted" />
          <div className="h-3 w-3/4 rounded bg-muted" />
        </div>
      </div>
    ))}
  </div>
);

// Table skeleton
export const TableSkeleton: React.FC<{ rows?: number; cols?: number }> = ({
  rows = 5,
  cols = 4,
}) => (
  <div className="w-full">
    <div className="mb-4 flex space-x-4 border-b pb-4">
      {Array.from({ length: cols }).map((_, i) => (
        <div
          key={i}
          className={`h-4 flex-1 rounded bg-muted ${animations.skeleton}`}
        />
      ))}
    </div>
    {Array.from({ length: rows }).map((_, rowIndex) => (
      <div key={rowIndex} className="flex space-x-4 border-b py-4">
        {Array.from({ length: cols }).map((_, colIndex) => (
          <div
            key={colIndex}
            className={`h-4 flex-1 rounded bg-muted ${animations.skeleton}`}
          />
        ))}
      </div>
    ))}
  </div>
);

// Full page skeleton
export const PageSkeleton: React.FC = () => (
  <div className="space-y-6">
    {/* Header skeleton */}
    <div className="space-y-2">
      <div className={`h-8 w-48 rounded bg-muted ${animations.skeleton}`} />
      <div className={`h-4 w-96 rounded bg-muted ${animations.skeleton}`} />
    </div>

    {/* Content skeleton */}
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <RecipeCardSkeleton key={i} />
      ))}
    </div>
  </div>
);

// Spinner loading
export const Spinner: React.FC<{ size?: 'sm' | 'md' | 'lg' }> = ({
  size = 'md',
}) => {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12',
  };

  return (
    <div className="flex items-center justify-center">
      <div
        className={`${sizeClasses[size]} animate-spin rounded-full border-2 border-muted border-t-primary`}
      />
    </div>
  );
};
