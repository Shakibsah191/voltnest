import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState, type ReactNode } from 'react';
import { ApiError, SERVER_WAKING } from '@/shared/api-client';

export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60_000, // catalogue data is fresh for a minute
            // Cold start (free hosting sleeps): keep trying for ~30s. Other errors: retry once.
            retry: (failureCount, error) => {
              if (error instanceof ApiError && (error.code === SERVER_WAKING || error.status === 0)) {
                return failureCount < 5;
              }
              return failureCount < 1;
            },
            retryDelay: (attempt) => Math.min(2000 * 2 ** attempt, 10_000),
            refetchOnWindowFocus: false,
          },
        },
      }),
  );

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
