'use client';

import React, { useEffect, useState } from 'react';

import type { ToastMessage, ToastType } from '../hooks/useToast';

import { CheckIcon, XIcon } from './Icons';

// ExclamationTriangleIcon since it's not in our Icons file
const ExclamationTriangleIcon: React.FC<{ className?: string }> = ({ className }) => (
	<svg className={className} fill='none' stroke='currentColor' viewBox='0 0 24 24'>
		<path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z' />
	</svg>
);

export const ToastContainer: React.FC = () => {
	const [toasts, setToasts] = useState<ToastMessage[]>([]);

	const removeToast = (id: string) => {
		setToasts((prev) => prev.filter((toast) => toast.id !== id));
	};

	useEffect(() => {
		const handleShowToast = (event: CustomEvent<ToastMessage>) => {
			const newToast = event.detail;
			setToasts((prev) => [...prev, newToast]);

			// Auto remove after duration
			if (newToast.duration !== undefined && newToast.duration !== null && newToast.duration > 0) {
				setTimeout(() => {
					removeToast(newToast.id);
				}, newToast.duration);
			}
		};

		window.addEventListener('show-toast', handleShowToast as EventListener);
		return () => {
			window.removeEventListener('show-toast', handleShowToast as EventListener);
		};
	}, []);

	const getToastIcon = (type: ToastType) => {
		switch (type) {
			case 'success':
				return <CheckIcon className='w-5 h-5 text-green-500' />;
			case 'error':
				return <XIcon className='w-5 h-5 text-destructive' />;
			case 'warning':
				return <ExclamationTriangleIcon className='w-5 h-5 text-yellow-500' />;
			case 'info':
				return (
					<svg className='w-5 h-5 text-primary' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
						<path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z' />
					</svg>
				);
		}
	};

	const getToastStyles = (type: ToastType) => {
		const baseStyles = 'flex items-center w-full max-w-xs p-4 mb-4 rounded-lg shadow-lg bg-card text-card-foreground';

		switch (type) {
			case 'success':
				return `${baseStyles} border border-green-200 dark:border-green-800`;
			case 'error':
				return `${baseStyles} border border-destructive/20`;
			case 'warning':
				return `${baseStyles} border border-yellow-200 dark:border-yellow-800`;
			case 'info':
				return `${baseStyles} border border-primary/20`;
		}
	};

	if (toasts.length === 0) return null;

	return (
		<div className='fixed top-5 right-5 z-50 space-y-2'>
			{toasts.map((toast) => (
				<div key={toast.id} className={getToastStyles(toast.type)} role='alert'>
					<div className='inline-flex items-center justify-center flex-shrink-0 w-8 h-8'>{getToastIcon(toast.type)}</div>
					<div className='ml-3 text-sm font-normal flex-1'>{toast.message}</div>
					<button
						type='button'
						className='ml-auto -mx-1.5 -my-1.5 bg-card text-muted-foreground hover:text-foreground rounded-lg focus:ring-2 focus:ring-ring p-1.5 hover:bg-muted inline-flex h-8 w-8'
						onClick={() => {
							removeToast(toast.id);
						}}
						aria-label='Close'
					>
						<XIcon className='w-4 h-4' />
					</button>
				</div>
			))}
		</div>
	);
};
