import { clsx } from 'clsx';
import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
	variant?: 'danger' | 'ghost' | 'outline' | 'primary' | 'secondary';
	size?: 'lg' | 'md' | 'sm';
	isLoading?: boolean;
	leftIcon?: React.ReactNode;
	rightIcon?: React.ReactNode;
	fullWidth?: boolean;
}

export function Button({ children, className = '', variant = 'primary', size = 'md', isLoading = false, leftIcon, rightIcon, fullWidth = false, disabled, ...props }: ButtonProps) {
	const baseStyles = 'inline-flex items-center justify-center font-medium rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';

	const variants = {
		primary: 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500 dark:bg-blue-500 dark:hover:bg-blue-600',
		secondary: 'bg-gray-200 text-gray-900 hover:bg-gray-300 focus:ring-gray-500 dark:bg-gray-700 dark:text-gray-100 dark:hover:bg-gray-600',
		outline: 'border border-gray-300 text-gray-700 hover:bg-gray-50 focus:ring-gray-500 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800',
		ghost: 'text-gray-700 hover:bg-gray-100 focus:ring-gray-500 dark:text-gray-300 dark:hover:bg-gray-800',
		danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500 dark:bg-red-500 dark:hover:bg-red-600',
	};

	const sizes = {
		sm: 'px-3 py-1.5 text-sm gap-1.5',
		md: 'px-4 py-2 text-base gap-2',
		lg: 'px-6 py-3 text-lg gap-2.5',
	};

	return (
		<button className={clsx(baseStyles, variants[variant], sizes[size], fullWidth && 'w-full', className)} disabled={disabled || isLoading} {...props}>
			{isLoading ? (
				<>
					<svg className='animate-spin h-4 w-4' xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24'>
						<circle className='opacity-25' cx='12' cy='12' r='10' stroke='currentColor' strokeWidth='4' />
						<path className='opacity-75' fill='currentColor' d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z' />
					</svg>
					<span>Loading...</span>
				</>
			) : (
				<>
					{leftIcon !== undefined && <span className='flex-shrink-0'>{leftIcon}</span>}
					{children}
					{rightIcon !== undefined && <span className='flex-shrink-0'>{rightIcon}</span>}
				</>
			)}
		</button>
	);
}

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
