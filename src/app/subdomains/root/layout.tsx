import type { Metadata } from 'next';

export const metadata: Metadata = {
	title: 'Kevin Porter | Home',
	description: "My (Kevin Porter)'s website. I'm a self-taught software engineer obsessed with optimization.",
};

export default function RootLayout({ children }: { children: React.ReactNode }): React.ReactNode {
	return children;
}
