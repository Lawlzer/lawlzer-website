import React, { useState } from 'react';

// Mock component for testing - simplified version of AuthButton.tsx
export default function AuthButtonMock({ initialState = 'loading', userData = null }: { initialState?: 'authenticated' | 'loading' | 'unauthenticated'; userData?: { name: string | null; email: string | null } | null }): React.JSX.Element {
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
		return <div data-testid='auth-loading' className='animate-pulse bg-muted rounded w-20 h-10'></div>;
	}

	if (state === 'authenticated' && user) {
		return (
			<div className='relative inline-block text-left'>
				<div>
					<button className='inline-flex w-full justify-center rounded-md bg-secondary px-4 py-2 text-sm font-medium text-secondary-foreground'>{user.name ?? user.email ?? 'Account'}</button>
				</div>
				<div data-testid='menuitems' style={{ display: 'none' }}>
					<button onClick={() => (window.location.href = '/api/auth/logout')}>Logout</button>
				</div>
			</div>
		);
	}

	// Not authenticated
	return (
		<div className='relative inline-block text-left'>
			<div>
				<button className='inline-flex w-full justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground'>Login / Register</button>
			</div>
			<div data-testid='menuitems' style={{ display: 'none' }}>
				<button onClick={() => (window.location.href = '/api/auth/login?provider=google')}>Sign in with Google</button>
				<button onClick={() => (window.location.href = '/api/auth/login?provider=discord')}>Sign in with Discord</button>
				<button onClick={() => (window.location.href = '/api/auth/login?provider=github')}>Sign in with GitHub</button>
			</div>
		</div>
	);
}
