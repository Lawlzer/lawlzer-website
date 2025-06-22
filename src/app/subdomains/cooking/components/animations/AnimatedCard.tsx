'use client';

import type { ReactNode } from 'react';

import { animations } from '../../utils/animations';

interface AnimatedCardProps {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
  delay?: number;
}

export const AnimatedCard: React.FC<AnimatedCardProps> = ({
  children,
  className = '',
  onClick,
  delay = 0,
}) => {
  return (
    <div
      className={`
        ${animations.fadeIn}
        ${animations.card}
        ${onClick ? 'cursor-pointer ' + animations.click.scale : ''}
        ${className}
      `}
      style={{ animationDelay: `${delay}ms` }}
      onClick={onClick}
    >
      {children}
    </div>
  );
};
