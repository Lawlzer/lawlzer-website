import React, { useState } from 'react';

// Mock component for testing - simplified version of AuthButton.tsx
const AuthButtonMock = ({ initialState = 'loading', userData = null }: { initialState?: 'authenticated' | 'loading' | 'unauthenticated'; userData?: { name: string | null; email: string | null } | null }): React.JSX.Element => {
	const [state, setState] = useState(initialState);
	const [user, setUser] = useState(userData);

	// For testing purposes, expose a method to simulate fetch completion
	React.useEffect(() => {
		// Simulate fetch completion
		if (initialState === 'loading') {
			setTimeout(() => {
				setState(userData ? 'authenticated' : 'unauthenticated');
				setUser(userData);
			}, 10);
		}
	}, [initialState, userData]);

	if (state === 'loading') {
		return <div className='bg-muted h-10 w-20 animate-pulse rounded' data-testid='auth-loading' />;
	}

	if (state === 'authenticated' && user) {
		return (
			<div className='relative inline-block text-left'>
				<div>
					<button className='bg-secondary text-secondary-foreground inline-flex w-full justify-center rounded-md px-4 py-2 text-sm font-medium' type='button'>
						{user.name ?? user.email ?? 'Account'}
					</button>
				</div>
				<div data-testid='menuitems' style={{ display: 'none' }}>
					<button type='button' onClick={() => (window.location.href = '/api/auth/logout')}>
						Logout
					</button>
				</div>
			</div>
		);
	}

	// Not authenticated
	return (
		<div className='relative inline-block text-left'>
			<div>
				<button className='bg-primary text-primary-foreground inline-flex w-full justify-center rounded-md px-4 py-2 text-sm font-medium' type='button'>
					Login / Register
				</button>
			</div>
			<div data-testid='menuitems' style={{ display: 'none' }}>
				<button type='button' onClick={() => (window.location.href = '/api/auth/login?provider=google')}>
					Sign in with Google
				</button>
				<button type='button' onClick={() => (window.location.href = '/api/auth/login?provider=discord')}>
					Sign in with Discord
				</button>
				<button type='button' onClick={() => (window.location.href = '/api/auth/login?provider=github')}>
					Sign in with GitHub
				</button>
			</div>
		</div>
	);
};

export default AuthButtonMock;
