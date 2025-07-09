'use client';

import { clsx } from 'clsx';
import type { ReactNode } from 'react';
import React, { useEffect } from 'react';

import { XIcon } from '../Icons';

interface ModalProps {
	isOpen: boolean;
	onClose: () => void;
	title?: string;
	children: ReactNode;
	size?: 'lg' | 'md' | 'sm' | 'xl';
	showCloseButton?: boolean;
	onBackdropClick?: boolean;
	className?: string;
}

export function Modal({ isOpen, onClose, title, children, size = 'md', showCloseButton = true, onBackdropClick = true, className }: ModalProps) {
	// Handle escape key
	useEffect(() => {
		const handleEscape = (e: KeyboardEvent) => {
			if (e.key === 'Escape' && isOpen) {
				onClose();
			}
		};

		if (isOpen) {
			document.addEventListener('keydown', handleEscape);
			// Prevent body scroll when modal is open
			document.body.style.overflow = 'hidden';
		}

		return () => {
			document.removeEventListener('keydown', handleEscape);
			document.body.style.overflow = '';
		};
	}, [isOpen, onClose]);

	if (!isOpen) return null;

	const sizeClasses = {
		sm: 'max-w-md',
		md: 'max-w-lg',
		lg: 'max-w-2xl',
		xl: 'max-w-4xl',
	};

	return (
		<>
			{/* Backdrop */}
			<div className='fixed inset-0 bg-background/80 backdrop-blur-sm z-40 animate-fade-in' onClick={onBackdropClick ? onClose : undefined} aria-hidden='true' />

			{/* Modal */}
			<div className='fixed inset-0 z-50 flex items-center justify-center p-4'>
				<div className={clsx('relative w-full bg-card rounded-lg shadow-xl', 'animate-scale-in transform transition-all', sizeClasses[size], className)} role='dialog' aria-modal='true' aria-labelledby={title !== undefined && title !== null && title !== '' ? 'modal-title' : undefined}>
					{/* Header */}
					{((title !== undefined && title !== null && title !== '') || showCloseButton) && (
						<div className='flex items-center justify-between p-4 border-b border-border'>
							{title !== undefined && title !== null && title !== '' && (
								<h2 id='modal-title' className='text-lg font-semibold text-card-foreground'>
									{title}
								</h2>
							)}
							{showCloseButton && (
								<button onClick={onClose} className='ml-auto p-1 rounded-lg hover:bg-muted transition-colors' aria-label='Close modal'>
									<XIcon size={20} className='text-muted-foreground' />
								</button>
							)}
						</div>
					)}

					{/* Content */}
					<div className='p-4 max-h-[70vh] overflow-y-auto'>{children}</div>
				</div>
			</div>
		</>
	);
}

// Modal Footer component for consistent styling
interface ModalFooterProps {
	children: ReactNode;
	className?: string;
}

export function ModalFooter({ children, className }: ModalFooterProps) {
	return <div className={clsx('flex items-center justify-end gap-2 p-4 border-t border-border -mx-4 -mb-4 mt-4', className)}>{children}</div>;
}

// Modal Section component for better organization
interface ModalSectionProps {
	title?: string;
	children: ReactNode;
	className?: string;
}

export function ModalSection({ title, children, className }: ModalSectionProps) {
	return (
		<div className={clsx('mb-4 last:mb-0', className)}>
			{title !== undefined && title !== null && title !== '' && <h3 className='text-sm font-medium text-muted-foreground mb-2'>{title}</h3>}
			{children}
		</div>
	);
}
