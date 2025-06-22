'use client';

import type { InputHTMLAttributes } from 'react';
import { forwardRef, useState } from 'react';

import { animations } from '../../utils/animations';

interface ValidatedInputProps extends InputHTMLAttributes<HTMLInputElement> {
	label?: string;
	error?: string;
	touched?: boolean;
	validate?: (value: string) => string | null;
	onValidate?: (error: string | null) => void;
	helperText?: string;
}

export const ValidatedInput = forwardRef<HTMLInputElement, ValidatedInputProps>(({ label, error, touched, validate, onValidate, helperText, className = '', onBlur, onChange, ...props }, ref) => {
	const [localTouched, setLocalTouched] = useState(false);
	const [localError, setLocalError] = useState<string | null>(null);

	const displayError = error ?? localError;
	const displayTouched = touched ?? localTouched;
	const showError = displayTouched && displayError !== null && displayError !== undefined && displayError !== '';

	const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
		setLocalTouched(true);
		if (validate !== undefined) {
			const validationError = validate(e.target.value);
			setLocalError(validationError);
			onValidate?.(validationError);
		}
		onBlur?.(e);
	};

	const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		onChange?.(e);
		if (displayTouched && validate !== undefined) {
			const validationError = validate(e.target.value);
			setLocalError(validationError);
			onValidate?.(validationError);
		}
	};

	return (
		<div className='space-y-2'>
			{label !== undefined && label !== null && label !== '' && <label className='text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70'>{label}</label>}
			<input
				ref={ref}
				className={`
            flex h-10 w-full rounded-md border bg-background px-3 py-2 text-sm
            ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium
            placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2
            focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed
            disabled:opacity-50 transition-colors
            ${showError ? 'border-red-500 focus-visible:ring-red-500' : 'border-input'}
            ${className}
          `}
				onBlur={handleBlur}
				onChange={handleChange}
				{...props}
			/>
			{(showError || (helperText !== undefined && helperText !== null && helperText !== '')) && <p className={`text-sm ${showError ? 'text-red-500' : 'text-muted-foreground'} ${animations.fadeIn}`}>{showError ? displayError : helperText}</p>}
		</div>
	);
});

ValidatedInput.displayName = 'ValidatedInput';
