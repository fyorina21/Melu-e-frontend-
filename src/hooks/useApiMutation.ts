import {
  useMutation,
  type UseMutationOptions,
  type UseMutationResult,
} from '@tanstack/react-query';
import { useToast } from '../context/ToastContext';
import { toApiError, type ApiError } from '../api/http/errors';

export interface UseApiMutationConfig<TData, TVariables, TContext = unknown> extends Omit<
  UseMutationOptions<TData, ApiError, TVariables, TContext>,
  'mutationFn'
> {
  mutationFn: (variables: TVariables) => Promise<TData>;
  successMessage?: string | ((data: TData, variables: TVariables) => string);
  errorMessage?: string | ((error: ApiError, variables: TVariables) => string);
  showSuccessToast?: boolean;
  showErrorToast?: boolean;
}

/**
 * Enhanced wrapper around TanStack React Query's `useMutation`.
 * Automatically standardizes errors via `toApiError` and dispatches
 * user-friendly toast notifications via `ToastContext`.
 */
export function useApiMutation<TData = unknown, TVariables = void, TContext = unknown>(
  config: UseApiMutationConfig<TData, TVariables, TContext>,
): UseMutationResult<TData, ApiError, TVariables, TContext> {
  const {
    mutationFn,
    successMessage,
    errorMessage,
    showSuccessToast = !!successMessage,
    showErrorToast = true,
    onSuccess,
    onError,
    ...restConfig
  } = config;

  const { showToast } = useToast();

  return useMutation<TData, ApiError, TVariables, TContext>({
    mutationFn: async (variables: TVariables) => {
      try {
        return await mutationFn(variables);
      } catch (err: unknown) {
        throw toApiError(err);
      }
    },
    onSuccess: (...args) => {
      if (showSuccessToast) {
        const [data, variables] = args;
        const msg =
          typeof successMessage === 'function'
            ? successMessage(data, variables)
            : successMessage || 'Action completed successfully';
        showToast(msg, 'success');
      }
      onSuccess?.(...args);
    },
    onError: (...args) => {
      if (showErrorToast) {
        const [error, variables] = args;
        const msg =
          typeof errorMessage === 'function'
            ? errorMessage(error, variables)
            : errorMessage || error?.message || 'An error occurred. Please try again.';
        showToast(msg, 'error');
      }
      onError?.(...args);
    },
    ...restConfig,
  });
}

export default useApiMutation;
