'use client';

import { ChevronUpIcon } from '@heroicons/react/24/outline';
import React, { useEffect, useState } from 'react';

import { Button } from './ui/Button';

export default function BackToTop() {
	const [isVisible, setIsVisible] = useState(false);

	useEffect(() => {
		const toggleVisibility = () => {
			if (window.scrollY > 300) {
				setIsVisible(true);
			} else {
				setIsVisible(false);
			}
		};

		const throttle = (func: () => void, delay: number) => {
			let timeoutId: NodeJS.Timeout | null = null;
			let lastExecTime = 0;
			return () => {
				const currentTime = Date.now();
				if (currentTime - lastExecTime > delay) {
					func();
					lastExecTime = currentTime;
				} else {
					if (timeoutId) clearTimeout(timeoutId);
					timeoutId = setTimeout(() => {
						func();
						lastExecTime = Date.now();
					}, delay - (currentTime - lastExecTime));
				}
			};
		};

		const throttledToggleVisibility = throttle(toggleVisibility, 100);

		window.addEventListener('scroll', throttledToggleVisibility);
		toggleVisibility();

		return () => {
			window.removeEventListener('scroll', throttledToggleVisibility);
		};
	}, []);

	const scrollToTop = () => {
		window.scrollTo({
			top: 0,
			behavior: 'smooth',
		});
	};

	if (!isVisible) {
		return null;
	}

	return (
		<Button
			onClick={scrollToTop}
			variant="secondary"
			size="icon"
			className="fixed bottom-8 right-8 z-50 shadow-lg transition-opacity duration-200 hover:shadow-xl"
			aria-label="Back to top"
		>
			<ChevronUpIcon className="h-5 w-5" />
		</Button>
	);
}