'use client';

import { useSession } from 'next-auth/react';
import { useState } from 'react';

import { FullDayNutrition } from '../components/FullDayNutrition';
import { RecipeCard } from '../components/RecipeCard';
import { VirtualizedRecipeList } from '../components/VirtualizedRecipeList';
import type { RecipeWithDetails } from '../types/recipe.types';

export default function AdvancedSearchPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [ingredients, setIngredients] = useState('');
  const [maxPrepTime, setMaxPrepTime] = useState('');
  const [sortBy, setSortBy] = useState('createdAt');
  const [results, setResults] = useState<RecipeWithDetails[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [viewingFullDayRecipe, setViewingFullDayRecipe] =
    useState<RecipeWithDetails | null>(null);
  const { data: session } = useSession();
  const isAdmin = session?.user?.id === 'your_admin_user_id_here'; // Replace with actual admin ID

  const handleSearch = async () => {
    setIsLoading(true);
    const queryParams = new URLSearchParams();
    if (searchTerm) {
      queryParams.append('query', searchTerm);
    }
    if (ingredients) {
      queryParams.append('ingredients', ingredients);
    }
    if (maxPrepTime) {
      queryParams.append('maxPrepTime', maxPrepTime);
    }
    if (sortBy) {
      queryParams.append('sortBy', sortBy);
    }

    try {
      const response = await fetch(
        `/api/cooking/search?${queryParams.toString()}`
      );
      const data = await response.json();
      setResults(data);
    } catch (error) {
      console.error('Error searching recipes:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-4 space-y-6">
      <h1 className="text-3xl font-bold">Advanced Recipe Search</h1>
      <div className="p-4 border rounded-lg space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">
              Search Term
            </label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
              }}
              placeholder="Name or description..."
              className="w-full px-4 py-2 border rounded-lg"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">
              Ingredients (comma-separated)
            </label>
            <input
              type="text"
              value={ingredients}
              onChange={(e) => {
                setIngredients(e.target.value);
              }}
              placeholder="e.g., chicken, broccoli"
              className="w-full px-4 py-2 border rounded-lg"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">
              Max Prep Time (minutes)
            </label>
            <input
              type="number"
              value={maxPrepTime}
              onChange={(e) => {
                setMaxPrepTime(e.target.value);
              }}
              placeholder="e.g., 30"
              className="w-full px-4 py-2 border rounded-lg"
            />
          </div>
        </div>
        <div className="flex justify-between items-center">
          <div>
            <label className="block text-sm font-medium mb-1">Sort By</label>
            <select
              value={sortBy}
              onChange={(e) => {
                setSortBy(e.target.value);
              }}
              className="px-4 py-2 border rounded-lg"
            >
              <option value="createdAt">Newest</option>
              <option value="likes">Most Liked</option>
              {isAdmin && <option value="reports">Most Reported</option>}
            </select>
          </div>
          <button
            onClick={() => void handleSearch()}
            className="px-6 py-2 bg-blue-500 text-white rounded-lg"
            disabled={isLoading}
          >
            {isLoading ? 'Searching...' : 'Search'}
          </button>
        </div>
      </div>

      <div>
        <h2 className="text-2xl font-semibold mb-4">
          Results ({results.length})
        </h2>
        {isLoading ? (
          <div className="text-center">
            <p>Loading...</p>
          </div>
        ) : results.length > 20 ? (
          // Use virtual scrolling for large result sets
          <VirtualizedRecipeList
            recipes={results}
            isOwner={false}
            onViewFullDay={(recipe) => setViewingFullDayRecipe(recipe)}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {results.map((recipe) => (
              <RecipeCard
                key={recipe.id}
                recipe={recipe}
                isOwner={false}
                onCook={() => {
                  /* Placeholder for cook action */
                }}
                onDelete={() => {
                  /* Placeholder for delete action */
                }}
                onEdit={() => {
                  /* Placeholder for edit action */
                }}
                onViewHistory={() => {
                  /* Placeholder for history action */
                }}
                onViewFullDay={() => {
                  setViewingFullDayRecipe(recipe);
                }}
              />
            ))}
          </div>
        )}
      </div>

      {viewingFullDayRecipe && (
        <FullDayNutrition
          recipe={viewingFullDayRecipe}
          onClose={() => {
            setViewingFullDayRecipe(null);
          }}
        />
      )}
    </div>
  );
}
