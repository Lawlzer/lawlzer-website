import { useState, useEffect } from 'react';

// --- Custom Hook for Media Query ---
export const useMediaQuery = (query: string): boolean => {
	const [matches, setMatches] = useState(false);

	useEffect(() => {
		// Check window existence for SSR safety
		if (typeof window === 'undefined') {
			return;
		}

		const media = window.matchMedia(query);
		const updateMatches = (): void => {
			setMatches(media.matches);
		};

		// Initial check
		updateMatches();

		// Listener for changes
		// Use addEventListener/removeEventListener for modern compatibility
		try {
			media.addEventListener('change', updateMatches);
		} catch (e) {
			// Fallback for older browsers
			media.addListener(updateMatches);
		}

		return () => {
			try {
				media.removeEventListener('change', updateMatches);
			} catch (e) {
				// Fallback for older browsers
				media.removeListener(updateMatches);
			}
		};
	}, [query]); // Depend only on query

	return matches;
};
