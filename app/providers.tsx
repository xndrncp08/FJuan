"use client";

/**
 * app/providers.tsx
 *
 * Client-side providers wrapper.
 * Named export { Providers } to match the original layout import.
 */

import { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

export function Providers({ children }: { children: React.ReactNode }) {
  // useState ensures each browser session gets its own QueryClient
  // rather than sharing one instance across server requests
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 10 * 60 * 1000, // 10 minutes — matches server cache
            retry: 1,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}