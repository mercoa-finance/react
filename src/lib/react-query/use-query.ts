import {
  QueryFunction,
  QueryKey,
  UseQueryOptions,
  useQuery as libUseQuery,
} from "@tanstack/react-query";

import { ErrorResponse } from "./types";

export const useQuery = <T>({
  queryKey,
  queryFn,
  options,
}: {
  queryKey: QueryKey;
  queryFn: QueryFunction<T>;
  options?: Omit<UseQueryOptions<T, ErrorResponse, T>, "queryKey" | "queryFn">;
}) => {
  return libUseQuery<T, ErrorResponse>({
    queryKey,
    queryFn,
    ...options,
  });
};
