import {
  InfiniteData,
  useInfiniteQuery as libUseInfiniteQuery,
  QueryFunction,
  QueryKey,
  UseInfiniteQueryOptions,
  UseInfiniteQueryResult,
} from '@tanstack/react-query'

import { ErrorResponse } from './types'

export const useInfiniteQuery = <T, TPageParam>({
  queryKey,
  queryFn,
  options,
}: {
  queryKey: QueryKey
  queryFn: QueryFunction<T, QueryKey, TPageParam | undefined>
  options: Omit<
    UseInfiniteQueryOptions<
      T,
      ErrorResponse,
      InfiniteData<T, TPageParam | undefined>,
      QueryKey,
      TPageParam | undefined
    >,
    'queryKey' | 'queryFn'
  >
}): UseInfiniteQueryResult<InfiniteData<T, TPageParam | undefined>, ErrorResponse> => {
  return libUseInfiniteQuery<
    T,
    ErrorResponse,
    InfiniteData<T, TPageParam | undefined>,
    QueryKey,
    TPageParam | undefined
  >({ queryKey, queryFn, ...options })
}
