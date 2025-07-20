import { clsx } from 'clsx';
import React, { forwardRef } from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
	label?: string;
	error?: string;
	helperText?: string;
	leftIcon?: React.ReactNode;
	rightIcon?: React.ReactNode;
	variant?: 'default' | 'filled' | 'floating';
	fullWidth?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(({ label, error, helperText, leftIcon, rightIcon, variant = 'default', fullWidth = true, className = '', id, ...props }, ref) => {
	const inputId = id ?? `input-${Math.random().toString(36).substr(2, 9)}`;
	const [isFocused, setIsFocused] = React.useState(false);
	const hasValue = props.value !== undefined && props.value !== '';

	const baseStyles = clsx(
		'rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-0',
		fullWidth && 'w-full'
	);

	const variants = {
		default: clsx(
			'border bg-white dark:bg-cooking-neutral-800', 
			error ? 'border-red-500 focus:ring-red-500' : 'border-cooking-neutral-300 focus:ring-cooking-primary focus:border-cooking-primary hover:border-cooking-neutral-400'
		),
		filled: clsx(
			'border-0 bg-cooking-neutral-100 dark:bg-cooking-neutral-700', 
			error ? 'ring-2 ring-red-500 focus:ring-red-500' : 'focus:ring-cooking-primary hover:bg-cooking-neutral-200'
		),
		floating: clsx(
			'border bg-white dark:bg-cooking-neutral-800 pt-6 pb-2',
			error ? 'border-red-500 focus:ring-red-500' : 'border-cooking-neutral-300 focus:ring-cooking-primary focus:border-cooking-primary'
		),
	};

	const paddingStyles = clsx(
		leftIcon !== undefined ? 'pl-10' : 'pl-4', 
		rightIcon !== undefined ? 'pr-10' : 'pr-4', 
		variant !== 'floating' && 'py-3'
	);

	return (
		<div className={clsx(fullWidth && 'w-full')}>
			{variant !== 'floating' && label && (
				<label htmlFor={inputId} className='block text-sm font-medium text-cooking-neutral-700 dark:text-cooking-neutral-300 mb-2'>
					{label}
				</label>
			)}

			<div className='relative'>
				{leftIcon && (
					<div className='absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-cooking-neutral-500'>
						{leftIcon}
					</div>
				)}

				<input 
					ref={ref} 
					id={inputId} 
					className={clsx(
						baseStyles, 
						variants[variant], 
						paddingStyles, 
						'text-cooking-neutral-900 dark:text-cooking-neutral-100 placeholder-cooking-neutral-400',
						'disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-cooking-neutral-50',
						'text-base',
						className
					)}
					onFocus={() => setIsFocused(true)}
					onBlur={() => setIsFocused(false)}
					{...props} 
				/>

				{variant === 'floating' && label && (
					<label 
						htmlFor={inputId} 
						className={clsx(
							'absolute left-4 transition-all duration-200 pointer-events-none',
							(isFocused || hasValue) 
								? 'top-2 text-xs text-cooking-primary' 
								: 'top-4 text-base text-cooking-neutral-500'
						)}
					>
						{label}
					</label>
				)}

				{rightIcon && (
					<div className='absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-cooking-neutral-500'>
						{rightIcon}
					</div>
				)}
			</div>

			{(error || helperText) && (
				<p className={clsx(
					'mt-2 text-sm',
					error ? 'text-red-600' : 'text-cooking-neutral-500'
				)}>
					{error || helperText}
				</p>
			)}
		</div>
	);
});

Input.displayName = 'Input';

// Textarea Component
interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
	label?: string;
	error?: string;
	helperText?: string;
	variant?: 'default' | 'filled';
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(({ label, error, helperText, variant = 'default', className = '', id, ...props }, ref) => {
	const textareaId = id ?? `textarea-${Math.random().toString(36).substr(2, 9)}`;

	const baseStyles = 'w-full rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-0 resize-none min-h-[100px]';

	const variants = {
		default: clsx(
			'border bg-white dark:bg-cooking-neutral-800', 
			error ? 'border-red-500 focus:ring-red-500' : 'border-cooking-neutral-300 focus:ring-cooking-primary focus:border-cooking-primary hover:border-cooking-neutral-400'
		),
		filled: clsx(
			'border-0 bg-cooking-neutral-100 dark:bg-cooking-neutral-700', 
			error ? 'ring-2 ring-red-500 focus:ring-red-500' : 'focus:ring-cooking-primary hover:bg-cooking-neutral-200'
		),
	};

	return (
		<div className='w-full'>
			{label && (
				<label htmlFor={textareaId} className='block text-sm font-medium text-cooking-neutral-700 dark:text-cooking-neutral-300 mb-2'>
					{label}
				</label>
			)}

			<textarea 
				ref={ref} 
				id={textareaId} 
				className={clsx(
					baseStyles, 
					variants[variant], 
					'px-4 py-3', 
					'text-cooking-neutral-900 dark:text-cooking-neutral-100 placeholder-cooking-neutral-400',
					'disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-cooking-neutral-50',
					'text-base',
					className
				)} 
				{...props} 
			/>

			{(error || helperText) && (
				<p className={clsx(
					'mt-2 text-sm',
					error ? 'text-red-600' : 'text-cooking-neutral-500'
				)}>
					{error || helperText}
				</p>
			)}
		</div>
	);
});

Textarea.displayName = 'Textarea';

// Select Component
interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
	label?: string;
	error?: string;
	helperText?: string;
	variant?: 'default' | 'filled';
	options: { value: string; label: string }[];
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(({ label, error, helperText, variant = 'default', options, className = '', id, ...props }, ref) => {
	const selectId = id ?? `select-${Math.random().toString(36).substr(2, 9)}`;

	const baseStyles = 'w-full rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-0 appearance-none cursor-pointer';

	const variants = {
		default: clsx('border bg-background', error !== undefined && error !== null && error !== '' ? 'border-destructive focus:ring-destructive' : 'border-border focus:ring-ring focus:border-ring'),
		filled: clsx('border-0 bg-muted', error !== undefined && error !== null && error !== '' ? 'ring-2 ring-destructive focus:ring-destructive' : 'focus:ring-ring'),
	};

	return (
		<div className='w-full'>
			{label !== undefined && label !== null && label !== '' && (
				<label htmlFor={selectId} className='block text-sm font-medium text-foreground mb-1'>
					{label}
				</label>
			)}

			<div className='relative'>
				<select ref={ref} id={selectId} className={clsx(baseStyles, variants[variant], 'px-3 py-2 pr-10', 'text-foreground', 'disabled:opacity-50 disabled:cursor-not-allowed', className)} {...props}>
					{options.map((option) => (
						<option key={option.value} value={option.value}>
							{option.label}
						</option>
					))}
				</select>

				<div className='absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-muted-foreground'>
					<svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
						<path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M19 9l-7 7-7-7' />
					</svg>
				</div>
			</div>

			{((error !== undefined && error !== null && error !== '') || (helperText !== undefined && helperText !== null && helperText !== '')) && <p className={clsx('mt-1 text-sm', error !== undefined && error !== null && error !== '' ? 'text-destructive' : 'text-muted-foreground')}>{error !== undefined && error !== null && error !== '' ? error : helperText}</p>}
		</div>
	);
});

Select.displayName = 'Select';
