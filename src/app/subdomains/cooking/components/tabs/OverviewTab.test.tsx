import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { OverviewTab } from './OverviewTab';

// Mock the Icons to avoid import issues in tests
vi.mock('../Icons/index', () => ({
  CalendarIcon: ({ size }: { size?: number }) => (
    <div data-testid="calendar-icon">CalendarIcon</div>
  ),
  ChefHatIcon: ({ size }: { size?: number }) => (
    <div data-testid="chef-hat-icon">ChefHatIcon</div>
  ),
  UtensilsIcon: ({ size }: { size?: number }) => (
    <div data-testid="utensils-icon">UtensilsIcon</div>
  ),
}));

// Mock the Card components
vi.mock('../ui/Card', () => ({
  StatCard: ({ title, value, subtitle, icon, trend }: any) => (
    <div data-testid="stat-card">
      <h3>{title}</h3>
      <div data-testid="stat-value">{value}</div>
      {subtitle && <p data-testid="stat-subtitle">{subtitle}</p>}
      {icon && <div data-testid="stat-icon">{icon}</div>}
      {trend && (
        <div data-testid="stat-trend">
          {trend.isPositive ? '↑' : '↓'} {Math.abs(trend.value)}%
        </div>
      )}
    </div>
  ),
}));

describe('OverviewTab', () => {
  const defaultProps = {
    dailyCalories: { current: 1500, goal: 2000 },
    dailyProtein: { current: 75, goal: 100 },
    recipeCount: 5,
    loggedDays: 7,
  };

  it('renders all overview cards', () => {
    render(<OverviewTab {...defaultProps} />);

    expect(screen.getByText("Today's Calories")).toBeInTheDocument();
    expect(screen.getByText('Protein')).toBeInTheDocument();
    expect(screen.getByText('My Recipes')).toBeInTheDocument();
    expect(screen.getByText('Logged Days')).toBeInTheDocument();
  });

  it('displays correct calorie information', () => {
    render(<OverviewTab {...defaultProps} />);

    expect(screen.getByText('1500 / 2000')).toBeInTheDocument();
    expect(screen.getByText('75% of daily goal')).toBeInTheDocument();
  });

  it('displays correct protein information', () => {
    render(<OverviewTab {...defaultProps} />);

    expect(screen.getByText('75g')).toBeInTheDocument();
    expect(screen.getByText('100g goal • 75%')).toBeInTheDocument();
  });

  it('displays correct recipe count', () => {
    render(<OverviewTab {...defaultProps} />);

    expect(screen.getByText('5')).toBeInTheDocument();
    expect(screen.getByText('5 recipes saved')).toBeInTheDocument();
  });

  it('displays correct message when no recipes', () => {
    render(<OverviewTab {...defaultProps} recipeCount={0} />);

    expect(screen.getByText('0')).toBeInTheDocument();
    expect(screen.getByText('Create your first recipe')).toBeInTheDocument();
  });

  it('handles singular recipe correctly', () => {
    render(<OverviewTab {...defaultProps} recipeCount={1} />);

    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText('1 recipe saved')).toBeInTheDocument();
  });

  it('displays correct logged days information', () => {
    render(<OverviewTab {...defaultProps} />);

    expect(screen.getByText('7')).toBeInTheDocument();
    expect(screen.getByText('7 days tracked')).toBeInTheDocument();
  });

  it('displays correct message when no logged days', () => {
    render(<OverviewTab {...defaultProps} loggedDays={0} />);

    expect(screen.getByText('0')).toBeInTheDocument();
    expect(screen.getByText('Start tracking today')).toBeInTheDocument();
  });

  it('handles singular day correctly', () => {
    render(<OverviewTab {...defaultProps} loggedDays={1} />);

    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText('1 day tracked')).toBeInTheDocument();
  });

  it('calculates percentages correctly', () => {
    render(<OverviewTab {...defaultProps} />);

    // Check that percentage calculations are displayed
    expect(screen.getByText('75% of daily goal')).toBeInTheDocument();
    expect(screen.getByText('100g goal • 75%')).toBeInTheDocument();
  });

  it('handles zero goals gracefully', () => {
    render(
      <OverviewTab
        {...defaultProps}
        dailyCalories={{ current: 500, goal: 0 }}
        dailyProtein={{ current: 50, goal: 0 }}
      />
    );

    // Should show 0% when goal is 0
    expect(screen.getByText('0% of daily goal')).toBeInTheDocument();
    expect(screen.getByText('0g goal • 0%')).toBeInTheDocument();
  });
});
