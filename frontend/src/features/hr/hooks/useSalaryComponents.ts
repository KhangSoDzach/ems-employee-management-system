import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  salaryComponentApi,
  type SalaryComponentPayload,
} from "@/services/salaryComponentApi";

export const SALARY_COMPONENTS_QUERY_KEY = "salary-components";

export function useSalaryComponents() {
  return useQuery({
    queryKey: [SALARY_COMPONENTS_QUERY_KEY],
    queryFn: () => salaryComponentApi.getAll(),
  });
}

export function useCreateSalaryComponent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: SalaryComponentPayload) =>
      salaryComponentApi.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [SALARY_COMPONENTS_QUERY_KEY],
      });
    },
  });
}

export function useUpdateSalaryComponent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: number;
      payload: SalaryComponentPayload;
    }) => salaryComponentApi.update(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [SALARY_COMPONENTS_QUERY_KEY],
      });
    },
  });
}
