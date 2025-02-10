import { QueryClientProvider as LibQueryClientProvider, QueryClient } from '@tanstack/react-query'
import { FC, PropsWithChildren } from 'react'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 3,
      staleTime: Infinity,
      gcTime: Infinity,
      refetchInterval: false,
      refetchOnMount: 'always',
    },
  },
})

export const MercoaQueryClientProvider: FC<PropsWithChildren> = ({ children }) => {
  return <LibQueryClientProvider client={queryClient}>{children}</LibQueryClientProvider>
}
