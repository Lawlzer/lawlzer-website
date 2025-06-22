'use client';

import React from 'react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body>
        <div className="flex min-h-screen items-center justify-center p-4">
          <div className="max-w-md w-full rounded-lg bg-white p-8 shadow-lg">
            <h2 className="mb-4 text-2xl font-bold">Something went wrong!</h2>
            <p className="mb-4 text-gray-600">
              An error occurred in the application.
            </p>
            <button
              onClick={reset}
              className="rounded bg-blue-500 px-4 py-2 text-white hover:bg-blue-600"
            >
              Try again
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
