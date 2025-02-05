import {
  MutationFunction,
  MutationKey,
  UseMutationOptions,
  useMutation as libUseMutation,
} from "@tanstack/react-query";
import { ErrorResponse } from "./types";

export const useMutation = <TResponse, TPayload>({
  mutationKey,
  mutationFn,
  options,
}: {
  mutationKey: MutationKey;
  mutationFn: MutationFunction<TResponse, TPayload>;
  options?: Omit<
    UseMutationOptions<TResponse, ErrorResponse, TPayload>,
    "mutationKey" | "mutationFn"
  >;
}) => {
  return libUseMutation<TResponse, ErrorResponse, TPayload>({
    mutationKey,
    mutationFn,
    ...options,
  });
};
