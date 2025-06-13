'use client';

import { motion } from 'framer-motion';
import React from 'react';

interface SettingsModalProps {
	isOpen: boolean;
	onClose: () => void;
	animationsEnabled: boolean;
	onAnimationToggle: (enabled: boolean) => void;
}

export function SettingsModal({ isOpen, onClose, animationsEnabled, onAnimationToggle }: SettingsModalProps) {
	if (!isOpen) return null;

	return (
		<div className='fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4' onClick={onClose}>
			<motion.div
				initial={{ scale: 0.9, opacity: 0 }}
				animate={{ scale: 1, opacity: 1 }}
				exit={{ scale: 0.9, opacity: 0 }}
				transition={{ type: 'spring', stiffness: 300, damping: 30 }}
				className='relative w-full max-w-md rounded-xl bg-background shadow-2xl border border-border'
				onClick={(e) => {
					e.stopPropagation();
				}}
			>
				{/* Header */}
				<div className='border-b border-border px-6 py-4'>
					<h2 className='text-lg font-semibold text-foreground'>Settings</h2>
				</div>

				{/* Content */}
				<div className='p-6'>
					<div className='space-y-4'>
						{/* Animations Toggle */}
						<div className='flex items-center justify-between'>
							<div>
								<h3 className='text-sm font-medium text-foreground'>Animations</h3>
								<p className='text-xs text-muted-foreground mt-1'>{animationsEnabled ? 'Smooth transitions and effects are currently enabled' : 'Smooth transitions and effects are currently disabled'}</p>
							</div>
							<button
								type='button'
								onClick={() => {
									onAnimationToggle(!animationsEnabled);
								}}
								className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${animationsEnabled ? 'bg-primary' : 'bg-secondary'}`}
							>
								<span className='sr-only'>Toggle animations</span>
								<span className={`inline-block h-4 w-4 transform rounded-full bg-background shadow-lg transition-transform ${animationsEnabled ? 'translate-x-6' : 'translate-x-1'}`} />
							</button>
						</div>

						{/* Add more settings here in the future */}
					</div>
				</div>

				{/* Footer */}
				<div className='border-t border-border px-6 py-4 flex justify-end'>
					<button type='button' onClick={onClose} className='px-4 py-2 text-sm font-medium text-foreground bg-secondary hover:bg-secondary/80 rounded-lg transition-colors'>
						Close
					</button>
				</div>
			</motion.div>
		</div>
	);
}
