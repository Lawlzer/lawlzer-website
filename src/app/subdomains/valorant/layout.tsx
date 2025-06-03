import type { Metadata } from 'next';
import type React from 'react';

export const metadata: Metadata = {
	title: 'Valorant Lineups',
	description: 'Browse and learn Valorant agent lineups (primarily KillJoy/Gekko) for various maps.',
};

export default function ValorantLayout({ children }: { children: React.ReactNode }): React.JSX.Element {
	return children as React.JSX.Element; // Simple layout wrapper
}
