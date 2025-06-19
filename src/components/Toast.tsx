'use client';

import { CheckCircleIcon, ExclamationCircleIcon, InformationCircleIcon, XCircleIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { AnimatePresence, motion } from 'framer-motion';
import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';

type ToastType = 'error' | 'info' | 'success' | 'warning';

interface Toast {
	id: string;
	message: string;
	type: ToastType;
	duration?: number;
}

interface ToastContextType {
	addToast: (message: string, type: ToastType, duration?: number) => void;
	removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | null>(null);

export function useToast() {
	const context = useContext(ToastContext);
	if (!context) {
		throw new Error('useToast must be used within a ToastProvider');
	}
	return context;
}

const icons = {
	success: CheckCircleIcon,
	error: XCircleIcon,
	warning: ExclamationCircleIcon,
	info: InformationCircleIcon,
};

const colors = {
	success: 'from-primary/20 to-primary/10 border-primary/30 text-primary',
	error: 'from-destructive/20 to-destructive/10 border-destructive/30 text-destructive',
	warning: 'from-accent/20 to-accent/10 border-accent/30 text-accent',
	info: 'from-muted/20 to-muted/10 border-border text-muted-foreground',
};

function ToastItem({ toast, onRemove }: { toast: Toast; onRemove: () => void }) {
	const Icon = icons[toast.type];

	useEffect(() => {
		if (toast.duration !== undefined && toast.duration > 0) {
			const timer = setTimeout(() => {
				onRemove();
			}, toast.duration);
			return () => {
				clearTimeout(timer);
			};
		}
	}, [toast.duration, onRemove]);

	return (
		<motion.div layout initial={{ opacity: 0, y: 50, scale: 0.3 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, scale: 0.5, transition: { duration: 0.2 } }} className={`pointer-events-auto relative overflow-hidden rounded-xl border bg-gradient-to-r backdrop-blur-sm shadow-lg ${colors[toast.type]}`}>
			<div className='flex items-start gap-3 p-4'>
				<Icon className='h-5 w-5 flex-shrink-0 mt-0.5' />
				<p className='flex-1 text-sm font-medium'>{toast.message}</p>
				<button onClick={onRemove} className='flex-shrink-0 rounded-md p-1 hover:bg-foreground/10 transition-colors'>
					<XMarkIcon className='h-4 w-4' />
				</button>
			</div>
			<motion.div className='absolute bottom-0 left-0 h-1 bg-current opacity-20' initial={{ width: '100%' }} animate={{ width: '0%' }} transition={{ duration: (toast.duration ?? 5000) / 1000, ease: 'linear' }} />
		</motion.div>
	);
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
	const [toasts, setToasts] = useState<Toast[]>([]);

	const addToast = useCallback((message: string, type: ToastType, duration = 5000) => {
		const id = Date.now().toString();
		setToasts((prev) => [...prev, { id, message, type, duration }]);
	}, []);

	const removeToast = useCallback((id: string) => {
		setToasts((prev) => prev.filter((toast) => toast.id !== id));
	}, []);

	return (
		<ToastContext.Provider value={{ addToast, removeToast }}>
			{children}
			<div className='fixed bottom-4 right-4 z-50 pointer-events-none'>
				<AnimatePresence>
					{toasts.map((toast) => (
						<ToastItem
							key={toast.id}
							toast={toast}
							onRemove={() => {
								removeToast(toast.id);
							}}
						/>
					))}
				</AnimatePresence>
			</div>
		</ToastContext.Provider>
	);
}
