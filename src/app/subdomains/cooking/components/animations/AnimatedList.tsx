'use client';

import type { ReactNode } from 'react';
import React from 'react';

import { animations, stagger } from '../../utils/animations';

interface AnimatedListProps {
	children: ReactNode[];
	className?: string;
	staggerDelay?: number;
	as?: React.ElementType;
}

export const AnimatedList: React.FC<AnimatedListProps> = ({ children, className = '', staggerDelay = 50, as: Component = 'div' }) => (
	<Component className={className}>
		{children.map((child, index) => (
			<div key={index} className={animations.fadeIn} style={stagger(index, staggerDelay)}>
				{child}
			</div>
		))}
	</Component>
);
