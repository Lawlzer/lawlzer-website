import type { Metadata } from 'next';
import React from 'react';

export const metadata: Metadata = {
	title: 'Valorant Lineups',
	description: 'Browse and learn Valorant agent lineups (primarily KillJoy/Gekko) for various maps.',
};

export default function ValorantLayout({ children }: { children: React.ReactNode }): React.JSX.Element {
	return <>{children}</>; // Simple layout wrapper
}
