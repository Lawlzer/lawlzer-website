import type { ReactNode } from 'react';

export default function CookingLayout({ children }: { children: ReactNode }) {
	return (
		<div className='min-h-screen bg-background'>
			<div className='container mx-auto px-4 py-8'>{children}</div>
		</div>
	);
}
