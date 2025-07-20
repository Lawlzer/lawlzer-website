import { fireEvent, render, screen } from '@testing-library/react';
import React from 'react';
import { describe, expect, it, vi } from 'vitest';

import { Button, ButtonGroup, IconButton } from './Button';

describe('Button', () => {
	it('renders with children', () => {
		render(<Button>Click me</Button>);
		expect(screen.getByText('Click me')).toBeInTheDocument();
	});

	it('applies variant styles correctly', () => {
		const { rerender } = render(<Button variant='primary'>Primary</Button>);
		expect(screen.getByRole('button')).toHaveClass('bg-cooking-primary');

		rerender(<Button variant='secondary'>Secondary</Button>);
		expect(screen.getByRole('button')).toHaveClass('bg-cooking-secondary');

		rerender(<Button variant='outline'>Outline</Button>);
		expect(screen.getByRole('button')).toHaveClass('border-2');

		rerender(<Button variant='ghost'>Ghost</Button>);
		expect(screen.getByRole('button')).toHaveClass('hover:bg-cooking-neutral-100');
	});

	it('applies size styles correctly', () => {
		const { rerender } = render(<Button size='sm'>Small</Button>);
		expect(screen.getByRole('button')).toHaveClass('text-sm');

		rerender(<Button size='md'>Medium</Button>);
		expect(screen.getByRole('button')).toHaveClass('text-base');

		rerender(<Button size='lg'>Large</Button>);
		expect(screen.getByRole('button')).toHaveClass('text-lg');
	});

	it('handles click events', () => {
		const handleClick = vi.fn();

		render(<Button onClick={handleClick}>Click me</Button>);

		fireEvent.click(screen.getByText('Click me'));
		expect(handleClick).toHaveBeenCalledTimes(1);
	});

	it('disables button when disabled prop is true', () => {
		render(<Button disabled>Disabled</Button>);

		const button = screen.getByRole('button');
		expect(button).toBeDisabled();
		expect(button).toHaveClass('disabled:opacity-50');
	});

	it('shows loading state', () => {
		render(<Button isLoading>Loading</Button>);

		expect(screen.getByText('Loading...')).toBeInTheDocument();
		expect(screen.getByRole('button')).toBeDisabled();
	});

	it('renders with left icon', () => {
		const icon = <span data-testid='left-icon'>←</span>;
		render(<Button leftIcon={icon}>With Icon</Button>);

		expect(screen.getByTestId('left-icon')).toBeInTheDocument();
		expect(screen.getByText('With Icon')).toBeInTheDocument();
	});

	it('renders with right icon', () => {
		const icon = <span data-testid='right-icon'>→</span>;
		render(<Button rightIcon={icon}>With Icon</Button>);

		expect(screen.getByTestId('right-icon')).toBeInTheDocument();
		expect(screen.getByText('With Icon')).toBeInTheDocument();
	});

	it('applies custom className', () => {
		render(<Button className='custom-class'>Custom</Button>);
		expect(screen.getByRole('button')).toHaveClass('custom-class');
	});
});

describe('IconButton', () => {
	it('renders with icon and aria-label', () => {
		const icon = <span data-testid='icon'>★</span>;
		render(<IconButton icon={icon} aria-label='Star' />);

		expect(screen.getByTestId('icon')).toBeInTheDocument();
		expect(screen.getByLabelText('Star')).toBeInTheDocument();
	});

	it('applies size padding correctly', () => {
		const icon = <span>★</span>;
		const { rerender } = render(<IconButton icon={icon} aria-label='Star' size='sm' />);
		expect(screen.getByLabelText('Star')).toHaveClass('p-1.5');

		rerender(<IconButton icon={icon} aria-label='Star' size='md' />);
		expect(screen.getByLabelText('Star')).toHaveClass('p-2');

		rerender(<IconButton icon={icon} aria-label='Star' size='lg' />);
		expect(screen.getByLabelText('Star')).toHaveClass('p-3');
	});

	it('handles click events', () => {
		const handleClick = vi.fn();
		const icon = <span>★</span>;

		render(<IconButton icon={icon} aria-label='Star' onClick={handleClick} />);

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

		const buttons = screen.getAllByRole('button');
		expect(buttons[0]).toHaveClass('rounded-r-none');
		expect(buttons[1]).toHaveClass('rounded-none');
		expect(buttons[2]).toHaveClass('rounded-l-none');
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
