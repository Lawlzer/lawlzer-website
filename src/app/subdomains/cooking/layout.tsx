import type { ReactNode } from 'react';
import '~/app/subdomains/cooking/styles/cooking-theme.css';

export default function CookingLayout({ children }: { children: ReactNode }) {
	return (
		<div className='cooking-theme min-h-screen bg-gradient-to-br from-cooking-neutral-50 via-white to-cooking-primary/5'>
			<div className='bg-grid-pattern'>
				{children}
			</div>
		</div>
	);
}
