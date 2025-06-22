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

export const SectionLayout: React.FC<SectionLayoutProps> = ({
  children,
  title,
  description,
  actions,
  className = '',
  contentClassName = '',
}) => {
  return (
    <section className={`space-y-4 ${className}`}>
      {(title || description || actions) && (
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            {title && (
              <h2 className="text-xl font-semibold tracking-tight">{title}</h2>
            )}
            {description && (
              <p className="text-sm text-muted-foreground">{description}</p>
            )}
          </div>
          {actions && (
            <div className="flex items-center gap-2 self-start sm:self-auto">
              {actions}
            </div>
          )}
        </div>
      )}
      <div className={contentClassName}>{children}</div>
    </section>
  );
};
