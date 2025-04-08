import React from 'react';

export default function ValorantPage(): React.JSX.Element {
	return (
		<div
			style={{
				display: 'flex',
				minHeight: '100vh',
				flexDirection: 'column',
				alignItems: 'center',
				justifyContent: 'center',
				background: 'linear-gradient(to bottom, #fa4454, #1f1f1f)',
				color: 'white',
			}}
		>
			<h1 style={{ fontSize: '3rem', fontWeight: 'bold' }}>Valorant Subdomain</h1>
			<p style={{ marginTop: '1rem', fontSize: '1.25rem' }}>This is the Valorant subdomain</p>
		</div>
	);
}
