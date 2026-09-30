import { QueryClient } from '@tanstack/react-query'

/** Shared so auth login/logout can wipe stale booking caches. */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 60_000, retry: 1, refetchOnWindowFocus: false },
  },
})
