import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { Button, IconButton, ButtonGroup } from './Button';

describe('Button', () => {
  it('renders with children', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });

  it('applies variant styles correctly', () => {
    const { rerender } = render(<Button variant="primary">Primary</Button>);
    expect(screen.getByText('Primary')).toHaveClass('bg-blue-600');

    rerender(<Button variant="secondary">Secondary</Button>);
    expect(screen.getByText('Secondary')).toHaveClass('bg-gray-200');

    rerender(<Button variant="outline">Outline</Button>);
    expect(screen.getByText('Outline')).toHaveClass('border');

    rerender(<Button variant="ghost">Ghost</Button>);
    expect(screen.getByText('Ghost')).toHaveClass('hover:bg-gray-100');

    rerender(<Button variant="danger">Danger</Button>);
    expect(screen.getByText('Danger')).toHaveClass('bg-red-600');
  });

  it('applies size styles correctly', () => {
    const { rerender } = render(<Button size="sm">Small</Button>);
    expect(screen.getByText('Small')).toHaveClass('text-sm');

    rerender(<Button size="md">Medium</Button>);
    expect(screen.getByText('Medium')).toHaveClass('text-base');

    rerender(<Button size="lg">Large</Button>);
    expect(screen.getByText('Large')).toHaveClass('text-lg');
  });

  it('handles click events', () => {
    const handleClick = vi.fn();

    render(<Button onClick={handleClick}>Click me</Button>);

    fireEvent.click(screen.getByText('Click me'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('disables button when disabled prop is true', () => {
    render(<Button disabled>Disabled</Button>);

    const button = screen.getByText('Disabled');
    expect(button).toBeDisabled();
    expect(button).toHaveClass('disabled:opacity-50');
  });

  it('shows loading state', () => {
    render(<Button isLoading>Loading</Button>);

    expect(screen.getByText('Loading...')).toBeInTheDocument();
    expect(screen.getByText('Loading...').parentElement).toBeDisabled();
  });

  it('renders with left icon', () => {
    const icon = <span data-testid="left-icon">←</span>;
    render(<Button leftIcon={icon}>With Icon</Button>);

    expect(screen.getByTestId('left-icon')).toBeInTheDocument();
    expect(screen.getByText('With Icon')).toBeInTheDocument();
  });

  it('renders with right icon', () => {
    const icon = <span data-testid="right-icon">→</span>;
    render(<Button rightIcon={icon}>With Icon</Button>);

    expect(screen.getByTestId('right-icon')).toBeInTheDocument();
    expect(screen.getByText('With Icon')).toBeInTheDocument();
  });

  it('applies fullWidth style', () => {
    render(<Button fullWidth>Full Width</Button>);
    expect(screen.getByText('Full Width')).toHaveClass('w-full');
  });

  it('applies custom className', () => {
    render(<Button className="custom-class">Custom</Button>);
    expect(screen.getByText('Custom')).toHaveClass('custom-class');
  });
});

describe('IconButton', () => {
  it('renders with icon and aria-label', () => {
    const icon = <span data-testid="icon">★</span>;
    render(<IconButton icon={icon} aria-label="Star" />);

    expect(screen.getByTestId('icon')).toBeInTheDocument();
    expect(screen.getByLabelText('Star')).toBeInTheDocument();
  });

  it('applies size padding correctly', () => {
    const icon = <span>★</span>;
    const { rerender } = render(
      <IconButton icon={icon} aria-label="Star" size="sm" />
    );
    expect(screen.getByLabelText('Star')).toHaveClass('p-1.5');

    rerender(<IconButton icon={icon} aria-label="Star" size="md" />);
    expect(screen.getByLabelText('Star')).toHaveClass('p-2');

    rerender(<IconButton icon={icon} aria-label="Star" size="lg" />);
    expect(screen.getByLabelText('Star')).toHaveClass('p-3');
  });

  it('handles click events', () => {
    const handleClick = vi.fn();
    const icon = <span>★</span>;

    render(<IconButton icon={icon} aria-label="Star" onClick={handleClick} />);

    fireEvent.click(screen.getByLabelText('Star'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});

describe('ButtonGroup', () => {
  it('renders multiple buttons', () => {
    render(
      <ButtonGroup>
        <Button>First</Button>
        <Button>Second</Button>
        <Button>Third</Button>
      </ButtonGroup>
    );

    expect(screen.getByText('First')).toBeInTheDocument();
    expect(screen.getByText('Second')).toBeInTheDocument();
    expect(screen.getByText('Third')).toBeInTheDocument();
  });

  it('applies correct border radius classes', () => {
    render(
      <ButtonGroup>
        <Button>First</Button>
        <Button>Second</Button>
        <Button>Third</Button>
      </ButtonGroup>
    );

    expect(screen.getByText('First')).toHaveClass('rounded-r-none');
    expect(screen.getByText('Second')).toHaveClass('rounded-none');
    expect(screen.getByText('Third')).toHaveClass('rounded-l-none');
  });

  it('handles non-button children gracefully', () => {
    render(
      <ButtonGroup>
        <Button>Button</Button>
        <span>Not a button</span>
      </ButtonGroup>
    );

    expect(screen.getByText('Button')).toBeInTheDocument();
    expect(screen.getByText('Not a button')).toBeInTheDocument();
  });
});
