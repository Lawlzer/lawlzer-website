'use client';

import { useCallback, useEffect } from 'react';

interface KeyboardShortcut {
	key: string;
	ctrlKey?: boolean;
	altKey?: boolean;
	shiftKey?: boolean;
	handler: () => void;
	description: string;
}

export function useKeyboardShortcuts(shortcuts: KeyboardShortcut[]) {
	const handleKeyDown = useCallback(
		(event: KeyboardEvent) => {
			// Don't trigger shortcuts when typing in inputs/textareas
			const target = event.target as HTMLElement;
			if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
				return;
			}

			for (const shortcut of shortcuts) {
				const keyMatch = event.key.toLowerCase() === shortcut.key.toLowerCase();
				const ctrlMatch = shortcut.ctrlKey ? event.ctrlKey || event.metaKey : true;
				const altMatch = shortcut.altKey ? event.altKey : true;
				const shiftMatch = shortcut.shiftKey ? event.shiftKey : true;

				if (keyMatch && ctrlMatch && altMatch && shiftMatch) {
					event.preventDefault();
					shortcut.handler();
					break;
				}
			}
		},
		[shortcuts]
	);

	useEffect(() => {
		window.addEventListener('keydown', handleKeyDown);
		return () => {
			window.removeEventListener('keydown', handleKeyDown);
		};
	}, [handleKeyDown]);

	return shortcuts;
}

// Keyboard shortcuts help dialog hook
export function useKeyboardShortcutsHelp() {
	const toggleHelp = useCallback(() => {
		const event = new CustomEvent('toggle-keyboard-shortcuts-help');
		window.dispatchEvent(event);
	}, []);

	return { toggleHelp };
}
