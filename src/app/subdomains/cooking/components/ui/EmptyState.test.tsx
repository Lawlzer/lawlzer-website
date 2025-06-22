import { fireEvent, render, screen } from '@testing-library/react';
import React from 'react';
import { describe, expect, it, vi } from 'vitest';

import { EmptyState, ErrorEmptyState, NoDataEmptyState, NoRecipesEmptyState, NoSearchResultsEmptyState } from './EmptyState';

describe('EmptyState', () => {
	it('renders with title and description', () => {
		render(<EmptyState title='Test Title' description='Test description text' />);

		expect(screen.getByText('Test Title')).toBeInTheDocument();
		expect(screen.getByText('Test description text')).toBeInTheDocument();
	});

	it('renders custom icon when provided', () => {
		const CustomIcon = () => <div data-testid='custom-icon'>Icon</div>;
		render(<EmptyState title='Title' description='Description' icon={<CustomIcon />} />);

		expect(screen.getByTestId('custom-icon')).toBeInTheDocument();
	});

	it('renders primary action button', () => {
		const handleClick = vi.fn();
		render(
			<EmptyState
				title='Title'
				description='Description'
				action={{
					label: 'Click me',
					onClick: handleClick,
				}}
			/>
		);

		const button = screen.getByText('Click me');
		expect(button).toBeInTheDocument();
		expect(button).toHaveClass('bg-blue-500');

		fireEvent.click(button);
		expect(handleClick).toHaveBeenCalledTimes(1);
	});

	it('renders secondary action button with correct styling', () => {
		const handleClick = vi.fn();
		render(
			<EmptyState
				title='Title'
				description='Description'
				action={{
					label: 'Secondary',
					onClick: handleClick,
					variant: 'secondary',
				}}
			/>
		);

		const button = screen.getByText('Secondary');
		expect(button).toHaveClass('border');
		expect(button).not.toHaveClass('bg-blue-500');
	});

	it('renders both primary and secondary actions', () => {
		const handlePrimary = vi.fn();
		const handleSecondary = vi.fn();

		render(
			<EmptyState
				title='Title'
				description='Description'
				action={{
					label: 'Primary',
					onClick: handlePrimary,
				}}
				secondaryAction={{
					label: 'Secondary',
					onClick: handleSecondary,
				}}
			/>
		);

		expect(screen.getByText('Primary')).toBeInTheDocument();
		expect(screen.getByText('Secondary')).toBeInTheDocument();
	});

	it('applies custom className', () => {
		const { container } = render(<EmptyState title='Title' description='Description' className='custom-class' />);

		expect(container.firstChild).toHaveClass('custom-class');
	});
});

describe('NoRecipesEmptyState', () => {
	it('renders correct content for no recipes', () => {
		const handleCreate = vi.fn();
		render(<NoRecipesEmptyState onCreate={handleCreate} />);

		expect(screen.getByText('No recipes yet')).toBeInTheDocument();
		expect(screen.getByText('Create your first recipe to start building your cookbook')).toBeInTheDocument();

		const button = screen.getByText('Create Your First Recipe');
		fireEvent.click(button);
		expect(handleCreate).toHaveBeenCalledTimes(1);
	});
});

describe('NoSearchResultsEmptyState', () => {
	it('renders search term in description', () => {
		const handleClear = vi.fn();
		render(<NoSearchResultsEmptyState searchTerm='pizza' onClear={handleClear} />);

		expect(screen.getByText('No results found')).toBeInTheDocument();
		expect(screen.getByText('No items match "pizza". Try a different search term.')).toBeInTheDocument();

		const button = screen.getByText('Clear search');
		fireEvent.click(button);
		expect(handleClear).toHaveBeenCalledTimes(1);
	});
});

describe('NoDataEmptyState', () => {
	it('renders default message', () => {
		render(<NoDataEmptyState />);

		expect(screen.getByText('No data available')).toBeInTheDocument();
		expect(screen.getByText('Start by adding some items to see data here.')).toBeInTheDocument();
	});

	it('renders custom message when provided', () => {
		render(<NoDataEmptyState message='Custom empty message' />);

		expect(screen.getByText('Custom empty message')).toBeInTheDocument();
	});
});

describe('ErrorEmptyState', () => {
	it('renders error state without retry', () => {
		render(<ErrorEmptyState />);

		expect(screen.getByText('Something went wrong')).toBeInTheDocument();
		expect(screen.getByText('An error occurred while loading the data.')).toBeInTheDocument();
		expect(screen.queryByText('Try again')).not.toBeInTheDocument();
	});

	it('renders error state with retry button', () => {
		const handleRetry = vi.fn();
		render(<ErrorEmptyState onRetry={handleRetry} />);

		const button = screen.getByText('Try again');
		fireEvent.click(button);
		expect(handleRetry).toHaveBeenCalledTimes(1);
	});

	it('renders custom error message', () => {
		render(<ErrorEmptyState message='Network connection failed' />);

		expect(screen.getByText('Network connection failed')).toBeInTheDocument();
	});
});
