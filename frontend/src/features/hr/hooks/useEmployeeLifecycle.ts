import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  employeeService,
  OfficialContractRequest,
} from "@/services/employeeService";

export function useConvertToOfficial() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      employeeId,
      payload,
    }: {
      employeeId: number;
      payload: OfficialContractRequest;
    }) => employeeService.convertToOfficial(employeeId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employees"] });
    },
  });
}
