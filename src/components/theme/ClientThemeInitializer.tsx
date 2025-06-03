'use client';

import dynamic from 'next/dynamic';
import React from 'react';

// Dynamically import the actual ThemeInitializer with SSR disabled
const ThemeInitializer = dynamic(async () => import('./ThemeInitializer').then((mod) => mod.ThemeInitializer), {
	ssr: false,
	// Optional: Add a loading component if needed while the initializer loads
	// loading: () => <p>Loading theme...</p>,
});

// This client component simply renders the dynamically imported ThemeInitializer
export const ClientThemeInitializer = (): React.ReactNode => <ThemeInitializer />;
