import { render, screen } from '@testing-library/react';
import React from 'react';
import { describe, expect, it } from 'vitest';

import { Card, CardContent, CardHeader, StatCard, CardBadge, CardImage } from './Card';

describe('Card', () => {
	it('renders with default variant', () => {
		render(<Card>Card content</Card>);
		
		const card = screen.getByText('Card content');
		expect(card).toHaveClass('bg-white');
		expect(card).toHaveClass('border-cooking-neutral-200');
	});

	it('applies elevated variant styles', () => {
		render(<Card variant="elevated">Elevated card</Card>);
		
		const card = screen.getByText('Elevated card');
		expect(card).toHaveClass('shadow-lg');
		expect(card).toHaveClass('hover:shadow-xl');
	});

	it('applies recipe variant styles', () => {
		render(<Card variant="recipe">Recipe card</Card>);
		
		const card = screen.getByText('Recipe card');
		expect(card).toHaveClass('hover:scale-105');
		expect(card).toHaveClass('cursor-pointer');
	});

	it('applies custom className', () => {
		render(<Card className="custom-class">Card</Card>);
		
		const card = screen.getByText('Card');
		expect(card).toHaveClass('custom-class');
	});

	it('renders children correctly', () => {
		render(
			<Card>
				<h2>Title</h2>
				<p>Content</p>
			</Card>
		);
		
		expect(screen.getByText('Title')).toBeInTheDocument();
		expect(screen.getByText('Content')).toBeInTheDocument();
	});
});

describe('CardHeader', () => {
	it('renders with title as string', () => {
		render(<CardHeader>Header Title</CardHeader>);
		
		expect(screen.getByText('Header Title')).toBeInTheDocument();
	});

	it('renders with children elements', () => {
		render(
			<CardHeader>
				<h3>Custom Header</h3>
			</CardHeader>
		);
		
		expect(screen.getByText('Custom Header')).toBeInTheDocument();
	});

	it('renders with icon', () => {
		const icon = <span data-testid="header-icon">📊</span>;
		render(<CardHeader icon={icon}>Header</CardHeader>);
		
		expect(screen.getByTestId('header-icon')).toBeInTheDocument();
		expect(screen.getByText('Header')).toBeInTheDocument();
	});

	it('renders with action button', () => {
		const action = <button>Action</button>;
		render(<CardHeader action={action}>Header</CardHeader>);
		
		expect(screen.getByText('Action')).toBeInTheDocument();
		expect(screen.getByText('Header')).toBeInTheDocument();
	});

	it('renders with both icon and action', () => {
		const icon = <span data-testid="icon">📊</span>;
		const action = <button>Click</button>;
		
		render(
			<CardHeader icon={icon} action={action}>
				Title
			</CardHeader>
		);
		
		expect(screen.getByTestId('icon')).toBeInTheDocument();
		expect(screen.getByText('Click')).toBeInTheDocument();
		expect(screen.getByText('Title')).toBeInTheDocument();
	});

	it('applies correct styling classes', () => {
		render(<CardHeader>Header</CardHeader>);
		
		const header = screen.getByText('Header').parentElement;
		expect(header).toHaveClass('p-6');
		expect(header).toHaveClass('border-b');
		expect(header).toHaveClass('border-cooking-neutral-100');
	});
});

describe('CardContent', () => {
	it('renders children', () => {
		render(
			<CardContent>
				<p>Card content text</p>
			</CardContent>
		);
		
		expect(screen.getByText('Card content text')).toBeInTheDocument();
	});

	it('applies correct padding', () => {
		render(<CardContent>Content</CardContent>);
		
		const content = screen.getByText('Content').parentElement;
		expect(content).toHaveClass('p-6');
	});

	it('applies custom className', () => {
		render(<CardContent className="custom-padding">Content</CardContent>);
		
		const content = screen.getByText('Content').parentElement;
		expect(content).toHaveClass('custom-padding');
	});
});

describe('StatCard', () => {
	const defaultProps = {
		title: 'Total Sales',
		value: '$1,234',
		subtitle: 'This month'
	};

	it('renders all required props', () => {
		render(<StatCard {...defaultProps} />);
		
		expect(screen.getByText('Total Sales')).toBeInTheDocument();
		expect(screen.getByText('$1,234')).toBeInTheDocument();
		expect(screen.getByText('This month')).toBeInTheDocument();
	});

	it('renders with icon', () => {
		const icon = <span data-testid="stat-icon">💰</span>;
		render(<StatCard {...defaultProps} icon={icon} />);
		
		expect(screen.getByTestId('stat-icon')).toBeInTheDocument();
	});

	it('renders positive trend', () => {
		render(<StatCard {...defaultProps} trend={{ value: 12, isPositive: true }} />);
		
		expect(screen.getByText('+12%')).toBeInTheDocument();
		expect(screen.getByText('+12%')).toHaveClass('text-green-600');
	});

	it('renders negative trend', () => {
		render(<StatCard {...defaultProps} trend={{ value: 8, isPositive: false }} />);
		
		expect(screen.getByText('-8%')).toBeInTheDocument();
		expect(screen.getByText('-8%')).toHaveClass('text-red-600');
	});

	it('applies hover effects', () => {
		const { container } = render(<StatCard {...defaultProps} />);
		
		const card = container.firstChild;
		expect(card).toHaveClass('hover:shadow-md');
		expect(card).toHaveClass('transition-shadow');
	});

	it('handles long values gracefully', () => {
		render(
			<StatCard
				title="Very Long Title That Might Wrap"
				value="$1,234,567,890.00"
				subtitle="A very detailed subtitle with lots of information"
			/>
		);
		
		expect(screen.getByText('Very Long Title That Might Wrap')).toBeInTheDocument();
		expect(screen.getByText('$1,234,567,890.00')).toBeInTheDocument();
	});
});

describe('CardBadge', () => {
	it('renders with text', () => {
		render(<CardBadge>New</CardBadge>);
		
		expect(screen.getByText('New')).toBeInTheDocument();
	});

	it('applies default variant styles', () => {
		render(<CardBadge>Badge</CardBadge>);
		
		const badge = screen.getByText('Badge');
		expect(badge).toHaveClass('bg-cooking-primary');
		expect(badge).toHaveClass('text-white');
	});

	it('applies secondary variant styles', () => {
		render(<CardBadge variant="secondary">Secondary</CardBadge>);
		
		const badge = screen.getByText('Secondary');
		expect(badge).toHaveClass('bg-cooking-secondary');
		expect(badge).toHaveClass('text-white');
	});

	it('applies outline variant styles', () => {
		render(<CardBadge variant="outline">Outline</CardBadge>);
		
		const badge = screen.getByText('Outline');
		expect(badge).toHaveClass('border');
		expect(badge).toHaveClass('border-cooking-neutral-300');
		expect(badge).toHaveClass('text-cooking-neutral-700');
	});

	it('has correct size and shape', () => {
		render(<CardBadge>Badge</CardBadge>);
		
		const badge = screen.getByText('Badge');
		expect(badge).toHaveClass('px-2');
		expect(badge).toHaveClass('py-1');
		expect(badge).toHaveClass('rounded-full');
		expect(badge).toHaveClass('text-xs');
	});
});

describe('CardImage', () => {
	it('renders image with src and alt', () => {
		render(<CardImage src="/test-image.jpg" alt="Test image" />);
		
		const img = screen.getByAltText('Test image');
		expect(img).toHaveAttribute('src', '/test-image.jpg');
	});

	it('renders placeholder when no src provided', () => {
		render(<CardImage alt="No image" />);
		
		expect(screen.getByText('No Image')).toBeInTheDocument();
		const placeholder = screen.getByText('No Image').parentElement;
		expect(placeholder).toHaveClass('bg-cooking-neutral-100');
	});

	it('applies correct aspect ratio', () => {
		const { container } = render(<CardImage src="/test.jpg" alt="Test" />);
		
		const wrapper = container.firstChild;
		expect(wrapper).toHaveClass('relative');
		expect(wrapper).toHaveClass('aspect-video');
	});

	it('applies hover overlay on recipe cards', () => {
		render(
			<Card variant="recipe">
				<CardImage src="/test.jpg" alt="Recipe" />
			</Card>
		);
		
		// The overlay should exist in recipe cards
		const overlay = document.querySelector('.group-hover\\:opacity-100');
		expect(overlay).toBeInTheDocument();
	});

	it('image has proper loading attributes', () => {
		render(<CardImage src="/test.jpg" alt="Test" />);
		
		const img = screen.getByAltText('Test');
		expect(img).toHaveAttribute('loading', 'lazy');
		expect(img).toHaveClass('object-cover');
		expect(img).toHaveClass('w-full');
		expect(img).toHaveClass('h-full');
	});

	it('applies rounded corners to top only', () => {
		render(<CardImage src="/test.jpg" alt="Test" />);
		
		const wrapper = screen.getByAltText('Test').parentElement?.parentElement;
		expect(wrapper).toHaveClass('rounded-t-xl');
	});
});

describe('Card composition', () => {
	it('works with all subcomponents together', () => {
		render(
			<Card variant="elevated">
				<CardHeader icon={<span>📊</span>} action={<button>Action</button>}>
					Card Title
				</CardHeader>
				<CardContent>
					<p>Card body content</p>
				</CardContent>
			</Card>
		);
		
		expect(screen.getByText('Card Title')).toBeInTheDocument();
		expect(screen.getByText('Card body content')).toBeInTheDocument();
		expect(screen.getByText('Action')).toBeInTheDocument();
	});

	it('recipe card with image and badge', () => {
		render(
			<Card variant="recipe">
				<CardImage src="/recipe.jpg" alt="Recipe" />
				<CardBadge>New</CardBadge>
				<CardContent>
					<h3>Recipe Name</h3>
				</CardContent>
			</Card>
		);
		
		expect(screen.getByAltText('Recipe')).toBeInTheDocument();
		expect(screen.getByText('New')).toBeInTheDocument();
		expect(screen.getByText('Recipe Name')).toBeInTheDocument();
	});
});