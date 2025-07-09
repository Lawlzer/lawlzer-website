import { clsx } from 'clsx';
import React, { forwardRef } from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
	label?: string;
	error?: string;
	helperText?: string;
	leftIcon?: React.ReactNode;
	rightIcon?: React.ReactNode;
	variant?: 'default' | 'filled';
}

export const Input = forwardRef<HTMLInputElement, InputProps>(({ label, error, helperText, leftIcon, rightIcon, variant = 'default', className = '', id, ...props }, ref) => {
	const inputId = id ?? `input-${Math.random().toString(36).substr(2, 9)}`;

	const baseStyles = 'w-full rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-0';

	const variants = {
		default: clsx('border bg-background', error !== undefined && error !== null && error !== '' ? 'border-destructive focus:ring-destructive' : 'border-border focus:ring-ring focus:border-ring'),
		filled: clsx('border-0 bg-muted', error !== undefined && error !== null && error !== '' ? 'ring-2 ring-destructive focus:ring-destructive' : 'focus:ring-ring'),
	};

	const paddingStyles = clsx(leftIcon !== undefined ? 'pl-10' : 'pl-3', rightIcon !== undefined ? 'pr-10' : 'pr-3', 'py-2');

	return (
		<div className='w-full'>
			{label !== undefined && label !== null && label !== '' && (
				<label htmlFor={inputId} className='block text-sm font-medium text-foreground mb-1'>
					{label}
				</label>
			)}

			<div className='relative'>
				{leftIcon !== undefined && <div className='absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted-foreground'>{leftIcon}</div>}

				<input ref={ref} id={inputId} className={clsx(baseStyles, variants[variant], paddingStyles, 'text-foreground placeholder-muted-foreground', 'disabled:opacity-50 disabled:cursor-not-allowed', className)} {...props} />

				{rightIcon !== undefined && <div className='absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-muted-foreground'>{rightIcon}</div>}
			</div>

			{((error !== undefined && error !== null && error !== '') || (helperText !== undefined && helperText !== null && helperText !== '')) && <p className={clsx('mt-1 text-sm', error !== undefined && error !== null && error !== '' ? 'text-destructive' : 'text-muted-foreground')}>{error !== undefined && error !== null && error !== '' ? error : helperText}</p>}
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

	const baseStyles = 'w-full rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-0 resize-none';

	const variants = {
		default: clsx('border bg-background', error !== undefined && error !== null && error !== '' ? 'border-destructive focus:ring-destructive' : 'border-border focus:ring-ring focus:border-ring'),
		filled: clsx('border-0 bg-muted', error !== undefined && error !== null && error !== '' ? 'ring-2 ring-destructive focus:ring-destructive' : 'focus:ring-ring'),
	};

	return (
		<div className='w-full'>
			{label !== undefined && label !== null && label !== '' && (
				<label htmlFor={textareaId} className='block text-sm font-medium text-foreground mb-1'>
					{label}
				</label>
			)}

			<textarea ref={ref} id={textareaId} className={clsx(baseStyles, variants[variant], 'px-3 py-2', 'text-foreground placeholder-muted-foreground', 'disabled:opacity-50 disabled:cursor-not-allowed', className)} {...props} />

			{((error !== undefined && error !== null && error !== '') || (helperText !== undefined && helperText !== null && helperText !== '')) && <p className={clsx('mt-1 text-sm', error !== undefined && error !== null && error !== '' ? 'text-destructive' : 'text-muted-foreground')}>{error !== undefined && error !== null && error !== '' ? error : helperText}</p>}
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
