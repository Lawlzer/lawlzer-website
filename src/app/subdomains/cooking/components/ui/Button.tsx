import { clsx } from 'clsx';
import type { ButtonHTMLAttributes, ReactNode } from 'react';
import React, { forwardRef } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
	variant?: 'ghost' | 'outline' | 'primary' | 'secondary' | 'success' | 'danger' | 'warning';
	size?: 'lg' | 'md' | 'sm' | 'xs';
	leftIcon?: ReactNode;
	rightIcon?: ReactNode;
	isLoading?: boolean;
	fullWidth?: boolean;
	animated?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(({ children, className = '', variant = 'primary', size = 'md', leftIcon, rightIcon, isLoading, disabled, fullWidth, animated = true, ...props }, ref) => {
	const baseStyles = clsx(
		'inline-flex items-center justify-center font-medium rounded-lg transition-all duration-200 ease-out',
		'focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed',
		'relative overflow-hidden transform-gpu',
		fullWidth && 'w-full',
		animated && 'hover:scale-105 active:scale-95'
	);

	const variants = {
		primary: 'bg-cooking-primary text-white hover:bg-cooking-primary-hover focus:ring-cooking-primary shadow-md hover:shadow-lg',
		secondary: 'bg-cooking-secondary text-white hover:bg-cooking-secondary-hover focus:ring-cooking-secondary shadow-md hover:shadow-lg',
		outline: 'border-2 border-cooking-primary text-cooking-primary hover:bg-cooking-primary hover:text-white focus:ring-cooking-primary',
		ghost: 'text-cooking-neutral-700 hover:bg-cooking-neutral-100 focus:ring-cooking-neutral-400',
		success: 'bg-cooking-secondary text-white hover:bg-cooking-secondary-hover focus:ring-cooking-secondary shadow-md hover:shadow-lg',
		danger: 'bg-cooking-accent text-white hover:bg-cooking-accent-hover focus:ring-cooking-accent shadow-md hover:shadow-lg',
		warning: 'bg-cooking-calories text-white hover:bg-amber-600 focus:ring-amber-500 shadow-md hover:shadow-lg',
	};

	const sizes = {
		xs: 'px-2.5 py-1 text-xs',
		sm: 'px-3 py-1.5 text-sm',
		md: 'px-4 py-2 text-base',
		lg: 'px-6 py-3 text-lg',
	};

	return (
		<button ref={ref} className={clsx(baseStyles, variants[variant], sizes[size], className)} disabled={disabled ?? isLoading} {...props}>
			{/* Ripple effect background */}
			<span className="absolute inset-0 overflow-hidden rounded-lg">
				<span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full hover:translate-x-full transition-transform duration-700" />
			</span>
			
			{/* Button content */}
			<span className="relative flex items-center justify-center">
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
						{leftIcon && <span className='mr-2 flex items-center'>{leftIcon}</span>}
						{children}
						{rightIcon && <span className='ml-2 flex items-center'>{rightIcon}</span>}
					</>
				)}
			</span>
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
		xs: 'p-1',
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
