import type { Metadata } from 'next';
import React from 'react';

// Add metadata export for SEO
export const metadata: Metadata = {
	title: 'Color Theme Customizer',
	description: 'Customize the color theme of the website. Adjust page background, text colors, primary/secondary colors, and borders. Choose from predefined palettes or create your own.',
};

export default function ColorsLayout({ children }: { children: React.ReactNode }): React.JSX.Element {
	return <>{children}</>; // Simple layout wrapper
}
