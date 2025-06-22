'use client';

import { QueryErrorResetBoundary } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { ErrorBoundary } from 'react-error-boundary';

import { Button } from '../ui/Button';

interface QueryErrorBoundaryProps {
  children: ReactNode;
  fallbackMessage?: string;
}

function ErrorFallback({
  error,
  resetErrorBoundary,
  message,
}: {
  error: Error;
  resetErrorBoundary: () => void;
  message?: string;
}) {
  return (
    <div className="flex min-h-[200px] flex-col items-center justify-center space-y-4 p-6 text-center">
      <div className="space-y-2">
        <h2 className="text-lg font-semibold text-red-600">
          {message || 'Something went wrong'}
        </h2>
        <p className="text-sm text-muted-foreground">
          {error.message || 'An unexpected error occurred'}
        </p>
      </div>
      <Button onClick={resetErrorBoundary} variant="secondary" size="sm">
        Try again
      </Button>
    </div>
  );
}

export const QueryErrorBoundary: React.FC<QueryErrorBoundaryProps> = ({
  children,
  fallbackMessage,
}) => {
  return (
    <QueryErrorResetBoundary>
      {({ reset }) => (
        <ErrorBoundary
          onReset={reset}
          fallbackRender={({ error, resetErrorBoundary }) => (
            <ErrorFallback
              error={error}
              resetErrorBoundary={resetErrorBoundary}
              message={fallbackMessage}
            />
          )}
        >
          {children}
        </ErrorBoundary>
      )}
    </QueryErrorResetBoundary>
  );
};
