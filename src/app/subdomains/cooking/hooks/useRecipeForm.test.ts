import React from 'react';
import { renderHook, act } from '@testing-library/react-hooks';
import { describe, it, expect, vi } from 'vitest';
import type { Food } from '@prisma/client';
import { useRecipeForm } from './useRecipeForm';

// Mock the Toast module
vi.mock('~/components/Toast', () => ({
  useToast: () => ({
    addToast: vi.fn(),
  }),
}));

describe('useRecipeForm', () => {
  it('should initialize with default state', () => {
    const { result } = renderHook(() => useRecipeForm());
    expect(result.current.formData.name).toBe('');
    expect(result.current.formData.items).toEqual([]);
    expect(result.current.formData.servings).toBe('1');
    expect(result.current.formData.visibility).toBe('private');
  });

  it('should handle input change', () => {
    const { result } = renderHook(() => useRecipeForm());
    act(() => {
      result.current.handleInputChange('name', 'Test Recipe');
    });
    expect(result.current.formData.name).toBe('Test Recipe');
  });

  it('should validate form', () => {
    const { result } = renderHook(() => useRecipeForm());

    // Should fail validation with empty name
    let isValid: boolean;
    act(() => {
      isValid = result.current.validateForm();
    });

    expect(isValid!).toBe(false);
    expect(result.current.error).toBe('Recipe name is required');

    // Should pass validation with name and items
    act(() => {
      result.current.handleInputChange('name', 'Test Recipe');
      result.current.setFormData((prev) => ({
        ...prev,
        items: [{ id: '1', foodId: '1', amount: 100, unit: 'g' }],
      }));
    });

    act(() => {
      isValid = result.current.validateForm();
    });

    expect(isValid!).toBe(true);
    expect(result.current.error).toBe(null);
  });

  it('should calculate total nutrition', () => {
    const { result } = renderHook(() => useRecipeForm());

    const mockFood: Food = {
      id: '1',
      userId: null,
      name: 'Test Food',
      brand: null,
      barcode: null,
      calories: 100,
      protein: 10,
      carbs: 20,
      fat: 5,
      fiber: 2,
      sugar: 5,
      sodium: 100,
      saturatedFat: 2,
      transFat: 0,
      cholesterol: 10,
      potassium: 100,
      vitaminA: 0,
      vitaminC: 0,
      calcium: 50,
      iron: 2,
      imageUrl: null,
      defaultServingSize: 100,
      defaultServingUnit: 'g',
      visibility: 'private',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    act(() => {
      result.current.setFormData((prev) => ({
        ...prev,
        items: [
          {
            id: '1',
            foodId: '1',
            food: mockFood,
            amount: 100,
            unit: 'g',
          },
        ],
        servings: '2',
      }));
    });

    const nutrition = result.current.calculateTotalNutrition();
    expect(nutrition.totalCalories).toBe(100);
    expect(nutrition.totalProtein).toBe(10);
    expect(nutrition.totalCarbs).toBe(20);
    expect(nutrition.totalFat).toBe(5);
    expect(nutrition.perServing.calories).toBe(50);
    expect(nutrition.perServing.protein).toBe(5);
    expect(nutrition.perServing.carbs).toBe(10);
    expect(nutrition.perServing.fat).toBe(2.5);
  });
});
