'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { SearchIcon, XIcon, ChevronDownIcon } from './Icons';
import type { RecipeWithDetails } from '../types/recipe.types';

interface RecipeSearchProps {
  recipes: RecipeWithDetails[];
  onSearchResults: (results: RecipeWithDetails[]) => void;
}

type SortOption = 'name' | 'newest' | 'oldest' | 'servings';
type FilterOption = 'private' | 'public' | 'component';

interface SearchFilters {
  query: string;
  sort: SortOption;
  visibility: FilterOption[];
  maxServings?: number;
}

export const RecipeSearch: React.FC<RecipeSearchProps> = ({
  recipes,
  onSearchResults,
}) => {
  const [filters, setFilters] = useState<SearchFilters>({
    query: '',
    sort: 'name',
    visibility: [],
    maxServings: undefined,
  });

  const [showFilters, setShowFilters] = useState(false);

  // Sort recipes based on selected option
  const sortRecipes = useCallback(
    (recipes: RecipeWithDetails[], sort: SortOption): RecipeWithDetails[] => {
      const sorted = [...recipes];
      switch (sort) {
        case 'name':
          return sorted.sort((a, b) => a.name.localeCompare(b.name));
        case 'newest':
          return sorted.sort(
            (a, b) =>
              new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
        case 'oldest':
          return sorted.sort(
            (a, b) =>
              new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          );
        case 'servings':
          return sorted.sort((a, b) => a.servings - b.servings);
        default:
          return sorted;
      }
    },
    []
  );

  // Filter recipes based on search criteria
  const filteredRecipes = useMemo(() => {
    let results = recipes;

    // Text search
    if (filters.query) {
      const query = filters.query.toLowerCase();
      results = results.filter((recipe) => {
        // Search in recipe name and description
        if (
          recipe.name.toLowerCase().includes(query) ||
          recipe.description?.toLowerCase().includes(query)
        ) {
          return true;
        }

        // Search in ingredients
        if (recipe.currentVersion?.items) {
          return recipe.currentVersion.items.some(
            (item) =>
              item.food?.name.toLowerCase().includes(query) ||
              item.recipe?.name.toLowerCase().includes(query)
          );
        }

        return false;
      });
    }

    // Visibility filters
    if (filters.visibility.length > 0) {
      results = results.filter((recipe) => {
        if (filters.visibility.includes('component')) {
          return recipe.isComponent;
        }
        return filters.visibility.includes(recipe.visibility as FilterOption);
      });
    }

    // Servings filter
    if (filters.maxServings) {
      results = results.filter(
        (recipe) => recipe.servings <= filters.maxServings!
      );
    }

    // Sort results
    return sortRecipes(results, filters.sort);
  }, [recipes, filters, sortRecipes]);

  // Update search results when filters change
  React.useEffect(() => {
    onSearchResults(filteredRecipes);
  }, [filteredRecipes, onSearchResults]);

  const handleVisibilityToggle = (visibility: FilterOption) => {
    setFilters((prev) => ({
      ...prev,
      visibility: prev.visibility.includes(visibility)
        ? prev.visibility.filter((v) => v !== visibility)
        : [...prev.visibility, visibility],
    }));
  };

  const clearFilters = () => {
    setFilters({
      query: '',
      sort: 'name',
      visibility: [],
      maxServings: undefined,
    });
  };

  const activeFilterCount =
    filters.visibility.length + (filters.maxServings ? 1 : 0);

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="relative">
        <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
        <input
          type="text"
          value={filters.query}
          onChange={(e) =>
            setFilters((prev) => ({ ...prev, query: e.target.value }))
          }
          placeholder="Search recipes by name or ingredient..."
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        {filters.query && (
          <button
            onClick={() => setFilters((prev) => ({ ...prev, query: '' }))}
            className="absolute right-3 top-1/2 -translate-y-1/2"
          >
            <XIcon className="h-4 w-4 text-gray-400 hover:text-gray-600" />
          </button>
        )}
      </div>

      {/* Filter Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          {/* Sort Dropdown */}
          <div className="relative">
            <select
              value={filters.sort}
              onChange={(e) =>
                setFilters((prev) => ({
                  ...prev,
                  sort: e.target.value as SortOption,
                }))
              }
              className="appearance-none bg-white border border-gray-300 rounded-lg px-4 py-2 pr-8 focus:ring-2 focus:ring-blue-500"
            >
              <option value="name">Sort by Name</option>
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="servings">Servings (Low to High)</option>
            </select>
            <ChevronDownIcon className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
          </div>

          {/* Filter Toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 py-2 border rounded-lg transition-colors ${
              showFilters
                ? 'bg-blue-50 border-blue-300 text-blue-700'
                : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
          >
            <span>Filters</span>
            {activeFilterCount > 0 && (
              <span className="bg-blue-600 text-white text-xs px-2 py-0.5 rounded-full">
                {activeFilterCount}
              </span>
            )}
          </button>

          {/* Clear Filters */}
          {activeFilterCount > 0 && (
            <button
              onClick={clearFilters}
              className="text-sm text-gray-600 hover:text-gray-800"
            >
              Clear all
            </button>
          )}
        </div>

        {/* Results Count */}
        <div className="text-sm text-gray-600">
          {filteredRecipes.length} recipe
          {filteredRecipes.length !== 1 ? 's' : ''} found
        </div>
      </div>

      {/* Expanded Filters */}
      {showFilters && (
        <div className="bg-gray-50 rounded-lg p-4 space-y-4">
          {/* Visibility Options */}
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-2">
              Recipe Type
            </h3>
            <div className="flex flex-wrap gap-2">
              {(['private', 'public', 'component'] as FilterOption[]).map(
                (visibility) => (
                  <button
                    key={visibility}
                    onClick={() => handleVisibilityToggle(visibility)}
                    className={`px-3 py-1 rounded-full text-sm transition-colors ${
                      filters.visibility.includes(visibility)
                        ? 'bg-blue-600 text-white'
                        : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    {visibility === 'component'
                      ? 'Recipe Component'
                      : visibility.charAt(0).toUpperCase() +
                        visibility.slice(1)}
                  </button>
                )
              )}
            </div>
          </div>

          {/* Servings Range */}
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-2">
              Maximum Servings
            </h3>
            <input
              type="number"
              value={filters.maxServings ?? ''}
              onChange={(e) =>
                setFilters((prev) => ({
                  ...prev,
                  maxServings: e.target.value
                    ? parseInt(e.target.value)
                    : undefined,
                }))
              }
              placeholder="e.g. 4"
              className="w-32 px-3 py-1 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      )}
    </div>
  );
};
