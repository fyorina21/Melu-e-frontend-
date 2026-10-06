import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getFormConfig, saveFormConfig, resetFormToDefault } from '../api/institutionalAdminApi';
import type { FormConfig } from '../types';

export const FORM_CONFIG_QUERY_KEY = 'formConfig';

export function useFormConfigQuery(formName: string) {
  return useQuery({
    queryKey: [FORM_CONFIG_QUERY_KEY, formName],
    queryFn: async () => {
      const res = await getFormConfig(formName);
      return res.data;
    },
    enabled: Boolean(formName),
  });
}

export function useSaveFormConfigMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      formName,
      config,
    }: {
      formName: string;
      config: FormConfig | Record<string, unknown>;
    }) => {
      const res = await saveFormConfig(formName, config);
      return res.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: [FORM_CONFIG_QUERY_KEY, variables.formName],
      });
    },
  });
}

export function useResetFormConfigMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (formName: string) => {
      const res = await resetFormToDefault(formName);
      return res.data;
    },
    onSuccess: (_, formName) => {
      queryClient.invalidateQueries({
        queryKey: [FORM_CONFIG_QUERY_KEY, formName],
      });
    },
  });
}
