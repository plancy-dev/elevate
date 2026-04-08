"use client";

/**
 * Root error boundary for the App Router. Keeps a valid client module for
 * Next.js built-in global-error handling (avoids occasional Turbopack HMR
 * "module factory is not available" noise in development).
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-background font-sans text-foreground antialiased">
        <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-6">
          <h1 className="text-lg font-medium text-text-primary">
            Something went wrong
          </h1>
          <p className="max-w-md text-center text-sm text-text-tertiary">
            {error.message}
          </p>
          <button
            type="button"
            onClick={() => reset()}
            className="rounded-lg border border-border-subtle bg-layer-01 px-4 py-2 text-sm text-text-secondary hover:bg-layer-02"
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
