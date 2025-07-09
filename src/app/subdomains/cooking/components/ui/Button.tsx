import { clsx } from 'clsx';
import type { ButtonHTMLAttributes, ReactNode } from 'react';
import React, { forwardRef } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
	variant?: 'ghost' | 'outline' | 'primary' | 'secondary';
	size?: 'lg' | 'md' | 'sm';
	leftIcon?: ReactNode;
	rightIcon?: ReactNode;
	isLoading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(({ children, className = '', variant = 'primary', size = 'md', leftIcon, rightIcon, isLoading, disabled, ...props }, ref) => {
	const baseStyles = 'inline-flex items-center justify-center font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';

	const variants = {
		primary: 'bg-primary text-primary-foreground hover:bg-primary/90 focus:ring-primary',
		secondary: 'bg-muted text-muted-foreground hover:bg-muted/80 focus:ring-muted',
		outline: 'border border-border text-foreground hover:bg-muted focus:ring-ring',
		ghost: 'text-foreground hover:bg-muted focus:ring-ring',
	};

	const sizes = {
		sm: 'px-3 py-1.5 text-sm',
		md: 'px-4 py-2 text-base',
		lg: 'px-6 py-3 text-lg',
	};

	return (
		<button ref={ref} className={clsx(baseStyles, variants[variant], sizes[size], className)} disabled={disabled ?? isLoading} {...props}>
			{isLoading ? (
				<>
					<svg className='animate-spin -ml-1 mr-2 h-4 w-4' fill='none' viewBox='0 0 24 24'>
						<circle className='opacity-25' cx='12' cy='12' r='10' stroke='currentColor' strokeWidth='4' />
						<path className='opacity-75' fill='currentColor' d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z' />
					</svg>
					Loading...
				</>
			) : (
				<>
					{leftIcon && <span className='mr-2'>{leftIcon}</span>}
					{children}
					{rightIcon && <span className='ml-2'>{rightIcon}</span>}
				</>
			)}
		</button>
	);
});

Button.displayName = 'Button';

interface IconButtonProps extends Omit<ButtonProps, 'fullWidth' | 'leftIcon' | 'rightIcon'> {
	icon: React.ReactNode;
	'aria-label': string;
}

export function IconButton({ icon, className = '', size = 'md', ...props }: IconButtonProps) {
	const iconSizes = {
		sm: 'p-1.5',
		md: 'p-2',
		lg: 'p-3',
	};

	return (
		<Button className={clsx(iconSizes[size], className)} size={size} {...props}>
			{icon}
		</Button>
	);
}

// Button Group Component
interface ButtonGroupProps {
	children: React.ReactNode;
	className?: string;
}

export function ButtonGroup({ children, className = '' }: ButtonGroupProps) {
	return (
		<div className={clsx('inline-flex -space-x-px', className)}>
			{React.Children.map(children, (child, index) => {
				if (React.isValidElement<ButtonProps>(child)) {
					const existingClassName = child.props.className !== undefined && child.props.className !== null ? child.props.className : '';
					const newClassName = clsx(existingClassName, index === 0 && 'rounded-r-none', index === React.Children.count(children) - 1 && 'rounded-l-none', index !== 0 && index !== React.Children.count(children) - 1 && 'rounded-none');

					return React.cloneElement(child, {
						...child.props,
						className: newClassName,
					});
				}
				return child;
			})}
		</div>
	);
}
