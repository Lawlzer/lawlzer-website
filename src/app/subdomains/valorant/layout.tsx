import React from 'react';
import '~/styles/globals.css';

export const metadata = {
	title: 'Valorant Subdomain - Lawlzer',
	description: 'Valorant subdomain for Lawlzer website',
};

export default function ValorantLayout({ children }: { children: React.ReactNode }): React.JSX.Element {
	return (
		<html lang='en'>
			<body>
				<main>{children}</main>
			</body>
		</html>
	);
}
