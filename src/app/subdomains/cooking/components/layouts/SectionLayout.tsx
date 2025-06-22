'use client';

import type { ReactNode } from 'react';

interface SectionLayoutProps {
	children: ReactNode;
	title?: string;
	description?: string;
	actions?: ReactNode;
	className?: string;
	contentClassName?: string;
}

export const SectionLayout: React.FC<SectionLayoutProps> = ({ children, title, description, actions, className = '', contentClassName = '' }) => (
	<section className={`space-y-4 ${className}`}>
		{((title !== undefined && title !== null && title !== '') || (description !== undefined && description !== null && description !== '') || actions !== undefined) && (
			<div className='flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between'>
				<div className='space-y-1'>
					{title !== undefined && title !== null && title !== '' && <h2 className='text-xl font-semibold tracking-tight'>{title}</h2>}
					{description !== undefined && description !== null && description !== '' && <p className='text-sm text-muted-foreground'>{description}</p>}
				</div>
				{actions !== undefined && <div className='flex items-center gap-2 self-start sm:self-auto'>{actions}</div>}
			</div>
		)}
		<div className={contentClassName}>{children}</div>
	</section>
);
