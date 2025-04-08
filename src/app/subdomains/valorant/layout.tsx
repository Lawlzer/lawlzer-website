import React from 'react';

export const metadata = {
	title: 'Valorant Subdomain - Lawlzer',
	description: 'Valorant subdomain for Lawlzer website',
};

export default function ValorantLayout({ children }: { children: React.ReactNode }): React.JSX.Element {
	return <div className='valorant-layout'>{children}</div>;
}
